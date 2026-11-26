/* vibe:start - "Vibe": arena lighting, glow and a declutter pass for every page (2026-11-07, Jamo: "Declutter where
   possible. Enhance the lighting and special effects and glow! More of a vibe" - for the whole sports hub).
   Published by sports-hub/build.sh as /sports/vibe.js and loaded last by the shared top bar (hubbar.html), so the home
   page, Live Center, alerts, articles and all four hubs (CFB, NFL, NBA, CBB) get it. It sits on top of Neo, Holo,
   Stage and Glow and changes no data, sizes or order.
   UX first (ux-first-design): the lights live behind the cards and toward the edges and top, never on text; glow marks
   what matters (live games, scores, where you are); motion is slow and stops for reduced-motion users.
   Lighting:
   - Arena rig: three soft spotlight beams from the top of the screen in the page's team colors (from Stage) or the
     league accent, swaying slowly; a haze under the header that brightens for a moment when you change pages; a few
     out-of-focus crowd lights drifting along the edges. The beams fade out before the middle of the screen.
   - Glass cards over the lights (dark mode): darker glass with a lit top rim, so the light frames the cards.
   - LED numbers: scores, clocks, countdowns and big stat numbers glow in their own color (tables are left alone).
   - Live games breathe: a soft pulse of light around live game cards.
   - Where you are: the selected tab, pill and bottom-bar button glow; a light strip under the pinned header.
   Declutter:
   - live score cards show two lines of the last play, not a paragraph (three on a computer)
   - section headings lose the "01 / 02" number chips (a small glowing bar instead)
   - the home page's "Full grids, network by network:" label goes (the TV guide buttons stay)
   - game night / game day: the "Game night · updates live" line over the board goes (the board's clock shows it) */
