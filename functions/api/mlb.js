// Live MLB scores for the Jamo Sports Hub front door and /mlb (2026-10-10, Dodgers postseason): a read-only,
// edge-cached proxy of ESPN's public scoreboard, the same shape as the cfb/nfl/nba proxies.
// GET /api/mlb/scoreboard?date=YYYYMMDD -> slimmed events for one day
// site.web.api answers requests from Cloudflare's network; site.api refuses them (403)
const ESPN = "https://site.web.api.espn.com/apis/site/v2/sports/baseball/mlb";
const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const TTL = 30; // seconds at the edge; the pages poll every 30s during games

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
  const team = (c) => ({ id: c.team.id, ab: c.team.abbreviation, s: c.score, h: c.hits, e: c.errors });
  const ser = cp.series || {};
  return {
    id: e.id,
    date: etDate(cp.date),
    st: (st.type && st.type.name || "").replace("STATUS_", ""),
    det: st.type && st.type.shortDetail || "",   // "Top 5th", "Final/10"
    per: st.period || 0,                          // the inning
    clk: "",
    away: team(a),
    home: team(h),
    outs: sit.outs != null ? sit.outs : null,
    bases: sit.onFirst || sit.onSecond || sit.onThird ? [sit.onFirst ? 1 : 0, sit.onSecond ? 1 : 0, sit.onThird ? 1 : 0] : null,
    last: sit.lastPlay && sit.lastPlay.text ? String(sit.lastPlay.text).slice(0, 180) : "",
    note: (cp.notes && cp.notes[0] && cp.notes[0].headline) || "",
    series: ser.summary || "",
  };
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
    if (p === "/api/mlb/scoreboard") {
      const date = url.searchParams.get("date") || "";
      if (!/^20\d{6}$/.test(date)) return json(request, { error: "date must be YYYYMMDD" }, 400);
      const j = await upstream(ESPN + "/scoreboard?dates=" + date + "&limit=50");
      return json(request, { t: Date.now(), date, games: (j.events || []).map(slimEvent) }, 200, TTL);
    }
    return json(request, { error: "not found" }, 404);
  } catch (e) {
    return json(request, { error: String(e.message || e) }, 502);
  }
}
