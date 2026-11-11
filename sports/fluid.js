/* fluid:start - "Fluid": the hubs move like an app (2026-11-10, Jamo: "Make a big app upgrade. Let's make it so sick, so
   fluid, amazing design and feel"; he picked Fluid motion). Published by sports-hub/build.sh as /sports/fluid.js and
   loaded by the shared top bar (hubbar.html) on every page; it only acts on the four hubs (pages with #view).
   How it works: a tiny script at the top of hubbar.html sees every page change (hashchange) before the hub does and
   hands it to window.__jshNav here. This file then lets the hub draw the new page INSIDE the browser's own view
   transition (document.startViewTransition), so the browser can animate from the old screen to the new one:
   - a tapped game row, team or player grows into the header of the page it opens (and shrinks back on the way out);
   - the highlight under the day/week strip, the tab rows, the hub menu and the bottom bar slides to its new spot;
   - moving to a later day, week or tab slides the page in from the right, an earlier one from the left; opening a
     game, team or player rises in; everything else is a quick cross-fade;
   - the top bar, hub header, bottom bar, ticker and Follow bar hold still while the page changes under them.
   Swiping: on a scoreboard, drag left or right and the page follows your finger to the next or previous day or week
   (or tab, when the page has no day/week strip). Tables and strips that scroll sideways keep their own swipe.
   Scores: a score that changes rolls to its new value (Holo marks it with the old value; the roll is drawn here).
   With the phone's Reduce Motion setting on, or in a browser without view transitions, pages change as before. */
