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
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  var NARROW = window.matchMedia ? matchMedia('(max-width: 560px)') : null;
  var A = 'var(--accent,var(--blue,#5b8cff))', LV = '#ff4d5e';
  /* dark-only rules: the hubs' own theme switch (data-theme) wins, else the device setting */
  function dk(sel, body){ var a = sel.split('|'); return a.map(function(s){ return ':root.vibe-on[data-theme="dark"] ' + s; }).join(',') + '{' + body + '}'
    + '@media (prefers-color-scheme:dark){' + a.map(function(s){ return ':root.vibe-on:not([data-theme="light"]) ' + s; }).join(',') + '{' + body + '}}'; }
  var V = 'html.vibe-on ';
  var css =
  /* ---------- the arena rig, behind everything ---------- */
    '#vibe-rig{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;contain:strict;--va:rgb(91,140,255);--vb:rgb(170,100,255)}'
  + '#vibe-rig .vh{position:absolute;left:-15%;right:-15%;top:-140px;height:460px;background:radial-gradient(55% 60% at 50% 0%,color-mix(in srgb,var(--va) 44%,transparent),color-mix(in srgb,var(--vb) 14%,transparent) 55%,transparent 75%);opacity:.75;transition:opacity 1.1s ease}'
  + '#vibe-rig.flash .vh{opacity:1;transition:opacity .18s ease}'
  + '#vibe-rig b{position:absolute;top:-6vh;left:-60vw;width:120vw;height:112vh;transform-origin:50% 0;will-change:transform;'
  +   '-webkit-mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.62) 32%,transparent 70%);mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.62) 32%,transparent 70%)}'
  + '#vibe-rig .b1{margin-left:12vw;--c:var(--va);background:conic-gradient(from 158deg at 50% 0%,transparent 0deg,color-mix(in srgb,var(--c) 44%,transparent) 11deg,color-mix(in srgb,var(--c) 44%,transparent) 15deg,transparent 27deg,transparent 360deg);animation:vbSwayA 34s ease-in-out infinite alternate}'
  + '#vibe-rig .b2{margin-left:50vw;background:conic-gradient(from 171deg at 50% 0%,transparent 0deg,rgba(255,255,255,.1) 7deg,rgba(255,255,255,.1) 11deg,transparent 18deg,transparent 360deg);animation:vbSwayB 46s ease-in-out infinite alternate}'
  + '#vibe-rig .b3{margin-left:88vw;--c:var(--vb);background:conic-gradient(from 175deg at 50% 0%,transparent 0deg,color-mix(in srgb,var(--c) 44%,transparent) 12deg,color-mix(in srgb,var(--c) 44%,transparent) 16deg,transparent 28deg,transparent 360deg);animation:vbSwayC 39s ease-in-out infinite alternate}'
  + '@keyframes vbSwayA{0%{transform:rotate(-14deg)}100%{transform:rotate(4deg)}}'
  + '@keyframes vbSwayB{0%{transform:rotate(-7deg)}100%{transform:rotate(7deg)}}'
  + '@keyframes vbSwayC{0%{transform:rotate(12deg)}100%{transform:rotate(-5deg)}}'
  /* crowd lights: soft out-of-focus dots along the edges */
  + '#vibe-rig s{position:absolute;width:var(--z,60px);height:var(--z,60px);border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--k,var(--va)) 72%,transparent),transparent 68%);opacity:0;will-change:transform,opacity;animation:vbBok var(--t,22s) ease-in-out infinite;animation-delay:var(--d,0s)}'
  + '@keyframes vbBok{0%{opacity:0;transform:translate3d(0,14px,0) scale(.85)}25%{opacity:.75}60%{opacity:.45}100%{opacity:0;transform:translate3d(0,-60px,0) scale(1.1)}}'
  + '#vibe-rig .flo{position:absolute;left:-10%;right:-10%;bottom:-180px;height:360px;background:radial-gradient(50% 55% at 50% 100%,color-mix(in srgb,var(--vb) 22%,transparent),transparent 72%)}'
  /* light theme: a faint haze only; big boards and TV guides keep their own look */
  + ':root[data-theme="light"] #vibe-rig :is(b,s,.flo){display:none}:root[data-theme="light"] #vibe-rig .vh{opacity:.35}'
  + '@media (prefers-color-scheme:light){:root:not([data-theme="dark"]) #vibe-rig :is(b,s,.flo){display:none}:root:not([data-theme="dark"]) #vibe-rig .vh{opacity:.35}}'
  + 'body:is(.boardmode,.tvmode) #vibe-rig{display:none}'
  /* ---------- glass cards over the lights (dark) ---------- */
  + dk('#view :is(.card,.tile,.wcard,.gm)', 'background-color:rgba(8,11,20,.5);border-color:color-mix(in srgb,' + A + ' 16%,rgba(255,255,255,.1));border-top-color:rgba(255,255,255,.15)')
  /* ---------- LED numbers ---------- */
  + V + '.vibe-led{text-shadow:0 0 7px color-mix(in srgb,currentColor 50%,transparent),0 0 18px color-mix(in srgb,currentColor 26%,transparent)}'
  + ':root[data-theme="light"] .vibe-led{text-shadow:none}@media (prefers-color-scheme:light){:root:not([data-theme="dark"]) .vibe-led{text-shadow:none}}'
  /* ---------- live games breathe ---------- */
  + V + ':is(#view .livecard,#view .gm.islive,#view .wcard.holo-live,.fd a.tc:has(.pill-live)){position:relative}'
  + V + ':is(#view .livecard,#view .gm.islive,#view .wcard.holo-live,.fd a.tc:has(.pill-live))::after{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;'
  +   'box-shadow:0 0 0 1px color-mix(in srgb,' + LV + ' 55%,transparent),0 0 24px -3px color-mix(in srgb,' + LV + ' 60%,transparent),inset 0 0 18px -8px color-mix(in srgb,' + LV + ' 45%,transparent);opacity:.3;animation:vbLive 2.8s ease-in-out infinite}'
  + '@keyframes vbLive{50%{opacity:.95}}'
  /* ---------- where you are ---------- */
  + dk('header.top', 'box-shadow:0 1px 0 color-mix(in srgb,' + A + ' 40%,transparent),0 10px 28px -18px color-mix(in srgb,' + A + ' 90%,transparent)')
  + V + '.btab .bt-i{position:relative}'
  + V + '.btab .bt-i.on{color:color-mix(in srgb,' + A + ' 70%,#fff)}'
  + V + '.btab .bt-i.on :is(svg,img){filter:drop-shadow(0 0 6px color-mix(in srgb,' + A + ' 85%,transparent))}'
  + V + '.btab .bt-i.on::before{content:"";position:absolute;left:18%;right:18%;top:0;height:2px;border-radius:0 0 3px 3px;background:' + A + ';box-shadow:0 0 12px 1px ' + A + ',0 6px 22px 4px color-mix(in srgb,' + A + ' 35%,transparent)}'
  + dk(':is(.ng-sub a.on,#view .seg .on,#view .seg a.on,#view .seg button.on,#view .tabs .on,#view .pill.on)', 'box-shadow:0 0 0 1px color-mix(in srgb,' + A + ' 55%,transparent),0 0 20px -4px ' + A + ',0 8px 24px -10px ' + A + '!important')
  /* ---------- declutter ---------- */
  /* section headings: a glowing bar instead of the 01 / 02 number chips (hubs: Neo; home page: its own counter) */
  + V + ':is(body .sec>h2[data-neo],.fd .sec:not(.top) h2)::before{content:""!important;display:inline-block!important;width:4px!important;height:.82em!important;min-width:0!important;margin:0 10px 0 0!important;padding:0!important;border:0!important;border-radius:3px!important;vertical-align:-.04em!important;'
  +   'background:linear-gradient(180deg,color-mix(in srgb,' + A + ' 55%,#fff),' + A + ')!important;box-shadow:0 0 10px ' + A + ',0 0 22px -4px ' + A + '!important;font-size:inherit!important}'
  /* live score cards: two lines of the last play (three on a computer) */
  + V + '#view :is(.livecard,.wcard) .wh{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;overflow:hidden!important}'
  + '@media (max-width:760px){' + V + '#view :is(.livecard,.wcard) .wh{-webkit-line-clamp:2!important}}'
  + V + '.tv-foot{font-size:0!important}' + V + '.tv-foot a{font-size:13px}'
  + V + '.vibe-hide{display:none!important}'
  + '@media (prefers-reduced-motion:reduce){#vibe-rig b,#vibe-rig s,' + V + ':is(#view .livecard,#view .gm.islive,#view .wcard.holo-live,.fd a.tc)::after{animation:none!important}#vibe-rig s{opacity:.3}}';
  var st = D.createElement('style'); st.id = 'vibe-css'; st.textContent = css; D.head.appendChild(st);
  H.classList.add('vibe-on');

  /* ---------- the rig ---------- */
  var rig = D.createElement('div'); rig.id = 'vibe-rig'; rig.setAttribute('aria-hidden', 'true');
  var BOK = [[4,14,70,26,0,'va'],[93,22,54,31,6,'vb'],[8,46,40,24,11,'vb'],[90,58,64,28,3,'va'],[2,74,48,34,15,'va'],[96,86,58,25,9,'vb'],[50,6,90,38,18,'va']];
  rig.innerHTML = '<i class="vh"></i><i class="flo"></i><b class="b1"></b><b class="b2"></b><b class="b3"></b>'
    + BOK.map(function(k){ return '<s style="left:' + k[0] + '%;top:' + k[1] + '%;--z:' + k[2] + 'px;--t:' + k[3] + 's;--d:-' + k[4] + 's;--k:var(--' + k[5] + ')"></s>'; }).join('');
  function mount(){ if (!rig.isConnected && D.body) D.body.insertBefore(rig, D.body.firstChild); }

  /* team colors from Stage (the page's team), else the hub accent; dark colors are lifted so the light shows */
  function lum(c){ return c.map(function(v){ v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce(function(s, v, i){ return s + v * [.2126,.7152,.0722][i]; }, 0); }
  function lift(c){ c = c.slice(); for (var i = 0; i < 6 && lum(c) < .1; i++) c = c.map(function(v){ return v + (255 - v) * .18; }); return c.map(Math.round); }
  function parse(s){ s = String(s || '').trim(); var m = /^#([0-9a-f]{6})$/i.exec(s); if (m) return [0, 2, 4].map(function(i){ return parseInt(m[1].substr(i, 2), 16); });
    m = /^#([0-9a-f]{3})$/i.exec(s); if (m) return m[1].split('').map(function(x){ return parseInt(x + x, 16); });
    m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(s); return m ? [+m[1], +m[2], +m[3]] : null; }
  var lastTint = '';
  function tint(){ var a = null, b = null, S = window.JSH_STAGE;
    if (S && S.state === 'stage' && S.audit && S.audit.primary) { a = S.audit.primary; b = S.audit.second || null; }
    if (!a) a = parse(getComputedStyle(H).getPropertyValue('--accent')) || (D.body && parse(getComputedStyle(D.body).getPropertyValue('--accent')));
    if (!a) a = [91, 140, 255]; if (!b) b = [170, 100, 255];
    a = lift(a); b = lift(b); var key = a + '/' + b; if (key === lastTint) return; lastTint = key;
    rig.style.setProperty('--va', 'rgb(' + a.join(',') + ')'); rig.style.setProperty('--vb', 'rgb(' + b.join(',') + ')'); }
  function flash(){ if (RM && RM.matches) return; rig.classList.add('flash'); setTimeout(function(){ rig.classList.remove('flash'); }, 380); }

  /* ---------- LED numbers + the declutter tags ---------- */
  var seen = new WeakSet(), NUM = /^[\s\d:.,\-–+%#()]+$/, DIG = /\d/;
  function scan(root){ if (!root || !root.querySelectorAll) return;
    var list = root.querySelectorAll('*'), n = 0;
    for (var i = 0; i < list.length && n < 4000; i++) { var el = list[i]; if (el.childElementCount || seen.has(el)) continue; seen.add(el);
      var t = el.textContent; if (!t || t.length > 12 || !DIG.test(t)) continue;
      if (el.closest('table,#vibe-rig,input,textarea,select,svg')) continue; n++;
      var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 0;
      if ((/Orbitron/i.test(cs.fontFamily) && fs >= 12) || (fs >= 19 && NUM.test(t))) el.classList.add('vibe-led'); }
    /* home page, phones: the Your teams buttons fit on one line ("Add to calendar" reads "Calendar") */
    if (NARROW && NARROW.matches) root.querySelectorAll('.cal-btn').forEach(function(b){ if (b.dataset.vibe) return; var w = b.textContent;
      if (/Add to calendar/.test(w)) { b.dataset.vibe = 1; b.setAttribute('aria-label', 'Add to calendar'); for (var c = b.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && /Add to calendar/.test(c.nodeValue)) c.nodeValue = c.nodeValue.replace('Add to calendar', 'Calendar'); } });
    var v = D.getElementById('view');
    if (v) for (var j = 0; j < v.children.length; j++) { var c = v.children[j]; if (c.classList.contains('eyebrow') && /^Game (night|day)\b/i.test(c.textContent.trim()) && c.nextElementSibling) c.classList.add('vibe-hide'); } }
  var pend = [], timer = 0;
  function queue(n){ pend.push(n); if (!timer) timer = setTimeout(function(){ timer = 0; var p = pend; pend = []; for (var i = 0; i < p.length; i++) if (p[i].isConnected) scan(p[i].nodeType === 1 ? p[i] : p[i].parentElement); }, 220); }

  function start(){ mount(); tint(); scan(D.body);
    new MutationObserver(function(ms){ for (var i = 0; i < ms.length; i++) { var m = ms[i]; if (m.type === 'characterData') { queue(m.target); continue; } for (var k = 0; k < m.addedNodes.length; k++) { var a = m.addedNodes[k]; if (a.nodeType === 1 && a.id !== 'vibe-rig') queue(a); else if (a.nodeType === 3) queue(a); } } })
      .observe(D.body, { childList: true, subtree: true, characterData: true });
    new MutationObserver(function(){ setTimeout(tint, 60); }).observe(H, { attributes: true, attributeFilter: ['data-theme'] });
    new MutationObserver(function(){ setTimeout(tint, 60); }).observe(D.body, { attributes: true, attributeFilter: ['class'] });
    addEventListener('hashchange', function(){ flash(); setTimeout(tint, 120); setTimeout(tint, 900); });
    setTimeout(tint, 400); setTimeout(tint, 1500); }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* vibe:end */
