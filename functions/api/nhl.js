// Live NHL scores for /nhl and the Jamo Sports Hub front door (2026-10-15): a read-only, edge-cached proxy of the NHL's
// public API (api-web.nhle.com), slimmed to the same shape as the cfb/nfl/nba/mlb proxies.
// GET /api/nhl/score?date=YYYY-MM-DD (or YYYYMMDD) -> the day's games: state, period, clock, score, shots
// GET /api/nhl/game?id=GAME_ID                     -> one game: line score, scoring summary, three stars, team stats
const NHL = "https://api-web.nhle.com/v1";
const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const TTL = 20; // seconds at the edge; pages poll every 30s during games
const FINAL_TTL = 600;

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
async function upstream(url, ttl) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; djgolding.com live scores)", "accept": "application/json" }, cf: { cacheTtl: ttl || TTL, cacheEverything: true } });
  if (!res.ok) throw new Error("upstream " + res.status);
  return res.json();
}
const STATE = (s) => (/^(FINAL|OFF)$/.test(s) ? "FINAL" : /^(LIVE|CRIT)$/.test(s) ? "IN_PROGRESS" : /^(PPD)$/.test(s) ? "POSTPONED" : "SCHEDULED");
const ord = (n) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : n + "th");
function perLabel(pd) { if (!pd) return ""; if (pd.periodType === "SO") return "SO"; if (pd.periodType === "OT") return pd.number > 4 ? (pd.number - 3) + "OT" : "OT"; return ord(pd.number); }
function detail(g) {
  const st = STATE(g.gameState), pd = g.periodDescriptor || {}, clk = g.clock || {};
  if (st === "FINAL") return "Final" + (pd.periodType === "OT" ? "/OT" : pd.periodType === "SO" ? "/SO" : "");
  if (st === "IN_PROGRESS") return clk.inIntermission ? perLabel(pd) + " Intermission" : (perLabel(pd) + " " + (clk.timeRemaining || "")).trim();
  return g.gameScheduleState === "PPD" ? "Postponed" : "";
}
function slimGame(g) {
  const team = (t) => ({ ab: t.abbrev, s: t.score, sog: t.sog });
  return { id: g.id, date: g.gameDate, st: STATE(g.gameState), det: detail(g), per: (g.periodDescriptor || {}).number || 0, clk: (g.clock || {}).timeRemaining || "",
    intermission: !!(g.clock || {}).inIntermission, away: team(g.awayTeam || {}), home: team(g.homeTeam || {}) };
}
function slimDetail(l, r) {
  const nm = (x) => (x && (x.default || "")) || "";
  const scoring = ((l.summary || {}).scoring || []).map((p) => ({ per: perLabel(p.periodDescriptor), goals: (p.goals || []).map((g) => ({
    t: g.timeInPeriod, team: (g.teamAbbrev && nm(g.teamAbbrev)) || "", who: (nm(g.firstName) + " " + nm(g.lastName)).trim(), n: g.goalsToDate, str: g.strength, mod: g.goalModifier,
    ast: (g.assists || []).map((a) => (nm(a.firstName) + " " + nm(a.lastName)).trim()), a: g.awayScore, h: g.homeScore, clip: g.highlightClipSharingUrl || "" })) }));
  const stars = ((l.summary || {}).threeStars || []).map((s) => ({ star: s.star, who: nm(s.name) || (nm(s.firstName) + " " + nm(s.lastName)).trim(), team: s.teamAbbrev, pos: s.position, line: [s.goals != null ? s.goals + "G" : "", s.assists != null ? s.assists + "A" : "", s.savePctg != null ? "SV% " + Number(s.savePctg).toFixed(3) : ""].filter(Boolean).join(" ") }));
  const lines = ((r.linescore || {}).byPeriod || []).map((p) => ({ per: perLabel(p.periodDescriptor), a: p.away, h: p.home }));
  const stats = (r.teamGameStats || []).map((s) => ({ k: s.category, a: s.awayValue, h: s.homeValue }));
  return { id: l.id, st: STATE(l.gameState), det: detail(l), venue: nm(l.venue), away: { ab: l.awayTeam && l.awayTeam.abbrev, s: l.awayTeam && l.awayTeam.score, sog: l.awayTeam && l.awayTeam.sog },
    home: { ab: l.homeTeam && l.homeTeam.abbrev, s: l.homeTeam && l.homeTeam.score, sog: l.homeTeam && l.homeTeam.sog }, lines, totals: (r.linescore || {}).totals || null, scoring, stars, stats,
    recap: ((r.gameVideo || {}).threeMinRecap) ? "https://www.nhl.com/video/" + r.gameVideo.threeMinRecap : "" };
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url), p = url.pathname;
  try {
    if (p === "/api/nhl/score") {
      let d = url.searchParams.get("date") || ""; if (/^\d{8}$/.test(d)) d = d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6);
      if (!/^20\d\d-\d\d-\d\d$/.test(d)) return json(request, { error: "date must be YYYY-MM-DD" }, 400);
      const j = await upstream(NHL + "/score/" + d);
      return json(request, { t: Date.now(), date: d, games: (j.games || []).map(slimGame) }, 200, TTL);
    }
    if (p === "/api/nhl/game") {
      const id = url.searchParams.get("id") || ""; if (!/^20\d{8}$/.test(id)) return json(request, { error: "game id" }, 400);
      const [l, r] = await Promise.all([upstream(NHL + "/gamecenter/" + id + "/landing"), upstream(NHL + "/gamecenter/" + id + "/right-rail").catch(() => ({}))]);
      const s = slimDetail(l, r);
      return json(request, s, 200, s.st === "FINAL" ? FINAL_TTL : TTL);
    }
    return json(request, { error: "not found" }, 404);
  } catch (e) {
    return json(request, { error: String(e.message || e) }, 502);
  }
}
