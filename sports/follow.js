/* winodds:start - the hub's own live win chance (2026-11-10, Jamo picked "Our own live win odds"). Inlined into each
   hub's page by its build.sh, and into the Live Center and the Follow bar, so every live game uses the same math.
   It replaces the ESPN win-probability chart and numbers the hubs showed before.
   The math (the standard score-and-clock model): the home team's chance is
       P = Normal( (lead + pregame margin x share of the game left) / (spread of results x square root of share left) )
   - "pregame margin" is the hub's own pick: its power ratings plus home field (the same number the game page shows as
     the model line), so before kickoff/tip P is exactly the hub's pregame win chance;
   - "spread of results" is each hub's own SD (NFL 13.5, CFB 16, NBA 12, CBB 11 points);
   - as the clock runs down the lead counts for more and the pregame pick for less; at the end it is 100% or 0%;
   - because points come in chunks, a slice of the spread stays as "one more score" until the last possession (see LUMP).
   Overtime counts as a slice of a game (CFB overtime, which has no clock, as 3%).
   The line through a game comes from the live-score proxies' scoring timeline (/api/<lg>/game -> tl: every scoring
   change as [period, seconds left, away, home]); between scores the line drifts toward the team ahead as time runs.
   Pages ask for it with a placeholder:
     <div class="wo" data-lg="nfl" data-id="401..." data-mu="3.4" data-sd="13.5" data-a="DAL" data-h="PHI"
          data-an="Cowboys" data-hn="Eagles" data-ac="#..." data-hc="#..."></div>
   which fills itself in (and refreshes every 30 s while the game is live and the page is open). */
