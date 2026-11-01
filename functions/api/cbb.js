// Live college basketball scores for /cbb (CBB Hardwood, 2026-11-01): a read-only, edge-cached proxy of ESPN's public feeds,
// the same shape as the NBA relay (nba.js).
// GET /api/cbb/scoreboard?date=YYYYMMDD -> slimmed events for one day (Division I, every game)
// GET /api/cbb/game?event=ID            -> a slim box score: each team's line and every player's row
const ESPN = "https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";
const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const TTL = 30; // seconds at the edge; the page polls every 30 s during games
const FINAL_TTL = 600; // a finished game's box score only changes if a stat is corrected

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  try {
    if (origin && ALLOWED_ORIGINS.includes(new URL(origin).hostname)) return { "access-control-allow-origin": origin, "vary": "origin" };
  } catch (e) { /* malformed origin header: no CORS */ }
  return {};
}
function json(request, body, status, ttl) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { "content-type": "application/json", "cache-control": ttl ? "public, max-age=" + ttl : "no-store", ...corsHeaders(request) } });
}
function slimEvent(e) {
  const cp = e.competitions[0];
  const h = cp.competitors.find((x) => x.homeAway === "home");
  const a = cp.competitors.find((x) => x.homeAway === "away");
  const st = e.status || {};
  const team = (c) => ({ id: c.team.id, ab: c.team.abbreviation, s: c.score });
  return {
    id: e.id,
    st: (st.type && st.type.name || "").replace("STATUS_", "").replace("FINAL_OT", "FINAL"),
    det: st.type && st.type.shortDetail || "",
    per: st.period || 0,
    away: team(a),
    home: team(h),
  };
}
function slimSummary(j) {
  const bs = j.boxscore || {};
  const line = {};
  (bs.teams || []).forEach((t) => {
    const s = {}; (t.statistics || []).forEach((x) => { s[x.name] = x.displayValue; });
    line[t.team.id] = [s.fieldGoalsMade && s.fieldGoalsAttempted ? "FG " + s.fieldGoalsMade + "-" + s.fieldGoalsAttempted : "", s.threePointFieldGoalsMade ? "3PT " + s.threePointFieldGoalsMade + "-" + s.threePointFieldGoalsAttempted : "", s.totalRebounds ? s.totalRebounds + " reb" : "", s.turnovers ? s.turnovers + " TO" : ""].filter(Boolean).join(" · ");
  });
  const teams = (bs.players || []).map((pt) => {
    const g = (pt.statistics || [])[0] || {};
    const players = (g.athletes || []).filter((x) => x.athlete && x.stats && x.stats.length && !x.didNotPlay)
      .map((x) => ({ n: x.athlete.displayName, pos: x.athlete.position && x.athlete.position.abbreviation || "", st: x.starter ? 1 : 0, s: x.stats }));
    return { id: pt.team.id, name: pt.team.shortDisplayName || pt.team.displayName || "", line: line[pt.team.id] || "", labels: g.labels || g.names || [], players };
  });
  const hdr = j.header && j.header.competitions && j.header.competitions[0] || {};
  const st = hdr.status || {};
  return { t: Date.now(), st: (st.type && st.type.name || "").replace("STATUS_", "").replace("FINAL_OT", "FINAL"), det: st.type && st.type.shortDetail || "", teams };
}
async function upstream(url, ttl) {
  // ESPN refuses server calls on one of its two hosts and has switched which one, so try both (as nba.js does)
  for (const u of [url.replace("://site.web.api.espn.com/", "://site.api.espn.com/"), url]) {
    const res = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 (compatible; djgolding.com live scores)", "accept": "application/json" }, cf: { cacheTtl: ttl || TTL, cacheEverything: true } });
    if (res.ok) return res.json();
    if (res.status !== 403) throw new Error("upstream " + res.status);
  }
  throw new Error("upstream 403");
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const p = url.pathname;
  try {
    if (p === "/api/cbb/scoreboard") {
      const date = url.searchParams.get("date") || "";
      if (!/^20\d{6}$/.test(date)) return json(request, { error: "date must be YYYYMMDD" }, 400);
      const j = await upstream(ESPN + "/scoreboard?dates=" + date + "&groups=50&limit=500");
      return json(request, { t: Date.now(), date, games: (j.events || []).map(slimEvent) }, 200, TTL);
    }
    if (p === "/api/cbb/game") {
      const id = url.searchParams.get("event") || "";
      if (!/^\d{6,12}$/.test(id)) return json(request, { error: "event id" }, 400);
      const s = slimSummary(await upstream(ESPN + "/summary?event=" + id));
      return json(request, s, 200, s.st === "FINAL" ? FINAL_TTL : TTL);
    }
    return json(request, { error: "not found" }, 404);
  } catch (e) {
    return json(request, { error: String(e.message || e) }, 502);
  }
}
