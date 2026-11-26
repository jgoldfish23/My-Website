/* holiday:start - a still seasonal layer on every page (2026-11-26).
   Thanksgiving is the fourth Thursday of November. The next morning through December 26 is Christmas.
   After that the hub looks normal again. The date is the hub's own time zone (America/Denver when none is saved).
   ?hol=thanks, ?hol=xmas or ?hol=off overrides the date, for a look at the other theme.
   No beams, grids, or photos. Thanksgiving keeps the animated phrase. The art fades into the field.
   Reduced-motion users get the same still layer. */
(function () {
  if (window.__jshHoliday) return; window.__jshHoliday = true;
  var D = document, H = D.documentElement;
  var ZONES = { ET: 'America/New_York', CT: 'America/Chicago', MT: 'America/Denver', PT: 'America/Los_Angeles' };

  function zone() {
    var tz = 'MT';
    try { tz = (JSON.parse(localStorage.getItem('jsh-shared') || '{}') || {}).tz || 'MT'; } catch (e) {}
    return ZONES[tz] || ZONES.MT;
  }
  function today() {
    var y, m, d;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: zone(), year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach(function (p) {
        if (p.type === 'year') y = +p.value;
        if (p.type === 'month') m = +p.value;
        if (p.type === 'day') d = +p.value;
      });
    } catch (e) {
      var n = new Date(); y = n.getFullYear(); m = n.getMonth() + 1; d = n.getDate();
    }
    return { y: y, m: m, d: d };
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
    if (t.m === 11 && t.d === thanksgivingDay(t.y)) return 'thanks';
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
    + 'html.jsh-xmas .jsh-hol-frame{box-shadow:inset 4px 0 0 rgba(46,170,96,.8),inset -4px 0 0 rgba(196,40,56,.75),inset 0 0 80px rgba(20,80,48,.22)}'
    + 'html.jsh-thanks .jsh,html.jsh-xmas .jsh{position:sticky;top:0;z-index:80}'
    + 'html.jsh-thanks .jsh{background:#2a160c!important;background-image:linear-gradient(180deg,#8a3e10,#2a160c 72%,rgba(74,42,18,0))!important;border-bottom-color:transparent!important;box-shadow:none!important}'
    + 'html.jsh-thanks .jsh-brand b{background:linear-gradient(90deg,#ffe08a,#f0a040);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + 'html.jsh-xmas .jsh{background:#071a12!important;background-image:linear-gradient(90deg,#0e6a40,#071a12 40%,#071a12 62%,#6e1824)!important;border-bottom-color:rgba(240,196,96,.4)!important}'
    + 'html.jsh-xmas .jsh-brand b{background:linear-gradient(90deg,#8cf0b4,#f0d060);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '.jsh-hol{position:sticky;top:44px;z-index:79;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:0;padding:16px 22px 18px;font-family:"Inter Tight","Inter",system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;line-height:1.2;text-align:center}'
    + 'html.jsh-thanks .jsh-hol{position:relative;top:auto;color:#fff6e4;background:none;border-bottom:0;padding:2px 8px 0;gap:0}'
    + 'html.jsh-thanks .jsh-hol::before{content:"";position:absolute;left:50%;top:72%;width:min(420px,100vw);height:260px;transform:translate(-50%,-42%);background:radial-gradient(closest-side,rgba(255,186,80,.32),rgba(160,72,18,.1) 48%,transparent 76%);pointer-events:none;z-index:0}'
    + 'html.jsh-thanks.light .jsh-hol,html.jsh-thanks[data-theme="light"] .jsh-hol{color:#3a2412}'
    + 'html.jsh-thanks.light .jsh-hol::before,html.jsh-thanks[data-theme="light"] .jsh-hol::before{background:radial-gradient(closest-side,rgba(214,140,46,.34),rgba(248,210,150,.08) 60%,transparent 76%)}'
    + 'html.jsh-xmas .jsh-hol{color:#f4fff8;background:linear-gradient(90deg,#0c5a38,#8e1c2a 78%);border-bottom:1px solid #fbbf24}'
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
    + 'html.jsh-thanks:not(.light):not([data-theme="light"]) :is(header.top,.top){background:#3a2212!important;color:#f8e7c4;border-bottom-color:rgba(240,186,96,.45)!important}'
    + 'html.jsh-xmas:not(.light):not([data-theme="light"]) :is(header.top,.top){background:#0c2e22!important;color:#e7f6ee;border-bottom-color:rgba(240,196,96,.35)!important}'
    + 'html.jsh-thanks.light :is(header.top,.top),html.jsh-thanks[data-theme="light"] :is(header.top,.top){background:#f6e0bc!important;color:#3a2412;border-bottom-color:rgba(140,70,20,.35)!important}'
    + 'html.jsh-xmas.light :is(header.top,.top),html.jsh-xmas[data-theme="light"] :is(header.top,.top){background:#e5f4ec!important;color:#0c3a28;border-bottom-color:rgba(140,32,48,.3)!important}'
    + 'html.jsh-thanks .yt{position:relative;margin-top:2px}'
    + 'html.jsh-thanks .yt::before{content:"";position:absolute;left:0;right:0;top:-90px;height:200px;background:radial-gradient(78% 100% at 50% 0%,rgba(255,176,64,.26),transparent 74%);pointer-events:none;z-index:0}'
    + 'html.jsh-thanks .yt>*{position:relative;z-index:1}'
    + 'html.jsh-thanks .sec.top{margin-top:0;background:transparent}'
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
    + '@media (max-width:760px){.jsh-hol{top:44px;font-size:12px;letter-spacing:.16em;padding:14px 18px 16px}html.jsh-thanks .jsh-hol{padding:2px 6px 0}html.jsh-thanks .jsh-hol-k{font-size:14px;letter-spacing:.14em}.jsh-hol-art img{height:76px}.jsh-hol-art img:nth-child(1){height:90px}.jsh-hol-art img:nth-child(2){height:70px}.jsh-hol-marks{gap:14px}.jsh-hol .mark{width:20px;height:20px}}'
    + '@media print{.jsh-hol,.jsh-hol-wash,.jsh-hol-frame{display:none}}';

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
    strip.className = 'jsh-hol';
    strip.setAttribute('role', 'status');
    var tree = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path class="w" d="M10 13.5c2-4.2 10-4.2 12 0" stroke-width="1.6"/><path class="w" d="M7.5 20c2.8-5.6 14.2-5.6 17 0" stroke-width="1.6"/><path class="g" d="M5.5 26.5c3.4-6.4 17.6-6.4 21 0" stroke-width="1.6"/><circle class="gd" cx="16" cy="8.2" r="1.15"/></svg>';
    var star = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path class="g" d="M16 4.5 18.2 13.2 27 16l-8.8 2.8L16 27.5l-2.2-8.7L5 16l8.8-2.8Z" stroke-width="1.5"/></svg>';
    var bulb = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path class="g" d="M13 7.5h6" stroke-width="1.7"/><circle class="w" cx="16" cy="18" r="7" stroke-width="1.7"/><path class="g" d="M12.2 15.2a6 6 0 0 1 4.2-2.6" stroke-width="1.4"/></svg>';
    function marks(list) { return '<span class="jsh-hol-marks" aria-hidden="true">' + list.join('') + '</span>'; }
    if (kind === 'thanks') {
      strip.innerHTML = '<span class="jsh-hol-k">Happy Thanksgiving</span><span class="jsh-hol-art" aria-hidden="true"><img src="/sports/holiday/thanks-turkey.png?v=20261126l" alt=""><img src="/sports/holiday/thanks-football.png?v=20261126l" alt=""><img src="/sports/holiday/thanks-pie.png?v=20261126l" alt=""></span>';
    } else {
      strip.innerHTML = 'Merry Christmas' + marks([star, tree, bulb]);
    }
    bar.insertAdjacentElement('afterend', strip);
  }
  if (D.body) mount();
  else D.addEventListener('DOMContentLoaded', mount);
})();
/* holiday:end */
