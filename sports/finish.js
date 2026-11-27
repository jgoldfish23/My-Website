/* finish:start - "Finish": the refined look (2026-11-10, stage 2 of Jamo's big upgrade: "so sick, so fluid, amazing design
   and feel"; he chose to refine today's dark, team-color look rather than change it). Published by sports-hub/build.sh as
   /sports/finish.js and loaded last by the shared top bar (hubbar.html), on the four hubs and (since 2026-11-24) Live Center.
   One style sheet; every rule starts with :root (or sits in :where) so it lands on top of the hubs' own rules without
   fighting their animations. It changes no data and adds no new blocks to a page:
   - Floating bottom menu (phones): the tab bar becomes a rounded glass bar that floats above the page edge, with a soft
     pill behind the tab you are on (Fluid slides that pill from tab to tab). The scores ticker and the Follow bar sit on
     it as matching rounded strips.
   - Press feedback: rows, cards, buttons and tabs dip slightly under your finger, so every tap answers.
   - Cards: one corner radius, a soft shadow underneath for depth (no glow), a hairline highlight on the top edge.
   - Type: tighter headings, steadier numbers (every figure in a table or score lines up digit under digit).
   - Scrolling: cards and rows ease up into place as they enter the screen (only where the browser can do it on its own
     thread; never with Reduce Motion, and never on anything that already has its own animation).
   Light mode keeps its light surfaces: only the shadows change there. */
