// Game alerts for the Jamo Sports Hub (2026-10-27): phone pushes for Jamo's teams (BYU, the Eagles, the Jazz; Weber State
// as an option) through ntfy.sh, sent by this worker's cron (every 2 minutes, worker.js scheduled()). Off until Jamo turns
// it on at djgolding.com/sports/alerts/. College football, the NFL and the NBA only.
//
// GET  /api/alerts                     -> settings, whether the phone channel is set up, today's games for his teams and the
//                                         last 10 alerts sent (public; nothing sensitive, never the ntfy topic)
// POST /api/alerts       { pin, prefs } -> save settings. Same PIN as his game predictions (KV "picks:pin", see picks.js);
//                                         if no PIN is stored yet, the first save sets it
// POST /api/alerts/test  { pin }        -> send one test push
// GET  /api/alerts/run?dry=1            -> header x-alerts-pin: what a check would send right now; sends and writes nothing
// scheduled(env)                        -> one check (the cron)
//
// A check: read "alerts:prefs"; when alerts are off it stops there (one KV read, no network calls). Once per Mountain-time
// day it looks up which of his teams play ("alerts:day:<date>": ids and start times, one KV write a day). A game is only
// fetched from ESPN from 3 minutes before its start until its final goes out; "starting soon" needs no fetch.
// Each game keeps its state in "alerts:g:<lg>:<id>", written only when an alert goes out or a football score moves in a way
// the next alert's wording depends on (an extra point that makes no alert is not written): about 15-20 writes for a
// football game, 6 for basketball, plus one "alerts:log" write when the game ends. The site's KV free tier is ~1,000 writes
// a day, shared with the wedding pages.
// Dedupe, and the trade-off chosen: every alert has a key that is saved in the game's state BEFORE the push goes out, so a
// check that dies mid-way can lose an alert but never repeats one (at most once: a missed buzz beats a double one). A push
// ntfy plainly refused (a network error or a 429/5xx answer) is tried once more right away; a push that timed out is not,
// since it may have gone through. Two overlapping checks: each claims its alerts with its own token, pauses, reads the
// state back and only sends what it still owns (the last writer wins). KV has no compare-and-swap, so two checks in
// different data centers within the same second could still both send; checks are kept short (8 s per call, 45 s per
// check) so back-to-back crons never overlap. A score that flips back and forth on the feed re-uses its key, so it alerts
// once.
import { clientIp, originOk, rateLimit } from "./_guard.js";

const ALLOWED_ORIGINS = ["djgolding.com", "www.djgolding.com", "localhost", "127.0.0.1"];
const UA = "Mozilla/5.0 (compatible; djgolding.com live scores)"; // ESPN refuses server calls with other user-agents
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/";
const NTFY = "https://ntfy.sh/";
const SITE = "https://djgolding.com";
const TZ = "America/Denver";
const KEY = { prefs: "alerts:prefs", log: "alerts:log", game: "alerts:g:", day: "alerts:day:", pin: "picks:pin" };
const TTL = 3 * 86400;        // game states and day lists clean themselves up after 3 days
const FETCH_MS = 8000;        // per upstream call
const RUN_MS = 45000;         // a check stops starting new games after this, so back-to-back crons never overlap
const CONFIRM_MS = 1200;      // pause between claiming alerts in KV and reading the claim back
const RETRY_MS = 1500;        // pause before the one retry of a push ntfy refused
const SOON_MS = 16 * 60e3;    // "starting soon" goes out on the first check inside 16 minutes of the start
const LIVE_MS = 3 * 60e3;     // live scores are fetched from 3 minutes before the start
const FLIP_MS = 20 * 60e3;    // a score that comes back within 20 minutes of its alert is a feed flip, not a new score
const FRESH_MS = 15 * 60e3;   // a game first seen this soon after its start, still scoreless, gets its start alert
const LATE_MS = 3 * 3600e3;   // games that ended more than 3 hours ago are ignored
const LOG_MAX = 20;

