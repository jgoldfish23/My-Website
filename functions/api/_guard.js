// Shared abuse guards for the public API routes.
//
// /api/chat spends a real Anthropic key and /api/rsvp pings our phones, so
// both need a ceiling. The origin check turns away casual embedding; the
// rate limit is what actually stops a script. Counters live in KV, which is
// eventually consistent, so a determined attacker can squeeze a few extra
// calls through a window boundary — fine here, since the daily cap still
// bounds the worst case.

const ALLOWED_HOSTS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];

export function clientIp(request) {
  return request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";
}

const hostOf = (value) => {
  try {
    return new URL(value).hostname;
  } catch (e) {
    return null;
  }
};

// Browsers are inconsistent about sending Origin on same-origin POSTs
// (Safari notably), so fall back to Referer and let a request through when
// neither header is present. A header that IS present has to check out —
// including one we can't parse, which no real browser sends.
export function originOk(request) {
  const origin = request.headers.get("origin");
  if (origin) return ALLOWED_HOSTS.includes(hostOf(origin));

  const referer = request.headers.get("referer");
  if (referer) return ALLOWED_HOSTS.includes(hostOf(referer));

  return true; // neither header sent; the rate limit is the backstop
}

// Fixed-window counter. Returns { ok, retryAfter } so callers can tell the
// guest how long to wait.
export async function rateLimit(env, bucket, id, limit, windowSec) {
  if (!env.WEDDING_KV) return { ok: true, retryAfter: 0 };
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSec);
  const key = `rl_${bucket}_${id}_${window}`;

  let used = 0;
  try {
    used = parseInt(await env.WEDDING_KV.get(key), 10) || 0;
  } catch (e) {
    return { ok: true, retryAfter: 0 }; // never let KV trouble block a guest
  }

  if (used >= limit) {
    return { ok: false, retryAfter: (window + 1) * windowSec - now };
  }

  try {
    // TTL doubles the window so a counter outlives its own boundary and
    // can't be reset early by a stale read.
    await env.WEDDING_KV.put(key, String(used + 1), { expirationTtl: windowSec * 2 });
  } catch (e) {
    /* the read above is the real gate; a failed write just loses one tick */
  }
  return { ok: true, retryAfter: 0 };
}

export function tooMany(retryAfter, message) {
  return new Response(JSON.stringify({ error: "rate_limited", message }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "retry-after": String(Math.max(retryAfter, 1)),
    },
  });
}

export function forbidden() {
  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
