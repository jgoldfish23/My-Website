// Jamo's game predictions for the college football hub (2026-10-21). Stored in the site's KV store.
// GET  /api/picks?game=<hub game id>   -> { pick } or { pick: null }
// GET  /api/picks?list=1               -> { picks: [{ game, pick, savedAt, kick }] } (every saved prediction)
// POST /api/picks { game, pin, kick, pick } -> saves the prediction. The first save sets the PIN (4-8 digits); later
//      saves must use the same one. Saves are refused after kickoff ("kick", ms since 1970, from the hub's schedule).
import { clientIp, originOk, rateLimit, tooMany } from "./_guard.js";

const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const PIN_KEY = "picks:pin";
const PICK = "picks:g:";

function cors(request) {
  const origin = request.headers.get("origin");
  try { if (origin && ALLOWED_ORIGINS.includes(new URL(origin).hostname)) return { "access-control-allow-origin": origin, "vary": "origin", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET, POST, OPTIONS" }; } catch (e) {}
  return {};
}
function json(request, body, status) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { "content-type": "application/json", "cache-control": "no-store", ...cors(request) } });
}
async function hash(pin) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("jsh-picks|" + pin));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const gameOk = (g) => typeof g === "string" && /^[a-z0-9-]{8,90}$/.test(g);

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  const kv = env.WEDDING_KV;
  if (!kv) return json(request, { error: "storage unavailable" }, 503);
  const url = new URL(request.url);
  if (request.method === "GET") {
    if (url.searchParams.get("list")) {
      const keys = await kv.list({ prefix: PICK });
      const out = [];
      for (const k of keys.keys.slice(0, 60)) { const v = await kv.get(k.name); if (v) { try { out.push({ game: k.name.slice(PICK.length), ...JSON.parse(v) }); } catch (e) {} } }
      return json(request, { picks: out, pinSet: !!(await kv.get(PIN_KEY)) });
    }
    const game = url.searchParams.get("game") || "";
    if (!gameOk(game)) return json(request, { error: "game id" }, 400);
    const v = await kv.get(PICK + game);
    return json(request, { pick: v ? JSON.parse(v) : null, pinSet: !!(await kv.get(PIN_KEY)) });
  }
  if (request.method !== "POST") return json(request, { error: "method" }, 405);
  if (!originOk(request)) return json(request, { error: "forbidden" }, 403);
  const rl = await rateLimit(env, "picks", clientIp(request), 40, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter, "Too many saves - try again later.");
  const text = await request.text();
  if (text.length > 6000) return json(request, { error: "too big" }, 413);
  let body; try { body = JSON.parse(text); } catch (e) { return json(request, { error: "bad json" }, 400); }
  const { game, pin, kick, pick } = body || {};
  if (!gameOk(game)) return json(request, { error: "game id" }, 400);
  if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) return json(request, { error: "pin", message: "Use a PIN of 4 to 8 digits." }, 400);
  if (!pick || typeof pick !== "object") return json(request, { error: "pick" }, 400);
  if (typeof kick === "number" && Date.now() > kick) return json(request, { error: "locked", message: "Predictions lock at kickoff." }, 409);
  const h = await hash(pin);
  const saved = await kv.get(PIN_KEY);
  if (!saved) await kv.put(PIN_KEY, h);
  else if (saved !== h) return json(request, { error: "pin", message: "That PIN doesn't match." }, 403);
  const rec = { pick, savedAt: Date.now(), kick: typeof kick === "number" ? kick : null };
  await kv.put(PICK + game, JSON.stringify(rec));
  return json(request, { ok: true, savedAt: rec.savedAt, firstPin: !saved });
}