// Jamo's teams. Weber State is an option, off by default (it is never a built-in favorite).
// cfb grp = ESPN conference group: the conference scoreboard includes the team's non-conference games and is a fraction
// of the size of the whole FBS / FCS board.
export const TEAMS = {
  byu: { lg: "cfb", name: "BYU", full: "BYU Cougars", espn: "252", grp: "4", def: true },
  eagles: { lg: "nfl", name: "Eagles", full: "Philadelphia Eagles", espn: "21", ab: "PHI", pl: true, def: true },
  jazz: { lg: "nba", name: "Jazz", full: "Utah Jazz", espn: "26", ab: "UTAH", pl: true, def: true },
  weber: { lg: "cfb", name: "Weber State", full: "Weber State Wildcats", espn: "2692", grp: "20", def: false },
};
// soon = ~15 min before; start = kickoff / tip-off; scores = every football score; half = basketball halftime;
// close = close late; ot = overtime starting; final = the final score
export const MOMENTS = { soon: true, start: true, scores: true, half: true, close: true, ot: true, final: true };
const SPORT = { cfb: "football", nfl: "football", nba: "basketball" };
const TAG = { football: "football", basketball: "basketball" }; // ntfy emoji
const WORD = { football: "kickoff", basketball: "tip-off" };
const DUR = { cfb: 4 * 3600e3, nfl: 3.75 * 3600e3, nba: 2.75 * 3600e3 }; // generous game lengths
const PTS = new Set([3, 6, 7, 8]);
// the college hub's name fixes (cfb-hub/p2.html ALIAS), so a link can be built to its own game id
const CFB_ALIAS = { "St. Thomas-Minnesota": "St. Thomas", "St. Thomas - Minnesota": "St. Thomas", "Albany": "UAlbany", "Tarleton": "Tarleton State", "Texas A&M-Commerce": "East Texas A&M", "UMass": "Massachusetts", "FIU": "Florida International", "Florida Intl": "Florida International", "Miami (FL)": "Miami", "Miami (Ohio)": "Miami (OH)", "Hawaii": "Hawai'i", "San Jose State": "San José State", "Louisiana-Monroe": "UL Monroe", "Louisiana Monroe": "UL Monroe", "Louisiana-Lafayette": "Louisiana", "Appalachian State": "App State", "Southern Mississippi": "Southern Miss", "Connecticut": "UConn", "Texas Christian": "TCU", "Southern Methodist": "SMU", "Brigham Young": "BYU", "Central Florida": "UCF", "Pitt": "Pittsburgh", "Sam Houston State": "Sam Houston", "North Carolina State": "NC State", "Southern California": "USC", "Alabama-Birmingham": "UAB", "Texas-El Paso": "UTEP", "Texas-San Antonio": "UTSA", "Nevada-Las Vegas": "UNLV", "Middle Tennessee State": "Middle Tennessee", "Mississippi": "Ole Miss", "Texas A&amp;M": "Texas A&M" };

// ---------- small helpers ----------
const num = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; };
const ord = (n) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : n + "th");
const otName = (n) => (n <= 1 ? "OT" : n + "OT");
const plural = (T, one, many) => (T.pl ? many : one);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function clockSec(c) {
  const m = /^(\d+):(\d{2})/.exec(String(c || ""));
  if (m) return +m[1] * 60 + +m[2];
  const f = parseFloat(c);
  return Number.isFinite(f) ? f : null;
}
// HTTP headers must be latin-1: fold accents, swap curly punctuation, drop the rest
function latin(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}
async function kvJSON(kv, key) {
  const v = await kv.get(key);
  if (!v) return null;
  try { return JSON.parse(v); } catch (e) { return null; }
}

