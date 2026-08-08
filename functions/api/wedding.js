// Shared storage for the wedding planning dashboard.
// Requires a KV namespace bound as WEDDING_KV and an environment
// variable WEDDING_PASS (the shared passcode) in Cloudflare Pages settings.

const STATE_KEY = "wedding_dashboard_state";

function authorized(request, env) {
  const pass = request.headers.get("x-wedding-pass");
  return Boolean(env.WEDDING_PASS) && pass === env.WEDDING_PASS;
}

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return new Response("Unauthorized", { status: 401 });
  if (!env.WEDDING_KV) return new Response("KV not configured", { status: 503 });
  const value = await env.WEDDING_KV.get(STATE_KEY);
  return new Response(JSON.stringify({ value }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function onRequestPut({ request, env }) {
  if (!authorized(request, env)) return new Response("Unauthorized", { status: 401 });
  if (!env.WEDDING_KV) return new Response("KV not configured", { status: 503 });
  const body = await request.text();
  if (body.length > 1_000_000) return new Response("Too large", { status: 413 });
  await env.WEDDING_KV.put(STATE_KEY, body);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
