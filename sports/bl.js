/* Jamo Sports Hub BottomLine (2026-10-19, Jamo: "like the ESPN channel's bottom line of news and scores - clean, modern,
   useful"). A slim bar fixed to the bottom of every hub page: Jamo's teams first, then everything live, then each league's
   games (college = AP Top 25 plus BYU and Weber State), ESPN headlines and Jamo's newest articles. It glides right to
   left; the label on the left names the section passing under it. Hover or touch pauses it; a tap opens the game.
   Data: /api/bottomline (functions/api/bottomline.js in the site repo, 30s edge cache) and /sports/latest.json.
   Refreshes every minute while games are live, every five minutes otherwise, and not while the tab is hidden.
   The x hides it (remembered on this device); the "Scores" pill brings it back. Off on full-screen boards. */
(function(){
  if (window.__jshBL) return; window.__jshBL = 1;
  const API = /(^|\.)djgolding\.com$/.test(location.hostname) ? '/api/bottomline' : 'https://djgolding.com/api/bottomline';
  const LATEST = /(^|\.)djgolding\.com$/.test(location.hostname) ? '/sports/latest.json' : 'https://djgolding.com/sports/latest.json';
  const FAV = {cfb:['BYU','WEB'], nfl:['PHI'], nba:['UTAH']};
  const LG = {cfb:{n:'CFB', c:'#3b82f6', home:'/cfb/#/week'}, nfl:{n:'NFL', c:'#ef4444', home:'/nfl/'}, nba:{n:'NBA', c:'#a855f7', home:'/nba/'}};
  const css = `
.jbl{position:fixed;left:0;right:0;bottom:0;z-index:60;height:40px;display:flex;align-items:stretch;font:600 13.5px/1 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#eef2f8;background:rgba(10,12,18,.9);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);border-top:1px solid rgba(255,255,255,.09);box-shadow:0 -8px 24px -12px rgba(0,0,0,.6)}
.jbl[hidden]{display:none}
.jbl-tag{flex:none;display:flex;align-items:center;gap:8px;padding:0 14px 0 12px;font:800 11px/1 "Inter Tight",Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:var(--jblc,#3b82f6);min-width:92px;transition:background .35s ease;position:relative}
.jbl-tag::after{content:"";position:absolute;right:-10px;top:0;bottom:0;width:10px;background:linear-gradient(90deg,var(--jblc,#3b82f6),transparent)}
.jbl-tag b{font-weight:900;font-size:10px;opacity:.8;letter-spacing:.06em}
.jbl-vp{flex:1;min-width:0;overflow:hidden;position:relative;-webkit-mask-image:linear-gradient(90deg,transparent,#000 16px,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,transparent,#000 16px,#000 calc(100% - 24px),transparent)}
.jbl-tr{position:absolute;left:0;top:0;bottom:0;display:flex;align-items:center;white-space:nowrap;will-change:transform}
.jbl-sec{display:inline-flex;align-items:center;gap:6px;margin:0 10px 0 18px;padding:4px 8px;border-radius:6px;font:800 10.5px/1 "Inter Tight",Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:color-mix(in srgb,var(--c) 70%,transparent)}
.jbl-i{display:inline-flex;align-items:center;gap:7px;padding:0 14px;height:40px;color:inherit;text-decoration:none;border-right:1px solid rgba(255,255,255,.08)}
.jbl-i:hover{background:rgba(255,255,255,.06)}
.jbl-i .t{display:inline-flex;align-items:center;gap:5px}
.jbl-i .lgt{font:800 9.5px/1 "Inter Tight",Inter,system-ui,sans-serif;letter-spacing:.08em;margin-right:2px}
.jbl-i .rk{font-size:10px;font-weight:700;color:rgba(255,255,255,.55)}
.jbl-i .s{font-variant-numeric:tabular-nums;font-weight:800;color:#fff}
.jbl-i .l{opacity:.6;font-weight:600}
.jbl-i .w{color:#fff;font-weight:800}
.jbl-i .lg{width:20px;height:20px;object-fit:contain;flex:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))}
.jbl-i .nm{display:inline-block;padding:3px 6px 2px;border-radius:5px;background:var(--tc,#2a3140);color:var(--tk,#fff);font-weight:800;font-size:12px;letter-spacing:.02em;line-height:1.1;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
.jbl-i .nm.plain{background:rgba(255,255,255,.1)}
.jbl-i .t.lost .nm,.jbl-i .t.lost .lg{opacity:.55}
.jbl-i .nm.w{box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),0 0 0 1.5px rgba(255,255,255,.85)}
.jbl-i .st{font-size:11px;font-weight:700;color:rgba(255,255,255,.62);letter-spacing:.02em}
.jbl-i .live{color:#ff5a6e}
.jbl-i .live::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#ff3b52;margin-right:5px;vertical-align:1px;animation:jblp 1.6s infinite}
.jbl-i.fav{background:linear-gradient(180deg,rgba(255,215,90,.10),rgba(255,215,90,.03))}
.jbl-i.fav{box-shadow:inset 0 2px 0 #ffd75a}
.jbl-i.news{font-weight:600;color:#dfe6f2}
.jbl-i.news .src{font-size:10px;font-weight:800;letter-spacing:.08em;color:var(--c,#9fb3d1)}
.jbl-btn{flex:none;width:38px;display:grid;place-items:center;border:0;background:transparent;color:rgba(255,255,255,.7);cursor:pointer;font:700 15px/1 system-ui}
.jbl-btn:hover{color:#fff;background:rgba(255,255,255,.07)}
.jbl-pill{position:fixed;right:12px;bottom:12px;z-index:60;border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:8px 13px;font:800 11px/1 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:rgba(10,12,18,.88);backdrop-filter:blur(10px);cursor:pointer;box-shadow:0 8px 20px -10px rgba(0,0,0,.6)}
.jbl-pill[hidden]{display:none}
body.jbl-on{padding-bottom:calc(40px + env(safe-area-inset-bottom))}
/* phones (2026-10-19): no Safari text enlarging (the 40,000px-wide track made iOS inflate the type, which squished and
   overlapped in the fixed-height bar), nothing shrinks, and the bar clears the home indicator in the home-screen app */
.jbl,.jbl *{-webkit-text-size-adjust:100%;text-size-adjust:100%}
.jbl{padding-bottom:env(safe-area-inset-bottom);height:calc(40px + env(safe-area-inset-bottom))}
.jbl-tr{width:max-content}
.jbl-i,.jbl-sec,.jbl-i>*,.jbl-i .t>*{flex:none}
.jbl-i{line-height:1}
@keyframes jblp{0%,100%{opacity:1}50%{opacity:.35}}
@media (max-width:640px){.jbl{height:calc(36px + env(safe-area-inset-bottom));font-size:12.5px}.jbl-i{height:36px;padding:0 11px}.jbl-tag{display:none}body.jbl-on{padding-bottom:calc(36px + env(safe-area-inset-bottom))}.jbl-btn{width:34px}}
@media (prefers-reduced-motion:reduce){.jbl-vp{overflow-x:auto}.jbl-tr{position:static}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  const bar = document.createElement('div'); bar.className = 'jbl'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Scores and headlines');
  bar.innerHTML = '<div class="jbl-tag"><span class="jbl-lab">Scores</span><b class="jbl-sub"></b></div><div class="jbl-vp"><div class="jbl-tr"></div></div><button class="jbl-btn jbl-pp" type="button" title="Pause" aria-label="Pause">❚❚</button><button class="jbl-btn jbl-x" type="button" title="Hide the ticker" aria-label="Hide the ticker">✕</button>';
  const pill = document.createElement('button'); pill.className = 'jbl-pill'; pill.type = 'button'; pill.textContent = 'Scores'; pill.hidden = true;
  const tag = bar.querySelector('.jbl-tag'), lab = bar.querySelector('.jbl-lab'), sub = bar.querySelector('.jbl-sub'), vp = bar.querySelector('.jbl-vp'), tr = bar.querySelector('.jbl-tr'), pp = bar.querySelector('.jbl-pp');
  let DATA = null, LAT = [], x = 0, last = 0, lastLab = 0, paused = false, hover = false, segs = [], timer = null;
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const offBoard = () => /^#\/(board)/.test(location.hash || '');
  function show(on){ const off = ls('jsh-jbl-off') === '1'; bar.hidden = !on || off || offBoard(); pill.hidden = !(on && off && !offBoard()); document.body.classList.toggle('jbl-on', !bar.hidden); }
  const isFav = g => (FAV[g.lg] || []).some(ab => ab === g.a.ab || ab === g.h.ab);
  function href(g){ if (g.lg === 'nba') return '/nba/#/game/' + g.id; if (g.lg === 'nfl') return '/nfl/#/game/' + g.id; return LG[g.lg].home; }
  function when(g){ const d = new Date(g.date); if (isNaN(d)) return g.det; const today = new Date(); const same = d.toDateString() === today.toDateString(); const t = d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}).replace(':00', '').replace(' ', '').toLowerCase(); return (same ? '' : d.toLocaleDateString([], {weekday:'short'}) + ' ') + t; }
  /* team colors (2026-10-19): the name sits in a chip of the team's color; a pale color gives way to the alternate,
     and anything still pale gets dark type. Logos come small from ESPN's image resizer. */
  const lum = hex => { const n = parseInt(hex, 16); const ch = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * ch(n >> 16 & 255) + .7152 * ch(n >> 8 & 255) + .0722 * ch(n & 255); };
  function chip(s){ let c = s.c || '', c2 = s.c2 || ''; if (!c) return ''; if (lum(c) > .55 && c2 && lum(c2) < .45) c = c2; return '--tc:#' + c + ';--tk:' + (lum(c) > .55 ? '#10131a' : '#fff'); }
  const logo = s => s.logo ? '<img class="lg" src="https://a.espncdn.com/combiner/i?img=' + esc(s.logo) + '&w=48&h=48" alt="" decoding="async" onerror="this.remove()">' : '';
  function side(s, won, lost){ const st = chip(s); return '<span class="t' + (lost ? ' lost' : '') + '">' + (s.rk ? '<span class="rk">' + s.rk + '</span>' : '') + logo(s) + '<b class="nm' + (won ? ' w' : '') + (st ? '' : ' plain') + '"' + (st ? ' style="' + st + '"' : '') + '>' + esc(s.ab || s.n) + '</b>' + (s.s !== '' && s.s != null ? '<span class="s' + (lost ? ' l' : '') + '">' + esc(s.s) + '</span>' : '') + '</span>'; }
  function item(g, lgTag){ const post = g.st === 'post', live = g.st === 'in'; const as = +g.a.s, hs = +g.h.s; const aw = post && as > hs, hw = post && hs > as;
    const stt = live ? '<span class="st live">' + esc(g.det) + '</span>' : post ? '<span class="st">' + esc(/OT/.test(g.det) ? g.det.replace(/^Final\/?/i, 'F/') : 'Final') + '</span>' : '<span class="st">' + esc(when(g)) + (g.tv ? ' · ' + esc(g.tv) : '') + '</span>';
    const a = post || live ? side(g.a, aw, hw) : side(Object.assign({}, g.a, {s:''})), h = post || live ? side(g.h, hw, aw) : side(Object.assign({}, g.h, {s:''}));
    return '<a class="jbl-i' + (isFav(g) ? ' fav' : '') + '" href="' + href(g) + '" title="' + esc(g.a.n + ' at ' + g.h.n + (g.note ? ' · ' + g.note : '')) + '">' + (lgTag ? '<span class="lgt" style="color:' + LG[g.lg].c + '">' + LG[g.lg].n + '</span>' : '') + a + '<span class="l">' + (post || live ? '' : '@') + '</span>' + h + stt + '</a>'; }
  function sec(key, label, color, html){ return html ? '<span class="jbl-sec" data-k="' + key + '" data-l="' + esc(label) + '" style="--c:' + color + '">' + esc(label) + '</span>' + html : ''; }
  function order(list){ const rank = g => g.st === 'in' ? 0 : g.st === 'pre' ? 1 : 2; return list.slice().sort((p, q) => rank(p) - rank(q) || String(p.date).localeCompare(String(q.date))); }
  function build(){ if (!DATA) return; const G = (DATA.games || []).filter(g => LG[g.lg]); let h = ''; /* only the leagues the site covers: CFB, NFL, NBA */
    const favs = order(G.filter(isFav)); h += sec('fav', 'Your teams', '#d4a017', favs.map(g => item(g, true)).join(''));
    const live = order(G.filter(g => g.st === 'in' && !isFav(g))); h += sec('live', 'Live now', '#e11d48', live.map(g => item(g, true)).join(''));
    ['cfb', 'nfl', 'nba'].forEach(lg => { const list = order(G.filter(g => g.lg === lg && g.st !== 'in' && !isFav(g))); if (lg === 'cfb') list.splice(0, list.length, ...list.filter(g => g.a.rk || g.h.rk)); h += sec(lg, LG[lg].n + (lg === 'cfb' ? ' · Top 25' : ''), LG[lg].c, list.slice(0, 18).map(item).join('')); });
    const news = (DATA.news || []).filter(n => LG[n.lg]).slice(0, 14); h += sec('news', 'Headlines', '#64748b', news.map(n => '<a class="jbl-i news" href="' + esc(n.u) + '" target="_blank" rel="noopener" style="--c:' + (LG[n.lg] ? LG[n.lg].c : '#9fb3d1') + '"><span class="src">' + esc(LG[n.lg] ? LG[n.lg].n : '') + '</span>' + esc(n.t) + '</a>').join(''));
    const jam = LAT.slice(0, 4); h += sec('jamo', 'From Jamo', '#0f766e', jam.map(a => '<a class="jbl-i news" href="' + esc(a.href) + '"><span class="src" style="color:#5eead4">' + esc(a.team || '') + '</span>' + esc(a.title) + '</a>').join(''));
    if (!h) h = '<span class="jbl-i">No games on the board right now.</span>';
    tr.innerHTML = h + '<span class="jbl-gap" style="display:inline-block;width:60px"></span>' + h; segs = [...tr.querySelectorAll('.jbl-sec')].slice(0, tr.querySelectorAll('.jbl-sec').length / 2 || 1); label(); }
  function label(){ const vl = vp.getBoundingClientRect().left; let cur = null; tr.querySelectorAll('.jbl-sec').forEach(s => { if (s.getBoundingClientRect().left <= vl + 40) cur = s; }); cur = cur || tr.querySelector('.jbl-sec'); if (!cur) return; lab.textContent = cur.dataset.l; tag.style.setProperty('--jblc', cur.style.getPropertyValue('--c')); const live = (DATA && DATA.games || []).filter(g => g.st === 'in' && LG[g.lg]).length; sub.textContent = live ? live + ' live' : ''; }
  function tick(t){ requestAnimationFrame(tick); if (bar.hidden || reduced) return; const dt = last ? Math.min(64, t - last) : 16; last = t; if (paused || hover || document.hidden) return; const half = tr.scrollWidth / 2; if (half <= vp.clientWidth / 2) return; x -= dt * 0.055; if (-x >= half) x += half; tr.style.transform = 'translateX(' + x.toFixed(1) + 'px)'; if (t - lastLab > 250) { lastLab = t; label(); } }
  async function load(){ try { const r = await fetch(API, {cache:'no-store'}); if (r.ok) { const j = await r.json(); if (j && j.games) DATA = j; } } catch (e) {}
    if (!LAT.length) { try { const r = await fetch(LATEST); if (r.ok) LAT = await r.json(); } catch (e) {} }
    try { document.dispatchEvent(new CustomEvent('jsh:bl', {detail: DATA})); } catch (e) {} /* the top bar's Live dot listens (2026-10-27) */
    build(); clearTimeout(timer); const live = DATA && (DATA.games || []).some(g => g.st === 'in'); timer = setTimeout(() => { if (document.hidden) { document.addEventListener('visibilitychange', function f(){ if (!document.hidden) { document.removeEventListener('visibilitychange', f); load(); } }); } else load(); }, live ? 60e3 : 300e3); }
  vp.addEventListener('mouseenter', () => hover = true); vp.addEventListener('mouseleave', () => hover = false);
  vp.addEventListener('touchstart', () => { hover = true; }, {passive:true}); vp.addEventListener('touchend', () => setTimeout(() => hover = false, 2500), {passive:true});
  pp.addEventListener('click', () => { paused = !paused; pp.textContent = paused ? '▶' : '❚❚'; pp.title = paused ? 'Play' : 'Pause'; pp.setAttribute('aria-label', pp.title); });
  bar.querySelector('.jbl-x').addEventListener('click', () => { ls('jsh-jbl-off', '1'); show(true); });
  pill.addEventListener('click', () => { ls('jsh-jbl-off', '0'); show(true); });
  window.addEventListener('hashchange', () => show(true));
  function start(){ document.body.appendChild(bar); document.body.appendChild(pill); show(true); load(); requestAnimationFrame(tick); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