(function(){
  if (window.__jshFinish) return; window.__jshFinish = true;
  var D = document, H = D.documentElement;
  var isLive = /\/sports\/live\/?$/.test(location.pathname) || !!D.getElementById('grid-wrap');
  if (!D.getElementById('view') && !isLive && D.readyState !== 'loading') return;
  var css = ''
    /* ---------- floating bottom menu ---------- */
    + '@media (max-width:760px){'
    +   ':root .btab{left:10px;right:10px;bottom:calc(8px + env(safe-area-inset-bottom));height:60px;padding:0 6px;border-radius:22px;'
    +     'border:1px solid color-mix(in srgb,var(--ink,#fff) 12%,transparent);background:color-mix(in srgb,var(--surface,#0e1422) 80%,transparent);'
    +     '-webkit-backdrop-filter:blur(22px) saturate(1.5);backdrop-filter:blur(22px) saturate(1.5);'
    +     'box-shadow:0 16px 38px -12px rgba(0,0,0,.7),inset 0 1px 0 color-mix(in srgb,var(--ink,#fff) 9%,transparent)}'
    +   ':root .bt-i{border-radius:16px;z-index:0}'
    +   ':root .bt-i.on::before{top:6px;bottom:6px;left:5px;right:5px;height:auto;border-radius:15px;z-index:-1;'
    +     'background:color-mix(in srgb,var(--accent,#5b8cff) 20%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent,#5b8cff) 32%,transparent)}'
    /* less phone clutter (2026-11-26, Jamo): a hub page with its own bottom tabs already shows the scores, so the ticker
       stays off there instead of stacking a second bar on the tabs. Home, Live Center and desktop keep it. */
    +   ':root body.has-btab .jbl,:root body.has-btab .jbl-pill{display:none!important}'
    +   ':root body.has-btab #jsh-fw{left:10px;right:10px;margin-bottom:6px;padding:0 10px;border-radius:14px;border:1px solid rgba(255,255,255,.12)}'
    +   ':root body.has-btab{padding-bottom:calc(84px + env(safe-area-inset-bottom))!important}'
    + '}'
    /* ---------- press feedback ---------- */
    + '@media (prefers-reduced-motion:no-preference){'
    +   ':root :is(.gm.click,a.card,a.tile,.tile-link,.btn,.bt-i,.seg a,.days a,.wk a,.royh-r,.fw-btn,.fw-g,.ql a,.sp-h,a.tc,.livecard,.sbt,.wcard,a.mc,.spot a){transition:transform .14s cubic-bezier(.2,.8,.2,1),filter .14s}'
    +   ':root :is(.gm.click,a.card,a.tile,.tile-link,.livecard,.sbt,.wcard,.royh-r,a.tc,a.mc):active{transform:scale(.982)}'
    +   ':root :is(.btn,.bt-i,.seg a,.days a,.wk a,.fw-btn,.ql a):active{transform:scale(.94)}'
    +   ':root tr.click:active>td{background:color-mix(in srgb,var(--accent,#5b8cff) 12%,transparent)}'
    + '}'
    /* ---------- cards: one radius, depth, a top hairline ---------- */
    + ':root #view :is(.card,.tile,.tblwrap){border-radius:18px}'
    + ':root #view .gmlist .gm{border-radius:14px}'
    + ':root:not(.holo-lt) #view :is(.card,.tile,.gm,.tblwrap){box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 18px 36px -26px rgba(0,0,0,.85)}'
    + ':root.holo-lt #view :is(.card,.tile,.gm,.tblwrap){box-shadow:0 10px 26px -18px rgba(15,23,42,.28)}'
    /* Live Center cards (2026-11-24 / 2026-11-26: also .lv, not only home .fd) */
    + ':root :is(.fd,.lv) :is(.mc,.spot){border-radius:18px}'
    + ':root:not(.holo-lt) :is(.fd,.lv) :is(.mc,.spot){box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 18px 36px -26px rgba(0,0,0,.85)}'
    /* ---------- type ---------- */
    + ':root #view .page-head h1{letter-spacing:-.024em;line-height:1.06}'
    + ':root #view .sec h2,:root :is(.fd,.lv) .sec h2{letter-spacing:-.018em}'
    + ':root #view :is(table.tbl td,table.tbl th,.sc,.val,.rb .v,.gm .sp,.pw,.sd){font-variant-numeric:tabular-nums}'
    + ':root #view .page-head .eyebrow{letter-spacing:.16em}'
    /* ---------- scrolling: blocks ease up into place (zero-specificity, so anything with its own animation keeps it) ---------- */
    /* ---------- bottom tabs (11-26): the page you're on is the brightest thing in the bar. The league accent alone read as
       dimmed - darker than the other tabs over the holiday field - so the current page looked switched off. ---------- */
    + ':root body .btab .bt-i{color:rgba(238,242,248,.64)}'
    + ':root body .btab .bt-i.on{color:#fff!important;font-weight:800}'
    + ':root body .btab .bt-i.on :is(svg,img){opacity:1!important;filter:none!important}'
    + '@media (max-width:760px){:root body .btab .bt-i.on::before{background:color-mix(in srgb,var(--accent,#5b8cff) 40%,rgba(255,255,255,.06))!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent,#5b8cff) 65%,#fff)!important}}'
    + 'html.jsh-lt body .btab .bt-i{color:rgba(15,23,42,.74)}html.jsh-lt body .btab .bt-i.on{color:#0f172a!important}'
    + '@media (max-width:760px){html.jsh-lt body .btab .bt-i.on::before{background:color-mix(in srgb,var(--accent,#5b8cff) 22%,#fff)!important}}'
    /* ---------- one selected style (11-27): hub tabs, filters, week and day pickers and team tabs all show the choice the
       same way - a filled pill in the hub's color (the darker --accent-text, so white type stays readable) with a light rim
       that keeps a very dark color (Eagles navy) visible on the dark page. Four different looks before. ---------- */
    + ':root body :is(header.top .ng-sub a.on,#view .seg a.on,#view .wk a.on,#view .days a.on,#view .jtab button[aria-selected="true"]){'
    +   'background:var(--accent-text,var(--accent))!important;background-image:linear-gradient(180deg,color-mix(in srgb,var(--accent-text,var(--accent)) 86%,#fff),var(--accent-text,var(--accent)))!important;'
    +   'color:#fff!important;border-color:transparent!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent-text,var(--accent)) 40%,#fff),0 6px 16px -8px color-mix(in srgb,var(--accent-text,var(--accent)) 80%,transparent)!important}'
    + ':root body :is(header.top .ng-sub a.on,#view .seg a.on,#view .wk a.on,#view .days a.on,#view .jtab button[aria-selected="true"]) *{color:inherit}'
    /* dark pages: --accent-text is the LIGHT shade there (text on dark), so white type on it fails - use a deep pill in the
       team color with a bright rim instead */
    + 'html.jsh-dk body :is(header.top .ng-sub a.on,#view .seg a.on,#view .wk a.on,#view .days a.on,#view .jtab button[aria-selected="true"]){'
    +   'background:color-mix(in srgb,var(--accent-text,var(--accent)) 30%,#0a0f1c)!important;background-image:none!important;'
    +   'box-shadow:inset 0 0 0 1.5px var(--accent-text,var(--accent)),0 6px 16px -8px color-mix(in srgb,var(--accent-text,var(--accent)) 70%,transparent)!important}'
    + '@supports (animation-timeline:view()){@media (prefers-reduced-motion:no-preference){'
    +   ':where(#view) :where(.card,.tile,.gmlist>.gm,.tblwrap,.daygrp>h3){animation:jshRise linear backwards;animation-timeline:view();animation-range:entry 0px entry 110px}'
    +   ':where(.fd,.lv) :where(.mc,.spot,.up,.feed){animation:jshRise linear backwards;animation-timeline:view();animation-range:entry 0px entry 110px}'
    +   '@keyframes jshRise{from{opacity:.25;transform:translateY(14px) scale(.985)}}'
    + '}}';
  function start(){
    if (!D.getElementById('view') && !(/\/sports\/live\/?$/.test(location.pathname) || D.getElementById('grid-wrap'))) return;
    var s = D.createElement('style'); s.id = 'jsh-finish'; s.textContent = css; (D.head || H).appendChild(s);
    D.addEventListener('touchstart', function(){}, {passive: true});
  }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);

  /* sideways rows (11-26): tab bars, week and day pickers, filter chips and card rows scroll sideways on a phone with nothing
     to say so ("Previe..." just stopped at the edge). The edge that has more fades out; at either end the fade goes away.
     Every page (home's Live now row too). Only classes change, so the observers on the page are not re-fired. */
  var XS = '.ng-sub,.subnav,.seg,.wk,.days,.lvf,.jsh-xs,.jtab,.lrow,.tvq-l';
  var xsCss = D.createElement('style'); xsCss.id = 'jsh-xs-fade'; xsCss.textContent = ''
    + '.xs-r:not(.xs-l){-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 30px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 30px),transparent)}'
    + '.xs-l:not(.xs-r){-webkit-mask-image:linear-gradient(90deg,transparent,#000 30px);mask-image:linear-gradient(90deg,transparent,#000 30px)}'
    + '.xs-l.xs-r{-webkit-mask-image:linear-gradient(90deg,transparent,#000 30px,#000 calc(100% - 30px),transparent);mask-image:linear-gradient(90deg,transparent,#000 30px,#000 calc(100% - 30px),transparent)}';
  (D.head || H).appendChild(xsCss);
  function xsMark(el){ var room = el.scrollWidth - el.clientWidth, more = room > 4 && getComputedStyle(el).overflowX !== 'visible';
    var r = more && el.scrollLeft < room - 4, l = more && el.scrollLeft > 4;
    if (el.classList.contains('xs-r') !== r) el.classList.toggle('xs-r', r);
    if (el.classList.contains('xs-l') !== l) el.classList.toggle('xs-l', l); }
  /* 11-27 (accessibility): the bottom tab for this page carries aria-current, like the top league switcher */
  function btCur(){ D.querySelectorAll('.btab .bt-i').forEach(function(e){ var on = e.classList.contains('on'); if (on && e.getAttribute('aria-current') !== 'page') e.setAttribute('aria-current', 'page'); else if (!on && e.hasAttribute('aria-current')) e.removeAttribute('aria-current'); }); }
  var xsQ = 0; function xsAll(){ if (xsQ) return; xsQ = requestAnimationFrame(function(){ xsQ = 0; D.querySelectorAll(XS).forEach(xsMark); btCur(); }); }
  window.addEventListener('hashchange', function(){ setTimeout(xsAll, 60); });
  D.addEventListener('scroll', function(e){ var t = e.target; if (t && t.nodeType === 1 && t.matches(XS)) xsMark(t); }, true);
  window.addEventListener('resize', xsAll);
  function xsGo(){ xsAll(); if (window.MutationObserver) new MutationObserver(xsAll).observe(D.body, { childList: true, subtree: true }); }
  if (D.body) xsGo(); else D.addEventListener('DOMContentLoaded', xsGo);
})();
/* finish:end */
