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

async function handleRsvp(request, env) {
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
      partySize: Math.min(Math.max(parseInt(body.partySize, 10) || 1, 1), 10),
      note: clean(body.note, 1000),
      ts: new Date().toISOString(),
    };
    const id = `rsvp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await env.WEDDING_KV.put(id, JSON.stringify(entry));
    return json({ ok: true });
  }
  if (request.method === "GET") {
    if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);
    const list = await env.WEDDING_KV.list({ prefix: "rsvp_" });
    const items = (
      await Promise.all(
        list.keys.map((k) =>
          env.WEDDING_KV.get(k.name).then((v) => (v ? { id: k.name, ...JSON.parse(v) } : null))
        )
      )
    ).filter(Boolean);
    items.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return json(items);
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
  async fetch(request, env) {
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

    if (pathname === "/api/rsvp") return handleRsvp(request, env);
    if (pathname === "/api/record") return handleRecord(request, env);

    return env.ASSETS.fetch(request);
  },
};
