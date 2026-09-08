// Live college football scores for djgolding.com/cfb.
// Proxies ESPN's public scoreboard/summary feeds (which browsers cannot call directly),
// trims them to what the page needs, and caches each upstream response at the edge for 30s.
// site.api.espn.com refuses server-side callers; the site.web.api host serves the same paths.
const ESPN = "https://site.web.api.espn.com/apis/site/v2/sports/football/college-football";
const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const TTL = 30;

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  try {
    if (origin && ALLOWED_ORIGINS.includes(new URL(origin).hostname)) {
      return { "access-control-allow-origin": origin, "vary": "origin" };
    }
  } catch (e) {}
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

// ESPN dates are UTC; the site keys games by their Eastern date.
function etDate(iso) {
  const off = iso >= "2026-11-01T06:00Z" ? 5 : 4;
  return new Date(new Date(iso).getTime() - off * 3600e3).toISOString().slice(0, 10);
}

function slimEvent(e) {
  const cp = e.competitions[0];
  const h = cp.competitors.find((x) => x.homeAway === "home");
  const a = cp.competitors.find((x) => x.homeAway === "away");
  const st = e.status || {};
  const sit = cp.situation || {};
  const o = (cp.odds || [])[0] || {};
  const team = (c) => ({ id: c.team.id, n: c.team.location, ab: c.team.abbreviation, s: c.score, ls: (c.linescores || []).map((l) => l.value) });
  return {
    id: e.id,
    date: etDate(cp.date),
    st: ((st.type && st.type.name) || "").replace("STATUS_", ""),
    det: (st.type && st.type.shortDetail) || "",
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
    id: t.team.id, n: t.team.location, ha: t.homeAway,
    stats: Object.fromEntries((t.statistics || []).map((s) => [s.name, s.displayValue])),
  }));
  const players = (bs.players || []).map((pt) => ({
    id: pt.team.id,
    cats: (pt.statistics || []).map((c) => ({
      name: c.name, labels: c.labels || [],
      rows: (c.athletes || [])
        .filter((a) => a.stats && a.stats.length && a.athlete && !/^\s*team\s*$/i.test(a.athlete.displayName || ""))
        .slice(0, c.name === "defensive" ? 14 : 8)
        .map((a) => ({ n: a.athlete.displayName, s: a.stats })),
    })),
  }));
  const scoring = (j.scoringPlays || []).slice(-14).map((s) => ({
    per: s.period && s.period.number, clk: s.clock && s.clock.displayValue, team: s.team && s.team.id,
    text: String(s.text || "").slice(0, 180), as: s.awayScore, hs: s.homeScore,
  }));
  const hdr = (j.header && j.header.competitions && j.header.competitions[0]) || {};
  const st = hdr.status || {};
  const cur = j.drives && j.drives.current;
  const drive = cur ? { desc: cur.description || "", plays: (cur.plays || []).slice(-4).map((p) => String(p.text || "").slice(0, 180)) } : null;
  return {
    t: Date.now(),
    st: ((st.type && st.type.name) || "").replace("STATUS_", ""),
    det: (st.type && st.type.shortDetail) || "",
    ls: (hdr.competitors || []).map((c) => ({ id: c.id, ha: c.homeAway, s: c.score, ls: (c.linescores || []).map((l) => l.displayValue) })),
    teams, players, scoring, drive,
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
    if (p === "/api/cfb/scoreboard") {
      const week = parseInt(url.searchParams.get("week"), 10);
      const groups = url.searchParams.get("groups") === "81" ? "81" : "80";
      if (!(week >= 1 && week <= 16)) return json(request, { error: "week must be 1-16" }, 400);
      const j = await upstream(ESPN + "/scoreboard?dates=2026&seasontype=2&week=" + week + "&groups=" + groups + "&limit=400");
      return json(request, { t: Date.now(), week, groups, games: (j.events || []).map(slimEvent) }, 200, true);
    }
    if (p === "/api/cfb/game") {
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