(function(){
  if (window.__jshFluid) return; window.__jshFluid = true;
  var D = document, W = window, H = D.documentElement;
  var V = null, VT = typeof D.startViewTransition === 'function';
  var RM = W.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches: false};
  var css = ''
    /* chrome that holds still during a page change */
    + 'header.top{view-transition-name:jsh-top}#btab{view-transition-name:jsh-btabbar}.jbl{view-transition-name:jsh-tick}#jsh-fw{view-transition-name:jsh-fwbar}div.jsh{view-transition-name:jsh-bar}'
    + '::view-transition-group(*){animation-duration:.3s;animation-timing-function:cubic-bezier(.2,.8,.2,1)}'
    /* the page itself */
    + '::view-transition-old(root){animation:jshVOut .14s ease-in both}::view-transition-new(root){animation:jshVIn .26s cubic-bezier(.2,.7,.2,1) both}'
    + '@keyframes jshVOut{to{opacity:0}}@keyframes jshVIn{from{opacity:0}}'
    + 'html[data-vt="next"]::view-transition-old(root){animation-name:jshVOutL}html[data-vt="next"]::view-transition-new(root){animation-name:jshVInR}'
    + 'html[data-vt="prev"]::view-transition-old(root){animation-name:jshVOutR}html[data-vt="prev"]::view-transition-new(root){animation-name:jshVInL}'
    + 'html[data-vt="push"]::view-transition-new(root){animation-name:jshVUp}html[data-vt="pop"]::view-transition-new(root){animation-name:jshVDown}'
    + '@keyframes jshVOutL{to{opacity:0;transform:translateX(-36px)}}@keyframes jshVOutR{to{opacity:0;transform:translateX(36px)}}'
    + '@keyframes jshVInR{from{opacity:0;transform:translateX(44px)}}@keyframes jshVInL{from{opacity:0;transform:translateX(-44px)}}'
    + '@keyframes jshVUp{from{opacity:0;transform:translateY(18px) scale(.985)}}@keyframes jshVDown{from{opacity:0;transform:translateY(-10px)}}'
    /* a row growing into a header keeps its shape instead of stretching */
    + '::view-transition-group(jsh-hero){animation-duration:.36s;z-index:5}'
    + '::view-transition-old(jsh-hero),::view-transition-new(jsh-hero){height:100%;width:100%;object-fit:cover;object-position:top left;border-radius:14px;overflow:hidden}'
    + '::view-transition-old(jsh-hero){animation:jshVOut .16s ease-in both}::view-transition-new(jsh-hero){animation:jshVIn .3s ease-out both}'
    /* Holo plays its own entrance when there is no view transition; never both */
    + 'html.jsh-vt #view>.holo-in{animation:none!important}'
    /* swiping a scoreboard */
    + '#view.jsh-drag{will-change:transform;transition:none}#view.jsh-snap{transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .22s}'
    /* a changed score rolls to its new value */
    + '@media (prefers-reduced-motion:no-preference){'
    +   '.holo-bump[data-was]{display:inline-block;position:relative;animation:jshRoll .5s cubic-bezier(.2,.8,.2,1),holoBump 1.3s ease-out!important}'
    +   '.holo-bump[data-was]::before{content:attr(data-was);position:absolute;left:0;right:0;top:0;text-align:inherit;pointer-events:none;animation:jshRollOut .34s ease-in both}'
    +   '@keyframes jshRoll{0%{transform:translateY(60%)}100%{transform:none}}'
    +   '@keyframes jshRollOut{0%{transform:translateY(-60%);opacity:1}100%{transform:translateY(-135%);opacity:0}}'
    + '}';

  var route = function(h){ return String(h || '').replace(/^[^#]*#?\/?/, '').split('?')[0]; };
  var kind = function(r){ var m = /^(game|gameday|gamenight|team|player)\//.exec(r); return m ? m[1] : ''; };
  var shown = function(el){ if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < W.innerHeight && r.right > 0 && r.left < W.innerWidth; };
  var named = [];
  function name(el, n){ if (!el || !shown(el)) return false; el.style.viewTransitionName = n; named.push(el); return true; }
  function clear(){ named.forEach(function(el){ try { el.style.viewTransitionName = ''; } catch (x) {} }); named = []; }
  /* the highlighted item of each strip: it slides to wherever the new page highlights */
  var TABS = [['#view .seg a.on', 'jsh-seg'], ['#view .days a.on,#view .wk a.on', 'jsh-pg'], ['#btab .bt-i.on', 'jsh-bt'], ['header.top .ng-sub a.on', 'jsh-sub'], ['header.top .ng-main .ng-tab.cur', 'jsh-ng'], ['.jsh-nav a.on', 'jsh-lg']];
  function tabs(){ TABS.forEach(function(t){ var el = D.querySelector(t[0]); if (el) name(el, t[1]); }); }
  var tap = {el: null, t: 0};
  D.addEventListener('pointerdown', function(e){ tap.el = e.target; tap.t = Date.now(); }, true);

  /* which way the page should move: later/earlier in a strip, into or out of a game/team/player page, or a plain fade */
  function direction(oldR, newR, newHash){
    var link = null; try { link = V.querySelector('.days a[href="' + newHash + '"],.wk a[href="' + newHash + '"],.seg a[href="' + newHash + '"],.subnav a[href="' + newHash + '"]'); } catch (x) {}
    if (link && link.parentElement) { var sib = [].slice.call(link.parentElement.querySelectorAll('a')), on = link.parentElement.querySelector('a.on'), i = sib.indexOf(link), j = sib.indexOf(on); if (on && i !== j) return i > j ? 'next' : 'prev'; }
    var ko = kind(oldR), kn = kind(newR);
    if (kn && !ko) return 'push'; if (ko && !kn) return 'pop'; if (kn && ko) return 'push';
    return 'fade';
  }
  var HERO = '.ghead,.thead.hero,.phero,.gd-hero';
  var BLOCK = '.gm,.livecard,.sbt,.wcard,.tcard,.royh-r,.cfpx-t,.card,tr,.chip,a';
  var busy = false, turns = 0;
  W.__jshNav = function(e){
    if (!VT || RM.matches || D.hidden || busy) return false;
    V = V || D.getElementById('view'); if (!V) return false;
    var oldHash = '#' + String(e.oldURL || '').split('#').slice(1).join('#'), newHash = '#' + String(e.newURL || '').split('#').slice(1).join('#');
    var oldR = route(oldHash), newR = route(newHash);
    if (oldR.split('#')[0] === newR.split('#')[0]) return false;      /* a jump inside the same page (a team page's section links): no transition */
    var dir = swipeDir || direction(oldR, newR, newHash); swipeDir = '';
    var pass; try { pass = new HashChangeEvent('hashchange', {oldURL: e.oldURL, newURL: e.newURL}); } catch (x) { return false; }
    pass.__jshPass = true;
    /* the old screen: what is about to grow (the thing tapped) or shrink (the header being left), and the highlights */
    clear(); var hero = false;
    if (kind(newR) && dir === 'push') { var t = tap.el && Date.now() - tap.t < 1500 && V.contains(tap.el) ? tap.el.closest(BLOCK) : null; if (t) { var r = t.getBoundingClientRect(); if (r.width >= 40 && r.height >= 20 && r.height < W.innerHeight * 0.6) hero = name(t, 'jsh-hero'); } }
    else if (dir === 'pop') hero = name(V.querySelector(HERO), 'jsh-hero');
    tabs();
    H.setAttribute('data-vt', dir); H.classList.add('jsh-vt'); busy = true; var turn = ++turns;
    /* html.jsh-vt stays on a little past the end: Holo keeps its entrance classes on the new page for 600 ms, and letting
       go sooner would start that entrance after the transition has already shown the page */
    var done = function(){ busy = false; clear(); H.removeAttribute('data-vt'); setTimeout(function(){ if (turn === turns) H.classList.remove('jsh-vt'); }, 700); V.classList.remove('jsh-drag', 'jsh-snap'); V.style.transform = ''; V.style.opacity = ''; };
    var draw = function(){
      W.dispatchEvent(pass);                       /* the hub draws the new page now */
      clear(); V.classList.remove('jsh-drag', 'jsh-snap'); V.style.transform = ''; V.style.opacity = '';
      if (hero && dir === 'push') name(V.querySelector(HERO), 'jsh-hero');
      tabs();
      /* going back: the top bar's "Back keeps your place" puts the list back where you left it a moment after the page
         is drawn, so wait for that (at most 60 ms) before looking for the row the header shrinks into. The same game can
         be linked from several places (the hero card, the live strip, the row): take the one that is on screen. */
      if (hero && dir === 'pop') return new Promise(function(res){ var t0 = Date.now(); (function look(){ var all = []; try { all = V.querySelectorAll('[data-href="' + oldHash + '"],a[href="' + oldHash + '"]'); } catch (x) {}
        var b = null; for (var i = 0; i < all.length && !b; i++) { var c = all[i].closest(BLOCK) || all[i]; if (shown(c) && c.getBoundingClientRect().height < W.innerHeight * 0.6) b = c; }
        if (b) { name(b, 'jsh-hero'); res(); } else if (Date.now() - t0 > 60 || !all.length) res(); else setTimeout(look, 12); })(); });
    };
    try { var tr = D.startViewTransition(draw); tr.finished.then(done, done); if (tr.ready && tr.ready.catch) tr.ready.catch(function(){}); }
    catch (x) { done(); try { W.dispatchEvent(pass); } catch (y) {} }
    return true;
  };

  /* ---------- swipe a scoreboard to the next or previous day, week or tab ---------- */
  var swipeDir = '';
  function swipe(){
    var x0 = 0, y0 = 0, dx = 0, on = 0, t0 = 0;   /* on: 0 idle, 1 watching, 2 dragging */
    var sideways = function(el){ for (; el && el !== V; el = el.parentElement) { if (el.scrollWidth > el.clientWidth + 6) { var o = getComputedStyle(el).overflowX; if (o === 'auto' || o === 'scroll') return true; } } return false; };
    var target = function(d){ var cur = V.querySelector('.days a.on,.wk a.on') || V.querySelector('.seg a.on'); if (!cur) return null; var sib = [].slice.call(cur.parentElement.querySelectorAll('a')), i = sib.indexOf(cur) + d; return sib[i] && sib[i].getAttribute('href') ? sib[i] : null; };
    V.addEventListener('touchstart', function(e){
      on = 0; if (busy || e.touches.length !== 1) return; var t = e.touches[0];
      if (t.clientX < 26 || t.clientX > W.innerWidth - 26) return;               /* the phone's own edge swipes */
      if (!V.querySelector('.days a.on,.wk a.on,.seg a.on')) return;
      if (e.target.closest && e.target.closest('input,select,textarea,button,.cfpx-wrap,.tblwrap,table,svg,.jsh-noswipe')) return;
      if (sideways(e.target)) return;
      x0 = t.clientX; y0 = t.clientY; dx = 0; t0 = Date.now(); on = 1;
    }, {passive: true});
    V.addEventListener('touchmove', function(e){
      if (!on) return; var t = e.touches[0]; dx = t.clientX - x0; var dy = t.clientY - y0;
      if (on === 1) { if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { on = 0; return; } if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.6) return; on = 2; V.classList.add('jsh-drag'); }
      var has = target(dx < 0 ? 1 : -1), pull = has ? dx * 0.85 : dx * 0.25;       /* nothing that way: a short rubber band */
      V.style.transform = 'translateX(' + pull.toFixed(1) + 'px)'; V.style.opacity = String(Math.max(0.35, 1 - Math.abs(pull) / 420));
    }, {passive: true});
    var end = function(){
      if (on !== 2) { on = 0; return; } on = 0;
      var fast = Math.abs(dx) > 34 && Date.now() - t0 < 260, far = Math.abs(dx) > Math.min(110, W.innerWidth * 0.28), link = (fast || far) ? target(dx < 0 ? 1 : -1) : null;
      V.classList.remove('jsh-drag');
      if (link) { swipeDir = dx < 0 ? 'next' : 'prev'; location.hash = link.getAttribute('href'); setTimeout(function(){ if (!busy) { V.classList.add('jsh-snap'); V.style.transform = ''; V.style.opacity = ''; } }, 60); }
      else { V.classList.add('jsh-snap'); V.style.transform = ''; V.style.opacity = ''; setTimeout(function(){ V.classList.remove('jsh-snap'); }, 260); }
    };
    V.addEventListener('touchend', end, {passive: true}); V.addEventListener('touchcancel', end, {passive: true});
  }

  function start(){
    V = D.getElementById('view'); if (!V) return;
    var s = D.createElement('style'); s.id = 'jsh-fluid'; s.textContent = css; (D.head || H).appendChild(s);
    if (!RM.matches) swipe();
  }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* fluid:end */
