/* One search for everything (2026-10-28, Jamo picked "One search for everything"): a search button in the shared top bar
   on every page (home, Live Center, Articles, and the college, NFL and NBA hubs). Type a team, a player or a page from any
   sport - "Markkanen", "BYU", "Eagles schedule", "plus-minus" - and jump straight there.
   - The index is /sports/search.json (search/build_search.pl, rebuilt with the front door on every deploy): every menu page,
     every team, the NBA and NFL rosters and the college depth charts. It is fetched the first time search opens (about
     130 KB), so no page gets heavier.
   - Results from the sport you are on come first; Jamo's teams (BYU, Weber State, Eagles, Jazz) get a nudge up. Words can
     come in any order and accents don't matter ("doncic" finds Luka Dončić; "eagles sched" finds the Eagles' schedule page).
   - With nothing typed it offers his teams and the searches he opened last (kept on this device only).
   - Keyboard: the top-bar button, or Ctrl+K or "/" on pages without their own search (the hubs keep theirs, which also
     covers games); arrows to move, Enter to open, Esc to close.
   Published by build.sh as /sports/search.js; the top bar (hubbar.html) loads it with defer. */
(function(){
  if (window.__jshSearch) return; window.__jshSearch = true;
  var bar = document.querySelector('.jsh'); if (!bar) return;
  var SP = { cfb:{n:'College', t:'CFB', c:'#1d5fd8', base:'/cfb/'}, nfl:{n:'NFL', t:'NFL', c:'#c8102e', base:'/nfl/'}, nba:{n:'NBA', t:'NBA', c:'#6d28d9', base:'/nba/'}, sports:{n:'Sports Hub', t:'HUB', c:'#475569', base:''} };
  var here = /^\/cfb\//.test(location.pathname) ? 'cfb' : /^\/nfl\//.test(location.pathname) ? 'nfl' : /^\/nba\//.test(location.pathname) ? 'nba' : 'sports';
  var MINE = { cfb:['BYU', 'Weber State'], nfl:['PHI'], nba:['UTAH'] };
  var IDX = null, LOADING = null, SEL = 0, RES = [];
  var fold = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); };
  var enc = encodeURIComponent;

  /* ---------- data ---------- */
  function logo(sp, t){ if (!t) return ''; if (sp === 'cfb') return t[3] ? '/cfb/img/logos/' + t[3] + '.png' : ''; return '/' + sp + '/img/logos/' + t[2] + '.png'; }
  function build(j){ var out = [];
    Object.keys(j.s || {}).forEach(function (sp) { var d = j.s[sp], m = SP[sp]; if (!m) return; var T = d.teams || [];
      (d.pages || []).forEach(function (p) { out.push({ k:'Page', sp:sp, l:p[0], sub:m.n, href:(p[1].charAt(0) === '#' ? m.base : '') + p[1], f:fold(p[0] + ' ' + m.n + (sp === 'cfb' ? ' college football ncaa' : '')) }); });
      T.forEach(function (t) { var mine = (MINE[sp] || []).indexOf(t[2]) >= 0;
        out.push({ k:'Team', sp:sp, l:t[0], sub:t[1], img:logo(sp, t), mine:mine, href:m.base + '#/team/' + enc(t[2]), f:fold(t[0] + ' ' + (sp === 'cfb' ? '' : t[2] + ' ' + (t[3] || ''))) }); });
      (d.players || []).forEach(function (p) { var t = T[p[1]]; if (!t) return;
        out.push({ k:'Player', sp:sp, l:p[0], sub:(sp === 'cfb' ? t[2] : t[3] || t[2]) + (p[2] ? ' · ' + p[2] : ''), img:logo(sp, t), tf:fold(t[0] + ' ' + t[2]), href:m.base + '#/player/' + enc(t[2]) + '/' + enc(p[0]), f:fold(p[0]) }); });
      /* games: found by naming both teams ("byu utah", "jazz nuggets"); the next one up and the latest ones rank first */
      (d.games || []).forEach(function (g) { var a = T[g[0]], h = T[g[1]]; if (!a || !h) return; var nm = function (t) { return sp === 'cfb' ? t[2] : t[3] || t[2]; };
        var fin = g[4] !== '' && g[4] != null, days = (Date.parse(g[2] + 'T12:00:00') - Date.now()) / 864e5;
        out.push({ k:'Game', sp:sp, l:nm(a) + ' at ' + nm(h), sub:dstr(g[2]) + (fin ? ' · final ' + g[4] + '-' + g[5] : ''), img:logo(sp, h), days:days,
          href:m.base + '#/game/' + enc(g[3]), f:fold(a[0] + ' ' + a[2] + ' ' + (a[3] || '') + ' ' + h[0] + ' ' + h[2] + ' ' + (h[3] || '')),
          fa:fold(a[0] + ' ' + a[2] + ' ' + (a[3] || '')), fh:fold(h[0] + ' ' + h[2] + ' ' + (h[3] || '')), two:true }); });
    });
    return out; }
  function dstr(d){ var t = new Date(d + 'T12:00:00'); return isNaN(t) ? d : t.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }); }
  function load(){ if (IDX) return Promise.resolve(IDX); if (LOADING) return LOADING;
    LOADING = fetch('/sports/search.json', { cache:'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) { IDX = build(j); return IDX; })
      .catch(function () { LOADING = null; return null; });
    return LOADING; }

  /* ---------- matching: every typed word must start a word of the name (or, for players, of their team) ---------- */
  function score(x, words, q){ var f = x.f, s = 0;
    for (var i = 0; i < words.length; i++) { var w = words[i];
      if ((' ' + f).indexOf(' ' + w) >= 0) continue;
      if (x.tf && (' ' + x.tf).indexOf(' ' + w) >= 0) { s += 1.5; continue; }   /* "jazz markkanen", "byu retzlaff" */
      if (w.length >= 3 && f.indexOf(w) >= 0) { s += 2; continue; }
      return null; }
    if (x.two) { /* a game needs both teams named ("byu utah"), or "byu" / "utah jazz" would list every one of their games */
      var hitA = false, hitH = false; for (var j = 0; j < words.length; j++) { var ww = " " + words[j]; if ((" " + x.fa).indexOf(ww) >= 0) hitA = true; if ((" " + x.fh).indexOf(ww) >= 0) hitH = true; }
      if (!hitA || !hitH) return null;
      s += 0.6 + (x.days >= -1 && x.days <= 10 ? -0.5 : x.days < -1 ? Math.min(-x.days, 200) / 400 : Math.min(x.days, 200) / 200); }
    else if (f === q) s -= 3; else if (f.indexOf(q) === 0) s -= 2;
    s += { Team:-1, Page:0.4, Player:0.8, Game:0 }[x.k];
    if (x.sp === here) s -= 0.6; if (x.mine) s -= 0.8;
    return s + Math.min(x.l.length, 40) / 200; }
  function search(q){ var words = fold(q).split(' ').filter(Boolean); if (!words.length || !IDX) return []; var qq = words.join(' '), hits = [];
    for (var i = 0; i < IDX.length; i++) { var s = score(IDX[i], words, qq); if (s !== null) hits.push([s, IDX[i]]); }
    hits.sort(function (a, b) { return a[0] - b[0]; }); return hits.slice(0, 30).map(function (h) { return h[1]; }); }

  /* ---------- recent picks (this device only) ---------- */
  function recent(){ try { return JSON.parse(localStorage.getItem('jsh-search-recent') || '[]') || []; } catch (e) { return []; } }
  function remember(x){ try { var r = recent().filter(function (y) { return y.href !== x.href; }); r.unshift({ k:x.k, sp:x.sp, l:x.l, sub:x.sub, img:x.img, href:x.href }); localStorage.setItem('jsh-search-recent', JSON.stringify(r.slice(0, 6))); } catch (e) {} }
  function starters(){ var mine = IDX ? IDX.filter(function (x) { return x.mine; }) : [];
    var order = ['BYU', 'Weber State', 'Philadelphia Eagles', 'Utah Jazz']; mine.sort(function (a, b) { return order.findIndex(function (o) { return a.l.indexOf(o) === 0; }) - order.findIndex(function (o) { return b.l.indexOf(o) === 0; }); });
    return { recent:recent(), mine:mine }; }

  /* ---------- the panel ---------- */
  var css = document.createElement('style'); css.textContent =
    '.jsh-sb{flex:none;display:grid;place-items:center;width:34px;height:30px;margin-left:6px;border:0;border-radius:999px;background:rgba(255,255,255,.08);color:#dfe6f3;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '.jsh-sb:hover{background:rgba(255,255,255,.16);color:#fff}.jsh-sb:focus-visible{outline:2px solid #7cb6ff;outline-offset:2px}.jsh-sb svg{width:17px;height:17px}'
    + '@media (min-width:1100px){.jsh-sb{margin-left:auto}}'
    + '.jss{position:fixed;inset:0;z-index:2147483000;display:flex;justify-content:center;align-items:flex-start;padding:max(56px,8vh) 16px 16px;background:rgba(3,6,14,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}'
    + '.jss[hidden]{display:none}'
    + '.jss-box{width:100%;max-width:620px;max-height:calc(100vh - 90px);display:flex;flex-direction:column;border-radius:18px;background:#0b111e;border:1px solid rgba(140,170,230,.22);box-shadow:0 30px 80px -20px rgba(0,0,0,.8);color:#e7ecf5;overflow:hidden}'
    + '.jss-top{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}.jss-top svg{flex:none;width:19px;height:19px;color:#8f9aac}'
    + '.jss-q{flex:1;min-width:0;border:0;outline:0;background:none;color:#fff;font:inherit;font-size:17px;padding:6px 0}.jss-q::placeholder{color:#7d889c}'
    + '.jss-x{flex:none;border:0;background:rgba(255,255,255,.08);color:#cfd6e4;border-radius:8px;padding:6px 10px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}'
    + '.jss-res{overflow:auto;padding:6px 6px 10px;overscroll-behavior:contain}'
    + '.jss-h{padding:10px 10px 4px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#8f9aac}'
    + '.jss-r{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:11px;color:inherit!important;text-decoration:none!important;cursor:pointer}'
    + '.jss-r.sel,.jss-r:hover{background:rgba(124,182,255,.13)}'
    + '.jss-i{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:rgba(255,255,255,.06)}.jss-i img{width:24px;height:24px;object-fit:contain}.jss-i svg{width:16px;height:16px;color:#aab4c6}'
    + '.jss-t{flex:1;min-width:0}.jss-l{display:block;font-size:15px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jss-s{display:block;font-size:12.5px;color:#93a0b6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.jss-tag{flex:none;font-size:9.5px;font-weight:800;letter-spacing:.1em;padding:3px 6px;border-radius:5px;color:#fff;background:var(--c)}'
    + '.jss-k{flex:none;font-size:11px;color:#7d889c;font-weight:600}'
    + '.jss-note{padding:18px 12px;color:#93a0b6;font-size:14px;line-height:1.5}'
    + '@media (max-width:600px){.jss{padding:0;align-items:stretch}.jss-box{max-width:none;max-height:none;height:100%;border-radius:0;border:0}.jss-top{padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px}.jss-q{font-size:16px}.jss-k{display:none}}';
  document.head.appendChild(css);
  var ICON_Q = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
  var ICON_P = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>';
  var ICON_C = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'jsh-sb'; btn.title = 'Search teams, players and pages'; btn.setAttribute('aria-label', 'Search every sport');
  btn.innerHTML = ICON_Q; bar.appendChild(btn);
  var ov = null, q = null, res = null, lastFocus = null;
  function row(x, i){ var m = SP[x.sp] || SP.sports;
    return '<a class="jss-r' + (i === SEL ? ' sel' : '') + '" href="' + esc(x.href) + '" data-i="' + i + '" role="option" aria-selected="' + (i === SEL) + '">'
      + '<span class="jss-i">' + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy" onerror="this.remove()">' : x.k === 'Page' ? ICON_P : ICON_C) + '</span>'
      + '<span class="jss-t"><span class="jss-l">' + esc(x.l) + '</span><span class="jss-s">' + esc((x.k === 'Page' ? 'Page · ' : x.k === 'Player' ? '' : '') + (x.sub || '')) + '</span></span>'
      + '<span class="jss-k">' + x.k + '</span><span class="jss-tag" style="--c:' + m.c + '">' + m.t + '</span></a>'; }
  function draw(){ var v = q.value.trim(), html = '';
    if (!IDX) { res.innerHTML = '<div class="jss-note">' + (LOADING ? 'Loading teams and players…' : 'Search did not load. Check the connection and try again.') + '</div>'; return; }
    if (!v) { var st = starters(); RES = st.recent.concat(st.mine.filter(function (x) { return !st.recent.some(function (r) { return r.href === x.href; }); }));
      var n = st.recent.length;
      html = (n ? '<div class="jss-h">Recent</div>' + st.recent.map(function (x, i) { return row(x, i); }).join('') : '')
        + (RES.length > n ? '<div class="jss-h">Your teams</div>' + RES.slice(n).map(function (x, i) { return row(x, i + n); }).join('') : '')
        + '<div class="jss-note">Type a team, a player or a page from any sport: “Markkanen”, “BYU”, “Eagles”, “plus-minus”.</div>'; }
    else { RES = search(v); if (SEL >= RES.length) SEL = 0;
      html = RES.length ? RES.map(row).join('') : '<div class="jss-note">Nothing matches “' + esc(v) + '”. Try a last name, a team or a page like “standings”.</div>'; }
    res.innerHTML = html; }
  function open(pre){ if (!ov) { ov = document.createElement('div'); ov.className = 'jss'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Search every sport');
      ov.innerHTML = '<div class="jss-box"><div class="jss-top">' + ICON_Q + '<input class="jss-q" type="search" placeholder="Search teams, players, pages…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-label="Search"><button type="button" class="jss-x">Close</button></div><div class="jss-res" role="listbox"></div></div>';
      document.body.appendChild(ov); q = ov.querySelector('.jss-q'); res = ov.querySelector('.jss-res');
      ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.jss-x')) { close(); return; } var a = e.target.closest('.jss-r'); if (a) { var x = RES[+a.dataset.i]; if (x) remember(x); setTimeout(close, 0); } });
      q.addEventListener('input', function () { SEL = 0; draw(); });
      q.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!RES.length) return; SEL = (SEL + (e.key === 'ArrowDown' ? 1 : -1) + RES.length) % RES.length; draw(); var s = res.querySelector('.sel'); if (s) s.scrollIntoView({ block:'nearest' }); }
        else if (e.key === 'Enter') { var x = RES[SEL]; if (x) { e.preventDefault(); remember(x); close(); location.href = x.href; } }
        else if (e.key === 'Escape') { e.preventDefault(); close(); } }); }
    lastFocus = document.activeElement; ov.hidden = false; document.documentElement.style.overflow = 'hidden'; q.value = typeof pre === 'string' ? pre : ''; SEL = 0; draw();
    try { q.focus({ preventScroll:true }); } catch (e) { q.focus(); }   /* right away, inside the tap, so phones raise the keyboard */
    if (!IDX) load().then(function () { if (!ov.hidden) draw(); }); }
  function close(){ if (!ov || ov.hidden) return; ov.hidden = true; document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} }
  btn.addEventListener('click', function () { open(); });
  /* each hub's own "Find a team…" box in its header opens this same search (keeping anything typed), so a hub page has one
     search, not two - the top-bar button steps aside there */
  var hq = here !== 'sports' && document.getElementById('q');
  if (hq) { btn.style.display = 'none'; hq.setAttribute('placeholder', 'Search teams, players, games…'); hq.setAttribute('aria-label', 'Search every sport');
    hq.addEventListener('pointerdown', function () { load(); }, { passive:true });
    hq.addEventListener('focus', function () { var v = hq.value; hq.value = ''; var r = document.getElementById('qres'); if (r) r.hidden = true; hq.blur(); open(v); }); }
  /* the hubs have their own Ctrl+K / "/" search (it also finds games), so the shortcut is only claimed off the hubs */
  if (here === 'sports') document.addEventListener('keydown', function (e) { var tg = (e.target.tagName || '').toLowerCase(), typing = tg === 'input' || tg === 'textarea' || tg === 'select' || e.target.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey))) { e.preventDefault(); open(); } });
  addEventListener('hashchange', close);
  /* start fetching the index as soon as a finger or mouse heads for the button (not on every page view - phones only pay
     for it when they search) */
  ['pointerenter', 'touchstart', 'focus'].forEach(function (ev) { btn.addEventListener(ev, function () { load(); }, { passive:true, once:true }); });
})();
