/* stage:start - the team-color backdrop behind the CFB, NFL and NBA hubs (2026-10-27).
   Jamo, looking at an NBA game page with the Jazz court behind it: "Let's remove the court backgrounds so the
   information is more clear. Keep team colors but have clean electronic look that's smooth and gradient", and for the
   BYU stadium photos: "Yes, swap the BYU photo for the gradient too".
   Loaded on every page by a tag in sports-hub/hubbar.html (published as /sports/stage.js; bump ?v= on every change).
   It does nothing outside the three hubs (front door, Live Center, alerts and articles keep their own backdrops).
   What it draws, CSS only, behind every hub page:
   - a smooth, deep gradient in the page team's colors: the primary color as a soft bloom from the top left, the
     second color (the team's alternate, or a deeper partner shade when the alternate is white, grey or too close, e.g.
     BYU royal + navy) glowing up from the bottom right, over a near-black base tinted with both
   - an electronic finish that stays out of the way: a very faint fine grid that shows only toward the edges and corners
     and fades out over the middle where the information is, a gentle glass sheen, and a fine grain so the dark
     gradient never bands
   - no logo watermark (the team header already carries the logo); no court, field or photo
   Which team: the one the hub already themes the page with (applyPageTheme: the team page, the favorite when it is
   playing, else the home team, else the favorite when "Color the site in team colors" is on). CFB team pages always
   use their own team. No team (tint off, no favorite): the hub's accent color in the same style.
   Legibility is measured, not eyeballed: the colors come from a small layer model that both writes the CSS and
   samples it (three screen shapes, every layer, the grid at full strength), and the glow is turned down until the
   brightest point stays at or under luminance 0.02 (dark) / the dimmest at or over 0.83 (light). The hubs' cards are
   see-through, so all their text sits over the backdrop too: muted text (--ink-3), accent links and gold/good/bad words
   are lifted a touch when they would fall under 4.7:1 at that worst point (dark mode counts the cards' 5% white sheen),
   and page text that sits right on the backdrop (footer, notes, dates) uses --ink-2. Checked 2026-10-27 in the browser
   on NBA, NFL and CFB team, game and scores pages, both themes, 1366 and 375 wide.
   Both themes are in the CSS (under the hubs' own theme selectors), so the backdrop always matches the page's theme.
   Static: no animation, nothing tied to scrolling; one fixed layer sized to the large viewport so the phone toolbar
   sliding in and out does not redraw it. Steps back on the big board, TV guide, game night and game day screens. */
