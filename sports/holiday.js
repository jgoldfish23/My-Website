/* holiday:start - a still seasonal layer on every page (2026-11-26).
   Thanksgiving is the fourth Thursday of November. The next morning through December 26 is Christmas.
   After that the hub looks normal again. The date is the hub's own time zone (America/Denver when none is saved).
   ?hol=thanks, ?hol=xmas or ?hol=off overrides the date, for a look at the other theme.
   No beams, grids, photos or motion. Reduced-motion users get the same still layer. */
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
    + 'html.jsh-thanks .jsh-hol-frame{box-shadow:inset 0 0 0 4px rgba(240,186,96,.7),inset 0 0 80px rgba(160,60,12,.28)}'
    + 'html.jsh-xmas .jsh-hol-frame{box-shadow:inset 4px 0 0 rgba(46,170,96,.8),inset -4px 0 0 rgba(196,40,56,.75),inset 0 0 80px rgba(20,80,48,.22)}'
    + 'html.jsh-thanks .jsh,html.jsh-xmas .jsh{position:sticky;top:0;z-index:80}'
    + 'html.jsh-thanks .jsh{background:#2a160c!important;background-image:linear-gradient(90deg,#8a3e10,#2a160c 42%,#2a160c 62%,#6a3010)!important;border-bottom-color:rgba(240,186,96,.45)!important}'
    + 'html.jsh-thanks .jsh-brand b{background:linear-gradient(90deg,#ffe08a,#f0a040);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + 'html.jsh-xmas .jsh{background:#071a12!important;background-image:linear-gradient(90deg,#0e6a40,#071a12 40%,#071a12 62%,#6e1824)!important;border-bottom-color:rgba(240,196,96,.4)!important}'
    + 'html.jsh-xmas .jsh-brand b{background:linear-gradient(90deg,#8cf0b4,#f0d060);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '.jsh-hol{position:sticky;top:44px;z-index:79;display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:8px 14px;font-family:"Inter Tight","Inter",system-ui,sans-serif;font-size:14px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;line-height:1.2;text-align:center}'
    + 'html.jsh-thanks .jsh-hol{color:#fff6e4;background:linear-gradient(90deg,#6a3410,#c47820 50%,#6a3410);border-bottom:2px solid #f0c36a}'
    + 'html.jsh-xmas .jsh-hol{color:#f4fff8;background:linear-gradient(90deg,#0c5a38,#8e1c2a 78%);border-bottom:2px solid #f0d060}'
    + '.jsh-hol i{font-style:normal;color:#ffe08a}'
    + 'html.jsh-thanks:not(.light):not([data-theme="light"]) :is(header.top,.top){background:#3a2212!important;color:#f8e7c4;border-bottom-color:rgba(240,186,96,.45)!important}'
    + 'html.jsh-xmas:not(.light):not([data-theme="light"]) :is(header.top,.top){background:#0c2e22!important;color:#e7f6ee;border-bottom-color:rgba(240,196,96,.35)!important}'
    + 'html.jsh-thanks.light :is(header.top,.top),html.jsh-thanks[data-theme="light"] :is(header.top,.top){background:#f6e0bc!important;color:#3a2412;border-bottom-color:rgba(140,70,20,.35)!important}'
    + 'html.jsh-xmas.light :is(header.top,.top),html.jsh-xmas[data-theme="light"] :is(header.top,.top){background:#e5f4ec!important;color:#0c3a28;border-bottom-color:rgba(140,32,48,.3)!important}'
    + 'html.jsh-thanks :is(.jsh-dock,.btab,.jbl){background:#2a160c!important;border-color:rgba(240,186,96,.55)!important;color:#f6e2b8}'
    + 'html.jsh-xmas :is(.jsh-dock,.btab,.jbl){background:#0c2418!important;border-color:rgba(220,64,78,.5)!important;color:#e7f6ee}'
    + 'html.jsh-thanks.light :is(.jsh-dock,.btab,.jbl),html.jsh-thanks[data-theme="light"] :is(.jsh-dock,.btab,.jbl){background:#f8e8cc!important;color:#3a2412;border-color:rgba(140,70,20,.35)!important}'
    + 'html.jsh-xmas.light :is(.jsh-dock,.btab,.jbl),html.jsh-xmas[data-theme="light"] :is(.jsh-dock,.btab,.jbl){background:#e7f6ee!important;color:#0c3a28;border-color:rgba(140,32,48,.35)!important}'
    + 'body.boardmode .jsh-hol,body.boardmode .jsh-hol-frame{display:none}'
    + '@media (max-width:760px){.jsh-hol{top:44px;min-height:46px;font-size:15px;letter-spacing:.05em;padding:10px 12px}}'
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
    if (kind === 'thanks') strip.innerHTML = '<i aria-hidden="true">&#9670;</i> Happy Thanksgiving <i aria-hidden="true">&#9670;</i>';
    else strip.innerHTML = '<i aria-hidden="true">&#10022;</i> Merry Christmas <i aria-hidden="true">&#10022;</i>';
    bar.insertAdjacentElement('afterend', strip);
  }
  if (D.body) mount();
  else D.addEventListener('DOMContentLoaded', mount);
})();
/* holiday:end */
