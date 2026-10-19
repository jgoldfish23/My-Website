// The Jamo Sports Hub BottomLine (2026-10-19): one small, edge-cached feed for the ESPN-style ticker along the bottom of
// every hub page. GET /api/bottomline -> today's games for college football (AP Top 25 plus BYU and Weber State), the NFL,
// NBA, NHL and MLB, trimmed to what the ticker shows, plus a few ESPN headlines per league.
// Read-only proxy of ESPN's public feeds (browsers cannot call them directly); same host fallback as the other routes.
const BASE = "https://site.api.espn.com/apis/site/v2/sports/";
const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const TTL = 30;
// ESPN only answers server calls that name dates: football gets this week (three days back, five ahead), the nightly
// leagues get yesterday and today, all on the US Eastern calendar
const ymd = (t) => new Date(t - (5 - (isDst(t) ? 1 : 0)) * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
function isDst(t) { const y = new Date(t).getUTCFullYear(); const sun = (m, n) => { const d = new Date(Date.UTC(y, m, 1)); return 1 + (7 - d.getUTCDay()) % 7 + 7 * (n - 1); }; return t >= Date.UTC(y, 2, sun(2, 2), 7) && t < Date.UTC(y, 10, sun(10, 1), 6); }
function feeds() { const now = Date.now(), D = 864e5; const wk = ymd(now - 3 * D) + "-" + ymd(now + 5 * D), nt = ymd(now - D) + "-" + ymd(now);
  return [
    { lg: "cfb", path: "football/college-football", q: "?dates=" + wk + "&limit=120" },
    { lg: "cfbx", path: "football/college-football", q: "?dates=" + wk + "&groups=81&limit=120" }, // FCS, for Weber State only
    { lg: "nfl", path: "football/nfl", q: "?dates=" + wk + "&limit=40" },
    { lg: "nba", path: "basketball/nba", q: "?dates=" + nt + "&limit=40" },
    { lg: "nhl", path: "hockey/nhl", q: "?dates=" + nt + "&limit=40" },
    { lg: "mlb", path: "baseball/mlb", q: "?dates=" + nt + "&limit=40" },
  ]; }
const NEWS = [["cfb", "football/college-football", 4], ["nfl", "football/nfl", 4], ["nba", "basketball/nba", 4], ["mlb", "baseball/mlb", 3], ["nhl", "hockey/nhl", 3]];
const KEEP_FCS = new Set(["2692"]); // Weber State

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  try { if (origin && ALLOWED_ORIGINS.includes(new URL(origin).hostname)) return { "access-control-allow-origin": origin, "vary": "origin" }; } catch (e) {}
  return {};
}
function json(request, body, status, ttl) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { "content-type": "application/json", "cache-control": ttl ? "public, max-age=" + ttl : "no-store", ...corsHeaders(request) } });
}
async function upstream(url) {
  for (const u of [url, url.replace("://site.api.espn.com/", "://site.web.api.espn.com/")]) {
    const res = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 (compatible; djgolding.com live scores)", "accept": "application/json" }, cf: { cacheTtl: TTL, cacheEverything: true } });
    if (res.ok) return res.json();
    if (res.status !== 403) throw new Error("upstream " + res.status);
  }
  throw new Error("upstream 403");
}
function side(c) {
  const t = c.team || {};
  const rk = c.curatedRank && c.curatedRank.current;
  return { id: t.id || "", ab: t.abbreviation || "", n: t.shortDisplayName || t.location || t.name || "", s: c.score != null ? String(c.score) : "", rk: rk && rk <= 25 ? rk : 0 };
}
function slim(lg, e) {
  const cp = (e.competitions || [])[0] || {};
  const cs = cp.competitors || [];
  const h = cs.find((x) => x.homeAway === "home") || cs[1] || {}, a = cs.find((x) => x.homeAway === "away") || cs[0] || {};
  const st = (e.status && e.status.type) || {};
  const tv = ((cp.broadcasts || [])[0] || {}).names || [];
  const note = ((cp.notes || [])[0] || {}).headline || "";
  return { id: e.id, lg, date: cp.date || e.date, st: st.state || "pre", det: st.shortDetail || "", a: side(a), h: side(h), tv: tv[0] || "", note: note.slice(0, 60), neutral: !!cp.neutralSite };
}
export async function onRequestGet({ request }) {
  const errs = [];
  try {
    const boards = await Promise.all(feeds().map((f) => upstream(BASE + f.path + "/scoreboard" + f.q).then((j) => ({ f, j })).catch((e) => { errs.push(f.lg + ": " + (e.message || e)); return { f, j: null }; })));
    const games = [];
    boards.forEach(({ f, j }) => {
      if (!j) return;
      (j.events || []).forEach((e) => {
        const g = slim(f.lg === "cfbx" ? "cfb" : f.lg, e);
        if (f.lg === "cfbx" && !KEEP_FCS.has(g.a.id) && !KEEP_FCS.has(g.h.id)) return;
        if (!games.some((x) => x.id === g.id)) games.push(g);
      });
    });
    const news = [];
    const lists = await Promise.all(NEWS.map(([lg, path, n]) => upstream(BASE + path + "/news?limit=" + n).then((j) => ({ lg, j })).catch((e) => { errs.push("news " + lg + ": " + (e.message || e)); return { lg, j: null }; })));
    lists.forEach(({ lg, j }) => {
      ((j && j.articles) || []).forEach((x) => {
        const href = x.links && x.links.web && x.links.web.href;
        if (x.headline && href) news.push({ lg, t: String(x.headline).slice(0, 140), u: href, d: x.published || "" });
      });
    });
    return json(request, { t: Date.now(), games, news, ...(errs.length ? { errs } : {}) }, 200, errs.length ? 0 : TTL);
  } catch (e) {
    return json(request, { error: String(e.message || e) }, 502);
  }
}