(function(){ if (window.JSH_STAGE) return;
  const D = document, H = D.documentElement;
  const HUB = (/^\/(cfb|nfl|nba)(\/|$)/.exec(location.pathname) || [])[1] || ((/^(CFB|NFL|NBA)\b/.exec(D.title) || [])[1] || '').toLowerCase();
  if (!HUB) return;
  const OFF = /^#\/(board|tv|gamenight|gameday)\b/;
  const MQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  const LD = 0.02, LL = 0.83;
  const W3 = [255, 255, 255], K3 = [0, 0, 0];

  /* ---------- color math ---------- */
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const R = c => c.map(v => Math.round(Math.max(0, Math.min(255, v))));
  const hex = s => { s = String(s || '').trim(); let m = /^#?([0-9a-f]{6})$/i.exec(s); if (m) { const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    m = /^#([0-9a-f]{3})$/i.exec(s); if (m) return m[1].split('').map(h => parseInt(h + h, 16));
    m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(s); return m ? [+m[1], +m[2], +m[3]] : null; };
  function hsl(c){ const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = 60 * (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4); }
    return [h, s, l]; }
  function fromHsl(h, s, l){ const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); }; return [f(0), f(8), f(4)]; }
  /* the same hue at luminance L: darker = scaled toward black, lighter = scaled up, then toward white; black becomes steel */
  function toL(c, L){ let x = Math.max(c[0], c[1], c[2]) < 10 ? [92, 104, 122] : c.slice();
    const at = m => x.map(v => v * m);
    if (lum(x) > L) { let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (lum(at(m)) > L) hi = m; else lo = m; } return at(lo); }
    const top = 255 / Math.max(x[0], x[1], x[2]);
    if (lum(at(top)) >= L) { let lo = 1, hi = top; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (lum(at(m)) < L) lo = m; else hi = m; } return at(hi); }
    x = at(top); let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (lum(mix(x, W3, m)) < L) lo = m; else hi = m; } return mix(x, W3, hi); }
  /* light mode: the team color mixed with white (a true tint, so midnight green stays green-grey, not cyan) */
  function tint(c, L){ const x = Math.max(c[0], c[1], c[2]) < 10 ? [92, 104, 122] : c; if (lum(x) >= L) return x.slice();
    let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (lum(mix(x, W3, m)) < L) lo = m; else hi = m; }
    const t = mix(x, W3, hi), v = toL(x, L); return mix(t, v, 0.4); /* a little of the full-strength hue back, so it is not grey */ }
  /* dark mode glows: a touch more saturation so a deep color still reads as the team color (neutrals stay neutral) */
  function vivid(c){ const [h, s, l] = hsl(c); return s < 0.15 ? c : fromHsl(h, Math.min(1, s * 1.15 + 0.12), l); }
  /* the second color: the team alternate when it is a real color of its own, else a deeper partner of the primary */
  function partner(p, a){
    const [hp, sp, lp] = hsl(p);
    if (a) { const [ha, sa, la] = hsl(a), dh = Math.min(Math.abs(ha - hp), 360 - Math.abs(ha - hp));
      if (sa >= 0.28 && la > 0.1 && la < 0.88 && (dh >= 24 || sp < 0.15)) return a; }
    if (sp < 0.15) return fromHsl(214, 0.22, Math.max(0.12, Math.min(0.32, lp * 0.7 + 0.08)));
    /* turn a little toward the deeper neighbor: reds toward crimson, golds toward orange, greens toward teal, blues toward navy/indigo */
    const turn = hp < 20 || hp >= 290 ? -14 : hp < 80 ? -16 : 14;
    return fromHsl((hp + turn + 360) % 360, Math.min(1, sp * 1.05), Math.max(0.1, lp * 0.56)); }

  /* ---------- the layer model: one description writes the CSS and is sampled for the legibility check ---------- */
  const rgba = (c, a) => 'rgba(' + R(c).join(',') + ',' + (+a.toFixed(3)) + ')';
  const stopsCss = st => st.map(s => rgba(s[0], s[1]) + ' ' + s[2] + '%').join(',');
  const css1 = l => l.k === 'lin' ? 'linear-gradient(' + l.ang + 'deg,' + stopsCss(l.st) + ')'
    : 'radial-gradient(' + l.rx + '% ' + l.ry + '% at ' + l.cx + '% ' + l.cy + '%,' + stopsCss(l.st) + ')';
  function tOf(l, x, y, w, h){ if (l.k === 'lin') { const r = l.ang * Math.PI / 180, sx = Math.sin(r), sy = -Math.cos(r), len = Math.abs(w * sx) + Math.abs(h * sy); return ((x - w / 2) * sx + (y - h / 2) * sy) / len + 0.5; }
    const dx = (x - l.cx / 100 * w) / (l.rx / 100 * w), dy = (y - l.cy / 100 * h) / (l.ry / 100 * h); return Math.sqrt(dx * dx + dy * dy); }
  function colorAt(st, t){ t *= 100; if (t <= st[0][2]) return [st[0][0], st[0][1]];
    for (let i = 1; i < st.length; i++) { const a = st[i - 1], b = st[i]; if (t <= b[2]) { const u = b[2] > a[2] ? (t - a[2]) / (b[2] - a[2]) : 1, al = a[1] + (b[1] - a[1]) * u;
      if (al <= 0) return [b[0], 0]; return [a[0].map((v, j) => (v * a[1] + (b[0][j] * b[1] - v * a[1]) * u) / al), al]; } }
    const z = st[st.length - 1]; return [z[0], z[1]]; }
  /* sample the composed backdrop: brightest point (dark) or dimmest point (light), grain left out (it only darkens in
     dark mode and only lightens in light mode, so it can never push past the limit) */
  function measure(M, dark){ let worst = dark ? 0 : 1; const F = M.field.map(l => Object.assign({}, l, { st: R4(l.st) }));
    for (const [w, h] of [[390, 844], [1366, 768], [1920, 1080]]) for (let i = 0; i <= 16; i++) for (let j = 0; j <= 16; j++) {
      const x = w * i / 16, y = h * j / 16; let b = [0, 0, 0];
      for (const l of F) { const [c, a] = colorAt(l.st, tOf(l, x, y, w, h)); b = mix(b, c, a); }
      const ma = colorAt(M.mask.st, tOf(M.mask, x, y, w, h))[1]; b = mix(b, M.grid.c, M.grid.a * ma);
      const L = lum(b); if (dark ? L > worst : L < worst) worst = L; }
    return worst; }
  const R4 = st => st.map(s => [R(s[0]), s[1], s[2]]);

  /* grain: a 160 px noise tile drawn once; black specks with a varying alpha in dark mode, white ones in light */
  const grain = dark => 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ' + (dark ? 0 : 1) + ' 0 0 0 0 ' + (dark ? 0 : 1) + ' 0 0 0 0 ' + (dark ? 0 : 1) + ' ' + (dark ? '.16 0 0 0 -.05' : '.2 0 0 0 -.06') + '"/></filter><rect width="160" height="160" filter="url(#g)"/></svg>') + '") 0 0/160px 160px repeat';

  /* k = glow strength (1 = full); the guarantee loop lowers it until the sampled limit holds */
  function model(P, S, dark, k){
    if (dark) {
      const vP = vivid(P), vS = vivid(S);
      const pG = toL(vP, 0.05 * k), sG = toL(vS, 0.036 * k), pM = toL(vP, 0.016), sM = toL(vS, 0.011), base = toL(mix(vP, vS, 0.5), 0.0032);
      const line = mix(toL(S, 0.42), W3, 0.3);
      return { dark, k, line,
        field: [
          { k: 'lin', ang: 158, st: [[pM, 1, 0], [base, 1, 42], [base, 1, 58], [sM, 1, 100]] },
          { k: 'rad', rx: 100, ry: 78, cx: 2, cy: -8, st: [[pG, 1, 0], [pG, 0.55, 30], [pG, 0.2, 56], [pG, 0, 80]] },
          { k: 'rad', rx: 88, ry: 66, cx: 100, cy: 106, st: [[sG, 1, 0], [sG, 0.5, 36], [sG, 0.14, 60], [sG, 0, 80]] },
          { k: 'lin', ang: 116, st: [[W3, 0, 24], [W3, 0.026 * k, 37], [W3, 0, 50]] },
          { k: 'rad', rx: 150, ry: 110, cx: 50, cy: 38, st: [[K3, 0, 55], [K3, 0.38, 100]] }],
        grid: { c: line, a: 0.075 * k, size: 44 },
        mask: { k: 'rad', rx: 120, ry: 92, cx: 50, cy: 46, st: [[K3, 0, 38], [K3, 0.45, 70], [K3, 1, 100]] } };
    }
    const q = 1 - k; /* light: pastels move toward white as k drops */
    const pL = tint(P, 0.62 + 0.34 * q), sL = tint(S, 0.68 + 0.28 * q), base = [244, 246, 249], end = tint(S, 0.82 + 0.14 * q);
    const line = toL(P, 0.05);
    return { dark, k, line,
      field: [
        { k: 'lin', ang: 158, st: [[tint(P, 0.86 + 0.1 * q), 1, 0], [base, 1, 44], [base, 1, 62], [end, 1, 100]] },
        { k: 'rad', rx: 92, ry: 72, cx: 4, cy: -6, st: [[pL, 0.9, 0], [pL, 0.46, 36], [pL, 0.14, 58], [pL, 0, 78]] },
        { k: 'rad', rx: 78, ry: 62, cx: 102, cy: 106, st: [[sL, 0.85, 0], [sL, 0.36, 40], [sL, 0, 74]] },
        { k: 'lin', ang: 116, st: [[W3, 0, 24], [W3, 0.45, 37], [W3, 0, 50]] }],
      grid: { c: line, a: 0.06 * k, size: 44 },
      mask: { k: 'rad', rx: 120, ry: 92, cx: 50, cy: 46, st: [[K3, 0, 38], [K3, 0.45, 70], [K3, 1, 100]] } };
  }
  function fieldCss(M){ return [grain(M.dark)].concat(M.field.slice().reverse().map(css1)).join(','); }
  function gridCss(M){ const g = M.grid, c = rgba(g.c, g.a), s = g.size;
    return 'repeating-linear-gradient(90deg,' + c + ' 0 1px,transparent 1px ' + s + 'px),repeating-linear-gradient(180deg,' + c + ' 0 1px,transparent 1px ' + s + 'px)'; }

  /* ---------- which team colors the page ---------- */
  let TD = null;
  function teams(){ if (TD) return TD; TD = { by: {}, ids: {}, logos: null }; const el = id => D.getElementById(id);
    try { (JSON.parse((el('d-teams') || {}).textContent || '[]') || []).forEach(t => { const k = t && (t.ab || t.name); if (k) TD.by[k] = [hex(t.color), hex(t.alt)]; }); } catch (e) {}
    const fc = el('d-fcsteams'); if (fc) fc.textContent.split('\n').forEach(l => { const p = l.trim().split('|'); if (p.length >= 6 && !TD.by[p[1]]) TD.by[p[1]] = [hex(p[4]), hex(p[5])]; });
    const li = el('d-logoids'); if (li) li.textContent.split('\n').forEach(l => { const p = l.trim().split('|'); if (p.length >= 2) TD.ids[p[1]] = p[0]; });
    return TD; }
  function logoName(wm){ const td = teams(); if (!td.logos) { try { td.logos = JSON.parse((D.getElementById('d-logos') || {}).textContent || '{}') || {}; } catch (e) { td.logos = {}; } }
    for (const k in td.logos) { const w = td.logos[k] && td.logos[k].wm; if (w && wm.indexOf(w) >= 0) return k; } return null; }
  /* [primary, alternate or null, label]: the team the hub themes the page with (found from its logo), except that a CFB
     team page always wears its own team and a CFB game page without that team wears the home team (the CFB hub only
     themed teams it had a big watermark logo for; the watermark is gone, so every team can have its colors) */
  const dec = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  function pick(b){ const td = teams(), ok = k => !!(k && td.by[k] && td.by[k][0]), out = k => [td.by[k][0], td.by[k][1], k];
    let name = null, page = null;
    if (b.classList.contains('themed')) { const wm = b.style.getPropertyValue('--wm') || '';
      const ab = (/\/logos\/([A-Za-z]+)(?:-dark)?-lg\.png/.exec(wm) || [])[1], id = (/\/logos\/(\d+)(?:-dark)?-lg\.png/.exec(wm) || [])[1];
      if (ok(ab)) name = ab; else if (id && ok(td.ids[id])) name = td.ids[id]; else if (/data:/.test(wm)) { const n = logoName(wm); if (ok(n)) name = n; }
      if (!name) { const e = /#([0-9a-f]{6})\s+100%\)\s*$/i.exec((b.style.getPropertyValue('--pbg') || '').trim()); if (e) page = [hex(e[1]), null, 'page']; } }
    if (HUB === 'cfb') { const h = location.hash || '', m = /^#\/team\/([^\/#?]+)/.exec(h);
      if (m) { const n = dec(m[1]); if (ok(n)) return out(n); }
      else if (/^#\/game\//.test(h)) { const two = [...D.querySelectorAll('#view .ghead .side a.monolink')].map(a => dec((a.getAttribute('href') || '').replace(/^#\/team\//, '')));
        if (two.length === 2 && two.indexOf(name) < 0 && ok(two[1])) return out(two[1]); } }
    if (name) return out(name); if (page) return page;
    const ac = hex(getComputedStyle(H).getPropertyValue('--accent')); return [ac || [31, 95, 168], null, 'accent']; }

  function isDark(){ const t = H.getAttribute('data-theme'); if (t === 'dark') return true; if (t === 'light') return false; return !!(MQ && MQ.matches); }
  function wall(b){ if (b.classList.contains('jsh-wall')) return true;
    for (const id of ['fieldbg', 'floorbg', 'cupbg']) { const el = D.getElementById(id); if (el && el.getClientRects().length) return true; } return false; }

  /* ---------- styles ---------- */
  const X = ':is(html.jsh-stg,#jsh-stg-x)'; /* id-weight selector: wins over the hubs' own body.themed rules, which load later */
  const LAYER = 'content:"";display:block;position:fixed;inset:0 0 auto 0;width:auto;height:100vh;height:100lvh;pointer-events:none;transform:none;filter:none;opacity:1;margin:0;border:0;border-radius:0;animation:none;';
  const base = D.createElement('style'); base.id = 'jsh-stage-css';
  base.textContent =
    X + ' #neo-bg{display:none}'
  /* text that sits right on the backdrop, not on a card */
  + X + ' :is(footer,.asof,.crumb,.season,.tzl,.simnote,.daygrp h3 :is(.cnt,.dim),#view>:is(.eyebrow,.dim),.page-head :is(.eyebrow,.dim),.sec>:is(.dim,.eyebrow),.sec>h2 :is(.dim,.eyebrow)){color:var(--ink-2)}'
  + '@media print{' + X + ' body::before,' + X + ' body::after{display:none}}';
  const dyn = D.createElement('style'); dyn.id = 'jsh-stage-dyn';
  D.head.appendChild(base); D.head.appendChild(dyn);

  /* Both themes are written into the CSS under the hubs' own theme selectors, so the backdrop flips with the page the
     instant light/dark changes, even if no change event reaches this script (a dark stage behind light-theme text, or the
     reverse, would be unreadable). */
  const SEL = { d: [X + '[data-theme="dark"]', '(prefers-color-scheme:dark)', X + ':not([data-theme="light"])'],
                l: [X + '[data-theme="light"]', '(prefers-color-scheme:light)', X + ':not([data-theme="dark"])'] };
  /* the page's text colors that can sit on the backdrop (muted text, accent links, gold/good/bad words; read from the
     hub's :root, never from this script's own override), each lifted only if it fails and only just enough to hold
     4.7:1 over the worst point; in dark mode that point includes the 5% white sheen the glass cards add */
  const TGT = 4.7;
  const gray = L => { const v = (L <= 0.0031308 ? L * 12.92 : 1.055 * Math.pow(L, 1 / 2.4) - 0.055) * 255; return [v, v, v]; };
  const worstFor = (dark, m) => dark ? lum(mix(gray(m), W3, 0.05)) : m;
  function inkLift(dark, m){ const cs = getComputedStyle(H), bg = worstFor(dark, m), to = dark ? W3 : K3; let out = '';
    for (const n of ['--ink-2', '--ink-3', '--accent-text', '--gold-text', '--good', '--bad']) { const c = hex(cs.getPropertyValue(n)); if (!c || ratio(lum(c), bg) >= TGT) continue;
      let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const q = (lo + hi) / 2; if (ratio(lum(mix(c, to, q)), bg) >= TGT) hi = q; else lo = q; }
      out += n + ':rgb(' + R(mix(c, to, hi)).join(',') + ');'; }
    return out; }
  /* the strongest glow that keeps the limit: brightness only grows with k (dark) and only shrinks with it (light), so a
     short halving search finds it (about 8 samplings of the backdrop, a few milliseconds per theme on a phone) */
  function build(P, A, dark){ const S = partner(P, A), ok = v => dark ? v <= LD : v >= LL;
    let k = 1, M = model(P, S, dark, 1), m = measure(M, dark);
    if (!ok(m)) { let lo = 0, hi = 1, best = null;
      for (let i = 0; i < 7; i++) { const q = (lo + hi) / 2, Mq = model(P, S, dark, q), mq = measure(Mq, dark); if (ok(mq)) { lo = q; best = [Mq, mq]; } else hi = q; }
      if (!best) { const M0 = model(P, S, dark, 0); best = [M0, measure(M0, dark)]; }
      k = lo; M = best[0]; m = best[1]; }
    const mk = css1(M.mask);
    return { M, S, k, m, ink: null, rules: r => r + ' body::before{' + LAYER + 'z-index:-2;background:' + fieldCss(M) + '}'
      + r + ' body::after{' + LAYER + 'z-index:-1;background:' + gridCss(M) + ';-webkit-mask-image:' + mk + ';mask-image:' + mk + '}' }; }
  const themeCss = (t, c) => { const s = r => c.rules(r) + (c.ink ? r + ' body{' + c.ink + '}' : ''); return s(SEL[t][0]) + '@media ' + SEL[t][1] + '{' + s(SEL[t][2]) + '}'; };

  let last = ''; const CACHE = new Map();
  function sync(){ const b = D.body; if (!b) return;
    const dark = isDark(), t = dark ? 'd' : 'l'; let st = 'stage';
    if (b.classList.contains('boardmode') || b.classList.contains('tvmode') || OFF.test(location.hash || '')) st = 'off';
    else if (wall(b)) st = 'wall';
    let P = null, A = null, who = '';
    if (st === 'stage') { [P, A, who] = pick(b); }
    const key = st + '|' + (P ? R(P).join(',') + '/' + (A ? R(A).join(',') : '') : '');
    if (key + '|' + t === last) return; last = key + '|' + t;
    H.classList.toggle('jsh-stg', st === 'stage');
    if (st === 'stage') { let c = CACHE.get(key);
      if (!c) { c = { d: null, l: null }; CACHE.set(key, c); }
      if (!c[t]) c[t] = build(P, A, dark);
      const cur = c[t]; if (cur.ink === null) cur.ink = inkLift(dark, cur.m);
      const write = () => { dyn.textContent = (c.d ? themeCss('d', c.d) : '') + (c.l ? themeCss('l', c.l) : ''); };
      write();
      /* the other theme a moment later, off the page-change path */
      const o = dark ? 'l' : 'd', mine = last;
      if (!c[o]) setTimeout(() => { if (!c[o]) c[o] = build(P, A, !dark); if (last === mine) write(); }, 150);
      const cs = getComputedStyle(b), con = {}, card = {}; for (const n of ['--ink', '--ink-2', '--ink-3']) { const x = hex(cs.getPropertyValue(n)); if (x) { con[n] = +ratio(lum(x), cur.m).toFixed(2); card[n] = +ratio(lum(x), worstFor(dark, cur.m)).toFixed(2); } }
      window.JSH_STAGE.model = cur.M; window.JSH_STAGE.audit = { team: who, primary: R(P), second: R(cur.S), dark, strength: +cur.k.toFixed(3), [dark ? 'brightest' : 'dimmest']: +cur.m.toFixed(4), limit: dark ? LD : LL, lifted: cur.ink, contrast: con, onGlassCard: card };
    } else { dyn.textContent = ''; window.JSH_STAGE.audit = null; }
    window.JSH_STAGE.state = st; }
  window.JSH_STAGE = { state: 'none', audit: null, sync: () => { last = ''; sync(); } };
  function start(){ const mo = new MutationObserver(sync);
    mo.observe(D.body, { attributes: true, attributeFilter: ['class', 'style'], childList: true });
    mo.observe(H, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    addEventListener('hashchange', sync);
    if (MQ) { if (MQ.addEventListener) MQ.addEventListener('change', sync); else if (MQ.addListener) MQ.addListener(sync); }
    sync(); }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* stage:end */
