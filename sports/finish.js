/* finish:start - "Finish": the refined look (2026-11-10, stage 2 of Jamo's big upgrade: "so sick, so fluid, amazing design
   and feel"; he chose to refine today's dark, team-color look rather than change it). Published by sports-hub/build.sh as
   /sports/finish.js and loaded last by the shared top bar (hubbar.html), on the four hubs.
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
  if (!D.getElementById('view') && D.readyState !== 'loading') return;
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
    +   ':root body.has-btab .jbl{left:10px;right:10px;bottom:calc(74px + env(safe-area-inset-bottom))!important;height:36px;padding-bottom:0;border-radius:14px;overflow:hidden;'
    +     'border:1px solid rgba(255,255,255,.1);box-shadow:0 10px 26px -12px rgba(0,0,0,.6)}'
    +   ':root body.has-btab #jsh-fw{left:10px;right:10px;margin-bottom:6px;padding:0 10px;border-radius:14px;border:1px solid rgba(255,255,255,.12)}'
    +   ':root body.has-btab{padding-bottom:calc(128px + env(safe-area-inset-bottom))!important}'
    + '}'
    /* ---------- press feedback ---------- */
    + '@media (prefers-reduced-motion:no-preference){'
    +   ':root :is(.gm.click,a.card,a.tile,.tile-link,.btn,.bt-i,.seg a,.days a,.wk a,.royh-r,.fw-btn,.fw-g,.ql a,.sp-h,a.tc,.livecard,.sbt,.wcard){transition:transform .14s cubic-bezier(.2,.8,.2,1),filter .14s}'
    +   ':root :is(.gm.click,a.card,a.tile,.tile-link,.livecard,.sbt,.wcard,.royh-r,a.tc):active{transform:scale(.982)}'
    +   ':root :is(.btn,.bt-i,.seg a,.days a,.wk a,.fw-btn,.ql a):active{transform:scale(.94)}'
    +   ':root tr.click:active>td{background:color-mix(in srgb,var(--accent,#5b8cff) 12%,transparent)}'
    + '}'
    /* ---------- cards: one radius, depth, a top hairline ---------- */
    + ':root #view :is(.card,.tile,.tblwrap){border-radius:18px}'
    + ':root #view .gmlist .gm{border-radius:14px}'
    + ':root:not(.holo-lt) #view :is(.card,.tile,.gm,.tblwrap){box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 18px 36px -26px rgba(0,0,0,.85)}'
    + ':root.holo-lt #view :is(.card,.tile,.gm,.tblwrap){box-shadow:0 10px 26px -18px rgba(15,23,42,.28)}'
    /* ---------- type ---------- */
    + ':root #view .page-head h1{letter-spacing:-.024em;line-height:1.06}'
    + ':root #view .sec h2{letter-spacing:-.018em}'
    + ':root #view :is(table.tbl td,table.tbl th,.sc,.val,.rb .v,.gm .sp,.pw,.sd){font-variant-numeric:tabular-nums}'
    + ':root #view .page-head .eyebrow{letter-spacing:.16em}'
    /* ---------- scrolling: blocks ease up into place (zero-specificity, so anything with its own animation keeps it) ---------- */
    + '@supports (animation-timeline:view()){@media (prefers-reduced-motion:no-preference){'
    /* fill backwards only: once a block is in, the animation lets go, so press feedback and hover still work on it; the
       range is the first 110 px of a block showing, so a tall card is never left half faded while you read its top */
    +   ':where(#view) :where(.card,.tile,.gmlist>.gm,.tblwrap,.daygrp>h3){animation:jshRise linear backwards;animation-timeline:view();animation-range:entry 0px entry 110px}'
    +   '@keyframes jshRise{from{opacity:.25;transform:translateY(14px) scale(.985)}}'
    + '}}';
  function start(){
    if (!D.getElementById('view')) return;
    var s = D.createElement('style'); s.id = 'jsh-finish'; s.textContent = css; (D.head || H).appendChild(s);
    /* iOS only shows :active styles when the page listens for touches */
    D.addEventListener('touchstart', function(){}, {passive: true});
  }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* finish:end */
