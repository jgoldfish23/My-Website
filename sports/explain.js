/* explain:start - "Explain": tap a stat name to see what it means (2026-11-10, Jamo picked "Tap to explain stats").
   Published by sports-hub/build.sh as /sports/explain.js and loaded by the shared top bar (hubbar.html), so all four
   hubs get it. Stat names it knows get a faint dotted underline:
   - tap one (a tile label, a row label, a column name that does not sort) and a small card says what it means, whether
     higher or lower is better, and - for a table column - the middle value in that table (from the numbers on screen);
   - column names that sort the table when tapped keep doing that; press and hold one to see its card instead;
   - on a computer, resting the pointer on the name shows the card.
   Where a hub already wrote its own explanation (a title on the label, like the players tables' "i" notes), the card
   uses those words. Otherwise it uses the glossary below, one per sport, written for this hub. */
(function(){
  if (window.__jshExplain) return; window.__jshExplain = true;
  var D = document, W = window;
  var SPORT = (/^\/(cfb|nfl|nba|cbb)\//.exec(location.pathname) || [])[1] || '';
  if (!SPORT) return;
  var HI = 'Higher is better', LO = 'Lower is better';
  /* each entry: 'name|other name': [what it means, HI / LO / ''] - names are matched without case */
  var ALL = {
    'ats|against the spread': ['Record against the betting line: a win means the team beat the point spread, not just the other team.', HI],
    'o/u|over / under': ['The betting total: how many points both teams together were expected to score. In a record column, how many games went over it and how many went under.', ''],
    'line|spread|closing line|closing spread': ['The betting point spread. The favorite has the minus number, the margin it is expected to win by. "Closing" is the last line before the game started.', ''],
    'ml|moneyline': ['Betting odds to win the game outright. -150 means betting $150 to win $100 (the favorite); +130 means $100 wins $130 (the underdog).', ''],
    'model|model line': ['The hub’s own predicted margin, from its power ratings plus home field, written like a point spread.', ''],
    'edge': ['How far the hub’s model line is from the betting line. The bigger the edge, the more the model disagrees with the market.', ''],
    'model ats': ['How the hub’s picks have done against the betting line.', HI],
    'model straight up': ['How often the hub’s model picked the winner.', HI],
    'win %|pct|win chance|home win %': ['Share of games won. For a game not played yet, the hub’s chance of winning it.', HI],
    'pregame win prob.|win probability': ['The hub’s chance of winning before the game, from its power ratings and home field.', ''],
    'power|power rating|power ratings|hub power': ['The hub’s own team strength number, in points. The gap between two teams’ ratings, plus home field, is the hub’s predicted margin.', HI],
    'opp rating': ['The opponent’s hub power rating. Higher means a tougher opponent.', ''],
    'sos|schedule strength|sched. strength': ['How tough the schedule is: the average power rating of the opponents. Higher means tougher.', ''],
    'avg margin': ['Average points scored minus points allowed per game.', HI],
    'margin|diff': ['Points scored minus points allowed.', HI],
    'proj.|projected|proj. record|projected finish|proj. wins|projected wins|proj. conf|proj. overall': ['Where the hub expects the team to finish, from playing out the rest of the season thousands of times with its power ratings.', ''],
    'playoff odds|makes the playoffs|makes the playoff|makes the field': ['Share of the hub’s season simulations in which the team gets in.', HI],
    'strk|streak': ['The current run of wins (W) or losses (L).', ''],
    'l10|last 10': ['Record in the last 10 games.', HI],
    'luck': ['Actual wins minus the wins a team “should” have from its points scored and allowed. Big gaps tend to shrink as the season goes on.', ''],
    'pyth w-l': ['The record a team “should” have from its points scored and allowed (the Pythagorean formula).', HI],
    'δ 7 days|δ wk|move|change': ['Change since a week ago.', ''],
    'pf': ['Points for: points scored.', HI],
    'pa': ['Points against: points allowed.', LO],
    'gb': ['Games behind the leader.', LO],
    'gp|g|games played': ['Games played.', ''],
    'ap': ['Rank in the AP Top 25 media poll.', ''],
    'coaches': ['Rank in the coaches’ poll.', '']
  };
  var HOOPS = {
    'pts|points': ['Points scored.', HI],
    'reb|rebounds': ['Rebounds: missed shots grabbed, at either end.', HI],
    'ast|assists': ['Assists: passes that lead straight to a made basket.', HI],
    'stl': ['Steals: taking the ball from the other team.', HI],
    'blk': ['Blocked shots.', HI],
    'to|tov': ['Turnovers: losing the ball to the other team.', LO],
    'min': ['Minutes played.', ''],
    'fg': ['Field goals (every shot except free throws), made and tried.', ''],
    'fg%': ['Field-goal percentage: share of shots made, not counting free throws.', HI],
    'ft': ['Free throws, made and tried.', ''],
    'ft%': ['Free-throw percentage.', HI],
    '3p%|3pt%': ['3-point percentage: share of 3-point shots made.', HI],
    '3pm|3pt|3p': ['3-pointers made (and tried).', ''],
    'ppg|points / game': ['Points per game.', HI],
    'allowed / game': ['Points allowed per game.', LO]
  };
  var BY = {
    nba: {
      'ts%|true shooting': ['True shooting: scoring efficiency that counts 3-pointers and free throws. The best single number for how efficiently a player scores.', HI],
      'efg%|effective fg %': ['Effective field-goal percentage: shooting percentage that gives 3-pointers 50% extra credit, since they are worth more.', HI],
      'opp efg%': ['Opponents’ effective field-goal percentage: how well teams shoot against this defense.', LO],
      'usg%': ['Usage rate: the share of the team’s plays a player finishes (with a shot, free throws or a turnover) while on the floor.', ''],
      'ast%': ['The share of teammates’ baskets this player assisted while on the floor.', HI],
      'reb%': ['The share of available rebounds this player grabbed while on the floor.', HI],
      'stl%|steals per 100': ['Steals for every 100 opponent possessions.', HI],
      'blk%|block rate (2s)': ['The share of opponents’ 2-point tries this player blocked.', HI],
      'tov%|turnover %': ['Turnovers for every 100 plays a player or team uses.', LO],
      'ortg|off. rating|offensive rating': ['Points scored per 100 possessions.', HI],
      'drtg|def. rating|defensive rating': ['Points allowed per 100 possessions.', LO],
      'net|net rating': ['Offensive rating minus defensive rating: how many points better than opponents per 100 possessions.', HI],
      'pace': ['Possessions per 48 minutes: how fast a team plays.', ''],
      '+/-|+/- a game': ['Plus-minus: how many points the team outscored opponents by while this player was on the floor.', HI],
      'gmsc': ['Game Score: one number for a player’s whole box score. About 10 is an average game; 40 is outstanding.', HI],
      'rookie score': ['The hub’s Rookie of the Year number: half points per game, half Game Score per game, trimmed for team games missed.', HI],
      '/36': ['Per 36 minutes: stats scaled to 36 minutes so starters and bench players compare fairly.', ''],
      'free throws per shot': ['Free throws made for every shot tried. Higher means getting to the line more.', ''],
      'threes per shot': ['The share of shots that are 3-pointers.', ''],
      'opp. threes per shot': ['The share of opponents’ shots that are 3-pointers.', ''],
      'opp. 3-point %': ['How well opponents shoot from 3.', LO],
      'dd|double-double': ['Double-doubles: 10 or more in two of points, rebounds, assists, steals and blocks.', HI],
      'td': ['Triple-doubles: 10 or more in three of points, rebounds, assists, steals and blocks.', HI],
      'cap %': ['Salary as a share of the salary cap.', ''],
      'luxury tax': ['The payroll line above which a team pays a tax on every dollar over.', ''],
      'first apron|vs 1st apron|vs. 1st apron': ['A payroll level above the tax line. Teams over it lose some trade and signing tools.', ''],
      'second apron|vs 2nd apron|vs. 2nd apron': ['The highest payroll level. Teams over it face the strictest trade and signing limits.', ''],
      'exp': ['Years of NBA experience.', '']
    },
    cbb: {},
    nfl: {
      'off epa': ['Offensive EPA per play: points added on an average play compared with what a typical team gains from the same down, distance and field position.', HI],
      'def epa': ['Defensive EPA per play: points the defense gives up on an average play compared with a typical defense. More negative is better.', LO],
      'yards / play|yards per play': ['Average yards gained on each play.', HI],
      'yards per pass|y/a': ['Yards gained per pass attempt.', HI],
      'yards per rush': ['Yards gained per run.', HI],
      'avg': ['Average yards per carry or per catch.', HI],
      'cmp%': ['Completion percentage: share of passes caught.', HI],
      'c/att|cmp-att|comp / att': ['Passes completed and thrown.', ''],
      'rtg|qb rating': ['NFL passer rating, from completions, yards, touchdowns and interceptions per pass. 158.3 is perfect.', HI],
      'qbr': ['ESPN’s Total QBR, a 0–100 quarterback grade that counts runs, sacks and game situation. 50 is average.', HI],
      'td': ['Touchdowns.', HI],
      'int|interceptions': ['Interceptions: thrown by a quarterback, or caught by a defender.', ''],
      'sk|sacks': ['Sacks: the quarterback tackled behind the line before he can throw.', ''],
      'tfl': ['Tackles for loss: tackles behind the line of scrimmage.', HI],
      'solo': ['Solo tackles: made without help.', HI],
      'tot|tackles': ['Total tackles.', HI],
      'qb hts|qb hits': ['Quarterback hits: hitting the quarterback as or just after he throws.', HI],
      'pd': ['Point differential (in standings), or passes defended (in defensive stats).', HI],
      'fum': ['Fumbles.', LO],
      'lost|fumbles lost': ['Fumbles lost to the other team.', LO],
      'rec': ['Receptions: passes caught.', HI],
      'tgts': ['Targets: passes thrown to this player.', ''],
      'car': ['Carries: running plays.', ''],
      'yds/g|yards / game': ['Yards per game.', HI],
      'long': ['Longest play.', ''],
      'xp': ['Extra points made and tried.', ''],
      'fg': ['Field goals made and tried.', ''],
      'red zone|red zone td %': ['Share of trips inside the opponent’s 20-yard line that end in a touchdown.', HI],
      'in 20': ['Punts that stop inside the opponent’s 20-yard line.', HI],
      'turnover diff|turnover margin': ['Takeaways minus giveaways.', HI],
      'takeaways': ['Turnovers forced: interceptions and fumbles recovered.', HI],
      'giveaways|turnovers': ['Turnovers given up: interceptions thrown and fumbles lost.', LO],
      'possession': ['Time of possession: how long the offense had the ball.', '']
    },
    cfb: {
      'sor': ['Strength of record, the hub’s own: the chance a top-25 caliber team goes this well against the same schedule. Rewards wins over good teams.', HI],
      'cmp%': ['Completion percentage: share of passes caught.', HI],
      'c/att|cmp-att': ['Passes completed and thrown.', ''],
      'rtg|eff': ['College passer efficiency rating: yards, touchdowns, completions and interceptions per pass. Around 140 is average in FBS.', HI],
      'qbr': ['ESPN’s Total QBR, a 0–100 quarterback grade that counts runs, sacks and game situation. 50 is average.', HI],
      'y/a': ['Yards per pass attempt.', HI],
      'avg': ['Average yards per carry or per catch.', HI],
      'td': ['Touchdowns.', HI],
      'int|interceptions': ['Interceptions: thrown by a quarterback, or caught by a defender.', ''],
      'car': ['Carries: running plays.', ''],
      'rec': ['Receptions: passes caught.', HI],
      'yds/g|yards / game': ['Yards per game.', HI],
      'long': ['Longest play.', ''],
      'fum': ['Fumbles.', LO],
      'lost': ['Fumbles lost to the other team.', LO],
      'turnover margin': ['Takeaways minus giveaways.', HI],
      'class score': ['Recruiting class score: the average industry rating of the commits.', HI],
      'blue chips': ['Share of commits rated 4 or 5 stars.', HI],
      'stars': ['Recruiting stars from the recruiting services (5 is the top).', HI],
      'fcs rank': ['Rank in the FCS poll.', '']
    }
  };
  var G = {};
  var add = function(src){ for (var k in src) k.split('|').forEach(function(n){ G[n] = src[k]; }); };
  add(ALL); if (SPORT === 'nba' || SPORT === 'cbb') add(HOOPS); add(BY[SPORT] || {});

  var css = ''
    + ':root .jsh-x{text-decoration:underline dotted;text-decoration-color:color-mix(in srgb,currentColor 45%,transparent);text-underline-offset:3px;text-decoration-thickness:1px;-webkit-tap-highlight-color:transparent}'
    + ':root .jsh-x:not(.jsh-xs){cursor:help}'
    + ':root .jsh-xs{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}'
    + '.jsh-xc{position:fixed;z-index:9990;max-width:min(300px,calc(100vw - 24px));padding:12px 14px;border-radius:14px;'
    + 'background:var(--card,#121826);color:var(--ink,#e8eef8);border:1px solid color-mix(in srgb,var(--line,#2a3448) 80%,var(--accent,#5b8cff));'
    + 'box-shadow:0 12px 34px rgba(0,0,0,.38);font:500 13.5px/1.45 Inter,system-ui,sans-serif;text-align:left;text-transform:none;letter-spacing:0;white-space:normal}'
    + '.jsh-xc b{display:block;font-size:14px;font-weight:800;margin-bottom:3px}'
    + '.jsh-xc .m{margin-top:7px;font-size:12.5px;font-weight:700;color:var(--ink-2,#aab4c5)}'
    + '.jsh-xc .t{margin-top:7px;font-size:12px;color:var(--ink-3,#8f9aac)}'
    + '@media (prefers-reduced-motion:no-preference){.jsh-xc{animation:jshXc .14s ease-out}}@keyframes jshXc{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}';
  var SEL = '#view th, #view .tile .lbl, #view .lbl, #view .pl-pr-k, #view dt, #view .k, #view td[title]:first-child';
  var seen = new WeakSet();
  var clean = function(t){ return String(t || '').replace(/[▲▼↑↓⇅↕]/g, '').replace(/\s+/g, ' ').replace(/\s+i$/, '').trim(); };
  var sortable = function(el){ return el.tagName === 'TH' && (el.classList.contains('sort') || el.hasAttribute('data-sort') || el.hasAttribute('data-asort') || el.hasAttribute('data-k') || el.hasAttribute('data-col') || el.hasAttribute('onclick') || getComputedStyle(el).cursor === 'pointer'); };
  function mark(){
    var v = D.getElementById('view'); if (!v) return;
    v.querySelectorAll(SEL).forEach(function(el){
      if (seen.has(el)) return; seen.add(el);
      if (el.closest('svg,a,button,.jsh-xc')) return;
      if (el.querySelector('a,button,input,select')) return;
      var name = clean(el.textContent); if (!name || name.length > 40) return;
      var own = el.getAttribute('title');
      if (own && own.length > 12) { el.setAttribute('data-xt', own); el.removeAttribute('title'); }
      else if (!G[name.toLowerCase()]) return;
      el.classList.add('jsh-x'); if (sortable(el)) el.classList.add('jsh-xs');
    });
  }

  /* ---------- the card ---------- */
  var card = null, cardFor = null;
  function middle(th){
    var tbl = th.closest('table'); if (!tbl || !tbl.tBodies.length) return '';
    var row = th.parentElement, idx = 0;
    for (var c = row.firstElementChild; c && c !== th; c = c.nextElementSibling) idx += c.colSpan || 1;
    var vals = [];
    Array.prototype.forEach.call(tbl.tBodies[0].rows, function(r){
      var i = 0, cell = null;
      for (var c = r.firstElementChild; c; c = c.nextElementSibling) { if (i === idx) { cell = c; break; } i += c.colSpan || 1; }
      if (!cell) return;
      var t = cell.textContent.trim(), n = parseFloat(t.replace(/[,$%+]/g, '').replace(/^−/, '-'));
      if (/^[−+\-]?\$?[\d.,]+%?$/.test(t) && isFinite(n)) vals.push([n, t]);
    });
    if (vals.length < 8) return '';
    vals.sort(function(a, b){ return a[0] - b[0]; });
    return vals[Math.floor((vals.length - 1) / 2)][1];
  }
  function show(el, held){
    hide();
    var name = clean(el.textContent), own = el.getAttribute('data-xt'), g = G[name.toLowerCase()];
    var text = own || (g && g[0]); if (!text) return;
    var dir = g ? g[1] : '', mid = el.tagName === 'TH' ? middle(el) : '';
    /* rank boxes (team page heroes): the number shown is a place, not the stat itself */
    var pv = el.previousElementSibling; if (el.closest('.rb') && pv && /^#?\d+$/.test(pv.textContent.trim())) { text = 'A rank: 1 is best. ' + text; dir = ''; }
    var meta = [dir, mid ? 'Middle of this table: ' + mid : ''].filter(Boolean).join(' · ');
    var tip = !held && W.matchMedia && matchMedia('(pointer:coarse)').matches && D.querySelector('#view .jsh-xs') ? '<div class="t">Column names that sort a table: press and hold to see what they mean.</div>' : '';
    card = D.createElement('div'); card.className = 'jsh-xc'; card.setAttribute('role', 'tooltip');
    var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
    card.innerHTML = '<b>' + esc(name) + '</b>' + esc(text) + (meta ? '<div class="m">' + esc(meta) + '</div>' : '') + tip;
    D.body.appendChild(card); cardFor = el;
    var r = el.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight, vw = D.documentElement.clientWidth, vh = W.innerHeight;
    var left = Math.max(12, Math.min(r.left + r.width / 2 - cw / 2, vw - cw - 12));
    var top = r.bottom + 8; if (top + ch > vh - 12 && r.top - ch - 8 > 12) top = r.top - ch - 8;
    card.style.left = left + 'px'; card.style.top = Math.max(12, top) + 'px';
  }
  function hide(){ if (card) { card.remove(); card = null; cardFor = null; } }

  /* ---------- taps, holds and hovers ---------- */
  var holdT = 0, holdEl = null, eat = null, sx = 0, sy = 0;
  D.addEventListener('touchstart', function(e){
    var el = e.target.closest && e.target.closest('.jsh-xs'); if (!el) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; holdEl = el;
    holdT = setTimeout(function(){ show(el, true); eat = el; holdT = 0; }, 450);
  }, {passive: true});
  D.addEventListener('touchmove', function(e){ if (holdT && (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8)) { clearTimeout(holdT); holdT = 0; } }, {passive: true});
  D.addEventListener('touchend', function(){ if (holdT) { clearTimeout(holdT); holdT = 0; } }, {passive: true});
  D.addEventListener('contextmenu', function(e){ if (e.target.closest && e.target.closest('.jsh-xs')) e.preventDefault(); });
  W.addEventListener('click', function(e){
    var t = e.target;
    if (eat && t.closest && t.closest('.jsh-xs') === eat) { e.preventDefault(); e.stopPropagation(); eat = null; return; }
    eat = null;
    if (card && !card.contains(t)) { var was = cardFor; hide(); if (t.closest && t.closest('.jsh-x') === was) return; }
    var el = t.closest && t.closest('.jsh-x:not(.jsh-xs)'); if (el) show(el, false);
  }, true);
  var hovT = 0;
  if (W.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    D.addEventListener('mouseover', function(e){ var el = e.target.closest && e.target.closest('.jsh-x'); if (!el || el === cardFor) return; clearTimeout(hovT); hovT = setTimeout(function(){ show(el, true); }, 450); });
    D.addEventListener('mouseout', function(e){ var el = e.target.closest && e.target.closest('.jsh-x'); if (!el) return; if (e.relatedTarget && el.contains(e.relatedTarget)) return; clearTimeout(hovT); if (cardFor === el) hide(); });
  }
  W.addEventListener('scroll', function(){ if (card) hide(); }, {passive: true, capture: true});
  W.addEventListener('hashchange', hide);
  D.addEventListener('keydown', function(e){ if (e.key === 'Escape') hide(); });

  function start(){
    var s = D.createElement('style'); s.id = 'jsh-explain'; s.textContent = css; (D.head || D.documentElement).appendChild(s);
    var v = D.getElementById('view'); if (!v) return;
    var q = 0; new MutationObserver(function(){ if (!q) q = setTimeout(function(){ q = 0; mark(); }, 150); }).observe(v, {childList: true, subtree: true});
    mark();
  }
  if (D.body) start(); else D.addEventListener('DOMContentLoaded', start);
})();
/* explain:end */
