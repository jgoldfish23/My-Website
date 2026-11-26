/* night:start - Live night feel (2026-11-24, Jamo: "more motion / live night feel", "fun and clean futuristic").
   Loaded by hubbar on every page; only arms on the Live Center and the home page. Adds motion and depth on top of
   Stage's still gradient — no beams, no grids, no aurora. Reduced-motion users get still styles only. */
(function () {
  if (window.__jshNight) return; window.__jshNight = true;
  var D = document, H = D.documentElement, W = window;
  var path = location.pathname || '';
  var LIVE = /\/sports\/live\/?$/.test(path);
  var HOME = /\/sports\/?(index\.html)?$/.test(path) || path.endsWith('/sports/index.html');
  if (!LIVE && !HOME) return;
  var RM = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var css = ''
    /* ---------- Live Center: deeper still night wash (static; no beams/grids) ---------- */
    + 'html.jsh-night:not(.light) body::before{background:'
    +   'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'g\' x=\'0\' y=\'0\' width=\'100%25\' height=\'100%25\' color-interpolation-filters=\'sRGB\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix values=\'2 0 0 0 -.5 2 0 0 0 -.5 2 0 0 0 -.5 0 0 0 0 .032\'/%3E%3C/filter%3E%3Crect width=\'160\' height=\'160\' filter=\'url(%23g)\'/%3E%3C/svg%3E") 0 0/160px 160px repeat,'
    +   'radial-gradient(120% 75% at 0% 0%,rgba(52,108,255,.20) 0%,rgba(52,108,255,.07) 45%,rgba(52,108,255,0) 75%),'
    +   'radial-gradient(110% 70% at 100% 0%,rgba(225,29,72,.14) 0%,rgba(146,86,255,.10) 40%,rgba(146,86,255,0) 75%),'
    +   'radial-gradient(90% 50% at 50% 110%,rgba(255,77,106,.10) 0%,transparent 60%),'
    +   'linear-gradient(180deg,#060814 0%,#05070f 42%,#03050a 100%)!important}'
    /* Live Center in light theme: cool evening wash so night motion still reads */
    + 'html.jsh-night.light body::before{background:'
    +   'radial-gradient(120% 70% at 0% 0%,rgba(52,108,255,.12) 0%,transparent 55%),'
    +   'radial-gradient(100% 60% at 100% 0%,rgba(225,29,72,.08) 0%,transparent 50%),'
    +   'linear-gradient(180deg,#e8ecf6 0%,#e2e7f2 50%,#dce2ef 100%)!important}'
    /* spotlight HUD corners (clean futuristic L-brackets; no radius so marks are not clipped) */
    + '.spot.jsh-framed{--jsh-fr:rgba(255,255,255,.72)}'
    + '.spot.jsh-framed::after{content:"";position:absolute;inset:14px;pointer-events:none;border-radius:0;z-index:2;'
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
    + '.spot.must{--jsh-fr:rgba(255,150,170,.95)}'
    /* must-watch cards: soft live edge pulse (heat ≥ 70) */
    + '@media (prefers-reduced-motion:no-preference){'
    +   '.mc.must{animation:jshMust 2.6s ease-in-out infinite}'
    +   '@keyframes jshMust{0%,100%{box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--hc,#ff4d6a) 55%,transparent),0 8px 28px -12px color-mix(in srgb,var(--hc,#ff4d6a) 55%,transparent)}'
    +     '50%{box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--hc,#ff4d6a) 85%,transparent),0 10px 36px -8px color-mix(in srgb,var(--hc,#ff4d6a) 75%,transparent)}}'
    +   '.spot.must{animation:jshSpotBreathe 3.2s ease-in-out infinite}'
    +   '@keyframes jshSpotBreathe{0%,100%{filter:brightness(1)}50%{filter:brightness(1.06)}}'
    +   '.heat.must{animation:jshHeat 1.8s ease-in-out infinite;text-shadow:0 0 12px color-mix(in srgb,currentColor 70%,transparent)}'
    +   '@keyframes jshHeat{50%{filter:brightness(1.25);transform:scale(1.04)}}'
    +   '.mc-heat{animation:jshHeatBar 2.2s ease-in-out infinite}'
    +   '@keyframes jshHeatBar{50%{box-shadow:0 0 18px var(--hc),0 0 4px var(--hc)}}'
    +   '.feed li.new a{animation:jshFeedIn .55s cubic-bezier(.2,.8,.2,1),fdin 1.2s ease}'
    +   '@keyframes jshFeedIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}'
    +   '.mwp i,.wp-bar i{transition:flex-grow .55s ease,width .55s ease,flex-basis .55s ease}'
    +   'html.jsh-night .pill-live::before,html.jsh-home-night .pill-live::before{box-shadow:0 0 0 0 rgba(255,255,255,.7);animation:jshLiveDot 1.6s ease-out infinite!important}'
    +   '@keyframes jshLiveDot{0%{opacity:1;box-shadow:0 0 0 0 rgba(255,255,255,.55)}40%{opacity:1}70%,100%{opacity:.55;box-shadow:0 0 0 7px rgba(255,255,255,0)}}'
    /* home: live favorite cards + hot live row */
    +   '.fd a.tc:has(.pill-live){animation:jshTcLive 2.8s ease-in-out infinite}'
    +   '@keyframes jshTcLive{0%,100%{box-shadow:0 18px 40px -22px rgba(0,0,0,.85),0 0 0 1px rgba(255,77,106,.35)}'
    +     '50%{box-shadow:0 22px 48px -18px rgba(0,0,0,.9),0 0 0 1px rgba(255,77,106,.7),0 0 28px -6px rgba(255,77,106,.55)}}'
    +   '.fd a.tc:has(.pill-live) .tc-sc{text-shadow:0 0 16px rgba(255,255,255,.35)}'
    +   '.fd .lc.hot{animation:jshLcHot 2.5s ease-in-out infinite}'
    +   '@keyframes jshLcHot{50%{box-shadow:inset 0 0 0 1.5px rgba(255,92,92,.75),0 8px 28px -8px rgba(255,70,70,.75)}}'
    +   '.fd .tc-sig .wo{animation:jshWoPulse 2.4s ease-in-out infinite}'
    +   '@keyframes jshWoPulse{50%{border-color:rgba(157,245,193,.7);box-shadow:0 0 10px -2px rgba(157,245,193,.5)}}'
    /* Live Center TV mode: soft ambient breathe + spotlight glass */
    +   'body.livetv .tvd .spot{animation:jshTvSpot 4s ease-in-out infinite}'
    +   '@keyframes jshTvSpot{0%,100%{filter:brightness(1)}50%{filter:brightness(1.045)}}'
    +   'body.livetv .tvd .st-s{text-shadow:0 0 28px rgba(255,255,255,.18),0 8px 30px rgba(0,0,0,.45)}'
    +   'body.livetv .tvd .spot-mid .clk{animation:jshTvClk 2.8s ease-in-out infinite}'
    +   '@keyframes jshTvClk{50%{text-shadow:0 0 22px rgba(255,77,106,.7)}}'
    +   'body.livetv .tvbar{animation:jshTvBar 5s ease-in-out infinite alternate}'
    +   '@keyframes jshTvBar{from{border-color:rgba(255,255,255,.1)}to{border-color:rgba(140,180,255,.28)}}'
    +   'html.jsh-night .lvf button.on{box-shadow:0 10px 30px -10px rgba(255,70,90,.9),0 0 0 1px rgba(255,255,255,.12)}'
    +   'html.jsh-night .spot{box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 44px 100px -56px rgba(0,0,0,.95),0 0 0 1px rgba(120,160,255,.14)}'
    + '}'
    + '@media (prefers-reduced-motion:reduce){.mc.must,.spot.must,.heat.must,.mc-heat,.fd a.tc:has(.pill-live),.fd .lc.hot,.fd .tc-sig .wo,body.livetv .tvd .spot,body.livetv .tvd .spot-mid .clk,body.livetv .tvbar{animation:none!important}}';

  var st = D.createElement('style'); st.id = 'jsh-night-css'; st.textContent = css; (D.head || H).appendChild(st);

  function armLive() {
    if (!LIVE) return;
    H.classList.add('jsh-night');
    var spot = D.getElementById('spot') && D.getElementById('spot').querySelector('.spot');
    if (spot) spot.classList.add('jsh-framed');
    D.querySelectorAll('.mc').forEach(function (el) {
      var bar = el.querySelector('.mc-heat');
      var hv = bar ? parseFloat(getComputedStyle(bar).getPropertyValue('--hv')) : 0;
      if (!(hv > 0)) {
        var m = /--hv:\s*([\d.]+)/.exec(bar && bar.getAttribute('style') || '');
        hv = m ? +m[1] : 0;
      }
      var must = hv >= 70 || el.classList.contains('hot');
      el.classList.toggle('must', !!must);
      if (must && bar) {
        var hc = (bar.getAttribute('style') || '').match(/--hc:([^;]+)/);
        if (hc) el.style.setProperty('--hc', hc[1].trim());
      }
    });
    D.querySelectorAll('.spot .heat, .spot-top .heat').forEach(function (h) {
      var n = parseInt((h.textContent || '').replace(/\D/g, ''), 10);
      h.classList.toggle('must', n >= 70);
      var spotEl = h.closest('.spot');
      if (spotEl) spotEl.classList.toggle('must', n >= 70 || /Overtime|Must-watch|Tied in the 4th|One-score/i.test(spotEl.textContent || ''));
    });
  }

  function armHome() {
    if (!HOME) return;
    H.classList.add('jsh-home-night');
  }

  var q = 0;
  function soon() { if (!q) q = setTimeout(function () { q = 0; armLive(); armHome(); }, 100); }
  function start() {
    armLive(); armHome();
    if (W.MutationObserver) new MutationObserver(soon).observe(D.body, { childList: true, subtree: true });
  }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* night:end */
