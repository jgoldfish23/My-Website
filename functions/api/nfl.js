// Live NFL scores for /nfl (The Sons of San Diego): a read-only, edge-cached proxy of ESPN's public feeds.
// GET /api/nfl/scoreboard?week=N&stype=2|3  -> slimmed events for one week (2 = regular season, 3 = playoffs)
// GET /api/nfl/game?event=ID               -> slimmed summary: linescore, team + player stats, scoring, current drive
const ESPN = "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl";
const SEASON = 2026;
const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const TTL = 30; // seconds at the edge; the page polls every 30s during games

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  try {
    if (origin && ALLOWED_ORIGINS.includes(new URL(origin).hostname)) {
      return { "access-control-allow-origin": origin, "vary": "origin" };
    }
  } catch (e) { /* malformed origin header: no CORS */ }
  return {};
}

function json(request, body, status, cacheable) {
  const headers = {
    "content-type": "application/json",
    "cache-control": cacheable ? "public, max-age=" + TTL : "no-store",
    ...corsHeaders(request),
  };
  return new Response(JSON.stringify(body), { status: status || 200, headers });
}

// Eastern-time calendar date for an ISO instant (DST ends Nov 1, 2026; starts Mar 14, 2027)
function etDate(iso) {
  const off = (iso >= "2026-11-01T06:00Z" && iso < "2027-03-14T07:00Z") ? 5 : 4;
  return new Date(new Date(iso).getTime() - off * 3600e3).toISOString().slice(0, 10);
}

function slimEvent(e) {
  const cp = e.competitions[0];
  const h = cp.competitors.find((x) => x.homeAway === "home");
  const a = cp.competitors.find((x) => x.homeAway === "away");
  const st = e.status || {};
  const sit = cp.situation || {};
  const o = (cp.odds || [])[0] || {};
  const team = (c) => ({ id: c.team.id, ab: c.team.abbreviation, n: c.team.location, s: c.score, ls: (c.linescores || []).map((l) => l.value) });
  return {
    id: e.id,
    date: etDate(cp.date),
    st: (st.type && st.type.name || "").replace("STATUS_", ""),
    det: st.type && st.type.shortDetail || "",
    per: st.period || 0,
    clk: st.displayClock || "",
    away: team(a),
    home: team(h),
    pos: sit.possession || "",
    dd: sit.downDistanceText || "",
    last: sit.lastPlay && sit.lastPlay.text ? String(sit.lastPlay.text).slice(0, 180) : "",
    rz: !!sit.isRedZone,
    odds: o.details ? { det: o.details, ou: o.overUnder } : null,
  };
}

function slimSummary(j) {
  const bs = j.boxscore || {};
  const teams = (bs.teams || []).map((t) => ({
    id: t.team.id,
    ab: t.team.abbreviation,
    ha: t.homeAway,
    stats: Object.fromEntries((t.statistics || []).map((s) => [s.name, s.displayValue])),
  }));
  const players = (bs.players || []).map((pt) => ({
    id: pt.team.id,
    cats: (pt.statistics || []).map((c) => ({
      name: c.name,
      labels: c.labels || [],
      rows: (c.athletes || [])
        .filter((x) => x.stats && x.stats.length && x.athlete && !/^\s*team\s*$/i.test(x.athlete.displayName || ""))
        .slice(0, c.name === "defensive" ? 14 : 8)
        .map((x) => ({ n: x.athlete.displayName, pos: x.athlete.position && x.athlete.position.abbreviation || "", s: x.stats })),
    })),
  }));
  const scoring = (j.scoringPlays || []).slice(-16).map((s) => ({
    per: s.period && s.period.number,
    clk: s.clock && s.clock.displayValue,
    team: s.team && s.team.id,
    text: String(s.text || "").slice(0, 180),
    as: s.awayScore,
    hs: s.homeScore,
  }));
  const hdr = j.header && j.header.competitions && j.header.competitions[0] || {};
  const st = hdr.status || {};
  const cur = j.drives && j.drives.current;
  const drive = cur ? { desc: cur.description || "", plays: (cur.plays || []).slice(-4).map((p) => String(p.text || "").slice(0, 180)) } : null;
  const wp = j.winprobability || [];
  return {
    t: Date.now(),
    st: (st.type && st.type.name || "").replace("STATUS_", ""),
    det: st.type && st.type.shortDetail || "",
    ls: (hdr.competitors || []).map((c) => ({ id: c.id, ha: c.homeAway, s: c.score, ls: (c.linescores || []).map((l) => l.displayValue) })),
    teams,
    players,
    scoring,
    drive,
    wp: wp.length ? Math.round((wp[wp.length - 1].homeWinPercentage || 0) * 100) : null,
  };
}

async function upstream(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; djgolding.com live scores)", "accept": "application/json" },
    cf: { cacheTtl: TTL, cacheEverything: true },
  });
  if (!res.ok) throw new Error("upstream " + res.status);
  return res.json();
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const p = url.pathname;
  try {
    if (p === "/api/nfl/scoreboard") {
      const week = parseInt(url.searchParams.get("week"), 10);
      const stype = url.searchParams.get("stype") === "3" ? 3 : 2;
      if (!(week >= 1 && week <= 18)) return json(request, { error: "week must be 1-18" }, 400);
      const j = await upstream(ESPN + "/scoreboard?dates=" + SEASON + "&seasontype=" + stype + "&week=" + week + "&limit=100");
      return json(request, { t: Date.now(), week, stype, games: (j.events || []).map(slimEvent) }, 200, true);
    }
    if (p === "/api/nfl/game") {
      const id = url.searchParams.get("event") || "";
      if (!/^\d{6,12}$/.test(id)) return json(request, { error: "event id" }, 400);
      const j = await upstream(ESPN + "/summary?event=" + id);
      return json(request, slimSummary(j), 200, true);
    }
    return json(request, { error: "not found" }, 404);
  } catch (e) {
    return json(request, { error: String(e.message || e) }, 502);
  }
}
