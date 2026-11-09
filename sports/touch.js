/* touch:start - "Touch": the phone tune-up layer for every page (2026-11-09, Jamo: "Upgrade and enhance the app" -
   Jamo picked a tune-up, better on the phone, and look and polish for the whole sports hub; no new features).
   Published by sports-hub/build.sh as /sports/touch.js and loaded by the shared top bar (hubbar.html) after Vibe, so
   the home page, Live Center, alerts and all four hubs (CFB, NFL, NBA, CBB) get it. It is one style sheet added at the
   end of the page head; every rule starts with :root so it wins over the hubs' own rules wherever they sit in the
   page. It changes no data and adds nothing to the screen.
   What it does (found by measuring every page at phone width, 390 px):
   - Easier taps: small text links (player names, team chips, "see all" links, bracket teams, the site logo) keep
     their look and place but get an invisible, bigger tap area. Links inside score rows are left alone: the whole
     row already opens the game, and bigger name targets there would cause wrong taps.
   - The compare check boxes on the players tables, the small tick boxes and the sliders get a finger-sized target.
   - Nothing smaller than 11 px: the ticker rank and source, TV guide ranks, injury tags and a few labels were 10 px.
     (Jumbotron and ring-board text is left alone - it copies real scoreboards with fixed sizes.)
   - Names are not cut off: players tables give the name a little more room and let a long name use two lines;
     stat-tile labels, the conference ladder on team pages, TV guide rows and the home page "Next" line wrap instead
     of ending in "...". Bracket boxes use slightly smaller text and tighter spacing so team names fit.
   - Less scrolling: the players page filters sit in 4 rows on a phone instead of 7.
   Phone rules are behind (max-width:720px); tap-area rules also apply to any touch screen (pointer:coarse). */
(function(){
  if (window.__jshTouch) return; window.__jshTouch = true;
  var D = document;
  var TOUCH = '@media (pointer:coarse),(max-width:720px)', PHONE = '@media (max-width:720px)';
  /* text links that get the invisible bigger tap area (not inside .gm score rows - see above) */
  var LINKS = ['a.plink:not(.gm *)', '.chip>a:not(.gm *)', '.mini>a', 'a.mini', '.brt>a', 'td>a.tl',
    '.hd h3>a', '.jsh-brand', '.brand>.wordmark'];
  /* links stacked in tight lists: a smaller reach so one row never covers the next */
  var ROWS = ['.sec>.muted>a', '.mt .tm>a', '.cupfav-g a', '.roy-idle-list a', '.pt-bars>a.pt-b', 'a.sb-chip'];
  /* small buttons */
  var BTNS = ['.trd-btn.add'];
  function each(list, tail){ return list.map(function(s){ return ':root ' + s + tail; }).join(','); }
  function R(sel, body){ return each(sel.split(','), '') + '{' + body + '}'; }
  var css = ''
    + TOUCH + '{'
    + each(LINKS.concat(ROWS, BTNS), '') + '{position:relative}'
    + each(LINKS, '::after') + '{content:"";position:absolute;left:-4px;right:-4px;top:-5px;bottom:-5px}'
    + each(ROWS, '::after') + '{content:"";position:absolute;left:-2px;right:-2px;top:-3px;bottom:-3px}'
    + each(BTNS, '::after') + '{content:"";position:absolute;left:-5px;right:-5px;top:-7px;bottom:-7px}'
    /* the compare check box: its ::after is the tick, so the tap area is ::before */
    + R('.pl-ck::before', 'content:"";position:absolute;left:-8px;right:-5px;top:-9px;bottom:-9px')
    + R('.pl-chk', 'min-height:36px')
    + R('.pl-chk input,#pm-small,#tint', 'width:18px;height:18px;flex:none')
    + R('#tx-pay,#tx-rep', 'min-height:30px')
    + '}'
    + PHONE + '{'
    /* nothing under 11 px */
    + R('.jbl-i .rk,.jbl-i.news .src,.tc-next .tc-k span,#asof .asof-i b,.tvg-at,.ij-h .ij-st,.ss-rk,.tvg-rk', 'font-size:11px')
    /* players tables: room for the name, and a long name may use two lines */
    + R('.pl-tbl .pl-nm', 'min-width:184px;max-width:192px;padding-left:8px')
    + R('.pl-nmw', 'gap:5px')
    + R('.pl-who b.pl-ns', 'white-space:normal;overflow-wrap:anywhere;line-height:1.15;font-size:12.5px')
    /* players page filters: 4 rows, not 7 */
    + R('.pl-tools', 'gap:6px 8px')
    + R('.pl-tools select', 'flex:1 1 150px;min-width:0')
    + R('.pl-tools .seg button', 'padding-left:9px;padding-right:9px')
    /* labels and names that were cut off */
    + R('.tile .lbl', 'white-space:normal;overflow:visible;line-height:1.25')
    + R('.wr-n', 'white-space:normal;line-height:1.2')
    + R('.tvs-m', 'white-space:normal;line-height:1.25')
    + R('.tc-next .tc-g', 'white-space:normal;line-height:1.25')
    /* bracket boxes: a little more room so team names fit */
    + R('.bracket .mt .tm', 'gap:5px')
    + R('.bracket .tm .nm', 'font-size:13px')
    + '}';
  function start(){
    var s = D.createElement('style'); s.id = 'jsh-touch'; s.textContent = css; (D.head || D.documentElement).appendChild(s); }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* touch:end */
