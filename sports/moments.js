/* moments:start - big moments, loading bars and charts (2026-11-19, Jamo picked "Big-moment animations",
   "Smoother loading" and "Better charts"). Published by sports-hub/build.sh as /sports/moments.js and loaded by the shared
   top bar (hubbar.html) on the home page, Live Center, alerts and all four hubs. Every effect is short, runs once, never
   covers anything you can tap, and is skipped when the phone's Reduce Motion setting is on.
   1. A win for your team: the home page's result card ([data-jsh-cel], set by front.html) gets a one-second burst in the
      team's colors the first time you see it (remembered in localStorage jsh-cel).
   2. Upset ribbon: on a hub, a finished game's card (any link to #/game/<id> the size of a card) and the game page itself
      get an "Upset" ribbon when the winner was the underdog on the pregame betting line (the hub's own number when there was no line) by 7 or more points in college
      football and 6 or more in the NFL, NBA and college basketball (JSH_GAME(id).mu, the hub's expected home margin).
      The home page's result card does the same from the betting line or the rankings (front.html, data-upset).
   3. League-best glow: a ranking that reads "1st", "1st of 133", "#1" or "No. 1" glows gold, so the stats a team or
      player leads the country in stand out.
   4. Loading bars: while a section says "Loading ..." it shows gray bars in the shape of what is coming (the first page
      load gets page-shaped placeholders from hubbar.html).
   5. Charts: each chart draws itself in the first time it scrolls into view (lines trace left to right, bars grow up),
      once per page; the hubs' live redraws do not replay it. Tap a bar or point that has a label (its <title>) to see it
      in a bubble: the game, the date and the number. Charts inside a link still just open the link. */
