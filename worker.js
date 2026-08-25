import * as chat from "./functions/api/chat.js";
import * as wedding from "./functions/api/wedding.js";

const RECORD_KEY = "record_entries";

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
  // no guest emails, no free-text notes. Details live on /admin.
  const pushBody = [
    `${entry.name} ${who} — party of ${entry.partySize}`,
    entry.note ? "They left a note — see djgolding.com/admin" : "",
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

  if (env.NTFY_TOPIC) {
    jobs.push(
      fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: {
          // HTTP headers must be latin-1; strip anything else out of the name
          Title: `RSVP: ${entry.name}`.replace(/[^\x20-\x7E]/g, "").slice(0, 80) || "New RSVP",
          Priority: "default",
          Tags: entry.attending ? "tada" : "pensive",
        },
        body: pushBody,
      })
    );
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
      if (request.method === "POST") return chat.onRequestPost({ request, env });
      return new Response("Method not allowed", { status: 405 });
    }

    if (pathname === "/api/wedding") {
      if (request.method === "GET") return wedding.onRequestGet({ request, env });
      if (request.method === "PUT") return wedding.onRequestPut({ request, env });
      return new Response("Method not allowed", { status: 405 });
    }

    if (pathname === "/api/rsvp") return handleRsvp(request, env, ctx);
    if (pathname === "/api/record") return handleRecord(request, env);

    return env.ASSETS.fetch(request);
  },
};
