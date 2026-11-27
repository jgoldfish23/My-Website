/* holiday:start - a still seasonal layer on every page (2026-11-26).
   Thanksgiving is the fourth Thursday of November. The next morning through December 26 is Christmas.
   After that the hub looks normal again. The date is the hub's own time zone (America/Denver when none is saved).
   ?hol=thanks, ?hol=xmas or ?hol=off overrides the date, for a look at the other theme.
   No beams, grids, or photos. Thanksgiving keeps the animated phrase. The art fades into the field.
   Reduced-motion users get the same still layer. */
(function () {
  if (window.__jshHoliday) return; window.__jshHoliday = true;
  var D = document, H = D.documentElement, W = window;
  var ZONES = { ET: 'America/New_York', CT: 'America/Chicago', MT: 'America/Denver', PT: 'America/Los_Angeles' };

  function zone() {
    var tz = 'MT';
    try { tz = (JSON.parse(localStorage.getItem('jsh-shared') || '{}') || {}).tz || 'MT'; } catch (e) {}
    return ZONES[tz] || ZONES.MT;
  }
  function today() {
    var y, m, d, h = 0;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: zone(), year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (p) {
        if (p.type === 'hour') h = +p.value % 24;
        if (p.type === 'year') y = +p.value;
        if (p.type === 'month') m = +p.value;
        if (p.type === 'day') d = +p.value;
      });
    } catch (e) {
      var n = new Date(); y = n.getFullYear(); m = n.getMonth() + 1; d = n.getDate(); h = n.getHours();
    }
    return { y: y, m: m, d: d, h: h };
  }
  /* Fourth Thursday of November, as a day-of-month. */
  function thanksgivingDay(y) {
    var dow = new Date(y, 10, 1).getDay();
    var firstThu = dow <= 4 ? 1 + (4 - dow) : 1 + (11 - dow);
    return firstThu + 21;
  }
  function which(t) {
    var q = '';
    try { q = (new URLSearchParams(location.search).get('hol') || '').toLowerCase(); } catch (e) {}
    if (q === 'off' || q === 'none') return '';
    if (q === 'thanks' || q === 'thanksgiving') return 'thanks';
    if (q === 'xmas' || q === 'christmas') return 'xmas';
    if (!t || !t.y) return '';
    /* 11-26 (Jamo, "Christmas theme now!!"): Thanksgiving runs until 5 PM on the day, then Christmas takes over */
    if (t.m === 11 && t.d === thanksgivingDay(t.y)) return t.h >= 17 ? 'xmas' : 'thanks';
    if (t.m === 11 && t.d > thanksgivingDay(t.y)) return 'xmas';
    if (t.m === 12 && t.d <= 26) return 'xmas';
    return '';
  }

  var kind = which(today());
  if (!kind) return;

  H.classList.add(kind === 'thanks' ? 'jsh-thanks' : 'jsh-xmas');
  H.dataset.jshHol = kind;

  /* The night wash and the team stage both paint body::before. These rules come later and use
     !important so the holiday field covers the phone, the home page, Live, and every hub. */
  var fieldT = 'radial-gradient(90% 46% at 50% -10%,rgba(240,170,60,.55),transparent 58%),radial-gradient(48% 36% at 100% 100%,rgba(150,48,16,.5),transparent 70%),radial-gradient(42% 32% at 0% 100%,rgba(110,42,12,.4),transparent 70%),linear-gradient(180deg,#4a2a12 0%,#24160c 46%,#140e09 100%)';
  var fieldTl = 'radial-gradient(90% 46% at 50% -8%,rgba(214,140,46,.45),transparent 60%),radial-gradient(50% 40% at 100% 100%,rgba(180,84,32,.22),transparent 70%),linear-gradient(180deg,#f8e6c8 0%,#f3d7ae 48%,#edd0b0 100%)';
  var fieldX = 'radial-gradient(70% 42% at 0% -8%,rgba(36,150,90,.55),transparent 60%),radial-gradient(60% 40% at 100% 0%,rgba(176,28,48,.5),transparent 62%),radial-gradient(50% 32% at 50% 110%,rgba(212,168,64,.28),transparent 70%),linear-gradient(180deg,#0d3d2a 0%,#07140f 48%,#1a0c10 100%)';
  var fieldXl = 'radial-gradient(70% 42% at 0% -8%,rgba(22,130,78,.28),transparent 62%),radial-gradient(56% 36% at 100% 0%,rgba(176,32,48,.16),transparent 64%),linear-gradient(180deg,#e5f6ee 0%,#f7e8ea 55%,#e7f3ec 100%)';
  var css = ''
    + 'html.jsh-thanks,html.jsh-thanks body{background:' + fieldT + '!important;background-color:#140e09!important}'
    + 'html.jsh-thanks.light,html.jsh-thanks.light body,html.jsh-thanks[data-theme="light"],html.jsh-thanks[data-theme="light"] body{background:' + fieldTl + '!important;background-color:#f6e4c4!important}'
    + 'html.jsh-xmas,html.jsh-xmas body{background:' + fieldX + '!important;background-color:#071410!important}'
    + 'html.jsh-xmas.light,html.jsh-xmas.light body,html.jsh-xmas[data-theme="light"],html.jsh-xmas[data-theme="light"] body{background:' + fieldXl + '!important;background-color:#e7f3ec!important}'
    + 'html.jsh-thanks body::before,html.jsh-thanks.jsh-night body::before,html.jsh-thanks.jsh-home-night body::before,html.jsh-thanks.jsh-stg body::before{background:' + fieldT + '!important;opacity:1!important}'
    + 'html.jsh-thanks.light body::before,html.jsh-thanks[data-theme="light"] body::before{background:' + fieldTl + '!important}'
    + 'html.jsh-xmas body::before,html.jsh-xmas.jsh-night body::before,html.jsh-xmas.jsh-home-night body::before,html.jsh-xmas.jsh-stg body::before{background:' + fieldX + '!important;opacity:1!important}'
    + 'html.jsh-xmas.light body::before,html.jsh-xmas[data-theme="light"] body::before{background:' + fieldXl + '!important}'
    + '.jsh-hol-wash{position:fixed;inset:0;z-index:-1;pointer-events:none}'
    + 'html.jsh-thanks:not(.light):not([data-theme="light"]) .jsh-hol-wash{background:' + fieldT + '}'
    + 'html.jsh-thanks.light .jsh-hol-wash,html.jsh-thanks[data-theme="light"] .jsh-hol-wash{background:' + fieldTl + '}'
    + 'html.jsh-xmas:not(.light):not([data-theme="light"]) .jsh-hol-wash{background:' + fieldX + '}'
    + 'html.jsh-xmas.light .jsh-hol-wash,html.jsh-xmas[data-theme="light"] .jsh-hol-wash{background:' + fieldXl + '}'
    + '.jsh-hol-frame{position:fixed;inset:0;z-index:45;pointer-events:none}'
    + 'html.jsh-thanks .jsh-hol-frame{box-shadow:inset 0 0 120px rgba(180,80,16,.18)}'
    + 'html.jsh-xmas .jsh-hol-frame{box-shadow:inset 0 0 80px rgba(20,80,48,.22)}'
    + 'html.jsh-thanks .jsh,html.jsh-xmas .jsh{position:sticky;top:0;z-index:80}'
    + 'html.jsh-thanks .jsh{background:#2a160c!important;background-image:linear-gradient(180deg,#8a3e10,#2a160c 72%,rgba(74,42,18,0))!important;border-bottom-color:transparent!important;box-shadow:none!important}'
    + 'html.jsh-thanks .jsh-brand b{background:linear-gradient(90deg,#ffe08a,#f0a040);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + 'html.jsh-xmas .jsh{background:#071a12!important;background-image:linear-gradient(90deg,#0e6a40,#071a12 40%,#071a12 62%,#6e1824)!important;border-bottom-color:rgba(240,196,96,.4)!important}'
    + 'html.jsh-xmas .jsh-brand b{background:linear-gradient(90deg,#8cf0b4,#f0d060);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '.jsh-hol{position:relative;z-index:1;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:10px;min-height:0;padding:8px 16px 9px;font-family:"Inter Tight","Inter",system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;line-height:1.2;text-align:center}'
    + 'html.jsh-thanks .jsh-hol{flex-direction:column;position:relative;top:auto;color:#fff6e4;background:none;border-bottom:0;padding:2px 8px 0;gap:0}'
    + 'html.jsh-thanks .jsh-hol::before{content:"";position:absolute;left:50%;top:72%;width:min(420px,100vw);height:260px;transform:translate(-50%,-42%);background:radial-gradient(closest-side,rgba(255,186,80,.32),rgba(160,72,18,.1) 48%,transparent 76%);pointer-events:none;z-index:0}'
    + 'html.jsh-thanks.light .jsh-hol,html.jsh-thanks[data-theme="light"] .jsh-hol{color:#3a2412}'
    + 'html.jsh-thanks.light .jsh-hol::before,html.jsh-thanks[data-theme="light"] .jsh-hol::before{background:radial-gradient(closest-side,rgba(214,140,46,.34),rgba(248,210,150,.08) 60%,transparent 76%)}'
    + 'html.jsh-xmas .jsh-hol{color:#f4fff8;background:linear-gradient(90deg,#0c5a38,#8e1c2a 78%);border-bottom:1px solid #fbbf24}'
    + '.jsh-hol-slim .jsh-hol-art{display:none}html.jsh-thanks .jsh-hol.jsh-hol-slim{padding:7px 8px 8px}' /* 11-27: one line on hub pages - the art stays on home */
    + 'html.jsh-dk:is(.jsh-thanks,.jsh-xmas) .wordmark b{color:color-mix(in srgb,var(--accent-text,var(--accent,#7cb6ff)) 58%,#fff)}' /* 11-27: readable on the holiday header */
    + 'html.jsh-thanks .jsh-hol-k{position:relative;z-index:2;font-size:15px;font-weight:700;letter-spacing:.18em;background-image:linear-gradient(102deg,#fff4e0 0%,#fff4e0 14%,#8eebff 34%,#fff 48%,#c4b5fd 62%,#ffe08a 80%,#fff4e0 100%);background-size:320% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:jsh-hol-shoot 3.8s ease-in-out infinite alternate}'
    + 'html.jsh-thanks.light .jsh-hol-k,html.jsh-thanks[data-theme="light"] .jsh-hol-k{background-image:linear-gradient(102deg,#3a2412 0%,#3a2412 14%,#0e7490 34%,#1d4ed8 48%,#6d28d9 62%,#b45309 80%,#3a2412 100%)}'
    + '@keyframes jsh-hol-shoot{from{background-position:100% 0}to{background-position:0% 0}}'
    + '@media (prefers-reduced-motion:reduce){html.jsh-thanks .jsh-hol-k{animation:none;background:none;-webkit-text-fill-color:currentColor;color:inherit}}'
    + '.jsh-hol-art{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:center;margin-top:-2px}'
    + '.jsh-hol-art img{display:block;height:84px;width:auto;margin:0 -16px;filter:drop-shadow(0 14px 18px rgba(40,16,4,.18))}'
    + '.jsh-hol-art img:nth-child(1){height:98px;margin-bottom:-2px}'
    + '.jsh-hol-art img:nth-child(2){height:76px;margin-bottom:6px}'
    + '.jsh-hol-marks{display:flex;align-items:center;gap:16px}'
    + '.jsh-hol .mark{width:22px;height:22px;display:block}'
    + '.jsh-hol .g{stroke:#ffe7a8;fill:none;stroke-linecap:round;stroke-linejoin:round}'
    + '.jsh-hol .gd{fill:#ffe7a8;stroke:none}'
    + '.jsh-hol .w{stroke:#fff;fill:none;stroke-linecap:round;stroke-linejoin:round}'
    + 'html.jsh-thanks.light .jsh-hol .g,html.jsh-thanks[data-theme="light"] .jsh-hol .g,html.jsh-xmas.light .jsh-hol .g,html.jsh-xmas[data-theme="light"] .jsh-hol .g{stroke:#7a3e0c}'
    + 'html.jsh-thanks.light .jsh-hol .gd,html.jsh-thanks[data-theme="light"] .jsh-hol .gd,html.jsh-xmas.light .jsh-hol .gd,html.jsh-xmas[data-theme="light"] .jsh-hol .gd{fill:#7a3e0c}'
    + 'html.jsh-thanks.light .jsh-hol .w,html.jsh-thanks[data-theme="light"] .jsh-hol .w,html.jsh-xmas.light .jsh-hol .w,html.jsh-xmas[data-theme="light"] .jsh-hol .w{stroke:#3a2412}'
    + 'html.jsh-thanks:not(.light):not([data-theme="light"]) :is(header.top,.top:not(.sec)){background:#3a2212!important;color:#f8e7c4;border-bottom-color:rgba(240,186,96,.45)!important}'
    + 'html.jsh-xmas:not(.light):not([data-theme="light"]) :is(header.top,.top:not(.sec)){background:#0c2e22!important;color:#e7f6ee;border-bottom-color:rgba(240,196,96,.35)!important}'
    + 'html.jsh-thanks.light :is(header.top,.top:not(.sec)),html.jsh-thanks[data-theme="light"] :is(header.top,.top:not(.sec)){background:#f6e0bc!important;color:#3a2412;border-bottom-color:rgba(140,70,20,.35)!important}'
    + 'html.jsh-xmas.light :is(header.top,.top:not(.sec)),html.jsh-xmas[data-theme="light"] :is(header.top,.top:not(.sec)){background:#e5f4ec!important;color:#0c3a28;border-bottom-color:rgba(140,32,48,.3)!important}'
    + 'html.jsh-thanks .yt{position:relative;margin-top:2px}'
    + 'html.jsh-thanks .yt::before{content:"";position:absolute;left:0;right:0;top:-90px;height:200px;background:radial-gradient(closest-side,rgba(255,176,64,.2),transparent);pointer-events:none;z-index:0}'
    + 'html.jsh-thanks .yt>*{position:relative;z-index:1}'
    /* the heading row holds the More menu (Alerts, Calendar, Minimize): keep it above Change teams and the cards (11-26 fix) */
    + 'html.jsh-thanks .yt>.sec.top{z-index:5}'
    + 'html.jsh-thanks .sec.top,html.jsh-xmas .sec.top{margin-top:0;background:transparent}'
    + 'html.jsh-thanks .yt-more-btn,html.jsh-thanks .yt-expand{background:rgba(255,246,228,.06);border-color:rgba(255,214,150,.28);color:#fff6e4}'
    + 'html.jsh-thanks .yt-menu{background:rgba(42,22,12,.97)!important;border-color:rgba(255,214,150,.28)!important}'
    + 'html.jsh-thanks .yt-menu a,html.jsh-thanks .yt-menu button{color:#fff6e4}'
    + 'html.jsh-thanks.light .yt-more-btn,html.jsh-thanks.light .yt-expand,html.jsh-thanks[data-theme="light"] .yt-more-btn,html.jsh-thanks[data-theme="light"] .yt-expand{background:rgba(255,248,236,.85);border-color:rgba(140,70,20,.35);color:#3a2412}'
    + 'html.jsh-thanks.light .yt-menu,html.jsh-thanks[data-theme="light"] .yt-menu{background:#fffaf2!important;border:1px solid rgba(140,70,20,.45)!important;box-shadow:0 18px 40px -16px rgba(58,36,18,.45)!important;z-index:80}'
    + 'html.jsh-thanks.light .yt-menu a,html.jsh-thanks.light .yt-menu button,html.jsh-thanks[data-theme="light"] .yt-menu a,html.jsh-thanks[data-theme="light"] .yt-menu button{color:#3a2412}'
    + 'html.jsh-thanks :is(.jsh-dock,.btab,.jbl){background:#2a160c!important;border-color:rgba(240,186,96,.55)!important;color:#f6e2b8}'
    + 'html.jsh-xmas :is(.jsh-dock,.btab,.jbl){background:#0c2418!important;border-color:rgba(220,64,78,.5)!important;color:#e7f6ee}'
    + 'html.jsh-thanks.light :is(.jsh-dock,.btab,.jbl),html.jsh-thanks[data-theme="light"] :is(.jsh-dock,.btab,.jbl){background:#f8e8cc!important;color:#3a2412;border-color:rgba(140,70,20,.35)!important}'
    + 'html.jsh-xmas.light :is(.jsh-dock,.btab,.jbl),html.jsh-xmas[data-theme="light"] :is(.jsh-dock,.btab,.jbl){background:#e7f6ee!important;color:#0c3a28;border-color:rgba(140,32,48,.35)!important}'
    + 'body.boardmode .jsh-hol,body.boardmode .jsh-hol-frame{display:none}'
    + '@media (max-width:760px){.jsh-hol{font-size:11.5px;letter-spacing:.16em;padding:6px 14px 7px}.jsh-hol-slim .jsh-hol-art img{height:50px}.jsh-hol-slim .jsh-hol-art img:nth-child(1){height:58px}.jsh-hol-slim .jsh-hol-art img:nth-child(2){height:46px}.jsh-hol-slim .jsh-hol-k{font-size:12.5px}html.jsh-thanks .jsh-hol{padding:2px 6px 0}html.jsh-thanks .jsh-hol-k{font-size:14px;letter-spacing:.14em}.jsh-hol-art img{height:76px}.jsh-hol-art img:nth-child(1){height:90px}.jsh-hol-art img:nth-child(2){height:70px}.jsh-hol-marks{gap:14px}.jsh-hol .mark{width:16px;height:16px}}'
    /* ---------- 11-27 (Jamo: "enhance the Christmas theme"): gold title, countdown, string lights, ornaments on home,
       a Santa hat on the J, a soft red/green glow behind Your teams, light snow on home. Motion stops for reduce-motion. ---------- */
    + 'html.jsh-xmas .jsh-hol{flex-direction:column;gap:2px;padding:9px 16px 16px;max-width:100%;box-sizing:border-box;background:linear-gradient(90deg,#0b5233,#0e3d2a 38%,#5e1420 70%,#8e1c2a);border-bottom:0;overflow:visible}'
    + 'html.jsh-xmas .jsh-hol.jsh-hol-slim{flex-direction:row;gap:10px;padding:7px 14px 13px}'
    + '.jsh-xmas-k{position:relative;z-index:2;font-size:15px;font-weight:800;letter-spacing:.2em;background-image:linear-gradient(100deg,#fff6d6 0%,#ffe08a 22%,#fff 40%,#f6c453 58%,#fff6d6 80%,#ffe08a 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#ffe08a;animation:jsh-hol-shoot 7s linear infinite}'
    + '.jsh-hol-slim .jsh-xmas-k{font-size:12px;letter-spacing:.16em}.jsh-hol-slim :is(.jsh-xmas-k,.jsh-xmas-c){white-space:nowrap}'
    + '.jsh-xmas-c{position:relative;z-index:2;font-size:11px;font-weight:700;letter-spacing:.14em;color:#d9f5e6;opacity:.92}'
    + '.jsh-hol-slim .jsh-xmas-c{font-size:10.5px}.jsh-hol-slim .jsh-xmas-c::before{content:"·";margin-right:10px;opacity:.6}'
    + '.jsh-xmas-l{position:absolute;left:0;right:0;bottom:-7px;height:18px;display:flex;justify-content:space-around;align-items:flex-start;pointer-events:none;z-index:3}'
    + '.jsh-xmas-l::before{content:"";position:absolute;left:0;right:0;top:-4px;height:12px;border-bottom:1.5px solid rgba(20,30,24,.85);border-radius:0 0 50% 50%/0 0 100% 100%}'
    + '.jsh-xmas-l i{position:relative;width:7px;height:11px;margin-top:3px;border-radius:50% 50% 50% 50%/40% 40% 60% 60%;background:var(--b);box-shadow:0 0 6px 1px var(--b),0 0 14px 2px color-mix(in srgb,var(--b) 50%,transparent);animation:jsh-xtw 2.6s ease-in-out infinite;animation-delay:var(--d)}'
    + '.jsh-xmas-l i::before{content:"";position:absolute;left:1.5px;top:-3px;width:4px;height:4px;border-radius:1px;background:#2b3a30}'
    + '@keyframes jsh-xtw{0%,100%{opacity:1;filter:none}50%{opacity:.45;filter:saturate(.6) brightness(.8)}}'
    + '.jsh-xmas-o{position:absolute;top:0;z-index:1;pointer-events:none;transform-origin:50% 0;animation:jsh-xsw 4.5s ease-in-out infinite}'
    + '.jsh-xmas-o svg{display:block;width:22px;height:auto;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}'
    + '@keyframes jsh-xsw{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}'
    + '.jsh-hol-slim .jsh-xmas-o{display:none}'
    + '.jsh-brand{position:relative}.jsh-hat{position:absolute;left:-7px;top:-11px;width:30px;height:24px;transform:rotate(-22deg);pointer-events:none;z-index:3;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}'
    + 'html.jsh-xmas .yt{position:relative}'
    + 'html.jsh-xmas .yt::before{content:"";position:absolute;left:0;right:0;top:-80px;height:220px;background:radial-gradient(40% 60% at 25% 50%,rgba(34,160,96,.16),transparent 70%),radial-gradient(40% 60% at 75% 50%,rgba(200,40,60,.14),transparent 70%);pointer-events:none;z-index:0}'
    + 'html.jsh-xmas .yt>*{position:relative;z-index:1}html.jsh-xmas .yt>.sec.top{z-index:5}'
    + '.jsh-snow{position:fixed;inset:0;z-index:-1;pointer-events:none}'
    + 'html.jsh-xmas.light .jsh-hol,html.jsh-xmas[data-theme="light"] .jsh-hol{color:#fff}'
    + '@media (prefers-reduced-motion:reduce){.jsh-xmas-k,.jsh-xmas-l i,.jsh-xmas-o{animation:none}.jsh-xmas-k{background:none;-webkit-text-fill-color:currentColor;color:#ffe08a}.jsh-snow{display:none}}'
    /* ---------- 11-27 round 2 (Jamo: "enhance the Christmas theme some more"): snow caps on the cards, a snowy treeline at
       the foot of home, light snowfall on the league pages, Christmas-colored win confetti (moments.js) ---------- */
    + '.jsh-cap{position:absolute;left:0;right:0;top:0;height:11px;z-index:4;pointer-events:none;background:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2756%27 height=%2711%27 viewBox=%270 0 56 11%27%3E%3Cpath fill=%27%23fff%27 d=%27M0 0H56V4.6C52 4.6 51 7 47.5 7S43 5.2 40 5.2 37 9.6 34.2 9.6 32 6 28 6 22.6 8 18.4 8 13 5.4 9.4 5.4 4 6.6 0 4.6Z%27/%3E%3Cpath fill=%27%23dbeaf5%27 d=%27M0 3.2C4 5 8.6 4 12 4.2s7 2.4 12 2.2 7-1.6 11-1.4 6 .8 9 .6 6-1.6 12-1.4V4.6C52 4.6 51 7 47.5 7S43 5.2 40 5.2 37 9.6 34.2 9.6 32 6 28 6 22.6 8 18.4 8 13 5.4 9.4 5.4 4 6.6 0 4.6Z%27 opacity=%27.7%27/%3E%3C/svg%3E") 0 0/56px 11px repeat-x;filter:drop-shadow(0 1.5px 1.2px rgba(0,24,48,.28))}'
    + '#teams.mini .jsh-cap{height:8px;background-size:41px 8px}'
    + '.jsh-xmas-trees{position:relative;height:96px;margin:34px -16px -6px;pointer-events:none;overflow:hidden}'
    + '.jsh-xmas-trees{display:flex;justify-content:center;align-items:flex-end;-webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}.jsh-xmas-trees svg{flex:none;height:96px;width:600px}.jsh-xmas-trees svg.m{transform:scaleX(-1)}'
    + '.jsh-xmas-trees .tw{animation:jsh-xtw 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}@keyframes jsh-xtw{0%,100%{opacity:1}50%{opacity:.35}}'
    + 'html.jsh-xmas.light .jsh-xmas-trees .tr,html.jsh-xmas[data-theme="light"] .jsh-xmas-trees .tr{fill:#1f6b46}html.jsh-xmas.light .jsh-xmas-trees .tr2,html.jsh-xmas[data-theme="light"] .jsh-xmas-trees .tr2{fill:#2f8a5c}'
    + 'html.jsh-xmas.light .jsh-xmas-trees .gr,html.jsh-xmas[data-theme="light"] .jsh-xmas-trees .gr{fill:#fff}'
    + '@media (prefers-reduced-motion:reduce){.jsh-xmas-trees .tw{animation:none}}'
    + 'body:is(.boardmode,.tvmode,.livetv) .jsh-cap{display:none}'
    + 'body.boardmode :is(.jsh-snow,.jsh-hat),body.livetv .jsh-snow{display:none}'
    + '@media print{.jsh-hol,.jsh-hol-wash,.jsh-hol-frame,.jsh-snow,.jsh-hat{display:none}}';

  var st = D.createElement('style'); st.id = 'jsh-holiday-css'; st.textContent = css; (D.head || H).appendChild(st);

  function mount() {
    if (!D.body || D.querySelector('.jsh-hol-wash')) return;
    var wash = D.createElement('div');
    wash.className = 'jsh-hol-wash';
    wash.setAttribute('aria-hidden', 'true');
    D.body.appendChild(wash);
    var frame = D.createElement('div');
    frame.className = 'jsh-hol-frame';
    frame.setAttribute('aria-hidden', 'true');
    D.body.appendChild(frame);
    var bar = D.querySelector('.jsh');
    if (!bar || D.querySelector('.jsh-hol')) return;
    var strip = D.createElement('div');
    strip.className = /^\/sports\/?(index\.html)?$/.test(location.pathname) ? 'jsh-hol' : 'jsh-hol jsh-hol-slim';
    strip.setAttribute('role', 'status');
    var tree = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path class="w" d="M10 13.5c2-4.2 10-4.2 12 0" stroke-width="1.6"/><path class="w" d="M7.5 20c2.8-5.6 14.2-5.6 17 0" stroke-width="1.6"/><path class="g" d="M5.5 26.5c3.4-6.4 17.6-6.4 21 0" stroke-width="1.6"/><circle class="gd" cx="16" cy="8.2" r="1.15"/></svg>';
    var star = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path class="g" d="M16 4.5 18.2 13.2 27 16l-8.8 2.8L16 27.5l-2.2-8.7L5 16l8.8-2.8Z" stroke-width="1.5"/></svg>';
    var bulb = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path class="g" d="M13 7.5h6" stroke-width="1.7"/><circle class="w" cx="16" cy="18" r="7" stroke-width="1.7"/><path class="g" d="M12.2 15.2a6 6 0 0 1 4.2-2.6" stroke-width="1.4"/></svg>';
    /* Christmas extras (11-27) */
    function xmasCount(short) { var t = today(); if (t.m === 12 && t.d === 25) return 'Merry Christmas!'; if (t.m === 12 && t.d === 24) return 'Christmas Eve'; if (t.m === 12 && t.d === 26) return 'Happy holidays';
      var n = Math.round((Date.UTC(t.y, 11, 25) - Date.UTC(t.y, t.m - 1, t.d)) / 864e5); return n + (n === 1 ? ' day' : ' days') + (short ? ' to go' : ' until Christmas'); }
    function lights() { var C = ['#ff4d5e', '#ffd166', '#3ddc84', '#5ab8ff', '#ff8a3d', '#f472b6'], n = Math.max(12, Math.min(30, Math.round((W.innerWidth || 390) / 30))), h = '';
      for (var i = 0; i < n; i++) h += '<i style="--b:' + C[i % C.length] + ';--d:-' + ((i * 0.37) % 2.6).toFixed(2) + 's"></i>';
      return '<span class="jsh-xmas-l" aria-hidden="true">' + h + '</span>'; }
    function orn(c1, c2, left, len, delay) { return '<span class="jsh-xmas-o" aria-hidden="true" style="left:' + left + ';animation-delay:' + delay + '"><svg viewBox="0 0 26 ' + (len + 30) + '"><path d="M13 0V' + len + '" stroke="#e8d9a8" stroke-width="1"/><rect x="10" y="' + len + '" width="6" height="4" rx="1" fill="#d4b25a"/><circle cx="13" cy="' + (len + 15) + '" r="10" fill="' + c1 + '"/><path d="M4 ' + (len + 15) + 'h18" stroke="' + c2 + '" stroke-width="2.2" stroke-linecap="round"/><circle cx="9.5" cy="' + (len + 10.5) + '" r="2.6" fill="#fff" opacity=".55"/></svg></span>'; }
    function ornaments() { return orn('#c8102e', '#ffd166', '3%', 6, '-1s') + orn('#0b8a4e', '#ffe9b0', '11%', 16, '-2.2s') + orn('#d4a73a', '#fff', 'calc(89% - 22px)', 12, '-.4s') + orn('#1f5fbf', '#ffd166', 'calc(97% - 22px)', 4, '-3s'); }
    function hat() { var b = D.querySelector('.jsh-brand'); if (!b || b.querySelector('.jsh-hat')) return;
      b.insertAdjacentHTML('afterbegin', '<svg class="jsh-hat" viewBox="0 0 30 24" aria-hidden="true"><path d="M4 18C6 8 13 2 21 4c3 .8 5 3 5.5 6l-2.5 1c-.6-2-1.8-3.2-3.6-3.4C15 7.300 12 12 11 18Z" fill="#d42335"/><path d="M8.6 9.400C12 5 17 3.600 21 4" stroke="#ff6b7a" stroke-width="1.2" fill="none" opacity=".7"/><rect x="2" y="16.5" width="12" height="5" rx="2.5" fill="#fff"/><circle cx="26.3" cy="11.6" r="3" fill="#fff"/></svg>'); }
    function snow(lite) { try { if (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
      if (D.querySelector('.jsh-snow')) return; var cv = D.createElement('canvas'); cv.className = 'jsh-snow'; cv.setAttribute('aria-hidden', 'true'); D.body.appendChild(cv);
      var x = cv.getContext('2d'), dpr = Math.min(2, W.devicePixelRatio || 1), w = 0, h = 0, flakes = [], last = 0, on = true;
      function size() { w = W.innerWidth; h = W.innerHeight; cv.width = w * dpr; cv.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
      size(); W.addEventListener('resize', size);
      /* home: a proper flurry; the league pages (11-27 round 2): a light one, smaller and slower, behind the content */
      var N = lite ? (w < 700 ? 12 : 22) : (w < 700 ? 26 : 46); for (var i = 0; i < N; i++) flakes.push({ x: Math.random() * w, y: Math.random() * h, r: lite ? .7 + Math.random() * 1.6 : .8 + Math.random() * 2.2, s: lite ? .18 + Math.random() * .35 : .25 + Math.random() * .55, d: Math.random() * 6.28 });
      var lt = function () { return /light/.test(H.className) || H.getAttribute('data-theme') === 'light'; };
      D.addEventListener('visibilitychange', function () { on = !D.hidden; if (on) requestAnimationFrame(step); });
      function step(t) { if (!on) return; if (t - last < 33) { requestAnimationFrame(step); return; } last = t; x.clearRect(0, 0, w, h);
        x.fillStyle = lt() ? 'rgba(120,160,190,.55)' : 'rgba(255,255,255,.7)';
        for (var i = 0; i < flakes.length; i++) { var f = flakes[i]; f.y += f.s; f.d += .012; f.x += Math.sin(f.d) * .35; if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; } x.globalAlpha = .35 + f.r / 5; x.beginPath(); x.arc(f.x, f.y, f.r, 0, 6.283); x.fill(); }
        requestAnimationFrame(step); }
      requestAnimationFrame(step); }
    /* snow caps: a soft drift along the top edge of the home team cards and each league page's headline card */
    function caps() { var sel = '#teams a.tc, #view > .sbh, #view > .thead, #view > .ghead', due = 0;
      function run() { due = 0; D.querySelectorAll(sel).forEach(function (el) { if (el.querySelector(':scope > .jsh-cap')) return; var cs = getComputedStyle(el); if (cs.position === 'static') el.style.position = 'relative';
        var c = D.createElement('i'); c.className = 'jsh-cap'; c.setAttribute('aria-hidden', 'true'); c.style.borderRadius = cs.borderTopLeftRadius + ' ' + cs.borderTopRightRadius + ' 0 0'; el.appendChild(c); }); }
      run(); try { new MutationObserver(function () { if (!due) due = setTimeout(run, 120); }).observe(D.body, { childList: true, subtree: true }); } catch (e) {} }
    /* a snowy treeline at the foot of the home page, a few lights twinkling on the big tree */
    function treeline() { var fd = D.getElementById('fd'); if (!fd || fd.querySelector('.jsh-xmas-trees')) return;
      var s = '', P = [[18, 46, 'tr2'], [52, 70, 'tr'], [92, 38, 'tr2'], [128, 58, 'tr'], [170, 30, 'tr2'], [212, 84, 'tr'], [262, 44, 'tr2'], [300, 62, 'tr'], [342, 34, 'tr2'], [384, 52, 'tr'], [430, 74, 'tr'], [474, 40, 'tr2'], [512, 60, 'tr'], [556, 36, 'tr2'], [590, 50, 'tr']];
      P.forEach(function (p) { var x = p[0], h = p[1], b = 88, w = h * .42, tiers = 3, out = '', snowy = '';
        for (var k = 0; k < tiers; k++) { var top = b - h + k * h * .27, bot = b - h * (.42 - k * .2) + (k === tiers - 1 ? h * .42 - 6 : 0), hw = w * (.55 + k * .25);
          out += 'M' + x + ' ' + top.toFixed(1) + 'L' + (x + hw).toFixed(1) + ' ' + bot.toFixed(1) + 'H' + (x - hw).toFixed(1) + 'Z';
          snowy += 'M' + x + ' ' + top.toFixed(1) + 'l' + (hw * .32).toFixed(1) + ' ' + (h * .1).toFixed(1) + 'q' + (-hw * .16).toFixed(1) + ' ' + (h * .03).toFixed(1) + ' ' + (-hw * .32).toFixed(1) + ' 0q' + (-hw * .16).toFixed(1) + ' ' + (-h * .03).toFixed(1) + ' ' + (-hw * .32).toFixed(1) + ' 0Z'; }
        s += '<path class="' + p[2] + '" fill="' + (p[2] === 'tr' ? '#0f4a30' : '#17603f') + '" d="' + out + '"/><rect x="' + (x - 2) + '" y="' + (b - 7) + '" width="4" height="7" fill="#3b2a1e"/><path fill="#f4faff" d="' + snowy + '"/>'; });
      var L = [[202, 30, '#ff4d5e'], [221, 36, '#ffd166'], [206, 47, '#3ddc84'], [224, 56, '#5ab8ff'], [199, 63, '#ff8a3d'], [216, 70, '#ffd166']], lt = '';
      L.forEach(function (q, i) { lt += '<circle class="tw" style="--d:-' + (i * .43).toFixed(2) + 's" cx="' + q[0] + '" cy="' + q[1] + '" r="2.1" fill="' + q[2] + '"/>'; });
      var star = '<path class="tw" fill="#ffd166" d="M212 0.8l1.9 4.3 4.6.5-3.5 3.1 1 4.6-4-2.4-4 2.4 1-4.6-3.5-3.1 4.6-.5Z"/>';
      var ground = '<path class="gr" fill="#eaf4fb" d="M0 86C60 80 120 84 190 82S320 78 400 83 520 80 600 84V96H0Z" opacity=".95"/>';
      var box = D.createElement('div'); box.className = 'jsh-xmas-trees'; box.setAttribute('aria-hidden', 'true');
      /* one 600 px scene in the middle, mirrored copies either side so a wide screen gets a whole forest (the ground meets at the seams) */
      var one = s + lt + star + ground, plain = s + ground, sv = function (m, body) { return '<svg' + (m ? ' class="m"' : '') + ' viewBox="0 0 600 96">' + body + '</svg>'; };
      box.innerHTML = sv(0, plain) + sv(1, plain) + sv(0, one) + sv(1, plain) + sv(0, plain);
      var ft = fd.querySelector('footer.foot'); if (ft) fd.insertBefore(box, ft); else fd.appendChild(box); }
    function marks(list) { return '<span class="jsh-hol-marks" aria-hidden="true">' + list.join('') + '</span>'; }
    if (kind === 'thanks') {
      strip.innerHTML = '<span class="jsh-hol-k">Happy Thanksgiving</span><span class="jsh-hol-art" aria-hidden="true"><img src="/sports/holiday/thanks-turkey.png?v=20261126l" alt=""><img src="/sports/holiday/thanks-football.png?v=20261126l" alt=""><img src="/sports/holiday/thanks-pie.png?v=20261126l" alt=""></span>';
    } else {
      strip.innerHTML = '<span class="jsh-xmas-k">Merry Christmas</span><span class="jsh-xmas-c">' + xmasCount(/jsh-hol-slim/.test(strip.className)) + '</span>' + lights() + (/jsh-hol-slim/.test(strip.className) ? '' : ornaments());
      hat(); var slim = /jsh-hol-slim/.test(strip.className);
      if (!slim) { snow(); treeline(); }
      else if (!/^\/sports\/live/.test(location.pathname)) setTimeout(function () { snow(true); }, 1200);   /* after the page has drawn */
      caps();
    }
    bar.insertAdjacentElement('afterend', strip);
  }
  if (D.body) mount();
  else D.addEventListener('DOMContentLoaded', mount);
})();
/* holiday:end */
