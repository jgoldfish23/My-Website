/* Ask the Hub (2026-10-27, Jamo: "Let's do something awesome with this app and really enhance it"): an AI sports analyst
   on every hub page (the site covers college football, the NFL and the NBA only, Jamo's call on 2026-10-27).
   A floating "Ask" button opens a chat (a bottom sheet on phones, a panel on the right on desktop).
   Each question goes to /api/ask (functions/api/ask.js in the site repo) with the last few turns and the visible text of
   the page (#view on the hubs, main#fd on the home page, the main column elsewhere), so answers can use the hub's own
   numbers; the server can also look up live scores, box scores, standings, polls and headlines. Answers are escaped and
   only **bold**, bullets, line breaks and links to djgolding.com pages are allowed back in.
   Stays clear of the BottomLine ticker (.jbl), its "Scores" pill and the NBA phone tab bar (#btab); hidden on full-screen
   boards, TV guides, the BYU game-day screen and NBA game night. Esc closes. The chat survives page changes in the same
   tab (sessionStorage) for three hours.
   ?askdemo=1 fakes the answers so the look can be checked without the API (askdemo=slow / 429 / 502 / xss for the edge cases).
   Loaded on every page by one tag in sports-hub/hubbar.html; published as /sports/ask.js by sports-hub/build.sh. */
