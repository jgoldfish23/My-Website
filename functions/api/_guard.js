// Shared guards for the API routes: same-site origin check and a small KV-backed rate limiter.
const ALLOWED_HOSTS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];

export function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
}

const hostOf = (value) => {
  try { return new URL(value).hostname; } catch (e) { return null; }
};

// Browser requests carry an Origin (or at least a Referer); only accept ours.
export function originOk(request) {
  const origin = request.headers.get("origin");
  if (origin) return ALLOWED_HOSTS.includes(hostOf(origin));
  const referer = request.headers.get("referer");
  if (referer) return ALLOWED_HOSTS.includes(hostOf(referer));
  return true;
}

// Fixed-window counter in KV: `limit` hits per `windowSec` for a given bucket + id.
export async function rateLimit(env, bucket, id, limit, windowSec) {
  if (!env.WEDDING_KV) return { ok: true, retryAfter: 0 };
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSec);
  const key = `rl_${bucket}_${id}_${window}`;
  let used = 0;
  try { used = parseInt(await env.WEDDING_KV.get(key), 10) || 0; } catch (e) { return { ok: true, retryAfter: 0 }; }
  if (used >= limit) return { ok: false, retryAfter: (window + 1) * windowSec - now };
  try { await env.WEDDING_KV.put(key, String(used + 1), { expirationTtl: windowSec * 2 }); } catch (e) { /* counting is best-effort */ }
  return { ok: true, retryAfter: 0 };
}

export function tooMany(retryAfter, message) {
  return new Response(JSON.stringify({ error: "rate_limited", message }), {
    status: 429,
    headers: { "content-type": "application/json", "cache-control": "no-store", "retry-after": String(Math.max(retryAfter, 1)) },
  });
}

export function forbidden() {
  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
