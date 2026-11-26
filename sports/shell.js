/* shell:start - App shell (2026-11-24, Jamo: "let's do all of it").
   Phone dock (Home, Live, your college team, your NBA team), a short night splash when opened from the home-screen icon,
   and a framed night hero on every #/game page (the "now" strip was dropped 11-26: it only repeated the score). Still gradients only. Reduced motion: no splash motion. */
(function () {
  if (window.__jshShell) return; window.__jshShell = true;
  var D = document, H = D.documentElement, W = window;
  var RM = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var standalone = false;
  try { standalone = (W.matchMedia && W.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}

  var css = ''
    + '.jsh-dock{display:none}'
    + '@media (max-width:760px){'
    +   '.jsh-dock{display:none!important}'
    +   '.jsh-nav{display:none!important}'
    +   'html.jsh-nav-open .jsh{z-index:80}'
    +   'html.jsh-nav-open .jsh-nav{display:flex!important;position:absolute;left:0;right:0;top:100%;z-index:80;'
    +     'flex-wrap:wrap;gap:6px;margin:0;padding:8px 10px 10px;overflow:visible;'
    +     'background:#120e0a;border-bottom:1px solid rgba(255,255,255,.14)}'
    +   'html.jsh-nav-open .jsh-nav a,html.jsh-nav-open .jsh-nav a:not(.on){font-size:13px!important;gap:6px!important;padding:0 12px!important;height:34px}'
    +   'html.jsh-thanks.light.jsh-nav-open .jsh-nav,html.jsh-thanks[data-theme="light"].jsh-nav-open .jsh-nav{background:#f6e0bc;border-bottom-color:rgba(140,70,20,.28)}'
    +   'html.jsh-thanks.light.jsh-nav-open .jsh-nav a,html.jsh-thanks[data-theme="light"].jsh-nav-open .jsh-nav a{color:#3a2412!important}'
    +   'html.jsh-glance .jsh-gl{background:rgba(255,255,255,.1);color:#dfe6f3}'
    +   'html.jsh-nav-open .jsh-gl{background:#f2c14e;color:#1d1405}'
    +   'body:not(.has-btab) .jbl{bottom:0!important;left:0!important;right:0!important;border-radius:0!important}'
    + '}'
    + '@media (max-width:760px) and (prefers-reduced-motion:no-preference){'
    +   '.jsh-dock a.pulse i{animation:jshDock 1.6s ease-out infinite}'
    +   '@keyframes jshDock{70%,100%{box-shadow:0 0 0 6px rgba(255,77,106,0)}}'
    + '}'
    + '.jsh-splash{position:fixed;inset:0;z-index:200;display:grid;place-items:center;color:#fff;'
    +   'background:radial-gradient(80% 55% at 50% 38%,#2e2e2e,transparent 62%),'
    +   'linear-gradient(180deg,#0a0a0a,#000)}'
    + '.jsh-splash b{display:block;margin-top:10px;font:800 22px/1.1 Inter Tight,Inter,system-ui,sans-serif;letter-spacing:-.03em}'
    + '.jsh-splash span{display:block;margin-top:6px;font:600 13px/1.3 Inter,system-ui,sans-serif;color:#a1a1aa}'
    + '.jsh-splash img{width:64px;height:64px;border-radius:16px;box-shadow:0 12px 30px -12px rgba(0,0,0,.8)}'
    + '@media (prefers-reduced-motion:no-preference){.jsh-splash{animation:jshSplash .9s ease both}'
    +   '@keyframes jshSplash{0%{opacity:1}70%{opacity:1}100%{opacity:0;visibility:hidden}}}'
    /* game pages: night hero + bigger score */
    + 'html.jsh-game.jsh-dk body::before{background:'
    +   'radial-gradient(120% 70% at 0% 0%,rgba(52,108,255,.16) 0%,transparent 55%),'
    +   'radial-gradient(100% 60% at 100% 0%,rgba(225,29,72,.1) 0%,transparent 50%),'
    +   'linear-gradient(180deg,#060814,#03050a)!important}'
    + 'html.jsh-game #view>.ghead{position:relative;border-radius:22px;overflow:hidden}'
    + 'html.jsh-game.jsh-dk #view>.ghead{color:#fff;border-color:rgba(255,255,255,.14);'
    +   'box-shadow:0 28px 60px -32px rgba(0,0,0,.9)}'
    + 'html.jsh-game.jsh-dk #view>.ghead .rec,html.jsh-game.jsh-dk #view>.ghead .when,html.jsh-game.jsh-dk #view>.ghead .mid{color:#d5def0}'
    + 'html.jsh-game #view>.ghead .mid .sc,html.jsh-game #view>.ghead .sc{font-size:clamp(42px,9vw,72px)!important;font-weight:800;letter-spacing:-.03em;line-height:1}'
    + 'html.jsh-game #view>.ghead.jsh-framed::after{content:"";position:absolute;inset:14px;pointer-events:none;z-index:3;'
    +   'background:linear-gradient(#fff,#fff) top left/18px 2px no-repeat,linear-gradient(#fff,#fff) top left/2px 18px no-repeat,'
    +   'linear-gradient(#fff,#fff) top right/18px 2px no-repeat,linear-gradient(#fff,#fff) top right/2px 18px no-repeat,'
    +   'linear-gradient(#fff,#fff) bottom left/18px 2px no-repeat,linear-gradient(#fff,#fff) bottom left/2px 18px no-repeat,'
    +   'linear-gradient(#fff,#fff) bottom right/18px 2px no-repeat,linear-gradient(#fff,#fff) bottom right/2px 18px no-repeat;opacity:.55}'
    + '';

  var st = D.createElement('style'); st.id = 'jsh-shell-css'; st.textContent = css; (D.head || H).appendChild(st);

  /* the theme the page is really in (11-26): html gets jsh-lt or jsh-dk. The hubs mark light with data-theme="light", the
     home page and Live Center with the .light class, and "auto" marks neither and follows the phone - rules that only
     checked .light painted the night look (white text) on light hub pages. Same test as the theme button in hubbar.html. */
  var hubPage = /^\/(cfb|nfl|nba|cbb)(\/|$)/i.test(location.pathname || '');
  var mqLight = W.matchMedia ? W.matchMedia('(prefers-color-scheme: light)') : { matches: false };
  function themeMark() {
    var t = H.getAttribute('data-theme'), lt = hubPage ? (t ? t === 'light' : !!mqLight.matches) : (H.classList.contains('light') || t === 'light');
    if (H.classList.contains('jsh-lt') !== lt) H.classList.toggle('jsh-lt', lt);
    if (H.classList.contains('jsh-dk') !== !lt) H.classList.toggle('jsh-dk', !lt);
  }
  themeMark();
  if (W.MutationObserver) new MutationObserver(themeMark).observe(H, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  if (mqLight.addEventListener) mqLight.addEventListener('change', themeMark);
  W.JSH_THEME = { mark: themeMark };

  function favOf(key) {
    try { var o = JSON.parse(localStorage.getItem(key) || 'null'); return o && o.fav ? String(o.fav) : ''; } catch (e) { return ''; }
  }
  function dock() {
    if (D.querySelector('.jsh-dock')) return;
    var cfb = favOf('cfb-settings'), nba = favOf('nba-settings');
    var cfbName = cfb ? (cfb.length > 10 ? 'CFB' : cfb) : 'CFB';
    var nbaName = !nba ? 'NBA' : (nba === 'UTAH' ? 'Jazz' : (nba.length > 6 ? 'NBA' : nba));
    var nav = D.createElement('nav');
    nav.className = 'jsh-dock';
    nav.setAttribute('aria-label', 'Your app');
    nav.innerHTML = ''
      + '<a data-k="home" href="/sports/#yt" style="--c:#7cb6ff"><i></i><span>Home</span></a>'
      + '<a data-k="live" href="/sports/live/" style="--c:#ff4d6a"><i></i><span>Live</span></a>'
      + '<a data-k="byu" data-fav="' + cfb.replace(/"/g, '') + '" href="' + (cfb ? '/cfb/#/team/' + encodeURIComponent(cfb) : '/cfb/#/settings') + '" style="--c:#002e5d"><i></i><span>' + cfbName + '</span></a>'
      + '<a data-k="jazz" data-fav="' + nba.replace(/"/g, '') + '" href="' + (nba ? '/nba/#/team/' + encodeURIComponent(nba) : '/nba/#/settings') + '" style="--c:#002b5c"><i></i><span>' + nbaName + '</span></a>';
    D.body.appendChild(nav);
    mark();
  }
  function mark() {
    var p = location.pathname || '', h = location.hash || '', hd = h;
    try { hd = decodeURIComponent(h); } catch (e) {}
    var cfb = favOf('cfb-settings'), nba = favOf('nba-settings');
    var k = /\/sports\/live/.test(p) ? 'live'
      : (/\/cfb/.test(p) && cfb && (hd.indexOf(cfb) !== -1 || (cfb === 'BYU' && /gameday/i.test(h)))) ? 'byu'
      : (/\/nba/.test(p) && nba && (hd.indexOf(nba) !== -1 || (nba === 'UTAH' && /gamenight/i.test(h)))) ? 'jazz'
      : /\/sports\/?$/.test(p) || /\/sports\/index/.test(p) ? 'home' : '';
    D.querySelectorAll('.jsh-dock a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-k') === k); });
  }
  function sideIs(side, name) {
    if (!side || !name) return false;
    return side.ab === name || side.n === name || side.t === name;
  }
  function armLive(games) {
    games = games || [];
    var live = games.filter(function (g) { return g && g.st === 'in'; });
    var L = D.querySelector('.jsh-dock a[data-k="live"]');
    var B = D.querySelector('.jsh-dock a[data-k="byu"]');
    var J = D.querySelector('.jsh-dock a[data-k="jazz"]');
    var cfb = B ? (B.getAttribute('data-fav') || '') : '';
    var nba = J ? (J.getAttribute('data-fav') || '') : '';
    var cfbLive = cfb && live.some(function (g) { return g.lg === 'cfb' && (sideIs(g.a, cfb) || sideIs(g.h, cfb)); });
    var nbaLive = nba && live.some(function (g) { return g.lg === 'nba' && (sideIs(g.a, nba) || sideIs(g.h, nba) || (nba === 'UTAH' && ((g.a && /JAZZ/i.test(g.a.n || '')) || (g.h && /JAZZ/i.test(g.h.n || ''))))); });
    if (L) L.classList.toggle('pulse', live.length > 0);
    if (B && cfb) { B.classList.toggle('pulse', !!cfbLive); B.setAttribute('href', (cfbLive && cfb === 'BYU') ? '/cfb/#/gameday' : '/cfb/#/team/' + encodeURIComponent(cfb)); }
    if (J && nba) { J.classList.toggle('pulse', !!nbaLive); J.setAttribute('href', (nbaLive && nba === 'UTAH') ? '/nba/#/gamenight' : '/nba/#/team/' + encodeURIComponent(nba)); }
  }

  function isGame() {
    var h = location.hash || '';
    return /^#\/game\//.test(h) && !/^#\/(gameday|gamenight)\//.test(h);
  }
  function gameNow() {
    var on = isGame();
    H.classList.toggle('jsh-game', on);
    if (!on) { var old = D.querySelector('.jsh-gnow'); if (old) old.remove(); return; }
    var head = D.querySelector('#view > .ghead');
    if (!head) return;
    head.classList.add('jsh-framed');
    /* 11-26 (Jamo: "fix the layout here"): the "now" strip only repeated the score and clock that the framed hero
       already shows, and rewriting it on every page change re-fired this observer about 8 times a second. It stays off. */
    var stale = D.querySelector('.jsh-gnow'); if (stale) stale.remove();
  }

  function splash() {
    if (!standalone || RM.matches) return;
    try { if (sessionStorage.getItem('jsh-splash')) return; sessionStorage.setItem('jsh-splash', '1'); } catch (e) { return; }
    var s = D.createElement('div'); s.className = 'jsh-splash'; s.setAttribute('role', 'status');
    s.innerHTML = '<div style="text-align:center"><img src="/sports/icons/jsh-n.svg" alt=""><b>Jamo Sports Hub</b><span>Your teams first</span></div>';
    D.body.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); land(); }, 950);
  }
  function land() {
    var p = location.pathname || '';
    if (!/\/sports\/?$/.test(p) && !/\/sports\/index\.html$/.test(p)) return;
    var yt = D.getElementById('yt');
    if (yt) yt.scrollIntoView({ block: 'start', behavior: RM.matches ? 'auto' : 'smooth' });
  }

  function boot() {
    dock();
    D.addEventListener('click', function (e) {
      if (!(W.matchMedia && W.matchMedia('(max-width:760px)').matches)) return;
      var btn = e.target.closest && e.target.closest('.jsh-gl');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        var open = !H.classList.contains('jsh-nav-open');
        H.classList.toggle('jsh-nav-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', open ? 'Close the leagues' : 'Open the leagues');
        return;
      }
      if (!H.classList.contains('jsh-nav-open')) return;
      if (e.target.closest && e.target.closest('.jsh-nav')) {
        H.classList.remove('jsh-nav-open');
        return;
      }
      H.classList.remove('jsh-nav-open');
      var g = D.querySelector('.jsh-gl');
      if (g) { g.setAttribute('aria-expanded', 'false'); g.setAttribute('aria-label', 'Open the leagues'); }
    }, true);
    gameNow();
    splash();
    if (!standalone) {
      /* browser preview: still land on Your teams when the home page opens with #yt already, no splash */
    }
  }
  D.addEventListener('jsh:bl', function (e) { armLive((e.detail && e.detail.games) || []); });
  W.addEventListener('hashchange', function () { mark(); gameNow(); });
  var q = 0;
  function soon() { if (!q) q = setTimeout(function () { q = 0; mark(); gameNow(); }, 120); }
  if (D.body) boot(); else D.addEventListener('DOMContentLoaded', boot);
  if (W.MutationObserver && D.body) new MutationObserver(soon).observe(D.body, { childList: true, subtree: true });
})();
/* shell:end */