var JSHOdds = window.JSHOdds || (window.JSHOdds = (function(){
  var D = document, W = window;
  var SPEC = { nfl: {n: 4, len: 900, ot: 600, sd: 13.5, word: 'quarter'}, cfb: {n: 4, len: 900, ot: 0, sd: 16, word: 'quarter'},
               nba: {n: 4, len: 720, ot: 300, sd: 12, word: 'quarter'}, cbb: {n: 2, len: 1200, ot: 300, sd: 11, word: 'half'} };
  var spec = function(lg){ return SPEC[lg] || SPEC.nfl; };
  function cdf(z){ var t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
  function secs(c){ var s = String(c == null ? '' : c).trim(), m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(s); if (m) return +m[1] * 60 + +m[2]; m = /^(\d+(?:\.\d+)?)$/.exec(s); return m ? +m[1] : 0; }
  /* where a live game stands, from a period number and ESPN's short status ("8:42 - 3rd", "Halftime", "End of 1st") */
  function fromDet(det, per, lg){ var d = String(det || ''), s = spec(lg), stop = /^end|halftime/i.test(d);
    var m = /(\d+:\d+(?:\.\d+)?)/.exec(d) || /(?:^|\s)(\d+\.\d+)(?:\s|$)/.exec(d);
    /* no period number (college basketball keeps only the status text): read it from "2nd Half", "OT", "2OT", "Halftime" */
    if (!(+per)) { var q = /(\d)(?:st|nd|rd|th)/i.exec(d), o = /(\d)\s*OT/i.exec(d); per = /halftime/i.test(d) ? (s.n === 2 ? 1 : 2) : /OT/i.test(d) ? s.n + (o ? +o[1] : 1) : q ? +q[1] : 1; }
    return {per: +per || 1, sec: m && !stop ? secs(m[1]) : 0}; }
  /* seconds played so far, and the share of the game still to play */
  function played(lg, per, sec){ var s = spec(lg), T = s.n * s.len; if (!per) return 0; if (per <= s.n) return (per - 1) * s.len + (s.len - sec);
    var k = per - s.n; return s.ot ? T + (k - 1) * s.ot + (s.ot - sec) : T + k * 60; }
  function left(lg, per, sec){ var s = spec(lg), T = s.n * s.len; if (!per) return 1; if (per <= s.n) return Math.max(0, Math.min(1, ((s.n - per) * s.len + sec) / T));
    return s.ot ? Math.max(0, sec / T) : 0.03; }
  /* points come in chunks (a touchdown, a three), so a late lead is never quite as safe as smooth math says: part of the
     spread is kept as "one more score can still happen" until the last possession (NFL/CFB 2:30, NBA 24 s, CBB 30 s).
     The two parts add up to the hub's own spread, so before the game this is still exactly the hub's pregame chance.
     Checks: NFL up 7 with 2:00 left about 93%; NBA up 3 with 30 s left about 86%. */
  var LUMP = {nfl: [4.5, 150], cfb: [5, 150], nba: [2.5, 24], cbb: [2.5, 30]};
  function prob(lg, lead, frac, mu, sd){ sd = +sd || spec(lg).sd; mu = +mu || 0; if (frac <= 0.0004) return lead > 0 ? 1 : lead < 0 ? 0 : 0.5;
    var s = spec(lg), L = LUMP[lg] || LUMP.nfl, c = Math.min(L[0], sd * 0.6), base = sd * sd - c * c, g = Math.min(1, frac * s.n * s.len / L[1]);
    return cdf((lead + mu * frac) / Math.sqrt(base * frac + c * c * g)); }
  /* the home team's chance right now: o = {lg, mu, sd, as, hs, per, det} (det = ESPN's short status) */
  function now(o){ var w = fromDet(o.det, o.per, o.lg); return prob(o.lg, (+o.hs || 0) - (+o.as || 0), left(o.lg, w.per, w.sec), o.mu, o.sd); }
  function perName(lg, per){ var s = spec(lg); if (per > s.n) return (per - s.n > 1 ? (per - s.n) + 'OT' : 'OT');
    return s.n === 2 ? (per === 1 ? '1st half' : '2nd half') : ['1st', '2nd', '3rd', '4th'][per - 1] + ' quarter'; }
  function clock(sec){ sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2); }
  /* the line through a game: o = {lg, mu, sd}, tl = [[per, secLeft, away, home], ...], end = {per, sec} or null (final) */
  function series(o, tl, end){
    var s = spec(o.lg), T = s.n * s.len, ev = [];
    (tl || []).forEach(function(e){ ev.push({t: played(o.lg, e[0], e[1]), f: left(o.lg, e[0], e[1]), a: +e[2], h: +e[3], per: +e[0], sec: +e[1]}); });
    ev.sort(function(x, y){ return x.t - y.t; });
    var last = ev.length ? ev[ev.length - 1] : null;
    var endT = end ? played(o.lg, end.per, end.sec) : Math.max(T, last ? last.t : T);
    var step = s.len / 30, pts = [], i = 0, lead = 0, a = 0, h = 0, swing = null;
    var at = function(t){ if (t <= T) return Math.max(0, (T - t) / T); if (!s.ot) return 0.03; var k = Math.floor((t - T) / s.ot); return Math.max(0, (s.ot - (t - T - k * s.ot)) / T); };
    for (var t = 0; ; t += step) {
      var tt = Math.min(t, endT);
      while (i < ev.length && ev[i].t <= tt) {
        var e = ev[i], f = e.f, p0 = prob(o.lg, lead, f, o.mu, o.sd);
        pts.push({t: e.t, p: p0}); lead = e.h - e.a; a = e.a; h = e.h;
        var p1 = prob(o.lg, lead, f, o.mu, o.sd); pts.push({t: e.t, p: p1});
        if (!swing || Math.abs(p1 - p0) > Math.abs(swing.d)) swing = {d: p1 - p0, p0: p0, p1: p1, e: e, home: e.h > (i ? ev[i - 1].h : 0)};
        i++;
      }
      pts.push({t: tt, p: end || tt < endT ? prob(o.lg, lead, at(tt), o.mu, o.sd) : (lead > 0 ? 1 : lead < 0 ? 0 : 0.5)});
      if (tt >= endT) break;
    }
    return {pts: pts, endT: Math.max(endT, 1), T: T, swing: swing, a: a, h: h};
  }
  var esc = function(x){ return String(x == null ? '' : x).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
  var pc = function(p){ var v = Math.round(p * 100); return (p > 0 && v === 0 ? '<1' : p < 1 && v === 100 ? '>99' : v) + '%'; };
  /* the chart: home chance on top (home color), away chance underneath (away color) */
  function chart(o, S){
    var Wd = 600, H = 150, pl = 4, pr = 4, pt = 8, pb = 18, X = function(t){ return pl + (Wd - pl - pr) * t / S.endT; }, Y = function(p){ return pt + (H - pt - pb) * (1 - p); };
    var line = S.pts.map(function(q, k){ return (k ? 'L' : 'M') + X(q.t).toFixed(1) + ' ' + Y(q.p).toFixed(1); }).join('');
    var area = line + 'L' + X(S.pts[S.pts.length - 1].t).toFixed(1) + ' ' + Y(0.5) + 'L' + X(0) + ' ' + Y(0.5) + 'Z';
    var id = 'wo' + Math.random().toString(36).slice(2, 8), s = spec(o.lg), grid = '';
    for (var k = 1; k < s.n; k++) grid += '<line x1="' + X(k * s.len) + '" x2="' + X(k * s.len) + '" y1="' + pt + '" y2="' + (H - pb) + '" class="wo-g"/>';
    if (S.endT > S.T) grid += '<line x1="' + X(S.T) + '" x2="' + X(S.T) + '" y1="' + pt + '" y2="' + (H - pb) + '" class="wo-g ot"/>';
    var lab = s.n === 2 ? ['1st half', '2nd half'] : ['Q1', 'Q2', 'Q3', 'Q4'], labs = '';
    lab.forEach(function(L, k){ labs += '<text x="' + X((k + 0.5) * s.len) + '" y="' + (H - 4) + '" text-anchor="middle">' + L + '</text>'; });
    if (S.endT > S.T) labs += '<text x="' + X((S.T + S.endT) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">OT</text>';
    return '<svg class="wo-svg" viewBox="0 0 ' + Wd + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + esc(o.hn) + ' win chance through the game">'
      + '<defs><clipPath id="' + id + 't"><rect x="0" y="0" width="' + Wd + '" height="' + Y(0.5) + '"/></clipPath><clipPath id="' + id + 'b"><rect x="0" y="' + Y(0.5) + '" width="' + Wd + '" height="' + H + '"/></clipPath></defs>'
      + grid + '<line x1="' + pl + '" x2="' + (Wd - pr) + '" y1="' + Y(0.5) + '" y2="' + Y(0.5) + '" class="wo-mid"/>'
      + '<path d="' + area + '" fill="' + esc(o.hc || '#5b8cff') + '" opacity=".34" clip-path="url(#' + id + 't)"/>'
      + '<path d="' + area + '" fill="' + esc(o.ac || '#ff7a59') + '" opacity=".34" clip-path="url(#' + id + 'b)"/>'
      + '<path d="' + line + '" class="wo-ln" vector-effect="non-scaling-stroke"/>' + labs + '</svg>';
  }
  /* the words under the chart */
  function story(o, S, live){
    var out = [], p = S.pts[S.pts.length - 1].p, homeUp = p >= 0.5;
    if (live) out.push('<b>' + esc(homeUp ? o.hn : o.an) + ' ' + pc(homeUp ? p : 1 - p) + '</b> to win right now');
    else { var lowH = 1, lowA = 1; S.pts.forEach(function(q){ lowH = Math.min(lowH, q.p); lowA = Math.min(lowA, 1 - q.p); });
      var win = S.h > S.a ? 'h' : S.a > S.h ? 'a' : ''; if (win) { var low = win === 'h' ? lowH : lowA; out.push('<b>' + esc(win === 'h' ? o.hn : o.an) + '</b> won' + (low < 0.25 ? ' after falling to ' + pc(low) + ' at their lowest' : low > 0.5 ? ', and were favored the whole way' : '')); } }
    var w = S.swing;
    if (w && Math.abs(w.d) >= 0.08) { var who = w.home ? o.hn : o.an, b = w.home ? w.p0 : 1 - w.p0, a = w.home ? w.p1 : 1 - w.p1;
      out.push('Biggest swing: ' + esc(who) + ' scored with ' + clock(w.e.sec) + ' left in the ' + perName(o.lg, w.e.per) + ' (' + w.e.a + '–' + w.e.h + ') and went from ' + pc(b) + ' to ' + pc(a) + '.'); }
    return out.join(' · ');
  }
  var CSS = '.wo{margin-top:14px}.wo .wo-hd{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}'
    + '.wo .wo-k{display:flex;gap:14px;font-size:12.5px;font-weight:700}.wo .wo-k i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}'
    + '.wo-svg{display:block;width:100%;height:150px;margin:8px 0 6px;overflow:visible}.wo-svg text{font-size:11px;fill:var(--ink-3,#8f9aac);font-weight:600}'
    + '.wo-g{stroke:var(--line,#2a3448);stroke-width:1;stroke-dasharray:3 4}.wo-g.ot{stroke-dasharray:none}.wo-mid{stroke:var(--ink-3,#8f9aac);stroke-width:1;opacity:.55}'
    + '.wo-ln{fill:none;stroke:var(--ink,#e8eef8);stroke-width:2.2;stroke-linejoin:round}'
    + '.wo-tag{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;font-size:11.5px;font-weight:800;line-height:1.5;white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--ink,#e8eef8);background:color-mix(in srgb,var(--accent,#5b8cff) 18%,transparent);border:1px solid color-mix(in srgb,var(--accent,#5b8cff) 35%,transparent)}'
    + '.wo .wo-s{font-size:13.5px;line-height:1.45;color:var(--ink-2,#aab4c5)}.wo .wo-s b{color:var(--ink,#e8eef8)}.wo .wo-n{margin-top:6px;font-size:12px;color:var(--ink-3,#8f9aac)}';
  function css(){ if (D.getElementById('wo-css')) return; var s = D.createElement('style'); s.id = 'wo-css'; s.textContent = CSS; (D.head || D.documentElement).appendChild(s); }
  function opts(el){ var d = el.dataset; return {lg: d.lg, id: d.id, mu: +d.mu || 0, sd: +d.sd || spec(d.lg).sd, a: d.a, h: d.h, an: d.an || d.a, hn: d.hn || d.h, ac: d.ac, hc: d.hc}; }
  function draw(el, j){
    var o = opts(el), st = String(j.st || ''), live = /IN_PROGRESS|HALFTIME|END_PERIOD|DELAYED/.test(st), fin = /FINAL/.test(st);
    if (!live && !fin) { el.hidden = true; return; }
    var end = live ? {per: (j.pc && j.pc[0]) || 1, sec: (j.pc && j.pc[1]) || 0} : null;
    var S = series(o, j.tl || [], end); if (S.pts.length < 2) { el.hidden = true; return; }
    var p = S.pts[S.pts.length - 1].p, fav = o.mu >= 0 ? o.hn : o.an;
    el.hidden = false;
    el.innerHTML = '<div class="hd wo-hd"><h3>Win chance</h3><div class="wo-k"><span><i style="background:' + esc(o.ac) + '"></i>' + esc(o.an) + ' ' + pc(1 - p) + '</span><span><i style="background:' + esc(o.hc) + '"></i>' + esc(o.hn) + ' ' + pc(p) + '</span></div></div>'
      + '<div class="bd">' + chart(o, S) + '<div class="wo-s">' + story(o, S, live) + '</div>'
      + '<div class="wo-n">The hub’s own live model: the score, the time left and the hub’s pregame pick (' + (Math.abs(o.mu) < 0.05 ? 'a toss-up' : esc(fav) + ' by ' + Math.abs(o.mu).toFixed(1)) + ').' + (live ? ' Updates every 30 seconds.' : '') + '</div></div>';
    if (live && !el._wt) el._wt = setInterval(function(){ if (!el.isConnected) { clearInterval(el._wt); return; } if (!D.hidden) load(el); }, 30000);
    if (!live && el._wt) { clearInterval(el._wt); el._wt = 0; }
  }
  function load(el){ var o = opts(el); if (!o.lg || !o.id) return;
    fetch('/api/' + o.lg + '/game?event=' + encodeURIComponent(o.id), {cache: 'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ if (j && el.isConnected) draw(el, j); }).catch(function(){}); }
  function scan(root){ (root || D).querySelectorAll('.wo[data-lg]:not([data-wo-on])').forEach(function(el){ el.setAttribute('data-wo-on', '1'); el.classList.add('card'); el.hidden = true; css(); load(el); }); }
  function watch(){ css(); var v = D.getElementById('view'); if (!v) return; scan(v); var q = 0; new MutationObserver(function(){ if (!q) q = setTimeout(function(){ q = 0; scan(v); }, 80); }).observe(v, {childList: true, subtree: true}); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', watch); else setTimeout(watch, 0);
  return {SPEC: SPEC, cdf: cdf, secs: secs, fromDet: fromDet, left: left, prob: prob, now: now, series: series, pc: pc, chart: chart, story: story, scan: scan, css: css, draw: draw};
})());
/* winodds:end */
/* follow:start - "Follow a game" (2026-11-10, Jamo picked "Follow a game"). sports-hub/build.sh publishes it as
   /sports/follow.js with polish/winodds.js in front of it (the hub's own live win chance), and the shared top bar
   (hubbar.html) loads it on every page: home, Live Center, alerts and all four hubs.
   - Game pages (#/game/<id>, and the CFB game-day screen) get a "Follow this game" button under the score. A hub tells it
     about the game through window.JSH_GAME(id) (teams, colors, logos, the hub's pregame pick and the live-feed id).
   - Up to two followed games show in a slim scoreboard that stays on screen on every page: score, clock and the hub's
     own win chance. It sits just above the scores ticker at the bottom (at the top it would cover the hubs' pinned
     menus). A score flashes in the scoring team's color. Tap a game to open it; x stops following.
   - Scores come from the same live-score feeds the hubs use (/api/<lg>/game), every 20 seconds while the screen is on.
   - A game drops off on its own 30 minutes after the final. Following is kept in this browser only (localStorage). */
(function(){
  if (window.__jshFollow) return; window.__jshFollow = true;
  var D = document, W = window, KEY = 'jsh-follow', SKEY = 'jsh-follow-state', MAX = 2, EVERY = 20000, KEEP = 30 * 60000;
  var get = function(k, d, s){ try { var v = JSON.parse((s || localStorage).getItem(k) || 'null'); return v == null ? d : v; } catch (x) { return d; } };
  var put = function(k, v, s){ try { (s || localStorage).setItem(k, JSON.stringify(v)); } catch (x) {} };
  var LIST = get(KEY, []).filter(function(f){ return f && f.lg && f.eid; }), ST = get(SKEY, {}, sessionStorage);
  var key = function(f){ return f.lg + ':' + f.eid; };
  var esc = function(x){ return String(x == null ? '' : x).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
  var css = ''
    + '#jsh-fw{position:fixed;left:0;right:0;z-index:58;display:flex;flex-direction:column;gap:1px;padding:0 max(8px,env(safe-area-inset-left));'
    + 'background:rgba(9,13,22,.95);border-top:1px solid rgba(255,255,255,.12);box-shadow:0 -10px 30px -12px rgba(0,0,0,.6);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}'
    + '#jsh-fw[hidden]{display:none}'
    + '.fw-g{display:flex;align-items:center;gap:8px;min-height:44px;color:#eef2f8;text-decoration:none;font:600 14px/1.2 Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums}'
    + '.fw-g+.fw-g{border-top:1px solid rgba(255,255,255,.08)}'
    + '.fw-k{flex:none;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#f2c14e;padding:3px 6px;border:1px solid rgba(242,193,78,.45);border-radius:6px}'
    + '.fw-t{display:flex;align-items:center;gap:6px;min-width:0;flex:1 1 auto}'
    + '.fw-t img{width:22px;height:22px;object-fit:contain;flex:none}'
    + '.fw-t i{flex:none;width:9px;height:9px;border-radius:50%}'
    + '.fw-t b{font-weight:800;font-size:15.5px;min-width:1.4em;text-align:center;border-radius:6px;padding:1px 3px;transition:background .6s,color .6s}'
    + '.fw-t b.hit{background:var(--fc,#f2c14e);color:#fff}'
    + '.fw-t span{white-space:nowrap}'
    + '.fw-c{flex:none;font-size:12.5px;color:#aab4c5;white-space:nowrap}'
    + '.fw-p{flex:none;font-size:12px;font-weight:800;padding:2px 7px;border-radius:999px;background:rgba(91,140,255,.18);border:1px solid rgba(91,140,255,.35);white-space:nowrap}'
    + '.fw-x{flex:none;width:36px;height:36px;margin-right:-6px;border:0;background:transparent;color:#aab4c5;font-size:20px;line-height:1;cursor:pointer;border-radius:10px}'
    + '.fw-x:hover{color:#fff;background:rgba(255,255,255,.08)}'
    + '@media (max-width:420px){.fw-k{display:none}.fw-c{font-size:12px}}'
    /* the button on game pages */
    + '.fw-btn{display:inline-flex;align-items:center;gap:6px;margin-top:10px;min-height:36px;padding:6px 14px;border-radius:999px;cursor:pointer;'
    + 'font:700 13px/1 Inter,system-ui,sans-serif;color:var(--ink,#e8eef8);background:transparent;border:1px solid color-mix(in srgb,var(--accent,#5b8cff) 50%,var(--line,#2a3448))}'
    + '.fw-btn.on{background:color-mix(in srgb,#f2c14e 20%,transparent);border-color:#f2c14e;color:var(--ink,#fff)}'
    + '@media (prefers-reduced-motion:reduce){.fw-t b{transition:none}}';

  /* ---------- the button on game pages ---------- */
  function gameId(){ var m = /^#\/(game|gameday)\/([^\/?#]+)/.exec(location.hash); return m ? decodeURIComponent(m[2]) : null; }
  function button(){
    var v = D.getElementById('view'), id = gameId(); if (!v || !id || typeof W.JSH_GAME !== 'function') return;
    var info; try { info = W.JSH_GAME(id); } catch (x) { info = null; }
    if (!info || !info.eid || info.done) return;
    if (v.querySelector('.fw-btn')) { sync(); return; }
    var host = v.querySelector('.ghead .mid') || v.querySelector('.gd-st') || v.querySelector('.ghead'); if (!host) return;
    var b = D.createElement('button'); b.type = 'button'; b.className = 'fw-btn'; b.setAttribute('data-k', key(info)); b._info = info;
    host.appendChild(b); sync();
  }
  function sync(){ D.querySelectorAll('.fw-btn').forEach(function(b){ var on = LIST.some(function(f){ return key(f) === b.getAttribute('data-k'); });
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? '★ Following' : '☆ Follow this game'; }); }
  D.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('.fw-btn');
    if (b) { e.preventDefault(); e.stopPropagation(); var info = b._info; if (!info) return; var k = key(info);
      if (LIST.some(function(f){ return key(f) === k; })) LIST = LIST.filter(function(f){ return key(f) !== k; });
      else { info.added = Date.now(); LIST.push(info); while (LIST.length > MAX) LIST.shift(); }
      put(KEY, LIST); sync(); draw(); poll(true); return; }
    var x = e.target.closest && e.target.closest('.fw-x');
    if (x) { e.preventDefault(); e.stopPropagation(); var kx = x.getAttribute('data-k'); LIST = LIST.filter(function(f){ return key(f) !== kx; }); put(KEY, LIST); sync(); draw(); }
  }, true);

  /* ---------- the scoreboard ---------- */
  var bar = null, spacer = null;
  function lift(){ /* sit just above whatever is pinned to the bottom of the screen (the scores ticker, a hub's tab bar) */
    if (!bar || bar.hidden) return; var top = W.innerHeight, rs = [];
    D.querySelectorAll('body>*,body>*>*').forEach(function(el){ if (el === bar || el === spacer || bar.contains(el) || el.closest('#view')) return; var cs = getComputedStyle(el); if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = el.getBoundingClientRect(); if (r.height < 20 || r.height > 160 || r.width < W.innerWidth * 0.6) return; rs.push(r); });
    /* stack up from the bottom: the tab bar, then the ticker sitting on it, and so on */
    for (var moved = true; moved; ) { moved = false; rs.forEach(function(r){ if (r.bottom >= top - 3 && r.top < top - 1) { top = r.top; moved = true; } }); }
    bar.style.bottom = Math.max(0, Math.round(W.innerHeight - top)) + 'px';
    if (spacer) spacer.style.height = bar.offsetHeight + 'px'; }
  function row(f){
    var s = ST[key(f)] || {}, live = /IN_PROGRESS|HALFTIME|END_PERIOD|DELAYED/.test(s.st || ''), fin = /FINAL/.test(s.st || '');
    var logo = function(src, c){ return src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<i style="background:' + esc(c || '#8a94a0') + '"></i>'; };
    var sc = function(side){ var v = side === 'a' ? s.as : s.hs; return '<b data-s="' + side + '" style="--fc:' + esc(side === 'a' ? f.ac : f.hc) + '">' + (v == null || (!live && !fin) ? '–' : v) + '</b>'; };
    var p = null; if (W.JSHOdds) { if (live && s.pc) p = JSHOdds.prob(f.lg, (+s.hs || 0) - (+s.as || 0), JSHOdds.left(f.lg, s.pc[0], s.pc[1]), f.mu, f.sd); else if (!fin) p = JSHOdds.prob(f.lg, 0, 1, f.mu, f.sd); }
    var pTxt = p == null ? '' : '<span class="fw-p" title="Hub win chance">' + esc(p >= 0.5 ? f.h : f.a) + ' ' + JSHOdds.pc(Math.max(p, 1 - p)) + '</span>';
    var clk = fin ? 'Final' : live ? (s.det || 'Live') : (s.det || 'Not started');
    return '<div class="fw-g" data-k="' + esc(key(f)) + '"><a class="fw-g" style="flex:1 1 auto;min-width:0" href="' + esc(f.href) + '"><span class="fw-k">Following</span><span class="fw-t">' + logo(f.al, f.ac) + '<span>' + esc(f.a) + '</span>' + sc('a') + '<span style="opacity:.5">–</span>' + sc('h') + '<span>' + esc(f.h) + '</span>' + logo(f.hl, f.hc) + '</span><span class="fw-c">' + esc(clk) + '</span>' + pTxt + '</a><button type="button" class="fw-x" data-k="' + esc(key(f)) + '" aria-label="Stop following ' + esc(f.an) + ' at ' + esc(f.hn) + '">×</button></div>'; }
  function draw(flash){
    if (!bar) return;
    var now = Date.now(); LIST = LIST.filter(function(f){ var s = ST[key(f)]; return !(s && s.fin && now - s.fin > KEEP); }); put(KEY, LIST);
    if (!LIST.length) { bar.hidden = true; if (spacer) spacer.style.height = '0px'; return; }
    bar.hidden = false; bar.innerHTML = LIST.map(row).join('');
    (flash || []).forEach(function(x){ var b = bar.querySelector('.fw-g[data-k="' + x.k + '"] b[data-s="' + x.side + '"]'); if (b) { b.classList.add('hit'); setTimeout(function(){ b.classList.remove('hit'); }, 2400); } });
    lift(); }

  /* ---------- live scores ---------- */
  var busy = false, timer = 0;
  function poll(now){
    clearTimeout(timer); if (!LIST.length) return;
    if (D.hidden && !now) { timer = setTimeout(poll, EVERY); return; }
    if (busy) return; busy = true;
    Promise.all(LIST.map(function(f){
      var s = ST[key(f)] || {}; if (s.fin) return null;
      /* on the game's own hub, use the numbers the page itself shows (ESPN's game-detail feed can lag its scoreboard) */
      var hub = null; if (f.gid && location.pathname.indexOf('/' + f.lg + '/') === 0 && typeof W.JSH_GAME === 'function') { try { hub = W.JSH_GAME(f.gid); } catch (x) { hub = null; } }
      if (hub && hub.live && hub.as != null && hub.hs != null && W.JSHOdds) {
        var w = JSHOdds.fromDet(hub.det, hub.per, f.lg), m = {st: 'IN_PROGRESS', det: hub.det || 'Live', pc: [w.per, w.sec], as: +hub.as, hs: +hub.hs, t: Date.now()};
        var hh = []; if (s.as != null && m.as > s.as) hh.push({k: key(f), side: 'a'}); if (s.hs != null && m.hs > s.hs) hh.push({k: key(f), side: 'h'});
        ST[key(f)] = m; return Promise.resolve(hh); }
      return fetch('/api/' + f.lg + '/game?event=' + encodeURIComponent(f.eid), {cache: 'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
        if (!j) return null; var ls = j.ls || [], H = ls.filter(function(c){ return c.ha === 'home'; })[0] || {}, A = ls.filter(function(c){ return c.ha === 'away'; })[0] || {};
        var n = {st: String(j.st || ''), det: j.det || '', pc: j.pc || null, as: A.s != null ? +A.s : null, hs: H.s != null ? +H.s : null, t: Date.now()};
        if (/FINAL/.test(n.st)) n.fin = s.fin || Date.now();
        var hits = []; if (s.as != null && n.as != null && n.as > s.as) hits.push({k: key(f), side: 'a'}); if (s.hs != null && n.hs != null && n.hs > s.hs) hits.push({k: key(f), side: 'h'});
        ST[key(f)] = n; return hits; }).catch(function(){ return null; });
    })).then(function(rs){ busy = false; put(SKEY, ST, sessionStorage); draw([].concat.apply([], rs.filter(Boolean))); timer = setTimeout(poll, EVERY); });
  }

  function start(){
    var s = D.createElement('style'); s.id = 'jsh-follow'; s.textContent = css; (D.head || D.documentElement).appendChild(s);
    bar = D.createElement('div'); bar.id = 'jsh-fw'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Games you follow'); bar.hidden = true; D.body.appendChild(bar);
    spacer = D.createElement('div'); spacer.id = 'jsh-fw-sp'; spacer.setAttribute('aria-hidden', 'true'); D.body.appendChild(spacer);
    draw(); poll(true);
    W.addEventListener('resize', lift); setInterval(lift, 4000);
    D.addEventListener('visibilitychange', function(){ if (!D.hidden) poll(true); });
    W.addEventListener('storage', function(e){ if (e.key === KEY) { LIST = get(KEY, []); sync(); draw(); poll(true); } });
    var v = D.getElementById('view');
    if (v) { var q = 0; new MutationObserver(function(){ if (!q) q = setTimeout(function(){ q = 0; button(); }, 120); }).observe(v, {childList: true, subtree: true}); button(); }
  }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* follow:end */