(function(){
  if (window.__jshMoments) return; window.__jshMoments = true;
  var D = document, W = window, H = D.documentElement;
  var RM = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var HUB = (/^\/(cfb|nfl|nba|cbb)(\/|$)/.exec(location.pathname) || [])[1] || '';
  var get = function(k, d){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (x) { return d; } };
  var put = function(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) {} };
  var css = ''
    /* 1. celebration */
    + '.jsh-cel{position:relative;overflow:hidden}'
    + '.jsh-cel::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.28) 48%,transparent 66%);transform:translateX(-120%);animation:jshShine 1.1s .1s ease-out forwards}'
    + '@keyframes jshShine{to{transform:translateX(120%)}}'
    + '.jsh-conf{position:absolute;left:var(--cx,50%);top:var(--cy,50%);width:0;height:0;pointer-events:none;z-index:2}'
    + '.jsh-conf i{position:absolute;left:0;top:0;width:7px;height:11px;border-radius:2px;background:var(--k);opacity:0;animation:jshPop 1.05s cubic-bezier(.2,.7,.3,1) forwards;animation-delay:var(--d)}'
    + '@keyframes jshPop{0%{opacity:1;transform:translate(0,0) rotate(0) scale(.6)}70%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(var(--r)) scale(1)}}'
    /* 2. upset ribbon */
    + '.jsh-ups{position:absolute;top:6px;right:6px;z-index:3;pointer-events:none;font:800 10.5px/1 Inter,system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#1d1405;background:linear-gradient(90deg,#fbbf24,#f59e0b);padding:4px 7px 3px;border-radius:6px;box-shadow:0 4px 14px -4px rgba(245,158,11,.7)}'
    + '.jsh-ups.in{animation:jshUp .5s cubic-bezier(.2,.9,.3,1.3)}@keyframes jshUp{from{transform:scale(.4) rotate(-8deg);opacity:0}to{transform:none;opacity:1}}'
    + '.ghead .jsh-ups,.gd-hero .jsh-ups{top:10px;right:10px;font-size:11.5px;padding:5px 9px 4px}'
    + '.rc .jsh-ups{top:auto;bottom:8px;right:10px}'
    + '.jsh-ups.inl{position:static;display:inline-block;vertical-align:1px;margin-right:6px;font-size:11px;padding:3px 5px 2px}'
    /* 3. league-best glow */
    + '#view .jsh-best{color:#fbbf24!important;text-shadow:0 0 10px rgba(251,191,36,.55);font-weight:800}'
    + ':root[data-theme="light"] #view .jsh-best{color:#b45309!important;text-shadow:none}'
    + '@media (prefers-color-scheme: light){:root:not([data-theme="dark"]) #view .jsh-best{color:#b45309!important;text-shadow:none}}'
    /* 4. loading bars */
    + '#view .jsh-ld::after{content:"";display:block;height:58px;margin-top:10px;border-radius:10px;'
    + 'background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent) 0 0/40% 100% no-repeat,'
    + 'linear-gradient(var(--surface-2,rgba(128,128,128,.18)) 0 0) 0 0/100% 14px no-repeat,linear-gradient(var(--surface-2,rgba(128,128,128,.18)) 0 0) 0 22px/82% 14px no-repeat,linear-gradient(var(--surface-2,rgba(128,128,128,.18)) 0 0) 0 44px/64% 14px no-repeat;'
    + 'animation:jshLd 1.3s linear infinite}'
    + '@keyframes jshLd{from{background-position:-40% 0,0 0,0 22px,0 44px}to{background-position:140% 0,0 0,0 22px,0 44px}}'
    /* 5. chart tips */
    + '#jsh-tip{position:fixed;z-index:80;max-width:min(260px,80vw);padding:7px 10px;border-radius:10px;pointer-events:none;font:600 13px/1.35 Inter,system-ui,sans-serif;color:#eef2f8;background:rgba(9,13,22,.95);border:1px solid rgba(255,255,255,.14);box-shadow:0 10px 30px -10px rgba(0,0,0,.7);transform:translate(-50%,calc(-100% - 12px));opacity:0;transition:opacity .15s}'
    + '#jsh-tip.on{opacity:1}'
    + '#view svg .jsh-tipon{filter:brightness(1.35) drop-shadow(0 0 4px currentColor)}'
    + '@media (prefers-reduced-motion:reduce){.jsh-cel::after,.jsh-conf,.jsh-ups.in{animation:none;display:none}.jsh-ups.in{display:block}#view .jsh-ld::after{animation:none}}';

  /* ---------- 1. a win for your team ---------- */
  function celebrate(){
    var seen = get('jsh-cel', []);
    D.querySelectorAll('[data-jsh-cel]:not([data-jsh-celdone])').forEach(function(el){
      var k = el.getAttribute('data-jsh-cel'); el.setAttribute('data-jsh-celdone', '1');
      if (seen.indexOf(k) >= 0 || RM.matches) return;
      var r = el.getBoundingClientRect(); if (r.width < 40 || r.bottom < 0 || r.top > W.innerHeight) { el.removeAttribute('data-jsh-celdone'); return; }   /* wait until it is on screen */
      seen.push(k); while (seen.length > 60) seen.shift(); put('jsh-cel', seen);
      el.classList.add('jsh-cel');
      var c = getComputedStyle(el).getPropertyValue('--tc').trim() || '#f2c14e', cols = [c, '#fbbf24', '#ffffff', c], box = D.createElement('span'); box.className = 'jsh-conf'; box.setAttribute('aria-hidden', 'true');
      box.style.setProperty('--cx', '14%'); box.style.setProperty('--cy', '50%');
      var h = ''; for (var i = 0; i < 18; i++) { var a = (i / 18) * Math.PI * 2 + (i % 3) * .21, d = 46 + (i * 37 % 60);
        h += '<i style="--k:' + cols[i % 4] + ';--x:' + Math.round(Math.cos(a) * d * 1.8) + 'px;--y:' + Math.round(Math.sin(a) * d - 18) + 'px;--r:' + (i * 47 % 360) + 'deg;--d:' + (i % 4) * 30 + 'ms"></i>'; }
      box.innerHTML = h; el.appendChild(box);
      setTimeout(function(){ box.remove(); el.classList.remove('jsh-cel'); }, 1600); });
  }

  /* ---------- 2. upset ribbons ---------- */
  var EDGE = { cfb: 7, nfl: 6, nba: 6, cbb: 6 };
  function upsetOf(id){
    if (!HUB || typeof W.JSH_GAME !== 'function') return false; var g; try { g = W.JSH_GAME(id); } catch (x) { g = null; }
    var exp = g && g.ln != null && isFinite(g.ln) ? +g.ln : g && g.mu != null && isFinite(g.mu) ? +g.mu : null;   /* the pregame betting line first; the hub's own number when there was none */
    if (!g || !g.done || g.as == null || g.hs == null || exp == null) return false;
    var as = +g.as, hs = +g.hs; if (!isFinite(as) || !isFinite(hs) || as === hs) return false;
    var winExp = hs > as ? exp : -exp; return winExp <= -(EDGE[HUB] || 7);
  }
  function ribbon(host, fresh){ if (host.querySelector('.jsh-ups')) return;
    /* a card with a "Final" label: the ribbon sits right before it, in line */
    var tw = D.createTreeWalker(host, NodeFilter.SHOW_TEXT, null), fin = null, tn; while ((tn = tw.nextNode())) { if (/^\s*Final\b/.test(tn.nodeValue)) { fin = tn; break; } }
    if (fin && !host.matches('.ghead,.gd-hero')) { var t = D.createElement('span'); t.className = 'jsh-ups inl' + (fresh ? ' in' : ''); t.textContent = 'Upset'; t.title = 'The underdog won'; fin.parentNode.insertBefore(t, fin); return; }
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var s = D.createElement('span'); s.className = 'jsh-ups' + (fresh ? ' in' : ''); s.textContent = 'Upset'; s.title = 'The underdog won'; host.appendChild(s);
    /* slide left of anything it would cover (a "Final" label, a score) */
    for (var k = 0; k < 2; k++) { var r = s.getBoundingClientRect(), hr = host.getBoundingClientRect(), hit = null;
      host.querySelectorAll('*').forEach(function(e){ if (hit || e === s || s.contains(e) || e.children.length || !(e.textContent || '').trim()) return; var q = e.getBoundingClientRect(); if (q.width && !(q.right <= r.left || q.left >= r.right || q.bottom <= r.top || q.top >= r.bottom)) hit = q; });
      if (!hit) break; s.style.right = Math.round(hr.right - hit.left + 6) + 'px'; } }
  function upsets(){
    var v = D.getElementById('view');
    if (v && HUB) {
      v.querySelectorAll('a[href^="#/game/"]:not([data-jsh-up]), [data-href^="#/game/"]:not(tr):not([data-jsh-up])').forEach(function(a){
        var r = a.getBoundingClientRect(); if (r.width < 150 || r.height < 46) return; a.setAttribute('data-jsh-up', '1');
        var id = decodeURIComponent((a.getAttribute('href') || a.getAttribute('data-href')).replace(/^#\/game\//, '').split(/[?#\/]/)[0]); if (upsetOf(id)) ribbon(a, false); });
      var m = /^#\/(game|gameday)\/([^\/?#]+)/.exec(location.hash); if (m) { var hd = v.querySelector(':scope > .ghead, .gd-hero'); if (hd && !hd.querySelector(':scope > .jsh-ups') && upsetOf(decodeURIComponent(m[2]))) ribbon(hd, true); }
    }
    D.querySelectorAll('[data-upset]:not([data-jsh-up])').forEach(function(el){ el.setAttribute('data-jsh-up', '1'); ribbon(el, true); });   /* the home page's result cards */
  }

  /* ---------- 3 and 4. league-best glow and loading bars (one pass over the page's text) ---------- */
  var BEST = /^\s*(1st|#1|No\. 1)(\s+(of|in)\s+[A-Za-z0-9,.\- ]{1,26})?\s*$/i, LOAD = /^\s*Loading\b/;
  function scanText(){
    var v = D.getElementById('view'); if (!v) return;
    var tw = D.createTreeWalker(v, NodeFilter.SHOW_TEXT, null), n, k = 0;
    while ((n = tw.nextNode()) && k++ < 20000) { var t = n.nodeValue; if (!t || t.length > 40) continue; var p = n.parentElement; if (!p) continue;
      if (BEST.test(t)) { if (!p.closest('.jtab,button,select,option,th,.chip,svg,.jsh-noglow')) p.classList.add('jsh-best'); }
      else if (LOAD.test(t) && !p.classList.contains('jsh-ld') && p.childElementCount === 0 && !p.closest('button,a,svg')) p.classList.add('jsh-ld'); }
    v.querySelectorAll('.jsh-ld').forEach(function(el){ if (!LOAD.test(el.textContent || '')) el.classList.remove('jsh-ld'); });
  }

  /* ---------- 5. charts ---------- */
  var drawn = {}, io = null;
  function chartKey(svg, i){ return (location.pathname + location.hash).replace(/#s-.*$/, '') + '|' + (svg.getAttribute('aria-label') || '') + '|' + i; }
  function isChart(svg){ if (!svg.getAttribute('viewBox') || svg.closest('.jsh,.jtab,button,#jsh-fw,.jsh-ups')) return false; var r = svg.getBoundingClientRect(); if (r.width < 120 || r.height < 36) return false;
    return !!svg.querySelector('path,polyline,rect,circle') && !svg.querySelector('image'); }
  function draw(svg){
    if (RM.matches || !svg.animate) return; var n = 0, ease = 'cubic-bezier(.25,.8,.3,1)';
    svg.querySelectorAll('path,polyline,line').forEach(function(el){ if (n++ > 240) return; var cs = getComputedStyle(el);
      if (cs.fill !== 'none' && el.tagName !== 'line' && el.tagName !== 'polyline') { el.animate([{opacity: 0}, {opacity: getComputedStyle(el).opacity || 1}], {duration: 700, easing: 'ease-out', delay: 150}); return; }
      if (cs.stroke === 'none' || (cs.strokeDasharray && cs.strokeDasharray !== 'none') || typeof el.getTotalLength !== 'function') return;
      var L = 0; try { L = el.getTotalLength(); } catch (x) { L = 0; } if (!(L > 4)) return;
      el.animate([{strokeDasharray: L + ' ' + L, strokeDashoffset: L}, {strokeDasharray: L + ' ' + L, strokeDashoffset: 0}], {duration: 900, easing: ease}); });
    var bars = svg.querySelectorAll('rect'), nb = bars.length; if (nb > 2 && nb < 400) bars.forEach(function(el, i){ var b = el.getBBox ? el.getBBox() : null; if (!b || b.height < 1 || b.width > 0.9 * (svg.viewBox.baseVal.width || 1e9)) return;
      el.style.transformBox = 'fill-box'; el.style.transformOrigin = '50% 100%';
      el.animate([{transform: 'scaleY(0)'}, {transform: 'scaleY(1)'}], {duration: 600, easing: ease, delay: Math.min(400, i * (400 / nb)), fill: 'backwards'}); });
    svg.querySelectorAll('circle').forEach(function(el, i){ if (i > 120) return; el.animate([{opacity: 0}, {opacity: 1}], {duration: 400, delay: 500 + Math.min(300, i * 8), fill: 'backwards'}); });
  }
  function charts(){
    var v = D.getElementById('view'); if (!v || !W.IntersectionObserver) return;
    if (!io) io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (!e.isIntersecting) return; io.unobserve(e.target); var k = e.target.getAttribute('data-jsh-ck'); if (drawn[k]) return; drawn[k] = 1; draw(e.target); }); }, {threshold: 0.35});
    var list = [].filter.call(v.querySelectorAll('svg:not([data-jsh-ck])'), isChart);
    list.forEach(function(svg, i){ var k = chartKey(svg, i); svg.setAttribute('data-jsh-ck', k); if (drawn[k]) return; io.observe(svg); });
  }
  var tip = null, tipOn = null, tipT = 0;
  function hideTip(){ if (tip) tip.classList.remove('on'); if (tipOn) { tipOn.classList.remove('jsh-tipon'); tipOn = null; } }
  D.addEventListener('click', function(e){
    var t = e.target; if (!t || !t.closest) return;
    var svg = t.closest('#view svg'); if (!svg || svg.closest('a,button')) { hideTip(); return; }
    var el = t, txt = ''; for (; el && el !== svg.parentNode; el = el.parentNode) { if (el.getAttribute && el.getAttribute('data-tip')) { txt = el.getAttribute('data-tip'); break; } var ti = el.querySelector && el.querySelector(':scope > title'); if (ti && el !== svg) { txt = ti.textContent; break; } }
    if (!txt) { hideTip(); return; }
    if (!tip) { tip = D.createElement('div'); tip.id = 'jsh-tip'; tip.setAttribute('role', 'status'); D.body.appendChild(tip); }
    hideTip(); tip.textContent = txt.trim(); el.classList.add('jsh-tipon'); tipOn = el;
    var x = Math.max(70, Math.min(W.innerWidth - 70, e.clientX)), y = Math.max(60, e.clientY); tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('on');
    clearTimeout(tipT); tipT = setTimeout(hideTip, 3500);
  });
  W.addEventListener('scroll', function(){ if (tip && tip.classList.contains('on')) hideTip(); }, {passive: true});

  /* ---------- run ---------- */
  function syncGlance(){ var b = D.querySelector('.jsh-gl'); if (!b) return; var on = H.classList.contains('jsh-glance'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.title = on ? 'Glance mode is on: tap for the full view' : 'Glance mode: fit more on the screen'; }
  var q = 0;
  function pass(){ q = 0; try { celebrate(); } catch (x) {} try { upsets(); } catch (x) {} try { scanText(); } catch (x) {} try { charts(); } catch (x) {} }
  function soon(){ if (!q) q = setTimeout(pass, 250); }
  function start(){
    var s = D.createElement('style'); s.id = 'jsh-moments'; s.textContent = css; (D.head || H).appendChild(s);
    syncGlance(); pass();
    var v = D.getElementById('view') || D.querySelector('main') || D.body;
    new MutationObserver(function(ms){ for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.id === 'jsh-tip' || (t.closest && t.closest('.jsh-conf'))) continue; soon(); return; } }).observe(v, {childList: true, subtree: true});
    W.addEventListener('hashchange', function(){ hideTip(); soon(); });
    D.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('.jtab, details > summary')) setTimeout(soon, 60); }, true);   /* a tab or an opened section shows charts that were hidden */
    W.addEventListener('scroll', function(){ if (D.querySelector('[data-jsh-cel]:not([data-jsh-celdone])')) soon(); }, {passive: true});
  }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* moments:end */