// ---------- time (Mountain time for Jamo; Eastern dates for ESPN and the college hub's game ids) ----------
const MTF = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const MTT = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
function mtParts(ms) {
  const o = {};
  for (const p of MTF.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { date: `${o.year}-${o.month}-${o.day}`, h: (+o.hour) % 24 };
}
const mtTime = (ms) => MTT.format(new Date(ms));
const addDays = (date, n) => new Date(Date.parse(date + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const ymd = (date) => date.replace(/-/g, "");
function nthSunday(year, month, n) { const d = new Date(Date.UTC(year, month, 1)); return 1 + ((7 - d.getUTCDay()) % 7) + 7 * (n - 1); }
function etDate(iso) {
  const t = new Date(iso), y = t.getUTCFullYear();
  const start = Date.UTC(y, 2, nthSunday(y, 2, 2), 7), end = Date.UTC(y, 10, nthSunday(y, 10, 1), 6);
  const off = t.getTime() >= start && t.getTime() < end ? 4 : 5;
  return new Date(t.getTime() - off * 3600e3).toISOString().slice(0, 10);
}
function inQuiet(q, h) {
  if (!q || !q.on || q.from === q.to) return false;
  return q.from > q.to ? h >= q.from || h < q.to : h >= q.from && h < q.to;
}

// ---------- settings ----------
export function cleanPrefs(p) {
  p = p && typeof p === "object" ? p : {};
  const out = { enabled: p.enabled === true, teams: {}, moments: {}, quiet: { on: false, from: 23, to: 7 } };
  for (const k of Object.keys(TEAMS)) out.teams[k] = p.teams && typeof p.teams[k] === "boolean" ? p.teams[k] : TEAMS[k].def;
  for (const k of Object.keys(MOMENTS)) out.moments[k] = p.moments && typeof p.moments[k] === "boolean" ? p.moments[k] : MOMENTS[k];
  const q = p.quiet || {}, hr = (v, d) => (Number.isInteger(v) && v >= 0 && v <= 23 ? v : d);
  out.quiet = { on: q.on === true, from: hr(q.from, 23), to: hr(q.to, 7) };
  if (typeof p.savedAt === "number") out.savedAt = p.savedAt;
  return out;
}
function topicOf(env) {
  const t = env.NTFY_SPORTS_TOPIC || env.NTFY_TOPIC || "";
  return /^[A-Za-z0-9_-]{1,64}$/.test(t) ? t : "";
}

// ---------- upstream feeds ----------
async function getJSON(url, run) {
  if (run.cache.has(url)) return run.cache.get(url);
  const job = (async () => {
    // ESPN refuses server calls on one of its two hosts and has switched which one; try site.api, then site.web.api on a 403
    const urls = [url, url.replace("://site.api.espn.com/", "://site.web.api.espn.com/")];
    for (const u of urls) {
      run.fetches++;
      const res = await fetch(u, { headers: { "user-agent": UA, accept: "application/json" }, cf: { cacheTtl: 20, cacheEverything: true }, signal: AbortSignal.timeout(FETCH_MS) });
      if (res.ok) return res.json();
      if (res.status !== 403) throw new Error("upstream " + res.status);
    }
    throw new Error("upstream 403");
  })();
  run.cache.set(url, job);
  return job;
}
function boardUrl(lg, d, grp) {
  const path = { cfb: "football/college-football", nfl: "football/nfl", nba: "basketball/nba" }[lg];
  return ESPN + path + "/scoreboard?dates=" + d + (lg === "cfb" ? "&groups=" + grp + "&limit=100" : "&limit=50");
}
// one ESPN event -> the shape the alert rules use
export function espnGame(lg, e) {
  const cp = (e && e.competitions || [])[0];
  if (!cp) return null;
  const cs = cp.competitors || [];
  const h = cs.find((x) => x.homeAway === "home"), a = cs.find((x) => x.homeAway === "away");
  if (!h || !a) return null;
  const st = e.status || cp.status || {}, ty = st.type || {}, name = ty.name || "";
  const state = /POSTPONED|CANCELED|CANCELLED|SUSPENDED|FORFEIT|ABANDONED/.test(name) ? "off" : ty.state === "in" ? "in" : ty.state === "post" ? "post" : "pre";
  const side = (c) => { const t = c.team || {}; return { id: String(t.id || ""), ab: t.abbreviation || "", n: (lg === "cfb" ? t.location : t.shortDisplayName || t.name) || t.location || t.abbreviation || "", loc: t.location || "", s: num(c.score) }; };
  const tvs = [];
  (cp.geoBroadcasts || []).forEach((b) => { const n = b.media && b.media.shortName; if (n) tvs.push({ n, m: String((b.market && b.market.type) || "").toLowerCase() }); });
  (cp.broadcasts || []).forEach((b) => (b.names || []).forEach((n) => { if (n) tvs.push({ n, m: String(b.market || "").toLowerCase() }); }));
  return { lg, id: String(e.id), start: cp.date || e.date, tbd: cp.timeValid === false, state, name, per: st.period || 0, clk: st.displayClock || "", sec: clockSec(st.displayClock),
    det: ty.shortDetail || "", half: name === "STATUS_HALFTIME", endp: name === "STATUS_END_PERIOD", a: side(a), h: side(h), tvs };
}
function sideOf(G, T) {
  for (const sd of ["a", "h"]) { const x = G[sd]; if ((T.espn && x.id === T.espn) || (T.ab && x.ab === T.ab)) return sd; }
  return null;
}
function tvPick(tvs, us) {
  const mine = us === "h" ? "home" : "away";
  const t = (tvs || []).find((x) => x.m === "national") || (tvs || []).find((x) => x.m === mine) || (tvs || [])[0];
  return t ? t.n : "";
}
// the college hub keys games by Eastern date + its own team names (cfb-hub/p2.html G ids)
function cfbHubId(G) {
  const n = (s) => CFB_ALIAS[s] || s;
  return (etDate(G.start) + "-" + n(G.a.loc) + "-" + n(G.h.loc)).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
// where a tap on the notification goes: the game's page in its hub. BYU opens the college hub's game-day screen, which
// falls back to BYU's current game if the id were ever off; NFL and NBA game pages are keyed by ESPN's event id.
function clickUrl(g) {
  if (g.lg === "cfb") return SITE + "/cfb/#/" + (g.team === "byu" ? "gameday/" : "game/") + g.hub;
  return SITE + "/" + g.lg + "/#/game/" + g.id;
}

// Which of his teams play on a Mountain-time date: [{ lg, id, team, start, ek, us, a, h, tv, hub }]. College boards are
// read for the Eastern date and the next one (a late kick in Hawaii is the next day on ESPN); the NFL and the NBA never
// start after 10 PM Mountain, so their Eastern date is the same day.
async function dayGames(date, keys, run) {
  const games = [], ok = [];
  const add = (k, T, G, ek) => {
    if (!G || !Number.isFinite(Date.parse(G.start))) return; // no usable start time: skip it rather than fail the whole lookup
    const us = sideOf(G, T);
    // a kickoff time still "TBD" sits at midnight Eastern on ESPN, so its day is the Eastern date
    const day = G.tbd ? etDate(G.start) : mtParts(Date.parse(G.start)).date;
    if (!us || day !== date || games.some((x) => x.lg === G.lg && x.id === G.id)) return;
    games.push({ lg: T.lg, id: G.id, team: k, start: G.start, tbd: !!G.tbd, ek, grp: T.grp || "", us, a: G.a.n, h: G.h.n, tv: tvPick(G.tvs, us), hub: T.lg === "cfb" ? cfbHubId(G) : "" });
  };
  for (const k of keys) {
    const T = TEAMS[k];
    try {
      for (const d of T.lg === "cfb" ? [ymd(date), ymd(addDays(date, 1))] : [ymd(date)]) {
        const j = await getJSON(boardUrl(T.lg, d, T.grp), run);
        (j.events || []).forEach((e) => add(k, T, espnGame(T.lg, e), d));
      }
      ok.push(k);
    } catch (e) {
      run.notes.push(`${T.name}: schedule lookup failed (${(e && e.message) || e})`);
    }
  }
  return { games, ok };
}
async function liveGame(g, run) {
  const j = await getJSON(boardUrl(g.lg, g.ek, g.grp), run);
  const e = (j.events || []).find((y) => String(y.id) === g.id);
  return e ? espnGame(g.lg, e) : null;
}

// ---------- alert wording ----------
function detail(lg, L) {
  if (L.half) return "Halftime";
  const p = L.per > 4 ? otName(L.per - 4) : ord(L.per);
  if (L.endp) return `End of ${p}`;
  if (lg === "cfb" && L.per > 4) return p; // college overtime has no clock
  return `${p} ${L.clk}`.trim();
}
function otWord(n) { return n === 1 ? "overtime" : n === 2 ? "double overtime" : n === 3 ? "triple overtime" : `${ord(n)} overtime`; }
function matchup(g, T) { return `${g.us === "a" ? T.name : g.a} at ${g.us === "h" ? T.name : g.h}`; }
const finalSuffix = (L) => (L.per > 4 ? ` in ${otName(L.per - 4)}` : "");

// ---------- the rules: one game, one look -> the alerts it calls for ----------
const blank = (g) => ({ v: 1, lg: g.lg, id: g.id, team: g.team, a: 0, h: 0, pend: {}, sent: {}, by: {}, out: [] });
// g: the day-list entry; S: the game's saved state (changed in place); L: live data, or null before the live window;
// mo: the moments Jamo has on (only used to let close-late stand in for a turned-off overtime alert).
// Returns { ev, dirty }: dirty = S changed in a way that must be saved. Changes that make no alert and that the next look
// would work out again the same way from the saved state (an extra point after a touchdown) are left unsaved.
export function step(g, S, L, now, mo) {
  const T = TEAMS[g.team], sport = SPORT[g.lg], tag = TAG[sport], ev = [];
  const S0 = Date.parse(g.start), otOn = !mo || mo.ot !== false;
  let dirty = false;
  const mark = (k) => { if (S.sent[k] == null) { S.sent[k] = now; dirty = true; } };
  const add = (k, moment, e) => { if (S.sent[k] != null) return; S.sent[k] = now; dirty = true; ev.push(Object.assign({ k, moment }, e)); };
  // a score key that came back within FLIP_MS of its alert is ESPN flipping a score back and forth: say nothing again
  const addScore = (k, moment, e) => { if (S.sent[k] != null && now - S.sent[k] < FLIP_MS) return; delete S.sent[k]; add(k, moment, e); };
  const soon = () => {
    if (g.tbd || !(S0 - now > 0 && S0 - now <= SOON_MS)) return;
    const m = Math.max(1, Math.round((S0 - now) / 60e3));
    add("soon", "soon", { ti: `${T.name}: ${WORD[sport]} in ${m} min`, b: `${matchup(g, T)}, ${mtTime(S0)}${g.tv ? " on " + g.tv : ""}.`, tags: [tag, "alarm_clock"], pri: 3 });
  };
  if (!L || L.state === "pre") { soon(); return { ev, dirty }; }
  if (L.state === "off") { if (!S.done) { S.done = true; S.off = 1; dirty = true; } return { ev, dirty }; }

  const us = sideOf(L, T) || g.us, th = us === "a" ? "h" : "a", O = L[th].n || g[th];
  const line = (u, o) => `${T.name} ${u}, ${O} ${o}`;
  const now_ = () => line(L[us].s, L[th].s);
  const det = detail(g.lg, L), m = L[us].s - L[th].s;

  // first look at a game already under way or over: take it as it stands, no backlog of old alerts
  if (!S.seen) {
    S.seen = now; dirty = true;
    if (L.state === "post" && now - S0 > DUR[g.lg] + LATE_MS) { S.done = true; return { ev, dirty }; }
    // "fresh" = we are there from the start: early on the game clock (the next scores then alert from 0-0 as usual)
    const scoreless = L.a.s + L.h.s === 0;
    const early = L.sec == null ? false : sport === "football" ? L.per === 1 && L.sec >= 600 : L.per === 1 && L.sec >= 480;
    const fresh = L.state === "in" && (early || (scoreless && (g.tbd || now - S0 < FRESH_MS)));
    if (!fresh) {
      mark("soon"); mark("start");
      S.a = L.a.s; S.h = L.h.s;
      if (sport === "basketball" && L.per >= 3) mark("half");
      for (let p = 5; p < L.per; p++) mark("ot:" + p);
    }
  }
  mark("soon"); // once it has started, "starting soon" is moot
  if (L.state === "in") add("start", "start", { ti: `${cap(WORD[sport])}: ${matchup(g, T)}`, b: `Underway${g.tv ? " on " + g.tv : ""}. Tap to follow along.`, tags: [tag], pri: 3 });
  else mark("start");

  const closeLate = (sport === "football" ? L.sec != null && L.sec < 480 && Math.abs(m) <= 8 : L.sec != null && L.sec <= 300 && Math.abs(m) <= 5) && !L.half && !L.endp;
  const otAlert = (per, ti) => add("ot:" + per, "ot", { ti, b: `${now_()} - ${det}`, tags: [tag, "rotating_light"], pri: 4 });
  if (sport === "football") {
    // the size of the jump names the score: 3 field goal, 6-8 touchdown, 2 safety; the try after a 6 is folded into it
    for (const sd of ["a", "h"]) {
      const cur = L[sd].s, prev = S[sd] || 0;
      if (cur === prev) continue;
      S[sd] = cur;
      if (cur < prev) { // a correction or a flip on the feed: remember where the score was, say nothing
        S.hi = S.hi || {};
        if (!S.hi[sd] || S.hi[sd][0] < prev) S.hi[sd] = [prev, now];
        dirty = true; continue;
      }
      const hi = S.hi && S.hi[sd];
      if (hi) {
        delete S.hi[sd]; dirty = true;
        // back up to where it was before the drop (plus the try, when the touchdown was alerted before its extra point):
        // the feed flipped back, nothing new happened. A score beyond that, or a different one, alerts as usual.
        if (now - hi[1] < FLIP_MS && cur >= hi[0] && cur <= hi[0] + (S.pend[sd] ? 2 : 0)) { if (cur > hi[0]) delete S.pend[sd]; continue; }
      }
      const op = sd === "a" ? "h" : "a";
      delete S.pend[op];
      let d = cur - prev;
      const had = S.pend[sd];
      delete S.pend[sd];
      if (had) { if (d <= 2) continue; if (PTS.has(d - 1)) d -= 1; else if (PTS.has(d - 2)) d -= 2; }
      if (d === 1) continue; // a lone point (a try whose touchdown was already counted): no alert, nothing to save
      dirty = true;
      if (d === 6) S.pend[sd] = 1;
      const mine = sd === us, who = mine ? T.name : O, bang = mine ? "!" : "";
      // college overtime from the 3rd period on is two-point tries only
      const ti = d === 3 ? `${who} field goal${bang}` : d >= 6 && d <= 8 ? `${who} touchdown${bang}` : d === 2 ? (g.lg === "cfb" && L.per >= 7 ? `${who} converts the two-point try${bang}` : `${who} safety${bang}`) : `${who} scores${bang}`;
      addScore("s:" + sd + ":" + cur, "scores", { ti, b: `${now_()} - ${det}`, tags: mine ? [tag, "tada"] : [tag], pri: 3 });
    }
  } else if (L.state === "in") {
    if (L.half || (L.per === 2 && L.sec === 0)) {
      const hi = Math.max(L[us].s, L[th].s), lo = Math.min(L[us].s, L[th].s);
      add("half", "half", { ti: m > 0 ? `Halftime: ${T.name} ${plural(T, "leads", "lead")} ${hi}-${lo}` : m < 0 ? `Halftime: ${T.name} ${plural(T, "trails", "trail")} ${hi}-${lo}` : `Halftime: tied ${hi}-${lo}`, b: `${now_()} at the half.`, tags: [tag], pri: 3 });
    } else if (L.per >= 3) mark("half");
  }
  if (L.state === "in") {
    if (L.endp && L.per >= 4 && m === 0) {
      // regulation (or an overtime) just ended tied: say so now rather than when the next period's first look comes in
      if (otOn) mark("close");
      otAlert(L.per + 1, `Headed to ${otWord(L.per + 1 - 4)}: ${T.name} vs ${O}`);
    } else if (L.per > 4) {
      if (otOn) mark("close");
      otAlert(L.per, `${cap(otWord(L.per - 4))}: ${T.name} vs ${O}`);
      if (!otOn && closeLate) add("close", "close", closeText());
    } else if (L.per === 4 && closeLate) add("close", "close", closeText());
  }

  if (L.state === "post") {
    const u = L[us].s, o = L[th].s, hi = Math.max(u, o), lo = Math.min(u, o), sfx = finalSuffix(L);
    add("final", "final", {
      ti: u > o ? `${T.name} ${plural(T, "beats", "beat")} ${O}, ${hi}-${lo}${sfx}` : u < o ? `${T.name} ${plural(T, "loses", "lose")} to ${O}, ${hi}-${lo}${sfx}` : `${T.name} and ${O} tie, ${u}-${o}${sfx}`,
      b: `Final: ${now_()}${sfx}.`, tags: u > o ? ["trophy", tag] : [tag], pri: 4, final: true,
    });
    if (!S.done) { S.done = true; dirty = true; }
  }
  return { ev, dirty };

  function closeText() {
    return { ti: m > 0 ? `${T.name} ${plural(T, "leads", "lead")} by ${m} late` : m < 0 ? `${T.name} ${plural(T, "trails", "trail")} by ${-m} late` : `Tied late: ${T.name} vs ${O}`,
      b: `${now_()} - ${det}. Worth tuning in.`, tags: [tag, "rotating_light"], pri: 4 };
  }
}

// ---------- sending ----------
// true = ntfy took it. One retry, only when ntfy plainly did not take it (a network error before an answer, or a 429/5xx);
// a timeout is not retried, because the first try may have gone through.
async function push(topic, e, pause = RETRY_MS) {
  const headers = { Title: latin(e.ti) || "Game alert", Priority: String(e.pri || 3) };
  if (e.tags && e.tags.length) headers.Tags = e.tags.join(",");
  if (e.click) headers.Click = e.click;
  for (let i = 0; i < 2; i++) {
    let retry = false;
    try {
      const res = await fetch(NTFY + topic, { method: "POST", headers, body: String(e.b || ""), signal: AbortSignal.timeout(FETCH_MS) });
      if (res.ok) return true;
      retry = res.status === 429 || res.status >= 500;
    } catch (err) {
      retry = !(err && (err.name === "TimeoutError" || err.name === "AbortError"));
    }
    if (!retry || i) return false;
    await sleep(pause);
  }
  return false;
}
const logId = (g, k) => g.lg + ":" + g.id + ":" + k;
function mergeLog(log, items) {
  const seen = new Set(), out = [];
  for (const x of items.concat(Array.isArray(log) ? log : [])) { const id = x.id || x.t + "|" + x.ti; if (seen.has(id)) continue; seen.add(id); out.push(x); }
  return out.sort((a, b) => b.t - a.t).slice(0, LOG_MAX);
}

// ---------- one check ----------
// opts: dry (compute only), now (ms, for tests), confirmMs (pause before reading claims back), retryMs (pause before the
// one retry of a refused push)
export async function runCheck(env, opts = {}) {
  const kv = env.WEDDING_KV, dry = !!opts.dry, now = opts.now || Date.now();
  const run = { fetches: 0, cache: new Map(), notes: [] }, until = Date.now() + RUN_MS;
  const res = { t: now, dry, alerts: [], games: [], notes: run.notes, fetches: 0, writes: 0 };
  const done = (extra) => Object.assign(res, { fetches: run.fetches }, extra || {});
  if (!kv) return done({ skipped: "storage" });
  const prefs = cleanPrefs(await kvJSON(kv, KEY.prefs));
  if (!prefs.enabled && !dry) return done({ skipped: "off" });
  const topic = topicOf(env);
  if (!topic && !dry) return done({ skipped: "no channel" });
  const keys = Object.keys(TEAMS).filter((k) => prefs.teams[k]);
  if (!keys.length) return done({ skipped: "no teams" });

  // today's games (and last night's, until 6 AM, for a game that runs past midnight)
  const mt = mtParts(now), dates = mt.h < 6 ? [addDays(mt.date, -1), mt.date] : [mt.date], games = [];
  for (const d of dates) {
    let day = await kvJSON(kv, KEY.day + d);
    const need = keys.filter((k) => !day || !(day.keys || []).includes(k));
    if (need.length) {
      const found = await dayGames(d, need, run);
      const old = (day && day.games) || [];
      day = { d, keys: Array.from(new Set(((day && day.keys) || []).concat(found.ok))).sort(), games: old.concat(found.games.filter((x) => !old.some((y) => y.lg === x.lg && y.id === x.id))), t: now };
      if (!dry && found.ok.length) { await kv.put(KEY.day + d, JSON.stringify(day), { expirationTtl: TTL }); res.writes++; }
    }
    for (const g of day.games || []) if (TEAMS[g.team] && prefs.teams[g.team] && !games.some((x) => x.lg === g.lg && x.id === g.id)) games.push(g);
  }

  const quiet = inQuiet(prefs.quiet, mt.h), changed = [];
  for (const g of games) {
    const S0 = Date.parse(g.start), T = TEAMS[g.team];
    const row = { team: g.team, lg: g.lg, id: g.id, game: matchup(g, T), start: g.start };
    res.games.push(row);
    if (g.tbd) { // no kickoff time yet: watch the scoreboard from 9 AM Mountain on game day
      const day = etDate(g.start);
      if (mt.date < day || (mt.date === day && mt.h < 9)) { row.status = "later"; continue; }
      if (mt.date > day) { row.status = "over"; continue; }
    } else {
      if (now < S0 - SOON_MS) { row.status = "later"; continue; }
      if (now > S0 + DUR[g.lg] + LATE_MS) { row.status = "over"; continue; }
    }
    if (Date.now() > until) { row.status = "skipped (out of time)"; continue; }
    const key = KEY.game + g.lg + ":" + g.id;
    const saved = await kvJSON(kv, key);
    if (saved && saved.done) { row.status = "done"; continue; }
    let L = null;
    if (g.tbd || now >= S0 - LIVE_MS) {
      try { L = await liveGame(g, run); } catch (e) { row.status = "feed error"; run.notes.push(`${T.name}: live feed failed (${(e && e.message) || e})`); continue; }
      if (!L) { row.status = "not on the scoreboard"; continue; }
      row.status = L.state;
      if (L.state === "in" || L.state === "post") { row.score = `${L.a.n} ${L.a.s}, ${L.h.n} ${L.h.s}`; row.detail = L.state === "post" ? "Final" : detail(g.lg, L); }
    } else row.status = "starting soon";
    const S = Object.assign(blank(g), saved || {});
    const { ev, dirty } = step(g, S, L, now, prefs.moments);
    for (const e of ev) {
      e.click = clickUrl(g);
      e.send = prefs.moments[e.moment] !== false && (!quiet || e.moment === "final");
      if (!e.send) e.why = prefs.moments[e.moment] === false ? "that moment is turned off" : "quiet hours";
    }
    if (dirty) changed.push({ g, key, S, ev });
  }

  // claim: save every changed game (with the keys of the alerts about to go out) BEFORE anything is sent
  const tok = (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random())).slice(0, 12);
  for (const x of changed) {
    x.S.tok = tok; x.S.t = now;
    for (const e of x.ev) if (e.send) { x.S.by[e.k] = tok; x.S.out.unshift({ id: logId(x.g, e.k), t: now, ti: e.ti, b: e.b, lg: x.g.lg, team: x.g.team }); }
    x.S.out = x.S.out.slice(0, 30);
    if (!dry) { await kv.put(x.key, JSON.stringify(x.S), { expirationTtl: TTL }); res.writes++; }
  }
  // read the claims back: an alert another overlapping check took over is left to that check
  const sending = changed.filter((x) => x.ev.some((e) => e.send));
  if (!dry && sending.length) {
    await sleep(opts.confirmMs != null ? opts.confirmMs : CONFIRM_MS);
    for (const x of sending) {
      const back = await kvJSON(kv, x.key);
      for (const e of x.ev) if (e.send && back && back.by && back.by[e.k] && back.by[e.k] !== tok) { e.send = false; e.why = "sent by another check"; x.S.out = x.S.out.filter((o) => o.id !== logId(x.g, e.k)); }
    }
  }
  const finished = [];
  for (const x of changed) {
    let failed = false;
    for (const e of x.ev) {
      res.alerts.push({ team: x.g.team, game: matchup(x.g, TEAMS[x.g.team]), key: e.k, moment: e.moment, title: e.ti, body: e.b, click: e.click, priority: e.pri, tags: e.tags, send: e.send, why: e.why || "" });
      if (!e.send || dry) continue;
      const ok = await push(topic, e, opts.retryMs != null ? opts.retryMs : RETRY_MS);
      res.alerts[res.alerts.length - 1].sent = ok;
      if (!ok) { failed = true; const o = x.S.out.find((y) => y.id === logId(x.g, e.k)); if (o) o.fail = 1; }
    }
    if (failed && !dry) { await kv.put(x.key, JSON.stringify(x.S), { expirationTtl: TTL }); res.writes++; }
    if (x.S.done && x.S.out.length) finished.push(x);
  }
  // a finished game's alerts move to the shared log (one write per game), so the settings page can list them later
  if (!dry && finished.length) {
    const log = await kvJSON(kv, KEY.log);
    await kv.put(KEY.log, JSON.stringify(mergeLog(log, [].concat(...finished.map((x) => x.S.out)))));
    res.writes++;
  }
  return done();
}
let busy = false;
export async function scheduled(env) {
  if (busy) return { skipped: "busy" }; // the previous check in this worker is still going
  busy = true;
  try {
    return await runCheck(env);
  } catch (e) {
    console.log("alerts check failed: " + ((e && e.stack) || e));
    return { error: String((e && e.message) || e) };
  } finally {
    busy = false;
  }
}

// ---------- HTTP ----------
function cors(request) {
  const origin = request.headers.get("origin");
  try {
    if (origin && ALLOWED_ORIGINS.includes(new URL(origin).hostname)) {
      return { "access-control-allow-origin": origin, vary: "origin", "access-control-allow-headers": "content-type, x-alerts-pin", "access-control-allow-methods": "GET, POST, OPTIONS" };
    }
  } catch (e) { /* malformed origin header: no CORS */ }
  return {};
}
function json(request, body, status, extra) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { "content-type": "application/json", "cache-control": "no-store", ...cors(request), ...(extra || {}) } });
}
async function hash(pin) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("jsh-picks|" + pin)); // same as picks.js
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
// PIN check shared by saving, the test push and the dry run. Only wrong PINs are counted (8 an hour per address), so a
// normal save costs no extra KV write.
async function pinGate(request, env, pin, allowSet) {
  const kv = env.WEDDING_KV;
  if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) return { res: json(request, { error: "pin", message: "Your PIN is 4 to 8 digits." }, 400) };
  const rk = `rl_alertspin_${clientIp(request)}_${Math.floor(Date.now() / 3600e3)}`;
  const bad = parseInt(await kv.get(rk), 10) || 0;
  if (bad >= 8) return { res: json(request, { error: "rate_limited", message: "Too many wrong PINs. Try again in an hour." }, 429, { "retry-after": "3600" }) };
  const h = await hash(pin), saved = await kv.get(KEY.pin);
  if (!saved) {
    if (!allowSet) return { res: json(request, { error: "nopin", message: "Save your settings once first. That sets your PIN." }, 409) };
    await kv.put(KEY.pin, h);
    return { first: true };
  }
  if (saved !== h) {
    try { await kv.put(rk, String(bad + 1), { expirationTtl: 7200 }); } catch (e) { /* counting is best-effort */ }
    return { res: json(request, { error: "pin", message: "That PIN doesn’t match. It’s the same PIN as your game predictions." }, 403) };
  }
  return { first: false };
}
async function readBody(request) {
  const text = await request.text();
  if (text.length > 8000) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

async function status(env) {
  const kv = env.WEDDING_KV, now = Date.now(), mt = mtParts(now);
  const [p, pin, log, today, yday] = await Promise.all([kvJSON(kv, KEY.prefs), kv.get(KEY.pin), kvJSON(kv, KEY.log), kvJSON(kv, KEY.day + mt.date), kvJSON(kv, KEY.day + addDays(mt.date, -1))]);
  const prefs = cleanPrefs(p);
  const games = [].concat((yday && yday.games) || [], (today && today.games) || []).filter((g) => TEAMS[g.team]).slice(-8);
  const states = await Promise.all(games.map((g) => kvJSON(kv, KEY.game + g.lg + ":" + g.id)));
  const byGame = {};
  games.forEach((g, i) => { byGame[g.lg + ":" + g.id] = states[i]; });
  const recent = mergeLog(log, [].concat(...states.filter(Boolean).map((s) => s.out || []))).slice(0, 10)
    .map((x) => ({ t: x.t, title: x.ti, body: x.b, lg: x.lg, team: x.team, ...(x.fail ? { failed: true } : {}) }));
  const upcoming = ((today && today.games) || []).filter((g) => TEAMS[g.team] && prefs.teams[g.team]).map((g) => {
    const s = byGame[g.lg + ":" + g.id];
    return { team: g.team, lg: g.lg, game: matchup(g, TEAMS[g.team]), start: g.start, tbd: !!g.tbd, tv: g.tv || "", href: clickUrl(g).slice(SITE.length),
      state: s && s.off ? "off" : s && s.done ? "final" : s && s.seen ? "live" : "upcoming" };
  }).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  return {
    enabled: prefs.enabled, teams: prefs.teams, moments: prefs.moments, quiet: prefs.quiet, savedAt: prefs.savedAt || null,
    channelReady: !!topicOf(env), channel: !topicOf(env) ? "none" : env.NTFY_SPORTS_TOPIC ? "sports" : "shared",
    pinSet: !!pin, checked: !!today, today: upcoming, recent,
  };
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  const kv = env.WEDDING_KV;
  if (!kv) return json(request, { error: "storage unavailable" }, 503);
  const url = new URL(request.url), p = url.pathname.replace(/\/+$/, "");
  try {
    if (p === "/api/alerts") {
      if (request.method === "GET") return json(request, await status(env));
      if (request.method !== "POST") return json(request, { error: "method" }, 405);
      if (!originOk(request)) return json(request, { error: "forbidden" }, 403);
      const body = await readBody(request);
      if (!body) return json(request, { error: "bad request" }, 400);
      const gate = await pinGate(request, env, body.pin, true);
      if (gate.res) return gate.res;
      const prefs = cleanPrefs(body.prefs);
      prefs.savedAt = Date.now();
      await kv.put(KEY.prefs, JSON.stringify(prefs));
      return json(request, { ok: true, firstPin: gate.first, prefs });
    }
    if (p === "/api/alerts/test") {
      if (request.method !== "POST") return json(request, { error: "method" }, 405);
      if (!originOk(request)) return json(request, { error: "forbidden" }, 403);
      const body = await readBody(request);
      if (!body) return json(request, { error: "bad request" }, 400);
      const gate = await pinGate(request, env, body.pin, false);
      if (gate.res) return gate.res;
      const topic = topicOf(env);
      if (!topic) return json(request, { error: "channel", message: "Your phone isn’t connected yet, so there’s nowhere to send it." }, 409);
      const rl = await rateLimit(env, "alerts_test", clientIp(request), 6, 3600);
      if (!rl.ok) return json(request, { error: "rate_limited", message: "That’s plenty of test alerts for now. Try again later." }, 429, { "retry-after": String(Math.max(rl.retryAfter, 1)) });
      const now = Date.now();
      const e = { ti: "Test alert from Jamo Sports Hub", b: "If you can read this, game alerts will reach this phone.", tags: ["bell"], pri: 3, click: SITE + "/sports/alerts/" };
      const ok = await push(topic, e);
      const log = await kvJSON(kv, KEY.log);
      await kv.put(KEY.log, JSON.stringify(mergeLog(log, [{ id: "test:" + now, t: now, ti: e.ti, b: e.b, lg: "test", team: "", ...(ok ? {} : { fail: 1 }) }])));
      return ok ? json(request, { ok: true }) : json(request, { error: "send", message: "The notification service didn’t take it. Try again in a minute." }, 502);
    }
    if (p === "/api/alerts/run") {
      if (request.method !== "GET") return json(request, { error: "method" }, 405);
      if (url.searchParams.get("dry") !== "1") return json(request, { error: "dry", message: "Only dry runs start from here. The real checks run on their own every 2 minutes." }, 400);
      const gate = await pinGate(request, env, request.headers.get("x-alerts-pin") || "", false);
      if (gate.res) return gate.res;
      return json(request, await runCheck(env, { dry: true }));
    }
    return json(request, { error: "not found" }, 404);
  } catch (e) {
    return json(request, { error: "server", message: "Something went wrong. Try again in a minute." }, 500);
  }
}
