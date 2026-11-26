/* shell:start - App shell (2026-11-24, Jamo: "let's do all of it").
   Phone dock (Home, Live, your college team, your NBA team), a short night splash when opened from the home-screen icon,
   and a night hero + "now" strip on every #/game page. Still gradients only. Reduced motion: no splash motion. */
(function () {
  if (window.__jshShell) return; window.__jshShell = true;
  var D = document, H = D.documentElement, W = window;
  var RM = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var standalone = false;
  try { standalone = (W.matchMedia && W.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}

  var css = ''
    + '.jsh-dock{display:none}'
    + '@media (max-width:760px){'
    +   '.jsh-nav{display:none!important}'
    +   '.jsh-dock{position:fixed;left:10px;right:10px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:90;'
    +     'display:grid;grid-template-columns:repeat(4,1fr);gap:2px;height:58px;padding:4px;'
    +     'border-radius:22px;background:rgba(8,12,22,.88);border:1px solid rgba(255,255,255,.14);'
    +     'box-shadow:0 16px 40px -18px rgba(0,0,0,.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}'
    +   'html.light .jsh-dock{background:rgba(255,255,255,.92);border-color:rgba(15,23,42,.12);box-shadow:0 12px 28px -16px rgba(15,23,42,.35)}'
    +   '.jsh-dock a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:0;'
    +     'border-radius:16px;color:#c5d0e4;font:800 11px/1.1 Inter,system-ui,sans-serif;text-decoration:none}'
    +   'html.light .jsh-dock a{color:#334155}'
    +   '.jsh-dock a.on{color:#fff;background:rgba(255,255,255,.1)}'
    +   'html.light .jsh-dock a.on{color:#0f172a;background:rgba(15,23,42,.06)}'
    +   '.jsh-dock a i{width:7px;height:7px;border-radius:50%;background:var(--c,#7cb6ff)}'
    +   '.jsh-dock a.pulse i{box-shadow:0 0 0 0 rgba(255,77,106,.7);background:#ff4d6a}'
    +   'body{padding-bottom:calc(122px + env(safe-area-inset-bottom))!important}'
    +   'body .jbl{bottom:calc(74px + env(safe-area-inset-bottom))!important}'
    +   'body.has-btab .jsh-dock{display:none!important}'
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
    + 'html.jsh-game:not(.light) body::before{background:'
    +   'radial-gradient(120% 70% at 0% 0%,rgba(52,108,255,.16) 0%,transparent 55%),'
    +   'radial-gradient(100% 60% at 100% 0%,rgba(225,29,72,.1) 0%,transparent 50%),'
    +   'linear-gradient(180deg,#060814,#03050a)!important}'
    + 'html.jsh-game #view>.ghead{position:relative;border-radius:22px;overflow:hidden}'
    + 'html.jsh-game:not(.light) #view>.ghead{color:#fff;border-color:rgba(255,255,255,.14);'
    +   'box-shadow:0 28px 60px -32px rgba(0,0,0,.9)}'
    + 'html.jsh-game:not(.light) #view>.ghead .rec,html.jsh-game:not(.light) #view>.ghead .when,html.jsh-game:not(.light) #view>.ghead .mid{color:#d5def0}'
    + 'html.jsh-game #view>.ghead .mid .sc,html.jsh-game #view>.ghead .sc{font-size:clamp(42px,9vw,72px)!important;font-weight:800;letter-spacing:-.03em;line-height:1}'
    + 'html.jsh-game #view>.ghead.jsh-framed::after{content:"";position:absolute;inset:14px;pointer-events:none;z-index:3;'
    +   'background:linear-gradient(#fff,#fff) top left/18px 2px no-repeat,linear-gradient(#fff,#fff) top left/2px 18px no-repeat,'
    +   'linear-gradient(#fff,#fff) top right/18px 2px no-repeat,linear-gradient(#fff,#fff) top right/2px 18px no-repeat,'
    +   'linear-gradient(#fff,#fff) bottom left/18px 2px no-repeat,linear-gradient(#fff,#fff) bottom left/2px 18px no-repeat,'
    +   'linear-gradient(#fff,#fff) bottom right/18px 2px no-repeat,linear-gradient(#fff,#fff) bottom right/2px 18px no-repeat;opacity:.55}'
    + '.jsh-gnow{margin:10px 0 14px;padding:12px 14px;border-radius:16px;background:rgba(8,12,22,.72);border:1px solid rgba(255,255,255,.14);'
    +   'display:flex;flex-wrap:wrap;gap:8px;align-items:center}'
    + 'html.light .jsh-gnow{background:rgba(255,255,255,.9);border-color:rgba(15,23,42,.12)}'
    + '.jsh-gnow .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-size:13px;font-weight:700;'
    +   'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#eef3ff}'
    + 'html.light .jsh-gnow .chip{background:rgba(15,23,42,.05);border-color:rgba(15,23,42,.12);color:#0f172a}'
    + '.jsh-gnow .chip.live{background:rgba(255,77,106,.22);border-color:rgba(255,120,140,.5);color:#ffb3c0}'
    + '.jsh-gnow .chip.win{background:rgba(52,108,255,.18);border-color:rgba(120,160,255,.4)}';

  var st = D.createElement('style'); st.id = 'jsh-shell-css'; st.textContent = css; (D.head || H).appendChild(st);

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
  function text(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function gameNow() {
    var on = isGame();
    H.classList.toggle('jsh-game', on);
    if (!on) { var old = D.querySelector('.jsh-gnow'); if (old) old.remove(); return; }
    var head = D.querySelector('#view > .ghead');
    if (!head) return;
    head.classList.add('jsh-framed');
    var sc = text(head.querySelector('.sc'));
    var when = text(head.querySelector('.when')) || text(head.querySelector('.mid'));
    var live = /live|q[1-4]|ot|half/i.test(when) && !/final/i.test(when);
    var wp = D.querySelector('#view .wpb');
    var win = '';
    if (wp) {
      var names = wp.querySelectorAll('.wpb-n'), pcts = wp.querySelectorAll('.wpb-t b');
      if (names.length >= 2 && pcts.length >= 2) win = text(names[0]) + ' ' + text(pcts[0]) + ' · ' + text(names[1]) + ' ' + text(pcts[1]);
    }
    var chips = [];
    if (live) chips.push('<span class="chip live">LIVE</span>');
    if (sc) chips.push('<span class="chip">' + sc.replace(/</g, '') + '</span>');
    if (when && when !== sc) chips.push('<span class="chip">' + when.replace(/</g, '').slice(0, 72) + '</span>');
    if (win) chips.push('<span class="chip win">' + win.replace(/</g, '').slice(0, 64) + '</span>');
    if (!chips.length) chips.push('<span class="chip">Game</span>');
    var html = '<div class="jsh-gnow" role="status">' + chips.join('') + '</div>';
    var cur = D.querySelector('.jsh-gnow');
    if (cur) cur.outerHTML = html;
    else head.insertAdjacentHTML('afterend', html);
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
