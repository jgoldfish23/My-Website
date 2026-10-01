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
    wp: slimWP(j, hdr),
  };
}

// ESPN's play-by-play win probability, placed on a game clock for the chart on game pages.
// p = [[seconds elapsed, home win %]] (overtime periods get 300 s each, plays spread evenly),
// sw = the biggest single-play swings (d = change in home win %), sc = [[point index, "h"|"a"]] for scores.
function slimWP(j, hdr) {
  const wp = j.winprobability || [];
  if (wp.length < 2) return null;
  const plays = {};
  const dr = j.drives || {};
  (dr.previous || []).concat(dr.current ? [dr.current] : []).forEach((d) => (d.plays || []).forEach((p) => { plays[p.id] = p; }));
  const ot = {};
  const at = (p) => {
    const per = (p.period && p.period.number) || 1;
    if (per > 4) { ot[per] = (ot[per] || 0) + 1; return 3600 + (per - 5) * 300 + Math.min(290, ot[per] * 12); }
    const m = /^(\d+):(\d+)/.exec((p.clock && p.clock.displayValue) || "");
    const left = m ? Math.min(900, +m[1] * 60 + +m[2]) : 0;
    return (per - 1) * 900 + (900 - left);
  };
  let t = 0;
  const p = [], meta = [], idx = {};
  wp.forEach((w, i) => {
    const pl = plays[w.playId];
    if (pl) t = Math.max(t, at(pl));
    p.push([t, Math.round((w.homeWinPercentage || 0) * 1000) / 10]);
    meta.push(pl);
    idx[w.playId] = i;
  });
  // ESPN's feed has one-play glitches (a 15-20 point dip that snaps straight back); flatten them
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i][1] - p[i - 1][1], b = p[i + 1][1] - p[i][1];
    if (Math.abs(a) >= 6 && Math.abs(b) >= 6 && Math.sign(a) !== Math.sign(b) && Math.abs(p[i + 1][1] - p[i - 1][1]) < Math.min(Math.abs(a), Math.abs(b)) * 0.5) {
      p[i][1] = Math.round((p[i - 1][1] + p[i + 1][1]) * 5) / 10;
    }
  }
  const sw = [];
  for (let i = 1; i < p.length; i++) {
    const pl = meta[i];
    const d = Math.round((p[i][1] - p[i - 1][1]) * 10) / 10;
    if (!pl || Math.abs(d) < 8) continue;
    if (/timeout|end of|end period|coin toss/i.test((pl.type && pl.type.text) || "") || /^\s*timeout/i.test(pl.text || "")) continue;
    sw.push({ i, d, per: (pl.period && pl.period.number) || 0, clk: (pl.clock && pl.clock.displayValue) || "", txt: String(pl.text || "").slice(0, 170) });
  }
  sw.sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
  const home = ((hdr.competitors || []).find((c) => c.homeAway === "home") || {}).id;
  const sc = (j.scoringPlays || [])
    .filter((s) => idx[s.id] != null)
    .map((s) => [idx[s.id], s.team && s.team.id === home ? "h" : "a"]);
  return { p, sw: sw.slice(0, 3), sc };
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
