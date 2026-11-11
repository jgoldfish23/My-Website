/* app:start - "App": the sports hub behaves like an app on a phone (2026-11-10, Jamo picked "Opens like an app" and
   "Smooth page changes"). Published by sports-hub/build.sh as /sports/app.js and loaded by the shared top bar
   (hubbar.html), so the home page, Live Center, alerts and all four hubs get it.
   - Smooth page changes live in Holo (polish/holo.js, part 7): on a real page change each block fades in from clear and
     rises 10 px, 30 ms apart (tuned up the same day; with the phone's Reduce Motion setting on there is no motion).
   - Saved copies: registers /sw.js (polish/sw.js), which keeps the last copy of every sports page and its files. With
     no signal the saved copy opens and a slim note says when it was saved, with a Try again button.
   - Pull down to refresh: when the hub is opened from the home-screen icon (no browser bar, so no reload button),
     pulling down at the top of a page reloads it.
   One phone can switch the saved copies off with localStorage "jsh-sw" = "off". */
(function(){
  if (window.__jshApp) return; window.__jshApp = true;
  var D = document, W = window;
  var mm = function(q){ try { return W.matchMedia(q).matches; } catch (x) { return false; } };
  var standalone = mm('(display-mode: standalone)') || navigator.standalone === true;
  var css = ''
    /* the saved-copy note */
    + '.jsh-saved{position:relative;z-index:60;display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap;padding:8px 14px;'
    + 'font:600 13px/1.35 Inter,system-ui,sans-serif;color:#1d1405;background:#f2c14e;text-align:center}'
    + '.jsh-saved button{font:inherit;font-weight:800;color:inherit;background:rgba(0,0,0,.12);border:0;border-radius:999px;padding:6px 14px;min-height:32px;cursor:pointer}'
    /* the pull-to-refresh pill */
    + '.jsh-pull{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);z-index:9999;display:flex;align-items:center;gap:8px;'
    + 'padding:8px 14px;border-radius:999px;font:700 13px/1 Inter,system-ui,sans-serif;color:#e8eef8;background:rgba(14,20,34,.92);'
    + 'border:1px solid rgba(255,255,255,.14);box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:none;opacity:0;transform:translate(-50%,-60px)}'
    + '.jsh-pull svg{width:16px;height:16px;transition:transform .15s}'
    + '.jsh-pull.go svg{transform:rotate(180deg)}'
    + '.jsh-pull.spin svg{animation:jshSpin .8s linear infinite}'
    + '@keyframes jshSpin{to{transform:rotate(360deg)}}';
  function start(){
    var s = D.createElement('style'); s.id = 'jsh-app'; s.textContent = css; (D.head || D.documentElement).appendChild(s);
    savedNote(); if (standalone) pull();
  }

  /* ---------- saved copies (the service worker) ---------- */
  var off = false; try { off = localStorage.getItem('jsh-sw') === 'off'; } catch (x) {}
  if ('serviceWorker' in navigator && W.isSecureContext) {
    if (off) {
      navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){ var w = r.active || r.waiting || r.installing; if (w && /\/sw\.js(\?|$)/.test(w.scriptURL)) r.unregister(); }); }).catch(function(){});
    } else {
      var reg = function(){ navigator.serviceWorker.register('/sw.js', {scope: '/', updateViaCache: 'none'}).catch(function(){}); };
      if (D.readyState === 'complete') setTimeout(reg, 1500); else W.addEventListener('load', function(){ setTimeout(reg, 1500); });
    }
  }
  function savedNote(){
    var ts = W.__jshSaved; if (!ts) return;
    var t = new Date(ts), now = new Date();
    var when = t.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    if (t.toDateString() !== now.toDateString()) when = t.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'}) + ', ' + when;
    var n = D.createElement('div'); n.className = 'jsh-saved'; n.setAttribute('role', 'status');
    n.innerHTML = '<span>No connection. Showing the copy saved ' + when + '.</span><button type="button">Try again</button>';
    n.querySelector('button').addEventListener('click', function(){ location.reload(); });
    D.body.insertBefore(n, D.body.firstChild);
    W.addEventListener('online', function(){ n.firstChild.textContent = 'Back online.'; n.querySelector('button').textContent = 'Get the latest'; });
  }

  /* ---------- pull down to refresh (home-screen app only) ---------- */
  function pull(){
    var pill = D.createElement('div'); pill.className = 'jsh-pull'; pill.setAttribute('aria-hidden', 'true');
    pill.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg><span>Pull to refresh</span>';
    D.body.appendChild(pill);
    var txt = pill.querySelector('span'), y0 = null, x0 = 0, dist = 0, on = false, busy = false, GO = 72;
    var inScroller = function(el){ for (; el && el !== D.body && el !== D.documentElement; el = el.parentElement) { if (el.scrollTop > 0) return true; } return false; };
    var show = function(d){ var y = Math.min(d * 0.55, 90) - 60; pill.style.opacity = Math.min(1, d / GO); pill.style.transform = 'translate(-50%,' + y + 'px)';
      var go = d >= GO; pill.classList.toggle('go', go); txt.textContent = go ? 'Release to refresh' : 'Pull to refresh'; };
    var hide = function(){ pill.style.transition = 'transform .2s, opacity .2s'; pill.style.opacity = 0; pill.style.transform = 'translate(-50%,-60px)'; setTimeout(function(){ pill.style.transition = ''; }, 220); };
    D.addEventListener('touchstart', function(e){
      y0 = null; on = false; dist = 0;
      if (busy || e.touches.length !== 1 || W.scrollY > 0) return;
      var t = e.target; if (t.closest && t.closest('input,textarea,select,[contenteditable],.jsh-nopull,dialog')) return;
      if (inScroller(t)) return;
      y0 = e.touches[0].clientY; x0 = e.touches[0].clientX;
    }, {passive: true});
    D.addEventListener('touchmove', function(e){
      if (y0 == null) return;
      var dy = e.touches[0].clientY - y0, dx = Math.abs(e.touches[0].clientX - x0);
      if (!on) { if (dx > 14 && dx > dy) { y0 = null; return; } if (dy < 10 || W.scrollY > 0) return; on = true; }
      dist = dy; show(dy);
    }, {passive: true});
    D.addEventListener('touchend', function(){
      if (!on) { y0 = null; return; }
      on = false; y0 = null;
      if (dist >= GO) { busy = true; pill.classList.remove('go'); pill.classList.add('spin'); txt.textContent = 'Refreshing'; pill.style.opacity = 1; pill.style.transform = 'translate(-50%,0)'; location.reload(); }
      else hide();
    }, {passive: true});
  }

  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* app:end */
