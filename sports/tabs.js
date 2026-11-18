/* tabs:start - team pages in tabs on every hub (2026-11-18, Jamo picked "Cleaner team pages": "Team pages have grown
   long. Reorganize them: a tight summary up top, then clear tabs for Schedule, Stats, Players instead of one long scroll").
   Published as /sports/tabs.js and loaded by sports-hub/hubbar.html on the CFB, NFL, NBA and CBB hubs.
   How it works, without touching the hubs' own page code:
   - On a #/team/... page, once the hub has drawn it, every section (an .sec heading and what follows it, up to the next
     heading) is sorted into Overview, Schedule, Stats, Players or More by its id or heading words. What comes before the
     first heading (the summary tiles, the season strip) belongs to Overview. The team header and the back link stay on
     every tab.
   - A row of tabs goes right under the team header; the hub's own jump-to-section row (.subnav) is hidden, and any
     links it had that are not sections (Compare, Rooting guide) move to the end of the tab row.
   - "The short version" moves to the top of Overview.
   - Only tabs that have something in them are shown. The open tab is kept while the hub redraws the page during live
     games, and a link straight to a section (#/team/X#s-stats or a tap on a section link) opens the tab that has it.
   - Nothing is removed from the page: other tabs' sections are only hidden (class jt-off). */
