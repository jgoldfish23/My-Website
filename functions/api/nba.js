// Live NBA scores for /nba (NBA Courtside Zone): a read-only, edge-cached proxy of ESPN's public feeds.
// GET /api/nba/scoreboard?date=YYYYMMDD -> slimmed events for one day
// GET /api/nba/game?event=ID            -> slimmed summary: linescore, team + player box score, latest plays, win probability
// GET /api/nba/player?id=ATHLETE_ID     -> a player's game log for the current season (last season until it starts)
// site.web.api answers requests from Cloudflare's network; site.api refuses them (403)
const ESPN = "https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba";
const GAMELOG = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/";
const SEASON = 2027; // ESPN names a season by the year it ends: 2027 is 2026-27
const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const TTL = 30; // seconds at the edge; the page polls every 30s during games
const LOG_TTL = 900; // game logs change once a night

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  try {
    if (origin && ALLOWED_ORIGINS.includes(new URL(origin).hostname)) {
      return { "access-control-allow-origin": origin, "vary": "origin" };
    }
  } catch (e) { /* malformed origin header: no CORS */ }
  return {};
}

function json(request, body, status, ttl) {
  const headers = {
    "content-type": "application/json",
    "cache-control": ttl ? "public, max-age=" + ttl : "no-store",
    ...corsHeaders(request),
  };
  return new Response(JSON.stringify(body), { status: status || 200, headers });
}

// US Eastern calendar date for an ISO instant (DST: second Sunday in March to first Sunday in November)
function nthSunday(year, month, n) { const d = new Date(Date.UTC(year, month, 1)); const first = (7 - d.getUTCDay()) % 7; return 1 + first + 7 * (n - 1); }
function etDate(iso) {
  const t = new Date(iso); const y = t.getUTCFullYear();
  const start = Date.UTC(y, 2, nthSunday(y, 2, 2), 7), end = Date.UTC(y, 10, nthSunday(y, 10, 1), 6);
  const off = (t.getTime() >= start && t.getTime() < end) ? 4 : 5;
  return new Date(t.getTime() - off * 3600e3).toISOString().slice(0, 10);
}

function slimEvent(e) {
  const cp = e.competitions[0];
  const h = cp.competitors.find((x) => x.homeAway === "home");
  const a = cp.competitors.find((x) => x.homeAway === "away");
  const st = e.status || {};
  const sit = cp.situation || {};
  const o = (cp.odds || [])[0] || {};
  const team = (c) => ({ id: c.team.id, ab: c.team.abbreviation, s: c.score, ls: (c.linescores || []).map((l) => l.value) });
  return {
    id: e.id,
    date: etDate(cp.date),
    st: (st.type && st.type.name || "").replace("STATUS_", "").replace("FINAL_OT", "FINAL"),
    det: st.type && st.type.shortDetail || "",
    per: st.period || 0,
    clk: st.displayClock || "",
    away: team(a),
    home: team(h),
    last: sit.lastPlay && sit.lastPlay.text ? String(sit.lastPlay.text).slice(0, 180) : "",
    odds: o.details ? { det: o.details, ou: o.overUnder } : null,
  };
}

// team stat names -> the short keys the page's box scores use (same as the nightly data file)
const TK = { "fieldGoalsMade-fieldGoalsAttempted": "fg", fieldGoalPct: "fgp", "threePointFieldGoalsMade-threePointFieldGoalsAttempted": "tp", threePointFieldGoalPct: "tpp", "freeThrowsMade-freeThrowsAttempted": "ft", freeThrowPct: "ftp", totalRebounds: "reb", offensiveRebounds: "oreb", defensiveRebounds: "dreb", assists: "ast", steals: "stl", blocks: "blk", turnovers: "to", totalTurnovers: "tto", fouls: "pf", turnoverPoints: "topts", fastBreakPoints: "fbp", pointsInPaint: "pip", largestLead: "lead", leadChanges: "lc", leadPercentage: "leadpct", technicalFouls: "tech", flagrantFouls: "flag" };