(function () {
  if (window.__jshAsk) return; window.__jshAsk = 1;
  const d = document;
  const ON_SITE = /(^|\.)djgolding\.com$/.test(location.hostname);
  const API = (ON_SITE ? '' : 'https://djgolding.com') + '/api/ask';
  let DEMO = null; try { DEMO = new URLSearchParams(location.search).get('askdemo'); } catch (e) {}
  const segs = location.pathname.split('/').filter(Boolean);
  const HUB = segs[segs.indexOf('sports') + 1] === 'articles' && segs.indexOf('sports') >= 0 ? 'articles' : (segs.find(s => ['cfb', 'nfl', 'nba', 'sports'].indexOf(s) >= 0) || 'sports');
  const PAGE_MAX = 12000, KEEP = 16, SEND_TURNS = 8, STORE = 'jsh-ask-v1', STORE_TTL = 3 * 3600e3;

  const css = `
.jask-fab{position:fixed;z-index:70;right:calc(16px + env(safe-area-inset-right,0px));bottom:var(--jask-b,calc(16px + env(safe-area-inset-bottom,0px)));display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 17px 0 13px;border:0;border-radius:999px;color:#fff;background:linear-gradient(135deg,#2d5bff 0%,#6a4dff 55%,#a24dff 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),inset 0 1px 0 rgba(255,255,255,.3),0 14px 30px -12px rgba(80,90,255,.95),0 0 26px -8px rgba(124,182,255,.7);font:800 14px/1 "Inter Tight",Inter,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.01em;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease}
.jask-fab:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),inset 0 1px 0 rgba(255,255,255,.3),0 18px 36px -12px rgba(80,90,255,1),0 0 32px -6px rgba(124,182,255,.85)}
.jask-fab:focus-visible{outline:2px solid #9cc6ff;outline-offset:3px}
.jask-fab svg{width:19px;height:19px;flex:none}
.jask-fab[hidden],.jask[hidden]{display:none!important}
.jask-fab.on{opacity:0;pointer-events:none;transform:scale(.92)}
.jask{--k-bg:rgba(9,12,22,.95);--k-bg2:rgba(255,255,255,.055);--k-ink:#eef2f8;--k-ink2:#aab4c6;--k-ink3:#7a869c;--k-edge:rgba(255,255,255,.1);--k-hud:#7cb6ff;position:fixed;z-index:95;right:calc(16px + env(safe-area-inset-right,0px));bottom:var(--jask-b,calc(16px + env(safe-area-inset-bottom,0px)));width:410px;max-width:calc(100vw - 32px);height:min(660px,calc(100vh - var(--jask-b,16px) - 70px));min-height:300px;display:flex;flex-direction:column;box-sizing:border-box;color:var(--k-ink);background-color:var(--k-bg);background-image:radial-gradient(440px 230px at 0% 0%,rgba(59,123,255,.2),transparent 65%),radial-gradient(400px 250px at 100% 0%,rgba(164,91,255,.17),transparent 65%);border:1px solid rgba(140,170,255,.24);border-radius:22px;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 34px 80px -30px rgba(0,0,0,.95),0 0 40px -18px rgba(80,110,255,.6);-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3);font:400 15px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left;overflow:hidden;-webkit-text-size-adjust:100%;text-size-adjust:100%;animation:jaskIn .2s ease}
.jask *,.jask *::before,.jask *::after{box-sizing:border-box}
.jask button{font-family:inherit}
.jask-hd{flex:none;position:relative;display:flex;align-items:center;gap:11px;padding:14px 10px 12px 16px;border-bottom:1px solid var(--k-edge)}
.jask-hd::after{content:"";position:absolute;left:16px;right:16px;bottom:-1px;height:1px;background:linear-gradient(90deg,rgba(124,182,255,.7),rgba(196,166,255,.35) 45%,transparent 90%)}
.jask-orb{flex:none;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#2d5bff,#a24dff);box-shadow:0 0 20px -4px rgba(124,140,255,.95),inset 0 1px 0 rgba(255,255,255,.3)}
.jask-orb svg{width:18px;height:18px}
.jask-tt{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.jask-tt small{font:700 9.5px/1 Orbitron,"Inter Tight",Inter,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--k-hud)}
.jask-tt b{font:800 16px/1.1 "Inter Tight",Inter,sans-serif;letter-spacing:-.015em;color:var(--k-ink)}
.jask-ib{flex:none;width:36px;height:36px;display:grid;place-items:center;padding:0;border:1px solid transparent;border-radius:11px;background:transparent;color:var(--k-ink2);cursor:pointer;-webkit-tap-highlight-color:transparent}
.jask-ib:hover{color:var(--k-ink);background:var(--k-bg2);border-color:var(--k-edge)}
.jask-ib:focus-visible,.jask-chip:focus-visible,.jask-send:focus-visible,.jask-retry:focus-visible{outline:2px solid var(--k-hud);outline-offset:2px}
.jask-ib svg{width:18px;height:18px}
.jask-log{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}
.jask-hi{padding:14px 15px;border-radius:16px;background:var(--k-bg2);border:1px solid var(--k-edge)}
.jask-hi b{display:block;margin-bottom:4px;font:800 15px/1.25 "Inter Tight",Inter,sans-serif;color:var(--k-ink)}
.jask-hi p{margin:0;color:var(--k-ink2);font-size:13.5px;line-height:1.45}
.jask-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.jask-chip{display:inline-flex;align-items:center;max-width:100%;padding:8px 12px;border-radius:999px;border:1px solid rgba(140,170,255,.3);background:rgba(124,182,255,.09);color:var(--k-ink);font:600 13px/1.25 Inter,system-ui,sans-serif;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:border-color .15s,background .15s}
.jask-chip:hover{border-color:rgba(140,180,255,.6);background:rgba(124,182,255,.16)}
.jask-m{max-width:88%;padding:10px 13px;border-radius:16px;font-size:14.5px;line-height:1.5;overflow-wrap:anywhere;word-break:normal}
.jask-m.me{align-self:flex-end;color:#fff;background:linear-gradient(135deg,#2d5bff,#7a4dff);border-bottom-right-radius:6px;box-shadow:0 10px 24px -14px rgba(80,90,255,.9);white-space:pre-wrap}
.jask-m.ai{align-self:flex-start;background:var(--k-bg2);border:1px solid var(--k-edge);border-bottom-left-radius:6px;color:var(--k-ink)}
.jask-m.ai p{margin:0 0 7px}.jask-m.ai p:last-child,.jask-m.ai ul:last-child{margin-bottom:0}
.jask-m.ai ul{margin:2px 0 7px;padding-left:18px}.jask-m.ai li{margin:3px 0}.jask-m.ai li::marker{color:var(--k-hud)}
.jask-m.ai b{font-weight:750;color:var(--k-ink)}
.jask-m.ai a{color:var(--k-hud);text-decoration:underline;text-underline-offset:2px;font-weight:600}
.jask-src{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-top:9px;padding-top:8px;border-top:1px dashed var(--k-edge);font-size:11px;color:var(--k-ink3)}
.jask-src span{padding:2px 8px;border-radius:999px;background:rgba(124,182,255,.1);color:var(--k-ink2);font-weight:600}
.jask-m.err{border-color:rgba(255,90,110,.4);background:rgba(255,77,106,.09)}
.jask-retry{margin-top:8px;padding:6px 12px;border-radius:999px;border:1px solid var(--k-edge);background:transparent;color:var(--k-ink);font:700 12.5px/1 Inter,sans-serif;cursor:pointer}
.jask-wait{display:flex;align-items:center;gap:10px;color:var(--k-ink2);font-size:13px}
.jask-dots{display:inline-flex;gap:4px}.jask-dots i{width:6px;height:6px;border-radius:50%;background:var(--k-hud);animation:jaskDot 1.1s infinite ease-in-out}
.jask-dots i:nth-child(2){animation-delay:.15s}.jask-dots i:nth-child(3){animation-delay:.3s}
.jask-in{flex:none;display:flex;align-items:flex-end;gap:8px;margin:0;padding:10px 12px;border-top:1px solid var(--k-edge);background:rgba(0,0,0,.2)}
.jask-in textarea{flex:1;min-width:0;display:block;height:46px;max-height:124px;margin:0;padding:12px 14px;resize:none;border-radius:14px;border:1px solid var(--k-edge);background:rgba(255,255,255,.06);color:var(--k-ink);font:400 16px/1.35 Inter,system-ui,-apple-system,sans-serif;outline:none;-webkit-appearance:none;appearance:none;box-shadow:none}
.jask-in textarea::placeholder{color:var(--k-ink3)}
.jask-in textarea:focus{border-color:rgba(124,182,255,.65);box-shadow:0 0 0 3px rgba(124,182,255,.18)}
.jask-send{flex:none;width:46px;height:46px;display:grid;place-items:center;padding:0;border:0;border-radius:14px;color:#fff;background:linear-gradient(135deg,#2d5bff,#8a4dff);box-shadow:0 8px 20px -10px rgba(90,100,255,.95);cursor:pointer;-webkit-tap-highlight-color:transparent}
.jask-send svg{width:19px;height:19px}
.jask-send:disabled{opacity:.4;cursor:default;box-shadow:none}
.jask-ft{flex:none;margin:0;padding:0 14px 10px;background:rgba(0,0,0,.2);font-size:10.5px;line-height:1.3;color:var(--k-ink3);text-align:center}
.jask.flush .jask-ft{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}
.jask-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.jask.jask-light{--k-bg:rgba(255,255,255,.97);--k-bg2:#f2f5fb;--k-ink:#0d1220;--k-ink2:#465166;--k-ink3:#7b8598;--k-edge:#dde2ea;--k-hud:#1d5fd8;background-image:radial-gradient(440px 230px at 0% 0%,rgba(59,123,255,.1),transparent 65%),radial-gradient(400px 250px at 100% 0%,rgba(164,91,255,.08),transparent 65%);border-color:#d3dbea;box-shadow:0 26px 60px -28px rgba(15,23,42,.38)}
.jask.jask-light .jask-in,.jask.jask-light .jask-ft{background:#f6f8fc}
.jask.jask-light .jask-in textarea{background:#fff}
.jask.jask-light .jask-chip{background:#eef3ff;border-color:#cbd8f5}
.jask.jask-light .jask-src span{background:#e9f0fd}
@keyframes jaskIn{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
@keyframes jaskDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@media (max-width:640px){
  .jask-fab{height:42px;padding:0 15px 0 12px;right:calc(12px + env(safe-area-inset-right,0px))}
  .jask{left:0;right:0;width:auto;max-width:none;bottom:var(--jask-p,0px);height:min(80vh,calc(100vh - var(--jask-p,0px) - 56px));min-height:260px;border-radius:22px 22px 0 0;border-left:0;border-right:0;border-bottom:0;padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px);animation-name:jaskUp}
  .jask-hd{padding-top:18px}
  .jask-hd::before{content:"";position:absolute;top:7px;left:50%;width:38px;height:4px;margin-left:-19px;border-radius:4px;background:var(--k-edge)}
  .jask-m{max-width:92%}
}
@supports (height:100dvh){@media (max-width:640px){.jask{height:min(80dvh,calc(100dvh - var(--jask-p,0px) - 56px))}}}
@keyframes jaskUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.jask,.jask-fab{animation:none;transition:none}.jask-dots i{animation:none;opacity:.7}}
@media print{.jask,.jask-fab{display:none!important}}
`;
  const st = d.createElement('style'); st.id = 'jask-css'; st.textContent = css; d.head.appendChild(st);

  const ICON = {
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.6L18.5 9.4 13.8 11.2 12 16l-1.8-4.8L5.5 9.4l4.7-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="M13 6l6 6-6 6"/></svg>',
  };

  // ---------- markup ----------
  const fab = d.createElement('button');
  fab.type = 'button'; fab.className = 'jask-fab'; fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'jask-panel');
  fab.title = 'Ask the Hub'; fab.innerHTML = ICON.spark + '<span>Ask</span>';
  const panel = d.createElement('section');
  panel.className = 'jask'; panel.id = 'jask-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'jask-title');
  panel.innerHTML =
    '<div class="jask-hd"><span class="jask-orb">' + ICON.spark + '</span><div class="jask-tt"><small>AI analyst</small><b id="jask-title">Ask the Hub</b></div>' +
    '<button type="button" class="jask-ib jask-new" title="Start a new chat" aria-label="Start a new chat">' + ICON.redo + '</button>' +
    '<button type="button" class="jask-ib jask-x" title="Close (Esc)" aria-label="Close">' + ICON.x + '</button></div>' +
    '<div class="jask-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
    '<form class="jask-in" autocomplete="off"><label class="jask-sr" for="jask-q">Your question</label>' +
    '<textarea id="jask-q" rows="1" maxlength="500" enterkeyhint="send" placeholder="Ask about this page or a game"></textarea>' +
    '<button type="submit" class="jask-send" aria-label="Send" title="Send">' + ICON.send + '</button></form>' +
    '<p class="jask-ft">Answers use this page and live scores. AI can get things wrong.</p>';
  const log = panel.querySelector('.jask-log'), form = panel.querySelector('.jask-in'), input = panel.querySelector('textarea'), send = panel.querySelector('.jask-send');

  // ---------- helpers ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
  const store = (v) => { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(STORE) || 'null'); if (v === null) sessionStorage.removeItem(STORE); else sessionStorage.setItem(STORE, JSON.stringify(v)); } catch (e) { return null; } };
  const isPhone = () => window.matchMedia('(max-width:640px)').matches;
  const fine = () => window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // only links back into this site survive; everything else shows as plain text
  function safeHref(u) {
    u = String(u).replace(/&#38;/g, '&').trim();
    if (/^\/(?!\/)[^\s"<>\\]*$/.test(u)) return u;
    if (/^https:\/\/(www\.)?djgolding\.com(\/[^\s"<>\\]*)?$/i.test(u)) return u;
    return null;
  }
  function inline(t) {
    let h = esc(t);
    // no * in a link target, so the bold pass below can never land inside an href
    h = h.replace(/\[([^\]\n]{1,160})\]\(([^)\s*]{1,400})\)/g, (all, txt, url) => { const u = safeHref(url); return u ? '<a href="' + esc(u) + '">' + txt + '</a>' : txt; });
    h = h.replace(/\*\*([^*\n]{1,240})\*\*/g, '<b>$1</b>').replace(/\*\*/g, '');
    return h;
  }
  function md(s) {
    const out = []; let list = null;
    String(s || '').replace(/\r/g, '').split('\n').forEach(line => {
      const m = /^\s*(?:[-*•]|\d{1,2}[.)])\s+(.+)$/.exec(line);
      if (m) { (list = list || []).push('<li>' + inline(m[1]) + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      const t = line.trim().replace(/^#{1,4}\s+/, '');
      if (t) out.push('<p>' + inline(t) + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }

  // ---------- what the page says (the hub's own numbers live only here) ----------
  const SKIP = '.jsh,.jbl,.jbl-pill,.jask,.jask-fab,.btab,#btab,.bsheet,script,style,noscript,template';
  const tidy = s => String(s || '').replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
  function textOf(el) { return el && !el.matches(SKIP) ? (el.innerText || '') : ''; }
  function pageRoot() { return d.getElementById('view') || d.querySelector('main') || null; }
  function onScreen(root) {
    let box = root;
    for (let i = 0; i < 4 && box.children.length === 1; i++) box = box.children[0];
    const vh = window.innerHeight, parts = [];
    [].forEach.call(box.children, el => { if (el.matches(SKIP)) return; const r = el.getBoundingClientRect(); if (r.height && r.bottom > 0 && r.top < vh) parts.push(el.innerText || ''); });
    return tidy(parts.join('\n'));
  }
  function readPage() {
    const root = pageRoot();
    let full = root ? textOf(root) : [].filter.call(d.body.children, el => !el.matches(SKIP) && el.getClientRects().length).map(textOf).join('\n');
    full = tidy(full);
    if (full.length > PAGE_MAX) {
      // too long to send whole: what is on screen now, then the top of the page
      const screen = onScreen(root || d.body).slice(0, 5000);
      full = (screen ? '[On screen now]\n' + screen + '\n[The page from the top]\n' : '') + full.slice(0, PAGE_MAX - screen.length - 60);
    }
    return { hub: HUB, path: location.pathname.slice(0, 120), route: (location.hash || '').slice(0, 200), title: (d.title || '').slice(0, 200), text: full.slice(0, PAGE_MAX) };
  }

  // ---------- starter questions that fit the page ----------
  function starters() {
    const r = ((location.hash || '').toLowerCase().match(/^#\/([a-z]+)/) || [])[1] || '';
    const TEAM = { cfb: 'BYU', nfl: 'the Eagles', nba: 'the Jazz' }[HUB] || 'my teams';
    if (r === 'game') return ['What’s the story of this game?', 'Who’s made the biggest difference?', 'What should I watch for?'];
    if (/^(team|schedule|my|uniforms)$/.test(r)) return ['How has this team looked lately?', 'Who are their best players right now?', 'What’s the toughest game left?'];
    if (/^(standings|rankings|playoff|playoffs|scenarios|cup|lines)$/.test(r)) return ['Explain what I’m looking at here', HUB === 'cfb' ? 'What does BYU need to make the playoff?' : 'Where do ' + TEAM + ' stand?', 'Who’s rising and who’s slipping?'];
    if (/^(players|player|compare|leaders|stats|draft|transfers|recruiting)$/.test(r)) return ['Who stands out on this page?', 'Explain these numbers in plain English', HUB === 'nba' ? 'Who’s been the Jazz’s best player this week?' : HUB === 'nfl' ? 'Who’s been the Eagles’ best playmaker?' : 'Who’s been the best player this week?'];
    if (/^(previews|digest|review|column)$/.test(r)) return ['Sum this up in three bullets', 'What’s the biggest takeaway here?', 'What should I watch for next?'];
    return ({
      sports: ['What should I watch tonight?', 'How did my teams do this week?', 'Any big news on my teams?'],
      cfb: ['What does BYU need to make the playoff?', 'Which games matter most this week?', 'How has BYU looked lately?'],
      nfl: ['How are the Eagles doing?', 'Which games matter most this week?', 'Who’s been the Eagles’ best playmaker?'],
      nba: ['Who’s been the Jazz’s best player this week?', 'Is any game tonight worth watching?', 'Where do the Jazz stand in the West?'],
      articles: ['What’s the newest article about?', 'Sum up the latest BYU piece', 'What’s coming up for my teams?'],
    })[HUB] || ['What should I watch tonight?', 'How did my teams do this week?', 'Any big news on my teams?'];
  }

  // ---------- conversation ----------
  let msgs = [], busy = false, waitTimer = null;
  (function restore() { const s = store(); if (s && s.v === 1 && Array.isArray(s.msgs) && Date.now() - (s.t || 0) < STORE_TTL) msgs = s.msgs.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string').slice(-KEEP); })();
  if (msgs.length % 2) msgs.pop(); // only whole question-and-answer pairs
  const save = () => store(msgs.length ? { v: 1, t: Date.now(), msgs: msgs.slice(-KEEP) } : null);

  function bubble(m) {
    const el = d.createElement('div');
    if (m.role === 'user') { el.className = 'jask-m me'; el.textContent = m.text; return el; }
    el.className = 'jask-m ai'; el.innerHTML = md(m.text);
    if (m.used && m.used.length) {
      const src = d.createElement('div'); src.className = 'jask-src';
      src.innerHTML = 'Looked up: ' + m.used.slice(0, 6).map(u => '<span>' + esc(u) + '</span>').join('');
      el.appendChild(src);
    }
    return el;
  }
  function hello() {
    const el = d.createElement('div'); el.className = 'jask-hi';
    el.innerHTML = '<b>What do you want to know?</b><p>I read what’s on this page and can check live scores, box scores, standings, polls and headlines for college football, the NFL and the NBA.</p><div class="jask-chips"></div>';
    const box = el.querySelector('.jask-chips');
    starters().forEach(q => { const b = d.createElement('button'); b.type = 'button'; b.className = 'jask-chip'; b.textContent = q; b.addEventListener('click', () => ask(q)); box.appendChild(b); });
    return el;
  }
  function render() {
    log.textContent = '';
    if (!msgs.length) log.appendChild(hello());
    msgs.forEach(m => log.appendChild(bubble(m)));
    scrollDown();
  }
  function scrollDown() { requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }

  function history() {
    // whole pairs only, newest last, inside the server's caps (8 turns, 3,000 characters an answer, 10,000 in all; 8,500 here for headroom)
    const pairs = [];
    for (let i = 0; i + 1 < msgs.length; i += 2) if (msgs[i].role === 'user' && msgs[i + 1].role === 'assistant') pairs.push([msgs[i], msgs[i + 1]]);
    let out = pairs.slice(-SEND_TURNS / 2).map(([q, a]) => [{ role: 'user', content: q.text.slice(0, 1000) }, { role: 'assistant', content: a.text.slice(0, 2900) }]);
    const size = () => out.reduce((n, p) => n + p[0].content.length + p[1].content.length, 0);
    while (out.length && size() > 8500) out.shift();
    return [].concat.apply([], out);
  }

  const FRIENDLY = { 400: 'That question didn’t come through right. Try asking it again.', 403: 'Ask the Hub only works on djgolding.com.', 413: 'That was too much to send at once. Try a shorter question.', 429: 'That’s a lot of questions. Give it a little while and try again.', 503: 'Ask the Hub isn’t switched on yet.' };
  async function callApi(body) {
    if (DEMO) return demo(body);
    const ctl = 'AbortController' in window ? new AbortController() : null;
    // the server's slowest path (lookups plus a last answer round) ends near 82 s
    const tm = setTimeout(() => ctl && ctl.abort(), 90000);
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined, credentials: 'same-origin' });
      let j = null; try { j = await r.json(); } catch (e) {}
      if (r.ok && j && typeof j.text === 'string' && j.text.trim()) return { ok: true, text: j.text, used: Array.isArray(j.used) ? j.used.filter(u => typeof u === 'string') : [] };
      return { ok: false, msg: (j && typeof j.message === 'string' && j.message) || FRIENDLY[r.status] || 'The hub’s analyst can’t answer right now. Try again in a minute.' };
    } catch (e) {
      return { ok: false, msg: e && e.name === 'AbortError' ? 'That took too long. Try again in a minute.' : 'Couldn’t reach the hub. Check your connection and try again.' };
    } finally { clearTimeout(tm); }
  }

  function waiting() {
    const el = d.createElement('div'); el.className = 'jask-m ai jask-wait';
    el.innerHTML = '<span class="jask-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="jask-wt">Reading this page…</span>';
    const t = el.querySelector('.jask-wt'), steps = ['Checking live scores and stats…', 'Putting it together…', 'Still working on it…'];
    let i = 0; waitTimer = setInterval(() => { if (i < steps.length) t.textContent = steps[i++]; }, 3200);
    return el;
  }

  async function ask(q) {
    q = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 500);
    if (!q || busy) return;
    busy = true; send.disabled = true; input.value = ''; grow();
    const hi = log.querySelector('.jask-hi'); if (hi) hi.remove();
    log.querySelectorAll('.jask-m.err').forEach(e => e.remove());
    log.appendChild(bubble({ role: 'user', text: q }));
    const wait = waiting(); log.appendChild(wait); scrollDown();
    const body = { messages: history().concat([{ role: 'user', content: q }]), page: readPage() };
    // stay under the server's 40 KB limit, giving up page text first
    try { while (new Blob([JSON.stringify(body)]).size > 38000 && body.page.text.length > 1500) body.page.text = body.page.text.slice(0, Math.floor(body.page.text.length * 0.8)); } catch (e) {}
    const res = await callApi(body);
    clearInterval(waitTimer); wait.remove();
    if (res.ok) {
      msgs.push({ role: 'user', text: q }, { role: 'assistant', text: res.text, used: res.used });
      msgs = msgs.slice(-KEEP); save();
      log.appendChild(bubble(msgs[msgs.length - 1]));
    } else {
      // the question stays on screen with the error, but out of the history that goes back to the server
      const err = d.createElement('div'); err.className = 'jask-m ai err'; err.setAttribute('role', 'alert');
      err.innerHTML = '<p>' + esc(res.msg) + '</p>';
      const again = d.createElement('button'); again.type = 'button'; again.className = 'jask-retry'; again.textContent = 'Try again';
      again.addEventListener('click', () => { err.previousElementSibling && err.previousElementSibling.classList.contains('me') && err.previousElementSibling.remove(); err.remove(); ask(q); });
      err.appendChild(again); log.appendChild(err);
    }
    busy = false; send.disabled = !input.value.trim(); scrollDown();
    if (fine() && !panel.hidden) input.focus();
  }

  // ---------- ?askdemo=1: canned answers to check the look without the API ----------
  function demo(body) {
    const q = body.messages[body.messages.length - 1].content, p = body.page;
    const wait = DEMO === 'slow' ? 9000 : 900;
    return new Promise(res => setTimeout(() => {
      if (DEMO === '429') return res({ ok: false, msg: 'That’s a lot of questions for one hour. Try again in about 12 minutes.' });
      if (DEMO === '502') return res({ ok: false, msg: 'The hub’s analyst can’t answer right now. Try again in a minute.' });
      let text = '**Demo answer** (no AI was asked). You said: “' + q.slice(0, 80) + '”\n' +
        'Here’s how a real answer reads, short and sourced:\n' +
        '- From this page: **' + (p.title || 'this page').slice(0, 60) + '**, ' + p.text.length.toLocaleString() + ' characters of page text sent.\n' +
        '- Live numbers would come from tonight’s scoreboard or a box score.\n' +
        '- Links stay on the site, like [the ' + (HUB === 'sports' ? 'home page' : HUB.toUpperCase() + ' hub') + '](/' + (HUB === 'articles' ? 'sports/articles' : HUB) + '/).\n' +
        'Ask another one to see the layout again.';
      if (DEMO === 'xss') text += '\n<img src=x onerror="window.__jaskXss=1"> [bad link](javascript:window.__jaskXss=1) [other site](https://example.com/x) **bold <script>window.__jaskXss=1</script>**';
      res({ ok: true, text, used: ['this page', 'today’s NBA scores (demo)'] });
    }, wait));
  }

  // ---------- open, close, placement ----------
  function isLight() {
    const r = d.documentElement;
    if (HUB === 'sports' || HUB === 'articles') return r.classList.contains('light');
    const t = r.getAttribute('data-theme');
    return t === 'light' || (t !== 'dark' && window.matchMedia('(prefers-color-scheme: light)').matches);
  }
  function theme() { panel.classList.toggle('jask-light', isLight()); }
  // full-screen modes (boards, TV guides, the BYU game-day screen, NBA game night) stay clean
  const blocked = () => d.body.classList.contains('boardmode') || /^#\/(board|tv|gameday|gamenight)(\/|$)/i.test(location.hash || '');
  // how much of the bottom edge the ticker, its pill, the phone tab bar and the players page compare bar take up (they can stack)
  function docked() {
    const vh = window.innerHeight, els = [];
    d.querySelectorAll('.jbl,.jbl-pill,.btab,#btab,.pl-cbar').forEach(el => { if (el.hidden || panel.contains(el)) return; const r = el.getBoundingClientRect(); if (r.width && r.height && r.top < vh) els.push(r); });
    els.sort((a, b) => b.bottom - a.bottom);
    let b = 0;
    els.forEach(r => { if (r.bottom >= vh - b - 40) b = Math.max(b, vh - r.top); });
    return Math.round(b);
  }
  let lastB = -1, lastHide = null;
  // the button stays out of sight until the site has its AI key (GET /api/ask says; remembered for 10 minutes)
  let READY = !!DEMO;
  function place() {
    const hide = blocked() || !READY;
    if (hide !== lastHide) { lastHide = hide; fab.hidden = hide; if (hide && !panel.hidden) close(); }
    const b = docked();
    if (b === lastB) return; lastB = b;
    [fab, panel].forEach(el => { if (b) el.style.setProperty('--jask-b', (b + 12) + 'px'); else el.style.removeProperty('--jask-b'); });
    panel.style.setProperty('--jask-p', b + 'px');
    panel.classList.toggle('flush', !b);
  }
  // iPhone keyboard: keep the sheet sitting on top of it
  function fitKeyboard() {
    const vv = window.visualViewport;
    if (!vv || panel.hidden || !isPhone()) { panel.style.removeProperty('bottom'); panel.style.removeProperty('height'); return; }
    const kb = window.innerHeight - (vv.height + vv.offsetTop);
    if (kb > 80) { panel.style.bottom = kb + 'px'; panel.style.height = Math.max(240, Math.min(vv.height - 8, window.innerHeight * 0.8)) + 'px'; }
    else { panel.style.removeProperty('bottom'); panel.style.removeProperty('height'); }
  }
  function open() {
    if (blocked()) return;
    theme(); lastB = -1; place();
    if (!busy) render(); // mid-answer, keep the question and the dots on screen
    panel.hidden = false; fab.classList.add('on'); fab.setAttribute('aria-expanded', 'true');
    if (fine()) setTimeout(() => input.focus(), 30);
    else panel.querySelector('.jask-x').focus({ preventScroll: true });
  }
  function close() {
    if (panel.hidden) return;
    panel.hidden = true; fab.classList.remove('on'); fab.setAttribute('aria-expanded', 'false');
    fitKeyboard();
    if (panel.contains(d.activeElement) || d.activeElement === d.body) fab.focus({ preventScroll: true });
  }
  function grow() { input.style.height = 'auto'; input.style.height = Math.min(124, Math.max(46, input.scrollHeight + 2)) + 'px'; }

  fab.addEventListener('click', () => (panel.hidden ? open() : close()));
  panel.querySelector('.jask-x').addEventListener('click', close);
  panel.querySelector('.jask-new').addEventListener('click', () => { if (busy) return; msgs = []; save(); render(); if (fine()) input.focus(); });
  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  input.addEventListener('input', () => { grow(); send.disabled = busy || !input.value.trim(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); close(); } });
  // a link in an answer to another hub page: on phones, close the sheet so the page shows
  log.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if (a && isPhone()) close(); });
  window.addEventListener('resize', () => { place(); fitKeyboard(); });
  window.addEventListener('hashchange', () => { place(); if (!panel.hidden && !msgs.length && !busy) render(); });
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitKeyboard); window.visualViewport.addEventListener('scroll', fitKeyboard); }
  try { window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', theme); } catch (e) {}

  function start() {
    d.body.appendChild(fab); d.body.appendChild(panel);
    send.disabled = true; place();
    if (!READY) {
      let c = null; try { c = JSON.parse(sessionStorage.getItem('jask-ready') || 'null'); } catch (e) {}
      const set = (v) => { READY = !!v; lastHide = null; place(); };
      if (c && Date.now() - c.t < 600000) set(c.v);
      else fetch(API, { method: 'GET' }).then(r => r.ok ? r.json() : null).then(j => { const v = !!(j && j.ready); try { sessionStorage.setItem('jask-ready', JSON.stringify({ v, t: Date.now() })); } catch (e) {} set(v); }).catch(() => {});
    }
    // the ticker, its pill and the NBA tab bar come and go: re-place on body changes, and every couple of seconds as a backstop
    try {
      new MutationObserver(place).observe(d.body, { attributes: true, attributeFilter: ['class'], childList: true });
      new MutationObserver(theme).observe(d.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    } catch (e) {}
    setInterval(() => { if (!d.hidden) place(); }, 2000);
  }
  if (d.body) start(); else d.addEventListener('DOMContentLoaded', start);
})();
