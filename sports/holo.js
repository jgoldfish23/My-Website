/* holo:start - the "Holo" layer (2026-10-27, Jamo: "build on the UI and design to make it more impressive, immersive, and
   futuristic without doing a major overhaul", then: "on the hub holo layer make the UX the priority").
   One shared file for every page with the top bar (front door, CFB, NFL, NBA, articles), loaded from hubbar.html as
   /sports/holo.js. It only adds light, motion and depth on top of what is there - no layout, size, order or content
   changes - and every effect has to help: feedback, orientation, attention or hierarchy.
   - press feedback: cards, tiles, game rows, pills, buttons and the top-bar tabs answer a tap at once (slight press-in
     and an accent edge), on iPhone too; nothing waits before navigating
   - keyboard focus rings in the hub's accent color (keyboard only, never on a tap or click)
   - live: a radar ping on live dots and LIVE badges; a faint live-red edge on live game cards in a grid
   - a live score that changes during the quiet 30-second refresh glows once, so the update is noticed
   - long pages (4+ sections, e.g. team pages on a phone): a slim "where am I" chip under the pinned header shows the
     section you are in; tap it for a list of sections (opens folded ones) and Back to top. It stays out of the way:
     hidden near the top, on short pages and where the page already pins its section tabs (desktop team pages), and it
     fades back and lets taps through when it would sit over a small control
   - the current league tab and the current hub tab get a glowing underline
   - page changes: sections settle in from 60% to full in about 0.2 s (never on a live refresh); the front door's and
     the NBA hub's slower entrances (from invisible, up to 0.8 s) are shortened to match
   - the page hero (scoreboard hero, team header, game header, front-door welcome) gets a holographic edge and HUD corner
     brackets; on desktop the edge turns slowly while on screen and one faint scan line passes on arrival
   - desktop only: a soft light follows the mouse on tappable cards (not on plain panels, so it always means "tap me")
   - the backdrop drifts a few px as you scroll (CSS scroll timeline); on team pages it takes on a hint of the team color
   - CFB and NFL: headline stat tiles count up (0.45 s) when you move to a new page, desktop only (never on a first load; NBA already does this)
   Left out on purpose: tilt on the front-door team cards (they hold small article links). Off on big board / TV /
   game day / game night screens and on the BottomLine ticker. Motion stops for reduced-motion users, idle animation
   pauses while the tab is hidden, and it works in light and dark. */