function slimSummary(j) {
  const bs = j.boxscore || {};
  const haOf = {};
  const teams = (bs.teams || []).map((t) => {
    haOf[t.team.id] = t.homeAway;
    const stats = {};
    (t.statistics || []).forEach((s) => { if (TK[s.name]) stats[TK[s.name]] = s.displayValue; });
    return { id: t.team.id, ab: t.team.abbreviation, ha: t.homeAway, stats };
  });
  const players = (bs.players || []).map((pt) => {
    const g = (pt.statistics || [])[0] || {};
    const rows = [], dnp = [];
    (g.athletes || []).forEach((x) => {
      if (!x.athlete) return;
      if (x.didNotPlay || !(x.stats && x.stats.length)) { dnp.push({ n: x.athlete.displayName, why: String(x.reason || "").toLowerCase() }); return; }
      rows.push({ n: x.athlete.displayName, pos: x.athlete.position && x.athlete.position.abbreviation || "", id: x.athlete.id || "", st: x.starter ? 1 : 0, s: x.stats });
    });
    return { id: pt.team.id, ha: haOf[pt.team.id] || "", labels: g.labels || g.names || [], rows, dnp };
  });
  const hdr = j.header && j.header.competitions && j.header.competitions[0] || {};
  const st = hdr.status || {};
  const plays = (j.plays || []).slice(-6).map((p) => ({
    per: p.period && p.period.number,
    clk: p.clock && p.clock.displayValue,
    text: String(p.text || "").slice(0, 160),
    as: p.awayScore,
    hs: p.homeScore,
  }));
  const wp = j.winprobability || [];
  const step = Math.max(1, Math.floor(wp.length / 48));
  return {
    t: Date.now(),
    st: (st.type && st.type.name || "").replace("STATUS_", "").replace("FINAL_OT", "FINAL"),
    det: st.type && st.type.shortDetail || "",
    ls: (hdr.competitors || []).map((c) => ({ id: c.id, ha: c.homeAway, s: c.score, ls: (c.linescores || []).map((l) => l.displayValue) })),
    teams,
    players,
    plays,
    wp: wp.length ? Math.round((wp[wp.length - 1].homeWinPercentage || 0) * 100) : null,
    wpSeries: wp.length > 2 ? wp.filter((x, i) => i % step === 0 || i === wp.length - 1).map((x) => Math.round((x.homeWinPercentage || 0) * 100)) : null,
  };
}

function slimLog(j, season) {
  const labels = j.labels || [];
  const evs = j.events || {};
  const out = [];
  (j.seasonTypes || []).forEach((stype) => {
    if (/preseason/i.test(stype.displayName || "")) return;
    const post = /postseason/i.test(stype.displayName || "");
    (stype.categories || []).forEach((c) => (c.events || []).forEach((r) => {
      const e = evs[r.eventId]; if (!e) return;
      out.push({ id: r.eventId, date: etDate(e.gameDate), opp: e.opponent && e.opponent.abbreviation || "", home: e.atVs !== "@", res: e.gameResult || "", score: e.score || "", post, s: r.stats || [] });
    }));
  });
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  return { t: Date.now(), season, type: "regular season and playoffs", labels, events: out };
}

async function upstream(url, ttl) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; djgolding.com live scores)", "accept": "application/json" },
    cf: { cacheTtl: ttl || TTL, cacheEverything: true },
  });
  if (!res.ok) throw new Error("upstream " + res.status);
  return res.json();
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const p = url.pathname;
  try {
    if (p === "/api/nba/scoreboard") {
      const date = url.searchParams.get("date") || "";
      if (!/^20\d{6}$/.test(date)) return json(request, { error: "date must be YYYYMMDD" }, 400);
      const j = await upstream(ESPN + "/scoreboard?dates=" + date + "&limit=50");
      return json(request, { t: Date.now(), date, games: (j.events || []).map(slimEvent) }, 200, TTL);
    }
    if (p === "/api/nba/game") {
      const id = url.searchParams.get("event") || "";
      if (!/^\d{6,12}$/.test(id)) return json(request, { error: "event id" }, 400);
      const j = await upstream(ESPN + "/summary?event=" + id);
      return json(request, slimSummary(j), 200, TTL);
    }
    if (p === "/api/nba/player") {
      const id = url.searchParams.get("id") || "";
      if (!/^\d{3,12}$/.test(id)) return json(request, { error: "athlete id" }, 400);
      for (const season of [SEASON, SEASON - 1]) {
        const j = await upstream(GAMELOG + id + "/gamelog?season=" + season, LOG_TTL);
        const log = slimLog(j, season);
        if (log.events.length || season === SEASON - 1) return json(request, log, 200, LOG_TTL);
      }
    }
    return json(request, { error: "not found" }, 404);
  } catch (e) {
    return json(request, { error: String(e.message || e) }, 502);
  }
}