(function(){ if (window.JSH_TABS) return;
  var HUB = (/^\/(cfb|nfl|nba|cbb)(\/|$)/.exec(location.pathname) || [])[1]; if (!HUB) return;
  var D = document, H = D.documentElement, view = null, busy = false, cur = { key: '', tab: 'ov' }, want = '';
  var TABS = [['ov', 'Overview'], ['sch', 'Schedule'], ['st', 'Stats'], ['pl', 'Players'], ['more', 'More']];
  /* section id or heading words -> tab (players first, so "Player stats" is not Stats) */
  var BY_ID = { 's-read': 'ov', 's-over': 'ov', 's-lad': 'ov', 's-conf': 'ov', 'conf-race': 'ov', 's-sched': 'sch',
    's-analytics': 'st', 's-odds': 'st', 's-stats': 'st', 's-ranks': 'st', 's-ypp': 'st',
    's-cards': 'pl', 's-pstats': 'pl', 's-trends': 'pl', 's-players': 'pl', 's-pm': 'pl', 's-money': 'pl', 's-inj': 'pl', 's-depth': 'pl', 's-roster': 'pl', 's-draft': 'pl', 's-young': 'pl',
    'uw': 'more', 's-scrap': 'more', 'pk-season': 'more' };
  var WORDS = [[/player|roster|depth|injur|draft|salary|\bcap\b|recruit|transfer|young core|plus-minus/i, 'pl'], [/schedule|results/i, 'sch'],
    [/analytic|projection|odds|stat|yards per play|rank|rating|efficien|four factors/i, 'st'], [/uni watch|scrapbook|prediction|rooting|history|series/i, 'more']];
  function tabOf(sec){ if (BY_ID[sec.id]) return BY_ID[sec.id]; var h = sec.querySelector('h2'); var t = (h ? h.textContent : sec.textContent) || '';
    for (var i = 0; i < WORDS.length; i++) if (WORDS[i][0].test(t)) return WORDS[i][1]; return 'ov'; }
  function isTeam(){ return /^#\/team\//.test(location.hash || ''); }
  function baseKey(){ return (location.hash || '').split('#').slice(0, 2).join('#'); }   /* "#/team/BYU" without a #s-section */
  function css(){ if (D.getElementById('jsh-tabs-css')) return; var s = D.createElement('style'); s.id = 'jsh-tabs-css';
    s.textContent = 'html.jt-on #view .subnav{display:none!important}#view .jt-off{display:none!important}'
      + '#view .jtab{display:flex;gap:6px;margin:14px 0 6px;padding:2px 0 6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}'
      + '#view .jtab::-webkit-scrollbar{display:none}'
      + '#view .jtab button,#view .jtab a{flex:none;display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 16px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink-2);font:inherit;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap;-webkit-tap-highlight-color:transparent;transition:background-color .15s,color .15s,border-color .15s}'
      + '#view .jtab button:hover,#view .jtab a:hover{color:var(--ink);text-decoration:none}'
      + '#view .jtab button.on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#fff)}'
      + '#view .jtab a{font-weight:500;color:var(--ink-3)}#view .jtab .jt-sep{flex:none;width:1px;margin:8px 2px;background:var(--line)}'
      + '#view .jtab-pane-top>.sec:first-child,#view .jt-first{margin-top:10px}'
      + '@media (max-width:600px){#view .jtab{margin:12px -16px 4px;padding:2px 16px 6px}#view .jtab button,#view .jtab a{padding:0 14px}}';
    D.head.appendChild(s); }
  /* the page's blocks in order: [element, tab]; an element holding sections of its own (CBB's analytics slot) goes as one */
  function blocks(){ var out = [], tab = 'ov', start = false, kids = view.children;
    for (var i = 0; i < kids.length; i++) { var e = kids[i];
      if (e.classList.contains('jtab')) continue;
      if (!start) { if (e.classList.contains('crumb') || e.classList.contains('thead')) { out.push([e, '*']); continue; } start = true; }
      if (e.classList.contains('subnav')) { out.push([e, '*']); continue; }
      if (e.classList.contains('sec')) tab = tabOf(e);
      out.push([e, tab]); }
    return out; }
  function show(t, scroll){ cur.tab = t; var bar = view.querySelector('.jtab'); if (bar) bar.querySelectorAll('button').forEach(function(b){ var on = b.dataset.t === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    blocks().forEach(function(x){ if (x[1] !== '*') x[0].classList.toggle('jt-off', x[1] !== t); });
    var first = null; blocks().some(function(x){ if (x[1] === t) { first = x[0]; return true; } return false; });
    view.querySelectorAll('.jt-first').forEach(function(e){ e.classList.remove('jt-first'); }); if (first) first.classList.add('jt-first');
    if (scroll && bar) { var r = bar.getBoundingClientRect(); if (r.top < 0) window.scrollTo(0, Math.max(0, window.scrollY + r.top - 70)); }
    try { sessionStorage.setItem('jsh-tab:' + HUB, JSON.stringify(cur)); } catch (e) {} }
  function apply(){ if (busy) return; view = D.getElementById('view'); if (!view) return;
    if (!isTeam() || !view.querySelector(':scope > .thead')) { H.classList.remove('jt-on'); return; }
    busy = true;
    try {
      var head = view.querySelector(':scope > .thead');
      /* the short version to the top of Overview: its heading and what follows, up to the next heading */
      var rd = view.querySelector(':scope > #s-read');
      if (rd && !rd.dataset.jtMoved) { var grp = [rd], n = rd.nextElementSibling; while (n && !n.classList.contains('sec')) { grp.push(n); n = n.nextElementSibling; }
        var anchor = head.nextElementSibling; while (anchor && !anchor.classList.contains('sec')) anchor = anchor.nextElementSibling;   /* after the summary tiles, before the first section */
        if (anchor && anchor !== rd) grp.forEach(function(x){ view.insertBefore(x, anchor); }); rd.dataset.jtMoved = '1'; }
      var B = blocks(), have = {}; B.forEach(function(x){ if (x[1] !== '*') have[x[1]] = 1; });
      var tabs = TABS.filter(function(t){ return have[t[0]]; }); if (tabs.length < 2) { H.classList.remove('jt-on'); return; }
      var bar = view.querySelector(':scope > .jtab');
      if (!bar) { bar = D.createElement('div'); bar.className = 'jtab'; bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', 'Sections of this team page');
        var sub = view.querySelector(':scope > .subnav'), extra = sub ? [].filter.call(sub.querySelectorAll('a[href]'), function(a){ return !/#s-|#pk-|#uw/.test(a.getAttribute('href')); }) : [];
        bar.innerHTML = tabs.map(function(t){ return '<button type="button" role="tab" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('')
          + (extra.length ? '<span class="jt-sep" aria-hidden="true"></span>' + extra.map(function(a){ return '<a href="' + a.getAttribute('href').replace(/"/g, '&quot;') + '">' + a.textContent.replace(/[<>&]/g, '') + '</a>'; }).join('') : '');
        view.insertBefore(bar, head.nextElementSibling); }
      H.classList.add('jt-on');
      var key = baseKey(); if (cur.key !== key) { cur.key = key; cur.tab = 'ov'; try { var s = JSON.parse(sessionStorage.getItem('jsh-tab:' + HUB) || 'null'); if (s && s.key === key) cur.tab = s.tab; } catch (e) {} }
      /* a link straight to a section opens its tab */
      var sid = want || ((location.hash || '').split('#')[2] || ''); want = '';
      if (sid) { var el = D.getElementById(sid); if (el) { var hit = B.filter(function(x){ return x[0] === el || x[0].contains(el); })[0]; if (hit && hit[1] !== '*') { cur.tab = hit[1]; var go = el; setTimeout(function(){ if (go.isConnected) window.scrollTo(0, Math.max(0, window.scrollY + go.getBoundingClientRect().top - 90)); }, 60); } } }   /* the hub scrolled while the section was hidden: scroll to it again once its tab is open */
      if (!have[cur.tab]) cur.tab = 'ov';
      show(cur.tab, false);
    } finally { busy = false; } }
  var q = 0; function soon(){ if (!q) q = setTimeout(function(){ q = 0; apply(); }, 0); }   /* not requestAnimationFrame: it does not run in a background tab */
  D.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('#view .jtab button[data-t]'); if (b) { e.preventDefault(); show(b.dataset.t, true); return; }
    /* a link to a section on this page (the summary tiles, "full list" links): open its tab first */
    var a = e.target.closest && e.target.closest('#view a[href*="#s-"]'); if (a && H.classList.contains('jt-on')) { var id = a.getAttribute('href').split('#').pop(), el = D.getElementById(id);
      if (el) { var hit = blocks().filter(function(x){ return x[0] === el || x[0].contains(el); })[0]; if (hit && hit[1] !== '*' && hit[1] !== cur.tab) show(hit[1], false); } } }, true);
  addEventListener('hashchange', function(){ want = ((location.hash || '').split('#')[2] || ''); soon(); });
  function start(){ view = D.getElementById('view'); if (!view) return; css(); new MutationObserver(function(){ if (!busy) soon(); }).observe(view, { childList: true }); apply(); }
  window.JSH_TABS = { apply: apply, show: show };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
})();
/* tabs:end */