(function(){ if (window.HOLO || !document.head || document.getElementById('holo-css')) return;
  const D = document, H = D.documentElement;
  const A = 'var(--accent,var(--hud,var(--blue,#5b8cff)))', LV = 'var(--live,#ff4d6a)';
  const AT = 'color-mix(in srgb,' + A + ' 58%,#fff)', ATL = 'color-mix(in srgb,' + A + ' 82%,#000)';
  const mm = q => (window.matchMedia ? matchMedia(q) : { matches: false, addEventListener(){} });
  const FINE = mm('(hover:hover) and (pointer:fine)'), RM = mm('(prefers-reduced-motion: reduce)'), PLT = mm('(prefers-color-scheme: light)');
  const HUB = ((/^(CFB|NFL|NBA)\b/.exec(D.title) || [])[1] || '').toLowerCase();
  const raf = window.requestAnimationFrame ? f => requestAnimationFrame(f) : f => setTimeout(f, 16);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const css =
  /* 1 press feedback: instant, no lingering ripple (the press class drops on release) */
  /* (the edge uses a lighter tint of the accent on dark pages, a deeper one on light: some hub accents are dark, e.g. NFL midnight green) */
    'html.holo-on .holo-press{scale:.982;outline:1.5px solid color-mix(in srgb,' + AT + ' 80%,transparent)!important;outline-offset:-1.5px!important}'
  + 'html.holo-on.holo-lt .holo-press{outline-color:color-mix(in srgb,' + ATL + ' 75%,transparent)!important}'
  + 'html.holo-on .holo-press.holo-sm{scale:.96}'
  /* 2 keyboard focus rings (html.holo-kb is set by Tab and cleared by any tap or click) */
  + 'html.holo-on.holo-kb :is(a,button,input,select,textarea,summary,[tabindex]):focus-visible{outline:2px solid ' + AT + '!important;outline-offset:2px!important;box-shadow:0 0 0 5px color-mix(in srgb,' + A + ' 26%,transparent),0 0 20px -4px color-mix(in srgb,' + AT + ' 60%,transparent)!important}'
  + 'html.holo-on.holo-kb.holo-lt :is(a,button,input,select,textarea,summary,[tabindex]):focus-visible{outline-color:' + ATL + '!important;box-shadow:0 0 0 5px color-mix(in srgb,' + A + ' 18%,transparent)!important}'
  /* 3 live: radar ping (box-shadow, so it never widens the page) and a faint live edge on live cards in a grid */
  + 'html.holo-on :is(#view,header.top,.fd) .livedot:not(.dot):not(.rr-live .livedot),html.holo-on :is(#view,.fd) :is(.sb-live,.pill-live){position:relative}'
  + 'html.holo-on :is(#view,header.top,.fd) .livedot:not(.dot):not(.rr-live .livedot)::after,html.holo-on :is(#view,.fd) :is(.sb-live,.pill-live)::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;animation:holoPing 2.4s cubic-bezier(.2,.6,.35,1) infinite}'
  /* live dots already pulse every 1.4 s: the ping keeps the same beat so the two read as one signal */
  + 'html.holo-on :is(#view,header.top,.fd) .livedot:not(.dot):not(.rr-live .livedot)::after{animation-duration:1.4s}'
  + '@keyframes holoPing{0%{box-shadow:0 0 0 0 color-mix(in srgb,' + LV + ' 62%,transparent)}75%,100%{box-shadow:0 0 0 7px color-mix(in srgb,' + LV + ' 0%,transparent)}}'
  + 'html.holo-on #view :is(a.card,a.tile,.tile-link,.wcard):not(.livecard):has(.livedot,.sb-live),html.holo-on .fd a.tc:has(.pill-live){outline:1px solid color-mix(in srgb,' + LV + ' 58%,transparent);outline-offset:-1px}'
  + 'html.holo-on #view .wcard.holo-live{outline:1px solid color-mix(in srgb,' + LV + ' 58%,transparent);outline-offset:-1px}'
  /* 4 a score that changed in a quiet refresh glows once */
  + 'html.holo-on .holo-bump{animation:holoBump 1.3s ease-out;border-radius:4px}'
  + '@keyframes holoBump{0%,14%{background-color:color-mix(in srgb,' + AT + ' 26%,transparent);text-shadow:0 0 14px color-mix(in srgb,' + AT + ' 90%,transparent)}100%{background-color:transparent;text-shadow:none}}'
  + 'html.holo-on.holo-lt .holo-bump{animation-name:holoBumpL}'
  + '@keyframes holoBumpL{0%,14%{background-color:color-mix(in srgb,' + A + ' 20%,transparent)}100%{background-color:transparent}}'
  /* the hubs already pop a changed score (.sc-num.tick, scorepop): keep their pop and add the glow, never replace it */
  + '@media (prefers-reduced-motion:no-preference){html.holo-on .sc-num.tick.holo-bump{animation:scorepop .7s ease-out,holoBump 1.3s ease-out}html.holo-on.holo-lt .sc-num.tick.holo-bump{animation:scorepop .7s ease-out,holoBumpL 1.3s ease-out}}'
  /* 5 the "where am I" section chip */
  + '#holo-sec{position:fixed;left:0;top:0;z-index:19;max-width:calc(100vw - 24px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .16s ease,visibility 0s linear .16s,transform .22s ease;font-family:"Inter Tight","Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%}'
  + '#holo-sec.on{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .16s ease,visibility 0s,transform .22s ease}'
  + '#holo-sec.on.dim{opacity:.3;pointer-events:none}'
  + '#holo-sec .hs-b{position:relative;display:inline-flex;align-items:center;gap:8px;max-width:100%;height:30px;padding:0 12px 0 5px;border-radius:999px;border:1px solid color-mix(in srgb,' + A + ' 42%,rgba(255,255,255,.08));background:rgba(7,10,20,.8);-webkit-backdrop-filter:blur(10px) saturate(1.2);backdrop-filter:blur(10px) saturate(1.2);color:#eef2f8;font:inherit;font-size:12.5px;font-weight:700;letter-spacing:-.005em;line-height:1;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 10px 26px -14px rgba(0,0,0,.9),0 0 18px -10px ' + A + ';-webkit-tap-highlight-color:transparent}'
  + '#holo-sec .hs-b::before{content:"";position:absolute;inset:-7px -4px}'
  + '#holo-sec .hs-n{flex:none;font-family:"Orbitron",inherit;font-size:9.5px;font-weight:800;letter-spacing:.14em;line-height:1;padding:4px 5px 4px 6px;border-radius:999px;color:' + AT + ';border:1px solid color-mix(in srgb,' + A + ' 45%,transparent);background:color-mix(in srgb,' + A + ' 14%,transparent)}'
  + '#holo-sec .hs-t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  + '#holo-sec .hs-c{flex:none;width:6px;height:6px;margin-left:1px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg);opacity:.7;transition:transform .15s}'
  + '#holo-sec .hs-b[aria-expanded="true"] .hs-c{transform:translateY(1px) rotate(-135deg)}'
  + '#holo-sec .hs-l{position:absolute;left:0;top:37px;width:max-content;min-width:210px;max-width:min(320px,calc(100vw - 24px));max-height:var(--hs-mh,60vh);overflow:auto;overscroll-behavior:contain;padding:6px;border-radius:14px;border:1px solid color-mix(in srgb,' + A + ' 30%,rgba(255,255,255,.1));background:rgba(7,10,20,.95);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 24px 60px -24px rgba(0,0,0,.95);color:#eef2f8}'
  + '#holo-sec .hs-l[hidden]{display:none}'
  + '#holo-sec .hs-i{display:flex;align-items:center;gap:10px;width:100%;min-height:38px;padding:8px 10px;border:0;border-radius:9px;background:none;color:inherit;font:inherit;font-size:13.5px;font-weight:600;line-height:1.2;text-align:left;cursor:pointer}'
  + '#holo-sec .hs-i b{flex:none;min-width:24px;font-family:"Orbitron",inherit;font-size:9.5px;font-weight:800;letter-spacing:.12em;color:' + AT + '}'
  + '#holo-sec .hs-i span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  + '#holo-sec .hs-i:hover{background:rgba(255,255,255,.07)}'
  + '#holo-sec .hs-i.cur{background:color-mix(in srgb,' + A + ' 20%,transparent);box-shadow:inset 2px 0 0 ' + A + '}'
  + '#holo-sec .hs-top{color:#b4bfd3}'
  + 'html.holo-lt #holo-sec .hs-b{background:rgba(255,255,255,.9);color:#0f172a;border-color:color-mix(in srgb,' + A + ' 38%,#dce2ee);box-shadow:0 8px 22px -14px rgba(15,23,42,.45)}'
  + 'html.holo-lt #holo-sec .hs-n,html.holo-lt #holo-sec .hs-i b{color:' + ATL + '}'
  + 'html.holo-lt #holo-sec .hs-l{background:rgba(255,255,255,.97);color:#0f172a;border-color:#dce2ee;box-shadow:0 20px 50px -24px rgba(15,23,42,.45)}'
  + 'html.holo-lt #holo-sec .hs-i:hover{background:rgba(15,23,42,.05)}html.holo-lt #holo-sec .hs-top{color:#475569}'
  + '@media print{#holo-sec{display:none}}'
  /* 6 where am I: a glowing underline under the current league tab and the current hub tab */
  + 'html.holo-on .jsh-nav a.on{position:relative}'
  + 'html.holo-on .jsh-nav a.on::after{content:"";position:absolute;left:12px;right:12px;bottom:3px;height:2px;border-radius:2px;pointer-events:none;background:rgba(255,255,255,.92);box-shadow:0 0 6px rgba(255,255,255,.7),0 0 12px 1px var(--c,#7cb6ff)}'
  + 'html.holo-on .nav.navg .ng-tab.cur::after{box-shadow:0 0 10px 1px color-mix(in srgb,' + A + ' 70%,transparent)}'
  + 'html.holo-on #view .subnav a.on{box-shadow:0 0 0 1px color-mix(in srgb,' + A + ' 30%,transparent),0 6px 18px -8px ' + A + '}'
  + 'html.holo-on main.wrap #chips .chip.on{box-shadow:0 0 0 1px rgba(255,255,255,.1),0 8px 22px -10px var(--c,' + A + ')}'
  /* 7 page entrance: from 60% to full, 6 px, about 0.2 s; the hubs' own whole-page fade and the NBA rise give way to it */
  + '@keyframes holoIn{from{opacity:.6;transform:translate3d(0,6px,0)}}'
  + 'html.holo-on #view.in{animation:none}'
  + 'html.holo-on #view.enter :is(.grid>.tile,.gmlist>.gm,.thead.hero,.ghead.hero,.root-card){animation:none}'
  + '@media (prefers-reduced-motion:no-preference){'
  +   'html.holo-on #view>:is(.holo-in,#holo-z){animation:holoIn .2s cubic-bezier(.2,.7,.2,1) backwards}'
  +   'html.holo-on #view>:is(.holo-in,#holo-z).hi1{animation-delay:12ms}html.holo-on #view>:is(.holo-in,#holo-z).hi2{animation-delay:24ms}html.holo-on #view>:is(.holo-in,#holo-z).hi3{animation-delay:36ms}html.holo-on #view>:is(.holo-in,#holo-z).hi4{animation-delay:48ms}'
  +   'html.holo-on .fd.anim .rise{animation:holoIn .2s cubic-bezier(.2,.7,.2,1) backwards;animation-delay:calc(min(var(--i,0),4) * 12ms)}'
  + '}'
  /* 8 desktop: a soft light under the mouse on tappable cards, in the card's background (behind the text) */
  + 'html.holo-on.holo-fine .holo-lit{background-image:radial-gradient(260px circle at var(--hx,50%) var(--hy,50%),color-mix(in srgb,' + AT + ' 15%,transparent),transparent 72%),var(--hbg,none)!important;background-size:100% 100%,var(--hbs,auto)!important;background-position:0 0,var(--hbp,0 0)!important;background-repeat:no-repeat,var(--hbr,repeat)!important}'
  + 'html.holo-on.holo-fine.holo-lt .holo-lit{background-image:radial-gradient(260px circle at var(--hx,50%) var(--hy,50%),color-mix(in srgb,' + A + ' 9%,transparent),transparent 72%),var(--hbg,none)!important}'
  + 'html.holo-on.holo-fine .teams a.tc.holo-lit{background-image:radial-gradient(260px circle at var(--hx,50%) var(--hy,50%),rgba(255,255,255,.16),transparent 72%),var(--hbg,none)!important}'
  /* 9 the hero: holographic edge, HUD corner brackets, one faint scan line on arrival */
  + '.holo-frame,.holo-scan{position:absolute!important;inset:0!important;margin:0!important;padding:0!important;width:auto!important;height:auto!important;min-width:0!important;border:0!important;border-radius:inherit;pointer-events:none!important;z-index:3;display:block!important;transform:none!important;animation:none!important;opacity:1!important;background:none!important}'
  + '.holo-frame::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:conic-gradient(from var(--holo-a,0deg),transparent 0 30%,color-mix(in srgb,var(--hf) 90%,transparent) 42%,rgba(196,166,255,.9) 50%,transparent 62%,transparent 80%,color-mix(in srgb,var(--hf) 55%,transparent) 90%,transparent 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;opacity:.7}'
  + '.holo-frame::after{content:"";position:absolute;inset:9px;opacity:.6;background:linear-gradient(var(--hc),var(--hc)) 0 0/13px 1.5px,linear-gradient(var(--hc),var(--hc)) 0 0/1.5px 13px,linear-gradient(var(--hc),var(--hc)) 100% 0/13px 1.5px,linear-gradient(var(--hc),var(--hc)) 100% 0/1.5px 13px,linear-gradient(var(--hc),var(--hc)) 0 100%/13px 1.5px,linear-gradient(var(--hc),var(--hc)) 0 100%/1.5px 13px,linear-gradient(var(--hc),var(--hc)) 100% 100%/13px 1.5px,linear-gradient(var(--hc),var(--hc)) 100% 100%/1.5px 13px;background-repeat:no-repeat}'
  + '.holo-frame{--hc:' + AT + ';--hf:' + AT + '}html.holo-lt .holo-frame:not(.holo-dk){--hc:' + ATL + ';--hf:' + ATL + '}html.holo-lt .holo-frame:not(.holo-dk)::before{opacity:.5}html.holo-lt .holo-frame:not(.holo-dk)::after{opacity:.45}'
  + '@media (max-width:600px){.holo-frame::after{inset:7px;background-size:9px 1.5px,1.5px 9px,9px 1.5px,1.5px 9px,9px 1.5px,1.5px 9px,9px 1.5px,1.5px 9px}}'
  + '.holo-scan{overflow:hidden!important;z-index:4}html:not(.holo-on) :is(.holo-frame,.holo-scan){display:none!important}'
  + '.holo-scan::before{content:"";position:absolute;left:0;right:0;top:-44px;height:44px;background:linear-gradient(180deg,transparent,color-mix(in srgb,' + A + ' 8%,transparent) 75%,color-mix(in srgb,' + A + ' 50%,transparent) 97%,transparent)}'
  + '@keyframes holoSpin{to{--holo-a:360deg}}'
  + '@keyframes holoScan{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,var(--holo-h,320px),0)}}'
  + '@media (prefers-reduced-motion:no-preference){'
  +   'html.holo-on.holo-fine.holo-prop .holo-frame.holo-vis::before{animation:holoSpin 12s linear infinite}'
  +   '.holo-scan::before{animation:holoScan .8s cubic-bezier(.45,0,.25,1) .05s both}'
  + '}'
  /* 10 depth: the backdrop drifts a few px with scroll (CSS scroll timeline, no script), team color on team pages */
  + '@keyframes holoDriftA{to{translate:0 -18px}}@keyframes holoDriftB{to{translate:0 -34px}}'
  + '@supports (animation-timeline:scroll()){@media (prefers-reduced-motion:no-preference){'
  +   'html.holo-on #neo-bg::before{animation:neoAur 42s ease-in-out infinite alternate,holoDriftA linear both;animation-timeline:auto,scroll(root);animation-range:normal,0px 1800px}'
  +   'html.holo-on #neo-bg::after{animation:holoDriftB linear both;animation-timeline:scroll(root);animation-range:0px 1800px}'
  +   'html.holo-on body.holo-fdp::before{animation:nxAurora 42s ease-in-out infinite alternate,holoDriftA linear both;animation-timeline:auto,scroll(root);animation-range:normal,0px 1800px}'
  +   'html.holo-on body.holo-fdp::after{animation:holoDriftB linear both;animation-timeline:scroll(root);animation-range:0px 1800px}'
  + '}}'
  + 'html.holo-on #neo-bg{background:radial-gradient(1100px 680px at 16% -8%,color-mix(in srgb,var(--holo-team,transparent) 30%,transparent),transparent 66%),radial-gradient(820px 560px at 100% 8%,color-mix(in srgb,var(--holo-team,transparent) 16%,transparent),transparent 64%);transition:--holo-team .9s ease}'
  + 'html.holo-on.holo-lt #neo-bg{background:radial-gradient(1100px 680px at 16% -8%,color-mix(in srgb,var(--holo-team,transparent) 14%,transparent),transparent 66%)}'
  /* idle animation pauses while the tab is hidden; reduced motion keeps glows and drops movement */
  + 'html.holo-hid .holo-frame::before,html.holo-hid .livedot::after,html.holo-hid .sb-live::after,html.holo-hid .pill-live::after,html.holo-hid #neo-bg::before,html.holo-hid #neo-bg::after,html.holo-hid body::before,html.holo-hid body::after,html.holo-hid .hero h1 b{animation-play-state:paused!important}'
  + '@media (prefers-reduced-motion:reduce){html.holo-on .holo-press,html.holo-on .holo-press.holo-sm{scale:none}html.holo-on :is(#view,header.top,.fd) .livedot:not(.dot):not(.rr-live .livedot)::after,html.holo-on :is(#view,.fd) :is(.sb-live,.pill-live)::after{animation:none;box-shadow:0 0 0 3px color-mix(in srgb,' + LV + ' 28%,transparent)}#holo-sec,#holo-sec.on,#holo-sec .hs-c{transition:none}}';
  const st = D.createElement('style'); st.id = 'holo-css'; st.textContent = css; D.head.appendChild(st);
  try { CSS.registerProperty({ name: '--holo-a', syntax: '<angle>', inherits: false, initialValue: '0deg' }); } catch (e) {}
  try { CSS.registerProperty({ name: '--holo-team', syntax: '<color>', inherits: false, initialValue: 'transparent' }); } catch (e) {}
  if (window.CSS && CSS.registerProperty) H.classList.add('holo-prop');

  /* ---------- state: on/off (board and TV screens keep their own look), theme, pointer, hidden tab ---------- */
  const OFF = /^#\/(board|tv|gamenight|gameday)\b/;
  const V = () => D.getElementById('view');
  let on = null;
  function setOn(){ const v = !(D.body && D.body.classList.contains('boardmode')) && !OFF.test(location.hash || '');
    if (v === on) return; on = v; H.classList.toggle('holo-on', v); if (!v) { unlight(); hudHide(); } }
  const isFront = () => !!D.getElementById('fd');
  function theme(){ const t = H.getAttribute('data-theme');
    H.classList.toggle('holo-lt', H.classList.contains('light') || t === 'light' || (t !== 'dark' && !isFront() && PLT.matches)); }
  const fine = () => H.classList.toggle('holo-fine', FINE.matches);
  const watch = (q, f) => { try { q.addEventListener('change', f); } catch (e) { try { q.addListener(f); } catch (e2) {} } };
  watch(PLT, theme); watch(FINE, () => { fine(); unlight(); });
  D.addEventListener('visibilitychange', () => H.classList.toggle('holo-hid', D.hidden));
  if (window.MutationObserver) new MutationObserver(theme).observe(H, { attributes: true, attributeFilter: ['class', 'data-theme'] });

  /* ---------- 2 keyboard vs pointer ---------- */
  D.addEventListener('keydown', e => { if (e.key === 'Tab') H.classList.add('holo-kb'); }, true);
  D.addEventListener('pointerdown', () => { if (H.classList.contains('holo-kb')) H.classList.remove('holo-kb'); }, { capture: true, passive: true });

  /* ---------- 1 press feedback ---------- */
  const PRESS = ['#view a.card', '#view a.tile', '#view .tile-link', '#view .gm.click', '#view a.gm', '#view a.wcard', '#view .wcard[data-href]',
    '#view a.sb-nu', '#view a.sbt', '#view .btn', '#view .seg a', '#view .seg button', '#view .fold-btn', '#view .subnav a', '#view .crumb a',
    '#view a.gotw', '#view a.hw-strip', '#view a.hw-card', 'header.top .ng-tab', 'header.top .ng-sub a', 'header.top a.tk', '#asof .asof-i',
    '.jsh-nav a', '.jsh-brand', '#btab a', '#btab button', '.fd a.tc', '.fd .tc-ar', '.fd a.lc', '.fd a.tv-g', '.fd a.gm', '.fd .sp-h', '.fd .ql a',
    '.fd a.nw-item', '.fd a.nw-lead', '.fd .nw-seg button', '.fd .fd-more', '.fd button.more', '.fd .hero .chip', '.fd a.lt',
    'main.wrap a.ar', 'main.wrap #chips .chip', '#holo-sec .hs-b', '#holo-sec .hs-i'].join(',');
  let pr = null, prT = 0, prAt = 0;
  /* a tap keeps the press look at least 110 ms so it is seen; a cancelled press (the finger started a scroll) drops it at once */
  const unpress = e => { const el = pr; pr = null; clearTimeout(prT); if (!el) return;
    const off = () => { if (el !== pr) el.classList.remove('holo-press', 'holo-sm'); }; const left = e && e.type === 'pointerup' ? 110 - (performance.now() - prAt) : 0; if (left > 0) setTimeout(off, left); else off(); };
  D.addEventListener('pointerdown', e => { if (!on || e.button > 0 || e.isPrimary === false) return; const el = e.target && e.target.closest ? e.target.closest(PRESS) : null; if (!el) return;
    if (pr && pr !== el) pr.classList.remove('holo-press', 'holo-sm'); const small = el.offsetWidth < 120;
    pr = el; prAt = performance.now(); el.classList.add('holo-press'); if (small) el.classList.add('holo-sm'); clearTimeout(prT); prT = setTimeout(unpress, 1200); }, { passive: true });
  ['pointerup', 'pointercancel', 'dragstart'].forEach(t => D.addEventListener(t, unpress, { passive: true, capture: true }));
  addEventListener('blur', unpress);

  /* ---------- 8 desktop: light under the mouse on tappable cards ---------- */
  const GLASS = ['#view a.card', '#view a.tile', '#view .tile-link', '#view a.wcard', '#view .gm.click', '#view a.gm', '#view a.sb-nu', '#view a.gotw',
    '.fd a.lc', '.fd a.nw-item', '.fd a.lt', '.teams a.tc', 'main.wrap a.ar'].join(',');
  const PROPS = ['--hx', '--hy', '--hbg', '--hbs', '--hbp', '--hbr'];
  const flat = new WeakSet();
  let lit = null, pmE = null, pmQ = false;
  function unlight(){ if (!lit) return; const el = lit; lit = null; el.classList.remove('holo-lit'); PROPS.forEach(p => el.style.removeProperty(p)); if (!el.getAttribute('style')) el.removeAttribute('style'); }
  function light(el, x, y){
    if (el !== lit) { unlight(); if (!el) return; const cs = getComputedStyle(el);
      if (cs.borderTopLeftRadius === '0px') { flat.add(el); return; } /* list rows stay plain */
      const s = el.style; s.setProperty('--hbg', cs.backgroundImage); s.setProperty('--hbs', cs.backgroundSize); s.setProperty('--hbp', cs.backgroundPosition); s.setProperty('--hbr', cs.backgroundRepeat);
      el.classList.add('holo-lit'); lit = el; }
    const r = lit.getBoundingClientRect(); lit.style.setProperty('--hx', Math.round(x - r.left) + 'px'); lit.style.setProperty('--hy', Math.round(y - r.top) + 'px'); }
  D.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; pmE = e; if (pmQ) return; pmQ = true;
    raf(() => { pmQ = false; const ev = pmE; if (!on || !FINE.matches || RM.matches) { unlight(); return; }
      const el = ev.target && ev.target.closest ? ev.target.closest(GLASS) : null; light(el && !flat.has(el) ? el : null, ev.clientX, ev.clientY); }); }, { passive: true });
  H.addEventListener('mouseleave', unlight);

  /* ---------- 3 live cards that only say "Live" in their text (NBA games-to-watch grid) ---------- */
  function markLive(root){ root.querySelectorAll('.wcard:not(.livecard)').forEach(c => { const w = c.querySelector('.wt'); const lv = !!w && /^live\b/i.test(w.textContent.trim()); if (lv !== c.classList.contains('holo-live')) c.classList.toggle('holo-live', lv); }); }

  /* ---------- 4 score changes: compare each score with the last render of the same page ---------- */
  const SC = '.sc-num,.sb-cd,.tc-sc,.tv-st.live b,.tl .sc';
  const kind = el => [].slice.call(el.classList).filter(c => !/^(holo-|on$|cur$|show$|click$|is-?live$|live$|final$|tick$|w$|l$|dense$|hot$)/.test(c)).slice(0, 2).join('.');
  function scores(root){ const m = new Map(), n = {};
    root.querySelectorAll(SC).forEach(el => { const host = el.closest('a[href],[data-href]'); const k0 = host && root.contains(host) ? (host.getAttribute('href') || host.getAttribute('data-href')) + '|' + kind(host) : '~';
      const i = n[k0] = (n[k0] || 0) + 1; m.set(k0 + '|' + i, [el, (el.getAttribute('data-to') || el.textContent).replace(/\s+/g, ' ').trim()]); });
    return m; }
  function bumpDiff(prev, next){ if (!prev || !on) return; next.forEach((x, k) => { const o = prev.get(k); if (o && x[1] && o[1] !== x[1]) { const el = x[0]; el.classList.add('holo-bump'); setTimeout(() => el.classList.remove('holo-bump'), 1400); } }); }

  /* ---------- 7 entrance on a real page change (never on a quiet live re-render of the same page) ---------- */
  function enter(v){ if (RM.matches) return; const kids = [].slice.call(v.children, 0, 8);
    kids.forEach((e, i) => e.classList.add('holo-in', 'hi' + Math.min(i, 4)));
    setTimeout(() => kids.forEach((e, i) => e.classList.remove('holo-in', 'hi' + Math.min(i, 4))), 450); }

  /* ---------- 11 count-up on headline stat tiles (CFB/NFL, desktop, fresh page view, tiles on screen only) ---------- */
  function countUp(v){ if (!(HUB === 'cfb' || HUB === 'nfl') || !FINE.matches || RM.matches || innerWidth < 761) return; const vh = innerHeight;
    v.querySelectorAll('.tile .val').forEach(el => { const tn = el.firstChild; if (!tn || tn.nodeType !== 3 || el.childNodes.length !== 1) return;
      const orig = tn.data, m = /^(\s*)([+\u2212-]?)(\d{1,3}(?:\.\d+)?)(%?)(\s*)$/.exec(orig); if (!m) return;
      const to = parseFloat(m[3]), dec = (m[3].split('.')[1] || '').length; if (to < 1 || (!m[2] && !m[4] && !dec && to < 10)) return; /* tiny values (-0.1) gain nothing from counting */
      const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > vh) return;
      const fmt = p => m[1] + m[2] + (to * p).toFixed(dec) + m[4] + m[5]; let done = false, t0 = 0;
      const fin = () => { if (done) return; done = true; if (tn.parentNode === el) tn.data = orig; };
      const step = now => { if (done) return; if (!t0) t0 = now; const p = Math.min(1, (now - t0) / 450); if (p >= 1) { fin(); return; } if (tn.parentNode === el) tn.data = fmt(1 - Math.pow(1 - p, 3)); raf(step); };
      tn.data = fmt(0); raf(step); setTimeout(fin, 1200); }); }

  /* ---------- 9 hero frame + scan line ---------- */
  const io = typeof window.IntersectionObserver === 'function' ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('holo-vis', e.isIntersecting))) : null;
  let frameEl = null;
  /* heroes that stay dark in the light theme (the scoreboard heroes) keep the bright frame colors */
  const darkBg = c => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c || ''); if (!m || (m[4] != null && +m[4] < .5)) return !H.classList.contains('holo-lt'); return (.2126 * m[1] + .7152 * m[2] + .0722 * m[3]) < 110; };
  function frame(host, scan){ if (!host) return; let f = host.querySelector(':scope > .holo-frame');
    if (!f) { const cs = getComputedStyle(host); if (cs.position === 'static' || cs.borderTopLeftRadius === '0px' || host.classList.contains('live')) return;
      f = D.createElement('i'); f.className = 'holo-frame' + (darkBg(cs.backgroundColor) ? ' holo-dk' : ''); f.setAttribute('aria-hidden', 'true'); host.appendChild(f); }
    if (f !== frameEl) { if (io && frameEl) io.unobserve(frameEl); frameEl = f; if (io) io.observe(f); }
    if (scan && on && FINE.matches && !RM.matches && !host.querySelector(':scope > .holo-scan')) { const s = D.createElement('i'); s.className = 'holo-scan'; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--holo-h', (host.offsetHeight + 48) + 'px'); host.appendChild(s); setTimeout(() => s.remove(), 1100); } }
  const heroOf = v => { const k = v.querySelector(':scope > .sbh, :scope > .thead, :scope > .ghead'); return k && k.getBoundingClientRect().top < innerHeight ? k : null; };

  /* ---------- 10 team color in the backdrop on team pages ---------- */
  function team(){ const bg = D.getElementById('neo-bg'); if (!bg) return; const v = V(); let c = '';
    if (on && v && /^#\/team\//.test(location.hash || '')) { const t = v.querySelector('.thead'); if (t) { c = getComputedStyle(t).getPropertyValue('--team').trim(); if (!c) { const b = t.querySelector('.bar'); if (b) c = getComputedStyle(b).backgroundColor; } } }
    if (c && !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(c)) bg.style.setProperty('--holo-team', c); else if (bg.style.getPropertyValue('--holo-team')) bg.style.removeProperty('--holo-team'); }

  /* ---------- 5 section chip ---------- */
  let hud = null, hudB, hudN, hudT, hudL, secs = [], cur = -1, shown = false, idleT = 0, scanT = 0, scT = 0, hudTf = '';
  const title = h => { let s = ''; h.childNodes.forEach(n => { if (n.nodeType === 3) s += n.textContent; else if (n.nodeType === 1 && !n.matches('button,.fold-btn,.note,.muted,.livedot,small,.dim,img,svg,select,input')) s += n.textContent; }); return s.replace(/\s+/g, ' ').trim().slice(0, 48); };
  const num = (h, i) => h.dataset.neo || String(i + 1).padStart(2, '0');
  function hudMake(){ if (hud) return; hud = D.createElement('div'); hud.id = 'holo-sec';
    hud.innerHTML = '<button type="button" class="hs-b" aria-expanded="false" aria-controls="holo-sec-l" title="Sections on this page"><b class="hs-n"></b><span class="hs-t"></span><i class="hs-c" aria-hidden="true"></i></button><div class="hs-l" id="holo-sec-l" role="group" aria-label="Sections on this page" hidden></div>';
    D.body.appendChild(hud); hudB = hud.firstChild; hudN = hudB.children[0]; hudT = hudB.children[1]; hudL = hud.lastChild;
    hudB.addEventListener('click', () => hudOpen(hudL.hidden));
    hudL.addEventListener('click', e => { const b = e.target.closest('.hs-i'); if (!b) return; hudOpen(false); go(+b.dataset.i); });
    D.addEventListener('pointerdown', e => { if (!hudL.hidden && !hud.contains(e.target)) hudOpen(false); }, { passive: true, capture: true });
    D.addEventListener('keydown', e => { if (e.key === 'Escape' && !hudL.hidden) { hudOpen(false); hudB.focus(); } }); }
  function hudHide(){ if (!hud || !shown) return; shown = false; hud.classList.remove('on', 'dim'); hudOpen(false); }
  /* the bottom of the hub's pinned header: where it rests when pinned, 0 while it is tucked away on a phone */
  function pinRest(h){ const cs = getComputedStyle(h); return cs.position === 'sticky' || cs.position === 'fixed' ? Math.max(0, Math.round((parseFloat(cs.top) || 0) + h.offsetHeight)) : 0; }
  function pinBottom(){ const h = D.querySelector('header.top'); if (!h || h.classList.contains('jsh-tuck')) return 0; const rest = pinRest(h); if (!rest) return 0;
    const r = h.getBoundingClientRect(); return r.top <= rest - h.offsetHeight + 1 ? rest : Math.max(0, Math.round(r.bottom)); }
  function hudScan(){ scanT = 0; secs = []; const v = V(); if (v && on) v.querySelectorAll('.sec').forEach(s => { const h = s.querySelector(':scope > h2'); if (h && s.offsetParent !== null && title(h)) secs.push(s); }); hudTick(); }
  function keepSub(sn){ if (sn.scrollWidth <= sn.clientWidth + 2) return; const a = sn.querySelector('a.on'); if (!a || a === keepSub.a) return; keepSub.a = a;
    const ar = a.getBoundingClientRect(), sr = sn.getBoundingClientRect(); if (ar.left < sr.left + 8 || ar.right > sr.right - 8) sn.scrollTo({ left: sn.scrollLeft + (ar.left - sr.left) - (sr.width - ar.width) / 2, behavior: RM.matches ? 'auto' : 'smooth' }); }
  function hudTick(){
    if (secs.length < 4) { hudHide(); return; }
    const v = V(); if (!v || !on || innerHeight < 480 || H.scrollHeight < innerHeight * 2) { hudHide(); return; }
    if (!secs[0].isConnected || !secs[secs.length - 1].isConnected) { if (!scanT) scanT = setTimeout(hudScan, 60); return; }
    const sn = v.querySelector('.subnav'); if (sn && getComputedStyle(sn).position === 'sticky' && sn.offsetHeight) { hudHide(); keepSub(sn); return; } /* desktop team pages already pin their section tabs */
    const top = pinBottom(), line = top + 56; /* a section becomes current once its heading reaches the chip (a jump lands it just below) */ let c = -1; for (let i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top <= line) c = i;
    if (c < 0) { hudHide(); return; }
    hudMake(); if (c !== cur || !hudT.textContent) { cur = c; const h = secs[c].querySelector(':scope > h2'); if (h) { hudN.textContent = num(h, c); hudT.textContent = title(h); } }
    const x = Math.max(12, Math.min(Math.round(secs[c].getBoundingClientRect().left), innerWidth - 220));
    const tf = 'translate3d(' + x + 'px,' + (top + 8) + 'px,0)';
    /* coming back from hidden it appears in place (fade only) instead of sliding over from where it was last */
    if (!shown) { hud.style.transition = 'none'; hud.style.transform = tf; void hud.offsetWidth; hud.style.transition = ''; shown = true; hud.classList.add('on'); }
    else if (hudTf !== tf) hud.style.transform = tf;
    hudTf = tf;
    if (hud.classList.contains('dim')) hud.classList.remove('dim'); clearTimeout(idleT); idleT = setTimeout(hudCover, 260); }
  /* when the page stops with a control mostly hidden under the chip (one that can't be tapped beside it), the chip fades
     back and lets the tap through; a wide row or card that is only clipped at one corner keeps the chip */
  function hudCover(){ if (!shown || !hudL.hidden || !D.elementsFromPoint) return; const r = hudB.getBoundingClientRect(), y = r.top + r.height / 2; let hit = false; const seen = [];
    for (const x of [r.left + 8, r.left + r.width / 2, r.right - 8]) { const under = D.elementsFromPoint(x, y).find(e => !hud.contains(e)); const c = under && under.closest('a,button,input,select,textarea,summary,label,[role=button],[role=link],[role=tab]');
      if (!c || seen.indexOf(c) >= 0) continue; seen.push(c); const b = c.getBoundingClientRect(), area = b.width * b.height;
      const ov = Math.max(0, Math.min(b.right, r.right) - Math.max(b.left, r.left)) * Math.max(0, Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top));
      if (area && ov / area > .45) { hit = true; break; } }
    hud.classList.toggle('dim', hit); }
  function hudOpen(open){ if (!hud) return;
    if (!open) { if (!hudL.hidden) { hudL.hidden = true; hudB.setAttribute('aria-expanded', 'false'); } return; }
    hudL.innerHTML = '<button type="button" class="hs-i hs-top" data-i="-1"><b>\u2191</b><span>Back to top</span></button>'
      + secs.map((s, i) => { const h = s.querySelector(':scope > h2'); return '<button type="button" class="hs-i' + (i === cur ? ' cur' : '') + '" data-i="' + i + '"' + (i === cur ? ' aria-current="true"' : '') + '><b>' + esc(num(h, i)) + '</b><span>' + esc(title(h)) + '</span></button>'; }).join('');
    const r = hudB.getBoundingClientRect(); let lim = innerHeight; ['.jbl', '#btab'].forEach(q => { const e = D.querySelector(q); if (!e) return; const b = e.getBoundingClientRect(); if (b.height && b.top > r.bottom) lim = Math.min(lim, b.top); });
    hud.style.setProperty('--hs-mh', Math.max(150, Math.round(lim - r.bottom - 20)) + 'px'); hud.classList.remove('dim');
    hudL.style.left = ''; hudL.hidden = false; hudB.setAttribute('aria-expanded', 'true');
    const lr = hudL.getBoundingClientRect(); const vw = H.clientWidth || innerWidth; if (lr.right > vw - 12) hudL.style.left = Math.round(vw - 12 - lr.right) + 'px'; /* keep the list on screen */
    const c = hudL.querySelector('.cur'); if (c) hudL.scrollTop = Math.max(0, c.offsetTop - hudL.clientHeight / 2); }
  function go(i){ const smooth = RM.matches ? 'auto' : 'smooth'; if (i < 0) { scrollTo({ top: 0, behavior: smooth }); return; }
    const s = secs[i]; if (!s || !s.isConnected) { hudScan(); return; }
    if (s.classList.contains('fold-closed')) { const b = s.querySelector(':scope > .fold-btn'); if (b) b.click(); } /* fold.js opens it and remembers */
    const abs = s.getBoundingClientRect().top + scrollY, hdr = D.querySelector('header.top'); let y = abs - (hdr ? pinRest(hdr) : 0) - 46; /* the heading lands just below the chip, never under it */
    if (hdr && y > scrollY + 6 && y >= 260 && mm('(max-width:760px)').matches) y = abs - 46; /* scrolling down on a phone tucks the hub header away */
    scrollTo({ top: Math.max(0, y), behavior: smooth }); }
  addEventListener('scroll', () => { if (lit) unlight(); if (pr) unpress(); if (!scT && secs.length >= 4) scT = setTimeout(() => { scT = 0; hudTick(); }, 60); }, { passive: true });
  addEventListener('resize', () => { if (!scanT) scanT = setTimeout(hudScan, 150); }, { passive: true });

  /* ---------- renders: a new route is a real page change; the same route again is a quiet (live) re-render ---------- */
  const rkey = () => location.pathname + (location.hash || '#/');
  let lastKey = null, mapV = null;
  function onView(first){ const v = V(); if (!v) return; setOn(); const k = rkey(), real = k !== lastKey; lastKey = k;
    if (real) { mapV = scores(v); cur = -1; hudOpen(false); if (on && !first) { enter(v); countUp(v); } }
    else { const nm = scores(v); bumpDiff(mapV, nm); mapV = nm; }
    team(); /* every render: a team page loaded directly draws its header after this script starts */
    if (on) { markLive(v); frame(heroOf(v), real); }
    if (!scanT) scanT = setTimeout(hudScan, 120); }
  function watchRoot(el, cb){ if (el && window.MutationObserver) new MutationObserver(cb).observe(el, { childList: true }); }

  function init(){ if (window.HOLO) return; window.HOLO = { v: '20261027', scan: () => { hudScan(); return { secs: secs.length, shown, cur }; } };
    theme(); fine(); setOn(); H.classList.toggle('holo-hid', D.hidden);
    const v = V();
    if (v) { let painted = true; try { painted = performance.getEntriesByType('paint').length > 0; } catch (e) {}
      lastKey = rkey(); mapV = scores(v); team(); if (on) { markLive(v); frame(heroOf(v), true); if (!painted) enter(v); /* no count-up on a first load: the numbers are readable at once (UX first) */ }
      watchRoot(v, () => onView(false)); hudScan(); }
    const tk = D.getElementById('ticker'); if (tk) { let m = scores(tk); watchRoot(tk, () => { const n = scores(tk); bumpDiff(m, n); m = n; }); }
    if (isFront()) { D.body.classList.add('holo-fdp'); const hero = D.querySelector('.fd .hero'); if (hero) frame(hero, true);
      ['teams', 'live', 'tune', 'tv', 'sports'].forEach(id => { const el = D.getElementById(id); if (!el) return; let m = scores(el); watchRoot(el, () => { const n = scores(el); bumpDiff(m, n); m = n; }); }); }
    addEventListener('hashchange', () => { setOn(); hudOpen(false); });
    if (D.body && window.MutationObserver) new MutationObserver(setOn).observe(D.body, { attributes: true, attributeFilter: ['class'] }); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
/* holo:end */
