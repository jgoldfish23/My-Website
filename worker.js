import * as chat from "./functions/api/chat.js";
import * as wedding from "./functions/api/wedding.js";
import * as cfb from "./functions/api/cfb.js";
import * as nfl from "./functions/api/nfl.js";
import * as nba from "./functions/api/nba.js";
import * as cbb from "./functions/api/cbb.js";
import * as bottomline from "./functions/api/bottomline.js";
import * as picks from "./functions/api/picks.js";
import * as ask from "./functions/api/ask.js";
import * as alerts from "./functions/api/alerts.js";
import { clientIp, originOk, rateLimit, tooMany, forbidden } from "./functions/api/_guard.js";

const RECORD_KEY = "record_entries";

// Chat goes to a paid API, so keep it same-site and rate-limited.
const CHAT_PER_IP = 10;      // per 5 minutes
const CHAT_WINDOW = 300;
const CHAT_PER_DAY = 500;    // site-wide
const RSVP_PER_IP = 5;       // per hour
const RSVP_WINDOW = 3600;

function authorized(request, env) {
  const pass = request.headers.get("x-wedding-pass");
  return Boolean(env.WEDDING_PASS) && typeof pass === "string" &&
    pass.toUpperCase() === env.WEDDING_PASS.toUpperCase();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const GUEST_CAP = 40;

// RSVP phone alerts are switched on from the planner (/plan), so no Cloudflare login is needed. The setting lives in
// KV under a key outside the "rsvp_" prefix that listRsvps() scans.
const ALERTS_KEY = "wedding:rsvp_alerts";
const NTFY = "https://ntfy.sh/";
const TOPIC_OK = /^[A-Za-z0-9_-]{8,64}$/;

async function alertPrefs(env) {
  try {
    const raw = await env.WEDDING_KV.get(ALERTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Where RSVP pushes go: the channel set up in the planner; failing that, a NTFY_TOPIC secret if one is ever added.
// Turning alerts off in the planner means off, even if a secret exists.
async function rsvpTopic(env) {
  const p = await alertPrefs(env);
  if (p) return p.on && TOPIC_OK.test(p.topic || "") ? p.topic : "";
  return TOPIC_OK.test(env.NTFY_TOPIC || "") ? env.NTFY_TOPIC : "";
}

// Send one push. Answers { ok, status, why } so the planner's test button can say what went wrong.
async function pushNtfyDetail(topic, title, body, tags) {
  try {
    const res = await fetch(NTFY + topic, {
      method: "POST",
      headers: {
        // HTTP headers must be latin-1; strip anything else out of the title
        Title: String(title).replace(/[^\x20-\x7E]/g, "").slice(0, 80) || "New RSVP",
        Priority: "default",
        Tags: tags,
        Click: "https://djgolding.com/plan/",
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    let why = "";
    if (!res.ok) {
      try { why = (await res.text()).slice(0, 200); } catch (e) { /* the status says enough */ }
    }
    return { ok: res.ok, status: res.status, why };
  } catch (e) {
    return { ok: false, status: 0, why: String((e && e.message) || e).slice(0, 200) };
  }
}

// true = ntfy accepted the push
async function pushNtfy(topic, title, body, tags) {
  return (await pushNtfyDetail(topic, title, body, tags)).ok;
}

async function listRsvps(env) {
  const list = await env.WEDDING_KV.list({ prefix: "rsvp_" });
  const items = (
    await Promise.all(
      list.keys.map((k) =>
        env.WEDDING_KV.get(k.name).then((v) => (v ? { id: k.name, ...JSON.parse(v) } : null))
      )
    )
  ).filter(Boolean);
  items.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return items;
}

// Tell Jameson and Dawsyn an RSVP landed. Never let a notification
// failure break the guest's submission.
async function notifyRsvp(entry, env) {
  const who = entry.attending ? "is coming" : "can't make it";

  let tally = "";
  try {
    const all = await listRsvps(env);
    const heads = all
      .filter((r) => r.attending)
      .reduce((s, r) => s + (r.partySize || 1), 0);
    tally = `Running total: ${heads} of ${GUEST_CAP} seats · ${all.length} replies`;
  } catch (e) {
    /* totals are a nicety; skip them if KV hiccups */
  }

  // Push goes through a third party, so keep it to the headline —
  // no guest emails, no free-text notes. Details live in the planner.
  const pushBody = [
    `${entry.name} ${who} — party of ${entry.partySize}`,
    entry.note ? "They left a note — tap to read it in the planner" : "",
    tally,
  ].filter(Boolean).join("\n");

  // Email is a private channel, so it can carry everything.
  const mailBody = [
    `${entry.name} ${who} — party of ${entry.partySize}`,
    entry.guestNames ? `With: ${entry.guestNames}` : "",
    entry.email ? `Email: ${entry.email}` : "",
    entry.note ? `Note: ${entry.note}` : "",
    tally,
  ].filter(Boolean).join("\n");

  const jobs = [];

  const topic = await rsvpTopic(env);
  if (topic) {
    jobs.push(pushNtfy(topic, `RSVP: ${entry.name}`, pushBody, entry.attending ? "tada" : "pensive"));
  }

  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    jobs.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: env.NOTIFY_FROM || "onboarding@resend.dev",
          to: env.NOTIFY_EMAIL.split(",").map((s) => s.trim()).filter(Boolean),
          subject: `RSVP: ${entry.name} ${who}`,
          text: mailBody,
        }),
      })
    );
  }

  await Promise.allSettled(jobs);
}

async function handleRsvp(request, env, ctx) {
  if (request.method === "POST") {
    if (!originOk(request)) return forbidden();
    const mine = await rateLimit(env, "rsvp", clientIp(request), RSVP_PER_IP, RSVP_WINDOW);
    if (!mine.ok) return tooMany(mine.retryAfter, "You've already sent a few — text us if something's wrong.");
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "bad request" }, 400);
    if (body.website) return json({ ok: true }); // honeypot: pretend success
    const name = clean(body.name, 120);
    if (!name) return json({ error: "name required" }, 400);
    const entry = {
      name,
      email: clean(body.email, 200),
      attending: Boolean(body.attending),
      partySize: Math.min(Math.max(parseInt(body.partySize, 10) || 1, 1), 12),
      guestNames: clean(body.guestNames, 400),
      note: clean(body.note, 1000),
      ts: new Date().toISOString(),
    };
    const id = `rsvp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await env.WEDDING_KV.put(id, JSON.stringify(entry));
    const alert = notifyRsvp(entry, env).catch(() => {});
    if (ctx && ctx.waitUntil) ctx.waitUntil(alert);
    return json({ ok: true });
  }
  if (request.method === "PUT") {
    if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);
    const body = await request.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : "";
    if (!id.startsWith("rsvp_")) return json({ error: "bad id" }, 400);
    const raw = await env.WEDDING_KV.get(id);
    if (!raw) return json({ error: "not found" }, 404);
    const existing = JSON.parse(raw);
    if (body.partySize !== undefined) {
      existing.partySize = Math.min(Math.max(parseInt(body.partySize, 10) || 1, 1), 12);
    }
    if (body.attending !== undefined) existing.attending = Boolean(body.attending);
    if (body.guestNames !== undefined) existing.guestNames = clean(body.guestNames, 400);
    await env.WEDDING_KV.put(id, JSON.stringify(existing));
    return json({ ok: true, entry: { id, ...existing } });
  }
  if (request.method === "GET") {
    if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);
    return json(await listRsvps(env));
  }
  if (request.method === "DELETE") {
    if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);
    const body = await request.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : "";
    if (!id.startsWith("rsvp_")) return json({ error: "bad id" }, 400);
    await env.WEDDING_KV.delete(id);
    return json({ ok: true });
  }
  return json({ error: "method not allowed" }, 405);
}

// RSVP phone alerts, run from the planner. Everything here needs the wedding passcode.
//   GET                      -> { on, topic, source, since, email }
//   POST { action: "on" }    -> start alerts (makes a private channel name the first time)
//   POST { action: "off" }   -> stop alerts (keeps the channel name so turning them back on needs no phone setup)
//   POST { action: "test" }  -> send one test push
async function handleRsvpAlerts(request, env) {
  if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);

  const status = async () => {
    const p = await alertPrefs(env);
    const topic = await rsvpTopic(env);
    return {
      on: Boolean(topic),
      topic: p && TOPIC_OK.test(p.topic || "") ? p.topic : null,
      source: !topic ? "none" : p ? "planner" : "cloudflare",
      since: (p && p.since) || null,
      email: Boolean(env.RESEND_API_KEY && env.NOTIFY_EMAIL),
    };
  };

  if (request.method === "GET") return json(await status());
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);

  const body = await request.json().catch(() => null);
  const action = body && typeof body.action === "string" ? body.action : "";

  if (action === "on" || action === "off") {
    const p = (await alertPrefs(env)) || {};
    if (action === "on") {
      if (!TOPIC_OK.test(p.topic || "")) p.topic = "jd-rsvp-" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
      p.on = true;
      p.since = new Date().toISOString();
    } else {
      p.on = false;
    }
    await env.WEDDING_KV.put(ALERTS_KEY, JSON.stringify(p));
    // Answer from what was just saved: KV reads can lag a write by a few seconds.
    return json({
      on: Boolean(p.on && p.topic),
      topic: p.topic || null,
      source: p.on && p.topic ? "planner" : "none",
      since: p.since || null,
      email: Boolean(env.RESEND_API_KEY && env.NOTIFY_EMAIL),
    });
  }

  if (action === "test") {
    const topic = await rsvpTopic(env);
    if (!topic) return json({ error: "off", message: "Alerts are off, so there's nowhere to send a test." }, 409);
    const sent = await pushNtfyDetail(
      topic,
      "Test alert - it works",
      "This is what an RSVP alert looks like. You'll get one each time someone replies.",
      "white_check_mark"
    );
    return json(sent, sent.ok ? 200 : 502);
  }

  return json({ error: "bad action" }, 400);
}

async function handleRecord(request, env) {
  if (request.method === "GET") {
    const raw = await env.WEDDING_KV.get(RECORD_KEY);
    return json(raw ? JSON.parse(raw) : []);
  }
  if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);
  const raw = await env.WEDDING_KV.get(RECORD_KEY);
  const entries = raw ? JSON.parse(raw) : [];
  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "bad request" }, 400);
    const entry = {
      when: clean(body.when, 80),
      title: clean(body.title, 120),
      text: clean(body.text, 2000),
      ts: new Date().toISOString(),
    };
    if (!entry.title || !entry.text) return json({ error: "title and text required" }, 400);
    entries.push(entry);
    await env.WEDDING_KV.put(RECORD_KEY, JSON.stringify(entries));
    return json({ ok: true, count: entries.length });
  }
  if (request.method === "DELETE") {
    const body = await request.json().catch(() => null);
    const i = body ? parseInt(body.index, 10) : NaN;
    if (Number.isNaN(i) || i < 0 || i >= entries.length) return json({ error: "bad index" }, 400);
    entries.splice(i, 1);
    await env.WEDDING_KV.put(RECORD_KEY, JSON.stringify(entries));
    return json({ ok: true, count: entries.length });
  }
  return json({ error: "method not allowed" }, 405);
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/chat") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      if (!originOk(request)) return forbidden();
      const day = await rateLimit(env, "chat_day", "all", CHAT_PER_DAY, 86400);
      if (!day.ok) return tooMany(day.retryAfter, "The assistant has taken enough questions for today.");
      const mine = await rateLimit(env, "chat", clientIp(request), CHAT_PER_IP, CHAT_WINDOW);
      if (!mine.ok) return tooMany(mine.retryAfter, "That's a lot of questions! Give it a few minutes.");
      return chat.onRequestPost({ request, env });
    }

    if (pathname === "/api/wedding") {
      if (request.method === "GET") return wedding.onRequestGet({ request, env });
      if (request.method === "PUT") return wedding.onRequestPut({ request, env });
      return new Response("Method not allowed", { status: 405 });
    }

    if (pathname === "/api/rsvp") return handleRsvp(request, env, ctx);
    if (pathname === "/api/rsvp-alerts") return handleRsvpAlerts(request, env);
    if (pathname === "/api/record") return handleRecord(request, env);

    // Live college football scores for /cfb (read-only, edge-cached, same-site CORS)
    if (pathname.startsWith("/api/cfb/")) {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      return cfb.onRequestGet({ request, env, ctx });
    }

    // Live NFL scores for /nfl (same shape as the college proxy)
    if (pathname.startsWith("/api/nfl/")) {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      return nfl.onRequestGet({ request, env, ctx });
    }

    // Live NBA scores, box scores and player game logs for /nba (same shape as the other proxies)
    if (pathname.startsWith("/api/nba/")) {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      return nba.onRequestGet({ request, env, ctx });
    }

    // Live college basketball scores and box scores for /cbb (CBB Hardwood, 2026-11-01)
    if (pathname.startsWith("/api/cbb/")) {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      return cbb.onRequestGet({ request, env, ctx });
    }

    // Ask the Hub: the AI sports analyst on every hub page. Paid API, so ask.js checks the origin, caps the body at
    // 40 KB and rate-limits (30 an hour per visitor, 60 a day site-wide) after it has validated the question.
    if (pathname === "/api/ask") {
      if (request.method === "OPTIONS") return ask.onRequestOptions({ request });
      if (request.method === "GET") return ask.onRequestGet({ request, env });
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return ask.onRequestPost({ request, env, ctx });
    }

    // Game alerts for Jamo's teams: settings (GET public, POST with the predictions PIN), a test push and a dry run.
    // The checks themselves run from scheduled() at the bottom of this file.
    if (pathname === "/api/alerts" || pathname.startsWith("/api/alerts/")) return alerts.onRequest({ request, env, ctx });

    // Jamo's game predictions on the college hub (PIN-protected saves, KV storage)
    if (pathname === "/api/picks") return picks.onRequest({ request, env, ctx });

    // The BottomLine ticker on every hub page: today's games across the leagues and ESPN headlines (one cached feed)
    if (pathname === "/api/bottomline") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      return bottomline.onRequestGet({ request, env, ctx });
    }

    // The NHL hub and the MLB page were removed 2026-10-27 (the site covers CFB, the NFL and the NBA): old links go home
    if (/^\/(nhl|mlb)(\/|$)/i.test(pathname)) return Response.redirect(new URL("/sports/", request.url).toString(), 302);
    // The articles page was taken down 2026-10-28 (Jamo: "put a stop to the AI Generated Articles"): old links go home
    if (/^\/sports\/articles(\/|$)/i.test(pathname)) return Response.redirect(new URL("/sports/", request.url).toString(), 302);

    return env.ASSETS.fetch(request);
  },

  // Game alerts: one check every 2 minutes (wrangler.jsonc "triggers"). Alerts stay off until Jamo turns them on at
  // /sports/alerts/; while they are off a check is one KV read and nothing else.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(alerts.scheduled(env));
  },
};
