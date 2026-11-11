// Web Push straight from this worker to a phone's or computer's own notification service (Apple, Google, Mozilla),
// with nothing in between: no relay app, no account, no shared quota. Used for RSVP alerts (worker.js).
//
// Two standards, both done with the built-in Web Crypto:
//   RFC 8291  the message is encrypted so only the subscribed browser can read it (aes128gcm)
//   RFC 8292  "VAPID": a signed note proving the push comes from this site
//
// A subscription is what the browser hands the page when someone allows notifications:
//   { endpoint: "https://…push service…", keys: { p256dh: "<browser public key>", auth: "<shared secret>" } }

const enc = new TextEncoder();

export const b64u = (buf) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const ub64u = (str) => {
  const s = String(str).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
};

// The site's own signing keys, made once and kept in KV. publicKey is what the page passes to the browser.
export async function makeVapidKeys() {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const publicKey = b64u(await crypto.subtle.exportKey("raw", pair.publicKey));
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return { publicKey, privateJwk };
}

// The Authorization header for one push service (the signed note is only good for that service, for 12 hours).
export async function vapidAuth(endpoint, vapid, subject) {
  const key = await crypto.subtle.importKey("jwk", vapid.privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + claims));
  return "vapid t=" + head + "." + claims + "." + b64u(sig) + ", k=" + vapid.publicKey;
}

async function hkdf(salt, ikm, info, bytes) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8));
}

// Encrypt one message for one subscription. `fixed` (a salt and a sender key pair) exists only so the published
// example in RFC 8291 can be reproduced exactly in a test; real sends make fresh ones every time.
export async function encryptPayload(sub, plain, fixed) {
  const uaPublic = ub64u(sub.keys.p256dh);
  const authSecret = ub64u(sub.keys.auth);
  const salt = (fixed && fixed.salt) || crypto.getRandomValues(new Uint8Array(16));
  const pair = (fixed && fixed.pair) || (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]));
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, pair.privateKey, 256));

  const ikm = await hkdf(authSecret, shared, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  // one record: the text, then the 0x02 "last record" marker
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, concat(plain, new Uint8Array([2]))));

  // header: salt (16) | record size (4, big-endian) | key length (1) | sender public key (65)
  return concat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPublic.length]), asPublic, sealed);
}

// Send one push. Answers { ok, status, gone, why }; `gone` means the subscription no longer exists (the app was
// removed or notifications were switched off), so it should be dropped.
export async function sendPush(sub, message, vapid, subject) {
  try {
    const body = await encryptPayload(sub, enc.encode(JSON.stringify(message)));
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        authorization: await vapidAuth(sub.endpoint, vapid, subject),
        "content-encoding": "aes128gcm",
        "content-type": "application/octet-stream",
        ttl: "86400",
        urgency: "high",
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    let why = "";
    if (!res.ok) {
      try { why = (await res.text()).slice(0, 200); } catch (e) { /* the status says enough */ }
    }
    return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410, why };
  } catch (e) {
    return { ok: false, status: 0, gone: false, why: String((e && e.message) || e).slice(0, 200) };
  }
}

// Only accept subscriptions that point at a real push service, so this can't be used to make the worker call
// arbitrary addresses.
const PUSH_HOSTS = /(^|\.)(push\.apple\.com|googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/i;

export function cleanSubscription(raw) {
  try {
    const u = new URL(raw.endpoint);
    if (u.protocol !== "https:" || !PUSH_HOSTS.test(u.hostname)) return null;
    const p256dh = String(raw.keys.p256dh), auth = String(raw.keys.auth);
    if (ub64u(p256dh).length !== 65 || ub64u(auth).length < 16) return null;
    return { endpoint: u.toString(), keys: { p256dh, auth } };
  } catch (e) {
    return null;
  }
}
