/* gameday:start - Game day (CFB) + Game night (NBA) enhance (2026-11-24).
   Night wash + HUD on the jumbotron, TV/couch mode, and focus cycling for the "now" strip.
   Still backdrop only — no beams, grids, or aurora. Reduced-motion: still styles, no cycle. */
(function () {
  if (window.__jshGameday) return; window.__jshGameday = true;
  var D = document, H = D.documentElement, W = window, B = D.body;
  var path = location.pathname || '';
  var CFB = /\/cfb\/?$/.test(path) || path.indexOf('/cfb/') === 0;
  var NBA = /\/nba\/?$/.test(path) || path.indexOf('/nba/') === 0;
  if (!CFB && !NBA) return;
  var RM = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var SK = 'jsh-gd-tv';
  var ROT = 5200;
  var timer = 0, paused = false;

  function isArm() {
    var h = location.hash || '';
    return (CFB && /^#\/gameday(\/|$)/.test(h)) || (NBA && /^#\/gamenight(\/|$)/.test(h));
  }

  var css = ''
    + 'html.jsh-gd-night.jsh-dk body::before{background:'
    +   'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'g\' x=\'0\' y=\'0\' width=\'100%25\' height=\'100%25\' color-interpolation-filters=\'sRGB\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix values=\'2 0 0 0 -.5 2 0 0 0 -.5 2 0 0 0 -.5 0 0 0 0 .028\'/%3E%3C/filter%3E%3Crect width=\'160\' height=\'160\' filter=\'url(%23g)\'/%3E%3C/svg%3E") 0 0/160px 160px repeat,'
    +   'radial-gradient(120% 70% at 0% 0%,rgba(52,108,255,.18) 0%,transparent 55%),'
    +   'radial-gradient(110% 65% at 100% 0%,rgba(225,29,72,.12) 0%,transparent 50%),'
    +   'linear-gradient(180deg,#060814 0%,#05070f 45%,#03050a 100%)!important}'
    + 'html.jsh-gd-night.jsh-lt body::before{background:'
    +   'radial-gradient(120% 70% at 0% 0%,rgba(52,108,255,.10) 0%,transparent 55%),'
    +   'radial-gradient(100% 60% at 100% 0%,rgba(225,29,72,.07) 0%,transparent 50%),'
    +   'linear-gradient(180deg,#e8ecf6 0%,#e2e7f2 55%,#dce2ef 100%)!important}'
    /* HUD L-brackets on jumbotron (no radius so marks are not clipped) */
    + '.jt.jsh-framed{position:relative;--jsh-fr:rgba(255,255,255,.7)}'
    + '.jt.jsh-framed::after{content:"";position:absolute;pointer-events:none;border-radius:0;z-index:6;'
    +   'background:'
    +     'linear-gradient(var(--jsh-fr),var(--jsh-fr)) top left/22px 2px no-repeat,'
    +     'linear-gradient(var(--jsh-fr),var(--jsh-fr)) top left/2px 22px no-repeat,'
    +     'linear-gradient(var(--jsh-fr),var(--jsh-fr)) top right/22px 2px no-repeat,'
    +     'linear-gradient(var(--jsh-fr),var(--jsh-fr)) top right/2px 22px no-repeat,'
    +     'linear-gradient(var(--jsh-fr),var(--jsh-fr)) bottom left/22px 2px no-repeat,'
    +     'linear-gradient(var(--jsh-fr),var(--jsh-fr)) bottom left/2px 22px no-repeat,'
    +     'linear-gradient(var(--jsh-fr),var(--jsh-fr)) bottom right/22px 2px no-repeat,'
    +     'linear-gradient(var(--jsh-fr),var(--jsh-fr)) bottom right/2px 22px no-repeat;'
    +   'opacity:.85}'
    /* CFB classic board: marquee at top of the box */
    + '.jt.jf.jsh-framed:not(.les)::after{inset:40px 14px 14px 14px}'
    /* CFB LaVell Edwards board: crown on top, royal-blue ribbon at bottom */
    + '.jt.les.jsh-framed::after{inset:56px 16px 44px 16px}'
    /* NBA Delta Center board: marquee ribbon under the fascia */
    + '.jt.dcj.jsh-framed::after{inset:14px 14px 42px 14px}'
    + '.jt.is-live.jsh-framed{--jsh-fr:rgba(255,150,170,.95)}'
    /* now strip — sticky only in TV mode so hub tabs stay clear */
    + '.gd-now,.gn-now{position:relative;z-index:5;margin:10px 0 14px;padding:12px 14px;border-radius:16px;'
    +   'background:rgba(8,12,22,.72);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);'
    +   'box-shadow:0 16px 40px -24px rgba(0,0,0,.85)}'
    + 'html.jsh-lt .gd-now,html.jsh-lt .gn-now{background:rgba(255,255,255,.88);border-color:rgba(15,23,42,.12);box-shadow:0 12px 28px -20px rgba(15,23,42,.35)}'
    + '.gd-now-chips,.gn-now-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}'
    + '.gd-now .chip,.gn-now .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;'
    +   'font-size:13px;font-weight:700;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#eef3ff}'
    + 'html.jsh-lt .gd-now .chip,html.jsh-lt .gn-now .chip{background:rgba(15,23,42,.05);border-color:rgba(15,23,42,.12);color:#0f172a}'
    + '.gd-now .chip.live,.gn-now .chip.live{background:rgba(255,77,106,.22);border-color:rgba(255,120,140,.5);color:#ffb3c0}'
    + '.gd-now .chip.rz,.gn-now .chip.hot{background:rgba(255,77,106,.18);border-color:rgba(255,120,140,.45)}'
    + '.gd-now .chip.win,.gn-now .chip.win{background:rgba(52,108,255,.18);border-color:rgba(120,160,255,.4)}'
    + '.gd-now-focus,.gn-now-focus{display:none;min-height:3.2em;margin-bottom:8px}'
    + '.gd-now-panel,.gn-now-panel{display:none;font-family:var(--disp,inherit);font-size:clamp(20px,3.2vw,32px);font-weight:800;letter-spacing:-.02em;line-height:1.2;color:#fff}'
    + 'html.jsh-lt .gd-now-panel,html.jsh-lt .gn-now-panel{color:#0f172a}'
    + '.gd-now-panel.on,.gn-now-panel.on{display:block}'
    + '.gd-now-panel small,.gn-now-panel small{display:block;margin-top:4px;font-size:13px;font-weight:600;letter-spacing:.04em;opacity:.7}'
    /* TV bar */
    + '.jsh-gd-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:8px 0 4px}'
    + '.jsh-gd-bar .jsh-gd-tvbtn{appearance:none;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;'
    +   'border-radius:999px;padding:8px 14px;font:inherit;font-size:13px;font-weight:800;cursor:pointer}'
    + 'html.jsh-lt .jsh-gd-bar .jsh-gd-tvbtn{border-color:rgba(15,23,42,.2);background:rgba(15,23,42,.06);color:#0f172a}'
    + '.jsh-gd-bar .jsh-gd-tvbtn.on{background:rgba(255,77,106,.25);border-color:rgba(255,120,140,.55)}'
    + '.jsh-gd-cycle{display:none;align-items:center;gap:8px;margin-left:auto;font-size:12.5px;font-weight:700;color:rgba(255,255,255,.7)}'
    + 'body.jsh-gd-tv .jsh-gd-cycle{display:inline-flex}'
    + '.jsh-gd-cycle button{appearance:none;border:1px solid rgba(255,255,255,.22);background:transparent;color:inherit;border-radius:999px;padding:5px 10px;font:inherit;font-weight:700;cursor:pointer}'
    /* TV / couch mode */
    + 'body.jsh-gd-tv{overflow-x:hidden}'
    + 'body.jsh-gd-tv .jsh,body.jsh-gd-tv .jbl,body.jsh-gd-tv .jbl-pill,body.jsh-gd-tv .top,body.jsh-gd-tv .asof,'
    + 'body.jsh-gd-tv .ticker,body.jsh-gd-tv .btm,body.jsh-gd-tv .fin-wrap,body.jsh-gd-tv #fin-wrap,'
    + 'body.jsh-gd-tv .tabs,body.jsh-gd-tv .subnav,body.jsh-gd-tv nav.tabs{display:none!important}'
    + 'body.jsh-gd-tv.jbl-on{padding-bottom:0!important}'
    + 'body.jsh-gd-tv main,body.jsh-gd-tv #view{max-width:none;padding:12px 18px 28px;overflow-x:hidden}'
    + 'body.jsh-gd-tv .back,body.jsh-gd-tv .eyebrow,body.jsh-gd-tv .gd-links,body.jsh-gd-tv .gn-links,'
    + 'body.jsh-gd-tv .gd-col,body.jsh-gd-tv .gside,body.jsh-gd-tv .grid.g2,body.jsh-gd-tv .card,'
    + 'body.jsh-gd-tv .uni-strip,body.jsh-gd-tv .rv-card,body.jsh-gd-tv .wx127,body.jsh-gd-tv .dt-card,'
    + 'body.jsh-gd-tv .sec{display:none!important}'
    + 'body.jsh-gd-tv .gd-now,body.jsh-gd-tv .gn-now{position:sticky;top:8px;z-index:30}'
    + 'body.jsh-gd-tv .gd-now-chips,body.jsh-gd-tv .gn-now-chips{opacity:.85}'
    + 'body.jsh-gd-tv .gd-now-focus,body.jsh-gd-tv .gn-now-focus{display:block}'
    + 'body.jsh-gd-tv .jt-score,body.jsh-gd-tv .dc-sc{font-size:clamp(64px,12vw,120px)!important}'
    + 'body.jsh-gd-tv .jt-per,body.jsh-gd-tv .jt-clock{font-size:clamp(26px,4.5vw,44px)!important}'
    + 'body.jsh-gd-tv .wpb,body.jsh-gd-tv .gn-wp,body.jsh-gd-tv .wo{max-width:100%}'
    + '@media (prefers-reduced-motion:no-preference){'
    +   '.jt.is-live.jsh-framed{animation:jshGdBreathe 3.2s ease-in-out infinite}'
    +   '@keyframes jshGdBreathe{0%,100%{filter:brightness(1)}50%{filter:brightness(1.05)}}'
    +   'html.jsh-gd-night .pill-live::before,html.jsh-gd-night .livedot{animation:jshGdDot 1.6s ease-out infinite!important}'
    +   '@keyframes jshGdDot{0%{opacity:1;box-shadow:0 0 0 0 rgba(255,77,106,.55)}70%,100%{opacity:.55;box-shadow:0 0 0 7px rgba(255,77,106,0)}}'
    +   'body.jsh-gd-tv .jt{transition:filter .5s ease,transform .5s ease}'
    +   'body.jsh-gd-tv .gd-now-panel.on,body.jsh-gd-tv .gn-now-panel.on{animation:jshGdFocus .55s cubic-bezier(.2,.8,.2,1)}'
    +   '@keyframes jshGdFocus{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}'
    +   'body.jsh-gd-tv .jsh-gd-tvbtn.on{box-shadow:0 0 20px -4px rgba(255,77,106,.55)}'
    + '}'
    + '@media (prefers-reduced-motion:reduce){.jt.is-live.jsh-framed,body.jsh-gd-tv .gd-now-panel.on,body.jsh-gd-tv .gn-now-panel.on{animation:none!important}}';

  var st = D.createElement('style'); st.id = 'jsh-gameday-css'; st.textContent = css; (D.head || H).appendChild(st);

  function tvOn() { return !!(B && B.classList.contains('jsh-gd-tv')); }
  function setTv(on) {
    if (!B) return;
    B.classList.toggle('jsh-gd-tv', !!on);
    try { sessionStorage.setItem(SK, on ? '1' : '0'); } catch (e) {}
    var btn = D.querySelector('.jsh-gd-tvbtn');
    if (btn) { btn.classList.toggle('on', !!on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.textContent = on ? 'Exit TV mode' : 'TV mode'; }
    if (on) wake(true); else if (!isLive()) wake(false);
    startCycle();
  }
  function isLive() { return !!(D.querySelector('.jt.is-live') || D.querySelector('.gd-now .chip.live') || D.querySelector('.gn-now .chip.live')); }

  var wakeLock = null;
  function wake(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock && !D.hidden) {
        navigator.wakeLock.request('screen').then(function (l) {
          wakeLock = l; l.addEventListener('release', function () { wakeLock = null; });
        }).catch(function () {});
      } else if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }

  function panels() {
    return Array.prototype.slice.call(D.querySelectorAll('.gd-now-panel, .gn-now-panel'));
  }
  function showPanel(i) {
    var ps = panels(); if (!ps.length) return;
    ps.forEach(function (p, n) { p.classList.toggle('on', n === i); });
  }
  function nextPanel() {
    var ps = panels(); if (ps.length < 2) return;
    var i = ps.findIndex(function (p) { return p.classList.contains('on'); });
    showPanel((i + 1) % ps.length);
  }
  function startCycle() {
    clearInterval(timer); timer = 0;
    if (!tvOn() || RM.matches || paused || !isLive()) return;
    var ps = panels(); if (ps.length < 2) return;
    timer = setInterval(function () { if (!paused) nextPanel(); }, ROT);
  }

  function ensureBar() {
    if (!isArm()) return;
    var view = D.getElementById('view') || D.querySelector('main') || B;
    if (!view) return;
    var jt = view.querySelector('.jt');
    if (!jt) return;
    jt.classList.add('jsh-framed');
    if (!view.querySelector('.jsh-gd-bar')) {
      var bar = D.createElement('div');
      bar.className = 'jsh-gd-bar';
      bar.innerHTML = '<button type="button" class="jsh-gd-tvbtn" aria-pressed="false">TV mode</button>'
        + '<span class="jsh-gd-cycle"><button type="button" data-gd-cycle="prev" aria-label="Previous focus">‹</button>'
        + '<button type="button" data-gd-cycle="pause" aria-label="Pause focus rotation">Pause</button>'
        + '<button type="button" data-gd-cycle="next" aria-label="Next focus">›</button></span>';
      var now = view.querySelector('.gd-now, .gn-now');
      if (now) now.insertAdjacentElement('beforebegin', bar);
      else jt.insertAdjacentElement('beforebegin', bar);
    }
    try { if (sessionStorage.getItem(SK) === '1') setTv(true); } catch (e) {}
    startCycle();
  }

  function arm() {
    if (!isArm()) {
      H.classList.remove('jsh-gd-night');
      if (B) B.classList.remove('jsh-gd-tv');
      wake(false); clearInterval(timer); timer = 0;
      return;
    }
    H.classList.add('jsh-gd-night');
    ensureBar();
  }

  D.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.jsh-gd-tvbtn');
    if (t) { e.preventDefault(); setTv(!tvOn()); return; }
    var c = e.target.closest && e.target.closest('[data-gd-cycle]');
    if (!c) return;
    e.preventDefault();
    var k = c.getAttribute('data-gd-cycle');
    if (k === 'pause') {
      paused = !paused;
      c.textContent = paused ? 'Play' : 'Pause';
      startCycle();
    } else if (k === 'next') { nextPanel(); }
    else if (k === 'prev') {
      var ps = panels(); if (!ps.length) return;
      var i = ps.findIndex(function (p) { return p.classList.contains('on'); });
      showPanel((i - 1 + ps.length) % ps.length);
    }
  });

  W.addEventListener('hashchange', arm);
  D.addEventListener('visibilitychange', function () { if (D.hidden) wake(false); else if (tvOn() || isLive()) wake(true); });

  var q = 0;
  function soon() { if (!q) q = setTimeout(function () { q = 0; arm(); }, 80); }
  function start() {
    arm();
    if (W.MutationObserver) new MutationObserver(soon).observe(D.body, { childList: true, subtree: true });
  }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* gameday:end */