(function(){
  if (window.__jshVibe) return; window.__jshVibe = true;
  var D = document, H = D.documentElement;
  var NARROW = window.matchMedia ? matchMedia('(max-width: 560px)') : null;
  var A = 'var(--accent,var(--blue,#5b8cff))', LV = '#ff4d5e';
  /* dark-only rules: the hubs' own theme switch (data-theme) wins, else the device setting */
  function dk(sel, body){ var a = sel.split('|'); return a.map(function(s){ return ':root.vibe-on[data-theme="dark"] ' + s; }).join(',') + '{' + body + '}'
    + '@media (prefers-color-scheme:dark){' + a.map(function(s){ return ':root.vibe-on:not([data-theme="light"]) ' + s; }).join(',') + '{' + body + '}}'; }
  var V = 'html.vibe-on ';
  /* 2026-11-24: arena beams/haze/crowd-light CSS removed (was already unmounted 11-16). LED + declutter stay. */
  var css =
    dk('#view :is(.card,.tile,.wcard,.gm)', 'background-color:rgba(8,11,20,.5);border-color:color-mix(in srgb,' + A + ' 16%,rgba(255,255,255,.1));border-top-color:rgba(255,255,255,.15)')
  + V + '.vibe-led{text-shadow:0 0 7px color-mix(in srgb,currentColor 50%,transparent),0 0 18px color-mix(in srgb,currentColor 26%,transparent)}'
  + ':root[data-theme="light"] .vibe-led{text-shadow:none}@media (prefers-color-scheme:light){:root:not([data-theme="dark"]) .vibe-led{text-shadow:none}}'
  + V + ':is(#view .livecard,#view .gm.islive,#view .wcard.holo-live,.fd a.tc:has(.pill-live)){position:relative}'
  + V + ':is(#view .livecard,#view .gm.islive,#view .wcard.holo-live,.fd a.tc:has(.pill-live))::after{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;'
  +   'box-shadow:0 0 0 1px color-mix(in srgb,' + LV + ' 55%,transparent),0 0 24px -3px color-mix(in srgb,' + LV + ' 60%,transparent),inset 0 0 18px -8px color-mix(in srgb,' + LV + ' 45%,transparent);opacity:.3;animation:vbLive 2.8s ease-in-out infinite}'
  + '@keyframes vbLive{50%{opacity:.95}}'
  + dk('header.top', 'box-shadow:0 1px 0 color-mix(in srgb,' + A + ' 40%,transparent),0 10px 28px -18px color-mix(in srgb,' + A + ' 90%,transparent)')
  + V + '.btab .bt-i{position:relative}'
  + V + '.btab .bt-i.on{color:color-mix(in srgb,' + A + ' 70%,#fff)}'
  + V + '.btab .bt-i.on :is(svg,img){filter:drop-shadow(0 0 6px color-mix(in srgb,' + A + ' 85%,transparent))}'
  + V + '.btab .bt-i.on::before{content:"";position:absolute;left:18%;right:18%;top:0;height:2px;border-radius:0 0 3px 3px;background:' + A + ';box-shadow:0 0 12px 1px ' + A + ',0 6px 22px 4px color-mix(in srgb,' + A + ' 35%,transparent)}'
  + dk(':is(.ng-sub a.on,#view .seg .on,#view .seg a.on,#view .seg button.on,#view .tabs .on,#view .pill.on)', 'box-shadow:0 0 0 1px color-mix(in srgb,' + A + ' 55%,transparent),0 0 20px -4px ' + A + ',0 8px 24px -10px ' + A + '!important')
  + V + ':is(body .sec>h2[data-neo],.fd .sec:not(.top) h2)::before{content:""!important;display:inline-block!important;width:4px!important;height:.82em!important;min-width:0!important;margin:0 10px 0 0!important;padding:0!important;border:0!important;border-radius:3px!important;vertical-align:-.04em!important;'
  +   'background:linear-gradient(180deg,color-mix(in srgb,' + A + ' 55%,#fff),' + A + ')!important;box-shadow:0 0 10px ' + A + ',0 0 22px -4px ' + A + '!important;font-size:inherit!important}'
  + V + '#view :is(.livecard,.wcard) .wh{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;overflow:hidden!important}'
  + '@media (max-width:760px){' + V + '#view :is(.livecard,.wcard) .wh{-webkit-line-clamp:2!important}}'
  + V + '.tv-foot{font-size:0!important}' + V + '.tv-foot a{font-size:13px}'
  + V + '.vibe-hide{display:none!important}'
  + '@media (prefers-reduced-motion:reduce){' + V + ':is(#view .livecard,#view .gm.islive,#view .wcard.holo-live,.fd a.tc)::after{animation:none!important}}';
  var st = D.createElement('style'); st.id = 'vibe-css'; st.textContent = css; D.head.appendChild(st);
  H.classList.add('vibe-on');

  /* ---------- LED numbers + the declutter tags ---------- */
  var seen = new WeakSet(), NUM = /^[\s\d:.,\-–+%#()]+$/, DIG = /\d/;
  function scan(root){ if (!root || !root.querySelectorAll) return;
    var list = root.querySelectorAll('*'), n = 0;
    for (var i = 0; i < list.length && n < 4000; i++) { var el = list[i]; if (el.childElementCount || seen.has(el)) continue; seen.add(el);
      var t = el.textContent; if (!t || t.length > 12 || !DIG.test(t)) continue;
      if (el.closest('table,input,textarea,select,svg')) continue; n++;
      var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 0;
      if ((/Orbitron/i.test(cs.fontFamily) && fs >= 12) || (fs >= 19 && NUM.test(t))) el.classList.add('vibe-led'); }
    if (NARROW && NARROW.matches) root.querySelectorAll('.cal-btn').forEach(function(b){ if (b.dataset.vibe) return; var w = b.textContent;
      if (/Add to calendar/.test(w)) { b.dataset.vibe = 1; b.setAttribute('aria-label', 'Add to calendar'); for (var c = b.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && /Add to calendar/.test(c.nodeValue)) c.nodeValue = c.nodeValue.replace('Add to calendar', 'Calendar'); } });
    var v = D.getElementById('view');
    if (v) for (var j = 0; j < v.children.length; j++) { var c = v.children[j]; if (c.classList.contains('eyebrow') && /^Game (night|day)\b/i.test(c.textContent.trim()) && c.nextElementSibling) c.classList.add('vibe-hide'); } }
  var pend = [], timer = 0;
  function queue(n){ pend.push(n); if (!timer) timer = setTimeout(function(){ timer = 0; var p = pend; pend = []; for (var i = 0; i < p.length; i++) if (p[i].isConnected) scan(p[i].nodeType === 1 ? p[i] : p[i].parentElement); }, 220); }

  function start(){ scan(D.body);
    new MutationObserver(function(ms){ for (var i = 0; i < ms.length; i++) { var m = ms[i]; if (m.type === 'characterData') { queue(m.target); continue; } for (var k = 0; k < m.addedNodes.length; k++) { var a = m.addedNodes[k]; if (a.nodeType === 1) queue(a); else if (a.nodeType === 3) queue(a); } } })
      .observe(D.body, { childList: true, subtree: true, characterData: true }); }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* vibe:end */
