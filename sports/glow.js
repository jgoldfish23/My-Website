/* Glow: lighting and effects for every page (2026-10-31, Jamo: "Let's enhance the design as well and add in fun lighting and
   effects"). Published by build.sh as /sports/glow.js and loaded (defer) by the shared top bar, so the home page, Live Center,
   alerts and all three hubs get it. UX first (see ux-first-design): the light follows what you're touching and what's
   happening, it never covers text, and nothing waits on it.
   - Spotlight: on a computer, a soft light in the card's own team or league color follows the mouse across cards, tiles
     and game rows. It's drawn on one floating layer clipped to the card, so no card's own styles are touched.
   - Tap light: on a phone, tapping a card sends a quick ring of light out from your finger, so a tap feels answered.
   - Hero sweep: a band of light glides across the big page headers (the home page hero, team and game headers) when the
     page opens, and again when you hover one.
   - Live glow: live game cards on the home page breathe in their league color while the game is on.
   - Top bar: the page you're on glows in its league color.
   - Win burst: the first time the home page shows a new win for one of Jamo's teams ("Last: W ..."), confetti in that
     team's colors pops out of its card. Each win celebrates once per device.
   Everything is off for people who ask their device to reduce motion, except the still spotlight colors. */
(function(){
  if (window.__jshGlow) return; window.__jshGlow = true;
  var D = document, W = window, root = D.documentElement;
  var calm = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = W.matchMedia && W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  /* light pages get a gentler, multiplied light instead of a glowing one: read the page's own background */
  var light = function () { var bg = '', el = D.body; while (el) { bg = getComputedStyle(el).backgroundColor; if (bg && !/rgba?\([^)]*,\s*0\)$|transparent/.test(bg)) break; el = el === D.body ? root : null; }
    var m = /(\d+)\D+(\d+)\D+(\d+)/.exec(bg || ''); if (!m) return false; return (.2126 * m[1] + .7152 * m[2] + .0722 * m[3]) / 255 > .55; };
  /* the cards that light up: home page team cards, live cards, TV rows, headline box; hub cards, tiles and table rows */
  var CARDS = '.tc,.lc,.tv-g,.nw-card,.sp-card,.card,.tile,.gcard,.game,.pm-cmpc,.pl-card,.rb,.bt-i,.jss-r';

  var css = D.createElement('style'); css.id = 'glow-css'; css.textContent =
    /* the floating spotlight and tap ring */
    '.jg-spot{position:fixed;left:0;top:0;z-index:2147482000;pointer-events:none;opacity:0;transition:opacity .25s ease;border-radius:inherit;mix-blend-mode:screen}'
    + '.jg-spot.on{opacity:1}.jg-spot.lite{mix-blend-mode:multiply}'
    + '.jg-ring{position:fixed;z-index:2147482001;pointer-events:none;border-radius:50%;width:16px;height:16px;margin:-8px 0 0 -8px;background:radial-gradient(circle,color-mix(in srgb,var(--jg) 60%,#fff) 0,transparent 70%);opacity:.75;animation:jgRing .55s ease-out forwards;mix-blend-mode:screen}'
    + '.jg-ring.lite{mix-blend-mode:multiply;opacity:.45}'
    + '@keyframes jgRing{to{transform:scale(14);opacity:0}}'
    /* hero sweep: a light band inside its own clipped layer */
    + '.jg-sweep{position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none;z-index:1}'
    + '.jg-sweep::before{content:"";position:absolute;top:-40%;bottom:-40%;width:38%;left:-45%;transform:skewX(-18deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.07) 35%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.07) 65%,transparent)}'
    + '.jg-sweep.go::before{animation:jgSweep 1.6s cubic-bezier(.4,0,.2,1) forwards}'
    + '@keyframes jgSweep{to{left:120%}}'
    /* live cards breathe in their league color (the home page's .lc carry --c) */
    + '@media (prefers-reduced-motion:no-preference){.lc.jg-live{animation:jgLive 2.6s ease-in-out infinite}}'
    + '@keyframes jgLive{0%,100%{box-shadow:var(--sh,0 1px 2px rgba(0,0,0,.2)),0 0 0 1px color-mix(in srgb,var(--c) 30%,transparent)}50%{box-shadow:var(--sh,0 1px 2px rgba(0,0,0,.2)),0 0 0 1px color-mix(in srgb,var(--c) 70%,transparent),0 0 26px -4px color-mix(in srgb,var(--c) 75%,transparent)}}'
    /* top bar: the page you're on glows */
    + '.jsh-nav a.on{box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),0 4px 18px -3px var(--c),0 0 26px -8px var(--c)!important}'
    + '@media (prefers-reduced-motion:no-preference){.jsh-nav a.on{animation:jgNav 3.2s ease-in-out infinite}}'
    + '@keyframes jgNav{50%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),0 4px 22px -2px var(--c),0 0 34px -6px var(--c)}}'
    /* win burst */
    + '.jg-conf{position:fixed;z-index:2147482002;pointer-events:none;width:8px;height:12px;border-radius:2px;will-change:transform,opacity}'
    + '@media print{.jg-spot,.jg-ring,.jg-sweep,.jg-conf{display:none!important}}';
  D.head.appendChild(css);

  /* ---------- color of a card: its team color, else its league color, else the page accent ---------- */
  function colorOf(el){ var cs = getComputedStyle(el), v = '';
    ['--tc', '--team', '--c', '--pc', '--accent'].some(function (k) { v = cs.getPropertyValue(k).trim(); return !!v && !/^var\(/.test(v); });
    if (!v) v = getComputedStyle(root).getPropertyValue('--accent').trim() || '#4f8cff';
    return v; }
  function cardAt(t){ var c = t && t.closest && t.closest(CARDS); if (!c) return null; var r = c.getBoundingClientRect(); return (r.width < 40 || r.height < 24) ? null : c; }

  /* ---------- spotlight (mouse) ---------- */
  if (fine) { var spot = D.createElement('div'); spot.className = 'jg-spot'; D.body.appendChild(spot); var cur = null, raf = 0, mx = 0, my = 0;
    var paint = function () { raf = 0; if (!cur || !cur.isConnected) { spot.classList.remove('on'); return; } var r = cur.getBoundingClientRect(), col = colorOf(cur), lite = !!light();
      spot.classList.toggle('lite', lite);
      spot.style.cssText = 'transform:translate(' + r.left + 'px,' + r.top + 'px);width:' + r.width + 'px;height:' + r.height + 'px;border-radius:' + getComputedStyle(cur).borderRadius + ';'
        + 'background:radial-gradient(' + Math.max(180, Math.min(420, r.width * .9)) + 'px circle at ' + (mx - r.left) + 'px ' + (my - r.top) + 'px,color-mix(in srgb,color-mix(in srgb,' + col + ' ' + (lite ? 85 : 55) + '%,#fff) ' + (lite ? 22 : 42) + '%,transparent),transparent 70%)';
      spot.classList.add('on'); };
    D.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; mx = e.clientX; my = e.clientY; var c = cardAt(e.target); if (c !== cur) cur = c; if (!raf) raf = requestAnimationFrame(paint); }, { passive:true });
    D.addEventListener('pointerleave', function () { cur = null; spot.classList.remove('on'); });
    W.addEventListener('scroll', function () { if (cur && !raf) raf = requestAnimationFrame(paint); }, { passive:true });
    W.addEventListener('blur', function () { cur = null; spot.classList.remove('on'); }); }

  /* ---------- tap light (touch) ---------- */
  if (!calm) D.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; var c = cardAt(e.target); if (!c) return;
    var r = D.createElement('div'); r.className = 'jg-ring' + (light() ? ' lite' : ''); r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; r.style.setProperty('--jg', colorOf(c)); D.body.appendChild(r); setTimeout(function () { r.remove(); }, 650); }, { passive:true });

  /* ---------- hero sweep ---------- */
  var HEROES = '.hero,.thead,.ghead,.phero';
  function sweep(el){ if (calm || !el || el.offsetHeight < 60) return; var s = el.querySelector(':scope > .jg-sweep');
    if (!s) { if (getComputedStyle(el).position === 'static') el.style.position = 'relative'; s = D.createElement('div'); s.className = 'jg-sweep'; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); }
    s.classList.remove('go'); void s.offsetWidth; s.classList.add('go'); }
  function sweepAll(){ D.querySelectorAll(HEROES).forEach(function (h) { if (!h.dataset.jgSwept) { h.dataset.jgSwept = '1'; setTimeout(function () { sweep(h); }, 250); } }); }
  if (fine && !calm) D.addEventListener('pointerover', function (e) { var h = e.target.closest && e.target.closest(HEROES); if (!h || h.dataset.jgHover) return; h.dataset.jgHover = '1'; sweep(h); setTimeout(function () { delete h.dataset.jgHover; }, 2200); });

  /* ---------- live glow (home page live cards) ---------- */
  function markLive(){ D.querySelectorAll('#live .lc,#tune .lc').forEach(function (c) { c.classList.add('jg-live'); }); }

  /* ---------- win burst ---------- */
  function seen(){ try { return JSON.parse(localStorage.getItem('jsh-glow-wins') || '{}') || {}; } catch (e) { return {}; } }
  function burst(card){ if (calm) return; var r = card.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; var cs = getComputedStyle(card);
    var cols = [cs.getPropertyValue('--tc').trim() || '#4f8cff', cs.getPropertyValue('--tc2').trim() || '#ffffff', '#ffd54a', '#ffffff'];
    for (var i = 0; i < 46; i++) (function (i) { var p = D.createElement('div'); p.className = 'jg-conf'; p.style.background = cols[i % cols.length];
      var x = r.left + r.width / 2, y = r.top + r.height * .35; p.style.left = x + 'px'; p.style.top = y + 'px'; D.body.appendChild(p);
      var ang = (Math.random() * 1.6 - .8) - Math.PI / 2, v = 260 + Math.random() * 320, dx = Math.cos(ang) * v, dy = Math.sin(ang) * v, rot = (Math.random() * 720 - 360);
      var a = p.animate([{ transform:'translate(0,0) rotate(0)', opacity:1 }, { transform:'translate(' + dx * .6 + 'px,' + dy * .6 + 'px) rotate(' + rot / 2 + 'deg)', opacity:1, offset:.45 }, { transform:'translate(' + dx + 'px,' + (dy + 420) + 'px) rotate(' + rot + 'deg)', opacity:0 }], { duration:1400 + Math.random() * 700, easing:'cubic-bezier(.2,.7,.4,1)' });
      a.onfinish = function () { p.remove(); }; })(i); }
  function wins(){ var cards = D.querySelectorAll('#teams .tc'); if (!cards.length) return; var s = seen(), changed = false;
    cards.forEach(function (c) { var m = /Last:\s*W\s+([0-9]+-[0-9]+[^|\n]*)/.exec(c.innerText || ''); if (!m) return; var key = (c.getAttribute('href') || '') + '|' + m[1].trim();
      if (s[key]) return; s[key] = Date.now(); changed = true; setTimeout(function () { burst(c); }, 700); });
    if (changed) { var keys = Object.keys(s).sort(function (a, b) { return s[b] - s[a]; }).slice(0, 40), o = {}; keys.forEach(function (k) { o[k] = s[k]; }); try { localStorage.setItem('jsh-glow-wins', JSON.stringify(o)); } catch (e) {} } }

  /* run now, and whenever a page re-draws (the hubs swap pages on #/ links; the home page re-renders live cards) */
  var pend = 0; function run(){ pend = 0; sweepAll(); markLive(); wins(); }
  var mo = new MutationObserver(function () { if (!pend) pend = setTimeout(run, 120); });
  function start(){ run(); mo.observe(D.body, { childList:true, subtree:true }); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
})();
