import {
  useEffect,
  useState,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';

/** Stand-in for canvas host theme; font weight only. */
const theme = { weight: { semibold: 600 as const } };

const STORAGE_KEY = 'construction-mastery-estimators-quest-v1';
const BACKUP_KEY = 'construction-mastery-estimators-quest-v1-backup';
const SCROLL_PREFIX = 'CMQ1.';
const SESSION_Q = 5;
const BASE_XP = 25;
const STREAK_STEP = 5;
const STREAK_CAP = 25;
const PERFECT_BONUS = 50;
const BID_XP = 40;
const BID_PERFECT_BONUS = 80;
const BID_PERFECT_SOULS = 2;
const LEGENDARY_LEVEL = 15;

const C = {
  void: '#0b0a08',
  stone: '#1b1813',
  stoneHi: '#2a251c',
  ink: '#efe4cf',
  inkDim: '#b7a78e',
  inkMute: '#8a7a64',
  gold: '#d4af37',
  goldSoft: '#e8d48b',
  goldDim: '#8a7020',
  parch: '#d9c9a6',
  parchDeep: '#c4b18a',
  parchInk: '#2a2118',
  parchMute: '#5c4e3a',
  line: '#3b3428',
  success: '#3f6b3a',
  successInk: '#d7ecd0',
  danger: '#7a2b2b',
  dangerInk: '#f0d4d0',
  sky: '#070b14',
  star: '#f0e6c8',
  ember: '#c45c26',
  emberSoft: '#e08a4a',
  frost: '#7aa0b8',
  frostSoft: '#c5dce8',
  health: '#8b2e2e',
  magicka: '#3d5a8a',
  stamina: '#9a6b24',
  iron: '#3a362e',
  ironHi: '#5a5448',
};
const FONT_DISPLAY = 'Cinzel, Palatino, "Palatino Linotype", "Book Antiqua", Times, serif';
const FONT_DECO = '"Cinzel Decorative", Cinzel, Palatino, serif';
const FONT_BODY = '"Source Serif 4", Palatino, "Palatino Linotype", Georgia, "Times New Roman", serif';

const HALL_CSS = '@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap"); .cm-root { font-family: ' + FONT_BODY + '; overflow-x: hidden; overflow-wrap: break-word; } .cm-root button { font-family: ' + FONT_DISPLAY + '; } .cm-noise { pointer-events: none; position: fixed; inset: 0; opacity: 0.07; z-index: 2; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27180%27 height=%27180%27 filter=%27url(%23n)%27 opacity=%270.9%27/%3E%3C/svg%3E"); } @media (max-width: 560px) { .cm-root { font-size: 15px; } .cm-nav button { letter-spacing: 0.06em !important; font-size: 11px !important; padding: 10px 8px !important; } } .cm-root button:focus-visible { outline: 2px solid ' + C.gold + '; outline-offset: 2px; } @keyframes cm-skillup { 0% { opacity: 0; transform: translateY(10px); } 18% { opacity: 1; transform: none; } 75% { opacity: 1; } 100% { opacity: 0; } } @keyframes cm-pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.28; } } @keyframes cm-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } } @keyframes cm-pop { 0% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -70px) scale(0.3); } } @keyframes cm-glowpulse { 0%,100% { box-shadow: none; } 40% { box-shadow: inset 0 0 80px #d4b46a44, 0 0 40px #d4b46a55; } } .cm-skillup { animation: cm-skillup 2.6s ease forwards; } .cm-pulse { animation: cm-pulse 2.2s ease-in-out infinite; } .cm-bar { transition: width 0.55s ease; } .cm-shake { animation: cm-shake 0.4s ease; } .cm-glow { animation: cm-glowpulse 0.5s ease; } .cm-bit { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: #e8d5a3; pointer-events: none; animation: cm-pop 0.8s ease forwards; z-index: 30; } @keyframes cm-twinkle { 0%,100% { opacity: 0.18; } 50% { opacity: 0.9; } } @keyframes cm-draw { from { stroke-dashoffset: 90; } to { stroke-dashoffset: 0; } } .cm-twinkle { animation: cm-twinkle 3.1s ease-in-out infinite; } .cm-draw { stroke-dasharray: 90; animation: cm-draw 0.95s ease-out forwards; } @media (prefers-reduced-motion: reduce) { .cm-skillup, .cm-pulse, .cm-shake, .cm-bit, .cm-glow, .cm-twinkle, .cm-draw { animation: none !important; } .cm-bar { transition: none !important; } } .cm-reduce .cm-skillup, .cm-reduce .cm-pulse, .cm-reduce .cm-shake, .cm-reduce .cm-bit, .cm-reduce .cm-glow, .cm-reduce .cm-twinkle, .cm-reduce .cm-draw { animation: none !important; } .cm-reduce .cm-bar { transition: none !important; } @keyframes cm-snow { 0% { transform: translateY(-12px); opacity: 0; } 12% { opacity: 0.7; } 100% { transform: translateY(110vh); opacity: 0; } } @keyframes cm-flicker { 0%,100% { opacity: 0.4; } 40% { opacity: 0.82; } 72% { opacity: 0.32; } } @keyframes cm-aurora { 0%,100% { opacity: 0.2; transform: translateX(0); } 50% { opacity: 0.46; transform: translateX(10px); } } @keyframes cm-discover { 0% { opacity: 0; letter-spacing: 0.42em; } 14% { opacity: 1; letter-spacing: 0.18em; } 78% { opacity: 1; } 100% { opacity: 0; } } @keyframes cm-cinema { from { opacity: 0; } to { opacity: 1; } } @keyframes cm-slowveil { 0%,100% { opacity: 0.08; } 50% { opacity: 0.18; } } .cm-snow { position: fixed; top: -8px; border-radius: 50%; background: #e8f0ff; pointer-events: none; z-index: 3; animation: cm-snow linear infinite; } .cm-flicker { animation: cm-flicker 2.8s ease-in-out infinite; } .cm-aurora { animation: cm-aurora 7s ease-in-out infinite; } .cm-discover { animation: cm-discover 4.1s ease forwards; } .cm-cinema-line { animation: cm-cinema 0.9s ease both; } .cm-slowveil { animation: cm-slowveil 2.4s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .cm-snow, .cm-flicker, .cm-aurora, .cm-discover, .cm-cinema-line, .cm-slowveil { animation: none !important; } } .cm-reduce .cm-snow, .cm-reduce .cm-flicker, .cm-reduce .cm-aurora, .cm-reduce .cm-discover, .cm-reduce .cm-cinema-line, .cm-reduce .cm-slowveil { animation: none !important; } .cm-btn { transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease, background-color 0.12s ease; will-change: transform; } .cm-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); } .cm-btn:active:not(:disabled) { transform: translateY(1px); filter: brightness(0.95); } .cm-btn-gold:hover:not(:disabled) { box-shadow: inset 0 1px 0 #ffffff44, 0 0 16px var(--cm-glow, #d4af3766), 0 1px 0 #00000066; } .cm-btn-wide { width: 100%; max-width: 420px; } .cm-opt { transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease; will-change: transform; } .cm-opt:hover:not(:disabled) { transform: translateX(3px); box-shadow: 0 0 0 1px var(--cm-gold, #d4af37); } .cm-opt:active:not(:disabled) { transform: translateX(1px); } @keyframes cm-view-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } } .cm-view { animation: cm-view-in 0.32s ease both; } @keyframes cm-ok-flash { 0%,100% { box-shadow: inset 0 0 0 0 transparent; } 40% { box-shadow: inset 0 0 70px #3f6b3a55, 0 0 28px #3f6b3a44; } } @keyframes cm-miss-flash { 0%,100% { box-shadow: inset 0 0 0 0 transparent; } 40% { box-shadow: inset 0 0 70px #7a2b2b55, 0 0 28px #7a2b2b44; } } .cm-q-ok { animation: cm-ok-flash 0.6s ease; } .cm-q-miss { animation: cm-miss-flash 0.6s ease; } @keyframes cm-level-in { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } } .cm-level-in { animation: cm-level-in 0.45s ease both; } @keyframes cm-load-pulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } } .cm-load-seal { animation: cm-load-pulse 1.8s ease-in-out infinite; transform-origin: center; } .cm-nav { position: relative; } .cm-nav:before, .cm-nav:after { content: ""; position: absolute; top: 4px; bottom: 4px; width: 10px; pointer-events: none; border-top: 1px solid var(--cm-gold, #d4af37); border-bottom: 1px solid var(--cm-gold, #d4af37); opacity: 0.7; } .cm-nav:before { left: 4px; border-left: 1px solid var(--cm-gold, #d4af37); } .cm-nav:after { right: 4px; border-right: 1px solid var(--cm-gold, #d4af37); } .cm-empty { text-align: center; padding: 8px 8px 2px; } .cm-pip { transition: transform 0.2s ease, background-color 0.2s ease; } .cm-main-heading:focus { outline: none; } @media (prefers-reduced-motion: reduce) { .cm-view, .cm-btn, .cm-opt, .cm-q-ok, .cm-q-miss, .cm-level-in, .cm-load-seal, .cm-pip { animation: none !important; transition: none !important; } } .cm-reduce .cm-view, .cm-reduce .cm-btn, .cm-reduce .cm-opt, .cm-reduce .cm-q-ok, .cm-reduce .cm-q-miss, .cm-reduce .cm-level-in, .cm-reduce .cm-load-seal, .cm-reduce .cm-pip { animation: none !important; transition: none !important; }';

type SkillId =
  | 'conc'
  | 'mas'
  | 'met'
  | 'wood'
  | 'therm'
  | 'open'
  | 'fin'
  | 'fire'
  | 'plumb'
  | 'hvac'
  | 'elec'
  | 'fa'
  | 'site'
  | 'est'
  | 'qto'
  | 'unit'
  | 'gc'
  | 'level'
  | 'gaps'
  | 'markup'
  | 'risk'
  | 'strategy'
  | 'contract';

type PerkDef = { id: string; name: string; level: number; concept: string };
type SkillDef = { id: SkillId; name: string; csi: string; lore: string; rune: string; perks: PerkDef[] };
type Question = { id: string; skill: SkillId | 'bid'; q: string; c: string[]; a: number; x: string; kind?: 'mc' | 'tf' | 'num'; num?: { value: number; tol: number; unit: string } };
type SkillSave = { xp: number; perks: string[]; legendary: number };
type Save = {
  v: number;
  skills: Record<SkillId, SkillSave>;
  charXp: number;
  souls: number;
  streak: number;
  bestStreak: number;
  answered: Record<string, boolean>;
  dailyDate: string;
  dailyDone: string[];
  loreRead: string[];
  bidBest: number;
  introSeen: boolean;
  loginStreak: number;
  lastLogin: string;
  haunted: Record<string, { misses: number; rights: number; due?: string }>;
  codex: string[];
  campaignDone: string[];
  achievements: string[];
  perfects: number;
  trials: number;
  settings: { motion: 'auto' | 'full' | 'reduce'; text: 'sm' | 'md' | 'lg'; sound?: boolean };
  history: { t: string; text: string }[];
  loginRewards: string[];
  cosmetics?: { owned: string[]; title?: string; banner?: string; theme?: string };
  discovered?: string[];
  sideDone?: string[];
  cinemaSeen?: boolean;
  lastSaved?: string;
  activeTrial?: {
    view: 'quiz' | 'bid';
    focus?: SkillId;
    session: {
      mode: 'skill' | 'bid' | 'haunt' | 'camp' | 'boss';
      skill: SkillId | 'bid';
      chapter?: string;
      ids: string[];
      index: number;
      items: { id: string; picked: number; correct: boolean; xp: number }[];
      hint: boolean;
      show: boolean;
      done: boolean;
      order: number[];
      numDraft: string;
      startSouls: number;
      startCodex: string[];
      bonusXp: number;
      shoutSlow?: boolean;
      encounter?: 'sub' | 'rfi';
    };
  } | null;
};
type LevelInfo = { level: number; into: number; need: number };
type View = 'title' | 'hall' | 'skills' | 'skill' | 'quiz' | 'bid' | 'quests' | 'codex' | 'sheet' | 'campaign' | 'trophies' | 'haunt' | 'settings' | 'shop';
type Toast = { id: number; kind: 'skill' | 'soul' | 'xp' | 'rank' | 'achieve' | 'discover'; text: string };
type QuizItem = { id: string; picked: number; correct: boolean; xp: number };
type QuizSession = {
  mode: 'skill' | 'bid' | 'haunt' | 'camp' | 'boss';
  skill: SkillId | 'bid';
  chapter?: string;
  ids: string[];
  index: number;
  items: QuizItem[];
  hint: boolean;
  show: boolean;
  done: boolean;
  order: number[];
  numDraft: string;
  startSouls: number;
  startCodex: string[];
  bonusXp: number;
  shoutSlow?: boolean;
  encounter?: 'sub' | 'rfi';
};

const SKILLS: SkillDef[] = [
  { id: 'conc', name: 'Concrete', csi: '03', rune: 'ᚷ', lore: 'In the Age of Pouring, the first Masters learned that stone could be born of dust, water, and patience. The twenty-eighth dawn is sacred — not because the work ends, but because that is when the realm agrees to measure its strength.', perks: [
    { id: 'conc-28', name: 'Twenty-Eighth Dawn', level: 20, concept: 'Specified compressive strength (f’c) is normally tested at 28 days.' },
    { id: 'conc-wc', name: 'Water-Cement Covenant', level: 40, concept: 'A higher water-cement ratio generally lowers strength and durability.' },
    { id: 'conc-cure', name: 'Curekeeper', level: 60, concept: 'Curing keeps moisture and temperature so hydration can continue; strength still rises after 28 days.' },
    { id: 'conc-cold', name: 'Winter Pour Ward', level: 80, concept: 'Do not place on frozen subgrade; protect fresh concrete from freezing and expect slower strength gain in the cold.' },
    { id: 'conc-cover', name: 'Chair-and-Cover Eye', level: 100, concept: 'Chairs and dobies hold reinforcement at the specified cover; missing them is a classic field and estimate gap.' },
  ]},
  { id: 'mas', name: 'Masonry', csi: '04', rune: 'ᛖ', lore: 'The block is a humble unit, yet kingdoms of wall rest on its bed of mortar. Count the courses, mind the bond, and never forget the flashing that keeps the rain in its proper realm.', perks: [
    { id: 'mas-mod', name: 'Modular Reckoning', level: 20, concept: 'A standard CMU is nominally 8x8x16; the actual unit is 3/8 inch less to allow a mortar joint on an 8-inch module.' },
    { id: 'mas-bond', name: 'Bond-Beam Vision', level: 40, concept: 'Bond beams, lintels, and grouted cells with rebar are the structural backbone of the wall — easy to miss in a takeoff.' },
    { id: 'mas-mort', name: 'Mortar of Four Types', level: 60, concept: 'ASTM C270 Types M, S, N, and O: Type S and N are common commercially; Type M for heavier or below-grade work; Type O for interior non-loadbearing.' },
    { id: 'mas-weep', name: 'Flashing & Weep', level: 80, concept: 'Through-wall flashing and weeps drain the cavity; missing them is a leak and a punch-list dragon.' },
    { id: 'mas-scaff', name: 'Scaffold Reckoner', level: 100, concept: 'Masonry production follows scaffold, hoisting, and weather; winter protection moves both cost and schedule.' },
  ]},
  { id: 'met', name: 'Metals', csi: '05', rune: 'ᛏ', lore: 'Steel remembers the shop that birthed it. Measure twice in the detailing room, for the field will not forgive a missed connection or an anchor rod that never made the pour.', perks: [
    { id: 'met-shop', name: 'Shop-to-Field Eye', level: 20, concept: 'Structural steel is fabricated off-site from approved shop drawings; detailing and approval sit on the critical path.' },
    { id: 'met-conn', name: 'Connection Reckoner', level: 40, concept: 'Tonnage alone underprices a job; bolts, welds, and moment connections drive hours.' },
    { id: 'met-embed', name: 'Embed Seer', level: 60, concept: 'Embed plates and anchor rods must be on site before the concrete pour that receives them.' },
    { id: 'met-misc', name: 'Misc. Metals Hunter', level: 80, concept: 'Stairs, rails, ladders, and loose lintels often live in Division 05 and get split among bidders.' },
    { id: 'met-lead', name: 'Lead-Time Watch', level: 100, concept: 'Joists, deck, and fabricated steel lead times can govern the schedule as surely as the erection plan.' },
  ]},
  { id: 'wood', name: 'Wood & Millwork', csi: '06', rune: 'ᚠ', lore: 'The 2x4 is a liar by name. Trust the dressed size, and beware the cabinet that waits on blocking that was never installed. Grade, tops, and install are the true bid, not the pretty elevation.', perks: [
    { id: 'wood-true', name: 'True Measure', level: 20, concept: 'A 2x4 actually measures 1-1/2 x 3-1/2 inches; nominal sizes are before drying and planing.' },
    { id: 'wood-awi', name: 'AWI Judge', level: 40, concept: 'AWI grades are Economy, Custom, and Premium. Custom is the usual commercial default; Premium costs more.' },
    { id: 'wood-block', name: 'Blocking Prophet', level: 60, concept: 'In-wall blocking for cabinets and rails is typically framing or drywall scope, not the millwork sub.' },
    { id: 'wood-split', name: 'Furnish-or-Install Eye', level: 80, concept: 'Level millwork bids on grade, furnish vs. install, hardware, and whether countertops are included.' },
    { id: 'wood-path', name: 'Critical-Path Cabinet', level: 100, concept: 'Millwork needs shop drawings, samples, and field measures before fabrication — often on the critical path.' },
  ]},
  { id: 'therm', name: 'Thermal & Moisture', csi: '07', rune: 'ᛉ', lore: 'Water is a patient enemy. The wall that is flashed, the roof that drains, and the joint that flexes will outlive the one that merely looks tight on bid day.', perks: [
    { id: 'therm-wrb', name: 'WRB Sentinel', level: 20, concept: 'A water-resistive barrier stops bulk water that gets past the cladding; continuity at openings and roof ties is where envelopes fail.' },
    { id: 'therm-roof', name: 'Roof Assembly Eye', level: 40, concept: 'Level roof bids on membrane, insulation and taper, flashings, warranty, and deck conditions — not square footage alone.' },
    { id: 'therm-joint', name: 'Joint Master', level: 60, concept: 'Backer rod controls sealant depth and shape so the joint can move; expansion joints must be sized for movement.' },
    { id: 'therm-fire', name: 'Firestopping Seer', level: 80, concept: 'Penetration firestopping (often 07 84 00) is a common scope gap, sometimes left to each penetrating trade.' },
    { id: 'therm-ci', name: 'Thermal-Bridge Reckoner', level: 100, concept: 'Continuous insulation and vapor-retarder placement depend on climate; shelves and canopies are classic thermal bridges.' },
  ]},
  { id: 'open', name: 'Openings', csi: '08', rune: 'ᛁ', lore: 'A door is a hole that must keep fire, sound, and weather in their proper rooms. The hardware schedule is the true drawing, and a rated leaf is only as true as its frame and closer.', perks: [
    { id: 'open-hw', name: 'Hardware Scheduler', level: 20, concept: 'The hardware set — closers, exit devices, access control — often drives cost more than the door leaf.' },
    { id: 'open-fire', name: 'Fire-Door Guardian', level: 40, concept: 'A rated door needs a listed frame and hardware and must self-close and latch; field cuts and extra louvers can void the listing.' },
    { id: 'open-cw', name: 'Storefront vs. Curtain Wall', level: 60, concept: 'Storefront is typically a lighter, low-rise system; curtain wall hangs from the structure and can span floor to floor, and costs more.' },
    { id: 'open-ada', name: 'ADA Threshold Watch', level: 80, concept: 'Maneuvering clearances, closer effort, thresholds, and a 1:12 max ramp running slope are frequent punch-list items.' },
    { id: 'open-lead', name: 'Glazing Lead-Time', level: 100, concept: 'Custom glass and electrified hardware have long leads; coordinate openings with Division 28 access control.' },
  ]},
  { id: 'fin', name: 'Finishes', csi: '09', rune: 'ᚱ', lore: 'The wall you cannot see is the one that saves lives. Type X stands in the fire; the level of finish is what the owner will touch, and a wet slab will betray the flooring that was installed too soon.', perks: [
    { id: 'fin-x', name: 'Type X Beacon', level: 20, concept: 'Type X gypsum is fire-rated board with glass fibers in the core, used in rated walls, corridors, shafts, and separations.' },
    { id: 'fin-lvl', name: 'Level-Five Seer', level: 40, concept: 'Level 4 is the common finish under typical paint; Level 5 is for critical lighting or gloss that would telegraph the surface.' },
    { id: 'fin-ul', name: 'Tested-Assembly Oath', level: 60, concept: 'Fire- and sound-rated walls must follow the tested design (UL or GA); swapping board or studs can void the rating.' },
    { id: 'fin-moist', name: 'Slab-Moisture Watch', level: 80, concept: 'Resilient flooring often requires slab moisture (and sometimes pH) testing; mitigation is a frequent extra.' },
    { id: 'fin-act', name: 'ACT Grid Reckoner', level: 100, concept: 'Acoustical ceilings must account for cuts at lights, sprinklers, diffusers, and devices.' },
  ]},
  { id: 'fire', name: 'Fire Suppression', csi: '21', rune: 'ᚴ', lore: 'The heads are only the visible stars. The true system is water, pressure, hazard class, and a design the fire marshal will sign. On a TI, the hidden question is what of the old system still lives.', perks: [
    { id: 'fire-hyd', name: 'Hydraulic Sage', level: 20, concept: 'NFPA 13 governs commercial sprinkler design; Light, Ordinary, and Extra Hazard classifications drive density, heads, and cost.' },
    { id: 'fire-db', name: 'Design-Build Seer', level: 40, concept: 'The sprinkler sub usually designs the system, runs hydraulic calculations, and submits shop drawings to the AHJ.' },
    { id: 'fire-dry', name: 'Wet & Dry Judge', level: 60, concept: 'Wet systems hold water in the pipes and are the common, lower-cost type. Dry systems serve freeze-prone spaces and cost more.' },
    { id: 'fire-ti', name: 'TI Scope Leveler', level: 80, concept: 'Relocating heads costs far less than a new system; unclear existing conditions make sprinkler bids diverge.' },
    { id: 'fire-tamper', name: 'Watch of Switches', level: 100, concept: 'Flow and tamper monitoring belongs to Division 28. Also level design fees, fire-flow tests, shutdowns, and backflow at the riser.' },
  ]},
  { id: 'plumb', name: 'Plumbing', csi: '22', rune: 'ᛇ', lore: 'Three rivers run through every building: one pushed by pressure, two that yield to gravity. Count the fixtures, and you have counted much of the work — unless the slab must be cut to let a new restroom be born.', perks: [
    { id: 'plumb-three', name: 'Three-River Scholar', level: 20, concept: 'Domestic water is pressurized supply; DWV (Drain, Waste, Vent) is gravity; storm drainage often handles roof drains and overflows.' },
    { id: 'plumb-fix', name: 'Fixture-Count Oracle', level: 40, concept: 'A quick sanity check of a plumbing bid is cost per fixture against the fixture schedule.' },
    { id: 'plumb-slab', name: 'Slab-Cut Prophet', level: 60, concept: 'Adding a restroom in a slab-on-grade TI usually means saw cutting, trenching, and patching — and someone must carry the patch.' },
    { id: 'plumb-grease', name: 'Interceptor Watch', level: 80, concept: 'Grease interceptors are a big-ticket plumbing cost on restaurant and kitchen TIs.' },
    { id: 'plumb-cap', name: 'Capacity Seer', level: 100, concept: 'Check whether the existing water heater, water service, sanitary, and gas can serve the new fixture load.' },
  ]},
  { id: 'hvac', name: 'HVAC', csi: '23', rune: 'ᚰ', lore: 'Air is a material you cannot stack on a pallet. Tonnage, CFM, and the existing rooftop unit will decide your fate at bid time, and controls will try to slip out of the lump sum.', perks: [
    { id: 'hvac-load', name: 'Load-Calc Watch', level: 20, concept: 'Equipment is sized from heating and cooling loads, not from square footage alone.' },
    { id: 'hvac-exist', name: 'Existing-Unit Seer', level: 40, concept: 'On a TI, ask first whether existing RTUs, ducts, and VAV boxes can serve the new layout and occupancy.' },
    { id: 'hvac-duct', name: 'Ductwork Eye', level: 60, concept: 'Duct distribution, lining or wrap, and above-ceiling coordination with structure and other trades drive labor.' },
    { id: 'hvac-ctrl', name: 'Controls Split', level: 80, concept: 'DDC controls may be in the mechanical bid or a separate vendor; sequences of operation are a scope minefield.' },
    { id: 'hvac-tab', name: 'TAB & Commissioning', level: 100, concept: 'Testing, adjusting, and balancing, plus start-up and commissioning, are often allowances or exclusions.' },
  ]},
  { id: 'elec', name: 'Electrical', csi: '26', rune: 'ᚾ', lore: 'The panel is a gate. If the load cannot pass, the bid must grow a feeder, a switchboard, and a season of utility time. EMT is the common path of the commercial interior; Article 220 is the law of the load.', perks: [
    { id: 'elec-220', name: 'Article 220 Sentinel', level: 20, concept: 'Panel and conductor sizing is driven by load calculations under NEC Article 220.' },
    { id: 'elec-emt', name: 'EMT Scholar', level: 40, concept: 'EMT means Electrical Metallic Tubing — the thin-wall conduit used in most commercial interiors.' },
    { id: 'elec-svc', name: 'Service-Upgrade Seer', level: 60, concept: 'Kitchens, large HVAC, and EV chargers can force a panel, feeder, or utility service upgrade, with long lead times and fees.' },
    { id: 'elec-gear', name: 'Gear Lead-Time', level: 80, concept: 'Switchgear, transformers, and generators have had very long lead times and can hit the schedule as hard as the budget.' },
    { id: 'elec-ltg', name: 'Lighting-Controls Eye', level: 100, concept: 'Energy-code lighting controls and fixture packages are a large part of many electrical numbers and a frequent bid split.' },
  ]},
  { id: 'fa', name: 'Fire Alarm & Low Voltage', csi: '28', rune: 'ᛚ', lore: 'A silent switch is a useless guardian. Every flow switch, door holder, and strobe must speak to the panel, and the panel to the watch. Pathways and power often belong to another guild.', perks: [
    { id: 'fa-72', name: 'Seventy-Two Scholar', level: 20, concept: 'NFPA 72 is the fire alarm standard; device layout follows occupancy, detection, and notification rules, not a raw square-foot count.' },
    { id: 'fa-tie', name: 'Trade-Tie Seer', level: 40, concept: 'Fire alarm ties to sprinkler switches, HVAC shutdown, elevator recall, and door holders — classic multi-trade coordination.' },
    { id: 'fa-path', name: 'Pathway & Power Split', level: 60, concept: 'Conduit and 120V power may be Division 26, while devices, cabling, and programming are Division 28.' },
    { id: 'fa-acc', name: 'Access-Control Border', level: 80, concept: 'Electrified openings, security, and fire alarm must be leveled together so egress doors fail safe on alarm as required.' },
    { id: 'fa-mon', name: 'Monitoring & Final', level: 100, concept: 'Programming, AHJ testing, and central-station monitoring are real scope — and common exclusions.' },
  ]},
  { id: 'site', name: 'Sitework', csi: '31–33', rune: 'ᚨ', lore: 'The earth does not care about your lump-sum number. Unsuitable soils, buried utilities, and a wet week will rewrite it. The wise estimator prices what can be seen and unit-prices what cannot.', perks: [
    { id: 'site-soil', name: 'Unsuitable-Soils Watch', level: 20, concept: 'Over-excavation, import, and unsuitable soils are the classic allowance versus lump-sum battleground.' },
    { id: 'site-util', name: 'Potholer’s Gift', level: 40, concept: 'Potholing verifies existing underground utilities before you hit them; unknown lines are a prime change-order risk.' },
    { id: 'site-swppp', name: 'SWPPP Guardian', level: 60, concept: 'A Stormwater Pollution Prevention Plan and erosion control are required on many sites and easy to under-scope.' },
    { id: 'site-pave', name: 'Paving-Section Reckoner', level: 80, concept: 'Asphalt and concrete paving follow section thickness, base, and subgrade prep, not square footage alone.' },
    { id: 'site-unit', name: 'Unit-Price Eye', level: 100, concept: 'Use unit prices or allowances for hidden conditions such as rock, buried debris, and uncertain import or over-ex quantities.' },
  ]},
  { id: 'est', name: 'General Conditions & Estimating', csi: '00–01', rune: 'ᛗ', lore: 'The clean number beats the cheap number. Scope gaps are the dragons; general conditions are the camp, the watch, and the winter stores. Bid day is won in the takeoff you already checked.', perks: [
    { id: 'est-gap', name: 'Scope-Gap Hunter', level: 20, concept: 'Level sub bids on inclusions, exclusions, and alternates. The complete number beats the cheap one.' },
    { id: 'est-csi', name: 'CSI Compass', level: 40, concept: 'MasterFormat divisions are the map of the bid; knowing what lives in 03 through 33 keeps work from falling through.' },
    { id: 'est-gc', name: 'General-Conditions Steward', level: 60, concept: 'Staffing, trailers, temp utilities, toilets, and dumpsters scale with duration, not only with building area.' },
    { id: 'est-ada', name: 'ADA & Code Watch', level: 80, concept: 'Accessibility (including a 1:12 maximum ramp running slope) and AHJ comments are frequent late costs if they were never in the estimate.' },
    { id: 'est-bid', name: 'Bid-Day Commander', level: 100, concept: 'Alternates, unit prices, bonds, insurance, and the proposal form are as important as the trade numbers.' },
  ]},
];

const EST_SKILLS: SkillDef[] = [
  { id: 'qto', name: 'Quantity Takeoff', csi: 'EST', rune: 'ᛟ', lore: 'Every clean number begins as a count, a length, an area, or a volume. Measure from the dressed size, not the lying name, and never count the same footing twice.', perks: [
    { id: 'qto-unit', name: 'Unit Tongue', level: 20, concept: 'Common takeoff units include SF, LF, CY, EA, and TN. Concrete volume is usually in cubic yards (CY).' },
    { id: 'qto-cy', name: 'The Twenty-Seven Law', level: 40, concept: 'Cubic yards = length × width × thickness in feet, divided by 27. Convert inches to feet before you divide.' },
    { id: 'qto-net', name: 'Net then Waste', level: 60, concept: 'Calculate the net quantity first, then add a labeled waste factor. A 10% waste add-on is a common rule of thumb, and should be called approximate unless the spec says otherwise.' },
    { id: 'qto-true', name: 'True Dimension', level: 80, concept: 'Use actual dressed sizes in thickness takeoffs. A 2x4 is 3-1/2 inches deep, not 4.' },
    { id: 'qto-once', name: 'Count It Once', level: 100, concept: 'Do not double-count the same work in two units or two packages. Footings, flashing, and blocking are classic double-counts.' },
  ]},
  { id: 'unit', name: 'Unit Pricing & Production', csi: 'EST', rune: 'ᚹ', lore: 'A unit price is a story about material, hours, and tools. Production rates write the labor chapter; a copied $/SF from another job is only a rumor until you prove it.', perks: [
    { id: 'unit-build', name: 'Price Anatomy', level: 20, concept: 'A unit price generally includes material, labor, and often equipment for that unit of work.' },
    { id: 'unit-prod', name: 'Production Pulse', level: 40, concept: 'Labor hours are roughly quantity divided by the production rate. Slower production raises the unit cost.' },
    { id: 'unit-waste', name: 'Waste Margin', level: 60, concept: 'Waste is commonly added after the net takeoff. Any percentage you carry should be labeled as a rule of thumb unless specified.' },
    { id: 'unit-plug', name: 'Plug with a Label', level: 80, concept: 'A historical $/SF can be a sanity check or a labeled plug. It is not, by itself, a bid for this job.' },
    { id: 'unit-up', name: 'When Units Shine', level: 100, concept: 'Unit prices are especially useful when quantities may change in the field, such as over-excavation or rock.' },
  ]},
  { id: 'gc', name: 'General Conditions', csi: '01', rune: 'ᚴ', lore: 'The camp costs money for every week it stands. Staff, trailers, toilets, power, and dumpsters live on the calendar, not only on the building area.', perks: [
    { id: 'gc-time', name: 'Calendar Steward', level: 20, concept: 'General conditions typically increase when the project duration grows.' },
    { id: 'gc-stuff', name: 'Camp & Watch', level: 40, concept: 'Staffing, trailers, temporary utilities, toilets, and dumpsters are classic general-conditions items and easy to miss or double-count.' },
    { id: 'gc-fee', name: 'Not the Fee', level: 60, concept: 'General conditions are job-cost to run the work. Fee is markup. They are not the same line.' },
    { id: 'gc-check', name: 'Rich-Camp Warning', level: 80, concept: 'A historical sanity check is that GCs often land around a little over a tenth of the base and scale with months. If GCs and fee together look rich, expect a debrief. Treat that as an approximate check, not a target.' },
    { id: 'gc-once', name: 'Assign It Once', level: 100, concept: 'Temporary facilities and utilities must be clearly assigned to general conditions or to a sub — once, and only once.' },
  ]},
  { id: 'level', name: 'Bid Leveling', csi: 'EST', rune: 'ᛚ', lore: 'Two numbers are not a comparison until they describe the same work. Level inclusions, exclusions, quantities, and alternates before you honor the low bid.', perks: [
    { id: 'level-first', name: 'Level First', level: 20, concept: 'When two sub bids differ a lot, the first job is to level the scope, not to pick the lowest number.' },
    { id: 'level-list', name: 'The Five Lenses', level: 40, concept: 'Level inclusions, exclusions, alternates, quantities, and furnish-versus-install.' },
    { id: 'level-cheap', name: 'Complete Beats Cheap', level: 60, concept: 'A low bid missing patch, firestopping, design fees, or install is a risk, not a bargain.' },
    { id: 'level-late', name: 'Unleveled Late Number', level: 80, concept: 'A last-minute quote you have not leveled is not yet a number you can trust.' },
    { id: 'level-avg', name: 'No False Average', level: 100, concept: 'Do not average two unlike scopes. Make them the same work, then compare.' },
  ]},
  { id: 'gaps', name: 'Scope Gaps', csi: 'EST', rune: 'ᛜ', lore: 'The work that nobody claimed will still get built, and you will pay for it. Assign every split item to exactly one sub or a GC line.', perks: [
    { id: 'gaps-assign', name: 'One Owner Each', level: 20, concept: 'Assign each split-scope item to exactly one subcontractor or a general-conditions line.' },
    { id: 'gaps-classic', name: 'The Usual Dragons', level: 40, concept: 'Classic gaps include firestopping, in-wall blocking, slab patch after saw-cutting, roof curbs, TAB, gas piping, and sprinkler-switch monitoring.' },
    { id: 'gaps-28', name: 'The Quiet Tie-In', level: 60, concept: 'Flow and tamper switches are furnished with sprinklers, but monitoring them is typically Division 28.' },
    { id: 'gaps-read', name: 'Exclusion Reader', level: 80, concept: 'Read every quote’s exclusions against the documents. The cheapest number often hid a sentence.' },
    { id: 'gaps-level', name: 'Three-Bid Sight', level: 100, concept: 'When leveling several bids, look for the one that is silent on a known gap such as patch, firestopping, or design fees.' },
  ]},
  { id: 'markup', name: 'Markups, Fee, Bond & Insurance', csi: 'EST', rune: 'ᛗ', lore: 'Fee is not the camp, and a bond is not a guess. Carry bond and builder’s risk as their own lines, then the fee, and never treat a historical median as a quote.', perks: [
    { id: 'markup-fee', name: 'The Seven-Percent Star', level: 20, concept: 'A City Creek historical fee often lands near a 7% median. Treat that as an approximate historical observation, not a quote for any one job.' },
    { id: 'markup-size', name: 'Size-Band Sense', level: 40, concept: 'As an approximate historical pattern, smaller jobs often carry a higher fee percentage than larger ones.' },
    { id: 'markup-bond', name: 'Bond of the Hall', level: 60, concept: 'A performance and payment bond is typically a separate line on the contract amount. Use the current surety schedule; do not invent a single percentage.' },
    { id: 'markup-br', name: 'Risk of the Flame', level: 80, concept: 'Builder’s risk is typically carried as its own line until the insurance agent quotes. It is usually a small fraction of the bid.' },
    { id: 'markup-order', name: 'Order of the Close', level: 100, concept: 'A typical close carries contingency, builder’s risk, and bond as their own lines, then fee. Fee is not general conditions. Add tax if it applies.' },
  ]},
  { id: 'risk', name: 'Risk & Contingency', csi: 'EST', rune: 'ᚱ', lore: 'What the ground conceals, the lump sum will not forgive. Contingency, allowances, unit prices, and qualifications are different weapons; use the one that fits the uncertainty.', perks: [
    { id: 'risk-three', name: 'Three Shields', level: 20, concept: 'An allowance is a specified placeholder sum. A unit price covers a quantity that may change. A qualification discloses what is not in the number.' },
    { id: 'risk-cont', name: 'Contingency Line', level: 40, concept: 'Carry contingency as its own line and adjust it for risk. Historical jobs have often used a low-single-digit percent of base, but there is no single official rate.' },
    { id: 'risk-soil', name: 'Silent Ground', level: 60, concept: 'Unsuitable soils, rock, or buried debris belong in a unit price, an allowance, or a qualification — not in a silent lump sum.' },
    { id: 'risk-ld', name: 'Damages of Time', level: 80, concept: 'If liquidated damages are specified, price the schedule risk in staffing, duration, and general conditions.' },
    { id: 'risk-known', name: 'Known Unknowns', level: 100, concept: 'Price the uncertainties you can see. Disclose the ones you cannot. Do not hide either inside an unleveled low number.' },
  ]},
  { id: 'strategy', name: 'Bid Day Strategy', csi: 'EST', rune: 'ᛞ', lore: 'Bid day is a battle of sequence, not of panic. Level first, hunt the last gaps, honor the proposal form, and do not enthrone a number you have not yet understood.', perks: [
    { id: 'str-level', name: 'Before the Low', level: 20, concept: 'Level scopes before you pick a low sub number.' },
    { id: 'str-form', name: 'Form of the Bid', level: 40, concept: 'Alternates, unit prices, bonds, insurance, and the proposal form are as important as the trade numbers.' },
    { id: 'str-rfi', name: 'Ask While You May', level: 60, concept: 'Pre-bid RFIs clear conflicts so everyone prices the same work. After the deadline, you carry the risk or you qualify.' },
    { id: 'str-late', name: 'The Last Hour', level: 80, concept: 'A late quote is useful only after you have leveled it. Hunt scope gaps in the last hour, not new arithmetic theater.' },
    { id: 'str-bond', name: 'Honor the Seal', level: 100, concept: 'A bid bond backs the promise that you will stand by the proposal and sign the contract if awarded.' },
  ]},
  { id: 'contract', name: 'Contracts & Delivery', csi: 'EST', rune: 'ᛝ', lore: 'The contract writes who holds the design, the risk, and the pen. Design-bid-build, design-build, and CM-at-risk are different journeys; lump sum, GMP, and cost-plus are different purses.', perks: [
    { id: 'con-del', name: 'Three Roads', level: 20, concept: 'Design-bid-build, design-build, and construction manager at risk (CMAR) are common delivery methods, and they allocate design responsibility and risk differently.' },
    { id: 'con-price', name: 'Three Purses', level: 40, concept: 'A lump sum is a fixed price for defined scope. A GMP sets a ceiling around a cost-plus arrangement. Cost-plus reimburses cost plus a fee.' },
    { id: 'con-bonds', name: 'Two Bonds', level: 60, concept: 'A bid bond backs the proposal. Performance and payment bonds back the work and the pay of subs and suppliers after award.' },
    { id: 'con-tools', name: 'Allowance, Alternate, Unit', level: 80, concept: 'An allowance is a placeholder sum. An alternate is a defined add or deduct the owner may take. A unit price covers a quantity that may change.' },
    { id: 'con-ret', name: 'Retainage & Completion', level: 100, concept: 'Retainage is commonly around 5 or 10 percent, but the contract governs. Substantial completion and final completion are different milestones.' },
  ]},
];
const ALL_SKILLS: SkillDef[] = SKILLS.concat(EST_SKILLS);
const EST_IDS: SkillId[] = EST_SKILLS.map((s) => s.id);

const RANKS: { min: number; title: string; rune: string; metal: string; blurb: string }[] = [
  { min: 1, title: 'Apprentice', rune: 'ᚢ', metal: '#8a8174', blurb: 'The ledger is heavy, but you have picked it up.' },
  { min: 6, title: 'Laborer', rune: 'ᛚ', metal: '#8a5a2b', blurb: 'Your hands know the work, even when they only hold a highlighter.' },
  { min: 12, title: 'Journeyman', rune: 'ᛃ', metal: '#a8a29a', blurb: 'You can walk a set of plans and see the gaps others miss.' },
  { min: 20, title: 'Foreman', rune: 'ᚠ', metal: '#b08d57', blurb: 'Subs listen when your scope is clean and your questions are sharp.' },
  { min: 30, title: 'Superintendent', rune: 'ᛋ', metal: '#c5c8ce', blurb: 'Schedule, trades, and field truth are now your weapons.' },
  { min: 42, title: 'Master Builder', rune: 'ᛖ', metal: '#d4af37', blurb: 'The building is a whole in your mind, from footing to flashing.' },
  { min: 55, title: 'Guild Master', rune: 'ᚷ', metal: '#e8d48b', blurb: 'The City Creek hall would trust you with the close of any bid.' },
  { min: 70, title: 'Arch-Estimator', rune: 'ᛁ', metal: '#c9a227', blurb: 'Numbers, codes, and means obey your reading of the set.' },
  { min: 85, title: 'Thane of the Bid Hall', rune: 'ᛏ', metal: '#f0e6c8', blurb: 'Your name carries among the trades. Scope dragons fall quiet.' },
  { min: 100, title: 'Dragonborn of Bids', rune: 'ᛞ', metal: '#f0d060', blurb: 'The cheap number flees your Shout. The complete number remains.' },
];

function parseQ(rows: string[]): Question[] {
  const out: Question[] = [];
  for (const row of rows) {
    const p = row.split('~');
    if (p.length < 9) continue;
    const a = Number(p[7]);
    if (a !== 0 && a !== 1 && a !== 2 && a !== 3) continue;
    out.push({ id: p[0], skill: p[1] as SkillId | 'bid', q: p[2], c: [p[3], p[4], p[5], p[6]], a, x: p[8], kind: 'mc' });
  }
  return out;
}
function parseTf(rows: string[]): Question[] {
  const out: Question[] = [];
  for (const row of rows) {
    const p = row.split('~');
    if (p.length < 5) continue;
    const truth = p[3].trim().toLowerCase().charAt(0) === 't';
    out.push({ id: p[0], skill: p[1] as SkillId | 'bid', q: p[2], c: ['True', 'False'], a: truth ? 0 : 1, x: p[4], kind: 'tf' });
  }
  return out;
}
function parseNum(rows: string[]): Question[] {
  const out: Question[] = [];
  for (const row of rows) {
    const p = row.split('~');
    if (p.length < 7) continue;
    const value = Number(p[3]);
    const tol = Number(p[4]);
    if (!isFinite(value) || !isFinite(tol)) continue;
    out.push({ id: p[0], skill: p[1] as SkillId | 'bid', q: p[2], c: [], a: 0, x: p[6], kind: 'num', num: { value, tol, unit: p[5] } });
  }
  return out;
}

const QUESTIONS = parseQ([
  'conc-28~conc~At what age is specified compressive strength (f’c) normally tested?~7 days~14 days~28 days~56 days~2~Specified f’c is normally verified with cylinders tested at 28 days. Hydration can continue after that if the concrete stays moist.',
  'conc-wc~conc~Increasing the water-cement ratio generally does what to the hardened concrete?~Increases strength and durability~Decreases strength and durability~Changes only the color~Has no effect if slump is held~1~More water relative to cement typically lowers strength and durability.',
  'conc-cure~conc~What is the main purpose of curing concrete?~To speed surface finishing and open the slab to early traffic~To keep moisture and temperature so hydration can continue~To add extra cement after the placement has already begun~To prevent all shrinkage permanently, including drying cracks~1~Curing protects moisture and temperature so cement can keep hydrating.',
  'conc-after~conc~Does concrete stop gaining strength at 28 days?~Yes, 28 days is the end of hydration and no strength is added after~No. If moisture remains, strength can still rise after 28 days~Only in cold weather, when hydration otherwise stops at seven days~Only if Type X board is used nearby to keep the slab from drying~1~Twenty-eight days is a standard test age, not the end of strength gain.',
  'conc-cmt~conc~Who typically tests concrete cylinders in the field on a commercial job?~The architect, as part of the design-team punch and close-out~The special inspector or the CMT laboratory on site~The owner’s bookkeeper, who logs tickets and cylinder numbers~The painter, after finish coats have been applied to the structure~1~Field testing and cylinder breaks are typically performed by the testing lab or special inspector.',
  'conc-frozen~conc~Placing concrete on a frozen subgrade is generally:~Acceptable if you add extra water and finish the surface quickly~Not acceptable — ice and frozen ground compromise the placement~Required for winter pours so the subgrade stays locked in place~Only a finish-floor issue, not a structural or bond concern~1~Do not place concrete on frozen ground or ice. Protect the subgrade and the fresh concrete from freezing.',
  'conc-chair~conc~What do chairs and dobies do in a slab?~Decorate the pour and mark the locations of construction joints~Support reinforcement at the specified cover in the slab~Increase slump so the mix will flow around the bar cage~Replace control joints and make shrinkage cracks unnecessary~1~They hold rebar or mesh at the specified cover. Missing support is a common field defect and a takeoff miss.',
  'conc-slump~conc~A slump test measures:~Compressive strength of the hardened mix at 28 days~The consistency and workability of fresh concrete~Air content only, as a substitute for a pressure meter~The 28-day modulus only, after the cylinders are broken~1~Slump is a field test of consistency and workability, not of strength.',
  'conc-joint~conc~Control joints in a slab are placed primarily to:~Add flexural strength so the slab can span further~Control the location of shrinkage cracking~Replace reinforcement in lightly loaded floor slabs~Waterproof the slab against vapor from the subgrade~1~Control joints create a planned weak plane so shrinkage cracks occur where you can live with them.',
  'conc-accel~conc~High-early-strength cement or accelerators are often used when:~You only want a lower water-cement ratio in a standard mix~Cold weather or a fast schedule requires earlier strength~The slab must be a darker color for the finish floor~Slump is already too high and needs to be brought back down~1~They help concrete gain strength sooner, useful in cold weather or when the schedule needs an early strip or load.',
  'conc-retemp~conc~A typical concern if a mix is retempered with extra water on site is:~Higher long-term strength~Lower strength and durability~Faster curing with no downside~It voids only the color~1~Adding water on site raises the water-cement ratio and can reduce strength and durability.',
  'mas-nom~mas~What is the nominal size of a standard CMU block?~6x8x12~8x8x16~10x10x20~4x8x8~1~A standard concrete masonry unit is nominally 8x8x16 inches, which fits an 8-inch modular grid.',
  'mas-act~mas~The actual size of a nominal 8x8x16 CMU is typically:~8 x 8 x 16 inches, the same as the nominal size~7-5/8 x 7-5/8 x 15-5/8 inches, under nominal~7 x 7 x 15 inches, a full inch under nominal~8-3/8 inches each way, larger than the nominal size~1~The unit is usually 3/8 inch under nominal so a 3/8-inch mortar joint keeps the work on an 8-inch module.',
  'mas-why~mas~Why is the actual CMU smaller than its nominal size?~The units shrink after firing, like clay brick in a kiln~To allow for the mortar joint in a modular 8-inch grid~A manufacturing defect that is later hidden by the mortar~To leave room for insulation only, not for the mortar joint~1~Nominal size includes the mortar joint. The manufactured unit is smaller so the finished work stays modular.',
  'mas-beam~mas~What is a bond beam?~A decorative soldier course laid in a contrasting color~A continuous grouted, reinforced course that ties the wall~A type of mortar used only at the base of a veneer~A scaffolding plank hung from the masonry as the wall rises~1~Bond beams are grouted and reinforced courses, and often lintels, that tie the masonry together.',
  'mas-n~mas~Type N mortar is most often specified for:~The highest below-grade loads only, in place of Type M~General above-grade masonry, including many veneers~Interior non-loadbearing work only, never on an exterior wall~Glass block exclusively, and never on a standard CMU wall~1~Type N is a general-purpose mortar for much above-grade work. Type S and M are used where higher strength or below-grade conditions demand it.',
  'mas-weep~mas~Weep holes in a masonry veneer wall are there to:~Decorate the first course with open head joints at the base~Let water that enters the cavity drain out at the base~Replace through-wall flashing so the metal can be omitted~Vent the interior rooms through the veneer into the cavity~1~Weeps drain the cavity. They work together with through-wall flashing, not instead of it.',
  'mas-flash~mas~Through-wall flashing in a veneer should typically:~Stop at mid-cavity with no outlet to the exterior weeps~Collect water in the cavity and direct it to the weeps~Replace the water-resistive barrier entirely on the backup~Be used only at the roof, never at sills or the wall base~1~Flashing catches water in the cavity and leads it out at the weeps, especially at sills, shelves, and the base of the wall.',
  'mas-grout~mas~Grout in a CMU wall is used to:~Paint the block face and fill minor chips in the units~Fill designated cells and bond beams around reinforcement~Replace all mortar joints with a poured grout bed~Insulate every cell automatically, whether specified or not~1~Specified cells and bond beams are grouted to bond the reinforcement to the masonry.',
  'mas-run~mas~In a typical running bond, each course is offset by about:~The full unit length~Half the unit length~One inch~A random amount~1~Running bond offsets each course by half a unit, the common pattern on commercial CMU walls.',
  'mas-eff~mas~Efflorescence on masonry is typically:~A structural crack that means the wall must be rebuilt~Salt deposits left when moisture moves through the wall~A required curing compound applied after the last course~A type of mortar specified for below-grade foundation walls~1~Efflorescence is usually salts deposited on the surface as moisture migrates through the masonry.',
  'mas-lint~mas~CMU lintels and special masonry reinforcement on a commercial job are typically:~Invented by the mason in the field with no drawings or calculations~Shown on the structural drawings, often with masonry shop drawings~Designed by the painter to match the exterior finish color chosen~Never reinforced, because the masonry arch carries the opening load~1~Look to the structural drawings, and expect masonry shop drawings for lintels, bond beams, and reinforcing.',
  'met-shop~met~Structural steel on a commercial job is typically:~Fully fabricated in the field with no shop drawings or approval~Fabricated in a shop from approved shop drawings, then erected~Purchased off the shelf like framing lumber at a supply house~Designed only after erection starts and the first column is set~1~Steel is detailed and shop-fabricated from approved drawings, then shipped and erected. That approval time sits on the critical path.',
  'met-ton~met~Why can two steel bids with similar tonnage differ a lot?~Paint color only, which changes the coating system and the hours~Connection complexity, detailing, and extras such as deck and embeds~Trucking may not be included by law, so freight is always extra~Tonnage is never used in bids, so the hours cannot be compared~1~Hours live in the connections and in the extras. Tonnage is only a rough measure of the work.',
  'met-deck~met~Metal deck on a composite floor typically works with:~Wood joists only and no concrete fill on the deck flutes~Concrete fill, and often shear studs welded to the beams~Masonry grout in every flute, placed as the wall is laid~No concrete ever, because the deck is a finished walking surface~1~Composite floors use concrete on metal deck, often with shear studs, so the slab and beams act together.',
  'met-anc~met~Anchor rods for steel columns are usually:~Welded to rebar after the foundation is poured and already stripped~Set in the foundations from an anchor-rod plan before the pour~Supplied by the electrician with the service grounding package~Optional if the column is heavy enough to stand without rods~1~Anchor rods have to be in the foundation pour. Late or missing rods are a painful delay.',
  'met-joist~met~Open-web steel joists are often:~Poured in place like concrete beams, with the deck used as a form~Furnished by a joist manufacturer, sometimes as a separate quote~A Division 03 item, taken off with the concrete and the rebar~Always made in the same shop as every wide-flange beam on the job~1~Joists are often a specialist product. Confirm whether they are in the steel bid or a separate quote.',
  'met-moment~met~A moment connection is generally:~Cheaper than a simple shear connection and faster to erect in the field~Designed to transfer bending as well as shear, and more labor-intensive~Used only in wood framing, never in structural steel building frames~A type of shop primer specified for exposed interior steel members~1~Moment connections transfer bending and take more detailing, bolts, or weld metal than a simple shear connection.',
  'met-misc~met~Miscellaneous metals often include:~Concrete mix designs and cylinder-break reports for foundations~Stairs, railings, ladders, and loose lintels in Division 05~HVAC duct mains and the rooftop-unit curb and flashing~Roofing membrane, tapered insulation, and sheet-metal copings~1~Stairs, rails, ladders, and loose lintels are classic miscellaneous metals — and a frequent scope split.',
  'met-time~met~Shop drawing approval for structural steel should start:~After erection begins and the first truck of steel is on site~Early, because detailing and fabrication sit on the critical path~Only if the inspector asks for them at the first field visit~The same day as the first foundation pour, after the rods are set~1~Detailing, approval, mill orders, and fabrication all happen before steel can arrive. Start that clock early.',
  'met-stud~met~Shear studs on metal deck are typically:~Plumbing hangers welded to the deck for underslab waste lines~Welded through the deck to the beam for composite action with the slab~Used to hang ceilings from the joists after the slab has cured~Decorative fasteners specified only where the steel will stay exposed~1~Shear studs connect the concrete slab to the steel so they act as a composite beam.',
  'met-galv~met~Hot-dip galvanizing is typically specified for:~Every interior dry office beam, in place of a shop primer coat~Corrosion protection, especially on exterior or exposed steel~Fireproofing replacement so intumescent coating can be omitted~Bolts only, never the members, connections, or lintels themselves~1~Galvanizing protects steel against corrosion, especially outdoors or in exposed or damp service.',
  'met-embed~met~Embed plates for steel connections are typically:~Painted onto the wall after the pour has already been stripped~Cast into the concrete, so they must be on site before that pour~Supplied by the drywall sub with the in-wall backing package~Optional if the weld is small enough to hit the concrete face~1~Embeds have to be in the formwork. If they are late, you are coring, epoxying, or waiting on a pour.',
  'wood-24~wood~What are the actual dimensions of a dressed 2x4?~2 x 4 inches~1-1/2 x 3-1/2 inches~1-3/4 x 3-3/4 inches~2-1/2 x 4 inches~1~A 2x4 is the nominal, rough size. After drying and planing, it measures 1-1/2 by 3-1/2 inches.',
  'wood-why~wood~Why is a 2x4 not actually 2 inches by 4 inches?~Metric conversion from the imported size used in the mill~It is dried and planed down from the nominal rough size~Fire-rating rules that require a thinner dressed section~Only European lumber is undersized; domestic 2x4s are full size~1~Nominal sizes describe the board before it is dried and dressed. Use the actual size in wall-thickness takeoffs.',
  'wood-wall~wood~A 2x4 stud wall with 5/8-inch drywall on both sides is typically how thick?~4 inches~4-3/4 inches~5-1/4 inches~3-1/2 inches~1~3-1/2 inches of stud plus 5/8 inch of board on each side equals 4-3/4 inches.',
  'wood-awi~wood~The three AWI architectural woodwork grades are:~Good, Better, and Best, as used in most retail casework lines~Economy, Custom, and Premium, under the AWI standards~Type I, II, and III, matching the plywood appearance grades~A, B, and C, the same letters used for architectural concrete~1~The Architectural Woodwork Standards use Economy, Custom, and Premium. Custom is the usual commercial default.',
  'wood-def~wood~The usual default AWI grade on commercial millwork is:~Economy~Custom~Premium~Unfinished~1~Custom is the ordinary commercial default. If the spec calls for Premium, expect tighter tolerances and more money.',
  'wood-block~wood~In-wall blocking for upper cabinets is typically:~Always in the millwork sub’s install price, including the labor~Provided by framing or drywall, not by the millwork fabricator~Not required in commercial work if the cabinets are surface-hung~The electrician’s job, because outlets often sit in the same wall~1~Blocking is usually a framing or drywall item. If nobody carries it, you will pay for it in the field.',
  'wood-top~wood~Solid-surface or quartz countertops on a millwork job are often:~Always inside the millwork lump sum, with no separate fabricator~Bid by a separate countertop fabricator — a common scope split~Never used commercially, because only plastic laminate is allowed~Part of Division 03, poured with the topping on the kitchen slab~1~Tops are frequently a separate fabricator. Check every millwork bid for whether counters are included.',
  'wood-26~wood~The actual size of a dressed 2x6 is typically:~2 x 6 inches, matching the nominal size exactly~1-1/2 x 5-1/2 inches, the dressed size~1-1/2 x 6 inches, dressed in thickness only~2 x 5-1/2 inches, dressed on the wide face only~1~Like the 2x4, a 2x6 is dressed to 1-1/2 by 5-1/2 inches.',
  'wood-shop~wood~Millwork shop drawings and field measurements should happen:~After the last coat of paint, once the rooms can be measured~Before fabrication, and they are often on the critical path~Only if the grade is Premium, and never for Custom casework~Never on tenant-improvement work, because field measure is skipped~1~The shop needs approved drawings, samples, and field measures before it can build. That sequence takes time.',
  'wood-level~wood~When leveling millwork bids, you should check:~Only the lump-sum number on the first page of the proposal~Grade, countertops, furnish vs. install, hardware, and blocking~Only the wood species listed on the interior elevation~Only the bond rate used to close the contractor’s proposal~1~Those five items — grade, tops, install, hardware, and blocking — are where millwork bids most often diverge.',
  'wood-plam~wood~Plastic-laminate (P-lam) casework on particleboard or MDF is typically:~More expensive than stained wood veneer of the same layout~The lower-cost commercial workhorse compared with wood veneer~Not recognized by AWI and cannot be specified as casework~Used only on exteriors, never on interior office or clinic work~1~Laminate casework is the usual, lower-cost commercial option. Stained veneer, matching, and finishing cost more.',
  'therm-wrb~therm~A water-resistive barrier (WRB) is primarily meant to:~Replace the roof membrane at walls that run past the parapet~Stop bulk water that gets past the cladding of the wall~Serve as the finished face of the wall in place of the cladding~Eliminate the need for insulation in a cavity or rainscreen wall~1~The WRB is a drainage plane behind the cladding. It does not replace good flashing at openings and transitions.',
  'therm-roof~therm~Roof bids should be leveled on:~Square footage only, taken from the architectural roof plan~Membrane, taper, flashings, warranty, and deck condition~Color only, which is what drives the membrane unit price~Crew size only, with no regard to the assembly being installed~1~The assembly and the flashings drive cost more than raw square footage. Warranty and deck condition matter too.',
  'therm-iso~therm~A known concern with polyisocyanurate roof insulation is that:~Its R-value is identical in every climate and never needs review~It can perform below its labeled LTTR in cold temperatures~It gets stronger when frozen and can be thinner in winter work~It is used only on walls and is not a roof-insulation product~1~Polyiso’s labeled LTTR can overstate winter performance in cold climates, which can affect thickness and design.',
  'therm-fs~therm~Firestopping at MEP penetrations is:~Always only in the electrical bid, never in any other package~A common scope gap, often specified in Division 07~Never required on tenant improvements, even at rated walls~Required only for plumbing, and never for duct or conduit~1~Someone has to firestop each rated penetration. If the documents split it, confirm who carries it.',
  'therm-back~therm~Backer rod in a sealant joint:~Is only decorative and has no effect on joint performance~Controls sealant depth and shape so the joint can move~Always replaces primer, so the joint face can stay dusty~Is used only on roofs and never in a facade or storefront~1~Backer rod sets the hourglass shape and depth. The joint fails sooner if the sealant is too deep or unbacked.',
  'therm-leak~therm~A typical source of building-envelope leaks is:~Too much insulation in the wall, which forces water inward~Poor flashing and transitions at windows, parapets, and roof edges~Using too many deck fasteners, which over-drain the membrane~Type X drywall, which cannot be used in an exterior assembly~1~Leaks love transitions. Windows, parapets, and roof-to-wall flashings are where envelopes most often fail.',
  'therm-taper~therm~Tapered insulation on a low-slope roof is used to:~Reduce the R-value on purpose at the drains and low spots~Create slope to the drains when the deck itself is flat~Replace the membrane so a covering is no longer required~Hide rooftop units behind a thicker board at the parapet~1~Taper builds slope to roof drains and overflows when the structure does not already provide it.',
  'therm-air~therm~An air barrier must be:~Optional on all commercial work and may be left discontinuous~Continuous and tied into windows, roofs, and foundations~Identical to a vapor retarder in every climate and wall type~Always the exterior face of the brick only, never the backup~1~Air barriers work only if they are continuous and tied into the openings, roof, and foundation.',
  'therm-flash~therm~When leveling roofing bids, a frequent gap is:~Whether sheet-metal flashings, curbs, and penetrations are included~Whether the membrane warranty is written for twenty or thirty years~Whether dumpsters are carried in the roofer’s general conditions~Whether a night watchman is included in the roofing lump sum~0~Flashings, curbs, and penetrations are where roof bids quietly drop scope. Level them explicitly.',
  'therm-wp~therm~Below-grade waterproofing, as opposed to dampproofing, is typically for:~Interior paint conditions on dry, above-grade office walls~Hydrostatic pressure or occupied below-grade space that must stay dry~Roofs only, in place of a membrane and tapered insulation~Brick-veneer weeps at the base of an above-grade cavity wall~1~Waterproofing is the more robust system, used where water pressure or occupied below-grade space demands a dry interior.',
  'therm-exp~therm~Expansion joints in a facade:~Can always be treated as a hairline caulk joint on the facade~Must be designed for movement with the right joint system and width~Are used only in slabs on grade and never in a wall or roof~Replace the air barrier so a membrane is no longer required~1~Facade expansion joints have to be wide enough and detailed for movement. A thin caulk joint will tear.',
  'open-div~open~In CSI MasterFormat, Division 08 is:~Finishes~Openings~Concrete~Plumbing~1~Division 08 is Openings: doors, frames, hardware, storefront, curtain wall, and glazing.',
  'open-hw~open~What often drives the price of a commercial door opening more than the door leaf itself?~The paint color specified for the leaf and the frame~The hardware set — closers, exit devices, and access control~The room name shown on the architectural door schedule~The joist size above the opening, which changes the frame type~1~Closers, panic devices, and electrified hardware can cost more than the slab. Always read the hardware schedule.',
  'open-fire~open~A fire-rated door must typically:~Be cut down in the field to fit any opening in the wall~Have a listed frame and hardware, and self-close and latch~Have louvers of any size cut on site after the leaf arrives~Be a hollow-core residential door with a closer added later~1~The rating is for a listed assembly: door, frame, and hardware. Field modifications can void the listing.',
  'open-sf~open~Aluminum storefront is generally:~The same as unitized curtain wall in cost, span, and support~A lighter system for low-rise work and smaller, floor-supported spans~Always used at the 40th floor in place of a curtain-wall system~A type of hollow metal, formed from the same door-frame sheet~1~Storefront is the lighter, usually floor-supported system for lower heights and shorter spans.',
  'open-cw~open~Curtain wall typically:~Sits only in a wood-stud punch opening, like a residential window~Hangs from the structure and can span from floor to floor~Is cheaper than a residential window of the same glass area~Cannot take insulating glass or any other sealed glazing unit~1~Curtain wall is designed to hang from the structure and span floor to floor. It is usually costlier than storefront.',
  'open-28~open~Electrified hardware and access control often create a scope split between:~Roofing and landscaping, who share the exterior wall openings~Openings (doors and hardware) and Division 28 security or low voltage~Concrete and rebar, because the frames are set in the pour~Only the owner’s vendor, with no effect on the contractor’s bid~1~The door and hardware may be Division 08 while card readers, power, and programming sit in Division 28.',
  'open-ada~open~The steepest running slope allowed on an accessible ramp is:~1:8~1:12~1:20~1:48~1~ADA Standards limit the running slope of a ramp to 1:12. (1:48 is a common cross-slope limit for accessible routes.)',
  'open-mod~open~A common field issue that can void a rated opening is:~Leaving the fire label visible on the listed door or frame~Undercutting the door, swapping hardware, or adding unlisted louvers~Using the specified closer that is part of the listed hardware set~Painting the frame the specified color without covering the label~1~Field cuts, added louvers, and hardware swaps can void the listing. The label should stay visible.',
  'open-glz~open~Safety glazing (tempered or laminated) is typically required:~Only on roofs, where skylights are the only hazardous glass~At hazardous locations such as doors and certain sidelites, per code~Never in commercial work, because tempered glass is residential only~Only underwater, in pools and fountains, and nowhere else in a building~1~Code requires safety glazing at hazardous locations, including many doors and sidelites.',
  'open-hm~open~Hollow metal frames at masonry openings are typically:~Taped to the wall after paint, with no anchors in the masonry~Set and anchored as the masonry is laid, or as a punched opening~Made of wood and then wrapped with a hollow-metal face sheet~Set with no anchors, relying only on the door hardware for support~1~Masonry frames are usually built in or carefully anchored in a punched opening.',
  'open-coord~open~Door hardware submittals should be coordinated with:~Only the painter, who chooses the finish for the hardware set~The openings, security, and sometimes fire alarm (holders, delayed egress)~The landscaper, who locates gates that match the interior keying~Rebar shop drawings only, because frames sit in foundation walls~1~Electrified hardware, mag holders, and delayed egress tie openings to security and fire alarm.',
  'fin-x~fin~Type X gypsum board is mainly used for:~Exterior roof sheathing only, in place of plywood or OSB boards~Fire-rated assemblies, where glass fibers help the core hold in a fire~Tile underlayment only, in wet rooms and on floors over a slab~Roofing felt, used as a weather barrier under steep-slope shingles~1~Type X is fire-rated gypsum board. The glass fibers help the core stay intact in a fire.',
  'fin-fiber~fin~Why does Type X typically perform better in a fire than regular gypsum board?~It is a thicker metal panel with a gypsum facing on each side~Glass fibers in the core help it stay intact longer in a fire~It is waterproof and can be used as an exterior sheathing board~It has no paper face, so the core cannot burn or delaminate~1~The core is formulated with glass fibers, and Type X is commonly 5/8 inch, so it holds together longer in a fire.',
  'fin-l4~fin~A common gypsum finish level under typical flat paint is:~Level 1~Level 4~Always Level 5~Level 0~1~Level 4 is the ordinary finish for walls and ceilings that will receive flat or eggshell paint.',
  'fin-l5~fin~Level 5 gypsum finish is typically used:~In concealed mechanical shafts only, where tool marks are allowed~Where critical lighting or gloss paint would telegraph the surface~Underground only, on the inside face of basement walls~Never in commercial work, because Level 4 is the highest finish~1~Level 5 adds a skim coat to even the surface where grazing light or gloss would show every joint.',
  'fin-ul~fin~Fire-rated drywall assemblies must:~Allow any stud and board substitution so long as thickness matches~Follow the tested design for board type, layers, studs, and penetrations~Ignore electrical boxes, which never affect a listed wall rating~Be painted red so the inspector can see that the wall is rated~1~The rating belongs to a tested assembly. Changing board, layers, or stud gauge can void it.',
  'fin-insp~fin~Rated drywall assemblies should typically be:~Closed up before anyone sees them, to protect the rating in place~Inspected as required before they are concealed in the wall~Painted by the roofer as part of the attic fire-taping work~Built without fasteners, using adhesive only in a rated wall~1~Rated walls and corridors often need inspection before they are closed up. Plan that into the sequence.',
  'fin-moist~fin~Before resilient flooring on a slab, a frequent requirement is:~A roof warranty covering the slab as well as the membrane~Moisture (and often pH) testing, and mitigation if the slab is too wet~Removing all control joints so the covering can run unbroken~A 90-day paint cure in the rooms before the floor can be laid~1~Flooring manufacturers often require moisture testing. Wet slabs lead to failure or a mitigation change order.',
  'fin-act~fin~Acoustical ceiling bids should account for:~Tile and grid only in an empty room, with no device cuts~Cuts and coordination at lights, sprinklers, diffusers, and devices~Only the grid color, which is what drives the ceiling unit price~No waste or cuts, because full tiles are assumed in every room~1~Every head, fixture, and diffuser is a cut. Coordination and waste belong in the number.',
  'fin-58~fin~5/8-inch Type X board is commonly used:~As roofing felt under a steep-slope shingle roof covering~In many one-hour wall and ceiling assemblies~As a roof vapor barrier above a metal or concrete deck~For countertops in place of plywood or cement board~1~5/8-inch Type X is the everyday fire-rated board in many one-hour assemblies.',
  'fin-l1~fin~A Level 1 drywall finish is typically:~Showroom quality, ready for gloss paint in public rooms~Fire-taping in concealed areas, where tool marks are acceptable~The same as Level 5, including a full skim coat on the surface~Paint-ready in offices that will receive flat or eggshell paint~1~Level 1 is fire-taping in plenums and other concealed spaces, not a paint-ready office finish.',
  'fin-abuse~fin~Impact- or abuse-resistant board is often specified in:~Unused attics, where the board will never see traffic or impact~Corridors, schools, and other high-traffic areas that take hits~Only roofs, as a cover board under the membrane~Crawlspaces, where moisture and soil contact are the concern~1~Abuse-resistant boards are for walls that will take hits: corridors, schools, and similar high-traffic spaces.',
]);

const MORE = parseQ([
  'fire-13~fire~Which standard governs commercial sprinkler system design?~NFPA 70~NFPA 13~AWI Premium~ASTM C270~1~NFPA 13 is the standard for the design and installation of sprinkler systems in most commercial buildings.',
  'fire-dry~fire~An unheated parking structure that can freeze would typically get what kind of sprinkler system?~A wet-pipe system~A dry-pipe system~No system is ever used~Only fire extinguishers~1~Dry-pipe systems keep pressurized air in the pipes so water does not sit in freeze-prone spaces. They cost more than wet systems.',
  'fire-who~fire~Who usually designs the sprinkler system on a commercial bid job?~The architect, as a complete design already in the bid set~The sprinkler subcontractor; design-build is the norm~The plumber, always, because the riser is a plumbing fixture~The city council, which issues a standard layout with the permit~1~Bid sets are often performance-based. The sprinkler sub designs the system, runs hydraulic calculations, and submits to the AHJ.',
  'fire-28~fire~Monitoring of sprinkler flow and tamper switches belongs to which division?~Division 21 only, with no fire-alarm involvement required~Division 28, which covers the fire-alarm system~Division 03, because the riser sits on a housekeeping pad~Division 32, as part of the site fire-line and hydrant work~1~The switches are part of the sprinkler system, but monitoring them is a fire-alarm (Division 28) scope item.',
  'fire-light~fire~Offices are typically classified under NFPA 13 as:~Extra Hazard~Light Hazard~High-piled storage always~No hazard class~1~Ordinary offices are typically Light Hazard. Storage, some mechanical rooms, and some retail may be Ordinary or Extra Hazard.',
  'fire-wet~fire~A wet-pipe sprinkler system:~Has air in the pipes at all times, like a dry system in a garage~Has water in the pipes and is the common, lower-cost type~Cannot be used in heated offices, only in unconditioned shells~Requires a dry-pipe valve and a heated riser room in every case~1~Wet systems keep water in the piping. They are the standard, lower-cost choice in heated spaces.',
  'fire-ti~fire~Why do sprinkler bids often vary widely on a tenant improvement?~Labor rates only, with every sub pricing the same existing system~Unclear existing conditions — head relocations versus a largely new system~Sprinklers are never design-build, so each bid follows a different code~Paint color in the occupied rooms, which changes the head finish~1~If the drawings do not say how much of the existing system stays, one sub prices head relocations and another prices a new system.',
  'fire-225~fire~In Light Hazard occupancies, NFPA 13 generally allows a maximum coverage area per standard sprinkler of about:~25 square feet~225 square feet~2,000 square feet~1 square foot~1~For standard upright or pendent sprinklers in unobstructed Light Hazard construction, the maximum area is typically 225 square feet. Walls and soffits still add heads.',
  'fire-watch~fire~A fire watch may be required when:~The architect is on vacation and cannot answer a submittal~The sprinkler system is impaired or shut down for work~A wet system is used in a heated office, which always needs a watch~Heads are concealed, which automatically requires a fire watch~1~When the system is down, the AHJ may require a fire watch until protection is restored. That is a real cost and a coordination item.',
  'fire-flow~fire~A fire-flow (hydrant) test is used to:~Color the riser and confirm the finish in the sprinkler room~Determine the available water supply for hydraulic design~Replace the permit so the AHJ can skip a later inspection~Size the domestic water heater and the building water service~1~Hydraulic design needs to know what water the street can actually supply. A flow test provides that data.',
  'fire-riser~fire~A common scope gap at the sprinkler riser is:~Who provides the backflow preventer, plus design fees and shutdowns~Whether the heads are concealed, pendent, or upright at the ceiling~Whether painted walls are finished in the riser room before trim-out~Whether the system is described as wet, dry, or preaction only~0~Backflow, design and permit fees, and shutdown or fire-watch costs are easy to leave out when you level sprinkler bids.',
  'fire-haz~fire~Storage, mechanical rooms, or some retail areas may be classified as:~Light Hazard always, the same as a typical office occupancy~Ordinary or Extra Hazard, which means more water and more cost~Exempt from NFPA 13 always, so no sprinkler design is required~Dry systems only, regardless of whether the space can freeze~1~Higher hazard classes require greater density. That means more heads, more pipe, and a higher number.',
  'plumb-dwv~plumb~Which plumbing system works by gravity instead of pressure?~Domestic cold water~DWV (Drain, Waste, Vent)~The water-heater gas train~Fire sprinkler mains~1~DWV is a gravity drainage system. Domestic water is the pressurized supply.',
  'plumb-name~plumb~What does DWV stand for?~Domestic Water Valve~Drain, Waste, Vent~Direct Water Volume~Dual Wall Vessel~1~DWV is Drain, Waste, and Vent — the gravity system that carries wastewater out and vents the traps.',
  'plumb-saw~plumb~Adding a restroom in a slab-on-grade tenant improvement usually requires:~Only a new faucet, because the existing waste lines can be reused~Saw cutting and trenching the slab, then patching the concrete~A new roof drain only, to take the restroom waste to storm~No underground work, because all new waste can run above the slab~1~New underground waste lines in an existing slab mean saw cut, excavation, and a concrete patch. Confirm who carries each piece.',
  'plumb-grease~plumb~Which item is often a big-ticket plumbing cost on restaurant tenant improvements?~A towel bar~A grease interceptor~A lavatory tailpiece~Chrome trim only~1~Grease interceptors are expensive to furnish and install and are easy to under-scope on food-service work.',
  'plumb-fix~plumb~The quickest way to sanity-check a plumbing bid is often:~Counting trucks on the proposal and comparing crew sizes only~Cost per fixture against the fixture schedule on the drawings~The font on the proposal, which signals how careful the bid is~The bond rate only, which is a proxy for the plumber’s quality~1~Cost per fixture is a fast reasonableness check once you have counted the fixture schedule.',
  'plumb-dom~plumb~Domestic water is:~A gravity waste system, like drain, waste, and vent piping~A pressurized supply system of potable water to the fixtures~The same piping as storm drainage from the roof drains~Vent piping only, with no supply lines in the same system~1~Domestic water is the pressurized potable supply. Do not confuse it with DWV or storm.',
  'plumb-storm~plumb~Storm drainage typically handles:~Potable water to lavatories and other plumbing fixtures~Roof drains and overflow drains, separate from sanitary waste~Sanitary waste from toilets and other soil fixtures~Fire-sprinkler mains and the standpipe supply in the riser~1~Storm piping takes rainwater from roof drains and overflows, separate from sanitary waste.',
  'plumb-cap~plumb~If a tenant improvement adds fixtures, you should verify:~Only paint colors in the new restrooms and break rooms~Whether the existing heater, water service, and sanitary have capacity~The roofing warranty, which covers any new fixture connections~Joist camber in the floor above, which sets the waste-line slope~1~New fixtures can overload an existing heater, water service, or sanitary line. Check capacity early.',
  'plumb-gas~plumb~Gas piping for water heaters or kitchens is typically:~Always by the electrician, as part of the equipment hookup~In the plumbing or mechanical gas scope, easy to miss if drawings are quiet~A Division 09 item, finished with the interiors package only~Never permitted indoors, so the piping must stop at the exterior wall~1~Gas is usually a plumbing or mechanical item. If the drawings are quiet about it, confirm the scope.',
  'plumb-co~plumb~A cleanout is:~A type of faucet used on mop sinks and wall hydrants~An access fitting on DWV piping for clearing stoppages~A roof-drain strainer at the overflow and primary drains~A water-heater anode that protects the tank from corrosion~1~Cleanouts give access to the drain, waste, and vent system so stoppages can be cleared.',
  'plumb-patch~plumb~After underslab plumbing is roughed in a saw-cut slab, a common gap is:~Who patches and pours the slab back after the underslab work~The chrome finish on the faucets and the trim in the room~The permit fee only, which the city always bills the owner~The ACT grid, because the restroom ceiling must be a hard lid~0~Saw cutting is only half the work. The concrete patch has to belong to someone — plumbing, concrete, or the GC.',
  'plumb-vent~plumb~Vent piping in a DWV system is needed to:~Pressurize the water supply so fixtures can flow at design rate~Protect traps from siphonage and let air into the drainage system~Heat the water in lieu of a water heater or a mixing valve~Size the grease interceptor from the vent stack diameter alone~1~Vents let air into the drainage system so traps are not siphoned and waste can flow.',
]);

const MORE2 = parseQ([
  'hvac-load~hvac~HVAC equipment capacity is properly based on:~Carpet color and the finish schedule in the occupied rooms~Heating and cooling load calculations, not just square footage~The number of windows only, with no regard to people or equipment~The sprinkler hazard class only, which is used to size the tonnage~1~Tonnage and CFM come from load calculations. People, glass, kitchens, and equipment can swing the load hard.',
  'hvac-ti~hvac~On a tenant improvement, a key early HVAC question is:~The paint sheen specified for the occupied rooms and corridors, used as if it set the mechanical load~Whether existing rooftop units, ducts, and VAV boxes can serve the new plan~The logo on the thermostat, which is assumed to set the controls allowance on a tenant job~Only the toilet count, used as a proxy for cooling load instead of a mechanical takeoff~1~If the existing units cannot serve the new use, you are looking at new RTUs, structural dunnage, and a bigger number.',
  'hvac-cfm~hvac~In HVAC work, CFM means:~Concrete Form Measure, a unit used in foundation takeoffs~Cubic feet per minute of airflow in the system~A type of refrigerant used in packaged rooftop equipment~A fire rating applied to duct wrap and fire/smoke dampers~1~CFM is cubic feet per minute, the usual unit for airflow.',
  'hvac-tab~hvac~Testing, adjusting, and balancing (TAB) is:~Optional paint work performed after the ceilings are closed~Measuring and setting air and water flows to the design values~A type of duct joint used on medium-pressure supply mains~Only for plumbing fixtures, never for air or hydronic systems~1~TAB sets the system to the design CFM and water flows. It is often an allowance or an exclusion.',
  'hvac-ddc~hvac~Building automation or DDC controls are:~Always included in every mechanical lump sum with no exclusions~A separate or optional scope; level who provides controls and sequences~A Division 03 item, poured with the housekeeping pads for the units~Only residential, and never specified on a commercial office job~1~Controls may be in the mechanical bid or a separate vendor. Sequences of operation are a common gap.',
  'hvac-vav~hvac~A VAV box:~Is a type of boiler used to generate heating hot water~Varies airflow to a zone and is common in commercial office systems~Is a sprinkler head listed for use in a concealed ceiling~Is a window type, used in place of a curtain-wall unit and assumed to replace a VAV box~1~Variable-air-volume boxes modulate airflow to individual zones, a standard office-building approach.',
  'hvac-kit~hvac~Adding a commercial kitchen or large conference rooms can:~Never affect HVAC if the existing rooftop unit is already in place~Increase exhaust, makeup air, and cooling load, sometimes beyond the existing units~Affect only plumbing, because kitchens are treated as a fixture-count problem~Affect only paint, because the new rooms are assumed to need only a washable finish and no makeup air~1~Kitchens and dense occupancies add exhaust, makeup air, and cooling. Existing roof units may not be enough.',
  'hvac-rtu~hvac~New rooftop units on an existing building often raise concerns about:~Nothing structural, because packaged units are always light enough~Roof structure, curbs or dunnage, and refrigerant line length~Only the color of the unit, which is what drives the mechanical number~Division 08 hardware, because the unit must be locked from the roof~1~Weight, curb or dunnage, and line-length limits are real existing-building constraints, and real costs.',
  'hvac-ins~hvac~Duct insulation or lining is typically required:~For appearance only, so the duct looks finished in an open ceiling~To control condensation and sound, per the specification and energy code~Never in commercial work, because metal duct does not need a wrap~Only underground, on buried supply and return mains outside the building~1~Wrap or liner controls condensation and sound. The spec and the energy code tell you where it is required.',
  'hvac-mua~hvac~Makeup air is especially important when:~You install a closet shelf that changes the room’s volume slightly~A large exhaust system would otherwise depressurize the building~Painting walls, which temporarily reduces the room’s available air volume~Hanging an acoustical ceiling, which always requires a dedicated makeup unit~1~Large exhaust has to be balanced with makeup air, or the building is pulled negative.',
  'hvac-level~hvac~A common HVAC bid-leveling item is whether the quote includes:~Equipment, controls, TAB, start-up, and commissioning~Only the manufacturer of the air filters in the existing~Whether typography on the elevations is set to the specified font and title-block style~Whether the proposal is printed on bond paper or on a plain sheet~0~Equipment, controls, TAB, start-up, and commissioning are the usual places mechanical bids quietly differ.',
  'hvac-name~hvac~RTU stands for:~Rated Type Underlayment~Rooftop unit~Rebar Tension Utility~Return To Under-slab~1~RTU is a rooftop unit, the packaged heating and cooling equipment that sits on the roof.',
  'elec-emt~elec~What does EMT stand for?~Electrical Main Transformer~Electrical Metallic Tubing~Energy Management Thermostat~Emergency Manual Trip~1~EMT is Electrical Metallic Tubing, the thin-wall metal conduit used in most commercial interiors.',
  'elec-what~elec~EMT is:~A type of transformer used at the building service entrance~Thin-wall metal conduit commonly used in commercial interiors~A main breaker only, mounted in the service switchboard~A light-fixture type listed for use in a rated ceiling assembly~1~It is a raceway, not a transformer. You will see it in almost every commercial electrical bid.',
  'elec-220~elec~Panel and conductor sizing is driven largely by:~Paint sheen in the electrical room and the finish on the gear, used as if they sized the service~Load calculations under NEC Article 220, which drive service and panel size~The landscaping plan, which is assumed to set the site lighting allowance and the service load~AWI grade, which is used to size conductors for millwork shops~1~NEC Article 220 is the load-calculation article that drives service, feeder, and panel sizing.',
  'elec-cap~elec~If a tenant improvement adds a commercial kitchen, large HVAC, or EV chargers, you should:~Ignore the existing service and assume spare capacity is available~Check whether the existing service and panels have capacity~Only add receptacles and assume the rest of the service is fine~Assume the utility will upgrade for free on the same day as award~1~New cooking, HVAC, or EV loads can fill a panel or force a service upgrade. Ask the electrical sub early.',
  'elec-util~elec~Utility service upgrades often involve:~No schedule impact, because the utility always works to the contractor’s date~Long lead times and utility fees that may sit outside the electrician’s scope~Only a same-day meter swap in every case, with no other utility work~Division 09 finishes, because the new gear must be painted to match~1~Utility work brings long leads and fees. Those costs are not always inside the electrical number.',
  'elec-gear~elec~Switchgear and transformers:~Are always on the shelf overnight and can be delivered the next morning~Have often had long lead times and can govern the project schedule~Are Division 22 plumbing, taken off with the water-heater package~Never need submittals, because catalog cuts are accepted as-is~1~Gear lead times have been long. A service upgrade can hit the schedule as hard as the budget.',
  'elec-sched~elec~A panel schedule is useful in estimating because it:~Lists paint colors for the electrical room and the panel covers~Shows circuits, loads, and spare capacity in existing or proposed panels~Replaces the one-line diagram, so the one-line can be omitted once a fixture schedule is in the set~Is only for the plumber, who is assumed to use it to size the water heater and the domestic service~1~The panel schedule tells you how full the panel is and what is being added.',
  'elec-one~elec~A one-line (single-line) diagram shows:~Furniture only, including systems furniture and the receptacle plan~The electrical distribution from the service to panels and major equipment~The landscape irrigation, including controllers and valve wiring~Door hardware sets, including electrified openings and power transfers~1~The one-line is the map of the electrical distribution system.',
  'elec-ctrl~elec~Lighting controls such as occupancy sensors and daylighting are:~Never in commercial specifications, and always an owner allowance that the electrical bid can omit~Often driven by energy code and can be a large part of the electrical number~Used only in residences, never in offices, schools, or retail~Always by the drywall sub, who is assumed to mount the sensors in the walls and carry the system~1~Energy codes drive a lot of lighting-control scope, and that scope is not free.',
  'elec-28~elec~Fire-alarm devices are typically specified in:~Division 03, with the devices cast into the concrete walls~Division 28; branch power and conduit pathways may be in Division 26~Division 32 only, as part of the site fire-line and hydrant work~Division 04, because the devices are built into the masonry walls~1~Devices and programming are usually Division 28. Power and conduit often sit with Division 26.',
  'elec-mc~elec~If a specification requires EMT and a bid assumes MC cable throughout, the risk is:~No risk, because EMT and MC are interchangeable in cost and labor~A scope and cost miss, because EMT is usually more labor than MC cable~The bid is automatically higher, so you are safe if you use that number~MC cable is illegal everywhere, so the bid will be rejected on its face~1~EMT is typically more labor than MC. If the spec requires EMT, an MC-based number is short.',
  'elec-gfci~elec~GFCI protection is typically required:~Only on roofs, at receptacles used for rooftop equipment, and never at other wet or kitchen locations~At receptacles in kitchens, bathrooms, and other wet or listed locations~Never in commercial work, because GFCI is treated as a residential-only rule~Only for data racks, to protect servers from a ground fault~1~GFCI is required at many wet and other listed locations, including commercial kitchens and bathrooms.',
]);

const MORE3 = parseQ([
  'fa-72~fa~The primary standard for fire-alarm systems is:~NFPA 13~NFPA 72~AWI Premium~NEC Article 220 only~1~NFPA 72 is the National Fire Alarm and Signaling Code. NFPA 13 is the sprinkler standard.',
  'fa-flow~fa~Sprinkler flow and tamper switches are typically:~Monitored by the fire-alarm system (Div. 28); the switches are a sprinkler item~Monitored by Division 21 alone, with no fire-alarm tie-in required~Reported only to the plumber at final inspection, and to no one else~Omitted unless the owner asks for a graphic interface at the panel~0~Division 21 furnishes the switches; Division 28 monitors them. That tie-in is a classic scope split.',
  'fa-path~fa~A common fire-alarm scope split is:~Who pours the footings under the fire-alarm control panel, treated as if that pour set the pathway~Who provides conduit and 120V power versus devices, cable, and programming~AWI grade, which sets the finish on the fire-alarm control cabinet and is assumed to set the pathway~Concrete slump, which is used to size the housekeeping pad and is assumed to choose the pathway~1~Pathways and power often live with the electrician, while the fire-alarm sub provides devices and programming.',
  'fa-hold~fa~Magnetic door holders on fire doors typically:~Stay locked during a fire so the opening cannot be used~Release on a fire-alarm signal so the door can close and latch~Are a plumbing item, installed with the door closer supply line~Replace the door closer, so a closer is no longer required~1~Holders keep doors open for everyday use and release on alarm so the rated door can close and latch.',
  'fa-elv~fa~Elevator recall is typically:~A landscaping feature used at the exterior elevator tower, and not a fire-alarm or elevator interface~Started by fire-alarm smoke detection and coordinated with the elevator contractor~Optional decoration, added only when the owner wants a graphic map~A Division 03 pour, because the pit and the hoistway are concrete, and recall is assumed to be in that pour~1~Recall is a fire-alarm function that must be coordinated with the elevator contractor and the AHJ.',
  'fa-duct~fa~HVAC duct smoke detectors often:~Only sound a small horn inside the unit, with no other action required of the fire-alarm system~Cause fan shutdown and report to the fire alarm, coordinated with Div. 23~Replace the rooftop unit so a new RTU is no longer required once a duct detector is shown on the drawings~Are never used on commercial systems, only on residential furnaces~1~Duct detectors typically shut down the unit and report to the fire-alarm panel. Coordinate them with mechanical.',
  'fa-voice~fa~High-rise and certain other occupancies may require:~A louder horn only, with no change to the notification method~In-building fire emergency voice/alarm communications~No occupant notification, because the fire department is close by~Email notification only, in place of horns, strobes, or speakers~1~Some occupancies, including many high-rises, require voice evacuation rather than simple horns.',
  'fa-cent~fa~Central-station monitoring is:~Always free from the city as part of the building permit~An ongoing service, and sometimes a bid allowance or an owner contract~A replacement for any devices, so the panel does not need strobes~A Division 32 site item, bid with the fire-line and the hydrants~1~Monitoring is a service, not just a device. Confirm whether it is in the bid, an allowance, or the owner’s contract.',
  'fa-acc~fa~Access control must be coordinated with fire alarm because:~Of paint color on the doors and the adjacent corridor walls~Egress doors may need to unlock or fail safe on alarm, per code~They share a grease interceptor in the kitchen service corridor~AWI grades require it on every millwork opening in the tenant space~1~Locked egress doors have to release as required when the alarm fires. That is a life-safety coordination item.',
  'fa-count~fa~Device counts (smokes, pulls, strobes) should be:~Guessed from square footage with no drawings or device layout~Taken from the drawings and checked against code coverage, spacing~Ignored if there is an existing panel, which is assumed to have spare points~Left to the GC’s insurance agent, who sets the device count from the policy~1~Count the drawings, then check spacing, candela, restrooms, and sleeping rooms against the code.',
  'fa-final~fa~Programming, testing, and the AHJ final are:~Always excluded automatically, and never part of a complete system~A real part of the fire-alarm scope and a common exclusion when leveling~Done by the mason, who tests the devices as the walls are laid~A 28-day concrete test, performed by the special inspector at the riser~1~A system that is not programmed and tested is not a complete system. Watch for those exclusions.',
  'fa-addr~fa~An addressable fire-alarm system:~Cannot identify device locations, only a general alarm zone, which is the opposite of how an addressable system works~Can identify individual devices, which helps testing versus older zone panels~Is illegal in commercial work and may be used only in houses, so an addressable design can be ignored on this bid~Is a type of sprinkler, listed under NFPA 13 rather than NFPA 72~1~Addressable systems report individual devices, which makes testing and troubleshooting much clearer than old zone panels.',
  'site-soil~site~A common earthwork risk is:~Paint color on the site fence and the temporary project sign, treated as if it set the earthwork quantities~Unsuitable soils, over-excavation, and import or export that differs from the set~AWI grade, which is used to classify the excavated material as if a millwork finish grade were a soils report~EMT length only, which is how site utilities are assumed to be measured when a soils question arises~1~What is in the ground often differs from the bid set. Unsuitable soils and quantity swings are the usual battle.',
  'site-swppp~site~SWPPP stands for:~Site Work Plumbing and Paving Plan~Stormwater Pollution Prevention Plan~Southern Wall Panel Placement Protocol~Structural Wood Panel Protection Plan~1~A Stormwater Pollution Prevention Plan covers erosion and sediment control and is required on many sites.',
  'site-pot~site~Potholing is used to:~Plant trees along the property line before grading begins~Expose and verify existing underground utilities before you hit them~Test concrete slump in the curb and gutter mix at the street~Hang drywall in the site trailer so the office can be occupied~1~Potholing is a deliberate dig to find and verify existing utilities. It is cheaper than a strike.',
  'site-pave~site~Asphalt paving bids should be leveled on:~Color of the roller used to compact the wearing course, treated as if it set the pavement section~Section (asphalt and base thickness), area, and subgrade assumptions~Only the total acres, with no regard to the pavement section, base thickness, or the specified wearing course~The truck brand used to haul the mix from the plant, which is assumed to set the asphalt unit price~1~Section and subgrade drive the number. Square footage alone is not enough.',
  'site-ec~site~Erosion-control scope (silt fence, inlet protection, tracking pads, and sometimes a plan) is:~Always inside the landscaper’s plant count, with no separate line~A frequent gap if the civil set or SWPPP requirements are unclear~Never required near roadway or city work, only on rural sites~A Division 08 openings item, bid with the gates and the storefront~1~If the civil set or the SWPPP is thin, erosion control gets under-scoped. Confirm it.',
  'site-unit~site~A unit price for import or over-excavation is often used because:~The architect likes decimals and wants them on the proposal form~Actual quantities are uncertain until you are in the ground~Unit prices are illegal on a lump-sum commercial bid form~Concrete never uses them, so they cannot appear on a civil form~1~You cannot always know the quantity at bid time. A unit price protects both sides when the ground tells a different story.',
  'site-util~site~Site utilities (water, sewer, storm) should be coordinated with:~Only the interior millwork, which is assumed to set the restroom fixture count and the site utilities~Civil drawings, invert elevations, and tie-ins at the building and municipal lines~The hardware schedule, which is assumed to locate hose bibbs, wall hydrants, and the site utility structures~Type X board, used as shoring in the utility trench at the street and assumed to replace bedding and testing~1~Inverts and tie-ins are the truth of a utility bid. Miss them and the number is fiction.',
  'site-conc~site~Curb, gutter, and sidewalk are typically:~Division 08 openings, because the curb is treated as a threshold~Site concrete, and should be checked against the civil quantities~Part of the fire alarm, poured as a housekeeping pad at the riser~Not shown on any plan, so they are always an allowance~1~Site concrete quantities should be checked against the civil set, not taken on faith from a lump-sum page.',
  'site-dew~site~Dewatering may be needed when:~The slab is being painted and needs a dry surface to cure~Excavations will sit below groundwater or collect storm water~You install a door closer that cannot be adjusted in the wet~An acoustical ceiling is specified in a room below grade~1~If the hole will take on water, someone has to pump it. That is a real cost and a weather risk.',
  'site-geo~site~A geotechnical report is used in estimating to:~Pick the office paint for the trailer and the temporary job-site signage~Understand soil bearing, excavation character, pavement sections~Size the water heater from the soil’s thermal conductivity on the site~Write the millwork grade, which is assumed to follow the site’s soil type~1~The geotech report is the soils story: bearing, excavation, pavement sections, and over-ex risk.',
  'site-tc~site~Traffic control and haul routes on an occupied or roadway-adjacent site:~Never affect cost if the building itself is off the right-of-way~Can be a significant cost and constraint, and may need a traffic-control plan~Are only a police issue with no bid impact on the contractor, even when a traffic-control plan is required~Replace the SWPPP, so erosion control can be omitted on the site whenever a traffic-control plan is present~1~Flagging, phasing, and haul routes can move both money and schedule, especially next to a DOT or an occupied campus.',
  'site-rock~site~Rock excavation or buried debris, if not clearly in the documents, is typically:~Assumed free, because rock is already in the unclassified excavation~A candidate for a unit price, allowance, or exclusion, as a hidden condition~Included in the door hardware, which is where hidden conditions are carried~A Division 21 item, because rock is treated like a fire-line obstruction~1~Hidden ground conditions belong in a unit price, an allowance, or a clear exclusion — not in a silent lump sum.',
  'est-08~est~Division 08 in CSI MasterFormat is:~Concrete~Openings~Electrical~Earthwork~1~Division 08 is Openings. Finishes are 09, concrete is 03, and electrical is 26.',
  'est-ada~est~The steepest running slope generally allowed on an accessible ramp (ADA) is:~1:8, steeper than the usual accessible maximum~1:12, the usual maximum running slope~1:6, a slope used on some short stair runs~1:2, which is essentially a short flight of stairs rather than an accessible running slope~1~The maximum running slope for an accessible ramp is 1:12. Steeper than that is not an accessible ramp.',
  'est-gc~est~General-conditions costs (staff, trailer, temporary utilities, dumpsters) typically:~Are a fixed fee no matter how long the job lasts on the calendar~Increase when the project duration grows and the camp stays longer~Are paid by the architect from the design contingency~Are the same as the contractor’s fee and may be combined in one line~1~General conditions live on the calendar. A longer job burns more staff, rentals, and temporary facilities.',
  'est-level~est~When two subcontractor bids differ a lot, the estimator’s first job is to:~Pick the lowest immediately and move on to the next trade~Level the scope — inclusions, exclusions, alternates, and quantities~Ignore both numbers until after award, then negotiate~Average them with no review of what each bid actually includes~1~A cheap number with missing scope is not a bargain. Level first, then compare.',
  'est-bond~est~A bid bond typically:~Paints the building and covers the cost of the final finish coats~Guarantees the bidder will honor the proposal and enter into a contract~Replaces insurance, so builder’s risk and liability can be omitted~Is a type of finish applied to structural steel after erection~1~The bid bond backs the promise that you will stand by the bid and sign the contract if you are awarded.',
  'est-alt~est~An alternate is:~A secret second job the owner may award without a written price~A defined add or deduct the owner may accept, priced as specified~An informal guess used to pad the bid when the design is incomplete~Only an allowance for unknown soils, never a defined scope change~1~Alternates are defined add or deduct prices the owner can take. Price them exactly as specified.',
  'est-allw~est~An allowance in a bid is:~The contractor’s fee, expressed as a placeholder on the form~A specified sum held for undefined scope, to be reconciled later~A bid bond posted with the proposal as security for the number~A punch-list item the owner can spend after substantial completion~1~An allowance is a placeholder sum for work that is not fully defined. It gets reconciled when the scope is known.',
  'est-temp~est~Temporary utilities, toilets, and dumpsters are typically:~Inside a rebar unit price, because temporary protection is assumed to be a steel-package~General conditions (or clearly assigned to a sub) and easy to double-count or miss~Never required on a commercial job if the owner occupies the site~Paid automatically by the city as part of the building permit fee~1~Temps are classic general-conditions items. Make sure they are assigned once, and only once.',
  'est-tax~est~Sales tax, bond rate, and insurance should be:~Ignored, because markups are always assumed to be net of tax and insurance~Applied per the instructions to bidders and the contractor’s actual rates~Always assumed at 10 percent, regardless of the jurisdiction or the bid form~Applied only to labor, never to material or to equipment rentals, regardless of the bid instructions~1~Follow the instructions to bidders and use actual tax, bond, and insurance rates. A wrong markup is a real miss.',
  'est-cheap~est~A low bid that is missing underground patch, fire-alarm monitoring, or blocking is:~A bargain you should always take, because the low number wins~A risk — the complete number is the one you can actually build~Automatically the winner, and leveling is not required by the form~Illegal to question, because a bidder’s exclusions cannot be raised~1~The complete number beats the cheap number. Missing patch, monitoring, or blocking will be paid later, usually by you.',
  'est-rfi~est~RFIs before bid are used to:~Decorate the drawings with clouds that do not change the work, and that never become addenda~Clarify conflicts and missing information so bidders price the same work~Replace the contract, so the agreement can be written after award from the RFI log~Order lunch for the bid team on the day the proposal is due~1~A pre-bid RFI clears conflicts so every bidder is pricing the same work.',
  'est-ld~est~Liquidated damages, if specified, should be:~Ignored in the estimate, because damages are only a legal issue after award and never a bid-day cost~Considered when you price schedule risk, staffing, and general-conditions duration~Added to the millwork grade as a percentage of the architectural woodwork package on the job~Treated as a concrete admixture that accelerates the set and can be omitted from the bid recap~1~LDs make the schedule expensive. They belong in how you staff the job and how you judge duration risk.',
  'bid-wall~bid~A 2x4 stud wall with 5/8-inch gypsum on both sides finishes at:~4 inches~4-3/4 inches~5 inches~3-1/2 inches~1~Actual stud depth is 3-1/2 inches, plus 5/8 inch on each side, which is 4-3/4 inches. Nominal 2x4 will lead you wrong.',
  'bid-emt~bid~A specification requires EMT, but an electrical bid assumes MC cable throughout. What is the risk?~None — EMT and MC are interchangeable in both cost and labor~A labor and material miss; EMT is usually more expensive to install than MC~The bid is conservatively high, so you can use the number as-is~MC is forbidden in every occupancy, so the bid will be rejected automatically~1~EMT is typically more labor than MC. If the spec requires EMT, an MC-based number is short.',
  'bid-ti~bid~On a TI, one sprinkler bid relocates heads to a new ceiling and another prices a full new system. What should you do first?~Always take the lower number, because both bids are assumed to describe the same work~Level the existing-conditions assumption: how much of the existing system remains?~Average the two bids and use the mean as a complete number, without reading exclusions~Throw out both and use a square-foot allowance with no further check of the actual work~1~This is the classic TI sprinkler gap. Find out what remains, then compare like scopes.',
  'bid-tamper~bid~Flow and tamper switches are furnished with the sprinkler system. Who typically monitors them?~Division 21 only, with no fire-alarm involvement required~The fire-alarm system, which is Division 28 work~The plumber, who wires the switches at the domestic water riser~The roofing sub, who monitors any device that sits in a rated ceiling and is assumed to own the switches~1~Monitoring is fire alarm. If the Division 28 bid excludes sprinkler-switch monitoring, you have a gap.',
  'bid-x~bid~A rated corridor specification calls for Type X gypsum. Regular 1/2-inch board is not an equal because:~It is a different color and will not match the adjacent walls~Type X is fire-rated board with a glass-fiber core~Regular board is always thicker and cannot fit the same wall~Type X is only an exterior product and cannot be used in a rated corridor or any interior assembly~1~The tested assembly calls for Type X (often 5/8 inch). Substituting regular board can void the rating.',
  'bid-soil~bid~The geotech report flags possible unsuitable soils, but the bid form is a lump sum with no unit prices. A prudent move is to:~Ignore the report, because a lump-sum form leaves no room for soil risk~Carry a unit price or allowance, or qualify the bid, for over-ex and import~Assume export is free and that unsuitable material will not be found~Put the risk in the millwork number, where hidden conditions are carried~1~Uncertain ground belongs in a unit price, an allowance, or a qualification — not in a silent lump sum.',
  'bid-svc~bid~A restaurant TI may need a service upgrade. Besides the electrician’s gear cost, what else should worry you?~Nothing — gear is always in stock and can be delivered the next day~Utility fees and long lead times that may sit outside the electrical quote~Only the paint in the electrical room, which is a Division 09 item~AWI Premium grade, which is required in the electrical room casework~1~Utility upgrades bring fees and long leads. Confirm they are in someone’s number and on the schedule.',
  'bid-awi~bid~One millwork bid is clearly lower than the others. The low bid assumed Economy grade; the spec is Premium. You should:~Take the low bid as a bargain, because grade never changes the hours~Treat it as a different scope and get a Premium number before you compare~Average it with the high bid and use the mean as a leveled number~Ignore grade; it never affects cost on commercial millwork packages~1~Premium is tighter work than Economy or Custom. You cannot compare those numbers until the grade matches the spec.',
  'bid-fs~bid~MEP bids are silent on firestopping of rated penetrations, and Division 07 has no firestopping sub. The risk is:~None — firestopping is never required on a tenant improvement~A real scope gap; assign it or carry it before you close the bid~The architect will do it in the field as part of the punch list~It is included in the door hardware, which covers all rated openings~1~Firestopping is often specified in Division 07 and often left to each trade. If nobody has it, you do.',
  'bid-hvac~bid~A TI turns open office into a commercial kitchen. The existing RTU was sized for office loads. The first mechanical question is:~What color is the thermostat, and who furnishes the new covers?~Can the existing unit and makeup-air path serve the new kitchen load?~Can the plumber hang the unit from the existing domestic water main?~Is Type N mortar specified for the kitchen’s masonry backsplash?~1~A kitchen can blow past an office-sized rooftop unit and will need exhaust and makeup air.',
  'bid-patch~bid~The plumbing bid for a new restroom includes saw cutting and underground, but is silent on the slab patch. You should:~Assume it is free, because saw cutting always includes the pour-back~Assign the patch to plumbing, concrete, or general conditions before you close~Take it from the millwork number, where slab repairs are usually hidden~Ignore it; patches are always by the city as part of the permit~1~Saw cut without a patch is an incomplete scope. Name who pours the slab back.',
  'bid-hw~bid~Two door bids are close on leaf and frame counts, but one is much lower. The lower bid is most likely missing:~The room names on the door schedule, which change the leaf count~Hardware sets, especially closers, exit devices, or electrified hardware~The paint color specified for the frames and the door leaves~The joist layout above the corridor, which changes the frame anchors~1~Hardware, not the leaf, often drives the opening cost. A cheap door bid is frequently a cheap hardware assumption.',
]);
const BANK = QUESTIONS.concat(MORE, MORE2, MORE3.filter((q) => q.skill !== 'bid'));
const BID_QS = MORE3.filter((q) => q.skill === 'bid');
const EST_Q = parseQ([
  'qto-cyu~qto~Concrete volume in a slab takeoff is usually expressed in:~Square feet~Cubic yards~Linear feet~Board feet~1~Cubic yards (CY) are the usual unit for concrete volume. Divide cubic feet by 27 to get cubic yards.',
  'qto-slab~qto~A 30 ft by 20 ft slab, 4 inches thick, is how many cubic yards before waste?~5.0 CY~7.4 CY~10.0 CY~27.0 CY~1~Convert 4 inches to 1/3 ft. Volume = 30 × 20 × 1/3 = 200 cubic feet. 200 ÷ 27 ≈ 7.41, about 7.4 CY before waste.',
  'qto-dw~qto~A 40 ft long, 8 ft high partition with gypsum on both sides and no openings is how many SF of board?~320 SF~640 SF~160 SF~1,080 SF~1~40 × 8 = 320 SF per side. Both sides: 640 SF, before any waste factor.',
  'qto-door~qto~A 20 ft by 8 ft wall, board on one side only, has one 3 ft by 7 ft door to deduct. Net SF is:~160 SF~139 SF~21 SF~100 SF~1~20 × 8 = 160 SF, minus 3 × 7 = 21 SF, which leaves 139 SF. Deduct only when your takeoff rule says to.',
  'qto-ftg~qto~A footing 27 ft long, 1 ft wide, and 1 ft deep is how many CY before waste?~1.0 CY~27 CY~3.0 CY~0.27 CY~0~27 × 1 × 1 = 27 cubic feet. 27 ÷ 27 = 1.0 CY even, before waste.',
  'qto-24~qto~When taking off a 2x4 stud wall thickness, you should use:~4 inches, the nominal size of the 2x4~3-1/2 inches, the actual dressed depth~2 inches, the nominal thickness of the 2x4~5-1/2 inches, the dressed depth of a 2x6~1~A dressed 2x4 is 1-1/2 by 3-1/2 inches. Nominal size will betray a wall-thickness takeoff.',
  'qto-waste~qto~The sound way to add waste to a takeoff is to:~Skip waste entirely and buy only the net quantity from the drawings~Calculate the net quantity first, then add a labeled waste factor~Always double the quantity, regardless of the material or the method~Hide waste inside a lump sum with no note on the takeoff or the recap~1~Net first, then waste. A 10% add-on is a common rule of thumb and should be called approximate unless the spec says otherwise.',
  'qto-dbl~qto~A classic takeoff error is:~Using actual lumber sizes in a wall-thickness or board-foot takeoff~Double-counting the same work in two units or two packages~Deducting an opening when the takeoff rule says to deduct it~Labeling a waste factor so a reviewer can see what you added~1~Footings, flashing, and blocking are often counted twice if packages overlap. Count the work once.',
  'qto-room~qto~Four walls of a 20 ft by 15 ft room, 8 ft high, no openings and no ceiling board, are how many SF?~280 SF~560 SF~300 SF~2,400 SF~1~Perimeter is (20 + 15) × 2 = 70 ft. 70 × 8 = 560 SF.',
  'qto-side~qto~A sidewalk 50 ft long, 5 ft wide, and 4 inches thick is about how many CY before waste?~3.1 CY~9.3 CY~1.0 CY~27 CY~0~50 × 5 × (4/12) = 83.3 cubic feet. 83.3 ÷ 27 ≈ 3.09, about 3.1 CY before waste.',
  'unit-an~unit~A unit price for a trade item generally includes:~Only the salesman’s lunch and the cost of printing the proposal~Material, labor, and often equipment for that unit of work~Only the permit fee paid to the city for that trade’s inspections~Only the design fee the architect charges to stamp the shop drawings~1~The unit price is usually the full direct cost to put that unit of work in place, before project markups.',
  'unit-pr~unit~If the production rate drops and the quantity stays the same, labor cost typically:~Goes down, because a slower crew is assumed to be a cheaper crew~Goes up, because labor hours are roughly quantity divided by production rate~Never changes, because the unit price is fixed once it is written~Affects only the fee, which is where production risk is always carried~1~Hours ≈ quantity ÷ production. Slower production means more hours and a higher unit cost.',
  'unit-pl~unit~A historical $/SF from another job should be treated as:~A binding quote for this bid, good enough to submit without a takeoff~A sanity check or a labeled plug, not by itself a bid for this job~A bond rate that can be copied onto the proposal form as-is~A substitute for a takeoff always, if the buildings look similar~1~History can warn you or fill a labeled plug. It does not replace a takeoff or a sub quote on this set of documents.',
  'unit-wa~unit~Waste on a finish takeoff is commonly:~Added after the net quantity, and labeled as a rule of thumb unless specified~Used to replace the net count so the takeoff can stay rough and unlabeled~Illegal to carry on a lump-sum bid, so waste must be omitted~Fixed by statute at thirty-seven percent on every finish material~0~A figure such as 10% is a common approximate rule of thumb. Call it what it is, unless the spec gives a factor.',
  'unit-up~unit~Unit prices are especially useful when:~Quantities are certain to the square inch and will never change in the field~Quantities may change in the field, such as over-excavation or rock~You want to hide scope gaps inside a unit that no one will audit~The architect asks for paint colors and wants them on a unit-price form~1~A unit price lets you adjust fairly when the ground or the documents change the quantity.',
  'unit-hr~unit~A practical way to think about labor hours is:~Hours ≈ quantity divided by the production rate for that method~Hours = fee percentage × CY, regardless of the trade or the method~Hours are always a lump sum with no units and no production rate~Hours = bond rate × SF, taken from the surety schedule~0~Production rates turn a quantity into hours. Then hours × the labor rate feed the unit price.',
  'unit-no~unit~Copying a unit cost from a dissimilar building type without checking it is:~Best practice, because a unit cost can be reused on any building type~A risk, because production, access, and details may not match~Required by CSI, which publishes one unit cost for each division~The same as a bond, which already covers a mismatched unit price~1~A warehouse slab and a downtown TI do not share the same production story. Check the work, then the number.',
  'unit-label~unit~When you plug a missing trade with a unit or $/SF, you should:~Leave it unlabeled so it looks bid and cannot be questioned later~Label it as a plug or allowance and note the source of the number~Hide it in the fee, where plugs are assumed to belong~Call it a shop drawing so it can be replaced after award at no cost~1~Labeled plugs can be replaced when a real quote arrives. Unlabeled plugs become silent risk.',
  'gc-dur~gc~General-conditions costs typically:~Stay fixed no matter how long the job lasts on the calendar~Increase when the project duration grows and the camp stays longer~Are paid by the architect from the design contingency fund~Are the same as fee and may be combined on a single close line~1~Staff, rentals, and temporary facilities live on the calendar. A longer job burns more GC cost.',
  'gc-items~gc~Which of these is typically a general-conditions item?~A stair stringer in miscellaneous metals, taken off with the steel~A job trailer, temporary toilets, and dumpsters for the camp~Type X gypsum used in rated corridors and shaft walls~A grease interceptor required on a restaurant tenant improvement~1~The camp — staff support, trailers, temps, toilets, and dumpsters — is classic general conditions.',
  'gc-fee~gc~Fee and general conditions are:~The same line with two names, reviewed as one combined markup with no separate camp or fee to explain~Different: general conditions are cost to run the job, and fee is markup~Both always 7 percent, copied from a historical median and then used as if it were a quote~Both part of Division 03, taken off with the foundation package~1~Do not bury one in the other. They answer different questions and are reviewed separately.',
  'gc-rich~gc~A useful historical sanity check on City Creek work is that:~GCs never matter, because fee is assumed already to cover the camp, the staff, and every time-driven site service~GCs often land a little over a tenth of the base and scale with months (approximate, not a target)~Fee should always be 20 percent, regardless of job size, market, or competition on this bid~GCs should exceed the trades, or the close is assumed to be short, even when the camp is actually lean~1~Treat that share as an approximate historical check, not a number to copy into the bid form.',
  'gc-tmp~gc~Temporary power, toilets, and dumpsters should be:~Assigned once, to general conditions or to a clearly named sub~Put in every trade package so the cost cannot be missed, even if doubled~Left off if the job is a tenant improvement in an occupied building~Paid automatically by the city as a permit fee, with no bid line~0~These are easy to double-count or miss. Name the owner of each item once.',
  'gc-staff~gc~Superintendent and project-management staffing in general conditions should be thought of as:~A function of duration and the job’s needs, not only of building area~Always a single superintendent no matter the duration or complexity~A substitute for a performance or payment bond on a lump-sum job~Part of the millwork package, not a general-conditions staffing cost~0~Staffing follows the schedule and the complexity of the work. Area alone will not set the staff.',
  'gc-longer~gc~If the schedule grows by two months, a likely effect is:~No change in general conditions, because the camp cost is a lump that never runs with the calendar~More cost for staff, rentals, and temporary facilities~A lower bond rate automatically, because the job lasts longer~Free dumpsters, because the hauler will extend the pulls at no cost for the added duration~1~Time is the fuel of general conditions. Price the months you actually have to be there.',
  'level-first~level~When two subcontractor bids differ a lot, you should first:~Pick the lowest immediately and move on to the next trade package~Level the scope: inclusions, exclusions, alternates, and quantities~Average them with no review of what each bid actually includes~Ignore both numbers until after award, then negotiate the work~1~A cheap number with missing scope is not a comparison yet. Level first, then choose.',
  'level-five~level~Bid leveling should usually check:~Only the proposal font, which is a signal of how careful the bid is~Inclusions, exclusions, alternates, quantities, and furnish-versus-install~Only the sales tax line, which is where unlike bids usually hide~Only the color of the cover, which is assumed to mark a complete bid~1~Those five lenses are where unlike bids most often hide.',
  'level-cheap~level~A low mechanical bid that excludes TAB and controls is:~A bargain you should always take, because the low number wins the trade~A different scope than a bid that includes them; level before you compare~Automatically complete, so leveling is not required on mechanical work~Illegal to question, because a bidder’s exclusions cannot be raised~1~Complete beats cheap. Make the scopes match, then look at the money.',
  'level-late~level~A quote that arrives an hour before bid close, unleveled, is:~Ready to plug in as the winner, because a late number is always current~A number you cannot yet trust until you have checked its scope~Always too high, so it can be discarded without a scope review~A bond, which can be posted in place of a leveled trade number~1~Speed does not replace leveling. A late number is raw ore until you have read it.',
  'level-avg~level~Averaging a complete bid with a bid that is missing underground patch is:~Sound estimating, because an average cancels the missing patch~A false comparison of unlike scopes, not a leveled number~Required by the proposal form whenever two plumbing bids are received~How fee is set, by averaging the trades and applying a single markup~1~Do not average unlike work. Raise the short bid or set the gap aside, then compare.',
  'level-furn~level~One millwork bid is furnish-only; the other is furnish and install. You should:~Treat them as equal lump sums, because both describe the same casework~Level for the missing install before you compare the two numbers~Always pick furnish-only, which is assumed to be the complete number~Ignore install because the painter will hang the cabinets in the field~1~Furnish-versus-install is a classic leveling item, especially in millwork, steel, and special equipment.',
  'level-spr~level~One sprinkler bid relocates heads; another prices a full new system. First:~Take the lower number, because both bids are assumed to describe the same complete system~Level the existing-conditions assumption: how much of the existing system remains?~Average them and use the mean as if both were a complete sprinkler number, without reading exclusions~Add them together and carry both a relocation and a new-system cost~1~This is the classic TI sprinkler gap. Same question, two different scopes, until you level it.',
  'gaps-one~gaps~A split-scope item such as firestopping should be:~Left for the field to argue once the walls are already open~Assigned to exactly one subcontractor or a general-conditions line~Put in every trade bid and also in the fee, so it cannot be missed~Ignored on TIs, because firestopping is not required in existing buildings~1~If everybody owns it, nobody does. Name a single owner.',
  'gaps-list~gaps~Which of these is a classic commercial scope gap?~Specified f’c at 28 days, which is a mix-design question only and is assumed to replace a gap list~In-wall blocking for cabinets, or slab patch after saw-cutting a restroom~The name of Division 08, which is a MasterFormat trivia item and is assumed to replace a gap list~A 2x4’s nominal size, which is a lumber-dimension question only and is assumed to replace a gap list~1~Blocking, patch, firestopping, roof curbs, TAB, gas piping, and switch monitoring are frequent dragons.',
  'gaps-28~gaps~Sprinkler flow and tamper switches are furnished with the sprinkler system. Who typically monitors them?~Division 21 only, with no fire-alarm involvement required~The fire-alarm system, which is Division 28 work~The landscaper, who monitors any device at the property line~The roofer, who monitors any switch mounted in the ceiling~1~If the Division 28 bid excludes monitoring, you have a gap.',
  'gaps-3~gaps~Three plumbing bids: A is lowest and silent on the slab patch, B and C include the patch. The first risk in A is:~That A is always the best value, because it is the lowest number~A scope gap: someone still has to pour the slab back after the underslab work~That patches are free, because saw cutting always includes the pour-back~That B and C are padding paint into a plumbing number, which is not how you read a three-way exclusion split~1~Saw cut without a patch is incomplete. Either add the patch to A or do not compare it to B and C yet.',
  'gaps-ex~gaps~The cheapest quote often hid:~The inclusions only, which are rarely where a cheap number is short~An exclusion. Read every quote’s exclusions against the documents~The company logo, which is assumed to mark an incomplete proposal~The bond form, which is where scope gaps are usually disclosed~1~Exclusions are where scope gaps are written in plain language.',
  'gaps-curb~gaps~Roof curbs, TAB, and condensate drains are:~Never a coordination item, because each trade includes them automatically~Frequent splits among mechanical, roofing, and sometimes plumbing~Part of Division 08 automatically, bid with the curtain-wall package~Covered by Type X board, which is assumed to include rooftop curbs~1~These items fall between trades unless you name an owner.',
  'gaps-block~gaps~In-wall blocking for upper cabinets is typically:~Always in the millwork install price, including the in-wall labor~A framing or drywall item, and a gap if nobody carried it~The electrician’s job, because outlets often sit in the same wall~Not required in commercial work if the cabinets are surface-hung~1~If the millwork bid assumes blocking is in the wall, and framing did not carry it, you will pay in the field.',
  'markup-7~markup~A City Creek historical fee often lands near a 7% median. You should treat that figure as:~A binding quote for every job, ready to paste onto the proposal form~An approximate historical observation, not a quote for any one bid~A bond premium, taken from the surety schedule as a fixed rate~A general-conditions rate, used to price the camp as a percent of base~1~The median is a landmark, not a contract. Fee still follows job size, risk, competition, and judgment.',
  'markup-size~markup~As an approximate historical pattern, fee percentage often:~Rises as jobs get larger, because big work always carries a higher fee~Is higher on smaller jobs than on larger ones~Is fixed at 25% by law, regardless of size or competition~Equals the bond rate, so fee and bond can be carried as one line~1~Smaller work often cannot carry the same fee percentage as a large building. Treat the pattern as approximate, not a quote.',
  'markup-bond~markup~A performance and payment bond is typically:~The same as fee, and may be buried in the markup without a line~A separate line on the contract amount, priced from the current surety schedule~Free on all jobs, because a bid bond is assumed already to cover the performance and payment bond~A drywall unit price, taken off with the rated-wall package and assumed to include the bond premium~1~Do not invent a single bond percentage. Use the surety schedule and carry the bond as its own line.',
  'markup-br~markup~Builder’s risk should typically be:~The same policy as general liability, so one policy covers both~Carried as its own line until the agent quotes; usually a small fraction of the bid~Put inside the millwork number, where insurance plugs are usually hidden~Always 7 percent of fee, copied from a historical median~1~Builder’s risk is real insurance. Until you have a quote, carry a line and treat any plug as approximate.',
  'markup-order~markup~In a typical bid close, fee should be thought of as:~The same as general conditions, added at the same time as the camp~Coming after lines such as contingency, builder’s risk, and bond~The first thing you add, before the trades have been entered~A substitute for tax, so tax can be omitted when fee is present~1~Markups have an order. Trades and job costs come first, then insurance and bond lines, then fee. Add tax if it applies.',
  'markup-notgc~markup~Which statement is true?~Fee and general conditions are interchangeable names for one line~Fee is markup; general conditions are the cost to staff and run the job~Builder’s risk is a type of gypsum board used in rated corridors~A bid bond is a waste factor applied after the net takeoff~1~Mixing fee with GCs hides whether the camp or the markup is rich.',
  'markup-tax~markup~Sales tax, when it applies, should be:~Ignored, because tax is always the owner’s cost after award~Applied per the instructions to bidders and the actual tax rules~Always 10%, regardless of the jurisdiction or the bid instructions~Only on labor, never on material, equipment, or subcontract amounts~1~Follow the bid instructions and the real tax rules. A wrong tax assumption is a real miss.',
  'risk-allw~risk~An allowance in a bid is:~The contractor’s fee, expressed as a placeholder on the form~A specified sum held for undefined scope, to be reconciled later~A bid bond posted with the proposal as security for the number~A punch-list item the owner can spend after substantial completion~1~The allowance is a placeholder. It gets reconciled when the scope is known.',
  'risk-up~risk~A unit price is the better tool when:~The quantity is uncertain, such as over-excavation or rock~You want to hide a scope gap inside a lump sum that no one will audit~The fee looks too low on a large job and needs a place to hide dollars~The painter is running behind the drywall and needs a unit-price line~0~Unit prices let the quantity change without pretending you knew it on bid day.',
  'risk-cont~risk~Project contingency should typically be:~Buried silently in a trade unit price, where it cannot be explained later at a debrief or a review~Carried as its own line and adjusted for risk; no single official percentage~Always exactly 18 percent, copied from a statute that is assumed to govern the contingency on every bid~The same as builder’s risk, so one line is assumed to cover both insurance and every bid contingency~1~Historical jobs have often used a low-single-digit percent of base, but that is a judgment, not a rule.',
  'risk-soil~risk~If the geotech report flags possible unsuitable soils and the bid form is a lump sum with no unit prices, a prudent move is:~Ignore the report, because a lump-sum form leaves no room for soil risk~Carry a unit price or allowance, or qualify the bid for the uncertain dirt~Assume export is free and that unsuitable material will not be found~Put the risk in the millwork number, where hidden conditions are carried~1~Silent lump sums do not survive the ground. Use a unit price, an allowance, or a qualification.',
  'risk-ld~risk~Liquidated damages, if specified, should be:~Ignored, because damages are only a legal issue after award and never a schedule or pricing risk~Considered when you price schedule risk, staffing, and general-conditions duration~Added to the millwork grade as a percentage of the architectural woodwork package on the job~Treated as a concrete admixture that accelerates the set and can be omitted from the bid recap~1~LDs make time expensive. They belong in duration and staff, not in a footnote you forget.',
  'risk-qual~risk~A qualification is used to:~Decorate the proposal with language that does not actually state the open assumption on the form~Disclose work or risk that is not in the number~Replace the bid bond, so security can be omitted on any job that already has a written qualification~Set the paint color, which is where qualifications are assumed to be written~1~Qualifications are honest boundaries. They are not a substitute for leveling the work you did include.',
  'risk-hide~risk~Hiding an unknown soil risk inside an unleveled low number is:~Conservative practice, because a low number already includes the risk~A way to lose money later; price or disclose the uncertainty~Required by CSI, which forbids unit prices and allowances on dirt~The same as an alternate, which the owner may accept after award~1~Price what you can see. Disclose what you cannot. Do not hide either.',
  'str-low~strategy~On bid day, before you enthrone a low sub number, you should:~Level its scope against the documents and the other bids~Take it because it is late and low, without reading the exclusions~Average it with the high bid automatically and use the mean~Delete the alternates so the form can be closed in the last hour~0~The last hour is for leveling and gap-hunting, not for trusting a number you have not read.',
  'str-form~strategy~Besides trade numbers, a bid-day close must still get right:~The proposal form, alternates, unit prices, bonds, and insurance lines~Only the typeface used on the cover letter and the backup disks~The sequence of songs in the bid room, which keeps the team calm~The color specified for field hard hats, which is a close-out item~0~A perfect trade sheet on a wrong form is still a broken bid.',
  'str-rfi~strategy~Pre-bid RFIs are used to:~Decorate the drawings with clouds that do not change the work~Clarify conflicts so bidders price the same work~Replace the contract, so the agreement can be written~Order lunch for the bid team on the day the proposal is due~1~After the RFI deadline, you carry remaining document risk or you qualify.',
  'str-late~strategy~The sound use of the last hour on bid day is:~Inventing new unit prices you have never seen and have not leveled~Hunting remaining scope gaps and leveling the late quotes that just arrived~Deleting general conditions so the number will fit the target~Ignoring the proposal form because the spreadsheet already looks complete~1~Bid day is won by a complete number, not by theater in the last ten minutes.',
  'str-bond~strategy~A bid bond typically:~Paints the building and covers the cost of the final finish coats~Guarantees the bidder will honor the proposal and enter into a contract if awarded~Replaces insurance, so builder’s risk and liability can be omitted from the close~Is a type of finish applied to structural steel after erection, and is assumed to replace a bid or performance bond~1~The bid bond is the seal on the promise. Performance and payment bonds come later, on the work itself.',
  'str-unlike~strategy~If a late electrical bid assumes MC cable and the spec requires EMT, you should:~Plug it in as-is because it is lower than the leveled EMT numbers~Treat it as a scope miss and adjust or set it aside until it is leveled~Assume EMT and MC cost the same, so the number can be used as-is without a scope check~Move the difference into fee silently, with no note on the recap about the unlike electrical scope~1~EMT is typically more labor than MC. An unleveled low number can be a different job.',
  'str-inv~strategy~A City Creek practice when soliciting trades is to:~Invite only one sub per trade and wait for that single number on bid day, with no backup if that sub does not bid~Invite several subs per trade; only about a quarter of invites typically respond (approximate)~Wait until after award to call anyone, then bid the trades in the field as if bid day needed no coverage~Put every trade in one combined bid so a single sub is assumed to cover the entire building on bid day~1~Thin coverage is a bid-day risk. Start early on trades that rarely bid, and invite more than you need.',
  'con-del~contract~Design-bid-build, design-build, and CM-at-risk are:~The same delivery method with three logos and no change in who holds the design~Different delivery methods that allocate design responsibility and risk differently~Types of gypsum finish, used in place of Level 4 or Level 5 in the rooms~Bond tiers, used by the surety to set the performance-bond rate on the job~1~Know who designs, who holds the risk, and when the price is set. The estimate changes with the road you are on.',
  'con-ls~contract~A lump-sum contract is best described as:~A fixed price for a defined scope of work on the documents~A cost-plus arrangement with no ceiling on what the owner will pay~The same as a unit-price-only contract with no lump-sum work~A type of allowance held for work that is not yet defined~0~Lump sum needs a defined scope. If the scope is not defined, you need allowances, unit prices, or a different purse.',
  'con-gmp~contract~A GMP (guaranteed maximum price) is typically:~A ceiling around a cost-plus arrangement for the work~A type of sprinkler head listed for a concealed ceiling~A drywall finish level, used in place of Level 4 or Level 5~A bid bond posted with the proposal as security for the number~0~Costs are reimbursed, often with a fee, but they stop at the guaranteed maximum unless the scope changes.',
  'con-bonds~contract~A bid bond and a performance/payment bond:~Are the same instrument used twice, once at bid and once after the award~The bid bond backs the proposal; P&P bonds back the work and payment after award~Are both general-conditions staff costs, carried in the camp line of the close~Are waste factors applied after the net takeoff of each trade package~1~Do not carry one and assume you have the other.',
  'con-tools~contract~An alternate is:~A secret second job the owner may award without a written price~A defined add or deduct the owner may accept, priced as specified~The same as an allowance, held for work that is not yet defined~A type of contingency, adjusted in silence after the bid is closed~1~Allowances are placeholders. Alternates are optional defined changes. Unit prices cover changing quantities.',
  'con-ret~contract~Retainage is:~Never used in commercial work, and seen only on residential~A contract holdback, commonly around 5 or 10 percent~The same as fee, and may be deducted from the markup line~A drywall screw type specified in rated-wall assemblies and assumed to be the same problem as retainage~1~Check the contract or the specifications. Treat 5 or 10 percent as a common pattern, not a universal law.',
  'con-sub~contract~Substantial completion and final completion are:~The same milestone, with one date for occupancy and final payment~Different milestones; substantial completion is typically when the owner can occupy or use the work for its purpose~Only used in residential work, never on a commercial contract~Types of shop drawings submitted for structural steel and millwork~1~Know which milestone starts warranties, releases retainage (in part or in full), and ends liquidated damages, as the contract says.',
]);
const CAMP_Q = parseQ([
  'camp-nom~wood~The Nominal Liar asks: a 2x4 stud wall with 5/8-inch board on both sides finishes at:~4 inches~4-3/4 inches~5 inches~3-1/2 inches~1~3-1/2 inches of stud plus 5/8 on each side is 4-3/4 inches. This is the foundation of a clean wall takeoff.',
  'camp-soil~site~The Unsuitable Ground asks: the bid is lump sum, the geotech flags bad soils, and there is no unit price. You should:~Ignore the report, because a lump-sum form leaves no room for soil risk~Carry a unit price or allowance, or qualify the bid for the uncertain dirt~Assume the dirt is free and that unsuitable material will not be found~Hide it in millwork, where hidden conditions are often carried~1~The earth does not care about your lump sum. Unit price, allowance, or qualification.',
  'camp-leak~therm~The Patient Leak asks: envelope failures most often start at:~Too much insulation in the wall, which is assumed to force water inward~Poor flashing and transitions at windows, parapets, and roof-to-wall joints~Type X drywall, which cannot be used in an exterior assembly~A 28-day cylinder break, which is when most envelopes first leak~1~Water enters at the joints between systems. Level the flashings, or the keep will weep.',
  'camp-x~fin~The Rated Corridor asks: Type X is required, and a bid assumes regular 1/2-inch board. The risk is:~None — regular board and Type X are equal in a listed corridor~The tested fire assembly may be voided; Type X is the listed, glass-fiber board~Regular board is always thicker and cannot fit the same stud cavity~Type X is only for roofs and cannot be used in a rated corridor~1~The listing depends on the board. Substituting regular gypsum is not a savings; it is a gap.',
  'camp-sw~fa~The Silent Switch asks: who monitors sprinkler flow and tamper switches?~Division 21 only, with no fire-alarm involvement required~Division 28, which is the fire-alarm system on the job~The plumber, who wires the switches at the domestic water riser~The roofer, who monitors any device that sits in the ceiling~1~The Underforge is full of tie-ins. If fire alarm does not monitor the switches, the system is incomplete.',
  'camp-gap~gaps~The Dragon of Scope Gaps asks: Bid A is lowest and silent on slab patch; Bids B and C include it. You should:~Award A immediately, because the lowest number is the complete bid~Treat A as incomplete until the patch is assigned or added~Average all three and use the mean as a leveled plumbing number~Throw out B and C, because they padded the patch into the number~1~The complete number beats the cheap number. Name who pours the slab back.',
]);
const NUM_Q = parseNum([
  'num-slab2~qto~A 24 ft by 24 ft slab, 6 inches thick, is how many cubic yards before waste?~10.67~0.2~CY~24 × 24 × 0.5 = 288 cubic feet. 288 ÷ 27 ≈ 10.67 CY before waste.',
  'num-dw2~qto~A 30 ft long, 9 ft high partition with gypsum on both sides and no openings is how many SF of board?~540~2~SF~30 × 9 = 270 SF per side. Both sides: 540 SF, before waste.',
  'num-ftg2~qto~A footing 40 ft long, 2 ft wide, and 1.5 ft deep is how many CY before waste?~4.44~0.15~CY~40 × 2 × 1.5 = 120 cubic feet. 120 ÷ 27 ≈ 4.44 CY.',
  'num-side2~qto~A sidewalk 40 ft long, 4 ft wide, and 4 inches thick is how many CY before waste?~1.98~0.15~CY~40 × 4 × (4/12) = 53.33 cubic feet. 53.33 ÷ 27 ≈ 1.98 CY.',
  'num-room2~qto~Four walls of a 12 ft by 16 ft room, 8 ft high, no openings, are how many SF?~448~2~SF~Perimeter is (12 + 16) × 2 = 56 ft. 56 × 8 = 448 SF.',
  'num-thk~qto~A 2x4 stud wall with 5/8-inch gypsum on both sides is how many inches thick?~4.75~0.05~in~The dressed 2x4 is 3-1/2 inches deep. Add 5/8 + 5/8 = 4-3/4 inches.',
  'num-door2~qto~A 16 ft by 8 ft wall, board on one side, minus one 3 ft by 7 ft door, is how many net SF?~107~1~SF~16 × 8 = 128 SF, minus 21 SF, leaves 107 SF if you deduct the opening.',
  'num-waste2~qto~640 SF of board plus a 10 percent waste factor is how many SF to buy?~704~1~SF~640 × 1.10 = 704 SF. Add waste after the net count, and label the factor.',
  'num-cy3~qto~How many cubic yards are in 81 cubic feet?~3~0.05~CY~81 ÷ 27 = 3.0 CY exactly.',
  'num-slab3~conc~A 12 ft by 12 ft pad, 12 inches thick, is how many CY before waste?~5.33~0.15~CY~12 × 12 × 1 = 144 cubic feet. 144 ÷ 27 ≈ 5.33 CY.',
  'num-ramp~open~An accessible ramp at the maximum 1:12 slope must rise 30 inches. What is the minimum run, in feet?~30~0.2~ft~1:12 means 12 inches of run per inch of rise. 30 × 12 = 360 inches, which is 30 feet.',
  'num-studs~wood~How many 8 ft studs, at 16 inches on center, does a 16 ft wall need if you count both end studs?~13~0~ea~16 ft is 192 inches. 192 ÷ 16 = 12 spaces, so 13 studs including both ends. Openings are ignored here.',
  'num-bar~met~A #5 reinforcing bar has what diameter, in inches?~0.625~0.01~in~Bar numbers are eighths of an inch. #5 is 5/8 inch, or 0.625 inches.',
  'num-cf~conc~A 9 ft by 9 ft by 1 ft footing is how many cubic feet?~81~0.5~CF~9 × 9 × 1 = 81 cubic feet, which is also 3 CY.',
  'num-perim~qto~A rectangle 50 ft by 30 ft has what perimeter, in feet?~160~0~ft~Perimeter is (50 + 30) × 2 = 160 ft.',
  'num-both~fin~A 12 ft by 10 ft ceiling, plus the same area as a floor, is how many SF of finish if both are covered?~240~1~SF~12 × 10 = 120 SF each. Floor and ceiling together are 240 SF.',
]);
const TF_Q = parseTf([
  'tf-28~conc~Specified compressive strength (f’c) is normally verified at 28 days.~T~The 28-day cylinder test is the usual specified age. Strength can still rise after that if the concrete stays moist.',
  'tf-24~wood~A dressed 2x4 is actually 2 inches by 4 inches.~F~It is 1-1/2 by 3-1/2 inches after drying and planing. Nominal size will betray a dimension string.',
  'tf-fee~markup~Fee and general conditions are the same bid line.~F~General conditions are the camp; fee is the contractor’s markup. Carry them separately.',
  'tf-emt~elec~EMT stands for Electrical Metallic Tubing.~T~EMT is the common thin-wall conduit of commercial interiors, usually more labor than MC cable.',
  'tf-x~fin~Type X gypsum is fire-rated board with glass fibers in the core.~T~The fibers help the core stay intact in a fire. Substituting regular board can void a listed assembly.',
  'tf-ramp~open~An accessible ramp may be steeper than 1:12.~F~The maximum running slope is 1:12 unless a specific exception in the accessibility standard applies.',
  'tf-bond~markup~A performance and payment bond is the same thing as builder’s risk insurance.~F~The bond is a surety instrument; builder’s risk is property insurance. Carry them as their own lines.',
  'tf-cmu~mas~A standard CMU is nominally 8x8x16 and actually 3/8 inch under those dimensions.~T~The 3/8-inch reduction leaves room for the mortar joint on an 8-inch module.',
  'tf-dwv~plumb~DWV stands for Drain, Waste, and Vent.~T~Domestic water is pressurized. DWV runs by gravity. Price them as separate systems.',
  'tf-mon~fa~Sprinkler flow and tamper switches are typically monitored by the fire-alarm system.~T~Division 21 usually furnishes the switches; Division 28 monitors them. That split is a classic gap.',
  'tf-cont~risk~Project contingency should be buried silently inside a trade unit price.~F~Carry contingency as its own line and adjust it for risk. There is no single official percentage.',
  'tf-db~contract~Design-build and design-bid-build place design responsibility in the same place.~F~In design-bid-build the owner’s design team holds the design. In design-build the builder’s team typically does.',
  'tf-cy~qto~Cubic yards of concrete equal cubic feet divided by 27.~T~There are 27 cubic feet in a cubic yard. Forgetting the division is a classic takeoff error.',
  'tf-level~level~Bid leveling means awarding the lowest number without comparing scope.~F~You cannot compare two numbers until they describe the same work: inclusions, exclusions, quantities, and alternates.',
  'tf-cure~conc~The main purpose of curing is to speed surface finishing.~F~Curing keeps moisture and temperature so hydration can continue. Finishing is a different operation.',
  'tf-retain~contract~Retainage, when used, is commonly around 5 or 10 percent, but the contract documents govern.~T~Treat those figures as common practice, not a universal rule. Read the agreement.',
  'tf-13~fire~NFPA 13 is a common standard for automatic sprinkler systems.~T~Hazard class and NFPA 13 (or 13R/13D where they apply) write a large part of the sprinkler design.',
  'tf-oc~wood~Wood studs are often spaced 16 inches on center in commercial framing, though the drawings govern.~T~24 inches on center also appears. Always take the spacing from the structural drawings, not from habit.',
]);
const MORE4 = parseQ([
  'conc-slump2~conc~Slump of fresh concrete is primarily a measure of:~Compressive strength of the hardened mix at 28 days~Workability, or consistency, of the fresh mix~Air content alone, as a substitute for a pressure meter~The water-cement ratio by itself, with no other test~1~Slump is a consistency test. Strength depends on the mix, especially water-cement ratio and curing, not slump alone.',
  'conc-rebar~conc~In U.S. practice, a #4 reinforcing bar has a nominal diameter of:~1/4 inch~1/2 inch~3/4 inch~1 inch~1~Bar numbers are eighths of an inch. #4 is 4/8, or 1/2 inch.',
  'conc-joint2~conc~Control joints in a slab-on-grade are placed mainly to:~Increase slump so the mix will flow into the joint~Encourage shrinkage cracking to occur in a planned line~Replace all reinforcing in a lightly loaded slab-on-grade~Cure the slab faster by exposing a planned weak plane~1~The slab will shrink. Joints give that movement a planned place so random cracks are less likely to wander across the finish.',
  'conc-cov~conc~Cover over reinforcing steel is important because it:~Is only a finish issue, and can be adjusted after the pour~Protects the steel and helps it develop bond and fire resistance~Can be omitted indoors, where corrosion is assumed not to occur~Replaces the need for chairs or dobies to hold the bar in place~1~Adequate cover, as specified, protects the bar and lets it do its structural work. Chairs or dobies hold that cover during the pour.',
  'mas-mort~mas~Type S mortar, compared with Type N, is generally:~Weaker and used only for interior paint-grade masonry, never below grade~Stronger and often used at or below grade, or where higher strength is specified~Identical in every application, so Type N and Type S can be swapped freely~Illegal in commercial work and may be used only on residential veneer walls~1~Type N is common for above-grade veneer. Type S is the higher-strength choice often specified at or below grade. The spec governs.',
  'mas-weep2~mas~Weep holes in a masonry veneer are there to:~Decorate the head joint with open units at the first course~Let water that enters the wall cavity drain back out~Replace through-wall flashing so the metal can be omitted~Hold the insulation in place in the drainage cavity~1~Weeps work with flashing and a drainage cavity. Blocking them, or omitting the flashing, traps water in the wall.',
  'mas-bond~mas~A bond beam in a masonry wall is typically:~A decorative paint band applied after the wall is cleaned down~A grouted, reinforced course that ties the wall together~A type of flashing used at the base of a masonry veneer~An exterior grade of mortar only, never a structural course~1~Bond beams and lintels are structural elements. Missing the grout or the bar is a real scope and strength gap.',
  'met-wide~met~In the designation W12×26, the 26 most nearly indicates:~The exact depth in inches, measured at the center of the web~The nominal weight in pounds per linear foot of the member~The steel grade only, such as A36 or A992~The camber in inches specified for the member in the shop~1~Wide-flange designations pair a nominal depth with a weight per foot. A W12×26 is about 26 pounds per linear foot.',
  'met-galv2~met~Hot-dip galvanizing of structural or miscellaneous steel is:~Only a paint color selected for exposed interior steel~A zinc coating for corrosion protection, often at exposed or damp locations~The same as shop primer in every specification, and a substitute for it~Never used on lintels or embedded items, only on wide-flange beams~1~Galvanizing is a coating system, not a color. If the spec calls for it on lintels, embeds, or exterior steel, primer is not a substitute.',
  'met-anc2~met~Anchor rods that must be in a foundation pour should be:~Added after the concrete has cured, with no setting plan or inspection required of the anchor~Located, coordinated, and held in place before the pour~Left to the painter, who marks the rod locations on the cured pier~Sized from the millwork drawings alone, not from the steel~1~A missed or misplaced anchor rod after the pour is expensive. The template and the setting plan belong in the estimate’s risk picture.',
  'wood-oc~wood~A common stud spacing in commercial wood framing is:~4 inches on center in every wall, regardless of the drawings~16 inches on center, though the drawings may also use 24 inches~8 feet on center, matching the length of a standard stud~Only as needed for paint, with no structural spacing required~1~16 inches on center is common; 24 inches also appears. Take the spacing from the structural drawings.',
  'wood-sill~wood~Pressure-treated lumber is commonly required for:~Interior crown molding only, because finish wood must be treated as trim and never as a sill or plate~Sills and other wood in contact with concrete or masonry~All finish carpentry, including doors, trim, and casework~Roof sheathing in every climate, in place of a weather barrier~1~Preservative-treated plates and sleepers at concrete are a frequent specification. Finish carpentry is usually a different grade of wood.',
  'wood-king~wood~In a typical framed opening, king studs and jack (trimmer) studs:~Are the same member with two names, and may be counted once~Work together: the king is full height, and the jack supports the header~Replace the need for a header over a typical framed opening~Are used only in steel studs, never in a wood-framed opening~1~The header carries the load above the opening to the jacks, which stand beside the kings. Missing that count is a common takeoff miss.',
  'therm-ice~therm~Ice-and-water shield is typically used:~As a substitute for all shingles, so a covering is no longer required once an ice-and-water membrane is specified~At eaves, valleys, and other vulnerable roof locations in many cold-climate details~Only on interior walls, as a vapor retarder behind the drywall, and never at eaves or other roof leak lines~Instead of structural decking, as a spanning membrane over the joists~1~It is a membrane at the places leaks start, not a replacement for the roof covering. The manufacturer and the spec set the extent.',
  'therm-under~therm~Roof underlayment under steep-slope shingles is:~Optional decoration, added only when the owner wants a colored felt~A specified layer over the deck, often felt or a synthetic underlayment~The same as a standing-seam panel, and a substitute for the covering~Always hidden in the masonry bid, because underlayment is a wall item~1~Underlayment is its own line in a roof takeoff. Confirm the product, the number of layers, and ice-and-water locations.',
  'therm-pan~therm~A pan or sill flashing at a window opening is intended to:~Hold the glass in place in lieu of a glazing stop or a gasket~Catch water that gets past the window and drain it out, not into the wall~Replace the window’s own warranty, so the unit can be unqualified~Serve as interior trim at the stool and the jamb returns, and is assumed to replace a sill pan or flashing~1~Flashing the opening is as important as the window unit. A bid that is silent on pan flashing is a bid with a leak waiting.',
  'open-label~open~A labeled fire door opening typically requires:~Paint only, so long as the leaf is a solid-core commercial door~A listed door, frame, and hardware set that together match the required rating~Any solid door from the supplier’s stock, with a closer added later~A window in every leaf, whether or not the listing allows the glass~1~The label, the frame, and the closer or exit device are a system. A cheap leaf without the listed hardware is not the specified opening.',
  'open-closer~open~Door closers on rated or accessible openings are:~Always optional decoration, and may be omitted from a rated opening to save cost~Often required by the hardware specification and by code for fire or accessibility~Supplied by the painter, who hangs them after the finish coats are complete~Priced in the concrete bid, because the frames are set in the foundation pour~1~Closers, exit devices, and electrified hardware often cost more than the leaf. Level hardware sets, not just door counts.',
  'open-set~open~A hollow metal frame in a masonry wall is commonly:~Taped on after the wall is painted, with no anchors in the masonry~Built in, or set, as the masonry is laid, unless details show a punched opening later~Made of finish wood and then wrapped with a hollow-metal face sheet~Set with no anchors, relying only on the door hardware for support~1~Coordination between masonry and the frame is a classic schedule and scope item. Confirm who furnishes and who installs.',
  'fin-level5~fin~A Level 5 gypsum finish, compared with Level 4, is generally:~Rougher and used only in closets and other concealed rooms~A skim coat specified for critical lighting or high-end surfaces~The same in every room, so Level 4 and Level 5 can be swapped~A fire-rating designation, used in place of Type X board~1~Level 4 is common in many commercial spaces. Level 5 is a higher, skim-coated finish. The finish schedule, not habit, governs.',
  'fin-act2~fin~ACT in a finish specification usually means:~A type of mortar specified for masonry veneer work~Acoustical ceiling tile, including the grid unless stated otherwise~Architectural concrete topping only, placed over a structural slab~A fire-alarm device, counted with the strobes and the horns~1~Confirm whether the bid includes tile, grid, hold-down clips, and cuts at sprinkler heads and lights. Those cuts are easy to undercount.',
  'fin-wet~fin~Installing floor covering on a slab that is still too wet risks:~A better bond, because a wet slab helps the adhesive cure~Failure of the adhesive or covering, and a claim against the schedule~A higher fire rating, because moisture is assumed to protect the board~Nothing, if the room is already painted and the HVAC is running~1~Moisture limits and testing belong in the finish spec. A wet slab is a delay or a rework, not a savings.',
  'fire-13r~fire~NFPA 13R, where it applies, is:~A roofing standard for steep-slope shingles and underlayment~A sprinkler standard often used for residential occupancies~The same as NFPA 13 in every building, so the scopes can be swapped~A concrete finishing guide used to set the slab’s flatness tolerance~1~13, 13R, and 13D are different scopes. Pricing a 13R building as if it were 13, or the reverse, is a design and cost miss.',
  'fire-head~fire~A common reason sprinkler head counts change on a tenant improvement is:~Paint color in the lobby, which is assumed to change the listed head finish and the sprinkler-head layout~New walls, ceiling types, and hazard, which move or add heads on the existing grid~The brand of the wrench in the riser room, which is assumed to set the head count on the sprinkler drawings~The millwork grade alone, which is used to classify the occupancy hazard and to set the sprinkler-head layout~1~Existing coverage rarely survives a new layout without relocation. Walk the existing system and the new reflected ceiling plan together.',
  'plumb-fu~plumb~Fixture-unit counts in plumbing are used primarily to:~Pick tile colors in the restrooms and the locker rooms~Size piping and, in many methods, to estimate the load on the system~Set the fire-alarm address for each fixture in the restroom~Replace a soils report, because fixture units classify the excavation~1~Counts of fixtures still matter for price, but the pipe sizing and the service size follow the fixture-unit load, not a guess from floor area.',
  'plumb-clean~plumb~Cleanouts on a DWV system are:~Optional decoration, added only when the owner wants extra access~Required at specified locations so the piping can be maintained~The same as a roof drain, and may be used to take rainwater~Always by the electrician, who provides access at every junction~1~Missing cleanouts is both a code problem and a change-order magnet. They belong in the takeoff, not as a field afterthought.',
  'plumb-wh~plumb~A commercial water heater or boiler substitution should be checked for:~The color of the jacket only, which is what is assumed to drive the equipment price on a water-heater schedule~Capacity, fuel, venting, and whether expansion or mixing valves are in the quote~Whether Type N mortar is specified for the equipment-room walls, used as if it sized the water heater~The millwork grade, which is used to select the heater’s finish and is assumed to set the equipment size~1~Equipment substitutions quietly drop venting, pans, valves, and controls. Level the accessories, not only the tank.',
  'hvac-ton~hvac~A common approximate rule of thumb is about 400 CFM per ton of cooling. You should treat that as:~A legal maximum in every code, used in place of a load calculation~An approximate starting check, not a substitute for a load calculation~Exact for every kitchen and every office, in every climate~The same as the electrical load, and can be copied from the panel schedule~1~Tonnage and airflow come from load calculations and the equipment data. The 400 CFM/ton figure is only a rough check.',
  'hvac-exh~hvac~A commercial kitchen hood typically requires:~A larger paint allowance only, which is where kitchen exhaust costs are sometimes parked on a recap~Exhaust and a designed makeup-air path, often with fire suppression at the kitchen hood~A credit, because a hood is assumed to reduce the HVAC load and pay for itself in the bid~The fire-alarm vendor’s work, as if a notification appliance were the same as a hood exhaust system~1~Turning an office into a kitchen is a mechanical problem, not a thermostat problem. Exhaust and makeup air are easy to leave out of a TI number.',
  'hvac-tab2~hvac~TAB in a mechanical bid usually means:~Tile and brick, taken off with the interior finishes package~Testing, adjusting, and balancing of air or water systems~The architectural typography used on the mechanical elevations~A type of firestopping used at duct penetrations of rated walls~1~TAB, start-up, and commissioning are frequent allowances or exclusions. Level them before you trust a low mechanical number.',
  'elec-volt~elec~A common commercial utilization voltage in the United States is:~12 volts only, in every commercial building regardless of the service~120/208V or 277/480V, depending on the service and the equipment~The same as household 240V in every tenant space, with no exception~Set by the millwork supplier, who chooses the voltage for the shop~1~Confirm the existing or specified service before you count panels and gear. A 208V assumption on a 480V building, or the reverse, is a costly miss.',
  'elec-gnd~elec~An equipment grounding conductor is:~Optional if the panel is new, so a grounding conductor can be omitted from a replacement or added circuit~A required part of most branch circuits, pulled or provided as the specification and the code require~The lightning-rod vendor’s work only, even when the drawings show grounding at the branch circuits~The same as a water-heater warranty, and may be taken from the plumbing close-out rather than the electrical bid~1~Grounding and bonding are easy to undercount in a cable or conduit takeoff. They are not optional decoration.',
  'elec-panel~elec~A panelboard that is already full on a TI should make you ask:~Ignored if the lighting number looks complete, because added load is assumed never to affect the service~Whether a new panel, a gear change, or a feeder is required to serve the added load, and that work must be in someone’s number~The fire-alarm vendor’s problem only, as if a communicator upgrade also resized the electrical service and every feeder~Solved by a larger paint number, which is where service-capacity work, a new panel, or a feeder is sometimes parked on a recap~1~Article 220 and the existing load are the law of the panel. A full can is a scope item, not a surprise for after award.',
  'fa-class~fa~Fire-alarm pathway classes (such as Class A or Class B) affect:~Only the paint in the riser room, which is a Division 09 finish item~Redundancy and therefore cable and labor, so they belong in the estimate~The concrete slump used to pour the housekeeping pad at the panel~The millwork grade specified for the fire-alarm control cabinet~1~A Class A loop is not priced like a simple Class B run. Read the specification and the drawings before you count the cable.',
  'fa-horn~fa~Notification appliances (horns, strobes, and speakers) must be coordinated with:~The soils report only, which is assumed to set horn, strobe, and speaker counts on the fire-alarm drawings~Ceiling types, mounting heights, and ambient conditions so the counts match the architectural set~The millwork grade, because AWI premium is assumed to include the notification-appliance layout~The landscaping plan only, as if planting counts were the same as a horn and strobe takeoff~1~A device count taken only from the fire-alarm plan can miss soffits, high ceilings, and sleeping rooms. Walk both sets.',
  'site-swppp2~site~A SWPPP is primarily:~A soils-report appendix only, and may be omitted if the geotechnical cover letter already looks complete~A stormwater pollution prevention plan, with practices that cost money and time on site~A fire-alarm programming sheet, which is assumed to include inlet protection and silt fence~A millwork finish schedule, used as if AWI grade set the stormwater practices on the civil sheets~1~Inlet protection, tracking pads, and inspections are real general-conditions or site costs. They are not free with the grading number.',
  'site-imp~site~Import versus export of earth is a bid risk because:~Paint colors change the volume of cut and fill in the grading plan, and that is sometimes treated as the actual dirt risk~Cut and fill, swell, and unsuitable material can change trucking quantities after the survey and geotech report are understood~AWI grade sets the haul distance from the site to the disposal facility, as if a millwork finish grade governed the dirt volumes~EMT length controls the dirt, because site utilities are assumed to be measured only in electrical conduit on the civil sheets~1~A geotechnical report and a civil grading plan are the starting point, not a guarantee. Unit prices or allowances often belong on uncertain dirt.',
  'site-sw~site~A silt fence or inlet protection item is typically part of:~The hardware set, including gates and the temporary construction fence~Erosion and sediment control, often required before land disturbance~The sprinkler riser, which is assumed to include silt fence and inlet protection~The millwork delivery, which cannot enter the site until the fence is up~1~These items are easy to omit if you only take off curb and asphalt. Look at the civil details and the SWPPP notes.',
  'est-add~est~An addendum issued during bidding should be:~Ignored if you already closed the recap, even when the addendum changes drawings, specs, or the form~Acknowledged and priced; it can change drawings, specifications, or the proposal form before you submit~Filed after award only, because an addendum received before the deadline is assumed not to apply yet~Covered automatically by fee, so a late addendum never needs a takeoff or a form change~1~Missing an addendum is a classic bid-day failure. Keep a log and confirm every trade has the same set.',
  'est-alt2~est~An alternate is best understood as:~A typo on the form that can be corrected after the bid is submitted, with no separate price required~A defined optional scope with its own price, listed as the proposal form requires~A secret contingency the contractor may spend without an owner decision or a form entry~The same as an allowance, held for work that is not yet defined and reconciled only after award~1~Alternates must be leveled and entered on the form exactly. A trade number that is silent on an alternate is incomplete.',
  'est-allow~est~An allowance in a bid is:~A secret slush fund the contractor may spend however they like, with no specified scope and no reconciliation~A specified sum (or unit) carried for work that is not fully defined, and it must be identified as such~The same as fee, and may be kept by the contractor whenever the specified work is not actually bought~Illegal on a lump-sum job, so an allowance cannot appear on a commercial proposal form even when the documents define one~1~Allowances, unit prices, and contingencies are different tools. Name them, and do not use one to pretend the others exist.',
  'qto-scale~qto~Before you measure from a drawing, you should:~Assume every sheet is 1/8 inch = 1 foot, regardless of the title block~Confirm the scale of that sheet, and beware of sheets that have been printed off-scale~Use only the room names, which are enough to take off the quantities~Ignore dimensions in favor of a scale stick always, even when a written dimension is given~1~Written dimensions govern over a scaled measurement. An off-scale print will betray a takeoff that never checked the graphic scale.',
  'qto-dim~qto~If a written dimension and a scaled measurement disagree, you should generally:~Average them and use the mean as the takeoff dimension~Trust the written dimension and issue a question if the set is still unclear~Always trust the scale stick, even when a written dimension disagrees~Ignore both and use a previous job’s dimensions for the same room name~1~Notes and written dimensions take precedence over scaling. An RFI or a bid question is cheaper than a wrong quantity.',
  'unit-crew~unit~A production rate is most useful when it is:~A national average you can paste onto every job, with no check of crew size, method, or similar work~Tied to a crew size, a method, and a similar type of work, then used to turn quantity into hours~The same as a bond rate, copied from a surety schedule and used as a labor-production factor~Optional once fee is applied, because a rich fee is assumed already to include the labor hours~1~Hours ≈ quantity ÷ production. A rate without a crew or a method is only a rumor.',
  'unit-mob~unit~Mobilization for a trade is often:~Free if the job is nearby, because travel and equipment moves are assumed never to be a real cost~A real cost for getting people, tools, and sometimes equipment to the site, and may be a separate line~The same as the performance bond, already carried in the close and assumed to cover a trade’s mobilization~Paid only in retainage, and never shown as a line on the recap even when the trade prices mobilization separately~1~Small quantities with a full mobilization can blow up a unit price. Ask whether mob is in the unit or on its own line.',
  'gc-dur2~gc~If a job’s duration grows by two months, general conditions typically:~Stay the same, because staff, trailers, and toilets are assumed not to run with the calendar~Increase, because staff, trailers, toilets, and many site services run with the longer calendar~Fall automatically, because a longer job is assumed to be easier to staff and cheaper to camp~Move into fee only, so the camp itself can stay at the original duration even when the schedule grows~1~General conditions live on the calendar. Duration risk is GC risk, not only a trade problem.',
  'gc-winter~gc~Winter conditions, when they apply, are:~Never a cost in a cold climate, because production never drops in winter~Temporary heat, protection, and production loss that should be priced or qualified~Covered automatically by builder’s risk in every policy, with no extra line~The same as curing compound only, and may be taken from the concrete unit~1~A schedule that runs through winter without a winter line is an optimistic schedule. Price it or qualify it.',
  'level-qty~level~When two mechanical bids differ by a large amount, a first leveling step is:~Picked by price alone, even when one bid omitted equipment, counts, exclusions, or an alternate~Compare included equipment, counts, exclusions, and alternates until the scopes actually match~Awarded to the lower number automatically, without reading whether counts or exclusions actually match~Averaged and hidden in fee, so the recap no longer shows which equipment or alternate was carried~1~A cheap number is often a short scope. Level first; then you can talk about price.',
  'level-add~level~Trades should be leveled against:~Only the verbal quote from last week, before the last addendum arrived~The same addenda, alternates, and drawing set as the proposal you will sign~Different revision clouds on purpose, so each sub can pick a set~The landscape plan only, which is assumed to govern every trade~1~A sub bidding an old addendum is not bidding your job. Confirm the set on every number you intend to use.',
  'gaps-fs2~gaps~Firestopping of rated penetrations is a frequent gap because:~It is never specified, so firestopping can be omitted from a commercial bid with no further assignment~It is often written in Division 07 and then left to each trade, so nobody owns it unless you assign it~The painter always includes it with the finish coats in rated rooms, so no separate firestopping bid is needed~It is part of the soils report, and is priced with the site package rather than with the rated assemblies~1~If Division 07 has no firestopping sub and the trades are silent, you still have to build it. Name the owner.',
  'gaps-cut~gaps~Saw cutting a slab for new underground, without a patch, is:~Always complete in the plumber’s number, including the saw cut, excavation, backfill, and the slab patch~An incomplete scope; someone must saw, excavate, backfill, and pour the slab back before that line can be closed~Never required on a renovation, because an existing slab is assumed never to need a saw cut or a patch~Paid by the testing lab automatically, as if a cylinder test included saw cutting and the slab patch~1~Name who cuts, who excavates, who patches, and who matches the floor finish. Four trades can each assume it is another’s work.',
  'markup-ord~markup~A sound order of close, in outline, is to:~Place fee first, before contingency, builder’s risk, or bond, even when the instructions require a different order~Place contingency, builder’s risk, and bond lines, then fee, as the bid instructions require~Hide every close-out markup in a single trade unit, so the form shows only one unexplained lump~Skip bond and insurance if fee looks large, because a rich fee is assumed already to include those close-out lines~1~The exact stack follows the instructions to bidders. Do not invent a single percentage, and do not treat a historical median as a quote.',
  'markup-br2~markup~Builder’s risk, until a broker quotes it, is often:~The same policy as general liability, so one insurance line is assumed to cover builder’s risk as well on every job~A small fraction of the bid carried as its own line, then updated when the insurance agent quotes~Optional if a bid bond is present, because the surety is assumed already to pay for a construction-period property loss~Always 7 percent of fee, copied from a historical median and then used as if it were a builder’s-risk quote~1~Carry a line, then replace it with the quote. Historical size is a placeholder, not a guaranteed rate.',
  'risk-allw2~risk~An allowance is the better tool when:~You already know every quantity, so an allowance is assumed to be unnecessary on a complete set~The design is not defined enough to take off, but the documents give or allow a sum to carry~Fee can replace the missing design, so an allowance line is never needed when the fee looks rich~The architect will complete the design at no cost, so the bid can stay silent on the undefined work~1~Allowances are visible. A hidden pad inside a unit price is harder to explain and easier to argue about later.',
  'risk-qual2~risk~A bid qualification is useful when:~Stay silent and hope the reviewer never asks, even when the documents leave a material assumption open~You must state an assumption the documents do not resolve, and you do it clearly on the proposal~Hide it in a unit price the owner will not see, so the open assumption never appears on the form~Raise only the paint number, which is where unresolved document questions are sometimes parked~1~Qualifications are not a substitute for reading the set. They are a way to be honest about a remaining uncertainty.',
  'str-seq~strategy~A sound bid-day sequence is to:~Write fee first and hope the trades land, closing the form before scopes are leveled or gaps are found~Level scopes first, hunt remaining gaps, then close the form, bonds, and insurance lines on bid day~Cut every trade by ten percent first, and only then read exclusions, gaps, and the close-out lines~Skip bonds and insurance until after award, even when the form requires those lines in the submitted offer~1~The form you will sign is the bid. A perfect spreadsheet on a wrong form is still a broken bid.',
  'str-time~strategy~A late sub number received after you have already closed should be:~Entered blindly on the form, because a late number is always assumed to be current and complete~Treated with care: confirm the scope and the time stamp before you change a number you already understood~Ignored only if it is high, and taken if it is lower than the current number, with no scope check~Averaged with a number from another trade to make a blended lump that hides both scopes on the recap~1~Last-minute numbers are where scope errors sneak in. Speed matters; panic does not.',
  'con-gmp2~contract~A GMP (guaranteed maximum price) is typically:~The same as a hard-bid lump sum with no shared savings, no open-book cost, and no cap language to read~A cost-plus arrangement with a cap, and the contract will say how savings and changes are treated~A bid bond by another name, used only as proposal security and never as a construction-cost cap~Illegal in commercial work, so a guaranteed maximum cannot appear in a public or private agreement~1~Read how the GMP handles contingency, allowances, and shared savings. Those clauses change the estimate as much as the number does.',
  'con-dbb~contract~In design-bid-build, the builder typically:~Designs the project and then bids it, with no separate designer under the owner on a design-bid-build job~Bids a design prepared under the owner, and carries construction means and methods on the job~Never carries means and methods, because those are assumed to stay with the architect after award~Is used only on residential work, and cannot appear on a commercial public or private project~1~The builder is not the architect of record in a classic design-bid-build. Gaps in the documents still become the builder’s problem at bid time if they are not questioned.',
  'con-cm~contract~Construction manager at risk (CMAR) often differs from hard-bid lump sum because:~There is no contract at all, only a handshake and a letter of intent, with no cap and no preconstruction role~The CM may be involved before design is complete and later hold a GMP or similar cap, as the agreement states~The trades are never bid, because the CM is assumed to self-perform every division on a CMAR job~Fee is illegal, so the CM can recover cost only through general conditions and never through a fee line~1~Preconstruction services, bidding of trades, and the later cap are the usual shape. The agreement, not the label, controls the risk.',
]);
const NUM2 = parseNum([
  'num-bf1~qto~Using nominal sizes, how many board feet are in ten pieces of 2x8x12 lumber?~160~0~BF~Board feet ≈ thickness (in) × width (in) × length (ft) ÷ 12. 2 × 8 × 12 ÷ 12 = 16 BF each, times ten is 160 BF.',
  'num-bf2~wood~Using nominal sizes, how many board feet are in one 2x10 that is 16 ft long?~26.67~0.1~BF~2 × 10 × 16 ÷ 12 = 26.67 BF. Estimating typically uses nominal dimensions for board feet unless the bid says otherwise.',
  'num-cmu1~mas~How many standard 8x16-face CMU are in a 20 ft long, 8 ft high wall with no openings?~180~0~ea~The modular face is 8/12 × 16/12 = 128/144 SF. Area is 160 SF. 160 × 144 ÷ 128 = 180 units, before waste or bond-beam cuts.',
  'num-cmu2~mas~How many standard 8x16-face CMU are in a 40 ft long, 10 ft high wall with no openings?~450~0~ea~Area is 400 SF. 400 × 144 ÷ 128 = 450 units, before waste, lintels, or openings.',
  'num-sheet1~fin~How many 4 ft by 8 ft gypsum sheets cover 480 SF, before waste?~15~0~ea~Each 4x8 sheet is 32 SF. 480 ÷ 32 = 15 sheets. Add a labeled waste factor after the net count.',
  'num-sheet2~fin~640 SF of board plus a 10 percent waste factor requires how many 4x8 sheets?~22~0~ea~640 × 1.10 = 704 SF to buy. 704 ÷ 32 = 22 sheets.',
  'num-paint1~fin~As an approximate rule of thumb, 700 SF of wall at 350 SF per gallon, one coat, is how many gallons?~2~0.15~gal~700 ÷ 350 = 2.0 gallons. Coverage varies by product and surface; treat 350 SF/gal as approximate.',
  'num-paint2~fin~As an approximate rule of thumb, 700 SF at 350 SF per gallon, two coats, is how many gallons?~4~0.15~gal~Two coats double the area to cover: 1,400 ÷ 350 = 4.0 gallons. Confirm the product data sheet.',
  'num-rebar1~met~A 20 ft footing has transverse bars at 12 inches on center. Including both ends, how many bars?~21~0~ea~20 ft is 20 spaces at 12 inches, plus the starting bar, which is 21. Openings and dowels are ignored here.',
  'num-w8~met~A W8×18 beam 20 ft long weighs about how many pounds?~360~1~lb~The 18 is pounds per linear foot. 18 × 20 = 360 pounds, before connections, paint, or galvanizing.',
  'num-lf1~fin~Base trim around a 16 ft by 12 ft room, four walls and no deductions, is how many LF?~56~0~LF~Perimeter is (16 + 12) × 2 = 56 linear feet.',
  'num-slab5~qto~A 15 ft by 10 ft slab, 5 inches thick, is how many CY before waste?~2.31~0.1~CY~15 × 10 × (5/12) = 62.5 cubic feet. 62.5 ÷ 27 ≈ 2.31 CY.',
  'num-top~conc~A 20 ft by 30 ft topping, 3 inches thick, is how many CY before waste?~5.56~0.1~CY~20 × 30 × (3/12) = 150 cubic feet. 150 ÷ 27 ≈ 5.56 CY.',
  'num-dw3~qto~A 25 ft by 10 ft wall, gypsum on both sides, no openings, is how many SF of board?~500~1~SF~25 × 10 = 250 SF per side. Both sides: 500 SF, before waste.',
  'num-cy4~qto~A 10 ft by 10 ft slab, 6 inches thick, is how many CY before waste?~1.85~0.08~CY~10 × 10 × 0.5 = 50 cubic feet. 50 ÷ 27 ≈ 1.85 CY.',
  'num-bar2~met~A #4 reinforcing bar has what nominal diameter, in inches?~0.5~0.01~in~Bar numbers are eighths of an inch. #4 is 4/8, or 1/2 inch.',
  'num-stud2~wood~A 12 ft wall with studs at 16 inches on center, counting both end studs and no openings, needs how many studs?~10~0~ea~12 ft is 144 inches. 144 ÷ 16 = 9 spaces, so 10 studs including both ends.',
  'num-side3~site~A sidewalk 30 ft long, 5 ft wide, and 4 inches thick is how many CY before waste?~1.85~0.08~CY~30 × 5 × (4/12) = 50 cubic feet. 50 ÷ 27 ≈ 1.85 CY.',
  'num-room3~qto~Four walls of an 18 ft by 14 ft room, 9 ft high, no openings, are how many SF?~576~2~SF~Perimeter is (18 + 14) × 2 = 64 ft. 64 × 9 = 576 SF.',
  'num-cfm~hvac~Using the approximate 400 CFM per ton check, 5 tons of cooling is about how many CFM?~2000~50~CFM~5 × 400 = 2,000 CFM. This is only a rough check, not a substitute for a load calculation.',
]);
const TF2 = parseTf([
  'tf-astm~conc~ASTM C31 is a common standard for making and curing concrete test cylinders in the field.~T~Cylinders are usually made to a standard practice such as ASTM C31 and broken at the specified age, often 28 days.',
  'tf-nec~elec~NFPA 70 is the National Electrical Code.~T~The NEC (NFPA 70) is the usual electrical code reference in the United States, as adopted by the authority having jurisdiction.',
  'tf-aws~met~AWS standards commonly govern structural welding procedures and welder qualification.~T~Welding is not just a length of bead. Procedures, inspection, and qualification belong in the metals estimate when specified.',
  'tf-aisc~met~AISC is a common specification source for structural steel in the United States.~T~The structural drawings and the specification will say which AISC documents apply. Do not assume a grade or a coating.',
  'tf-smac~hvac~SMACNA manuals are a common reference for commercial duct construction standards.~T~Duct gauge, seams, hangers, and pressure class often follow SMACNA unless the spec says otherwise.',
  'tf-ipc~plumb~The International Plumbing Code and the Uniform Plumbing Code are two codes a job might adopt; the contract says which one governs.~T~Do not mix code families in your head. Read the cited code on the project.',
  'tf-osha~site~Trenching and excavation safety requirements can affect means, duration, and cost, not only field behavior.~T~Shoring, benches, and boxes are real costs. Unsuitable or tight sites make them more likely.',
  'tf-e84~fin~ASTM E84 is a common test for surface burning characteristics of finishes.~T~Flame spread and smoke development appear in many finish specifications. Substitutions must still meet the listed values.',
  'tf-ul~fire~A listed fire-rated assembly should be built with the materials and details in that listing.~T~A cheaper board or an unlisted penetration detail can void the rating. The listing is part of the scope.',
  'tf-nom~qto~Board-foot calculations commonly use nominal lumber sizes unless the documents say to use dressed sizes.~T~A 2x8 is called 2 by 8 in the board-foot formula even though it is dressed smaller. Confirm the takeoff rule if the spec is silent.',
  'tf-add~est~You should acknowledge every addendum on the proposal form as the instructions require.~T~A missing acknowledgment can reject an otherwise complete bid. Keep a log and confirm every trade has the same set.',
  'tf-unitp~risk~A unit price and an allowance are the same tool and can be used interchangeably.~F~A unit price covers a changing quantity of defined work. An allowance carries a specified sum (or unit) for work that is not fully defined.',
  'tf-fee2~gc~General conditions scale with time and staffing; they are not the same thing as fee.~T~If the job grows by months, the camp costs usually grow. Fee is a separate markup line.',
  'tf-13d~fire~NFPA 13, 13R, and 13D describe the same sprinkler scope in every occupancy.~F~They are different standards for different building types. Pricing the wrong one is a design and cost miss.',
  'tf-ada2~open~The 1:12 ramp slope is a maximum running slope in typical accessibility rules, not a minimum to aim for.~T~A flatter ramp is acceptable. Steeper than 1:12 is not, unless a specific exception applies.',
  'tf-scale~qto~Written dimensions generally govern over a measurement taken from an off-scale print.~T~Confirm the graphic scale, but trust the written dimension and ask if the set still disagrees.',
]);
const BID2 = parseQ([
  'bid-add~bid~An addendum landed yesterday and one mechanical bid is silent on it. You should:~Use that bid as-is because it is low, and assume the addendum was included~Confirm the sub has the addendum and get a revised number before you compare~Average it with a plumber’s number to stand in for the missing addendum~Ignore addenda on bid day, and price them as a change after award~1~A trade bidding an old set is not bidding your job. Level the documents first.',
  'bid-alt~bid~The proposal form lists two alternates. A low electrical bid is silent on both. The risk is:~Complete as submitted, even when the trade number is silent on an alternate the form requires~The number is incomplete until those alternates are priced or confirmed as having no impact~A reason to discard the trade bid entirely, even when the alternate can still be priced or confirmed~Covered by fee automatically, because a rich fee is assumed already to include every alternate on the form~1~Alternates must be entered as the form requires. A silent trade number is not a complete bid.',
  'bid-bond2~bid~The instructions require a bid bond, and you have not yet arranged it. The safest move is:~Mailed after the deadline if you remember, because a late bid bond is assumed still to be acceptable~Obtain the bond or a compliant guarantee before you submit; a missing bid bond can reject the proposal~Skipped if the fee looks large, because a rich fee is assumed already to include bid security~Replaced by a handwritten note on the form, which is treated as the same as a compliant bid bond~1~A bid bond backs the proposal. It is not the same instrument as a performance and payment bond.',
  'bid-level2~bid~Two drywall bids are $18,000 apart. Before you honor the low number you should:~Compared on price alone, because board type, finish level, and rating are assumed never to change the job~Compare inclusions, exclusions, board type, finish levels, and whether rated assemblies are in both~Awarded to the lower number automatically, even when one bid omitted rated assemblies or a finish level~Averaged and then hidden in fee, so the recap no longer shows which board type or rating was carried~1~A cheap drywall number is often a short scope: Type X, Level 5, or shaft walls quietly dropped.',
  'bid-soil2~bid~The geotechnical report flags possible unsuitable soils, and the site bids are lump sum with no unit prices. You should:~Assume export is included at no risk, and that unsuitable soils will not be found after award~Carry a qualification, allowance, or unit prices for over-excavation as the documents allow~Hide a pad inside the masonry number, which is where soil risk is sometimes parked on a recap~Ignore the report because it is not a drawing, and a lump sum is assumed to need no soils line~1~What the ground conceals will rewrite a lump sum. Use the right tool for uncertain quantity.',
  'bid-hw2~bid~A door bid matches leaf counts but is thousands low. The most likely miss is:~The room names on the plans, which change the leaf and frame counts~Hardware sets, especially closers, exit devices, or electrified hardware~The paint color of the frames, which is what drives the opening cost~The joist layout in the roof, which changes the door-frame anchors~1~Hardware, not the leaf, often drives the opening cost. Level the hardware sets.',
  'bid-form2~bid~Your trade sheet is complete, but the proposal form, bond line, and insurance still sit blank with thirty minutes left. You should:~Skip the signed form and submit only a recap spreadsheet, even when the instructions require the form~Complete the form, bond, and insurance lines before you close; the form you sign is the bid~Fill the bond line and skip the form, because a bid bond is assumed to replace a signed proposal~Leave insurance blank until after award, even when the form requires those close-out lines in the offer~1~A perfect trade sheet on a wrong or incomplete form is still a broken bid.',
  'bid-gc2~bid~A two-month delay is likely, and your general conditions were priced for the original duration. The close should:~Leave general conditions at the original duration, even when the project calendar has grown~Revisit staff, trailers, and time-driven site costs, or qualify the duration assumption~Cut the camp to zero and hide the difference in fee, as if a longer job needed no extra staff~Move all general-conditions cost into millwork, where duration risk is sometimes parked on a recap~1~General conditions live on the calendar. Duration risk is GC risk.',
  'bid-fs2~bid~Rated penetrations are specified, Division 07 has no firestopping sub, and the trades are silent. You should:~Assume the painter will do it with the finish coats in the rated rooms~Assign firestopping to a trade or a GC line and carry the cost before you close~Ignore it; ratings are only on drawings, not in the field, so no one must build them~Put it in the landscaping number, where rated penetrations are often carried~1~If nobody owns firestopping, you do. Name the owner.',
  'bid-rfi2~bid~A drawing conflict remains unresolved an hour before the deadline. A sound move is:~Guess a complete number and stay silent, even when the unanswered question would change the scope~Qualify the assumption clearly on the proposal, or carry an allowance if the documents allow it~Raise only the landscaping number, which is where unanswered RFIs are sometimes parked on a recap~Withdraw the bid automatically, even when a clear qualification or an allowed allowance would suffice~1~Qualifications and allowances are honest tools. They are not a substitute for reading the set, but they beat a silent guess.',
  'bid-qty2~bid~The civil quantities on a bid form do not match your takeoff. You should:~Erase the form and write your own quantities with no note, qualification, or attachment anywhere on the proposal form~Follow the form’s instructions; if they require the given quantities, bid those and qualify or attach your takeoff as allowed~Ignore the form and submit a sketch of your own quantities only, in place of the required written offer on the proposal~Average the two quantity sets and enter the mean on the form, with no qualification about the difference from the given quantities~1~The proposal form governs how quantities are offered. A side-by-side takeoff is useful, but only if you still bid as instructed.',
  'bid-late2~bid~A sub number lands after you have already closed the form. You should:~Entered blindly because it arrived last, with no check of scope, addenda, or the time stamp on the quote~Confirm the scope, addenda, and time stamp before you change a number you already understood on the recap~Taken only if it is lower, and ignored if it is higher, with no review of whether the scope actually matches~Averaged with the current number, so the recap hides both the late quote and the number you already had~1~Last-minute numbers are where scope errors sneak in. Speed matters; panic does not.',
]);
const MORE5 = parseQ([
  'gc-util~gc~Temporary utilities in general conditions usually include:~Assumed free from the city in every case, including power, water, toilets, and a trailer hookup for the camp~Power, water, and often toilets or a trailer hookup for the duration of the camp, assigned once in general conditions~Included in every plumbing fixture count, as if finish fixtures included temporary camp utilities~Paid by the architect automatically, as if the design fee already included temporary power and water~1~These costs run with time on site. Confirm what the owner provides and what you must buy.',
  'gc-clean~gc~Final cleaning is typically:~Optional if the fee looks tidy, because final cleaning is assumed never to be a real close-out cost~A close-out cost that should be assigned once, to general conditions or a named cleaning contractor~Always included in every paint number, including floors, glass, and the owner’s furniture after move-in~Paid by the architect’s insurance, as if a design policy included final cleaning of the building~1~If every trade excludes final clean and you also omitted it, the building still has to be turned over clean.',
  'gc-sec~gc~Site fencing, after-hours locks, and a temporary gate are:~Landscape decoration only, bid with the plants and the irrigation~Often general-conditions security and temporary site-control costs~Always furnished by the owner at no cost, even on an urban site~Part of the sprinkler riser, because the gate is a life-safety item~1~Urban and occupied sites make these more likely. Duration again drives the cost.',
  'gc-ins~gc~Builder’s risk is not a substitute for:~The same policy as builder’s risk, so one line is assumed to cover liability and workers’ compensation too~General liability or workers’ compensation, which are different policies with different jobs~Optional if a bid bond is present, because the surety is assumed to supply those liability coverages~Always 2 percent of fee, copied from a historical median and then used as if it were a quote~1~Know which policy you are carrying. Bond, builder’s risk, and liability are not interchangeable lines.',
  'gc-ph~gc~Phased occupancy or a long shutdown between phases tends to:~Leave general conditions unchanged, because a pause does not cost money~Increase mobilization, temporary protection, and time-driven camp costs~Automatically reduce fee by law, because a pause is a credit to the owner~Move all GCs into one trade lump, so the camp can be paused at no cost~1~A job that starts and stops twice is not the same camp as a single continuous schedule.',
  'gc-dump~gc~Dumpster pulls should be thought of as:~A one-time fee no matter the duration or the waste stream, with no later pulls counted in the estimate~A recurring cost tied to the waste stream and the calendar, assigned once so trades do not all carry it~Always free at the city yard, with no pulls, dumps, or haul-off to count anywhere in the estimate~Included in every millwork package automatically, so general conditions can omit dumpsters from the camp~1~Count pulls, not only the first drop. Double-counted dumpsters and missed pulls are both common.',
  'gc-survey~gc~Layout and a site survey or bench marks are:~Always the architect’s free service, so layout, as-builts, and control can be omitted from the bid~Often a GC or civil scope item that must be assigned before trades assume someone else has it~Included in every plumbing fixture count, as if a fixture schedule included site or building layout~Paid by the testing lab automatically, as if cylinder tests included construction survey and as-builts~1~If the site control is wrong, every trade inherits the error. Name who provides it.',
  'gc-winter2~gc~Temporary heat and enclosure, when winter work is planned, should be:~Ignored in a cold climate because production never drops in winter~Priced or clearly qualified, including fuel, equipment, and production loss~Covered automatically by every builder’s risk policy, with no extra line~Added only to the paint number, because cold weather is a finish issue~1~A schedule that runs through winter without a winter line is an optimistic schedule.',
  'gc-permit~gc~Building permits and utility fees belong in the estimate:~Only if the architect mentions them in a meeting, and not otherwise, even when the instructions assign the fees~When the instructions or the custom of the job assign them to the contractor, and they should be a visible line~Never, because the city always bills the owner, with no exception on a private or a public commercial job~Inside a hidden drywall unit, which is where permit and utility fees are sometimes parked on a recap~1~Confirm who pays. A missing permit or a surprise utility fee is a close-out problem you could have carried.',
  'gc-host~gc~On an occupied renovation, after-hours work and occupant protection are:~Never a cost if the fee looks healthy enough to absorb the nights~Real general-conditions or trade costs for access, dust control, and sometimes weekend labor~The owner’s problem only, with no effect on the bid or the duration~Covered by Type X board alone, which is assumed to be dust control~1~Occupied sites change hours, protection, and duration. Price the constraint, not only the new work.',
  'unit-prod2~unit~If a crew’s production is 800 SF per day and the takeoff is 4,000 SF, labor days are about:~2 days, as if you divided the production rate by the takeoff instead of dividing 4,000 SF by 800 SF per day~5 days, because days equal quantity divided by the production rate (4,000 SF ÷ 800 SF per day)~40 days, as if the crew produced 100 SF per day instead of the 800 SF per day given in the question~A lump you cannot estimate, because a production rate is assumed never to apply to a finish takeoff~1~Hours or days come from quantity divided by a production rate that matches the method and the crew.',
  'unit-waste2~unit~A 10 percent waste factor on 250 LF of base is how you should apply it:~Multiply the net 250 LF by 10 and enter 2,500 LF, as if the waste factor marked the entire takeoff up tenfold~Add 25 LF after the net count and label the factor, unless the specification already gives one~Ignore waste because a 10 percent factor is assumed never to apply to a linear-foot base-course takeoff~Subtract 25 LF from the net count, treating waste as a credit rather than an add after the net length~1~250 × 0.10 = 25 LF. Net first, then waste. Call a rule of thumb what it is.',
  'unit-mob2~unit~A small quantity with a full truck and crew mobilization often:~Uses the same unit price as a large run of the same work, with no mobilization premium on the short quantity~Needs a higher unit price, or a separate mobilization line, because the mob is spread over fewer units~Should be bid at zero to stay competitive, and then recovered later in a change order after award~Is paid entirely from fee, so the short-run unit can stay at the same price used on a long production run~1~Unit prices are stories about method and quantity. A punch-list size run is not a production run.',
  'unit-crew2~unit~Changing from a two-person crew to a three-person crew, if daily output does not rise enough, will:~Always lower the unit price, because a larger crew is always cheaper per unit~Raise the cost per unit, because more wages are chasing similar production~Have no effect on hours, because crew size does not change the rate~Replace the need for a production rate, because headcount is the estimate~1~Test the rate against the crew you actually plan to send, not a rate copied from a different method.',
  'unit-hist~unit~A unit price from last year’s job should be:~A legal quote you can paste onto this bid with no further check, even when the old job’s access and production do not match~A starting point only after you check similarity, production, access, and whether the old job still matches this one~A legal minimum unit you can paste onto this bid, even when the old job’s production and access do not match~The same as a bond rate, copied from a surety schedule and used as if it were a production unit for this work~1~History is useful. It is not a substitute for a takeoff and a method on this set of drawings.',
  'unit-mat~unit~A unit price for a trade item generally includes:~Only the salesman’s lunch and the cost of printing the proposal~Material, labor, and the equipment or tools the method requires~Fee, bond, and builder’s risk automatically, with no need for close lines~Design fees for the architect, who stamps the shop drawings for the trade~1~Read the quote. A material-only unit is not an installed unit.',
  'unit-over~unit~Overtime on a compressed schedule should be:~Ignored because overtime is assumed never to change a unit price, even on a night-work or weekend schedule~Reflected in the labor cost or clearly qualified, because premium time changes the unit~Hidden in the landscaping number, which is where premium-time labor is sometimes parked on a recap~Paid automatically from fee, so the labor unit can stay at the straight-time rate on an overtime job~1~A five-day job forced into three nights is not the same production rate.',
  'unit-sf~unit~A dollars-per-square-foot number from a different building is:~A perfect substitute for a quantity takeoff on any similar-looking building~Only a rough check until you prove the program, the finishes, and the details~Required by law on every bid, in place of a counted takeoff~The same as a unit price in the proposal form, ready to submit as-is~1~SF costs are rumors until the scope matches. Use them to sanity-check, not to skip the takeoff.',
  'unit-load~unit~If material price rises after you bid but before you buy, the risk usually sits:~Automatically with the owner in every delivery method, with no exception~Where the contract and any escalation or quote-validity terms put it~Only with the architect, who is assumed to buy the material after award~With the surety, who will pay the difference from the performance bond~1~Quote validity dates and escalation clauses matter. A stale material quote is a risk, not a guarantee.',
  'str-first~strategy~On bid day, the first work after the last numbers arrive is typically:~Filling the fee box before you read exclusions or level the scopes~Leveling scopes and hunting gaps, then closing markups and the form~Awarding every trade on first sight, without opening the exclusion list~Printing the cover in a new font, which is the last-hour close item~0~Sequence beats panic. A number you do not yet understand should not be enthroned on the form.',
  'str-back~strategy~A complete backup number for a late or missing trade is:~A waste of time if the low bid looks complete, so a backup number can be discarded before the deadline~A defense against a last-hour surprise or a no-show, even if you hope not to use the backup~Required only on public work over ten million, and optional on every other commercial or private job~The same as a bid bond, which is assumed already to replace the need for a backup trade number~1~Invite several. Keep a backup. Only about a quarter of invites may respond, as a rough historical pattern.',
  'str-cut~strategy~If you must cut a number in the last minutes, a sound habit is:~Shave every trade by the same percent, with no idea which line is fat and which line is already tight~Know exactly which line you are cutting and why, rather than shaving every trade blindly on bid day~Cut only general conditions to zero, because the camp is assumed to be the only place a bid can come down~Cut the bond first, because bid security is assumed never to be required once a number has been cut~1~Blind cuts reopen scope gaps you already closed. Cut with a reason, or do not cut.',
  'str-log~strategy~A bid log or recap that lists every trade, every backup, and every open gap is:~Optional decoration, kept only if the bid room has time to write it~The working map of bid day, and it should be updated as numbers land~Replaced by the cover letter, which is assumed to list every gap~Required only after award, once the trades have already been bought~1~The recap is how you see a hole before the owner does.',
  'str-own~strategy~Talking through a residual risk with the owner before the deadline is:~A sign of weakness that always loses the job, and must be avoided~Sometimes the right move when a document conflict cannot be resolved in time~Forbidden on every public bid, with no exception for a written question~Useful only after you have already submitted a silent guess on the form~1~A well-placed question or qualification can be better than a buried assumption. Know the procurement rules first.',
  'str-print~strategy~The last thing to check before you submit is often:~Only the recap spreadsheet, which is assumed to outrank the signed proposal form and the bid security~The proposal form, acknowledgments, bid security, and that the written amount matches the recap~Only the fee percentage, which is assumed to show whether the written amount already matches the recap~The coffee order for bid night, treated as if it were the checklist for the form, bond, and acknowledgments~1~Mismatched words and figures, a missed addendum check, or a missing bond have lost otherwise good bids.',
  'gaps-div~gaps~A split between Division 26 power and Division 28 fire-alarm pathways is:~Always the electrician’s exclusive work, including both the conduit and the low-voltage cable in every bid~A classic scope gap unless the drawings and the bids say who furnishes conduit and who furnishes cable~Always the security vendor’s exclusive work, including the empty conduit and every junction box~Never required on a commercial job, so access-control cable and conduit can both be omitted from the bid~1~Assign every pathway once. Paying twice is better than missing it, but naming it is best.',
  'gaps-blk~gaps~Blocking for millwork, grab bars, and door closers is frequently:~Included automatically in every drywall bid with no note, including specialties~Missed because carpentry, drywall, and specialties each think another trade has it~A soils-report item, priced with the site package and the over-excavation~Part of the sprinkler design fee, because heads need blocking in the wall~1~If the wall opens later to add blocking, you will pay for it twice. Assign it in the bid.',
  'gaps-access~gaps~Access panels for valves or dampers above a hard ceiling are:~Never required, because a hard ceiling can always be cut later at no cost~A frequent gap among mechanical, drywall, and architectural specialties~Always in the hardware set, with the door closers and the exit devices~Furnished by the concrete sub, who leaves an opening in every slab~1~A hard ceiling with no planned access is a change order waiting for the first failed valve.',
  'gaps-curb2~gaps~Rooftop unit curbs, flashing, and the opening in the roof are:~One trade’s work in every job, with no coordination among the packages~A common three-way split among mechanical, roofing, and sometimes steel~Always in the electrical bid, because the unit has a disconnect on the roof~Never a leak risk, so flashing of the curb can be left unnamed~1~Name who furnishes the curb, who sets it, and who flashes it. Silence is a leak.',
  'gaps-saw2~gaps~Who saw-cuts, excavates, and patches a slab for new underground should be:~Always in the plumber’s number automatically, including the saw cut, the patch, and the finish of the slab~Written into one trade or a GC line before you close, with the patch and finish called out~Never required on a renovation, because an existing slab is assumed never to need a saw cut or a patch~Paid by the testing lab automatically, as if a cylinder test included saw cutting, backfill, and the slab patch~1~Four trades can each exclude the same patch. Complete the loop: cut, excavate, backfill, pour, finish.',
  'gaps-temp2~gaps~Temporary protection of existing finishes on a TI is:~Never needed if you have fee, because a rich markup is assumed to cover every ding to existing finishes~Easy to miss when every trade excludes it and general conditions is also silent~The same as builder’s risk, which is assumed to pay for all dings to existing finishes automatically~Part of the fire-alarm programming, as if a panel sequence included floor and wall protection~1~Assign floor, wall, and elevator protection once. Occupied buildings make this more expensive, not less necessary.',
  'level-excl~level~The first thing to read on a sub bid, after the price, is often:~Only the bottom-line price, because inclusions and exclusions are assumed never to change the comparison~The inclusions, exclusions, and the list of addenda acknowledged on each bid being compared~Only the company name on the letterhead, which is assumed to tell you whether the scopes already match~Only the fee percentage, which is treated as proof that exclusions and addenda have already been leveled~1~A low number with a long exclusion list is not low until you add back the work.',
  'level-unit2~level~If one site bid is lump sum and another is unit prices on the same form quantities, you should:~Compared as written, even when one bid is per square foot and the other is a lump with different inclusions~Put them on the same basis before you compare, using the form quantities and the same inclusions~Discarded if the units differ, even when you can convert both to the same quantity and inclusion basis~Hidden in general conditions, which is where unit-basis differences are sometimes parked on a recap~1~Different commercial structures are not yet a comparison. Level the basis, then the number.',
  'level-tax~level~Sales tax showing on one trade quote and not on another is:~Ignored if the lower bid omitted tax, because a missing tax line is assumed never to change a leveled comparison~A leveling item: confirm whether tax is in the number, extra, or not applicable, per the instructions~Always added on top of every bid twice, so tax is counted as if it were an extra markup on the already-taxed number~The surety’s choice rather than yours, and may be ignored on bid day without reading the instructions to bidders~1~You cannot compare a tax-included number with a tax-excluded number until you align them.',
  'level-lead~level~Lead times and allowances for owner-furnished equipment should be:~Ignored if the equipment price looks low, because storage, setting, and hookup are assumed to be free~Leveled so that storage, setting, and hookup are in someone’s number if the bid includes those services~Always the manufacturer’s free service, so neither the GC nor the trade has to carry setting or hookup~Paid from builder’s risk automatically, as if a property policy included storage, setting, and hookup~1~A cheap hookup bid that assumes the equipment is on site and set is a different scope.',
  'level-alt2~level~Two bids that priced different alternates cannot be compared until:~You pick the lower base bid anyway, and ignore how the alternates were priced~Each alternate is stated the same way, or you adjust so both describe the same work~The architect deletes all alternates, so the forms no longer have to match at all~You hide the difference in contingency, and treat the bases as already leveled~1~Alternates are defined optional work. Align them, then compare.',
  'markup-stack~markup~Fee should typically be applied:~Before any other line, on a number that is still incomplete and unleveled~After the costs it is meant to mark up, in the order the bid instructions require~Only to the millwork package, which is assumed to carry the whole project markup~Instead of a bond, so bid security can be omitted whenever a fee line is present~1~Do not invent a single stack if the form already has one. Historical medians are not a quote.',
  'markup-fee2~markup~A City Creek historical fee often lands near a 7% median. That figure is:~A legal minimum on every job, ready to paste onto the proposal form as a quote~An approximate historical observation, not a quote for this bid or this client~The same as general conditions, and may be combined in one unlabeled close line~Fixed by the bond rate, so fee and bond are always the same percentage on a job~1~Treat the pattern as a check, then judge this job’s risk, size, and competition.',
  'markup-size2~markup~As an approximate historical pattern, smaller jobs often carry:~A lower fee percentage than large buildings, because small work is always assumed to be easier~A higher fee percentage than larger jobs, because the same overhead sits on less volume~A fee fixed at 25% by law, regardless of size, market, or competition on the job~No fee at all, because a small job is assumed to be unable to carry a markup line~1~The pattern is approximate. It is not a schedule you can paste into a proposal.',
  'markup-ins2~markup~General liability and workers’ compensation are:~The same policy as builder’s risk, so one line is assumed to cover every insurance need~Insurance carried as the company and the job require, not guessed as one invented rate~Optional if a bond is in the bid, because the surety is assumed to cover those losses~Always 7% of fee, copied from a historical median and then used as if it were a quote~1~Use current rates and the job’s actual exposure. Do not invent a number and call it a quote.',
  'markup-cont2~markup~Contingency, fee, and allowances should remain:~Combined into one unlabeled pad that cannot be explained later at a debrief~Separate, visible lines so each can be explained and adjusted for its own reason~Hidden inside a single trade unit, where the owner will not see the two tools~Omitted on any job over a million dollars, because volume is assumed to replace them~1~A blended pad is hard to defend. Name the tool you are using.',
  'risk-rock~risk~Rock, buried debris, or a high water table in the geotechnical report should usually trigger:~No change to a lump-sum dirt number, because the report is treated as only a warning to the grader~A unit price, allowance, or qualification for the uncertain quantity, as the documents allow~A cut to general conditions, so the camp is assumed to absorb whatever rock is found~An automatic add to millwork, which is where hidden ground conditions are often parked~1~The report is a warning, not a guarantee. Use a tool that can flex when the quantity changes.',
  'risk-occ~risk~Working in an occupied building raises risk mainly because of:~Paint color approvals, treated as the main duration risk on an occupied renovation~Access, after-hours labor, protection, and occupants, which affect cost and duration~The soils report becoming void, because occupied work is assumed to have no geotechnical risk~The NEC no longer applying, so electrical work can be bid without Article 220 load checks~1~Occupied work is not a night-shift discount by default. It is often a premium.',
  'risk-lead2~risk~A long-lead piece of gear with a quote that expires before award is:~Safe to carry at that price forever, even after the quote’s validity date has passed~A schedule and cost risk; confirm validity dates and a backup plan before you close~The architect’s purchase automatically, with no effect on the contractor’s bid price~Covered by the bid bond, which is assumed to pay if the quote expires before award~1~Expired quotes and long leads belong on the recap as risks, not as frozen facts.',
  'risk-design~risk~Incomplete design at bid time is best handled by:~Guessing a complete number and staying silent about the missing design in the contract documents~Allowances, unit prices, qualifications, or a delivery method made for incomplete documents~Raising fee to 25% and moving on, as if a richer fee could replace a missing set~Ignoring the missing sheets, and pricing only the cover sheet and the civil plan~1~The honest tool depends on the contract. Silence is not a tool.',
  'con-ret2~contract~Retainage, when the contract uses it, is commonly:~Always 50% by statute, regardless of the contract language or the jurisdiction~Around 5 or 10 percent, but the agreement and the jurisdiction govern the holdback~The same as a bid bond, held only until the proposal is accepted by the owner~Illegal in commercial work, and used only on residential contracts in every state~1~Read the retainage clause. Cash flow and close-out depend on it.',
  'con-sub2~contract~Substantial completion is typically:~The same as final completion and final payment, with no punch list remaining on the project~When the owner can occupy or use the work for its intended purpose, as the contract says~A shop-drawing stamp, used to release fabrication of the last trade on the job~A milestone used only in residential work, and never on a commercial contract~1~Warranties, retainage reduction, and liquidated damages often turn on this milestone. It is not punch-list zero.',
  'con-ld~contract~Liquidated damages, when they apply, are:~A surprise the owner invents after award, with no daily amount written anywhere in the documents~A contract amount per day (or similar) for late completion, used in your schedule-risk judgment~The same as a late fee on a material quote, paid only to a supplier for a late shipment~Paid from the bid bond automatically, every day the job runs past the contract date~1~Know the amount and whether it is enforceable as written. A tight schedule with heavy LDs is a risk, not a footnote.',
  'con-co~contract~A change-order process is:~Optional conversation after award, with no written process in the contract for changing the work~The contract’s method for changing scope, time, or price; know how it is priced before you bid~The same as an allowance in every case, spent however the contractor likes after award~Forbidden on lump-sum work, because a fixed price is assumed never to be able to change~1~How overhead and fee apply to changes is part of the deal. It is not always the same as the original fee.',
  'con-pay~contract~Payment terms, stored materials, and billing cycles should be:~Ignored if the fee looks right, because cash flow is not treated as an estimating issue~Read them before you bid; they affect cash flow and sometimes what you must carry in GCs~Set only by the sub after award, with no effect on the prime contractor’s bid or cash~Identical in every delivery method, so the payment clauses can be skipped on any job~1~A long payment cycle or a ban on stored-material billing is a real cost.',
]);
const MORE6 = parseQ([
  'str-pair~strategy~When two mechanical numbers are close, a sound next step is:~Award the lower one in the first second, because close numbers are assumed to be the same job~Read both exclusion lists and equipment schedules side by side before you pick a vendor~Average them and hide the gap in fee, so the recap looks clean on bid day for the owner~Throw both out and guess a mechanical number from a historical dollars-per-square-foot unit~1~Close numbers can still hide different boilers, controls, or test-and-balance scopes.',
  'str-clock~strategy~If the clock will beat a complete recap, you should:~Submit a blank form to hold a place, and finish the recap after the published deadline~Protect the form, the bond, and the known numbers, and qualify unfinished work if the rules allow~Invent the missing trades from memory, and enter them as if they had already been bid~Cut every line by ten percent in a rush, so the form can be closed without the missing scopes~1~A timely, honest bid beats a late masterpiece. Panic cuts are how silent gaps are born.',
  'str-who~strategy~The recap should show, for every division:~Only the low number, with no note of who is backup or what scope is still open~Who is carrying the work, who is backup, and what is still open on bid day~Just the fee percentage, which is assumed to show whether the bid is already complete~The coffee order for bid night, treated as if it were the working map of the close~1~A recap that only stores prices cannot tell you who owns firestopping at 3:55 p.m.',
  'str-owner2~strategy~A late owner-directed change to the bid form is best handled by:~Ignoring the change and using yesterday’s form, even if the late instruction was clear~Confirm the instruction in writing if you can, then follow the form you will actually submit~Calling every sub and canceling the bid, because a late form change is assumed to ruin the day~Hiding the change inside a unit price the owner will not see on the proposal form~1~The form you sign is the bid. A verbal twist at the last hour still has to land on paper.',
  'str-check~strategy~A second pair of eyes on the recap and the form is:~A luxury reserved for slow weeks only, and may be skipped whenever the bid deadline is tight~A cheap defense against a missed addendum check, a wrong amount in words, or a dropped trade~Required only on public work over ten million, and optional on every other kind of job~Proof that you do not trust the spreadsheet, and a reason to discard the recap entirely~1~Tired estimators miss obvious holes. A reviewer is part of the method.',
  'str-hold~strategy~Holding a residual risk in fee instead of naming it is:~Always cleaner than a qualification, and should be the default for every leftover residual~Sometimes done, but you should know the risk and the dollars, not bury an unknown~Required by most bid bonds, which are assumed to insist that residuals live only in fee~The same as an allowance the owner can see, and may be spent later without a change~1~Fee can carry a known residual. It is a poor hiding place for a scope you have not sized.',
  'str-walk~strategy~A pre-bid walk or site visit is most useful when you:~Skip the documents and only take photos, because the walk is assumed to replace the set~Compare the set to the real constraints: access, occupied areas, overhead work, and staging~Use it only to collect swag, and then price the entire job from the drawings alone~Assume the drawings already show every field condition, so the walk can be treated as optional~1~The walk is how you price the job that exists, not only the job on paper.',
  'gaps-sill~gaps~Window sills, stool, and interior trim at a new opening are:~Always in the glazing bid with no exception, including the stool, apron, and interior trim~A frequent split among glazing, millwork, and drywall or plaster that should be assigned once~Part of the fire-alarm riser, because the opening is treated as a life-safety item~Never required on a storefront, because the glass is assumed already to finish the hole by itself~1~A punched opening has more than glass. Name who finishes the hole.',
  'gaps-core~gaps~Core drilling for new piping or conduit through a structural slab is:~Always free because the hole is small, and no patch, sleeve, or firestop has to close it later~A coordination item among the trade that needs the hole, the cutter, and any patch or firestopping~The landscaper’s work, because a core is treated as if it were a site-utility punch~Forbidden on every renovation, so new piping is assumed never to be allowed to pass a structural slab~1~A core is not only a drill bit. Structure, patch, and rating have to close behind it.',
  'gaps-id~gaps~Temporary construction identification, dumpster signs, and project signage are:~Always furnished by the city at no cost, with no assignment required in the bid~Easy to miss when every trade excludes them and general conditions is silent~The same as a building permit, and may simply be taken from the already-priced permit line~Included in every millwork package automatically, so GCs can omit temporary signs~1~Assign site signage and temporary IDs once, or you will buy them in a hurry later.',
  'gaps-pad2~gaps~Housekeeping pads for equipment are:~Always poured with the original slab on every job, with no later housekeeping pad required~A common gap among concrete, mechanical, and housekeeping that must be assigned once~Part of the electrical gear warranty, so the vendor is assumed to pour the pad at no cost~Never shown because they are treated as optional decoration under the mechanical equipment~1~A unit that arrives with no pad still needs a pad. Name the trade and the finish.',
  'gaps-caulk~gaps~Interior sealant at dissimilar materials and at wet walls is:~Always in the paint number automatically, including wet-wall and dissimilar-material joints~Often excluded by paint, tile, and waterproofing unless you name the joints in the scope~A structural steel item, bid with the shop primer and the later field touch-up coat~Covered by the bid bond, which is assumed to pay if a joint is left unsealed after close-out~1~Walk the joint schedule. If nobody owns the joint, it will leak or crack on day one.',
  'gaps-lift~gaps~Hoisting, a crane, or a large lift for a trade that excluded hoisting is:~Never a cost if fee is healthy, because fee is assumed already to include a crane~A gap you either assign to that trade, share as a GC crane, or still have to buy~Always in the millwork carton, which is assumed to arrive on site already with a crane~Paid by the architect’s insurance, treated as a design-team conveyance cost on every job~1~A steel number that assumes a free crane is not a complete number until the crane is real.',
  'gaps-flash2~gaps~Door and window head flashing, when not clearly in the skin bid, is:~Optional in wet climates, because a tight head joint is assumed to keep the water out~A leak risk and a scope to assign to sheet metal, masonry, or the window installer~Always in the hardware set, packaged with the closers, strikes, and the exit devices~The electrician’s flashing, because power transfers are assumed to pass the same opening~1~Water does not care which division you forgot. Name the flashing.',
  'risk-weather~risk~A schedule that runs through a wet or freeze season without a weather plan is:~Fine, because weather is never treated as a cost in a known wet or freeze season~A duration and cost risk: price or qualify protection, temporary heat, or weather days~Automatically paid by builder’s risk in every policy, with no extra line required~The city’s problem only, because a permit is assumed already to include weather days~1~Weather is not a surprise in a known season. Carry a plan, not a wish.',
  'risk-labor~risk~A tight labor market or a remote site usually means:~Labor will cost the same as last year’s in-town job, with no travel or wage check~Production, per diem, travel, or wage risk should be judged, not copied from an old unit~You may omit supervision, because a tight market is assumed to staff the job itself~The bond will supply the crew at no extra cost, if the contractor cannot hire one~1~The crew you can actually hire is the crew you should price.',
  'risk-exist~risk~Unverified existing conditions — hidden structure, old piping, or unknown finishes — are best treated as:~Free, because they are already in the building and need not be priced anywhere in the contractor’s bid~A case for allowances, unit prices, qualifications, or investigative work, as the documents allow~A reason to skip the site walk, because hidden work is assumed to be invisible anyway on a renovation~Covered automatically by every contingency of any size, with no other estimating tool needed beside that pad~1~What you cannot see can still be in your lump sum if you stay silent.',
  'risk-ahj~risk~A strict authority having jurisdiction, or a late plan-review comment, is:~Never a bid risk, because plan review is assumed never to add work, comments, or time~A timing and cost risk for revisions, resubmittals, and sometimes added work after review~Solved by raising only the paint number, which is where AHJ comments are assumed to land~The same as a bid bond, which is assumed to pay the cost if the review runs late~1~Permit risk is real on tight public schedules. Know who carries revisions.',
  'risk-single~risk~A single-source specified product with a thin quote is risky because:~The color might be unpopular, which is treated as the main sole-source risk on the job~You may have no backup price if the quote expires, is incomplete, or the vendor cannot deliver~The NEC forbids single-source items on a commercial job, so the specification cannot actually be enforced~Fee cannot be applied to it, because a sole-source product is assumed to be net of markup~1~Sole-source is a procurement and schedule risk, not only a specification preference.',
  'risk-int~risk~Trade stacking — too many crews in one area at once — typically:~Improves every production rate, because stacked trades are assumed always to work faster~Lowers production and raises rework risk, so the schedule and labor should reflect it~Has no estimating effect, because stacking is treated as only a field-supervision issue~Is required by OSHA on every site, so it cannot be priced as a labor or schedule premium~1~A short duration with three trades in one corridor is not the same production as a clear floor.',
  'risk-pay2~risk~An owner with a history of slow payment, if you still bid the work, should make you:~Ignore cash and cut retainage yourself, so the published terms no longer matter in the bid~Judge cash-flow, billing terms, and how much risk fee or GCs should carry on this job~Omit the bond to save money, because a slow-pay owner is assumed not to need security~Assume stored materials will always be billed, regardless of what the contract actually says~1~A good number on a slow-pay job can still be a bad job. Read the payment clauses.',
  'level-brand~level~Two HVAC bids that named different equipment manufacturers should be:~Compared on price alone, because the manufacturer is assumed never to affect performance~Checked against the specified basis of design, substitutions, and performance before you pick~Averaged and awarded to both vendors, so each can furnish half the specified equipment~Ignored because brand is assumed never to affect cost, lead time, or specified performance~1~A cheaper unit that fails the schedule or the performance spec is not a savings.',
  'level-hour~level~One electrical bid is straight time, another assumes night work required by the owner. You should:~Pick the night-work bid as always cheaper, without confirming the owner’s work-hour constraint~Put both on the same work-hour basis, or confirm the owner’s constraint, before you compare~Discard the straight-time bid automatically, even if night work is not actually required~Hide the difference in millwork, which is where hour-basis gaps are often parked on the recap~1~Hour basis is part of scope. Level the clock, then the dollars.',
  'level-test~level~Testing, balancing, commissioning, or special inspections showing in only one bid means:~The lower bid that omitted them is the better value, and can be used as-is on bid day~Add the missing work to the short bid, or confirm it is carried elsewhere, before you compare~Those services are always free from the vendor, and may be omitted from every mechanical number~The architect pays them from the design fee, so the builder can exclude them from the bid~1~A number without test and balance is a different mechanical job.',
  'level-warr~level~Warranty periods that differ between two otherwise similar bids are:~Meaningless after award, because warranty term is never treated as part of the product~A leveling item if the specification requires a stated term for that product or system~Always a reason to pick the shorter warranty, which is assumed to be an automatic savings~The surety’s choice rather than yours, and may be ignored on bid day without a review~1~A one-year roof against a specified two-year warranty is not yet the same product.',
  'level-union~level~One bid is open shop and another is union on a job that requires a project labor agreement:~Can be compared with no further thought, because labor rules are assumed never to change the number~Must be read against the labor requirements of the job before the lower number is trusted~Means the union bid is always the wrong job, and can be discarded without reading the scope~Means the open-shop bid is always the wrong job, and can be discarded without reading the scope~1~The number has to be legal and buildable on this project, not only arithmetically low.',
  'level-dump2~level~If one drywall bid includes haul-off and another excludes dumpsters, you should:~Ignore haul-off as a tiny line that never belongs in a drywall bid comparison~Add dumpster or haul-off to the excluding bid, or confirm GCs already carry it, then compare~Always pick the excluding bid, because dumpsters are assumed to be free on a drywall package~Move the difference into fee silently, with no note left on the recap for a later reviewer~1~Haul-off is a real cost. Level it or you will buy a dumpster later.',
  'level-sub2~level~A bid that is only a material quote, against an installed bid, should be:~Treated as the same installed number, with no labor, equipment, or freight added~Completed with labor, equipment, and tax or freight as required before you compare~Thrown out in every case, even when you can complete it into a fair installed number~Awarded because material is assumed to be most of the work, and labor can be ignored~1~Material-only is not installed. Finish the number or do not use it as a trade lump.',
  'markup-close2~markup~A sound close-order habit, when the form does not dictate one, is to:~Apply fee first, then forget the rest of the close and the remaining insurance lines~Place known job costs, then contingency, insurance, bond, and fee in a visible, consistent stack~Hide every markup in a single trade unit, so the form shows only one unexplained lump~Skip the bond if fee looks large, because a rich fee is assumed already to include security~1~A City Creek historical habit is to see contingency, builder’s risk, bond, then fee — approximate, and only if the form allows it.',
  'markup-small~markup~On a very small job, fee as a percent may run higher because:~The law requires 25 percent on any job that falls below a stated dollar threshold~Overhead and risk do not shrink as fast as volume; treat any historical pattern as approximate~Bond rates disappear on small work, so the bond line can be omitted from the close~General conditions become free, because a small job is assumed to have no camp cost at all~1~A small job can still take a full close. The percent may look high; the dollars may not.',
  'markup-bond2~markup~A performance and payment bond is typically:~The same as a bid bond, reused after award as the performance and payment bond on the job~A separate close-line cost based on the bonded amount and the surety’s rate, not an invented number~Optional if fee looks large, because a rich fee is assumed already to include the bond premium~Always 7 percent of general conditions, copied from a historical median and used as a quote~1~Get a rate or a quote. Do not paste a memory and call it a price.',
  'markup-oh~markup~Home-office overhead is:~The same as field general conditions, and may be double-counted inside the job-site camp~A company cost often recovered through fee or a defined markup, not a substitute for the job-site camp~Always a visible line required on every public form, regardless of what the instructions say~Illegal to consider in a bid, so home-office cost cannot appear in either fee or general conditions~1~Do not double-dip: if fee is meant to cover home office, do not also park the same dollars in GCs without a reason.',
  'markup-esc~markup~A material escalation clause, when the documents allow one, is:~The same as a contingency you may spend freely on any later material price increase~A defined way to share or shift price risk on named materials, and it should be used as written~A reason to omit all material quotes, because escalation is assumed to cover the entire buy~Required on every residential bid by statute, and optional on commercial work in every state~1~Escalation is a contract tool. It is not a blank check and it is not automatic.',
  'markup-disc~markup~A trade discount or a prompt-payment discount should be:~Ignored if it makes the recap messy, even when you will actually receive the quoted discount~Only take a discount you will actually receive, and know whether the form requires it to be shown~Always added on top of fee twice, so the discount is counted as if it were extra markup~Given back only in cash under the table, and never shown honestly on the recap or on the proposal form~1~A discount you will not earn is not a savings. Do not bid a fantasy discount.',
  'unit-cyc~unit~Production should be stated in a unit that matches the takeoff, for example:~Any unit you like, because units are assumed interchangeable and need not match the takeoff~CY per day for excavation, SF per day for board, or LF per day for pipe, as the method requires~Only a lump sum with no production rate, so output cannot be checked against a quantity~Always hours and never quantities, even when the takeoff itself is in CY, SF, or LF~1~A rate in the wrong unit is a story about a different job.',
  'unit-learn~unit~The first day of a repetitive task is often slower than later days because of:~A law that forbids any production gain after the first day of a repetitive task~A learning or mobilization curve you should not ignore on short, repetitive runs~Union rules that cap daily output at one unit, regardless of the method or the crew~The soils report, which is assumed to set the first-day production of every trade~1~A two-day punch of a task may never reach the production of a three-week run.',
  'unit-access~unit~Work in a tight shaft, over a live lobby, or on a small lift usually:~Has the same unit price as open-floor work, with no production premium for tight access~Needs a lower production rate, or a premium, because access throttles the crew on that work~Should be bid at zero to stay competitive, and then recovered later in a change order~Is paid entirely from fee, so the unit can stay at the open-floor production rate~1~Method includes access. A corridor unit is not a gymnasium unit.',
  'unit-rework~unit~If the documents require a mock-up or a first-area approval, the estimate should:~Ignore it as design-team theater, with no hours or throwaway work carried in the bid~Include the mock-up, the time to revise, and any throwaway work the approval may create~Hide it in the landscaping number, which is where mock-ups are often parked on a recap~Assume the first try is always accepted, so no revision time or remake needs to be priced~1~A mock-up is real work. Sometimes it stays; sometimes it is demolished.',
  'gc-tempow~gc~Temporary power beyond a construction service — for example welders or a crane — should be:~Assumed free from the utility, even when welders or a tower crane will be running on the site~Checked against what the temporary service can actually support, and priced if you must supplement it~Taken only from the millwork number, which is where temporary power is often hidden in the recap~Ignored on steel jobs, because a crane is assumed always to arrive already with its own electrical service~1~A 60-amp construction pole will not run every machine. Confirm the load.',
  'gc-toil~gc~Temporary toilets and hand-wash stations are:~Never a GC cost, because the city is assumed always to furnish toilets at no charge for the camp~Recurring, headcount- and duration-driven costs that should be assigned once in the camp~Always furnished by the city at no charge, even on a private site with no municipal hookup~Included automatically in every plumbing fixture count, as if temporary fixtures were finish fixtures~1~Count weeks and heads, not only the first delivery.',
  'gc-photo~gc~Progress photos, a webcam, or required documentation can be:~Skipped if the fee looks pretty, because documentation is never treated as a real cost~A small but real general-conditions or close-out cost when the owner requires the records~The same as a building permit, and may simply be taken from the already-priced permit line~Paid by the civil engineer automatically, as if they were already part of the survey package~1~If the contract asks for a record, carry the time or the service.',
  'con-scope~contract~The contract documents typically include:~Only the proposal email, which is assumed to outrank the signed agreement and the drawing set~The agreement, conditions, drawings, specifications, and addenda, as the contract defines the set~Only the geotechnical cover letter, which is assumed to govern the work after award~The estimator’s private recap, which is treated as if it became the contract documents after award~1~Know what governs. A side email does not automatically outrank the agreement.',
  'con-prev~contract~Prevailing wage or a Davis-Bacon requirement, when it applies, should be:~Ignored if your usual shop rate is close, because a near miss is treated as good enough~Read and used in the labor price; it is not optional once the job is a covered project~Applied only to the superintendent, with craft labor left at the contractor’s shop rate~Covered by the bid bond rate, which is assumed already to include the wage difference~1~Under-waging a covered job is a compliance and cost problem. Price the wage that the job requires.',
  'con-insure~contract~Additional-insured, waiver-of-subrogation, or high limit requirements can:~Never affect cost, and may be ignored whenever a bid bond is already in the proposal~Affect insurance cost and sometimes who can bid the work, so read them before you close~Be ignored if a bond is present, because the surety is assumed to supply the extra limits~Be met by the landscaping sub automatically, who is assumed to carry the project’s high limits~1~A limit you cannot buy is a bid you cannot hold. Confirm coverage early.',
  'con-time2~contract~Time is of the essence, when the contract says so, usually means:~The schedule is only a suggestion, and delay is assumed to have no contract consequence~On-time performance is a contract duty, and delay has consequences the document describes~Liquidated damages are impossible in practice, even when the contract names a daily amount~You may finish whenever labor is cheaper, without notice or a contract time extension~1~Read the delay, notice, and damages clauses together. They are the schedule’s teeth.',
  'con-allow2~contract~An allowance in the contract should be:~Spent however you like with no accounting, as if it were a secret slush fund after award~Reconciled as the documents require, with overruns and underruns treated as the clause says~The same as fee in every contract, and may be kept by the contractor if it is not spent~Hidden after award so the owner cannot see it, even when the clause requires a reconciliation~1~Allowances are visible tools. They are not a secret slush fund.',
  'est-take~est~A complete takeoff habit is to:~Scale one sheet and multiply by gut feel, then stop as soon as the first trade bid arrives~Work sheet by sheet, mark what you counted, and reconcile totals to the program or a check quantity~Only count the cover sheet, which is assumed to hold every quantity used in the bid~Stop when the first trade bid arrives, and throw out the takeoff as if it were unnecessary on this bid~1~The marks are how you defend the number and how you find what you skipped.',
  'est-assump~est~Written estimating assumptions should:~Stay only in your head, so a reviewer cannot see what the number actually believed~Travel with the recap so a reviewer, or you in six months, can see what the number believed~Be deleted before the form is signed in every case, so the bid has no written assumptions~Replace the need for a takeoff, because assumptions are treated as a substitute for counts~1~A number without its assumptions is a rumor. Write them down.',
  'est-check2~est~A reasonableness check — SF costs, trade shares, or a second takeoff of a big number — is:~A waste once the spreadsheet looks pretty, and may be skipped in the last hour before the deadline~How you catch a dropped zero, a missed floor, or a trade that is too light before you submit~Required only by the surety after a loss, and optional on an ordinary bid with no claim history~The same as a bid bond, which is assumed already to guarantee that the quantities are right~1~Checks are cheap. A missed floor is not.',
  'est-alt3~est~Pricing an alternate should use:~The same sloppy shortcuts as a guess, with no incremental takeoff of the optional work~A takeoff of the incremental work the alternate describes, plus any follow-on trades it touches~Only a percentage of the base bid every time, regardless of what the alternate actually describes~The fee line alone, which is assumed to cover every optional scope listed on the form~1~An alternate is a small bid of its own. It can affect more than one division.',
  'est-rfi3~est~A pre-bid RFI is most useful when it:~Asks the architect to design the whole job again, a day before the published deadline~Clears a conflict that would otherwise force a guess, issued early enough for an addendum~Is sent an hour before the deadline as a stall, with no real expectation of a timely answer~Replaces reading the specification first, so the set need not be reviewed before you ask~1~Late questions may go unanswered. Early, precise RFIs protect the number.',
  'est-qtyf~est~If a bid form already lists quantities, your own takeoff is still useful because:~The form is always wrong, so you may substitute your own quantities in silence on the bid form itself~Check the given quantities, find gaps, and bid as the form instructs, with a qualification if needed~You should ignore the form and attach a sketch only, in place of the required written offer~Unit prices become illegal on that form, so a form with quantities can be discarded entirely~1~The form governs the offer. Your takeoff governs whether you understand it.',
  'therm-rb~therm~Cavity insulation and continuous exterior insulation are different because:~They have the same R-value in every wall, so the two products can be swapped freely~Continuous insulation can reduce bridging through studs; cavity insulation sits between the framing~Only cavity insulation is legal in commercial work, and continuous insulation cannot be specified~R-values cannot be added in any wall assembly, so the wall has only one R-value line~1~Read the assembly. A cavity R-value is not automatically a whole-wall R-value.',
  'therm-lap~therm~A weather-resistive barrier should typically be lapped:~Like a shingle against the weather, with details at openings as the manufacturer and drawings require~Upside down so water is trapped, which some installers treat as the usual commercial lapping rule~Only on the interior face in every climate, and never toward the weather on a commercial wall~Never at windows or doors, because openings are assumed not to need a weather-resistive barrier~0~Wrong laps and forgotten openings are common leak paths. Follow the system, not a habit from a different product.',
  'therm-vap~therm~Where a vapor retarder belongs in a wall is:~Always on the outside in every U.S. climate, as a single rule you can paste onto every job~A function of climate, assembly, and the specification, not a single rule for every job~Never required in any climate, so a vapor retarder can be omitted from every wall assembly~Always painted on the brick veneer, which is then assumed to be the wall’s vapor retarder~1~The wrong face can trap moisture. Read the design; do not invent a universal rule.',
  'therm-edge~therm~A slab edge or a balcony that interrupts insulation is a common place for:~Extra fee only, with no detailing or insulation continuity that actually has to be priced~Thermal bridging, which the drawings and energy specification may require you to detail and price~The fire-alarm control panel, which is usually assumed to be mounted at a slab or balcony edge~A soils-report waiver, because a balcony is assumed to replace the need for a foundation~1~Bridging is a performance and sometimes a cost item. Do not assume the insulation just continues through the concrete.',
  'therm-air2~therm~An air barrier is not the same thing as:~A weather-resistive barrier in every product; some materials do both, but the drawings must name the functions~Anything specified in Division 07, which is then assumed to be only an air-barrier product on this drawing set~Insulation R-value, which is treated as the same problem as air leakage in every climate and assembly~A building permit, which is assumed already to include the complete air-barrier specification for the job~0~Air leakage, rain, and vapor are related but not identical problems. Price the system that is specified.',
  'therm-roof2~therm~Tapered insulation on a low-slope roof is typically there to:~Decorate the membrane, so the roof will look sloped when it is seen from the street or from a drone~Create slope to drains when the structure is flat; take it off, rather than assume a flat board count~Replace the membrane entirely, so a separate covering is no longer required anywhere on that low-slope roof~Satisfy a masonry lintel schedule, which is how taper thickness is sometimes assumed to be set~1~A flat board takeoff on a tapered roof is a short number. Count the average thickness or the taper plan.',
  'therm-win2~therm~Window U-factor and SHGC, when specified, are:~Optional marketing numbers, and may be ignored if the installed glass simply looks clear in the finished room~Performance values the glazed units must meet; a cheaper unit that misses them is a substitution, not a savings~The same as the visible glass color, which is all the specification is assumed to require of the unit~Only used on residential work, and never specified on a commercial curtain wall, storefront, or window wall system~1~Confirm the performance grid. Appearance is not the same as the energy values.',
  'fa-init~fa~A fire-alarm initiating device is typically:~A horn or a strobe, which is assumed to start the alarm merely by making a sound~A detector, pull station, or similar device that starts an alarm or supervisory signal~The elevator cab lighting, which is assumed to be what initiates firefighter recall~A sprinkler wrench at the riser, treated as if it were an initiating device in the system~1~Initiating and notification are different shops in the same system. Count both.',
  'fa-nac~fa~Notification-appliance circuit voltage drop matters because:~Horns look better in gold, which is what some bidders treat as the driver of the circuit design~Devices at the end of a long run may not get enough power if the wire size and load were not designed~The NEC forbids strobes in commercial work, so voltage drop is assumed never to be a fire-alarm issue~Batteries are never used in these systems, so a long run can always be powered from the branch circuit alone~1~A beautiful device count with undersized circuits is not a complete fire-alarm number.',
  'fa-rec~fa~Elevator recall, when the building has an elevator and a fire-alarm system, is:~Never a coordination item, because the elevator contractor is assumed always to include the recall wiring and devices~A common interface among fire alarm, elevator controls, and sometimes sprinklers, and it must be in someone’s scope~The millwork installer’s work, because the cab finish is assumed already to include the recall wiring~Optional if the fee looks large, because fee is assumed already to include that life-safety interface~1~Recall is a life-safety interface. Silence between those bids is a gap.',
  'fa-mon~fa~Off-site monitoring or a digital alarm communicator, when required, should be:~Assumed free from the city as a courtesy already included in the building-permit fee~Carried as equipment, programming, and often a service or owner coordination item, as specified~Included automatically in every sprinkler head count, with no separate fire-alarm monitoring line~Paid only from builder’s risk, which is assumed already to include central-station monitoring service~1~A panel that cannot report is not a complete system. Read the monitoring requirement.',
  'fa-surv~fa~Pathway survivability or a listed cable type, when specified, usually:~Has no cost effect, because a listed pathway is assumed to be priced like ordinary cable~Changes cable, routing, or protection, and therefore the material and labor of the run~Applies only to landscape lighting circuits, and never to a fire-alarm notification pathway~Is the same as a weather-resistive barrier, and may simply be taken from the wall package~1~A specified pathway rating is not ordinary cable. Price the listing.',
  'fa-asb~fa~Addressable and conventional fire-alarm systems differ mainly in:~Paint color of the control panel, which is what some treat as distinguishing the two system types~How devices are identified and wired; you cannot swap them as equal without a design and a price difference~Whether sprinklers are allowed in the building, treated as the only difference between the two types~The soils classification on the civil sheet, used as if it were what chose addressable versus a conventional panel~1~Level the system type against the drawings. A conventional number on an addressable design is the wrong job.',
  'fire-resid~fire~NFPA 13R is typically aimed at:~Every warehouse, treated as if NFPA 13R were the same standard as NFPA 13 in every occupancy~Residential occupancies of a defined type; it is not automatically the same scope as NFPA 13 or 13D~Only outdoor canopies and loading docks, with no application to any residential occupancy~Kitchen hood suppression alone, as if a hood system replaced the need for a residential sprinkler standard~1~Pricing the wrong standard is a design error and a cost error. Read the cited document.',
  'fire-counts~fire~Sprinkler head counts should come from:~A guess based on the fee, with no check against the drawings, closets, or the design density~The drawings and the listed density, including closets, overhangs, and attic spaces the standard requires~The plumbing fixture schedule only, as if fixture counts were the same as sprinkler coverage on the floor~The number of fire extinguishers in the cabinets, used as a substitute for a sprinkler head-count takeoff~1~A missed combustible concealed space is a classic undercount. Read the standard and the plans together.',
  'fire-eq~fire~Seismic bracing for sprinkler piping, when required, is:~Never a cost in any jurisdiction, because seismic bracing is assumed to arrive free with the pipe~A material and labor add that depends on the specification and the seismic design category, not a free extra~Included in every sprinkler head automatically at no cost, regardless of the seismic design category~The electrician’s hangers, reused for the sprinkler mains as if the two trades already shared one support system~1~Bracing, stands, and extra fittings are easy to miss if you only count heads.',
  'fire-rit~fire~A fire-riser room that needs floor drains, heat, lighting, and a backflow preventer is:~Only a sprinkler cost in every case, with no plumbing, electrical, or HVAC work in the room~A multi-trade room: sprinkler, plumbing, electrical, and sometimes HVAC, and each piece should be assigned~Furnished entirely by the fire department, so the contractor can omit drains, heat, light, and backflow~Never shown on plumbing drawings, so floor drains and a backflow preventer can be left out of the bid~1~The riser is a room, not only a valve. Walk the utilities that keep it legal.',
  'fire-stand~fire~A standpipe system, when required, is:~The same as a fire extinguisher cabinet, and may be taken from the extinguisher count alone~Its own piping and valve scope, and it should not be assumed to sit inside a light sprinkler head count~Always omitted in mid-rise work, because a standpipe is assumed never to be required above two stories~Paid by the elevator sub automatically, as if the hoistway bid already included the standpipe risers~1~Standpipes, sprinklers, and extinguishers are related but not interchangeable lines.',
  'hvac-tab3~hvac~Test and balance is typically:~Optional decoration on the mechanical close-out, and may be omitted if the fee looks tidy~A defined service that should appear in the mechanical scope or a named report, not assumed as free~The same as a building permit, and may simply be taken from the already-priced permit line~Included automatically in every filter change, as if a filter swap were the same as a balance report~1~A system that is never balanced is not finished. Confirm who writes the report.',
  'hvac-ctrl~hvac~Controls and a building automation scope are often:~Automatically included in every equipment-only bid, including points, the front end, and graphics~A separate package equipment-only bids may exclude; assign the points, the front end, and the graphics~The fire-alarm vendor’s free extra, assumed to include the building-automation front end at no cost~Covered by SMACNA duct gauges alone, as if a duct-pressure class were the same as a controls package~1~A rooftop unit without controls is not a complete HVAC number.',
  'hvac-oa~hvac~Outside-air and exhaust requirements affect:~Only the color of the louvers, which is assumed to be the whole ventilation and recovery cost on the job~Equipment size, duct, louvers, and sometimes energy recovery; a bid that ignores ventilation is short~Only the plumbing fixture count, as if fixture units set the outside-air and exhaust requirements~The soils report, which is sometimes treated as if it sized the outdoor-air and exhaust systems~1~Ventilation is part of the load and the equipment. Level it against the schedules.',
  'hvac-insul~hvac~Duct insulation and pipe insulation should be:~Assumed inside every equipment price, including field duct wrap and refrigerant-line insulation~Taken off or clearly included, because many equipment bids exclude the field insulation work~The same as a vapor retarder in a wall, and may be taken from the thermal-envelope number~Never required on outdoor refrigerant lines, even when the specification calls for insulation~1~A naked duct in an unconditioned attic is both an energy miss and a scope miss.',
  'hvac-exist~hvac~Tying new duct into an existing system without a documented capacity check is:~Always safe if the new grille matches the old one in size, finish, and the look of the room~A performance risk; confirm the existing fan and the design intent, or qualify the unknown~Forbidden in every renovation, so new duct can never be tied into an existing air-handling system~Solved by a larger paint number, which is where capacity shortfalls are sometimes parked on a recap~1~The existing unit may not have the spare CFM the new rooms need. Say so or check it.',
  'plumb-fix2~plumb~A fixture count should include:~Only water closets in public toilets, with mop sinks, hydrants, and owner connections left out of the count~Every specified fixture and carrier, including mop sinks, wall hydrants, and owner connections the drawings show~Only fixtures already tagged in the electrical schedule, as if a panel tag were the same as a fixture count~Landscaping irrigation heads automatically, treated as if they belonged in the building fixture and carrier count~1~Mop sinks and hose bibbs are classic misses. Count the schedule and walk the plans.',
  'plumb-water2~plumb~Domestic water sizing and a water-heater or booster, when shown, should be:~Copied from the last apartment job, regardless of this project’s schedules or the cited plumbing code~Taken from this project’s schedules and the cited plumbing code, not from memory of a prior job~Omitted if a sprinkler riser exists, because a fire riser is assumed to include the domestic water service~Always electric and never gas, even when the mechanical and plumbing schedules show a gas-fired heater~1~The fixture units on this job drive the water plant. Do not import a different building’s heater.',
  'plumb-cond~plumb~Condensate, floor drains, and indirect wastes for mechanical equipment are:~Always in the HVAC equipment price, including the receptor, the trap, and the entire indirect waste pipe~A frequent plumbing-versus-mechanical split that must be assigned, including the receptor and the pipe~The fire-alarm vendor’s work, as if a notification appliance were the same as a condensate drain~Never required on rooftop units, even when a drain and an indirect waste are shown on the drawings~1~A rooftop unit still drips. Name who pipes the drain.',
  'plumb-gi~plumb~A grease interceptor, when the kitchen program requires one, is:~An optional restaurant accessory, and may be omitted if the kitchen looks small on the plan~A plumbing (and sometimes civil) item with a size, a location, and access that must be priced~Included in every domestic water heater automatically, as if a heater and an interceptor were one product~The health inspector’s equipment, furnished free, so the contractor can omit the tank and the access~1~Interceptors are easy to miss on a light plumbing number. Read the food-service sheets.',
  'plumb-med~plumb~Medical gas, when it appears, is:~The same as domestic water piping, and may be bid with the same fittings, cleaning, and pressure tests~A specialized piping scope with cleanliness, certification, and often a different vendor than the domestic plumber~Always bid by the fire-sprinkler contractor, because copper pipe is assumed to be a sprinkler piping item~Painted copper with no special rules, as if a finish coat replaced cleanliness, certification, and a unique vendor~1~Do not fold medical gas into a restroom fixture count and hope.',
  'elec-util2~elec~A service upgrade or a new utility transformer is typically:~Free because the utility always pays, including pads, fees, and any temporary or permanent service work~A cost and coordination item among the electrical bid, utility fees, and GCs; someone must carry the assigned work~Included in every lighting fixture automatically, as if a luminaire price covered a utility service upgrade~The same as a fire-alarm communicator, and may be taken from the alarm vendor’s monitoring or communicator line~1~Confirm the utility’s charges and the line between utility work and contractor work.',
  'elec-gear2~elec~Switchgear lead times and a complete gear submittal should be:~Ignored until after award in every case, even when the completion date is tight and the gear is long-lead~A schedule risk on bid day if the date is tight; the quote should match the specified sections and ratings~The architect’s purchase automatically, with no effect on the contractor’s schedule or the electrical bid~Covered by the lighting control panel alone, as if a relay panel were the same as the specified switchgear~1~Late gear can move a completion date. Validity dates and complete bills of material matter.',
  'elec-light2~elec~Lighting controls — sensors, dimming, or a listed system — should be:~Assumed inside every fixture price, including sensors, dimming, and any listed lighting-control system~Taken off or confirmed in the electrical or controls bid, because fixture-only quotes often exclude the controls~The HVAC controls vendor’s free extra always, including occupancy sensors and the listed lighting-control system~Ignored in occupied buildings, because an existing switch is assumed to satisfy the lighting-control specification~1~Energy codes make controls a real package. A fixture count is not a controls count.',
  'elec-bond2~elec~Grounding, bonding, and a ground-fault requirement are:~Optional if the panel is new, so grounding and bonding can be omitted from a replacement gear bid~Part of the electrical scope required by the NEC and the drawings, not a free accessory on the gear~The lightning-rod vendor only, on every job, even when the drawings show grounding at the service and gear~The same as a water-heater warranty, and may be taken from the plumbing close-out rather than the electrical bid~1~Missed grounding on a service or around a pool is a compliance miss, not a nicety.',
  'elec-temp2~elec~Temporary lighting and power, when GCs do not already carry them, should:~Be left unnamed in the recap, so neither electrical nor general conditions actually carries the camp power~Be assigned to electrical or general conditions so the camp is actually lit and powered during construction~Always be taken from the fire-alarm bid, as if a notification circuit were temporary lighting and power~Be omitted on renovations, because an occupied building is assumed already to light and power the camp~1~A dark, unpowered site is a GC and a safety problem. Name the temporary system.',
  'open-frame2~open~Hollow-metal frames in masonry usually need:~Only a coat of paint at the opening, with anchors, grout, and the coordinated rough opening omitted~Anchors, grouting, and a coordinated opening, which masonry and openings bids may each exclude~A wood buck in every masonry wall, even when the specification calls for a grouted hollow-metal frame~No hardware at all, because masonry is assumed to hold the door in place without a closer or strike~1~A frame dumped on the slab is not an installed opening. Assign the set and the grout.',
  'open-hw2~open~Electrified hardware, power transfers, and card readers sit at the split between:~Only the painter and the roofer, who are assumed to furnish power transfers and the card readers~Openings, electrical, and often access-control or fire-alarm vendors, and each connection must be assigned~The soils engineer and the civil sub, as if a boring log were the same as an electrified hardware scope~The millwork plastic laminate only, which is assumed to include the power transfer and the reader~1~A door that cannot lock or release on fire alarm is an incomplete opening. Level the low-voltage side.',
  'open-rated~open~A fire-rated door assembly has to include:~The leaf only in every case, with the frame, hardware, and rated glazing treated as optional extras~The listed door, frame, hardware, and glazing as a system; swapping one piece can void the rating~Any door pulled from the warehouse, regardless of the label, the frame, or the listed hardware set~Only the closer, never the frame, as if a closer alone were enough to keep a rated assembly listed~1~Listings are assemblies. A cheaper unlisted vision kit is not a savings if it breaks the rating.',
  'open-auto~open~Automatic operators on accessible doors are:~Always in the standard hardware set at no add, including power, the operator, and a detector or plate~A frequent add among openings, electrical, and sometimes access control, needing power and a detector or push plate~The plumber’s closer, assumed to include an automatic operator whenever an accessible door is shown on the plan~Forbidden by accessibility rules, so an automatic operator can never be specified on an accessible entrance door~1~An operator is equipment plus power plus a device. Count all three.',
  'open-key~open~Keying, cores, and a key schedule are:~Always free from the last job’s locksmith, including cores, keying, and any restricted keyway the owner wants~A real openings cost, especially on a proprietary or restricted keyway the owner requires for the project~Included in every hinge specification automatically, as if a hinge type were the same as a key schedule~The same as a card-reader license, and may be taken from the access-control software line instead~1~Restricted keyways and construction cores are easy to omit. Read the hardware specification.',
  'mas-pattern~mas~A specified masonry bond pattern or a special brick size can:~Never affect labor or waste, so a special bond or brick size can be bid at a running-bond utility rate~Change labor and waste compared with a running-bond utility brick, so the unit should reflect the pattern~Be ignored if the CMU count is right, because a block count is assumed to cover a special brick pattern~Be converted to drywall at no cost, as if a pattern change were the same as switching to a stud wall~1~Stack bond, herringbone, and oversize units are not the same production as a standard running bond.',
  'mas-steel~mas~Lintels, bond beams, and loose steel at masonry openings should be:~Assumed in every brick unit price with no check, including lintels, bond beams, and loose steel at openings~Taken off or clearly included, because they are a common miss between masonry and steel on the same opening~The glazing contractor’s steel always, even when the lintel sits in a masonry wall with no storefront~Omitted on load-bearing walls, because a bearing wall is assumed never to need a lintel or a bond beam~1~An opening is not only a hole. The member that carries it has to be in someone’s tons or someone’s unit.',
  'mas-flash3~mas~Through-wall flashing, weeps, and end dams are:~Optional decoration in a rainscreen, and may be omitted if the wall is assumed to drain on its own~Moisture-control details that belong in the masonry (or sheet-metal) scope and are a leak if omitted~Part of the fire-alarm riser, as if a notification circuit were the same as through-wall flashing and weeps~Only used below grade, so flashing, weeps, and end dams can be omitted from every wall above the footing~1~A pretty veneer without weeps and flashing is a wet wall. Price the hidden metal and the weeps.',
  'mas-scaf~mas~Scaffold, a mast climber, or a pump-jack for masonry is:~Always in the unit price at a gymnasium production rate, even on a tight urban wall with limited staging~A method and access cost that must match the height and the site; a tight urban wall is not a yard wall~Paid entirely from fee, so scaffold, a mast climber, or a pump-jack never needs its own visible cost~The same as a roof hatch, and may be taken from the architectural specialties number instead of masonry~1~Height and access drive masonry production. Name the equipment.',
  'mas-cells~mas~Grouted cells, rebar, and grout lifts in reinforced CMU should be:~Ignored if you counted the block faces, with grout, rebar, and lift limitations left out of the wall unit~Taken off from the structural wall types, because grout and bar are a large part of a reinforced wall~The same as a brick veneer tie, and may be taken from the veneer-accessory count instead of the wall type~Painted on after the wall is up, as if a finish coat could replace grouted cells and the reinforcing bar~1~An 8x16 face count is not a reinforced wall until the grout and the steel are in the number.',
  'site-swppp3~site~A SWPPP, inlet protection, and silt fence are:~Optional if the fee looks tidy, even when the permit requires inlet protection, fence, and inspections~Often required by the permit and priced as a duration- and inspection-driven package, not a single roll of fence~The building inspector’s free service, so silt fence, inlet bags, and inspections can be omitted from the bid~Included in every fire hydrant automatically, as if a hydrant price already covered the stormwater-control package~1~Stormwater controls last as long as the disturbed site lasts. Count the weeks and the inspections.',
  'site-asph~site~Asphalt thickness, base, and a tack or prime coat should be:~Guessed from a nearby parking lot, without reading this project’s civil pavement sections or the specified base~Taken from this project’s civil sections; a thinner pavement is not the same unit price as a heavy-duty section~Copied from the architectural floor finishes, as if an interior tile section set the asphalt and base~Always 2 inches everywhere, including heavy-duty drives, regardless of what the civil sections actually show~1~Section, not area alone, drives the tons. Read the pavement schedule.',
  'site-util2~site~Site utilities — water, sewer, storm, and sometimes gas or power duct banks — should be:~Lumped into the building plumbing number automatically, including structures, bedding, and testing outside the building~Taken from the civil plans, with structures, bedding, and testing assigned, and coordinated at the five-foot line or as the set splits it~Ignored if the building has fixtures, because a fixture count is assumed to include the site water, sewer, storm, structures, and testing~The fire-alarm vendor’s trench, as if a notification pathway were the same as a site water, sewer, storm, or duct-bank installation~1~The building-versus-site split is a classic gap. Draw the line, then fill both sides.',
  'site-rock2~site~A unit price for rock or unsuitable material is most useful when:~The quantity is already known to the ounce, so a unit price is assumed to have no estimating purpose~The documents allow it and the unclassified lump sum would otherwise hide a quantity risk in the dirt bid~You want to avoid reading the geotechnical report, and a unit price is treated as a substitute for that reading~The owner forbids all unit prices by custom only, even when the documents actually allow a rock unit~1~A unit price is a tool for uncertain quantity. It only works if the form and the measurement rules are clear.',
  'wood-stair~wood~A wood stair, when shown as finish carpentry or millwork, often includes:~Only the stringers in a framing bid, with treads, risers, rail, and connectors left for someone else to carry~Framing, treads, risers, rail, and sometimes metal connectors, which may be split among rough and finish bids~The concrete footings automatically, as if a stair package always included the foundation under the stringers~An elevator machine beam, treated as if a wood stair bid were the same as an elevator hoistway steel package~1~Count every piece of the stair. A framing number without a rail is not a finished stair.',
  'wood-truss~wood~Roof trusses usually arrive with:~Every opening and every hanger already in the price, on every job, including bracing, a crane, and bearing hardware~A package that may exclude bracing, cranes, bearing hardware, or openings you must still assign after the quote~The shingles already fastened to the top chords, so the roofing number can be omitted from the bid entirely~A complete mechanical platform at no add, including framing, openings, and any curb the mechanical unit needs~1~Read the truss quote. The flight of trusses is not the whole roof structure.',
  'met-coat~met~Shop primer, a special coating, or hot-dip galvanizing on structural steel is:~Always included in every raw-ton price, including shop primer, a special coating, or hot-dip galvanizing~A finish specification you must confirm in the steel bid; bare steel and galvanized steel are not the same number~The painter’s field coat only, in every case, even when the specification calls for a shop primer or galvanizing~Forbidden by AISC in commercial work, so a coating or galvanizing specification can be ignored in the bid~1~A coating miss is a large add. Level prime, galvanize, and intumescent as specified.',
  'met-deck2~met~Metal deck, pour stops, and closures should be:~Assumed in the stud-wall number, including pour stops, closures, and the metal deck that bears on the steel~Taken off or included in the steel or deck package; a beam-only tonnage misses the deck, pour stops, and closures~The roofing membrane itself, as if a membrane square count were the same as metal deck, pour stops, and closures~Counted only as rebar in the slab, so pour stops and deck closures can be omitted from the steel or deck package~1~Deck is its own takeoff. Edge closures and pour stops are easy to drop.',
  'conc-protect~conc~Curing, blankets, or a curing compound, when specified or when weather requires them, should be:~Ignored because concrete is assumed always to cure itself for free, even in heat, wind, or a freeze~Included or qualified, because finish and weather protection are part of placing the work as specified~The mason’s sealer always, even when the specification calls for curing compound or blankets on the slab~Paid by the testing lab automatically, as if a cylinder test included curing blankets and a curing compound~1~A slab in July and a slab in January are not the same placement cost.',
  'conc-rein2~conc~Rebar, mesh, and fibers are not interchangeable unless:~The fee is large enough to absorb any difference between rebar, mesh, and fibers in the slab or wall~The drawings and the specification allow the substitution and the structural intent is actually met~The truck is already on site with a different product, which is treated as enough reason to swap the reinforcement~ASTM C31 says so, as if a cylinder-testing standard were the same as a substitution approval for the reinforcement~1~A fiber number on a bar-designed slab is a substitution, not a default. Read the structural notes.',
]);
const FULL_BANK = BANK.concat(EST_Q, CAMP_Q, NUM_Q, TF_Q, MORE4, NUM2, TF2, MORE5, MORE6);
const CHAPTERS: { id: string; name: string; region: string; blurb: string; skills: SkillId[]; boss: string; bossQ: string[] }[] = [
  { id: 'ch1', name: 'The Apprentice Yard', region: 'Fundamentals', blurb: 'Names, sizes, and divisions. Learn to see the dressed truth in a 2x4 and the map of MasterFormat.', skills: ['wood', 'open', 'est', 'mas', 'qto'], boss: 'The Nominal Liar', bossQ: ['camp-nom', 'wood-24', 'wood-wall', 'qto-24', 'est-08'] },
  { id: 'ch2', name: 'The Foundation Wastes', region: 'Earth and Concrete', blurb: 'Volume, soils, and the twenty-eighth dawn. What the ground conceals will rewrite a lump sum.', skills: ['conc', 'site', 'qto', 'risk'], boss: 'The Unsuitable Ground', bossQ: ['camp-soil', 'site-soil', 'qto-slab', 'conc-28', 'risk-soil'] },
  { id: 'ch3', name: 'The Envelope Keep', region: 'Skin of the Building', blurb: 'Flashings, openings, masonry, and steel that must make the pour. Water is a patient enemy.', skills: ['therm', 'open', 'mas', 'met'], boss: 'The Patient Leak', bossQ: ['camp-leak', 'therm-leak', 'therm-flash', 'open-ada', 'met-embed'] },
  { id: 'ch4', name: 'The Finishing Halls', region: 'What the Owner Touches', blurb: 'Type X in the fire, millwork grades, and the blocking that was never installed.', skills: ['fin', 'wood'], boss: 'The Rated Corridor', bossQ: ['camp-x', 'fin-x', 'wood-block', 'wood-awi', 'fin-l4'] },
  { id: 'ch5', name: 'The MEP Underforge', region: 'Fire, Water, Air, and Power', blurb: 'Sprinklers, DWV, loads, EMT, and the alarm that must speak to the switches.', skills: ['fire', 'plumb', 'hvac', 'elec', 'fa'], boss: 'The Silent Switch', bossQ: ['camp-sw', 'fire-28', 'elec-emt', 'plumb-dwv', 'hvac-load'] },
  { id: 'ch6', name: 'The Bid Day Citadel', region: 'The Estimator’s Crown', blurb: 'Level, close, and carry the markups. The cheap number flees a complete one.', skills: ['level', 'gaps', 'markup', 'strategy', 'gc', 'contract', 'risk', 'est'], boss: 'The Dragon of Scope Gaps', bossQ: ['camp-gap', 'bid-patch', 'markup-7', 'level-first', 'str-form'] },
];

const TOMES: { id: string; skill: SkillId; title: string; text: string }[] = [
  { id: 't1', skill: 'conc', title: 'The Twenty-Eighth Dawn', text: 'Specified f’c is a 28-day test, not a finish line. Keep the concrete moist and you will still be gaining strength after the cylinders are broken.' },
  { id: 't2', skill: 'wood', title: 'The Lying Stick', text: 'A 2x4 is 1-1/2 by 3-1/2 inches. Add 5/8-inch board on both sides and the wall is 4-3/4 inches thick. Nominal sizes will betray a dimension string.' },
  { id: 't3', skill: 'elec', title: 'The Name of the Path', text: 'EMT is Electrical Metallic Tubing, the common thin-wall conduit of commercial interiors. It is not a transformer, and it is usually more labor than MC cable.' },
  { id: 't4', skill: 'fin', title: 'The Hidden Wall', text: 'Type X board carries glass fibers in its core so it can stand in a fire. Rated corridors, shafts, and separations are its usual hall.' },
  { id: 't5', skill: 'fire', title: 'The Hydraulic Law', text: 'NFPA 13 and the hazard class write the sprinkler system. Design-build is the norm, and monitoring of the switches belongs to Division 28.' },
  { id: 't6', skill: 'plumb', title: 'Three Rivers', text: 'Domestic water is pushed by pressure. DWV — Drain, Waste, Vent — runs by gravity. Storm often takes the roof. Price them as separate rivers.' },
  { id: 't7', skill: 'open', title: 'The Hardware Schedule', text: 'Division 08 is Openings. The hardware set often costs more than the leaf, and a ramp may not run steeper than 1:12.' },
  { id: 't8', skill: 'mas', title: 'The Modular Stone', text: 'A standard CMU is nominally 8x8x16 and actually 7-5/8 x 7-5/8 x 15-5/8, so the mortar joint can live on the module.' },
  { id: 't9', skill: 'hvac', title: 'The Unseen Load', text: 'Tonnage comes from load calculations, not from area alone. On a TI, ask whether the existing rooftop unit can even serve the new use.' },
  { id: 't10', skill: 'therm', title: 'The Patient Enemy', text: 'Water enters at transitions. Level the roof on flashings and taper, and do not let firestopping of penetrations vanish between trades.' },
  { id: 't11', skill: 'est', title: 'Complete Beats Cheap', text: 'A low number missing patch, blocking, or monitoring is not a win. General conditions also live on the calendar: longer jobs cost more to carry.' },
  { id: 't12', skill: 'site', title: 'What the Ground Conceals', text: 'Unsuitable soils, buried utilities, and SWPPP are where site numbers go to die. Unit prices are a form of wisdom.' },
  { id: 't13', skill: 'fa', title: 'The Silent Switch', text: 'NFPA 72 governs the fire alarm. Pathways may be Division 26; devices and programming are Division 28. A system is not done until it is tested.' },
  { id: 't14', skill: 'met', title: 'Before the Pour', text: 'Anchor rods and embed plates must make the foundation pour. Tonnage without connections is only a rumor of the steel number.' },
];
const WEAK: SkillId[] = ['wood', 'elec', 'fin'];
const SKILL_IDS: SkillId[] = ALL_SKILLS.map((s) => s.id);
const PERK_POS = [{ x: 200, y: 268 }, { x: 200, y: 208 }, { x: 118, y: 150 }, { x: 282, y: 150 }, { x: 200, y: 72 }];
const PERK_EDGES = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4]];

function emptySkills(): Record<SkillId, SkillSave> {
  const out = {} as Record<SkillId, SkillSave>;
  for (const id of SKILL_IDS) out[id] = { xp: 0, perks: [], legendary: 0 };
  return out;
}
function xpToAdvance(level: number): number { return 12 + level * 3; }
function xpForLevel(level: number): number {
  let xp = 0;
  for (let l = 1; l < level; l += 1) xp += xpToAdvance(l);
  return xp;
}
function skillInfo(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (level < 100) {
    const need = xpToAdvance(level);
    if (remaining < need) return { level, into: remaining, need };
    remaining -= need;
    level += 1;
  }
  return { level: 100, into: 0, need: 1 };
}
function charXpToAdvance(level: number): number { return 80 + level * 40; }
function charInfo(charXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(charXp));
  while (level < 100) {
    const need = charXpToAdvance(level);
    if (remaining < need) return { level, into: remaining, need };
    remaining -= need;
    level += 1;
  }
  return { level: 100, into: 0, need: 1 };
}
function charXpFromSkillUp(newSkillLevel: number): number { return 12 + newSkillLevel; }
function charXpForSkillLevel(level: number): number {
  let xp = 0;
  for (let l = 2; l <= level; l += 1) xp += charXpFromSkillUp(l);
  return xp;
}
function xpForCorrect(streakAfter: number, bid: boolean): number {
  const bonus = Math.min(STREAK_CAP, Math.max(0, streakAfter - 1) * STREAK_STEP);
  return (bid ? BID_XP : BASE_XP) + bonus;
}
function xpForRun(correct: number, perfect: boolean): number {
  let xp = 0;
  for (let i = 1; i <= correct; i += 1) xp += xpForCorrect(i, false);
  if (perfect) xp += PERFECT_BONUS;
  return xp;
}
function todayKey(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dayOfYear(): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
}
function rankFor(level: number) {
  let current = RANKS[0];
  for (const r of RANKS) if (level >= r.min) current = r;
  return current;
}
function nextRank(level: number) {
  for (const r of RANKS) if (r.min > level) return r;
  return undefined;
}
function skillById(id: SkillId): SkillDef {
  return ALL_SKILLS.find((s) => s.id === id) || SKILLS[0];
}
function qById(id: string): Question | undefined {
  return FULL_BANK.concat(BID_QS, BID2).find((q) => q.id === id);
}
function orderFor(id: string, salt: number): number[] {
  const q = qById(id);
  if (!q || q.c.length < 2) return [];
  let seed = Math.floor(salt) + id.length * 997;
  for (let i = 0; i < id.length; i += 1) seed += id.charCodeAt(i) * (i + 3);
  return shuffle(q.c.map((_, i) => i), Math.abs(seed) || 1);
}
function mulberry(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
function makeSeed(): Save {
  const skills = emptySkills();
  skills.conc.xp = BASE_XP;
  skills.open.xp = BASE_XP;
  skills.est.xp = BASE_XP;
  skills.mas.xp = BASE_XP;
  skills.fire.xp = xpForRun(4, true);
  skills.plumb.xp = xpForRun(4, true);
  const charXp =
    charXpForSkillLevel(skillInfo(skills.conc.xp).level) +
    charXpForSkillLevel(skillInfo(skills.open.xp).level) +
    charXpForSkillLevel(skillInfo(skills.est.xp).level) +
    charXpForSkillLevel(skillInfo(skills.mas.xp).level) +
    charXpForSkillLevel(skillInfo(skills.fire.xp).level) +
    charXpForSkillLevel(skillInfo(skills.plumb.xp).level);
  return {
    v: 1,
    skills,
    charXp,
    souls: 2,
    streak: 8,
    bestStreak: 8,
    answered: {
      'conc-28': true, 'open-div': true, 'est-08': true, 'est-ada': true, 'open-ada': true, 'mas-nom': true,
      'wood-24': false, 'elec-emt': false, 'fire-13': true, 'fire-dry': true, 'fire-who': true, 'fire-28': true,
      'plumb-dwv': true, 'plumb-saw': true, 'plumb-grease': true, 'plumb-fix': true, 'plumb-name': true,
    },
    dailyDate: todayKey(),
    dailyDone: [],
    loreRead: [],
    bidBest: 0,
    introSeen: false,
    loginStreak: 1,
    lastLogin: todayKey(),
    haunted: { 'wood-24': { misses: 1, rights: 0, due: todayKey() }, 'elec-emt': { misses: 1, rights: 0, due: todayKey() } },
    codex: ['conc-28', 'open-div', 'est-08', 'est-ada', 'open-ada', 'mas-nom', 'fire-13', 'fire-dry', 'fire-who', 'fire-28', 'plumb-dwv', 'plumb-saw', 'plumb-grease', 'plumb-fix', 'plumb-name'],
    campaignDone: [],
    achievements: [],
    perfects: 2,
    trials: 3,
    settings: { motion: 'auto', text: 'md', sound: false },
    history: [],
    loginRewards: [],
    cosmetics: { owned: [] },
    discovered: [],
    sideDone: [],
    cinemaSeen: false,
    lastSaved: '',
    activeTrial: null,
  };
}
function normalizeActiveTrial(raw: Save['activeTrial'] | unknown): Save['activeTrial'] {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as { view?: unknown; focus?: unknown; session?: QuizSession };
  if (rec.view !== 'quiz' && rec.view !== 'bid') return null;
  const s = rec.session;
  if (!s || typeof s !== 'object' || !Array.isArray(s.ids) || s.ids.length === 0) return null;
  if (s.done) return null;
  const modes: QuizSession['mode'][] = ['skill', 'bid', 'haunt', 'camp', 'boss'];
  if (modes.indexOf(s.mode) < 0) return null;
  return {
    view: rec.view,
    focus: typeof rec.focus === 'string' ? rec.focus as SkillId : undefined,
    session: {
      mode: s.mode,
      skill: s.skill,
      chapter: s.chapter,
      ids: s.ids.slice(),
      index: typeof s.index === 'number' ? s.index : 0,
      items: Array.isArray(s.items) ? s.items.slice() : [],
      hint: !!s.hint,
      show: !!s.show,
      done: false,
      order: Array.isArray(s.order) ? s.order.slice() : [],
      numDraft: typeof s.numDraft === 'string' ? s.numDraft : '',
      startSouls: typeof s.startSouls === 'number' ? s.startSouls : 0,
      startCodex: Array.isArray(s.startCodex) ? s.startCodex.slice() : [],
      bonusXp: typeof s.bonusXp === 'number' ? s.bonusXp : 0,
      shoutSlow: !!s.shoutSlow,
      encounter: s.encounter === 'sub' || s.encounter === 'rfi' ? s.encounter : undefined,
    },
  };
}
function normalizeSave(raw: Save): Save {
  const skills = emptySkills();
  for (const id of SKILL_IDS) {
    const s = raw.skills && raw.skills[id];
    skills[id] = {
      xp: s && typeof s.xp === 'number' ? s.xp : 0,
      perks: s && Array.isArray(s.perks) ? s.perks.slice() : [],
      legendary: s && typeof s.legendary === 'number' ? s.legendary : 0,
    };
  }
  return {
    v: 1,
    skills,
    charXp: typeof raw.charXp === 'number' ? raw.charXp : 0,
    souls: typeof raw.souls === 'number' ? raw.souls : 0,
    streak: typeof raw.streak === 'number' ? raw.streak : 0,
    bestStreak: typeof raw.bestStreak === 'number' ? raw.bestStreak : 0,
    answered: raw.answered && typeof raw.answered === 'object' ? { ...raw.answered } : {},
    dailyDate: raw.dailyDate === todayKey() ? raw.dailyDate : todayKey(),
    dailyDone: raw.dailyDate === todayKey() && Array.isArray(raw.dailyDone) ? raw.dailyDone.slice() : [],
    loreRead: Array.isArray(raw.loreRead) ? raw.loreRead.slice() : [],
    bidBest: typeof raw.bidBest === 'number' ? raw.bidBest : 0,
    introSeen: !!raw.introSeen,
    loginStreak: typeof raw.loginStreak === 'number' ? raw.loginStreak : 1,
    lastLogin: typeof raw.lastLogin === 'string' ? raw.lastLogin : '',
    haunted: migrateHaunt(raw.haunted && typeof raw.haunted === 'object' ? raw.haunted : seedHaunt(raw.answered)),
    codex: Array.isArray(raw.codex) ? raw.codex.slice() : seedCodex(raw.answered),
    campaignDone: Array.isArray(raw.campaignDone) ? raw.campaignDone.slice() : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements.slice() : [],
    perfects: typeof raw.perfects === 'number' ? raw.perfects : 0,
    trials: typeof raw.trials === 'number' ? raw.trials : 0,
    settings: {
      motion: raw.settings && (raw.settings.motion === 'full' || raw.settings.motion === 'reduce') ? raw.settings.motion : 'auto',
      text: raw.settings && (raw.settings.text === 'sm' || raw.settings.text === 'lg') ? raw.settings.text : 'md',
      sound: !!(raw.settings && raw.settings.sound),
    },
    history: Array.isArray(raw.history) ? raw.history.slice(0, 16) : [],
    loginRewards: Array.isArray(raw.loginRewards) ? raw.loginRewards.slice() : [],
    cosmetics: raw.cosmetics && typeof raw.cosmetics === 'object' ? { owned: Array.isArray(raw.cosmetics.owned) ? raw.cosmetics.owned.slice() : [], title: raw.cosmetics.title, banner: raw.cosmetics.banner, theme: raw.cosmetics.theme } : { owned: [] },
    discovered: Array.isArray(raw.discovered) ? raw.discovered.slice() : [],
    sideDone: Array.isArray(raw.sideDone) ? raw.sideDone.slice() : [],
    cinemaSeen: raw.cinemaSeen !== undefined ? !!raw.cinemaSeen : !!raw.introSeen,
    lastSaved: typeof raw.lastSaved === 'string' ? raw.lastSaved : '',
    activeTrial: normalizeActiveTrial(raw.activeTrial),
  };
}
function seedHaunt(answered?: Record<string, boolean>): Record<string, { misses: number; rights: number; due?: string }> {
  const h: Record<string, { misses: number; rights: number; due?: string }> = {};
  if (answered && answered['wood-24'] === false) h['wood-24'] = { misses: 1, rights: 0, due: todayKey() };
  if (answered && answered['elec-emt'] === false) h['elec-emt'] = { misses: 1, rights: 0, due: todayKey() };
  return h;
}
function migrateHaunt(raw: Record<string, { misses: number; rights: number; due?: string }>): Record<string, { misses: number; rights: number; due?: string }> {
  const h: Record<string, { misses: number; rights: number; due?: string }> = {};
  const today = todayKey();
  for (const id of Object.keys(raw || {})) {
    const rec = raw[id];
    if (!rec) continue;
    h[id] = { misses: rec.misses || 0, rights: rec.rights || 0, due: rec.due || (rec.rights >= 2 ? undefined : today) };
  }
  return h;
}
function shiftKey(k: string, days: number): string {
  const p = k.split('-');
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function hauntDue(save: Save, id: string): boolean {
  const rec = save.haunted[id];
  if (!rec || rec.rights >= 2) return false;
  if (!rec.due) return true;
  return rec.due <= todayKey();
}
function hauntDueList(save: Save): string[] {
  return hauntList(save).filter((id) => hauntDue(save, id));
}
function pushHist(s: Save, text: string): Save {
  return { ...s, history: [{ t: todayKey(), text }].concat(s.history || []).slice(0, 16) };
}
function grantLoginRewards(s: Save): Save {
  const marks: { n: number; id: string }[] = [{ n: 3, id: 'd3' }, { n: 7, id: 'd7' }, { n: 14, id: 'd14' }];
  const rewards = (s.loginRewards || []).slice();
  let souls = s.souls;
  let gained = 0;
  for (const m of marks) {
    if (s.loginStreak >= m.n && rewards.indexOf(m.id) < 0) { rewards.push(m.id); souls += 1; gained += 1; }
  }
  if (gained === 0) return s;
  return { ...s, loginRewards: rewards, souls };
}
function seedCodex(answered?: Record<string, boolean>): string[] {
  if (!answered) return [];
  return Object.keys(answered).filter((id) => answered[id] === true);
}
function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function applyDailyLogin(s: Save): Save {
  const today = todayKey();
  if (s.lastLogin === today && s.dailyDate === today) return s;
  const streak = s.lastLogin === today ? s.loginStreak : (s.lastLogin === yesterdayKey() ? s.loginStreak + 1 : 1);
  return { ...s, lastLogin: today, loginStreak: streak, dailyDate: today, dailyDone: s.dailyDate === today ? s.dailyDone : [] };
}
function hauntOpen(h: Save['haunted'], id: string): boolean {
  const rec = h[id];
  return !!rec && rec.rights < 2;
}
function hauntList(save: Save): string[] {
  return Object.keys(save.haunted).filter((id) => hauntOpen(save.haunted, id) && qById(id));
}
function pickHaunted(save: Save, seed: number, n?: number): string[] {
  return shuffle(hauntDueList(save), seed).slice(0, n || SESSION_Q);
}
function pickChapter(ch: (typeof CHAPTERS)[number], answered: Record<string, boolean>, seed: number, n?: number): string[] {
  const pool = FULL_BANK.filter((q) => ch.skills.indexOf(q.skill as SkillId) >= 0);
  const weak = shuffle(pool.filter((q) => answered[q.id] !== true), seed);
  const rest = shuffle(pool.filter((q) => answered[q.id] === true), seed + 9);
  return weak.concat(rest).slice(0, n || SESSION_Q).map((q) => q.id);
}
function statValue(save: Save, ids: SkillId[]): number {
  if (ids.length === 0) return 1;
  let sum = 0;
  for (const id of ids) sum += skillInfo(save.skills[id] ? save.skills[id].xp : 0).level;
  return Math.round(sum / ids.length);
}
const STATS: { id: string; name: string; detail: string; skills: SkillId[] }[] = [
  { id: 'takeoff', name: 'Takeoff Precision', detail: 'Counts, areas, volumes, and true dimensions.', skills: ['qto', 'conc', 'wood', 'mas', 'site', 'unit'] },
  { id: 'scope', name: 'Scope Sight', detail: 'Gaps, leveling, and the work nobody claimed.', skills: ['gaps', 'level', 'fire', 'plumb', 'therm', 'est'] },
  { id: 'code', name: 'Code Lore', detail: 'Listings, accessibility, alarm, and the law of the load.', skills: ['open', 'fa', 'elec', 'fin', 'fire', 'contract'] },
  { id: 'instinct', name: 'Bid Instinct', detail: 'Fee, bond, risk, and the close of the ledger.', skills: ['strategy', 'markup', 'risk', 'gc', 'est', 'contract'] },
];
const TROPHIES: { id: string; name: string; detail: string; test: (s: Save) => boolean; progress?: (s: Save) => { now: number; max: number }; hidden?: boolean }[] = [
  { id: 'first', name: 'First Trial', detail: 'Complete any quiz.', test: (s) => s.trials >= 1, progress: (s) => ({ now: Math.min(s.trials, 1), max: 1 }) },
  { id: 'perfect', name: 'Perfect Seal', detail: 'Finish a trial with no misses.', test: (s) => s.perfects >= 1, progress: (s) => ({ now: Math.min(s.perfects, 1), max: 1 }) },
  { id: 'streak8', name: 'Eightfold Combo', detail: 'Reach a streak of 8.', test: (s) => s.bestStreak >= 8, progress: (s) => ({ now: Math.min(s.bestStreak, 8), max: 8 }) },
  { id: 'fire', name: 'Hydraulic Initiate', detail: 'Raise Fire Suppression to level 8.', test: (s) => skillInfo(s.skills.fire.xp).level >= 8, progress: (s) => ({ now: Math.min(skillInfo(s.skills.fire.xp).level, 8), max: 8 }) },
  { id: 'plumb', name: 'Three-River Initiate', detail: 'Raise Plumbing to level 8.', test: (s) => skillInfo(s.skills.plumb.xp).level >= 8, progress: (s) => ({ now: Math.min(skillInfo(s.skills.plumb.xp).level, 8), max: 8 }) },
  { id: 'haunt', name: 'Banishment', detail: 'Clear a haunted question with two later rights.', test: (s) => Object.keys(s.haunted).some((id) => s.haunted[id] && s.haunted[id].rights >= 2) },
  { id: 'est1', name: 'Ledger Initiate', detail: 'Raise any Estimating Mastery skill to level 5.', test: (s) => EST_IDS.some((id) => skillInfo(s.skills[id].xp).level >= 5), progress: (s) => ({ now: Math.min(Math.max(0, ...EST_IDS.map((id) => skillInfo(s.skills[id].xp).level)), 5), max: 5 }) },
  { id: 'bid', name: 'Bid Day Survivor', detail: 'Finish a Bid Day trial.', test: (s) => s.bidBest >= 1 || (s.history || []).some((h) => h.text.indexOf('Bid Day') === 0), progress: (s) => ({ now: Math.min(s.bidBest >= 1 || (s.history || []).some((h) => h.text.indexOf('Bid Day') === 0) ? 1 : 0, 1), max: 1 }) },
  { id: 'login3', name: 'Three Dawns', detail: 'Keep a 3-day login streak.', test: (s) => s.loginStreak >= 3, progress: (s) => ({ now: Math.min(s.loginStreak, 3), max: 3 }) },
  { id: 'login7', name: 'Seven Dawns', detail: 'Keep a 7-day login streak. A Dragon Soul is granted at this dawn.', test: (s) => s.loginStreak >= 7, progress: (s) => ({ now: Math.min(s.loginStreak, 7), max: 7 }) },
  { id: 'login14', name: 'Fortnight at the Ledger', detail: 'Keep a 14-day login streak. A Dragon Soul is granted at this dawn.', test: (s) => s.loginStreak >= 14, progress: (s) => ({ now: Math.min(s.loginStreak, 14), max: 14 }) },
  { id: 'daily', name: 'Quest Knight', detail: 'Complete all three daily quests in one day.', test: (s) => s.dailyDone.indexOf('all') >= 0 },
  { id: 'ch1', name: 'Liar’s Fall', detail: 'Defeat the Nominal Liar.', test: (s) => s.campaignDone.indexOf('ch1-boss') >= 0 },
  { id: 'ch2', name: 'Wastes Walker', detail: 'Defeat the Unsuitable Ground.', test: (s) => s.campaignDone.indexOf('ch2-boss') >= 0 },
  { id: 'ch3', name: 'Envelope Warden', detail: 'Defeat the Patient Leak.', test: (s) => s.campaignDone.indexOf('ch3-boss') >= 0 },
  { id: 'ch4', name: 'Halls Finisher', detail: 'Defeat the Rated Corridor.', test: (s) => s.campaignDone.indexOf('ch4-boss') >= 0 },
  { id: 'ch5', name: 'Underforge Walker', detail: 'Defeat the Silent Switch.', test: (s) => s.campaignDone.indexOf('ch5-boss') >= 0 },
  { id: 'ch6', name: 'Dragon of the Citadel', detail: 'Defeat the Dragon of Scope Gaps in the campaign.', test: (s) => s.campaignDone.indexOf('ch6-boss') >= 0, hidden: true },
  { id: 'souls', name: 'Soul Collector', detail: 'Hold at least two Dragon Souls.', test: (s) => s.souls >= 2, progress: (s) => ({ now: Math.min(s.souls, 2), max: 2 }) },
  { id: 'codex10', name: 'Scribe of the Hall', detail: 'Inscribe 10 concepts in the Codex.', test: (s) => s.codex.length >= 10, progress: (s) => ({ now: Math.min(s.codex.length, 10), max: 10 }) },
  { id: 'codex25', name: 'Lorekeeper', detail: 'Inscribe 25 concepts in the Codex.', test: (s) => s.codex.length >= 25, progress: (s) => ({ now: Math.min(s.codex.length, 25), max: 25 }) },
  { id: 'codex50', name: 'Arch-Scribe', detail: 'Inscribe 50 concepts in the Codex.', test: (s) => s.codex.length >= 50, progress: (s) => ({ now: Math.min(s.codex.length, 50), max: 50 }) },
  { id: 'map3', name: 'Cartographer', detail: 'Fell three regional bosses on the campaign map.', test: (s) => ['ch1-boss', 'ch2-boss', 'ch3-boss', 'ch4-boss', 'ch5-boss', 'ch6-boss'].filter((k) => s.campaignDone.indexOf(k) >= 0).length >= 3, progress: (s) => ({ now: Math.min(['ch1-boss', 'ch2-boss', 'ch3-boss', 'ch4-boss', 'ch5-boss', 'ch6-boss'].filter((k) => s.campaignDone.indexOf(k) >= 0).length, 3), max: 3 }) },
  { id: 'math5', name: 'Reckoner', detail: 'Inscribe five numeric takeoffs in the Codex.', test: (s) => s.codex.filter((id) => id.indexOf('num-') === 0).length >= 5, progress: (s) => ({ now: Math.min(s.codex.filter((id) => id.indexOf('num-') === 0).length, 5), max: 5 }) },
  { id: 'math15', name: 'Master Reckoner', detail: 'Inscribe fifteen numeric takeoffs in the Codex.', test: (s) => s.codex.filter((id) => id.indexOf('num-') === 0).length >= 15, progress: (s) => ({ now: Math.min(s.codex.filter((id) => id.indexOf('num-') === 0).length, 15), max: 15 }), hidden: true },
  { id: 'combo12', name: 'Blood of the Dragon', detail: 'Reach a combo of 12.', test: (s) => s.bestStreak >= 12, progress: (s) => ({ now: Math.min(s.bestStreak, 12), max: 12 }), hidden: true },
];
function earnedTrophies(s: Save): string[] {
  return TROPHIES.filter((t) => t.test(s)).map((t) => t.id);
}
function withEarned(s: Save): Save {
  const got = earnedTrophies(s);
  const missing = got.filter((id) => s.achievements.indexOf(id) < 0);
  if (missing.length === 0) return s;
  return { ...s, achievements: s.achievements.concat(missing) };
}
type LoadResult = { save: Save; blocked: boolean; notice: string; lastSaved: string; durable: boolean };
let persistGate = false;
function setPersistGate(blocked: boolean) {
  persistGate = blocked;
}
function originIsOpaque(): boolean {
  try {
    if (typeof window === 'undefined') return true;
    return window.origin === 'null' || window.location.protocol === 'blob:' || window.location.protocol === 'about:';
  } catch {
    return true;
  }
}
function localStorageIsDurable(): boolean {
  if (originIsOpaque()) return false;
  try {
    const probe = STORAGE_KEY + '-probe';
    localStorage.setItem(probe, '1');
    const ok = localStorage.getItem(probe) === '1';
    localStorage.removeItem(probe);
    return ok;
  } catch {
    return false;
  }
}
function readStorage(key: string): string | null {
  if (!localStorageIsDurable()) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, raw: string): boolean {
  if (!localStorageIsDurable()) return false;
  try {
    localStorage.setItem(key, raw);
    return localStorage.getItem(key) === raw;
  } catch {
    return false;
  }
}
function copyBackup(raw: string) {
  writeStorage(BACKUP_KEY, raw);
}
function progressScore(s: Save): number {
  return (s.trials || 0) * 1000 + Object.keys(s.answered || {}).length * 10 + (s.charXp || 0) + (s.souls || 0) + (s.activeTrial ? 80 : 0);
}
function pickRicher(a: Save | null, b: Save | null): Save | null {
  if (!a) return b;
  if (!b) return a;
  const sa = progressScore(a);
  const sb = progressScore(b);
  if (sa !== sb) return sa >= sb ? a : b;
  const ta = a.lastSaved || '';
  const tb = b.lastSaved || '';
  return tb > ta ? b : a;
}
function isLedgerShape(parsed: unknown): parsed is Save {
  if (!parsed || typeof parsed !== 'object') return false;
  const rec = parsed as { v?: unknown; skills?: unknown; answered?: unknown };
  if (rec.v !== undefined && rec.v !== 1 && rec.v !== 2) return false;
  if (!rec.skills || typeof rec.skills !== 'object') return false;
  if (rec.answered !== undefined && (typeof rec.answered !== 'object' || rec.answered === null)) return false;
  return true;
}
function parseLedger(raw: string): Save | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isLedgerShape(parsed)) return null;
    return withEarned(applyDailyLogin(normalizeSave(parsed)));
  } catch {
    return null;
  }
}
async function loadSave(): Promise<LoadResult> {
  const fresh = withEarned(applyDailyLogin(makeSeed()));
  const durable = localStorageIsDurable();
  try {
    const primary = readStorage(STORAGE_KEY);
    const backup = readStorage(BACKUP_KEY);
    const fromPrimary = parseLedger(primary || '');
    const fromBackup = parseLedger(backup || '');
    const chosen = pickRicher(fromPrimary, fromBackup);
    if (chosen) {
      const raw = primary || backup || '';
      if (raw) copyBackup(raw);
      const when = chosen.lastSaved || '';
      if (durable && raw) writeStorage(STORAGE_KEY, JSON.stringify(chosen));
      return { save: chosen, blocked: false, notice: '', lastSaved: when, durable };
    }
    const damaged = !!(primary || backup);
    if (damaged) {
      return { save: fresh, blocked: true, notice: 'The ledger could not be read. Your saved file was left untouched. Play in this session or import a Save Scroll — nothing will overwrite the damaged file.', lastSaved: '', durable };
    }
    if (!durable) {
      return { save: fresh, blocked: false, notice: 'The hall cannot keep a lasting ledger in this browser sandbox. Export a Save Scroll in Settings so progress is not lost when the page closes.', lastSaved: '', durable: false };
    }
    return { save: fresh, blocked: false, notice: '', lastSaved: '', durable: true };
  } catch {
    return { save: fresh, blocked: true, notice: 'The ledger could not be opened. Your saved file was left untouched. Play in this session or import a Save Scroll.', lastSaved: '', durable };
  }
}
function persist(save: Save): boolean {
  if (persistGate) return false;
  try {
    const when = new Date().toISOString();
    const stamped: Save = { ...save, lastSaved: when };
    const existing = readStorage(STORAGE_KEY);
    if (existing) copyBackup(existing);
    const raw = JSON.stringify(stamped);
    if (!writeStorage(STORAGE_KEY, raw)) return false;
    return true;
  } catch {
    return false;
  }
}
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function encodeScroll(save: Save): string {
  return SCROLL_PREFIX + bytesToB64(new TextEncoder().encode(JSON.stringify(save)));
}
function decodeScroll(code: string): Save | null {
  const trimmed = code.trim();
  if (!trimmed) return null;
  try {
    let json = trimmed;
    if (trimmed.indexOf(SCROLL_PREFIX) === 0) json = new TextDecoder().decode(b64ToBytes(trimmed.slice(SCROLL_PREFIX.length)));
    else if (trimmed.charAt(0) !== '{') json = new TextDecoder().decode(b64ToBytes(trimmed));
    return parseLedger(json);
  } catch {
    return null;
  }
}
function downloadScroll(save: Save) {
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'construction-mastery-save.json';
  a.click();
  URL.revokeObjectURL(url);
}
function formatLastSaved(iso: string): string {
  if (!iso) return 'Not yet written';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Not yet written';
  try {
    return d.toLocaleString('en-US', { timeZone: 'America/Denver', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' Mountain Time';
  } catch {
    return d.toLocaleString();
  }
}
function hasBackupLedger(): boolean {
  return !!parseLedger(readStorage(BACKUP_KEY) || '');
}
function readBackupLedger(): Save | null {
  return parseLedger(readStorage(BACKUP_KEY) || '');
}
/** Full Save Scrolls are multi-KB; a reliable QR holds far less. We QR a fixed short instruction and show a scroll prefix beside it — Copy/Email carry the full code. */
const QR_INSTRUCTION = "Construction Mastery Save Scroll: open Settings, use Copy or Email for the full code.";
const QR_FIXED_N = 37;
const QR_FIXED_B64 = "/sH/Y/wQGW8QbqfKMLt1oISF269HC67BJWglB/qqqq/gCvllAPKH1jzuZAGuaoC4slNoMbw15MDpFX5r/ur4DeTdKvst1AW08OLPED/NMiNqfpHXlmqO7xkTlSm4s99Cze5XX6eCLXOFNgYcN3vvm8tz3vCN3rV91K0msh0Z5l0vIzCiwPsAcc30Y/mdEyrwRtkxGLoH9K+V1QSIMe6gm8TpBfxByk/rBKYHgA==";
function decodeFixedQr(): boolean[][] {
  const bin = atob(QR_FIXED_B64);
  const bytes: number[] = [];
  for (let i = 0; i < bin.length; i += 1) bytes.push(bin.charCodeAt(i));
  const mat: boolean[][] = [];
  let bit = 0;
  for (let r = 0; r < QR_FIXED_N; r += 1) {
    mat[r] = [];
    for (let c = 0; c < QR_FIXED_N; c += 1) {
      const byte = bytes[Math.floor(bit / 8)] || 0;
      const on = ((byte >> (7 - (bit % 8))) & 1) === 1;
      mat[r][c] = on;
      bit += 1;
    }
  }
  return mat;
}
function QrCode(props: { size?: number; title?: string }) {
  const mat = decodeFixedQr();
  const n = mat.length;
  const size = props.size || 168;
  return (
    <svg width={size} height={size} viewBox={'0 0 ' + n + ' ' + n} role="img" aria-label={props.title || 'QR code'} style={{ display: 'block', background: '#ffffff', border: '1px solid ' + C.goldDim, maxWidth: '100%' }}>
      <rect width={n} height={n} fill="#ffffff" />
      {mat.map((row, r) => row.map((dark, c) => (dark ? <rect key={r + '-' + c} x={c} y={r} width={1} height={1} fill="#0b0a08" /> : null)))}
    </svg>
  );
}
function scrollPrefix(code: string, n?: number): string {
  const take = n || 160;
  if (code.length <= take) return code;
  return code.slice(0, take) + '\u2026';
}

const SHOP: { id: string; kind: 'title' | 'banner' | 'theme'; name: string; cost: number; detail: string }[] = [
  { id: 'title-dragonborn', kind: 'title', name: 'Dragonborn of Bids', cost: 3, detail: 'A ceremonial title for the close of the ledger.' },
  { id: 'title-ironline', kind: 'title', name: 'Ironline Apprentice', cost: 1, detail: 'Named by the Master Builder himself.' },
  { id: 'title-archscribe', kind: 'title', name: 'Arch-Scribe of Takeoffs', cost: 2, detail: 'Worn by those who count twice and cut once.' },
  { id: 'banner-gold', kind: 'banner', name: 'Gilded Hall Banner', cost: 2, detail: 'Gold thread for the hall standard.' },
  { id: 'banner-dragon', kind: 'banner', name: 'Dragon Standard', cost: 3, detail: 'A crimson field and a golden dragon.' },
  { id: 'theme-aurora', kind: 'theme', name: 'Aurora of the North', cost: 3, detail: 'The night hall takes on a polar shimmer.' },
  { id: 'theme-hearth', kind: 'theme', name: 'Hearthfire', cost: 2, detail: 'Warm ember light across the stone.' },
  { id: 'theme-frost', kind: 'theme', name: 'Frostkeep', cost: 2, detail: 'A colder, paler hall of winter stone.' },
];
const LORE_TIPS = [
  'A 2x4 is 1-1/2 by 3-1/2 inches. Trust the dressed size, not the name of the stick.',
  'Specified f’c is a 28-day test, not a finish line. Keep the pour moist and it will still gain strength.',
  'Division 08 is Openings. The hardware set often costs more than the leaf.',
  'An accessible ramp may not run steeper than 1:12.',
  'A standard CMU is nominally 8x8x16 and actually 7-5/8 x 7-5/8 x 15-5/8, so the mortar joint can live on the module.',
  'EMT is Electrical Metallic Tubing, the common thin-wall conduit of commercial interiors.',
  'Domestic water is pushed by pressure. DWV — Drain, Waste, Vent — runs by gravity.',
  'Pre-bid RFIs exist to make every bidder price the same work, not to redesign the job an hour before the close.',
  'Type X board carries glass fibers in its core so it can stand in a fire-rated wall.',
  'The cheap number flees a complete one. Level the scope before you lower the fee.',
];
const CINEMA_BEATS: { kicker: string; line: string }[] = [
  { kicker: 'A northern hall, after hours', line: 'The takeoff tables are still warm. Outside, snow gathers on the ridge of the bid calendar.' },
  { kicker: 'The calling', line: 'You are Jameson Golding, estimator of City Creek Construction. Scope hides in the notes, and dirt lies under the paving.' },
  { kicker: 'The trial ahead', line: 'From the first 2x4 to Bid Day at two o’clock, the dragons of missing work and unsuitable ground are waiting.' },
  { kicker: 'The naming', line: 'Rise through the trades. Close the ledger. Become the Dragonborn of Bids.' },
  { kicker: 'A guide at the door', line: 'Haldor Ironline, Master Builder, will walk with you. His advice is blunt. His facts are measured.' },
];
const SKILL_WHISPERS: Partial<Record<SkillId | 'bid', string>> = {
  wood: 'Measure the dressed size, not the name of the stick.',
  conc: 'Strength is a 28-day test. Moisture is what gets you there.',
  open: 'Hardware and clearances live in Division 08. A ramp is 1:12, not steeper.',
  mas: 'Think in modules. The mortar joint is why a block is a hair under its nominal size.',
  elec: 'Name the path first — EMT, MC, or a feeder — before you price the labor.',
  fire: 'The hazard class and NFPA 13 write the sprinkler. Monitoring often belongs to Division 28.',
  plumb: 'Three rivers: pressure water, gravity DWV, and storm. Price them apart.',
  hvac: 'Tonnage comes from a load calculation, not from square footage alone.',
  fin: 'Type X is for fire. Protection of existing finishes is a different question.',
  therm: 'Water enters at transitions. Flashings and taper are where estimates go missing.',
  est: 'Read the unit and the division twice. The trick is often a name, not a number.',
  qto: 'Written dimensions rule a scale. Count openings before you multiply a wall.',
  site: 'Unsuitable soil and erosion control rewrite a lump sum after the dirt is opened.',
  risk: 'A qualification is a fence around a number, not a wish.',
  level: 'Level the scope first. The cheap number flees a complete one.',
  gaps: 'Ask who owns the patch, the block, and the firestop before you close.',
  markup: 'Fee, bond, and contingency are not the same pile of money.',
  strategy: 'A pre-bid RFI makes every bidder price the same work.',
  gc: 'General conditions are time and staff, not a mystery lump.',
  contract: 'Substantial completion is not final completion. Read the definition you are pricing.',
  fa: 'The alarm must speak to the switches. Coordination is the estimate.',
  met: 'Embeds that miss the pour are priced twice.',
  unit: 'Name the unit before you trust the extension.',
  bid: 'The bid is due at two o’clock. Guess less. Qualify more.',
};
function shopItem(id?: string) {
  return id ? SHOP.filter((s) => s.id === id)[0] : undefined;
}
function equippedTitle(save: Save): string {
  const item = shopItem(save.cosmetics && save.cosmetics.title);
  return item && item.kind === 'title' ? item.name : '';
}
function hallHour(): number {
  return new Date().getHours();
}
function isWinterMonth(): boolean {
  const m = new Date().getMonth();
  return m === 10 || m === 11 || m === 0 || m === 1;
}
function dayPhase(): 'day' | 'dusk' | 'night' {
  const h = hallHour();
  if (h >= 6 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'dusk';
  return 'night';
}
function shellBackground(save: Save): string {
  const theme = save.cosmetics && save.cosmetics.theme;
  if (theme === 'theme-aurora') return 'radial-gradient(ellipse at 50% 0%, #1c3348 0%, #10182a 42%, #070b14 78%)';
  if (theme === 'theme-hearth') return 'radial-gradient(ellipse at 50% 0%, #3a2212 0%, #1a100a 42%, #0c0806 78%)';
  if (theme === 'theme-frost') return 'radial-gradient(ellipse at 50% 0%, #2a3340 0%, #141820 42%, #0a0c10 78%)';
  const phase = dayPhase();
  if (phase === 'day') return 'radial-gradient(ellipse at 50% 0%, #3a2a18 0%, #1a140e 44%, ' + C.void + ' 76%)';
  if (phase === 'dusk') return 'radial-gradient(ellipse at 50% 0%, #3a1c12 0%, #160e0a 44%, ' + C.void + ' 76%)';
  return 'radial-gradient(ellipse at 50% 0%, #1a2740 0%, #120e0a 44%, ' + C.void + ' 78%)';
}
function whisperFor(skill: SkillId | 'bid'): string {
  return SKILL_WHISPERS[skill] || 'Read the stem twice. The trick is usually a name, a unit, or a division.';
}
function pickLoreTip(seed: number): string {
  return LORE_TIPS[Math.abs(seed) % LORE_TIPS.length];
}
function encKey(): string {
  return 'enc-' + todayKey();
}
function todayEncounter(): 'sub' | 'rfi' {
  return dayOfYear() % 2 === 0 ? 'sub' : 'rfi';
}
function playTone(ctx: AudioContext, freq: number, dur: number, type: OscillatorType, vol: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}
function pickQuiz(skill: SkillId, answered: Record<string, boolean>, seed: number, n?: number): string[] {
  const pool = FULL_BANK.filter((q) => q.skill === skill);
  const weak = shuffle(pool.filter((q) => answered[q.id] !== true), seed);
  const rest = shuffle(pool.filter((q) => answered[q.id] === true), seed + 17);
  return weak.concat(rest).slice(0, n || SESSION_Q).map((q) => q.id);
}
function pickBid(seed: number): string[] {
  return shuffle(BID_QS.concat(BID2), seed).slice(0, SESSION_Q).map((q) => q.id);
}
function ownedCount(save: Save): number {
  let n = 0;
  for (const id of SKILL_IDS) n += save.skills[id].perks.length;
  return n;
}
function perkAvailable(def: SkillDef, save: Save, perkIndex: number): boolean {
  const perk = def.perks[perkIndex];
  const rec = save.skills[def.id];
  if (rec.perks.indexOf(perk.id) >= 0) return false;
  if (skillInfo(rec.xp).level < perk.level) return false;
  if (perkIndex > 0 && rec.perks.indexOf(def.perks[perkIndex - 1].id) < 0) return false;
  return charInfo(save.charXp).level - 1 - ownedCount(save) > 0;
}
function anyPerkAvailable(save: Save): boolean {
  return ALL_SKILLS.some((def) => def.perks.some((_, i) => perkAvailable(def, save, i)));
}
function weakestOf(save: Save, ids: SkillId[]): SkillId {
  let best = ids[0];
  let low = Infinity;
  for (const id of ids) {
    const lv = skillInfo(save.skills[id].xp).level;
    if (lv < low) { low = lv; best = id; }
  }
  return best;
}
function starPoints(cx: number, cy: number, r: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : inner;
    pts.push(cx + Math.cos(ang) * rad + ',' + (cy + Math.sin(ang) * rad));
  }
  return pts.join(' ');
}
function headingStyle(_theme: { weight: { semibold: number } }, size: number, color: string): CSSProperties {
  return { margin: 0, fontFamily: FONT_DISPLAY, fontSize: size, fontWeight: theme.weight.semibold, letterSpacing: size >= 20 ? '0.16em' : '0.12em', textTransform: 'uppercase', color, lineHeight: 1.3 };
}
function GoldRule() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 18px', width: '100%' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, ' + C.goldDim + ', ' + C.gold + ')' }} />
      <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true"><path d="M1 7 H8 L11 3 L14 7 L17 3 L20 7 H27" fill="none" stroke={C.gold} strokeWidth="1.2" /><circle cx="14" cy="7" r="1.6" fill={C.goldSoft} /></svg>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, ' + C.gold + ', ' + C.goldDim + ', transparent)' }} />
    </div>
  );
}
function Meter(props: { value: number; max: number; color?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, props.max <= 0 ? 100 : (props.value / props.max) * 100));
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 13, background: '#0a0907', border: '1px solid var(--cm-gold-dim, ' + C.goldDim + ')', boxShadow: 'inset 0 0 0 1px #000, inset 0 2px 3px #00000088', clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)', overflow: 'hidden' }}>
        <div className="cm-bar" style={{ width: pct + '%', height: '100%', background: 'linear-gradient(180deg, #ffffff55 0%, ' + (props.color || C.gold) + ' 38%, ' + (props.color || C.gold) + ' 100%)', boxShadow: '0 0 10px ' + (props.color || C.gold) + '99' }} />
      </div>
      {props.label ? <div style={{ marginTop: 5, color: C.inkMute, fontSize: 12, letterSpacing: '0.06em', fontFamily: FONT_DISPLAY, overflowWrap: 'break-word' }}>{props.label}</div> : null}
    </div>
  );
}
function Seal(props: { rank: (typeof RANKS)[number]; level: number }) {
  return (
    <svg width="96" height="96" viewBox="0 0 92 92" aria-hidden="true" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 8px ' + props.rank.metal + '55)' }}>
      <circle cx="46" cy="46" r="44" fill="#0c0a07" stroke={props.rank.metal} strokeWidth="2.4" />
      <circle cx="46" cy="46" r="39" fill="none" stroke={C.goldDim} strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="46" cy="46" r="34" fill={C.stone} stroke={C.gold} strokeWidth="1.2" />
      <path d="M46 8 L49 16 L46 14 L43 16 Z M84 46 L76 49 L78 46 L76 43 Z M46 84 L43 76 L46 78 L49 76 Z M8 46 L16 43 L14 46 L16 49 Z" fill={C.gold} />
      <text x="46" y="44" textAnchor="middle" fill={props.rank.metal} fontSize="26" fontFamily={FONT_DECO}>{props.rank.rune}</text>
      <text x="46" y="66" textAnchor="middle" fill={C.goldSoft} fontSize="10" letterSpacing="1.2" fontFamily={FONT_DISPLAY}>LV {props.level}</text>
    </svg>
  );
}
function Btn(props: { label: string; onClick: () => void; kind?: 'gold' | 'stone' | 'quiet' | 'danger'; disabled?: boolean; wide?: boolean }) {
  const kind = props.kind || 'stone';
  const bg = kind === 'gold' ? C.gold : kind === 'danger' ? C.danger : kind === 'quiet' ? 'transparent' : C.stone;
  const fg = kind === 'gold' ? C.parchInk : kind === 'danger' ? C.dangerInk : C.ink;
  const border = kind === 'quiet' ? 'transparent' : kind === 'gold' ? 'var(--cm-gold-soft, ' + C.goldSoft + ')' : kind === 'danger' ? '#c45a5a' : 'var(--cm-gold-dim, ' + C.goldDim + ')';
  return (
    <button type="button" disabled={props.disabled} onClick={props.onClick} className={'cm-btn cm-btn-' + kind + (props.wide ? ' cm-btn-wide' : '')} style={{ fontFamily: FONT_DISPLAY, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 13, padding: '12px 16px', minHeight: 44, background: props.disabled ? C.stone : bg, color: props.disabled ? C.inkMute : fg, border: '1px solid ' + border, borderRadius: 0, boxShadow: props.disabled ? undefined : 'inset 0 1px 0 #ffffff33, 0 1px 0 #00000066', cursor: props.disabled ? 'default' : 'pointer', opacity: props.disabled ? 0.55 : 1, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
      {props.label}
    </button>
  );
}
function Corners(props: { color?: string }) {
  const c = props.color || 'var(--cm-gold, ' + C.gold + ')';
  const arm = (pos: CSSProperties, d: string) => (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none', ...pos }}>
      <path d={d} fill="none" stroke={c} strokeWidth="1.5" />
    </svg>
  );
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {arm({ top: 6, left: 6 }, 'M1 12 V1 H12')}
      {arm({ top: 6, right: 6 }, 'M15 12 V1 H4')}
      {arm({ bottom: 6, left: 6 }, 'M1 4 V15 H12')}
      {arm({ bottom: 6, right: 6 }, 'M15 4 V15 H4')}
    </span>
  );
}
function themeAccent(save: Save): { gold: string; goldSoft: string; goldDim: string; glow: string } {
  const theme = save.cosmetics && save.cosmetics.theme;
  if (theme === 'theme-aurora') return { gold: '#8ec9d4', goldSoft: '#d7f1f6', goldDim: '#4a7a86', glow: '#8ec9d466' };
  if (theme === 'theme-hearth') return { gold: '#e08a4a', goldSoft: '#f3c39a', goldDim: '#8a4a22', glow: '#e08a4a66' };
  if (theme === 'theme-frost') return { gold: '#a8c4d4', goldSoft: '#e4eef4', goldDim: '#5a7382', glow: '#a8c4d466' };
  return { gold: C.gold, goldSoft: C.goldSoft, goldDim: C.goldDim, glow: '#d4af3766' };
}
function Constellation(props: { def: SkillDef; rec: SkillSave; save: Save; onPerk: (perkId: string) => void; compact?: boolean }) {
  const lv = skillInfo(props.rec.xp).level;
  return (
    <div style={{ overflow: 'auto', maxWidth: '100%', border: props.compact ? undefined : '1px solid ' + C.goldDim, background: '#070b14' }}>
    <svg viewBox="0 0 400 320" width="100%" height={props.compact ? 150 : 300} role="img" aria-label={props.def.name + ' constellation'} style={{ display: 'block', minWidth: props.compact ? undefined : 320 }}>
      <defs>
        <radialGradient id={'sky-' + props.def.id} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#1c2a48" />
          <stop offset="55%" stopColor="#0d1424" />
          <stop offset="100%" stopColor="#070b14" />
        </radialGradient>
        <filter id={'glow-' + props.def.id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="320" fill={'url(#sky-' + props.def.id + ')'} />
      <ellipse cx="200" cy="150" rx="160" ry="70" fill={C.frost} opacity={0.06} />
      {Array.from({ length: props.compact ? 12 : 24 }).map((_, i) => (
        <circle key={i} className="cm-twinkle" cx={((i * 73) % 390) + 5} cy={((i * 47) % 310) + 4} r={i % 5 === 0 ? 1.5 : 0.7} fill={C.star} opacity={0.2 + (i % 6) * 0.1} style={{ animationDelay: (i * 0.19) + 's' }} />
      ))}
      {PERK_EDGES.map(([a, b]) => {
        const owned = props.rec.perks.indexOf(props.def.perks[a].id) >= 0 && props.rec.perks.indexOf(props.def.perks[b].id) >= 0;
        return <line key={a + '-' + b + (owned ? '-on' : '')} className={owned ? 'cm-draw' : undefined} x1={PERK_POS[a].x} y1={PERK_POS[a].y} x2={PERK_POS[b].x} y2={PERK_POS[b].y} stroke={owned ? C.goldSoft : C.frost} strokeWidth={owned ? 2.4 : 1} opacity={owned ? 0.95 : 0.35} filter={owned ? 'url(#glow-' + props.def.id + ')' : undefined} />;
      })}
      {props.def.perks.map((perk, i) => {
        const p = PERK_POS[i];
        const owned = props.rec.perks.indexOf(perk.id) >= 0;
        const open = perkAvailable(props.def, props.save, i);
        const color = owned ? C.goldSoft : open ? C.gold : C.inkMute;
        const r = owned ? 14 : 11;
        return (
          <g key={perk.id} style={{ cursor: !props.compact && open ? 'pointer' : 'default' }} onClick={() => { if (!props.compact && open) props.onPerk(perk.id); }}>
            {open ? <circle cx={p.x} cy={p.y} r={20} fill={C.gold} opacity={0.14} className="cm-pulse" /> : null}
            <polygon points={starPoints(p.x, p.y, r, r * 0.42)} fill={owned ? color : C.sky} stroke={color} strokeWidth={1.6} filter={owned || open ? 'url(#glow-' + props.def.id + ')' : undefined} />
            {!props.compact ? <text x={p.x} y={p.y + 28} textAnchor="middle" fill={C.inkDim} fontSize={10} fontFamily={FONT_DISPLAY}>{perk.level}  {perk.name}</text> : null}
          </g>
        );
      })}
      <text x="200" y="18" textAnchor="middle" fill={C.goldSoft} fontSize={11} fontFamily={FONT_DISPLAY} letterSpacing="2">{props.def.rune}  {props.def.name}</text>
      <text x="200" y={props.compact ? 300 : 28} textAnchor="middle" fill={C.goldSoft} fontSize={props.compact ? 16 : 14} letterSpacing="2">{props.compact ? props.def.rune + '  ' + lv : props.def.rune}</text>
    </svg>
    </div>
  );
}
function SkillEmblem(props: { id: SkillId | string; size?: number }) {
  const s = props.size || 36;
  const stroke = C.goldSoft;
  const icon = props.id;
  return (
    <svg width={s} height={s} viewBox="0 0 36 36" aria-hidden="true" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 4px ' + C.gold + '55)' }}>
      <circle cx="18" cy="18" r="16.5" fill="#0c0a07" stroke={C.goldDim} strokeWidth="1.2" />
      {icon === 'conc' ? <path d="M8 24 L12 14 H24 L28 24 Z M12 24 V28 H24 V24" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'mas' ? <path d="M8 14 H28 V18 H8 Z M8 20 H16 V28 H8 Z M20 20 H28 V28 H20 Z" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'met' ? <path d="M8 22 H28 M10 22 L14 10 H22 L26 22 M18 10 V8" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'wood' ? <path d="M18 6 L22 16 H14 Z M16 16 V30 M20 16 V30 M12 24 H24" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'therm' ? <path d="M10 24 Q18 8 26 24 M10 20 H26 M14 16 Q18 12 22 16" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'open' ? <path d="M11 8 H25 V28 H11 Z M25 8 L29 12 V28 H25 M16 18 H18" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'fin' ? <path d="M9 26 L18 8 L27 26 Z M14 20 H22" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'fire' ? <path d="M18 8 C14 14 12 16 12 22 A6 6 0 0 0 24 22 C24 16 22 14 18 8 Z" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'plumb' ? <path d="M12 8 V16 Q12 22 18 22 Q24 22 24 16 V8 M18 22 V30" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'hvac' ? <path d="M18 10 A7 7 0 1 1 17.9 10 M18 7 V13 M14 18 H22 M16 22 H20" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'elec' ? <path d="M20 6 L12 18 H18 L16 30 L26 16 H20 Z" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'fa' ? <path d="M10 24 A8 8 0 0 1 26 24 M18 16 V24 M18 26 V28" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'site' ? <path d="M6 26 L18 10 L30 26 Z M12 26 V30 H24 V26" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'est' || icon === 'markup' ? <path d="M10 8 H26 V28 H10 Z M14 14 H22 M14 19 H22 M14 24 H19" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'qto' ? <path d="M8 12 H28 M8 18 H28 M8 24 H20 M26 22 L30 26 L26 30" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'unit' ? <path d="M10 26 L18 8 L26 26 M13 20 H23" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'gc' ? <path d="M8 26 H28 L24 12 H12 Z M16 12 V8 H20 V12" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'level' ? <path d="M8 24 H28 M10 24 L16 12 H20 L26 24 M18 12 V10" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'gaps' ? <path d="M8 10 H16 V26 H8 Z M20 10 H28 V26 H20 M16 18 H20" fill="none" stroke={C.emberSoft} strokeWidth="1.4" /> : null}
      {icon === 'risk' ? <path d="M18 8 L28 26 H8 Z M18 16 V20 M18 23 V24" fill="none" stroke={C.emberSoft} strokeWidth="1.4" /> : null}
      {icon === 'strategy' ? <path d="M8 26 L18 8 L28 26 M18 8 V28 M12 18 H24" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
      {icon === 'contract' ? <path d="M12 8 H26 L24 28 H10 L12 8 Z M15 14 H23 M15 19 H21" fill="none" stroke={stroke} strokeWidth="1.4" /> : null}
    </svg>
  );
}
function CampaignMap(props: { save: Save; chapterOpen: (i: number) => boolean; onSelect: (ch: (typeof CHAPTERS)[number], boss?: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const regions: { d: string; x: number; y: number }[] = [
    { d: 'M18 250 L70 175 L175 185 L165 275 L35 290 Z', x: 100, y: 225 },
    { d: 'M165 185 L250 95 L360 120 L315 220 L175 230 Z', x: 255, y: 165 },
    { d: 'M340 100 L455 40 L580 95 L545 185 L350 175 Z', x: 455, y: 110 },
    { d: 'M315 220 L455 195 L530 280 L385 335 L270 300 Z', x: 400, y: 255 },
    { d: 'M18 295 L175 275 L230 360 L30 385 Z', x: 115, y: 325 },
    { d: 'M545 185 L760 145 L775 300 L530 280 Z', x: 640, y: 215 },
  ];
  const chosen = sel === null ? null : CHAPTERS[sel];
  const chosenOpen = sel !== null && props.chapterOpen(sel);
  const chosenBoss = chosen ? props.save.campaignDone.indexOf(chosen.id + '-boss') >= 0 : false;
  const chosenTrial = chosen ? props.save.campaignDone.indexOf(chosen.id + '-trial') >= 0 : false;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: C.inkMute, fontSize: 13, flex: '1 1 180px' }}>Tap a region for its lore. Scroll or pinch to pan. Paths kindle as bosses fall.</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn label="−" onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100))} />
          <Btn label={Math.round(zoom * 100) + '%'} onClick={() => setZoom(1)} />
          <Btn label="+" onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.25) * 100) / 100))} />
        </div>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 440, border: '1px solid ' + C.goldDim, background: 'radial-gradient(ellipse at 50% 30%, #1a2740 0%, #070b14 72%)', touchAction: 'pan-x pan-y' }}>
        <div style={{ width: zoom * 100 + '%', minWidth: 560 }}>
          <svg viewBox="0 0 800 420" width="100%" height="auto" role="img" aria-label="Campaign map of the six regions" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="cm-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2a4a2a" /><stop offset="100%" stopColor="#163016" /></linearGradient>
              <linearGradient id="cm-waste" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4a3a22" /><stop offset="100%" stopColor="#2a1c10" /></linearGradient>
              <linearGradient id="cm-keep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a4658" /><stop offset="100%" stopColor="#1c2838" /></linearGradient>
              <linearGradient id="cm-hall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4a3a20" /><stop offset="100%" stopColor="#2a2210" /></linearGradient>
              <linearGradient id="cm-forge" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#3a1208" /><stop offset="100%" stopColor="#1a1210" /></linearGradient>
              <linearGradient id="cm-cit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2a2038" /><stop offset="100%" stopColor="#120c18" /></linearGradient>
              <filter id="cm-pathglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              {regions.map((r, i) => <clipPath key={CHAPTERS[i].id} id={'cm-clip-' + CHAPTERS[i].id}><path d={r.d} /></clipPath>)}
            </defs>
            {Array.from({ length: 20 }).map((_, i) => <circle key={i} className="cm-twinkle" cx={(i * 89) % 790 + 6} cy={(i * 47) % 410 + 6} r={i % 5 === 0 ? 1.4 : 0.7} fill={C.star} opacity={0.35} style={{ animationDelay: (i * 0.17) + 's' }} />)}
            {CHAPTERS.slice(1).map((ch, idx) => {
              const i = idx;
              const lit = props.save.campaignDone.indexOf(CHAPTERS[i].id + '-boss') >= 0;
              return <line key={'path-' + ch.id} x1={regions[i].x} y1={regions[i].y} x2={regions[i + 1].x} y2={regions[i + 1].y} stroke={lit ? C.goldSoft : C.goldDim} strokeWidth={lit ? 3.2 : 1.2} strokeDasharray={lit ? '1 0' : '5 6'} opacity={lit ? 1 : 0.55} className={lit ? 'cm-draw' : undefined} filter={lit ? 'url(#cm-pathglow)' : undefined} />;
            })}
            {CHAPTERS.map((ch, i) => {
              const open = props.chapterOpen(i);
              const bossDone = props.save.campaignDone.indexOf(ch.id + '-boss') >= 0;
              const fills = ['url(#cm-grass)', 'url(#cm-waste)', 'url(#cm-keep)', 'url(#cm-hall)', 'url(#cm-forge)', 'url(#cm-cit)'];
              const stroke = !open ? C.ironHi : bossDone ? C.gold : sel === i ? C.goldSoft : C.frost;
              const r = regions[i];
              return (
                <g key={ch.id} style={{ cursor: 'pointer' }} onClick={() => setSel(i)} onMouseEnter={() => setSel(i)}>
                  <path d={r.d} fill={open ? fills[i] : '#12100c'} stroke={stroke} strokeWidth={sel === i || bossDone ? 2.4 : 1.3} opacity={open ? 1 : 0.7} />
                  <g clipPath={'url(#cm-clip-' + ch.id + ')'} opacity={open ? 1 : 0.35}>
                    {i === 0 ? <g fill="none" stroke="#c9b896" strokeWidth="1.1"><path d="M40 250 L55 210 L70 250 M85 260 L100 220 L115 260" /><path d="M50 240 H130" /><circle cx="70" cy="200" r="6" /><path d="M70 194 V180 H78" stroke={C.gold} /></g> : null}
                    {i === 1 ? <g fill="none" stroke="#8a6a40" strokeWidth="1.1"><path d="M200 200 L230 170 L250 200 L220 210 Z" /><path d="M260 150 L280 130 L300 155" /><path d="M190 210 Q230 230 270 200" /></g> : null}
                    {i === 2 ? <g fill="none" stroke="#c5d0dc" strokeWidth="1.2"><path d="M380 150 L400 90 L420 150" /><path d="M430 140 L450 70 L470 140" /><path d="M490 130 L510 80 L530 130" /><path d="M400 150 H520" /><rect x="430" y="120" width="24" height="36" /><path d="M430 120 L442 108 L454 120" /></g> : null}
                    {i === 3 ? <g fill="none" stroke={C.goldSoft} strokeWidth="1.1"><rect x="340" y="230" width="90" height="40" /><path d="M350 230 V215 H420 V230" /><path d="M360 250 V270 M380 250 V270 M400 250 V270" /></g> : null}
                    {i === 4 ? <g fill="none" stroke={C.emberSoft} strokeWidth="1.2"><path d="M50 360 Q90 310 140 350 Q170 370 200 340" /><circle cx="110" cy="340" r="8" fill="#c45c20" opacity="0.45" /><path d="M70 350 L80 320 M150 355 L165 325" /></g> : null}
                    {i === 5 ? <g fill="none" stroke={C.goldSoft} strokeWidth="1.2"><path d="M600 250 L630 170 L660 250 Z" /><rect x="618" y="200" width="24" height="50" /><path d="M610 200 H650 L642 188 H618 Z" /><path d="M700 230 L720 150 L740 230" /><path d="M680 160 Q700 130 740 150" stroke={bossDone ? C.emberSoft : C.frost} /></g> : null}
                  </g>
                  {!open ? <g opacity={0.82}><path d={r.d} fill="#0b0a08" opacity={0.55} /><circle cx={r.x} cy={r.y - 8} r="18" fill="#07080c" opacity={0.5} /><text x={r.x} y={r.y - 4} textAnchor="middle" fill={C.inkMute} fontSize={10} fontFamily={FONT_DISPLAY}>Fog</text></g> : null}
                  <text x={r.x} y={r.y + (open ? 8 : 16)} textAnchor="middle" fill={open ? C.goldSoft : C.inkMute} fontSize={11} fontFamily={FONT_DISPLAY}>{ch.name}</text>
                  <text x={r.x} y={r.y + (open ? 22 : 30)} textAnchor="middle" fill={open ? C.inkDim : C.inkMute} fontSize={9} fontFamily={FONT_DISPLAY}>{!open ? 'Sealed' : bossDone ? 'Cleared' : ch.boss}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      {chosen ? (
        <div style={{ ...{ background: 'linear-gradient(180deg, #241f18, #120e0a)', border: '1px solid ' + C.goldDim, padding: '12px 14px', marginTop: 0, borderTop: 'none' } }}>
          <div style={{ color: C.gold, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 11 }}>{chosen.region}</div>
          <div style={{ color: C.goldSoft, fontFamily: FONT_DISPLAY, fontSize: 16, margin: '4px 0' }}>{chosen.name}</div>
          <p style={{ margin: '0 0 8px', color: C.inkDim, fontSize: 14 }}>{chosen.blurb}</p>
          <div style={{ color: C.inkMute, fontSize: 13, marginBottom: 10 }}>Boss  ·  {chosen.boss}{!chosenOpen ? '  ·  Sealed in fog' : chosenBoss ? '  ·  Fallen' : chosenTrial ? '  ·  Awake' : '  ·  Sleeping'}</div>
          {chosenOpen ? <Btn label={!chosenTrial ? 'Begin the trial' : !chosenBoss ? 'Face ' + chosen.boss : 'Challenge ' + chosen.boss + ' again'} kind={chosenTrial ? 'danger' : 'gold'} onClick={() => props.onSelect(chosen, chosenTrial)} /> : <div style={{ color: C.inkMute, fontSize: 14 }}>Clear the previous region to lift this fog.</div>}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [save, setSave] = useState<Save>(() => makeSeed());
  const [view, setView] = useState<View>('title');
  const [focus, setFocus] = useState<SkillId>('fire');
  const [session, setSession] = useState<QuizSession | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [levelModal, setLevelModal] = useState(false);
  const [legendConfirm, setLegendConfirm] = useState(false);
  const [skillTab, setSkillTab] = useState<'trade' | 'est'>('trade');
  const [shake, setShake] = useState(false);
  const [glow, setGlow] = useState(false);
  const [bits, setBits] = useState<{ id: number; x: number; y: number }[]>([]);
  const [bossIntro, setBossIntro] = useState<(typeof CHAPTERS)[number] | null>(null);
  const [codexQ, setCodexQ] = useState('');
  const [codexCat, setCodexCat] = useState('all');
  const [resetAsk, setResetAsk] = useState(false);
  const [ledgerNotice, setLedgerNotice] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [saveWarning, setSaveWarning] = useState('');
  const [showCinema, setShowCinema] = useState(false);
  const [cinemaBeat, setCinemaBeat] = useState(0);
  const [trialCurtain, setTrialCurtain] = useState('');
  const [discoverBanner, setDiscoverBanner] = useState('');
  const [mentorMood, setMentorMood] = useState('');
  const [importDraft, setImportDraft] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const [scrollCopied, setScrollCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [backupOffer, setBackupOffer] = useState(false);
  const [showScrollQr, setShowScrollQr] = useState(false);
  const savedFlashTimer = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const droneRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const trialLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadSave();
      if (cancelled) return;
      setPersistGate(loaded.blocked);
      setSave(loaded.save);
      setLedgerNotice(loaded.notice);
      setLastSavedAt(loaded.lastSaved);
      const backupOk = hasBackupLedger();
      setBackupOffer(!!(loaded.blocked && backupOk));
      setSaveWarning(loaded.durable ? '' : (loaded.notice || 'The ledger could not be saved in this view. Export a Save Scroll in Settings so progress is not lost.'));
      if (loaded.save.activeTrial && !loaded.save.activeTrial.session.done) {
        setSession(loaded.save.activeTrial.session);
        if (loaded.save.activeTrial.focus) setFocus(loaded.save.activeTrial.focus);
      }
      if (!loaded.save.cinemaSeen) setShowCinema(true);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const logged = applyDailyLogin(save);
    const rewarded = grantLoginRewards(logged);
    const next = grantTrophies(rewarded);
    if (next.souls > logged.souls) {
      const tid = Date.now();
      setToasts((cur) => cur.concat([{ id: tid, kind: 'soul', text: 'Dawn reward  ·  Dragon Soul absorbed' }]));
      window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== tid)), 2800);
    }
    if (next !== save) setSave(next);
    else {
      if (persist(save)) {
        const when = new Date().toISOString();
        setLastSavedAt(when);
        setSaveWarning('');
        setBackupOffer(false);
        setSavedFlash(true);
        if (savedFlashTimer.current) window.clearTimeout(savedFlashTimer.current);
        savedFlashTimer.current = window.setTimeout(() => setSavedFlash(false), 2800);
      } else {
        const backupOk = hasBackupLedger();
        setBackupOffer(backupOk);
        setSaveWarning(backupOk
          ? 'The ledger could not be saved. A backup is available — restore it without wiping the damaged primary file.'
          : 'The ledger could not be saved. Copy a Save Scroll in Settings so this progress is not lost.');
      }
    }
  }, [save, ready]);
  useEffect(() => {
    if (!ready) return;
    setSave((s) => {
      if (!session || session.done) return s.activeTrial ? { ...s, activeTrial: null } : s;
      const next = { view: (session.mode === 'bid' ? 'bid' : 'quiz') as 'quiz' | 'bid', focus: session.skill === 'bid' ? focus : session.skill, session };
      const cur = s.activeTrial;
      if (cur && cur.view === next.view && cur.focus === next.focus && cur.session === session) return s;
      return { ...s, activeTrial: next };
    });
  }, [session, ready]);

  const pushToast = (kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 999);
    setToasts((cur) => cur.concat([{ id, kind, text }]));
    window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 2600);
  };

  const ch = charInfo(save.charXp);
  const rank = rankFor(ch.level);
  const upcoming = nextRank(ch.level);
  const perkPts = Math.max(0, ch.level - 1 - ownedCount(save));
  const tome = TOMES[dayOfYear() % TOMES.length];
  const weakId = weakestOf(save, WEAK);
  const weakDef = skillById(weakId);
  const focusDef = skillById(focus);
  const focusRec = save.skills[focus];
  const focusLv = skillInfo(focusRec.xp);

  function markDaily(id: string, prev: Save): string[] {
    return prev.dailyDone.indexOf(id) >= 0 ? prev.dailyDone : prev.dailyDone.concat([id]);
  }
  function applyXp(prev: Save, skill: SkillId, amount: number): { next: Save; skillUp: number; charUp: number; newRank?: string } {
    const rec = prev.skills[skill];
    const before = skillInfo(rec.xp);
    const after = skillInfo(rec.xp + amount);
    let addChar = 0;
    for (let l = before.level + 1; l <= after.level; l += 1) addChar += charXpFromSkillUp(l);
    const charBefore = charInfo(prev.charXp);
    const next: Save = { ...prev, skills: { ...prev.skills, [skill]: { ...rec, xp: rec.xp + amount } }, charXp: prev.charXp + addChar };
    const charAfter = charInfo(next.charXp);
    const oldTitle = rankFor(charBefore.level).title;
    const newTitle = rankFor(charAfter.level).title;
    return { next, skillUp: after.level - before.level, charUp: charAfter.level - charBefore.level, newRank: newTitle !== oldTitle ? newTitle : undefined };
  }
  function burst(correct: boolean) {
    const preferReduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reduce = save.settings && save.settings.motion === 'reduce' || (save.settings && save.settings.motion !== 'full' && preferReduce);
    if (reduce) return;
    if (correct) {
      setGlow(true);
      window.setTimeout(() => setGlow(false), 500);
      const nextBits = Array.from({ length: 8 }).map((_, i) => ({ id: Date.now() + i, x: 30 + Math.random() * 40, y: 40 + Math.random() * 20 }));
      setBits(nextBits);
      window.setTimeout(() => setBits([]), 800);
    } else {
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    }
  }
  function grantTrophies(prev: Save): Save {
    const got = earnedTrophies(prev);
    const fresh = got.filter((id) => prev.achievements.indexOf(id) < 0);
    if (fresh.length === 0) return prev;
    for (const id of fresh) {
      const t = TROPHIES.find((x) => x.id === id);
      if (t) pushToast('achieve', 'Trophy  ·  ' + t.name);
    }
    return { ...prev, achievements: got };
  }
  function openTrialPending(): boolean {
    return !!(session && !session.done) || !!(save.activeTrial && save.activeTrial.session && !save.activeTrial.session.done);
  }
  function resumeTrial() {
    const parked = (session && !session.done) ? { view: (session.mode === 'bid' ? 'bid' : 'quiz') as 'quiz' | 'bid', focus: session.skill === 'bid' ? focus : session.skill, session } : save.activeTrial;
    if (!parked) return;
    trialLockRef.current = false;
    setSession(parked.session);
    if (parked.focus) setFocus(parked.focus);
    setView(parked.view);
    arrive();
    setMentorMood('We pick up the trial where you left it.');
  }
  function abandonTrial() {
    trialLockRef.current = false;
    setSession(null);
    setSave((s) => ({ ...s, activeTrial: null }));
    setMentorMood('The open trial is abandoned. A new one may begin.');
  }
  function blockIfOpen(): boolean {
    if (!openTrialPending()) return false;
    setMentorMood('A trial is already underway. Resume it, or abandon it before starting another.');
    return true;
  }
  function startSkillQuiz(id: SkillId, n?: number) {
    if (blockIfOpen()) return;
    trialLockRef.current = false;
    const ids = pickQuiz(id, save.answered, Date.now() % 100000, n);
    if (ids.length === 0) return;
    setFocus(id);
    setSession({ mode: 'skill', skill: id, ids, index: 0, items: [], hint: false, show: false, done: false, order: orderFor(ids[0], Date.now()), numDraft: '', startSouls: save.souls, startCodex: save.codex.slice(), bonusXp: 0, shoutSlow: false });
    setView('quiz'); arrive();
    discoverPlace(id, skillById(id).name);
    setMentorMood(whisperFor(id));
    openCurtain();
  }
  function startBid() {
    if (blockIfOpen()) return;
    trialLockRef.current = false;
    const ids = pickBid(Date.now() % 100000);
    setSession({ mode: 'bid', skill: 'bid', ids, index: 0, items: [], hint: false, show: false, done: false, order: orderFor(ids[0], Date.now()), numDraft: '', startSouls: save.souls, startCodex: save.codex.slice(), bonusXp: 0, shoutSlow: false });
    setView('bid');
    arrive();
    discoverPlace('bid-day', 'Bid Day Citadel');
    setMentorMood(whisperFor('bid'));
    openCurtain();
  }
  function startHaunted(n?: number) {
    if (blockIfOpen()) return;
    trialLockRef.current = false;
    const ids = pickHaunted(save, Date.now() % 100000, n || 3);
    if (ids.length === 0) return;
    setSession({ mode: 'haunt', skill: 'est', ids, index: 0, items: [], hint: false, show: false, done: false, order: orderFor(ids[0], Date.now()), numDraft: '', startSouls: save.souls, startCodex: save.codex.slice(), bonusXp: 0, shoutSlow: false });
    setView('quiz'); arrive();
    discoverPlace('haunt', 'The Haunted Ledger');
    setMentorMood('These questions still haunt the ledger. Two later rights will banish one.');
    openCurtain();
  }
  function startChapter(ch: (typeof CHAPTERS)[number], boss?: boolean) {
    if (boss) { if (blockIfOpen()) return; trialLockRef.current = false; setBossIntro(ch); setView('campaign'); return; }
    if (blockIfOpen()) return;
    trialLockRef.current = false;
    const ids = pickChapter(ch, save.answered, Date.now() % 100000, 5);
    if (ids.length === 0) return;
    setSession({ mode: 'camp', skill: ch.skills[0], chapter: ch.id, ids, index: 0, items: [], hint: false, show: false, done: false, order: orderFor(ids[0], Date.now()), numDraft: '', startSouls: save.souls, startCodex: save.codex.slice(), bonusXp: 0, shoutSlow: false });
    setView('quiz'); arrive();
    discoverPlace(ch.id, ch.region);
    setMentorMood(ch.blurb);
    openCurtain();
  }
  function commitBoss(ch: (typeof CHAPTERS)[number]) {
    if (blockIfOpen()) return;
    trialLockRef.current = false;
    const ids = ch.bossQ.filter((id) => qById(id));
    if (ids.length === 0) return;
    setBossIntro(null);
    setSession({ mode: 'boss', skill: ch.skills[0], chapter: ch.id, ids, index: 0, items: [], hint: false, show: false, done: false, order: orderFor(ids[0], Date.now()), numDraft: '', startSouls: save.souls, startCodex: save.codex.slice(), bonusXp: 0, shoutSlow: false });
    setView('quiz'); arrive();
    discoverPlace(ch.id + '-boss', ch.boss);
    setMentorMood('A legendary foe. Spend souls only if the path is truly dark.');
    openCurtain();
  }
  function answer(choice: number) {
    if (!session || session.show || session.done) return;
    const q = qById(session.ids[session.index]);
    if (!q || q.kind === 'num') return;
    const orig = session.order.length === q.c.length ? session.order[choice] : choice;
    if (orig === undefined) return;
    const correct = orig === q.a;
    if (correct) {
      sfx('ok');
      setMentorMood(save.streak + 1 >= 3 ? 'The combo holds. Keep your hand steady, lad.' : 'Aye. Write that one in the book.');
    } else {
      sfx('miss');
      setMentorMood('A miss is a haunt if you leave it. Come back to it.');
    }
    const bid = session.mode === 'bid';
    const streak = correct ? save.streak + 1 : 0;
    const xp = correct ? xpForCorrect(streak, bid) : 0;
    let next: Save = { ...save, streak, bestStreak: Math.max(save.bestStreak, streak), answered: { ...save.answered, [q.id]: correct || save.answered[q.id] === true }, haunted: { ...save.haunted }, codex: save.codex.slice() };
    if (correct) {
      if (next.haunted[q.id]) {
        const rec = next.haunted[q.id];
        const rights = rec.rights + 1;
        next.haunted[q.id] = { misses: rec.misses, rights, due: rights >= 2 ? rec.due : shiftKey(todayKey(), 1) };
      }
      if (next.codex.indexOf(q.id) < 0) next.codex = next.codex.concat(q.id);
    } else {
      const rec = next.haunted[q.id] || { misses: 0, rights: 0 };
      next.haunted[q.id] = { misses: rec.misses + 1, rights: rec.rights, due: todayKey() };
    }
    if (correct && q.skill !== 'bid' && next.skills[q.skill]) {
      const applied = applyXp(next, q.skill, xp);
      next = applied.next;
      if (applied.skillUp > 0) pushToast('skill', 'Skill increased  ·  ' + skillById(q.skill).name + ' ' + skillInfo(next.skills[q.skill].xp).level);
      if (applied.charUp > 0) { pushToast('xp', 'Level Up  ·  ' + charInfo(next.charXp).level); setLevelModal(true); }
      if (applied.newRank) pushToast('rank', 'Guild rank  ·  ' + applied.newRank);
    } else if (correct && bid) {
      const applied = applyXp(next, 'est', xp);
      next = applied.next;
      if (applied.skillUp > 0) pushToast('skill', 'Skill increased  ·  ' + skillById('est').name);
      if (applied.charUp > 0) setLevelModal(true);
      pushToast('xp', '+' + xp + ' experience');
    }
    burst(correct);
    setSave(grantTrophies(next));
    setSession({ ...session, show: true, hint: false, items: session.items.concat([{ id: q.id, picked: choice, correct, xp }]) });
  }
  function answerNum() {
    if (!session || session.show || session.done) return;
    const q = qById(session.ids[session.index]);
    if (!q || !q.num) return;
    const raw = (session.numDraft || '').trim().replace(/,/g, '');
    if (!raw) return;
    const val = Number(raw);
    const correct = isFinite(val) && Math.abs(val - q.num.value) <= q.num.tol;
    if (correct) {
      sfx('ok');
      setMentorMood(save.streak + 1 >= 3 ? 'The combo holds. The number sits within tolerance.' : 'Within tolerance. A close estimate still counts.');
    } else {
      sfx('miss');
      setMentorMood('Off the mark. Check the unit, the waste, and the dressed size.');
    }
    const bid = session.mode === 'bid';
    const streak = correct ? save.streak + 1 : 0;
    const xp = correct ? xpForCorrect(streak, bid) : 0;
    let next: Save = { ...save, streak, bestStreak: Math.max(save.bestStreak, streak), answered: { ...save.answered, [q.id]: correct || save.answered[q.id] === true }, haunted: { ...save.haunted }, codex: save.codex.slice() };
    if (correct) {
      if (next.haunted[q.id]) {
        const rec = next.haunted[q.id];
        const rights = rec.rights + 1;
        next.haunted[q.id] = { misses: rec.misses, rights, due: rights >= 2 ? rec.due : shiftKey(todayKey(), 1) };
      }
      if (next.codex.indexOf(q.id) < 0) next.codex = next.codex.concat(q.id);
    } else {
      const rec = next.haunted[q.id] || { misses: 0, rights: 0 };
      next.haunted[q.id] = { misses: rec.misses + 1, rights: rec.rights, due: todayKey() };
    }
    if (correct && q.skill !== 'bid' && next.skills[q.skill]) {
      const applied = applyXp(next, q.skill, xp);
      next = applied.next;
      if (applied.skillUp > 0) pushToast('skill', 'Skill increased  ·  ' + skillById(q.skill).name + ' ' + skillInfo(next.skills[q.skill].xp).level);
      if (applied.charUp > 0) { pushToast('xp', 'Level Up  ·  ' + charInfo(next.charXp).level); setLevelModal(true); }
      if (applied.newRank) pushToast('rank', 'Guild rank  ·  ' + applied.newRank);
    } else if (correct && bid) {
      const applied = applyXp(next, 'est', xp);
      next = applied.next;
      if (applied.skillUp > 0) pushToast('skill', 'Skill increased  ·  ' + skillById('est').name);
      if (applied.charUp > 0) setLevelModal(true);
      pushToast('xp', '+' + xp + ' experience');
    }
    burst(correct);
    setSave(grantTrophies(next));
    setSession({ ...session, show: true, hint: false, items: session.items.concat([{ id: q.id, picked: 0, correct, xp }]) });
  }
  function nextQuestion() {
    if (!session || session.done || trialLockRef.current) return;
    if (session.index + 1 < session.ids.length) {
      const nextIndex = session.index + 1;
      setSession({ ...session, index: nextIndex, show: false, hint: false, numDraft: '', order: orderFor(session.ids[nextIndex], Date.now() + nextIndex * 7919) });
      return;
    }
    const correctN = session.items.filter((i) => i.correct).length;
    const perfect = correctN === session.ids.length;
    const passed = correctN >= Math.ceil(session.ids.length * 0.6);
    let next: Save = { ...save, trials: save.trials + 1, perfects: save.perfects + (perfect ? 1 : 0) };
    let daily = next.dailyDone.slice();
    if (session.mode === 'skill' && session.skill !== 'bid') {
      daily = markDaily('drill', { ...next, dailyDone: daily });
      if (session.skill === weakId) daily = markDaily('weak', { ...next, dailyDone: daily });
      if (perfect) {
        next = { ...next, souls: next.souls + 1 };
        pushToast('soul', 'Dragon Soul absorbed');
        const applied = applyXp(next, session.skill, PERFECT_BONUS);
        next = applied.next;
        if (applied.charUp > 0) setLevelModal(true);
      }
    } else if (session.mode === 'bid') {
      daily = markDaily('bid', { ...next, dailyDone: daily });
      next = { ...next, bidBest: Math.max(next.bidBest, correctN) };
      if (perfect) {
        next = { ...next, souls: next.souls + BID_PERFECT_SOULS, charXp: next.charXp + BID_PERFECT_BONUS };
        pushToast('soul', BID_PERFECT_SOULS + ' Dragon Souls absorbed');
        if (charInfo(next.charXp).level > charInfo(save.charXp).level) setLevelModal(true);
      }
    } else {
      if ((session.mode === 'camp' || session.mode === 'boss') && session.chapter && passed) {
        const key = session.chapter + (session.mode === 'boss' ? '-boss' : '-trial');
        if (next.campaignDone.indexOf(key) < 0) next.campaignDone = next.campaignDone.concat(key);
        if (session.mode === 'boss') {
          if (perfect) {
            next = { ...next, souls: next.souls + 1 };
            pushToast('soul', 'Boss fallen  ·  Dragon Soul absorbed');
          } else pushToast('rank', 'Boss fallen');
        } else pushToast('xp', 'Chapter trial cleared  ·  the boss awakens');
      } else if ((session.mode === 'camp' || session.mode === 'boss') && !passed) {
        pushToast('xp', 'The chapter still stands  ·  return when ready');
      }
      if (perfect && (session.mode === 'camp' || session.mode === 'haunt')) {
        next = { ...next, souls: next.souls + 1 };
        pushToast('soul', 'Perfect  ·  Dragon Soul absorbed');
      }
      if (perfect && session.skill !== 'bid' && next.skills[session.skill]) {
        const applied = applyXp(next, session.skill, PERFECT_BONUS);
        next = applied.next;
        if (applied.charUp > 0) setLevelModal(true);
      }
    }
    if (daily.indexOf('weak') >= 0 && daily.indexOf('drill') >= 0 && daily.indexOf('tome') >= 0 && daily.indexOf('all') < 0) {
      daily = daily.concat(['all']);
      next = { ...next, souls: next.souls + 1 };
      pushToast('soul', 'Daily quests complete  ·  Dragon Soul absorbed');
    }
    let bonus = 0;
    if (perfect && session.mode !== 'bid' && session.skill !== 'bid') bonus += PERFECT_BONUS;
    if (perfect && session.mode === 'bid') bonus += BID_PERFECT_BONUS;
    const trialName = session.mode === 'bid' ? 'Bid Day' : session.mode === 'boss' ? 'Boss encounter' : session.mode === 'camp' ? 'Chapter trial' : session.mode === 'haunt' ? 'Haunt hunt' : 'Trial';
    let stored: Save = { ...next, dailyDone: daily };
    stored = pushHist(stored, trialName + '  ·  ' + correctN + ' of ' + session.ids.length + ' correct');
    const newTitle = rankFor(charInfo(stored.charXp).level).title;
    if (newTitle !== rank.title) stored = pushHist(stored, 'You are named ' + newTitle);
    if (session.encounter) {
      const key = encKey();
      if ((stored.sideDone || []).indexOf(key) < 0) stored = { ...stored, sideDone: (stored.sideDone || []).concat([key]) };
      const needed = Math.ceil(session.ids.length * 0.75);
      if (correctN >= needed) {
        stored = { ...stored, souls: stored.souls + 1 };
        pushToast('soul', session.encounter === 'sub' ? 'The traveling sub pays a Dragon Soul' : 'The cursed RFI is lifted  ·  Dragon Soul absorbed');
        sfx('soul');
      } else setMentorMood(session.encounter === 'sub' ? 'The sub walks on. Come back with a tighter number tomorrow.' : 'The RFI still hangs over the close. Study the conflict and return.');
    }
    trialLockRef.current = true;
    setSave(grantTrophies(stored));
    setSession({ ...session, done: true, show: true, bonusXp: bonus });
  }
  function motionReduced(): boolean {
    const preferReduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !!(save.settings && (save.settings.motion === 'reduce' || (save.settings.motion !== 'full' && preferReduce)));
  }
  function audioCtx(): AudioContext | null {
    if (!(save.settings && save.settings.sound)) return null;
    if (typeof window === 'undefined' || !window.AudioContext) return null;
    if (!audioRef.current) audioRef.current = new window.AudioContext();
    if (audioRef.current.state === 'suspended') audioRef.current.resume();
    return audioRef.current;
  }
  function sfx(kind: 'ok' | 'miss' | 'shout' | 'discover' | 'soul') {
    const ctx = audioCtx();
    if (!ctx) return;
    if (kind === 'ok') playTone(ctx, 523, 0.16, 'triangle', 0.05);
    else if (kind === 'miss') playTone(ctx, 196, 0.22, 'sine', 0.05);
    else if (kind === 'shout') { playTone(ctx, 196, 0.28, 'sawtooth', 0.04); playTone(ctx, 294, 0.35, 'triangle', 0.04); }
    else if (kind === 'discover') { playTone(ctx, 392, 0.2, 'triangle', 0.05); playTone(ctx, 587, 0.35, 'sine', 0.04); }
    else playTone(ctx, 659, 0.3, 'triangle', 0.05);
  }
  function openCurtain() {
    if (motionReduced()) { setTrialCurtain(''); return; }
    setTrialCurtain(pickLoreTip(Date.now()));
    window.setTimeout(() => setTrialCurtain(''), 1200);
  }
  function discoverPlace(id: string, label: string) {
    if ((save.discovered || []).indexOf(id) >= 0) return;
    setSave((s) => ({ ...s, discovered: (s.discovered || []).indexOf(id) >= 0 ? (s.discovered || []) : (s.discovered || []).concat([id]) }));
    setDiscoverBanner('Discovered: ' + label);
    sfx('discover');
    window.setTimeout(() => setDiscoverBanner(''), 4200);
  }
  function closeCinema() {
    setShowCinema(false);
    setCinemaBeat(0);
    setSave((s) => ({ ...s, cinemaSeen: true }));
  }
  function useHint() {
    if (!session || session.show || session.hint || save.souls < 1) return;
    setSave((s) => s.souls < 1 ? s : { ...s, souls: s.souls - 1 });
    setSession({ ...session, hint: true });
    setMentorMood('50/50 Shout  ·  Two falsehoods fall away. The truth still has to be chosen.');
    sfx('shout');
  }
  function useSlow() {
    if (!session || session.show || session.shoutSlow || save.souls < 1) return;
    setSave((s) => s.souls < 1 ? s : { ...s, souls: s.souls - 1 });
    setSession({ ...session, shoutSlow: true });
    const recSkill = session.skill === 'bid' ? 'est' : session.skill;
    const def = skillById(recSkill);
    const rec = save.skills[recSkill];
    const mastered = rec ? def.perks.filter((p) => rec.perks.indexOf(p.id) >= 0) : [];
    const perkLine = mastered.length ? ' Perk lore: ' + mastered[mastered.length - 1].concept : '';
    setMentorMood('Time Slow  ·  ' + whisperFor(session.skill === 'bid' ? 'bid' : session.skill) + perkLine);
    sfx('shout');
  }
  function arrive() {
    const reduce = motionReduced();
    window.setTimeout(() => {
      try {
        if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' });
        const heading = document.getElementById('cm-main-heading');
        if (heading && typeof (heading as HTMLElement).focus === 'function') (heading as HTMLElement).focus();
      } catch { /* ignore */ }
    }, 0);
  }
  function goView(id: View) {
    if (session && !session.done && id !== 'quiz' && id !== 'bid') {
      setSave((s) => ({ ...s, activeTrial: { view: session.mode === 'bid' ? 'bid' : 'quiz', focus: session.skill === 'bid' ? focus : session.skill, session } }));
    }
    if (id === 'campaign') discoverPlace('map', 'The Campaign Star Map');
    if (id === 'skills') discoverPlace('stars', 'The Constellations');
    if (id === 'shop') discoverPlace('shop', 'The Soul Merchant');
    if (id === 'haunt') discoverPlace('haunt', 'The Haunted Ledger');
    setView(id);
    arrive();
  }
  function startEncounter(kind: 'sub' | 'rfi') {
    if (blockIfOpen()) return;
    const key = encKey();
    if ((save.sideDone || []).indexOf(key) >= 0) return;
    trialLockRef.current = false;
    if (kind === 'sub') {
      const ids = pickQuiz(weakId, save.answered, Date.now() % 100000, 4);
      if (ids.length === 0) return;
      setFocus(weakId);
      setSession({ mode: 'skill', skill: weakId, ids, index: 0, items: [], hint: false, show: false, done: false, order: orderFor(ids[0], Date.now()), numDraft: '', startSouls: save.souls, startCodex: save.codex.slice(), bonusXp: 0, shoutSlow: false, encounter: 'sub' });
    } else {
      const pool = ['est-rfi', 'str-rfi', 'bid-rfi2', 'est-rfi3'].filter((id) => qById(id));
      const ids = shuffle(pool, Date.now() % 100000).slice(0, Math.min(3, pool.length));
      if (ids.length === 0) return;
      setSession({ mode: 'skill', skill: 'est', ids, index: 0, items: [], hint: false, show: false, done: false, order: orderFor(ids[0], Date.now()), numDraft: '', startSouls: save.souls, startCodex: save.codex.slice(), bonusXp: 0, shoutSlow: false, encounter: 'rfi' });
    }
    setMentorMood(kind === 'sub' ? 'A traveling sub wants a number he can live with. Price it clean.' : 'A cursed RFI is circling the deadline. Clear the conflict before you guess.');
    setView('quiz'); arrive();
    openCurtain();
  }
  function buyCosmetic(id: string) {
    const item = shopItem(id);
    if (!item) return;
    const cosmetics = save.cosmetics || { owned: [] };
    const owned = cosmetics.owned || [];
    if (owned.indexOf(id) >= 0) {
      setSave({ ...save, cosmetics: { ...cosmetics, owned, [item.kind]: cosmetics[item.kind] === id ? undefined : id } });
      return;
    }
    if (save.souls < item.cost) return;
    setSave({ ...save, souls: save.souls - item.cost, cosmetics: { ...cosmetics, owned: owned.concat([id]), [item.kind]: id } });
    pushToast('soul', 'The merchant takes ' + item.cost + (item.cost === 1 ? ' soul' : ' souls') + '  ·  ' + item.name);
    sfx('soul');
  }
  function copyScroll() {
    const code = encodeScroll(save);
    const done = () => { setScrollCopied(true); window.setTimeout(() => setScrollCopied(false), 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done).catch(() => setImportDraft(code));
    } else setImportDraft(code);
  }
  function applyLoadedLedger(next: Save, notice: string) {
    setPersistGate(false);
    setLedgerNotice('');
    setBackupOffer(false);
    setSaveWarning('');
    setSave(next);
    if (next.activeTrial && next.activeTrial.session && !next.activeTrial.session.done) {
      setSession(next.activeTrial.session);
      if (next.activeTrial.focus) setFocus(next.activeTrial.focus);
      trialLockRef.current = false;
    } else {
      setSession(null);
      trialLockRef.current = false;
    }
    setLastSavedAt(next.lastSaved || new Date().toISOString());
    setSavedFlash(true);
    if (savedFlashTimer.current) window.clearTimeout(savedFlashTimer.current);
    savedFlashTimer.current = window.setTimeout(() => setSavedFlash(false), 2800);
    setImportNotice(notice);
  }
  function importScroll() {
    const next = decodeScroll(importDraft);
    if (!next) {
      setImportNotice('That scroll could not be read. The current ledger was not changed.');
      return;
    }
    applyLoadedLedger(next, 'The imported ledger was accepted and is now the live save.');
    setImportDraft('');
  }
  function restoreFromBackup() {
    const next = readBackupLedger();
    if (!next) {
      setImportNotice('No readable backup was found. The primary ledger was left untouched.');
      return;
    }
    // Intentionally do not wipe a damaged primary — only load the backup into the live session.
    applyLoadedLedger(next, 'Backup ledger restored into this session. The prior primary file was left untouched.');
    setMentorMood('The backup ledger is open. Export a Save Scroll when you can.');
  }
  function emailScroll() {
    const code = encodeScroll(save);
    const subject = encodeURIComponent('Construction Mastery — Save Scroll');
    const body = encodeURIComponent(
      'Your Construction Mastery Save Scroll is below.\n\n' +
      'To restore: open the game → Settings → paste this code into Import → Import this scroll.\n\n' +
      code + '\n'
    );
    const href = 'mailto:?subject=' + subject + '&body=' + body;
    try {
      const a = document.createElement('a');
      a.href = href;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setImportDraft(code);
      setImportNotice('Mail could not be opened. The save code was placed in the import box so you can copy it.');
    }
  }
  function toggleSound() {
    const nextOn = !(save.settings && save.settings.sound);
    if (nextOn && typeof window !== 'undefined' && window.AudioContext) {
      if (!audioRef.current) audioRef.current = new window.AudioContext();
      if (audioRef.current.state === 'suspended') audioRef.current.resume();
    }
    setSave({ ...save, settings: { ...(save.settings || { motion: 'auto', text: 'md' }), sound: nextOn } });
  }
  function spendPerk(skillId: SkillId, perkId: string) {
    const def = skillById(skillId);
    const idx = def.perks.findIndex((p) => p.id === perkId);
    if (idx < 0 || !perkAvailable(def, save, idx)) return;
    const rec = save.skills[skillId];
    setSave({ ...save, skills: { ...save.skills, [skillId]: { ...rec, perks: rec.perks.concat([perkId]) } } });
    pushToast('xp', 'Perk chosen  ·  ' + def.perks[idx].name);
  }
  function makeLegendary() {
    if (skillInfo(save.skills[focus].xp).level < 100) return;
    const cur = save.skills[focus];
    setSave({ ...save, skills: { ...save.skills, [focus]: { xp: xpForLevel(LEGENDARY_LEVEL), perks: [], legendary: cur.legendary + 1 } } });
    setLegendConfirm(false);
    pushToast('skill', skillById(focus).name + ' is now legendary');
  }
  function readTome() {
    const loreRead = save.loreRead.indexOf(tome.id) >= 0 ? save.loreRead : save.loreRead.concat([tome.id]);
    let dailyDone = markDaily('tome', save);
    let souls = save.souls;
    if (dailyDone.indexOf('weak') >= 0 && dailyDone.indexOf('drill') >= 0 && dailyDone.indexOf('tome') >= 0 && dailyDone.indexOf('all') < 0) {
      dailyDone = dailyDone.concat(['all']);
      souls += 1;
      pushToast('soul', 'Daily quests complete  ·  Dragon Soul absorbed');
    }
    setSave(grantTrophies({ ...save, loreRead, dailyDone, souls }));
  }
  function chapterOpen(i: number): boolean {
    if (i === 0) return true;
    return save.campaignDone.indexOf(CHAPTERS[i - 1].id + '-boss') >= 0;
  }
  function weakestSkillId(): SkillId {
    let best: SkillId = SKILL_IDS[0];
    let low = Infinity;
    for (const id of SKILL_IDS) {
      const lv = skillInfo(save.skills[id].xp).level;
      if (lv < low) { low = lv; best = id; }
    }
    return best;
  }
  function recommendedShort(): { label: string; go: () => void; detail: string } | null {
    const due = hauntDueList(save);
    if (due.length > 0) {
      const n = Math.min(3, due.length);
      return {
        label: 'Hunt ' + n + ' due haunt' + (n === 1 ? '' : 's'),
        go: () => startHaunted(n),
        detail: due.length + (due.length === 1 ? ' haunted question is' : ' haunted questions are') + ' due today  ·  a short haunt hunt first',
      };
    }
    const weak = weakestSkillId();
    const ids = pickQuiz(weak, save.answered, Date.now() % 100000, 3);
    if (ids.length > 0) {
      return {
        label: 'Quick 3  ·  ' + skillById(weak).name,
        go: () => startSkillQuiz(weak, 3),
        detail: 'Your weakest skill  ·  a 3-question trial on the recommended path',
      };
    }
    return null;
  }
  function nextBest(): { label: string; go: () => void; detail: string } {
    const short = recommendedShort();
    if (short) return short;
    const weakSorted = WEAK.slice().sort((a, b) => skillInfo(save.skills[a].xp).level - skillInfo(save.skills[b].xp).level);
    if (skillInfo(save.skills[weakSorted[0]].xp).level < 15) return { label: 'Train ' + skillById(weakSorted[0]).name, go: () => startSkillQuiz(weakSorted[0], 3), detail: 'Your weakest marked path  ·  a quick 3-question trial' };
    const openCh = CHAPTERS.find((c, i) => chapterOpen(i) && save.campaignDone.indexOf(c.id + '-boss') < 0) || CHAPTERS[CHAPTERS.length - 1];
    if (save.campaignDone.indexOf(openCh.id + '-boss') < 0) {
      if (save.campaignDone.indexOf(openCh.id + '-trial') < 0) return { label: 'Enter ' + openCh.name, go: () => startChapter(openCh, false), detail: openCh.region + '  ·  chapter trial' };
      return { label: 'Face ' + openCh.boss, go: () => startChapter(openCh, true), detail: openCh.name + '  ·  the boss awaits' };
    }
    let low: SkillId = EST_IDS[0];
    let lowLv = 999;
    for (const id of EST_IDS) {
      const lv = skillInfo(save.skills[id].xp).level;
      if (lv < lowLv) { lowLv = lv; low = id; }
    }
    if (lowLv < 20) return { label: 'Study ' + skillById(low).name, go: () => { setSkillTab('est'); startSkillQuiz(low, 3); }, detail: 'Estimating mastery  ·  a quick trial' };
    if (save.dailyDone.indexOf('tome') < 0) return { label: 'Inscribe today’s leaf', go: () => { readTome(); }, detail: tome.title };
    return { label: 'Walk the constellations', go: () => goView('skills'), detail: 'Choose any path and keep climbing' };
  }
  function runContinue() {
    if (openTrialPending()) { resumeTrial(); return; }
    nextBest().go();
  }
  function runQuick3() {
    if (blockIfOpen()) return;
    const short = recommendedShort();
    if (short) { short.go(); return; }
    startSkillQuiz(weakestSkillId(), 3);
  }
  useEffect(() => {
    function onKey(ev: Event) {
      const e = ev as unknown as { key: string; preventDefault: () => void; target?: { tagName?: string; isContentEditable?: boolean } };
      const tag = e.target && e.target.tagName;
      const typing = !!(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable));
      if (e.key === 'Escape' && !typing) {
        if (showCinema) { e.preventDefault(); closeCinema(); return; }
        if (levelModal) { e.preventDefault(); setLevelModal(false); return; }
        if (bossIntro) { e.preventDefault(); setBossIntro(null); return; }
        if ((view === 'quiz' || view === 'bid') && session && !session.done) { e.preventDefault(); goView('hall'); return; }
        if (view !== 'hall' && view !== 'title' && !showCinema) { e.preventDefault(); goView('hall'); return; }
        return;
      }
      if (view !== 'quiz' && view !== 'bid') return;
      if (!session || session.done) return;
      const qn = qById(session.ids[session.index]);
      if (typing && qn && qn.kind === 'num') {
        if (session.show && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nextQuestion(); }
        else if (!session.show && e.key === 'Enter') { e.preventDefault(); answerNum(); }
        return;
      }
      if (typing) return;
      if (session.show && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nextQuestion(); return; }
      if (session.show) return;
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 };
      if (map[e.key] !== undefined) { e.preventDefault(); answer(map[e.key]); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    if (!showCinema) return;
    if (motionReduced()) return;
    const t = window.setTimeout(() => {
      if (cinemaBeat + 1 >= CINEMA_BEATS.length) closeCinema();
      else setCinemaBeat((n) => n + 1);
    }, 4300);
    return () => window.clearTimeout(t);
  }, [showCinema, cinemaBeat]);
  useEffect(() => {
    const on = !!(save.settings && save.settings.sound);
    if (!on || !audioRef.current) {
      if (droneRef.current) {
        try { droneRef.current.osc.stop(); } catch { /* already stopped */ }
        droneRef.current = null;
      }
      return;
    }
    const ctx = audioRef.current;
    if (droneRef.current) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 58;
    gain.gain.value = 0.012;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    droneRef.current = { osc, gain };
    return () => {
      if (droneRef.current) {
        try { droneRef.current.osc.stop(); } catch { /* already stopped */ }
        droneRef.current = null;
      }
    };
  }, [save.settings]);
  const best = nextBest();
  const hauntN = hauntList(save).length;

  const parch: CSSProperties = { background: 'linear-gradient(180deg, #eadcba 0%, #d7c49a 48%, #c4af7e 100%)', color: C.parchInk, border: '1px solid var(--cm-gold-dim, ' + C.goldDim + ')', boxShadow: 'inset 0 0 0 1px #7a6230, inset 0 0 0 5px #b89d68, inset 0 0 48px #00000018, 0 10px 28px #00000066', padding: '22px 20px 20px', borderRadius: 2, overflowWrap: 'break-word', position: 'relative' };
  const stoneBox: CSSProperties = { background: 'linear-gradient(180deg, #2c281f 0%, #16130d 100%)', color: C.ink, border: '1px solid var(--cm-gold-dim, ' + C.goldDim + ')', boxShadow: 'inset 0 0 0 1px var(--cm-gold, ' + C.gold + '), inset 0 0 0 4px #0a0907, inset 0 0 40px #00000088, 0 10px 24px #00000055', padding: 20, borderRadius: 2, overflowWrap: 'break-word', position: 'relative' };
  const navBtn = (id: View, label: string) => (
    <button type="button" onClick={() => goView(id)} style={{ fontFamily: FONT_DISPLAY, background: view === id ? 'linear-gradient(180deg, #3a3224, #1b1813)' : 'transparent', color: view === id ? C.goldSoft : C.inkDim, border: '1px solid ' + (view === id ? C.gold : 'transparent'), borderBottom: '2px solid ' + (view === id ? C.gold : 'transparent'), letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, padding: '10px 12px', minHeight: 44, cursor: 'pointer', boxShadow: view === id ? 'inset 0 1px 0 #ffffff22' : undefined }}>{label}</button>
  );
  const quizQ = session ? qById(session.ids[session.index]) : undefined;
  const hidden = session && session.hint && quizQ ? [0, 1, 2, 3].filter((i) => i !== quizQ.a).slice(0, 2) : [];
  const daily = [
    { id: 'weak', title: 'Walk the weak path — ' + weakDef.name, detail: 'Complete a 5-question trial in ' + weakDef.name + ', one of your marked weak spots.', done: save.dailyDone.indexOf('weak') >= 0 },
    { id: 'drill', title: 'Five trials of the trades', detail: 'Complete any 5-question skill quiz. Short on purpose, so the knowledge can stick.', done: save.dailyDone.indexOf('drill') >= 0 },
    { id: 'tome', title: "Read today's leaf — " + tome.title, detail: tome.text, done: save.dailyDone.indexOf('tome') >= 0 },
  ];
  const last = session && session.items.length ? session.items[session.items.length - 1] : undefined;

  const retiredCss = '@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap"); .cm-root { font-family: ' + FONT_BODY + '; overflow-x: hidden; overflow-wrap: break-word; } .cm-root button { font-family: ' + FONT_DISPLAY + '; } .cm-noise { pointer-events: none; position: fixed; inset: 0; opacity: 0.07; z-index: 2; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27180%27 height=%27180%27 filter=%27url(%23n)%27 opacity=%270.9%27/%3E%3C/svg%3E"); } @media (max-width: 560px) { .cm-root { font-size: 15px; } .cm-nav button { letter-spacing: 0.06em !important; font-size: 11px !important; padding: 10px 8px !important; } } .cm-root button:focus-visible { outline: 2px solid ' + C.gold + '; outline-offset: 2px; } @keyframes cm-skillup { 0% { opacity: 0; transform: translateY(10px); } 18% { opacity: 1; transform: none; } 75% { opacity: 1; } 100% { opacity: 0; } } @keyframes cm-pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.28; } } @keyframes cm-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } } @keyframes cm-pop { 0% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -70px) scale(0.3); } } @keyframes cm-glowpulse { 0%,100% { box-shadow: none; } 40% { box-shadow: inset 0 0 80px #d4b46a44, 0 0 40px #d4b46a55; } } .cm-skillup { animation: cm-skillup 2.6s ease forwards; } .cm-pulse { animation: cm-pulse 2.2s ease-in-out infinite; } .cm-bar { transition: width 0.55s ease; } .cm-shake { animation: cm-shake 0.4s ease; } .cm-glow { animation: cm-glowpulse 0.5s ease; } .cm-bit { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: #e8d5a3; pointer-events: none; animation: cm-pop 0.8s ease forwards; z-index: 30; } @keyframes cm-twinkle { 0%,100% { opacity: 0.18; } 50% { opacity: 0.9; } } @keyframes cm-draw { from { stroke-dashoffset: 90; } to { stroke-dashoffset: 0; } } .cm-twinkle { animation: cm-twinkle 3.1s ease-in-out infinite; } .cm-draw { stroke-dasharray: 90; animation: cm-draw 0.95s ease-out forwards; } @media (prefers-reduced-motion: reduce) { .cm-skillup, .cm-pulse, .cm-shake, .cm-bit, .cm-glow, .cm-twinkle, .cm-draw { animation: none !important; } .cm-bar { transition: none !important; } } .cm-reduce .cm-skillup, .cm-reduce .cm-pulse, .cm-reduce .cm-shake, .cm-reduce .cm-bit, .cm-reduce .cm-glow, .cm-reduce .cm-twinkle, .cm-reduce .cm-draw { animation: none !important; } .cm-reduce .cm-bar { transition: none !important; } @keyframes cm-snow { 0% { transform: translateY(-12px); opacity: 0; } 12% { opacity: 0.7; } 100% { transform: translateY(110vh); opacity: 0; } } @keyframes cm-flicker { 0%,100% { opacity: 0.4; } 40% { opacity: 0.82; } 72% { opacity: 0.32; } } @keyframes cm-aurora { 0%,100% { opacity: 0.2; transform: translateX(0); } 50% { opacity: 0.46; transform: translateX(10px); } } @keyframes cm-discover { 0% { opacity: 0; letter-spacing: 0.42em; } 14% { opacity: 1; letter-spacing: 0.18em; } 78% { opacity: 1; } 100% { opacity: 0; } } @keyframes cm-cinema { from { opacity: 0; } to { opacity: 1; } } @keyframes cm-slowveil { 0%,100% { opacity: 0.08; } 50% { opacity: 0.18; } } .cm-snow { position: fixed; top: -8px; border-radius: 50%; background: #e8f0ff; pointer-events: none; z-index: 3; animation: cm-snow linear infinite; } .cm-flicker { animation: cm-flicker 2.8s ease-in-out infinite; } .cm-aurora { animation: cm-aurora 7s ease-in-out infinite; } .cm-discover { animation: cm-discover 4.1s ease forwards; } .cm-cinema-line { animation: cm-cinema 0.9s ease both; } .cm-slowveil { animation: cm-slowveil 2.4s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .cm-snow, .cm-flicker, .cm-aurora, .cm-discover, .cm-cinema-line, .cm-slowveil { animation: none !important; } } .cm-reduce .cm-snow, .cm-reduce .cm-flicker, .cm-reduce .cm-aurora, .cm-reduce .cm-discover, .cm-reduce .cm-cinema-line, .cm-reduce .cm-slowveil { animation: none !important; }';
  const css = HALL_CSS || retiredCss;
    const preferReduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reduceMotion = !!(save.settings && (save.settings.motion === 'reduce' || (save.settings.motion !== 'full' && preferReduce)));
  const textPx = save.settings && save.settings.text === 'sm' ? 15 : save.settings && save.settings.text === 'lg' ? 19 : 17;
  const accent = themeAccent(save);
  const shell: CSSProperties = { minHeight: '100%', background: shellBackground(save), color: C.ink, fontFamily: FONT_BODY, fontSize: textPx, lineHeight: 1.6, position: 'relative', ...({ '--cm-gold': accent.gold, '--cm-gold-soft': accent.goldSoft, '--cm-gold-dim': accent.goldDim, '--cm-glow': accent.glow } as CSSProperties) };
  const wornTitle = equippedTitle(save);
  const encOpen = (save.sideDone || []).indexOf(encKey()) < 0;
  const encKind = todayEncounter();
  const phase = dayPhase();
  const showAurora = (phase === 'night' || (save.cosmetics && save.cosmetics.theme === 'theme-aurora') || view === 'campaign');
  const mentorText = mentorMood || (view === 'hall' ? 'The hall is open, estimator. Walk a weak path, or spend a soul at the merchant if you have one to spare.' : view === 'quests' ? 'Daily work first. A traveling encounter may appear beside the standing challenges.' : view === 'shop' ? 'Souls buy ceremony, not answers. Titles and themes are vanity — and vanity has its place.' : '');
  const flakeLeft = [8, 22, 36, 50, 64, 78, 88, 14];
  if (!ready) {
    return (
      <div className={'cm-root' + (reduceMotion ? ' cm-reduce' : '')} style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <style>{css}</style>
        <div className="cm-noise" aria-hidden="true" />
        <div style={{ ...stoneBox, maxWidth: 440, textAlign: 'center' }}>
          <Corners />
          <div className="cm-load-seal" style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><Seal rank={rank} level={ch.level} /></div>
          <div style={{ color: 'var(--cm-gold-dim, ' + C.goldDim + ')', letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: 12, fontFamily: FONT_DISPLAY }}>The ledger is opening</div>
          <GoldRule />
          <p style={{ color: C.inkDim, margin: 0 }}>Waiting for a lasting store so earlier progress is not overwritten.</p>
        </div>
      </div>
    );
  }
  if (showCinema) {
    const beat = CINEMA_BEATS[Math.min(cinemaBeat, CINEMA_BEATS.length - 1)];
    return (
      <div className={'cm-root' + (reduceMotion ? ' cm-reduce' : '')} style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <style>{css}</style>
        <div className="cm-noise" aria-hidden="true" />
        {isWinterMonth() && !reduceMotion ? flakeLeft.map((left, i) => <span key={i} className="cm-snow" aria-hidden="true" style={{ left: left + '%', width: 3 + (i % 3), height: 3 + (i % 3), animationDuration: 8 + (i % 6) + 's', animationDelay: (i * 0.45) + 's' }} />) : null}
        <div style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ color: C.goldDim, letterSpacing: '0.32em', textTransform: 'uppercase', fontSize: 11, fontFamily: FONT_DISPLAY }} className="cm-cinema-line">{beat.kicker}</div>
          <GoldRule />
          <p className="cm-cinema-line" style={{ margin: '0 auto', maxWidth: 520, color: C.goldSoft, fontSize: 22, lineHeight: 1.45, fontFamily: FONT_DISPLAY, textShadow: '0 0 18px ' + C.gold + '66' }}>{beat.line}</p>
          <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {cinemaBeat + 1 < CINEMA_BEATS.length ? <Btn label="Continue" kind="gold" onClick={() => setCinemaBeat((n) => n + 1)} /> : <Btn label="Enter the hall" kind="gold" onClick={closeCinema} />}
            <Btn label="Skip" onClick={closeCinema} />
          </div>
          <div style={{ marginTop: 16, color: C.inkMute, fontSize: 12 }}>{cinemaBeat + 1} of {CINEMA_BEATS.length}</div>
        </div>
      </div>
    );
  }
  if (view === 'title') {
    return (
      <div className={'cm-root' + (reduceMotion ? ' cm-reduce' : '')} style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <style>{css}</style>
        <div className="cm-noise" aria-hidden="true" />
        <div style={{ maxWidth: 520, width: '100%' }}>
          <div style={{ color: C.goldDim, letterSpacing: '0.4em', fontSize: 11, fontFamily: FONT_DECO }}>ᚠ  ᚢ  ᚴ  ᚷ  ᛚ</div>
          <h1 style={{ ...headingStyle(theme, 32, C.goldSoft), marginTop: 14, fontFamily: FONT_DECO, letterSpacing: '0.12em', textShadow: '0 0 24px ' + C.gold + '88' }}>Construction Mastery</h1>
          <p style={{ margin: '8px 0 0', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.inkDim, fontSize: 13 }}>The Estimator’s Quest</p>
          <GoldRule />
          <div style={{ ...stoneBox, textAlign: 'left', marginTop: 8 }}>
            <Corners />
            <div style={headingStyle(theme, 12, C.goldDim)}>Continue  ·  save slot I</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <Seal rank={rank} level={ch.level} />
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Jameson Golding</div>
                <div style={{ color: C.inkDim, fontSize: 14, margin: '4px 0 8px' }}>{wornTitle || rank.title}  ·  Level {ch.level}  ·  Dawn {save.loginStreak}</div>
                <Meter value={ch.into} max={ch.need} label={ch.into + ' / ' + ch.need + ' to the next level'} />
                <div style={{ color: savedFlash ? C.goldSoft : (saveWarning ? C.emberSoft : C.inkMute), fontSize: 12, marginTop: 8 }}>{savedFlash ? 'Saved just now' : (lastSavedAt ? 'Last saved  ·  ' + formatLastSaved(lastSavedAt) : 'Not yet saved to a lasting ledger')}</div>
                {savedFlash && lastSavedAt ? <div style={{ color: C.inkMute, fontSize: 11, marginTop: 4 }}>Last saved  ·  {formatLastSaved(lastSavedAt)}</div> : null}
                {saveWarning ? <div style={{ color: C.emberSoft, fontSize: 12, marginTop: 6 }}>{saveWarning}</div> : null}
                {backupOffer ? <div style={{ marginTop: 8 }}><Btn label="Restore from backup" kind="gold" onClick={restoreFromBackup} /></div> : null}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <Btn label={openTrialPending() ? 'Resume trial' : 'Continue  ·  ' + best.label} kind="gold" wide onClick={runContinue} />
            {!openTrialPending() ? <Btn label="Quick 3" kind="gold" wide onClick={runQuick3} /> : null}
            <div style={{ color: C.inkMute, fontSize: 13 }}>{openTrialPending() ? 'An unfinished trial is waiting — Continue resumes it.' : best.detail}</div>
            <Btn label="Enter the hall" onClick={() => goView('hall')} />
            <Btn label="Open the campaign" kind="quiet" onClick={() => goView('campaign')} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={'cm-root' + (shake ? ' cm-shake' : '') + (glow ? ' cm-glow' : '') + (reduceMotion ? ' cm-reduce' : '')} style={shell}>
      <style>{css}</style>
      <div className="cm-noise" aria-hidden="true" />
      {isWinterMonth() && !reduceMotion ? flakeLeft.map((left, i) => <span key={'snow-' + i} className="cm-snow" aria-hidden="true" style={{ left: left + '%', width: 3 + (i % 3), height: 3 + (i % 3), animationDuration: 8 + (i % 6) + 's', animationDelay: (i * 0.45) + 's' }} />) : null}
      {showAurora ? <div className="cm-aurora" aria-hidden="true" style={{ pointerEvents: 'none', position: 'fixed', left: 0, right: 0, top: 0, height: 180, zIndex: 2, background: 'linear-gradient(180deg, #5bd0c844 0%, #7a5cff22 42%, transparent 100%)', opacity: reduceMotion ? 0.28 : undefined }} /> : null}
      <div className={reduceMotion ? undefined : 'cm-flicker'} aria-hidden="true" style={{ pointerEvents: 'none', position: 'fixed', left: 0, bottom: 0, width: 220, height: 180, zIndex: 2, background: 'radial-gradient(ellipse at 20% 90%, #d4893a66 0%, transparent 70%)', opacity: reduceMotion ? 0.35 : undefined }} />
      {session && session.shoutSlow && !session.show ? <div className="cm-slowveil" aria-hidden="true" style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 4, background: 'radial-gradient(ellipse at 50% 40%, #9ad4ff22 0%, #00000033 100%)' }} /> : null}
      {discoverBanner ? <div role="status" className="cm-discover" style={{ position: 'fixed', left: 0, right: 0, top: '22%', zIndex: 45, textAlign: 'center', pointerEvents: 'none', color: C.goldSoft, fontFamily: FONT_DISPLAY, fontSize: 28, letterSpacing: '0.18em', textTransform: 'uppercase', textShadow: '0 0 22px ' + C.gold + '99, 0 2px 10px #000' }}>{discoverBanner}</div> : null}
      {trialCurtain ? (
        <div role="dialog" aria-label="Preparing the trial" onClick={() => setTrialCurtain('')} style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#07080ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}>
          <div style={{ ...parch, maxWidth: 520, width: '100%', textAlign: 'center' }}>
            <div style={{ color: C.goldDim, letterSpacing: '0.22em', textTransform: 'uppercase', fontSize: 12 }}>A leaf from the hall</div>
            <GoldRule />
            <p style={{ margin: 0, color: C.parchInk, fontSize: 18 }}>{trialCurtain}</p>
            <div style={{ marginTop: 14, color: C.parchMute, fontSize: 13 }}>Tap to enter the trial</div>
          </div>
        </div>
      ) : null}
      {bits.map((b) => <span key={b.id} className="cm-bit" style={{ left: b.x + '%', top: b.y + '%', boxShadow: '0 0 8px ' + C.gold }} />)}
      {toasts.length > 0 ? (
        <div style={{ position: 'fixed', left: 0, right: 0, top: '18%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, pointerEvents: 'none', zIndex: 40, padding: '0 16px' }}>
          {toasts.map((t) => (
            <div key={t.id} className="cm-skillup" style={{ color: t.kind === 'soul' || t.kind === 'rank' || t.kind === 'achieve' ? C.goldSoft : C.ink, fontSize: t.kind === 'skill' || t.kind === 'rank' || t.kind === 'achieve' ? 28 : 18, letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center', textShadow: '0 0 18px ' + C.gold + '99, 0 2px 8px ' + C.void, fontWeight: 600 }}>{t.text}</div>
          ))}
        </div>
      ) : null}
      {levelModal ? (
        <div role="dialog" aria-label="Level up" style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 38%, #d4af3755 0%, #000000f0 72%)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="cm-level-in" style={{ ...parch, maxWidth: 560, width: '100%', textAlign: 'center' }}>
            <Corners />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Seal rank={rank} level={ch.level} /></div>
            <p style={headingStyle(theme, 13, C.goldDim)}>The guild recognizes you</p>
            <GoldRule />
            <h2 style={{ ...headingStyle(theme, 32, C.parchInk), letterSpacing: '0.14em', fontFamily: FONT_DECO, textAlign: 'center', textShadow: '0 0 18px ' + C.gold + '55' }}>Level Up</h2>
            <p style={{ ...headingStyle(theme, 13, C.goldDim), textAlign: 'center', marginTop: 6 }}>Choose a Perk</p>
            <p style={{ margin: '8px 0 0', color: C.parchMute }}>You are now Level {ch.level}, {rank.title}. You have {perkPts} perk {perkPts === 1 ? 'point' : 'points'}. {anyPerkAvailable(save) ? 'A star in a constellation is ready. Choose a perk, or later from any skill tree.' : 'Your perk points await. Raise a skill to 20 to open its first star.'}</p>
            {anyPerkAvailable(save) ? (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ALL_SKILLS.map((def) => def.perks.map((perk, i) => perkAvailable(def, save, i) ? (
                  <button type="button" key={perk.id} onClick={() => spendPerk(def.id, perk.id)} style={{ textAlign: 'left', background: C.parch, border: '1px solid ' + C.goldDim, padding: 10, cursor: 'pointer', color: C.parchInk, font: 'inherit' }}>
                    <div style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13 }}>{def.name} · {perk.name}</div>
                    <div style={{ color: C.parchMute, fontSize: 14, marginTop: 4 }}>{perk.concept}</div>
                  </button>
                ) : null))}
              </div>
            ) : null}
            <div style={{ marginTop: 16 }}><Btn label="Close the tome" kind="gold" onClick={() => setLevelModal(false)} /></div>
          </div>
        </div>
      ) : null}
      {bossIntro ? (
        <div role="dialog" aria-label="Boss encounter" style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, #4a1c16cc 0%, #000000ee 70%)', zIndex: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ ...stoneBox, maxWidth: 560, width: '100%', textAlign: 'center', borderColor: C.danger, boxShadow: '0 0 40px #7a2b2b88, inset 0 0 0 3px #0a0907' }}>
            <div style={{ color: C.emberSoft, letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: 12, fontFamily: FONT_DISPLAY }}>A legendary foe approaches</div>
            <GoldRule />
            <h2 style={{ ...headingStyle(theme, 28, C.goldSoft), fontFamily: FONT_DECO, textShadow: '0 0 22px ' + C.ember + '99' }}>{bossIntro.boss}</h2>
            <p style={{ color: C.inkDim, margin: '10px 0 0' }}>{bossIntro.name}  ·  {bossIntro.region}</p>
            <p style={{ color: C.inkMute }}>{bossIntro.blurb}</p>
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <Btn label={'Face ' + bossIntro.boss} kind="danger" onClick={() => commitBoss(bossIntro)} />
              <Btn label="Withdraw" onClick={() => setBossIntro(null)} />
            </div>
          </div>
        </div>
      ) : null}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 18px 80px' }}>
        <header style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ color: C.goldDim, letterSpacing: '0.4em', fontSize: 11 }}>ᚠ  ᚢ  ᚴ  ᚷ  ᛚ</div>
          <h1 id="cm-main-heading" tabIndex={-1} className="cm-main-heading" style={{ ...headingStyle(theme, 24, C.goldSoft), marginTop: 8, fontFamily: FONT_DECO, textShadow: '0 0 18px var(--cm-glow, ' + C.gold + '66)' }}>Construction Mastery</h1>
          <p style={{ margin: '6px 0 0', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.inkDim, fontSize: 12 }}>The Estimator’s Quest</p>
          <GoldRule />
          <p style={{ margin: 0, color: C.inkDim, fontSize: 14 }}>Jameson Golding · City Creek Construction · Bountiful, UT</p>
          {wornTitle ? <p style={{ margin: '6px 0 0', color: C.goldSoft, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12 }}>{wornTitle}</p> : null}
          <p style={{ margin: '6px 0 0', color: savedFlash ? C.goldSoft : (saveWarning ? C.emberSoft : C.inkMute), fontSize: 12 }}>{savedFlash ? 'Saved just now' : (lastSavedAt ? 'Last saved  ·  ' + formatLastSaved(lastSavedAt) : 'Not yet saved to a lasting ledger')}</p>
          {savedFlash && lastSavedAt ? <p style={{ margin: '2px 0 0', color: C.inkMute, fontSize: 11 }}>Last saved  ·  {formatLastSaved(lastSavedAt)}</p> : null}
        </header>
        {save.cosmetics && save.cosmetics.banner === 'banner-dragon' ? <div aria-hidden="true" style={{ height: 8, margin: '-8px 0 16px', background: 'linear-gradient(90deg, transparent, #7a2b2b, ' + C.gold + ', #7a2b2b, transparent)' }} /> : null}
        {save.cosmetics && save.cosmetics.banner === 'banner-gold' ? <div aria-hidden="true" style={{ height: 8, margin: '-8px 0 16px', background: 'linear-gradient(90deg, transparent, ' + C.goldDim + ', ' + C.goldSoft + ', ' + C.goldDim + ', transparent)' }} /> : null}
        <div className="cm-nav" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 20, padding: 6, background: 'linear-gradient(180deg, #241f18, #120e0a)', border: '1px solid ' + C.goldDim, boxShadow: 'inset 0 0 0 3px #0a0907' }}>
          {navBtn('hall', 'Hall')}
          {navBtn('campaign', 'Campaign')}
          {navBtn('skills', 'Constellations')}
          {navBtn('sheet', 'Hero')}
          {navBtn('quests', 'Quest Log')}
          {navBtn('codex', 'Codex')}
          {navBtn('trophies', 'Trophies')}
          {hauntN > 0 ? navBtn('haunt', 'Haunted') : null}
          {navBtn('shop', 'Merchant')}
          {navBtn('settings', 'Settings')}
          <button type="button" onClick={() => { if (openTrialPending() && !(session && session.mode === 'bid')) { setMentorMood('A trial is already underway. Resume it, or abandon it before opening Bid Day.'); return; } goView('bid'); }} style={{ font: 'inherit', background: view === 'bid' ? '#5c1818' : 'transparent', color: C.goldSoft, border: '1px solid ' + C.danger, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12, padding: '10px 12px', minHeight: 44, cursor: 'pointer' }}>Bid Day</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 22, ...stoneBox }}>
          <Seal rank={rank} level={ch.level} />
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div style={{ ...headingStyle(theme, 13, C.gold), marginBottom: 4 }}>{rank.title}</div>
            <div style={{ color: C.inkDim, fontSize: 13, marginBottom: 8 }}>{rank.blurb}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Meter value={ch.into} max={Math.max(1, ch.need)} color={C.health} label={'Vitality  ·  Level ' + ch.level + '  ·  ' + ch.into + ' / ' + (ch.level >= 100 ? 'max' : ch.need) + (upcoming ? '  ·  next rank ' + upcoming.title + ' at ' + upcoming.min : '')} />
              <Meter value={Math.min(save.streak, 12)} max={12} color={C.stamina} label={'Combo  ·  ×' + save.streak + '  (best ' + save.bestStreak + ')'} />
              <Meter value={Math.min(save.souls, 8)} max={8} color={C.magicka} label={'Dragon Souls  ·  ' + save.souls + '  ·  Perk points ' + perkPts + '  ·  Dawn ' + save.loginStreak} />
            </div>
          </div>
        </div>
        {saveWarning ? <div role="status" style={{ ...stoneBox, marginBottom: 16, borderColor: C.danger }}><div style={headingStyle(theme, 13, C.goldSoft)}>Saving warning</div><p style={{ margin: '8px 0 0', color: C.inkDim }}>{saveWarning}</p><div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>{backupOffer ? <Btn label="Restore from backup" kind="gold" onClick={restoreFromBackup} /> : null}<Btn label="Open Settings for a Save Scroll" kind={backupOffer ? 'stone' : 'gold'} onClick={() => goView('settings')} /></div></div> : null}
        {savedFlash ? <div role="status" style={{ ...stoneBox, marginBottom: 16, borderColor: C.success }}><div style={headingStyle(theme, 13, C.goldSoft)}>Saved just now</div><p style={{ margin: '8px 0 0', color: C.inkDim }}>{lastSavedAt ? 'Last saved  ·  ' + formatLastSaved(lastSavedAt) : 'The ledger was written.'}</p></div> : null}
        {ledgerNotice && ledgerNotice !== saveWarning ? <div role="status" style={{ ...stoneBox, marginBottom: 16, borderColor: C.gold }}><div style={headingStyle(theme, 13, C.goldSoft)}>Ledger notice</div><p style={{ margin: '8px 0 0', color: C.inkDim }}>{ledgerNotice}</p></div> : null}
        {openTrialPending() && view !== 'quiz' && view !== 'bid' && view !== 'hall' ? (
          <div style={{ ...stoneBox, marginBottom: 16, borderColor: C.gold, boxShadow: '0 0 18px ' + C.gold + '33' }}>
            <div style={headingStyle(theme, 13, C.gold)}>Resume trial</div>
            <GoldRule />
            <p style={{ margin: '0 0 12px', color: C.inkDim }}>An unfinished trial is waiting — question {(save.activeTrial && save.activeTrial.session.index + 1) || (session ? session.index + 1 : 1)} of {(save.activeTrial && save.activeTrial.session.ids.length) || (session ? session.ids.length : 0)}. Leaving the hall does not have to start it over.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Btn label="Resume trial" kind="gold" onClick={resumeTrial} />
              <Btn label="Abandon trial" kind="danger" onClick={abandonTrial} />
            </div>
          </div>
        ) : null}
        {mentorText ? (
          <div style={{ ...parch, marginBottom: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div aria-hidden="true" style={{ width: 52, height: 52, flexShrink: 0, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #6a5a3a, #2a2216)', border: '2px solid ' + C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.goldSoft, fontFamily: FONT_DECO, fontSize: 22 }}>H</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: C.goldDim, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12 }}>Haldor Ironline  ·  Master Builder</div>
              <p style={{ margin: '6px 0 0' }}>{mentorText}</p>
            </div>
          </div>
        ) : null}
        {!save.introSeen ? (
          <div style={{ ...parch, marginBottom: 22 }}>
            <div style={headingStyle(theme, 13, C.goldDim)}>Journal of prior trials</div>
            <GoldRule />
            <p style={{ margin: 0 }}>Your earlier studies have been inscribed in the ledger. General knowledge, 4 of 7: you knew the 28-day f’c test, Division 08 Openings, the 1:12 accessible ramp, and the 8x8x16 CMU. You missed the actual 2x4 size, EMT, and DWV, and you passed over Type X drywall.</p>
            <p style={{ margin: '10px 0 0' }}>Fire Suppression: 4 of 4. Plumbing: 4 of 4, including DWV once it returned. Those victories granted experience and two Dragon Souls. Weak paths remain in Wood framing, Electrical, and Finishes — suggested quests in your log.</p>
            <div style={{ marginTop: 14 }}><Btn label="I have read the ledger" kind="gold" onClick={() => setSave((s) => ({ ...s, introSeen: true }))} /></div>
          </div>
        ) : null}
        <div key={view} className={reduceMotion ? undefined : 'cm-view'}>
        {view === 'hall' ? (
          <div>
            <div style={{ ...stoneBox, marginBottom: 18, boxShadow: '0 0 22px var(--cm-glow, ' + C.gold + '33)' }}>
              <Corners />
              <div style={headingStyle(theme, 13, C.gold)}>Continue</div>
              <GoldRule />
              <p style={{ margin: '0 0 12px', color: C.inkDim }}>{openTrialPending() ? 'An unfinished trial is waiting — pick up the ledger where you left it.' : best.detail}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Btn label={openTrialPending() ? 'Resume trial' : 'Continue  ·  ' + best.label} kind="gold" onClick={runContinue} />
                {!openTrialPending() ? <Btn label="Quick 3" kind="gold" onClick={runQuick3} /> : null}
                {openTrialPending() ? <Btn label="Abandon trial" kind="danger" onClick={abandonTrial} /> : null}
              </div>
              {!openTrialPending() ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {hauntN > 0 ? <Btn label={'Haunted ledger  ·  ' + hauntN} onClick={() => goView('haunt')} /> : null}
                  <Btn label="Open the campaign" onClick={() => goView('campaign')} />
                  <Btn label="Full 5-question trial" kind="quiet" onClick={() => startSkillQuiz(weakestSkillId())} />
                </div>
              ) : null}
            </div>
            {encOpen ? (
              <div style={{ ...stoneBox, marginBottom: 18, borderColor: encKind === 'rfi' ? C.danger : C.goldDim }}>
                <div style={headingStyle(theme, 13, encKind === 'rfi' ? C.goldSoft : C.gold)}>{encKind === 'sub' ? 'A traveling sub at the door' : 'A cursed RFI on the wind'}</div>
                <GoldRule />
                <p style={{ margin: '0 0 12px', color: C.inkDim }}>{encKind === 'sub' ? 'A subcontractor wants a number he can live with in ' + weakDef.name + '. Four short trials. Clear three and he pays a Dragon Soul.' : 'A drawing conflict is circling the deadline. Three RFI questions. Clear them and the curse lifts — a Dragon Soul is yours.'}</p>
                <Btn label={encKind === 'sub' ? 'Level the traveling bid' : 'Face the cursed RFI'} kind={encKind === 'rfi' ? 'danger' : 'gold'} onClick={() => startEncounter(encKind)} />
              </div>
            ) : null}
            <div style={{ ...parch, marginBottom: 18 }}>
              <div style={headingStyle(theme, 13, C.goldDim)}>Today’s leaf of the tome</div>
              <GoldRule />
              <h2 style={{ ...headingStyle(theme, 16, C.parchInk), marginBottom: 8 }}>{tome.title}</h2>
              <p style={{ margin: 0 }}>{tome.text}</p>
              <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Btn label={save.dailyDone.indexOf('tome') >= 0 ? 'Leaf already read' : 'Inscribe this leaf'} kind="gold" disabled={save.dailyDone.indexOf('tome') >= 0} onClick={readTome} />
                <Btn label={'Trial of ' + skillById(tome.skill).name} onClick={() => startSkillQuiz(tome.skill)} />
              </div>
            </div>
            <div style={{ ...stoneBox, marginBottom: 18 }}>
              <div style={headingStyle(theme, 13, C.gold)}>Suggested quests · weak spots</div>
              <GoldRule />
              {WEAK.map((id) => {
                const d = skillById(id);
                const lv = skillInfo(save.skills[id].xp);
                return (
                  <div key={id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ color: C.goldSoft }}>{d.name} · {d.csi}</div>
                      <div style={{ color: C.inkMute, fontSize: 13 }}>{id === 'wood' ? 'A 2x4 is 1-1/2 x 3-1/2, not 2 x 4. Start here.' : id === 'elec' ? 'EMT is Electrical Metallic Tubing, not a transformer.' : 'Type X is fire-rated gypsum — the board that stands in the fire.'}</div>
                      <Meter value={lv.into} max={lv.need} label={'Level ' + lv.level} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <Btn label="Quick 3" kind="gold" onClick={() => startSkillQuiz(id, 3)} />
                      <Btn label="Begin 5 trials" onClick={() => startSkillQuiz(id)} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Btn label="Open the constellations" onClick={() => goView('skills')} />
              <Btn label="Quest log" onClick={() => goView('quests')} />
              <Btn label="Face Bid Day" kind="danger" onClick={startBid} />
            </div>
          </div>
        ) : null}
        {view === 'skills' ? (
          <div>
            <p style={{ color: C.inkDim, marginTop: 0 }}>Fourteen trade constellations and nine of Estimating Mastery. Skills rise from 1 to 100. Character level rises as skills increase. A perk star opens at skill 20, 40, 60, 80, and 100, and costs a perk point earned from character levels.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <Btn label="Trades" kind={skillTab === 'trade' ? 'gold' : 'quiet'} onClick={() => setSkillTab('trade')} />
              <Btn label="Estimating Mastery" kind={skillTab === 'est' ? 'gold' : 'quiet'} onClick={() => setSkillTab('est')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
              {(skillTab === 'trade' ? SKILLS : EST_SKILLS).map((def) => {
                const rec = save.skills[def.id];
                const lv = skillInfo(rec.xp);
                const isWeak = WEAK.indexOf(def.id) >= 0 && lv.level < 15;
                return (
                  <button type="button" key={def.id} onClick={() => { setFocus(def.id); goView('skill'); }} style={{ textAlign: 'left', background: C.sky, border: '1px solid ' + (isWeak ? C.gold : C.goldDim), padding: 10, cursor: 'pointer', color: C.ink, font: 'inherit', boxShadow: isWeak ? '0 0 12px ' + C.gold + '33' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, color: C.goldSoft, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SkillEmblem id={def.id} size={28} />{def.rune}  {def.name}</span><span>{def.csi}</span></div>
                    <Constellation def={def} rec={rec} save={save} onPerk={() => undefined} compact />
                    <Meter value={lv.into} max={lv.need} label={'Level ' + lv.level + '  ·  ' + rec.perks.length + '/5 perks' + (rec.legendary ? '  ·  Legendary ' + rec.legendary : '') + (isWeak ? '  ·  Weak path' : '')} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {view === 'skill' ? (
          <div>
            <Btn label="Back to the sky" kind="quiet" onClick={() => goView('skills')} />
            <div style={{ ...stoneBox, marginTop: 12, background: C.sky }}>
              <div style={headingStyle(theme, 12, C.gold)}>{focusDef.rune}  {focusDef.name}  ·  Division {focusDef.csi}</div>
              <Constellation def={focusDef} rec={focusRec} save={save} onPerk={(id) => spendPerk(focus, id)} />
              <Meter value={focusLv.into} max={focusLv.need} label={'Level ' + focusLv.level + ' / 100  ·  ' + focusLv.into + ' / ' + focusLv.need + ' experience'} />
            </div>
            <div style={{ ...parch, marginTop: 14 }}>
              <div style={headingStyle(theme, 13, C.goldDim)}>Lore of the trade</div>
              <GoldRule />
              <p style={{ margin: 0 }}>{focusDef.lore}</p>
            </div>
            <div style={{ ...stoneBox, marginTop: 14 }}>
              <div style={headingStyle(theme, 13, C.gold)}>Perk stars</div>
              <GoldRule />
              {focusDef.perks.map((perk, i) => {
                const owned = focusRec.perks.indexOf(perk.id) >= 0;
                const open = perkAvailable(focusDef, save, i);
                return (
                  <div key={perk.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid ' + C.line }}>
                    <div style={{ color: owned ? C.goldSoft : C.ink, letterSpacing: '0.06em' }}>{owned ? 'Mastered' : open ? 'Ready' : 'Sealed until ' + perk.level}  ·  {perk.name}</div>
                    <div style={{ color: C.inkDim, fontSize: 14, marginTop: 4 }}>{perk.concept}</div>
                    {open ? <div style={{ marginTop: 8 }}><Btn label={'Spend a perk point  ·  ' + perkPts + ' left'} kind="gold" onClick={() => spendPerk(focus, perk.id)} /></div> : null}
                  </div>
                );
              })}
              {focusLv.level >= 100 ? (
                <div>
                  <p style={{ color: C.inkDim }}>This constellation is complete. Making it legendary returns its perk points, sets the skill to 15, and lets you climb again. Your character level stays.</p>
                  {legendConfirm ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <Btn label="Confirm legendary reset" kind="danger" onClick={makeLegendary} />
                      <Btn label="Hold" onClick={() => setLegendConfirm(false)} />
                    </div>
                  ) : <Btn label="Make legendary" kind="danger" onClick={() => setLegendConfirm(true)} />}
                </div>
              ) : null}
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Btn label="Begin 5 trials" kind="gold" onClick={() => startSkillQuiz(focus)} />
              <Btn label="Quick 3  ·  a short session" onClick={() => startSkillQuiz(focus, 3)} />
            </div>
          </div>
        ) : null}
        {view === 'sheet' ? (
          <div>
            <div style={{ ...stoneBox, display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
              <svg viewBox="0 0 120 140" width="120" height="140" aria-hidden="true">
                <ellipse cx="60" cy="128" rx="38" ry="8" fill="#00000055" />
                <rect x="34" y="80" width="52" height="44" rx="8" fill="#2a2418" stroke={rank.metal} strokeWidth="2" />
                <circle cx="60" cy="54" r="26" fill="#3a3226" stroke={rank.metal} strokeWidth="2" />
                <path d="M28 52 Q60 16 92 52" fill="#1c1810" stroke={rank.metal} strokeWidth="2" />
                <rect x="24" y="50" width="72" height="8" rx="2" fill={rank.metal} />
                <text x="60" y="118" textAnchor="middle" fill={rank.metal} fontSize="9">{rank.rune}</text>
              </svg>
              <div style={{ flex: '1 1 240px' }}>
                <div style={headingStyle(theme, 12, C.goldDim)}>Character sheet</div>
                <h2 style={{ ...headingStyle(theme, 22, C.goldSoft), margin: '6px 0 0' }}>Jameson Golding</h2>
                <p style={{ margin: '6px 0 0', color: C.inkDim }}>{wornTitle || rank.title}  ·  Level {ch.level}  ·  City Creek Construction</p>
                <p style={{ margin: '6px 0 10px', color: C.inkMute, fontSize: 14 }}>{rank.blurb}</p>
                <Meter value={ch.into} max={ch.need} label={'Experience  ·  ' + ch.into + ' / ' + ch.need} />
                {upcoming ? <div style={{ color: C.inkMute, fontSize: 13, marginTop: 8 }}>Next rank  ·  {upcoming.title} at level {upcoming.min}  ({Math.max(0, upcoming.min - ch.level)} levels hence)</div> : <div style={{ color: C.goldSoft, fontSize: 13, marginTop: 8 }}>Highest rank  ·  Dragonborn of Bids</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12, color: C.inkDim, fontSize: 14 }}>
                  <span>Dawn streak  {save.loginStreak}</span>
                  <span>Trophies  {save.achievements.length}/{TROPHIES.length}</span>
                  <span>Codex  {save.codex.length}</span>
                  <span>Dragon Souls  {save.souls}</span>
                </div>
                <p style={{ margin: '10px 0 0', color: C.inkMute, fontSize: 13 }}>Dawn rewards: a Dragon Soul at 3, 7, and 14-day streaks, each granted once.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
              {STATS.map((st) => {
                const val = statValue(save, st.skills);
                return (
                  <div key={st.id} style={stoneBox}>
                    <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 13 }}>{st.name}</div>
                    <div style={{ color: C.inkMute, fontSize: 13, margin: '6px 0 8px' }}>{st.detail}</div>
                    <Meter value={val} max={40} label={'Rating  ' + val + ' of 40'} />
                    <div style={{ color: C.inkMute, fontSize: 12, marginTop: 8 }}>Drawn from {st.skills.map((id) => skillById(id).name).join(', ')}. Train those constellations to raise this rating.</div>
                  </div>
                );
              })}
            </div>
            <div style={{ ...stoneBox, marginTop: 14 }}>
              <div style={headingStyle(theme, 13, C.gold)}>Recent deeds</div>
              <GoldRule />
              {(!save.history || save.history.length === 0) ? <p style={{ color: C.inkMute, margin: 0 }}>Trials, bosses, and new ranks will be written here.</p> : save.history.map((h, i) => (
                <div key={i} style={{ color: C.inkDim, fontSize: 14, marginBottom: 8, borderBottom: '1px solid ' + C.line, paddingBottom: 6 }}><span style={{ color: C.goldDim, marginRight: 8 }}>{h.t}</span>{h.text}</div>
              ))}
            </div>
          </div>
        ) : null}
        {view === 'campaign' ? (
          <div>
            <p style={{ color: C.inkDim, marginTop: 0 }}>The main quest. Clear a chapter trial (about 3 of 5) to wake the boss. Defeat the boss to unlock the next region. Sessions stay short. Tap a region on the map to enter.</p>
            <CampaignMap save={save} chapterOpen={chapterOpen} onSelect={(ch, boss) => startChapter(ch, boss)} />
            {CHAPTERS.map((chap, i) => {
              const open = chapterOpen(i);
              const trialDone = save.campaignDone.indexOf(chap.id + '-trial') >= 0;
              const bossDone = save.campaignDone.indexOf(chap.id + '-boss') >= 0;
              return (
                <div key={chap.id} style={{ ...stoneBox, marginBottom: 12, opacity: open ? 1 : 0.55, borderColor: bossDone ? C.gold : C.goldDim }}>
                  <div style={headingStyle(theme, 12, C.gold)}>{chap.region}</div>
                  <h2 style={{ ...headingStyle(theme, 18, C.goldSoft), margin: '6px 0 0' }}>{chap.name}</h2>
                  <p style={{ margin: '8px 0', color: C.inkDim }}>{chap.blurb}</p>
                  <div style={{ color: C.inkMute, fontSize: 13, marginBottom: 10 }}>Boss  ·  {chap.boss}{bossDone ? '  ·  Fallen' : trialDone ? '  ·  Awake' : '  ·  Sleeping'}</div>
                  {open ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <Btn label={trialDone ? 'Revisit the trial' : 'Begin the trial'} kind="gold" onClick={() => startChapter(chap, false)} />
                      {trialDone && !bossDone ? <Btn label={'Face ' + chap.boss} kind="danger" onClick={() => startChapter(chap, true)} /> : null}
                      {bossDone ? <Btn label={'Challenge ' + chap.boss + ' again'} kind="danger" onClick={() => startChapter(chap, true)} /> : null}
                    </div>
                  ) : <div style={{ color: C.inkMute, fontSize: 14 }}>Sealed until the previous boss falls.</div>}
                </div>
              );
            })}
          </div>
        ) : null}
        {view === 'trophies' ? (
          <div>
            <p style={{ color: C.inkDim, marginTop: 0 }}>Trophies of the hall  ·  {save.achievements.length} of {TROPHIES.length} claimed. A few remain hidden until you earn them. Seeded victories already hang here, silently.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {TROPHIES.map((t) => {
                const got = save.achievements.indexOf(t.id) >= 0;
                if (t.hidden && !got) return (
                  <div key={t.id} style={{ ...stoneBox, borderColor: C.line, opacity: 0.7 }}>
                    <div style={{ color: C.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 13 }}>Hidden  ·  ???</div>
                    <div style={{ color: C.inkMute, fontSize: 14, marginTop: 6 }}>A deed not yet spoken in the hall.</div>
                  </div>
                );
                const prog = t.progress ? t.progress(save) : (got ? { now: 1, max: 1 } : undefined);
                return (
                  <div key={t.id} style={{ ...stoneBox, borderColor: got ? C.gold : C.line, boxShadow: got ? '0 0 16px ' + C.gold + '33' : undefined }}>
                    <div style={{ color: got ? C.goldSoft : C.inkMute, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 13 }}>{got ? 'Claimed' : 'Sealed'}  ·  {t.name}</div>
                    <div style={{ color: C.inkDim, fontSize: 14, marginTop: 6 }}>{t.detail}</div>
                    {prog ? <div style={{ marginTop: 8 }}><Meter value={Math.min(prog.now, prog.max)} max={prog.max} color={got ? C.gold : C.frost} label={prog.now + ' / ' + prog.max} /></div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {view === 'haunt' ? (
          <div style={parch}>
            <div style={headingStyle(theme, 13, C.goldDim)}>Haunted Questions  ·  Bounties</div>
            <GoldRule />
            <p style={{ marginTop: 0, color: C.parchMute }}>A miss is due today. A later right rests it until tomorrow. Two later rights banish it. Only due bounties are hunted, so the spacing can do its work.</p>
            {hauntN === 0 ? <div className="cm-empty"><p style={{ color: C.parchMute, marginTop: 0 }}>The haunt is quiet. Misses will gather here.</p><Btn label="Return to the hall" kind="quiet" onClick={() => goView('hall')} /></div> : null}
            {hauntList(save).map((id) => {
              const q = qById(id);
              const rec = save.haunted[id];
              if (!q) return null;
              const due = hauntDue(save, id);
              return (
                <div key={id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid ' + C.goldDim }}>
                  <div style={{ fontSize: 15 }}>{q.q}</div>
                  <div style={{ color: C.parchMute, fontSize: 13, marginTop: 4 }}>{due ? 'Due today' : 'Resting until ' + (rec.due || 'tomorrow')}  ·  Misses {rec.misses}  ·  later rights {rec.rights}/2  ·  {skillById(q.skill === 'bid' ? 'est' : q.skill).name}</div>
                </div>
              );
            })}
            {hauntDueList(save).length > 0 ? <div style={{ marginTop: 12 }}><Btn label={'Hunt ' + Math.min(3, hauntDueList(save).length) + ' due bounties'} kind="gold" onClick={() => startHaunted(Math.min(3, hauntDueList(save).length))} /></div> : hauntN > 0 ? <p style={{ color: C.parchMute }}>No bounty is due today. Return at the next dawn.</p> : null}
          </div>
        ) : null}
        {view === 'quests' ? (
          <div style={parch}>
            <div style={headingStyle(theme, 13, C.goldDim)}>Quest log · {todayKey()}</div>
            <GoldRule />
            <p style={{ marginTop: 0, color: C.parchMute }}>Daily quests reset at midnight on this device. Finish the three daily trials and a Dragon Soul is yours. Bid Day is a standing guild challenge, not a daily burden.</p>
            {daily.map((q) => (
              <div key={q.id} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid ' + C.goldDim }}>
                <div style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13 }}>{q.done ? 'Complete' : 'Open'}  ·  {q.title}</div>
                <p style={{ margin: '6px 0 10px', color: C.parchMute }}>{q.detail}</p>
                {!q.done && q.id === 'weak' ? <Btn label={'Begin ' + weakDef.name} kind="gold" onClick={() => startSkillQuiz(weakId)} /> : null}
                {!q.done && q.id === 'drill' ? <Btn label="Choose a constellation" kind="gold" onClick={() => goView('skills')} /> : null}
                {!q.done && q.id === 'tome' ? <Btn label="Inscribe this leaf" kind="gold" onClick={() => { readTome(); goView('hall'); }} /> : null}
              </div>
            ))}
            <div style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13 }}>{save.dailyDone.indexOf('bid') >= 0 ? 'Faced today' : 'Standing challenge'}  ·  Bid Day, the Dragon of Scope Gaps</div>
            <p style={{ margin: '6px 0 10px', color: C.parchMute }}>Five harder, mixed-trade questions. A perfect run yields two Dragon Souls. Best result: {save.bidBest}/5.</p>
            <Btn label="Face Bid Day" kind="danger" onClick={startBid} />
            <div style={{ marginTop: 18, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13 }}>{encOpen ? 'Encounter today' : 'Encounter settled'}  ·  {encKind === 'sub' ? 'The traveling sub' : 'The cursed RFI'}</div>
            <p style={{ margin: '6px 0 10px', color: C.parchMute }}>{encOpen ? (encKind === 'sub' ? 'A sub wants a clean number in ' + weakDef.name + '. Clear three of four trials for a Dragon Soul.' : 'Three RFI questions stand between you and a clean close. Clear them for a Dragon Soul.') : 'This dawn’s encounter has already been faced.'}</p>
            {encOpen ? <Btn label={encKind === 'sub' ? 'Level the traveling bid' : 'Face the cursed RFI'} kind={encKind === 'rfi' ? 'danger' : 'gold'} onClick={() => startEncounter(encKind)} /> : null}
          </div>
        ) : null}
        {view === 'codex' ? (
          <div style={parch}>
            <div style={headingStyle(theme, 13, C.goldDim)}>Codex  ·  Bestiary of concepts</div>
            <GoldRule />
            <p style={{ marginTop: 0, color: C.parchMute }}>Rank climbs with character level: Apprentice through Dragonborn of Bids. A concept is inscribed here the first time you answer it right. In a trial, a Dragon Soul can fuel a 50/50 Shout or Time Slow. Progress stays on this device, and a Save Scroll can copy it.</p>
            <div style={{ marginBottom: 18 }}>
              <div style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 13, marginBottom: 8 }}>{save.codex.length} concepts inscribed</div>
              <input type="search" aria-label="Search the Codex" placeholder="Search inscribed concepts" value={codexQ} onChange={(e: ChangeEvent<HTMLInputElement>) => setCodexQ(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', margin: '0 0 10px', padding: '10px 12px', background: '#efe6d2', color: C.parchInk, border: '1px solid ' + C.goldDim, font: 'inherit' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {[{ id: 'all', label: 'All' }, { id: 'trade', label: 'Trades' }, { id: 'est', label: 'Estimating' }, { id: 'qto', label: 'Takeoff' }, { id: 'num', label: 'Numeric' }, { id: 'code', label: 'Code and spec' }].map((cat) => (
                  <button type="button" key={cat.id} onClick={() => setCodexCat(cat.id)} style={{ font: 'inherit', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 10px', minHeight: 40, cursor: 'pointer', background: codexCat === cat.id ? C.gold : 'transparent', color: codexCat === cat.id ? C.parchInk : C.parchMute, border: '1px solid ' + C.goldDim }}>{cat.label}</button>
                ))}
              </div>
              {save.codex.length === 0 ? <div className="cm-empty"><p style={{ color: C.parchMute, marginTop: 0 }}>The Codex is still unwritten. Answer a question correctly and it will be inscribed here for review.</p><Btn label={openTrialPending() ? 'Resume trial' : 'Continue  ·  ' + best.label} kind="gold" onClick={() => { if (openTrialPending()) resumeTrial(); else best.go(); }} /></div> : null}
              {save.codex.map((id) => {
                const q = qById(id);
                if (!q) return null;
                const query = codexQ.trim().toLowerCase();
                if (query && (q.q + ' ' + q.x + ' ' + q.id).toLowerCase().indexOf(query) < 0) return null;
                const isTrade = SKILLS.some((s) => s.id === q.skill);
                const isEst = EST_IDS.indexOf(q.skill as SkillId) >= 0 || q.skill === 'bid';
                const isQto = q.skill === 'qto';
                const isNum = q.kind === 'num' || q.id.indexOf('num-') === 0;
                const isCode = /code|NEC|NFPA|ASTM|AISC|SMACNA|OSHA|UL |listed|1:12|IPC|UPC|E84/i.test(q.q + ' ' + q.x);
                if (codexCat === 'trade' && !isTrade) return null;
                if (codexCat === 'est' && !isEst) return null;
                if (codexCat === 'qto' && !isQto && !isNum) return null;
                if (codexCat === 'num' && !isNum) return null;
                if (codexCat === 'code' && !isCode) return null;
                return (
                  <div key={id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid ' + C.goldDim }}>
                    <div style={{ color: C.parchMute, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{skillById(q.skill === 'bid' ? 'est' : q.skill).name}{isNum ? '  ·  Numeric' : ''}</div>
                    <div style={{ fontSize: 15 }}>{q.q}</div>
                    <div style={{ color: C.parchMute, fontSize: 14, marginTop: 4 }}>{q.x}</div>
                  </div>
                );
              })}
            </div>
            {ALL_SKILLS.map((def) => (
              <button type="button" key={def.id} onClick={() => { setFocus(def.id); goView('skill'); }} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', marginBottom: 16 }}>
                <div style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 14 }}>{def.rune}  {def.name}  ·  {def.csi}  ·  Level {skillInfo(save.skills[def.id].xp).level}</div>
                <p style={{ margin: '6px 0 0', color: C.parchMute }}>{def.lore}</p>
              </button>
            ))}
          </div>
        ) : null}
        {(view === 'quiz' || view === 'bid') && session && !session.done && quizQ ? (
          <div className={session.show && last ? (last.correct ? 'cm-q-ok' : 'cm-q-miss') : undefined} style={session.mode === 'bid' ? { ...stoneBox, background: '#160c0c', borderColor: C.danger } : parch}>
            <Corners color={session.mode === 'bid' || session.mode === 'boss' ? C.emberSoft : undefined} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={headingStyle(theme, 12, session.mode === 'bid' || session.mode === 'boss' ? C.goldSoft : C.goldDim)}>{session.mode === 'bid' ? 'Bid Day  ·  The Dragon of Scope Gaps' : session.mode === 'haunt' ? 'Haunted Questions  ·  Bounties' : session.mode === 'boss' ? 'Boss  ·  ' + ((CHAPTERS.find((c) => c.id === session.chapter) || { boss: 'The Guardian' }).boss) : session.mode === 'camp' ? ((CHAPTERS.find((c) => c.id === session.chapter) || { name: 'Campaign' }).name) + '  ·  Chapter trial' : skillById(session.skill === 'bid' ? focus : session.skill).name + '  ·  ' + session.ids.length + ' trials'}</div>
            <Btn label="Park this trial" kind="quiet" onClick={() => goView('hall')} />
            </div>
            <p style={{ margin: '8px 0 0', color: session.mode === 'bid' ? C.inkDim : C.parchMute, fontSize: 14 }}>Trial {session.index + 1} of {session.ids.length}{session.mode === 'bid' ? '  ·  Mixed trades, harder questions. The bid is due at two o’clock.' : '  ·  Keys 1–4 or A–D to answer, Enter to continue.'}</p>
            {save.streak >= 2 && !session.show ? <div style={{ marginTop: 10, color: C.goldSoft, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 13, textShadow: '0 0 12px ' + C.gold }}>Combo  ×{save.streak}</div> : null}
              {session.mode === 'boss' ? (() => {
                const maxHP = session.ids.length;
                const scored = session.items.filter((it) => it.correct).length;
                const hp = Math.max(0, maxHP - scored);
                const phase = session.index >= Math.ceil(maxHP / 2) || scored >= Math.ceil(maxHP / 2) ? 2 : 1;
                return (
                  <div style={{ margin: '10px 0 0' }}>
                    <div style={{ color: C.emberSoft, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12 }}>Phase {phase} of 2  ·  {phase === 1 ? 'The foe tests your footing' : 'The foe is enraged'}</div>
                    <Meter value={hp} max={maxHP} color={C.health} label={'Boss vitality  ·  ' + hp + ' / ' + maxHP} />
                  </div>
                );
              })() : null}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0 16px' }}>
              {session.ids.map((id, i) => {
                const item = session.items[i];
                const bg = item ? (item.correct ? C.success : C.danger) : i === session.index ? C.gold : C.stone;
                return <div key={id} className="cm-pip" style={{ width: 18, height: 8, background: bg, border: '1px solid var(--cm-gold-dim, ' + C.goldDim + ')', boxShadow: i === session.index ? '0 0 8px var(--cm-glow, ' + C.gold + '88)' : undefined, transform: i === session.index ? 'scaleY(1.25)' : undefined }} />;
              })}
            </div>
            <h2 style={{ ...headingStyle(theme, 18, session.mode === 'bid' ? C.ink : C.parchInk), letterSpacing: '0.04em', textTransform: 'none' }}>{quizQ.q}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {quizQ.kind === 'num' ? null : (session.order.length ? session.order : quizQ.c.map((_, i) => i)).map((orig, i) => {
                const choice = quizQ.c[orig];
                const isHidden = hidden.indexOf(orig) >= 0;
                const revealed = session.show;
                const isAnswer = orig === quizQ.a;
                const picked = last && last.picked === i;
                let bg = session.mode === 'bid' ? C.stone : '#efe6d2';
                let fg = session.mode === 'bid' ? C.ink : C.parchInk;
                let border = C.goldDim;
                if (revealed && isAnswer) { bg = C.success; fg = C.successInk; border = C.success; }
                else if (revealed && picked && !isAnswer) { bg = C.danger; fg = C.dangerInk; border = C.danger; }
                return (
                  <button type="button" key={i} disabled={session.show || isHidden} onClick={() => answer(i)} className="cm-opt" style={{ textAlign: 'left', font: 'inherit', padding: '12px 14px', minHeight: 44, display: 'flex', alignItems: 'flex-start', gap: 8, whiteSpace: 'normal', overflowWrap: 'break-word', background: isHidden ? C.stone : bg, color: isHidden ? C.inkMute : fg, border: '1px solid ' + border, cursor: session.show || isHidden ? 'default' : 'pointer', textDecoration: isHidden ? 'line-through' : 'none', opacity: isHidden ? 0.45 : 1 }}>
                    <span style={{ letterSpacing: '0.08em', marginRight: 8, flexShrink: 0 }}>{i + 1}  {String.fromCharCode(65 + i)}</span>{choice}
                  </button>
                );
              })}
              {quizQ.kind === 'num' && quizQ.num ? (
                <div>
                  <label style={{ display: 'block', color: session.mode === 'bid' ? C.inkDim : C.parchMute, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Enter a number{quizQ.num.unit ? '  ·  ' + quizQ.num.unit : ''}</label>
                  <input type="text" inputMode="decimal" aria-label="Numeric answer" value={session.numDraft} disabled={session.show} onChange={(e: ChangeEvent<HTMLInputElement>) => setSession({ ...session, numDraft: e.target.value })} onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); if (session.show) nextQuestion(); else answerNum(); } }} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', font: 'inherit', fontSize: 20, padding: '12px 14px', minHeight: 48, background: session.mode === 'bid' ? C.stone : '#efe6d2', color: session.mode === 'bid' ? C.ink : C.parchInk, border: '1px solid ' + C.gold, borderRadius: 2 }} />
                  {!session.show ? <div style={{ marginTop: 12 }}><Btn label="Seal this number" kind="gold" onClick={answerNum} /></div> : null}
                  {session.show && last ? <div style={{ marginTop: 10, color: last.correct ? C.success : C.danger }}>{last.correct ? 'Within tolerance  ·  ' + quizQ.num.value + (quizQ.num.unit ? ' ' + quizQ.num.unit : '') : 'The accepted value is ' + quizQ.num.value + (quizQ.num.unit ? ' ' + quizQ.num.unit : '') + '  (tolerance ' + quizQ.num.tol + ')'}</div> : null}
                </div>
              ) : null}
            </div>
            {session.show && last ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ color: last.correct ? (session.mode === 'bid' ? C.goldSoft : C.success) : C.danger, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 13 }}>{last.correct ? 'Correct  ·  +' + last.xp + ' experience' : 'Incorrect'}</div>
                <p style={{ margin: '8px 0 14px', color: session.mode === 'bid' ? C.inkDim : C.parchMute }}>{quizQ.x}</p>
                <Btn label={session.index + 1 >= session.ids.length ? 'Close this trial' : 'Next trial'} kind="gold" onClick={nextQuestion} />
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                {quizQ.kind === 'num' ? <div><div style={{ color: session.mode === 'bid' ? C.inkMute : C.parchMute, fontSize: 13, marginBottom: 10 }}>Type the number, then seal it or press Enter. A close estimate within tolerance counts.</div><Btn label={session.shoutSlow ? 'Time Slow is active' : save.souls < 1 ? 'No souls for Time Slow' : 'Time Slow  ·  1 soul'} disabled={save.souls < 1 || !!session.shoutSlow} onClick={useSlow} /></div> : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Btn label={session.hint ? '50/50 Shout spent' : save.souls < 1 ? 'No souls for a 50/50 Shout' : '50/50 Shout  ·  1 soul'} disabled={save.souls < 1 || session.hint || quizQ.kind === 'tf'} onClick={useHint} />
                    <Btn label={session.shoutSlow ? 'Time Slow is active' : save.souls < 1 ? 'No souls for Time Slow' : 'Time Slow  ·  1 soul'} disabled={save.souls < 1 || !!session.shoutSlow} onClick={useSlow} />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
        {(view === 'quiz' || view === 'bid') && session && session.done ? (
          <div style={parch}>
            <div style={headingStyle(theme, 13, C.goldDim)}>{session.mode === 'bid' ? 'Bid Day is closed' : session.mode === 'boss' ? 'The boss encounter is written' : session.mode === 'haunt' ? 'The haunt recedes' : session.mode === 'camp' ? 'The chapter trial is written' : 'The trial is written'}</div>
            <GoldRule />
            <h2 style={{ ...headingStyle(theme, 20, C.parchInk) }}>{session.items.filter((i) => i.correct).length} of {session.items.length} correct</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '8px 0 12px', color: C.parchMute, fontSize: 14 }}>
              <span>XP gained  ·  {session.items.reduce((n, i) => n + (i.xp || 0), 0) + (session.bonusXp || 0)}</span>
              <span>Dragon Souls  ·  {(save.souls - (session.startSouls || 0) >= 0 ? '+' : '') + (save.souls - (session.startSouls || 0))}</span>
              <span>New Codex  ·  {Math.max(0, save.codex.length - (typeof session.startCodex === 'number' ? session.startCodex : (session.startCodex ? session.startCodex.length : 0)))}</span>
            </div>
            <p style={{ color: C.parchMute }}>{session.items.filter((i) => i.correct).length === session.items.length ? (session.mode === 'bid' ? 'A perfect bid day. Two Dragon Souls are yours, and the hall remembers your Shout.' : 'A perfect trial. A Dragon Soul is yours, and a bonus of experience has been granted.') : 'Read the misses once more. Concepts learned and misses to review are listed below.'}</p>
            <div style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, color: C.goldDim, margin: '8px 0' }}>Concepts learned</div>
            {session.items.filter((i) => i.correct).map((item) => {
              const q = qById(item.id);
              if (!q) return null;
              return <div key={'ok-' + item.id} style={{ fontSize: 14, marginBottom: 6, color: C.parchInk }}>{q.q}</div>;
            })}
            {session.items.some((i) => !i.correct) ? <div style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, color: C.goldDim, margin: '12px 0 8px' }}>Misses to review</div> : null}
            {session.items.map((item) => {
              const q = qById(item.id);
              if (!q) return null;
              return (
                <div key={item.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 14 }}>{item.correct ? 'Correct' : 'Miss'}  ·  {q.q}</div>
                  {!item.correct ? <div style={{ color: C.parchMute, fontSize: 14 }}>{q.x}</div> : null}
                </div>
              );
            })}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {session.mode === 'skill' && session.skill !== 'bid' ? <Btn label="Five more trials" kind="gold" onClick={() => startSkillQuiz(session.skill as SkillId)} /> : null}
              {session.mode === 'skill' && session.skill !== 'bid' ? <Btn label="Quick 3" onClick={() => startSkillQuiz(session.skill as SkillId, 3)} /> : null}
              {session.mode === 'bid' ? <Btn label="Face the dragon again" kind="danger" onClick={startBid} /> : null}
              {session.mode === 'haunt' && hauntDueList(save).length > 0 ? <Btn label="Hunt due bounties" kind="gold" onClick={() => startHaunted(Math.min(3, hauntDueList(save).length))} /> : null}
              {session.mode === 'camp' && session.chapter && save.campaignDone.indexOf(session.chapter + '-trial') >= 0 ? <Btn label="Face the boss" kind="danger" onClick={() => { const chap = CHAPTERS.find((c) => c.id === session.chapter); if (chap) startChapter(chap, true); }} /> : null}
              {session.mode === 'boss' ? <Btn label="Return to the campaign" kind="gold" onClick={() => { setSession(null); goView('campaign'); }} /> : null}
              <Btn label="Return to the hall" onClick={() => { setSession(null); goView('hall'); }} />
              <Btn label="Constellations" onClick={() => { setSession(null); goView('skills'); }} />
            </div>
          </div>
        ) : null}
        {view === 'shop' ? (
          <div style={stoneBox}>
            <div style={headingStyle(theme, 13, C.gold)}>The Soul Merchant</div>
            <GoldRule />
            <p style={{ color: C.inkDim, marginTop: 0 }}>Spend Dragon Souls on titles, banners, and hall themes. Cosmetics never change a question or an answer. You have {save.souls} {save.souls === 1 ? 'soul' : 'souls'}.</p>
            {SHOP.map((item) => {
              const owned = ((save.cosmetics && save.cosmetics.owned) || []).indexOf(item.id) >= 0;
              const equipped = save.cosmetics && save.cosmetics[item.kind] === item.id;
              return (
                <div key={item.id} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid ' + C.goldDim }}>
                  <div style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13, color: C.goldSoft }}>{item.kind}  ·  {item.name}{equipped ? '  ·  equipped' : owned ? '  ·  owned' : '  ·  ' + item.cost + (item.cost === 1 ? ' soul' : ' souls')}</div>
                  <p style={{ margin: '6px 0 10px', color: C.inkDim }}>{item.detail}</p>
                  <Btn label={owned ? (equipped ? 'Unequip' : 'Equip') : save.souls < item.cost ? 'Not enough souls' : 'Buy for ' + item.cost} kind={owned || save.souls >= item.cost ? 'gold' : 'quiet'} disabled={!owned && save.souls < item.cost} onClick={() => buyCosmetic(item.id)} />
                </div>
              );
            })}
          </div>
        ) : null}
        {view === 'settings' ? (
          <div style={stoneBox}>
            <div style={headingStyle(theme, 13, C.gold)}>Settings of the hall</div>
            <GoldRule />
            <p style={{ color: C.inkDim, marginTop: 0 }}>These choices stay on this device with your ledger. Reduced motion quiets juice, twinkle, snow, and path draw-ins. Sound is off until you enable it.</p>
            <div style={{ color: savedFlash ? C.goldSoft : (saveWarning ? C.emberSoft : C.inkMute), fontSize: 13, marginBottom: 8 }}>{savedFlash ? 'Saved just now' : (lastSavedAt ? 'Last saved  ·  ' + formatLastSaved(lastSavedAt) : 'Not yet saved to a lasting ledger')}</div>
            {savedFlash && lastSavedAt ? <div style={{ color: C.inkMute, fontSize: 12, marginBottom: 8 }}>Last saved  ·  {formatLastSaved(lastSavedAt)}</div> : null}
            {saveWarning ? <p style={{ color: C.emberSoft, marginTop: 0 }}>{saveWarning}</p> : null}
            {backupOffer ? <div style={{ marginBottom: 12 }}><Btn label="Restore from backup" kind="gold" onClick={restoreFromBackup} /></div> : null}
            <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>Motion</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {([{ id: 'auto', label: 'Follow the device' }, { id: 'full', label: 'Full motion' }, { id: 'reduce', label: 'Reduced motion' }] as { id: 'auto' | 'full' | 'reduce'; label: string }[]).map((opt) => (
                <Btn key={opt.id} label={opt.label} kind={(save.settings && save.settings.motion) === opt.id ? 'gold' : 'quiet'} onClick={() => setSave({ ...save, settings: { ...(save.settings || { motion: 'auto', text: 'md' }), motion: opt.id } })} />
              ))}
            </div>
            <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>Text size</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {([{ id: 'sm', label: 'Small' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Large' }] as { id: 'sm' | 'md' | 'lg'; label: string }[]).map((opt) => (
                <Btn key={opt.id} label={opt.label} kind={(save.settings && save.settings.text) === opt.id ? 'gold' : 'quiet'} onClick={() => setSave({ ...save, settings: { ...(save.settings || { motion: 'auto', text: 'md' }), text: opt.id } })} />
              ))}
            </div>
            <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>Sound</div>
            <p style={{ color: C.inkDim }}>Optional hall tones, synthesized in the browser. Off by default, and silent until you turn them on.</p>
            <div style={{ marginBottom: 16 }}><Btn label={save.settings && save.settings.sound ? 'Sound is on' : 'Sound is off'} kind={save.settings && save.settings.sound ? 'gold' : 'quiet'} onClick={toggleSound} /></div>
            <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>Opening cinematic</div>
            <p style={{ color: C.inkDim }}>The first-arrival cinematic plays once. Replaying it does not change your ledger.</p>
            <div style={{ marginBottom: 16 }}><Btn label="Replay the opening" onClick={() => { setCinemaBeat(0); setShowCinema(true); }} /></div>
            <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>Save Scroll</div>
            <p style={{ color: C.inkDim }}>Export a copy of this ledger, or import a scroll you kept elsewhere. A failed import never wipes the current save. The hall also keeps an automatic backup before each write. Email and QR work offline in this browser — no custom domain required.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <Btn label={scrollCopied ? 'Copied to the clipboard' : 'Copy save code'} kind="gold" onClick={copyScroll} />
              <Btn label="Email me my code" kind="gold" onClick={emailScroll} />
              <Btn label="Download JSON" onClick={() => downloadScroll(save)} />
              <Btn label={showScrollQr ? 'Hide QR' : 'Show QR'} onClick={() => setShowScrollQr((v) => !v)} />
            </div>
            {showScrollQr ? (() => {
              const code = encodeScroll(save);
              return (
                <div style={{ marginBottom: 14, padding: 12, border: '1px solid ' + C.goldDim, background: '#120e0a' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
                    <QrCode size={168} title="Save Scroll QR" />
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <div style={{ color: C.goldSoft, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Offline QR</div>
                      <p style={{ margin: '0 0 8px', color: C.inkDim, fontSize: 14 }}>
                        The full scroll is too large for a reliable QR (~{code.length} characters). This QR encodes a short offline instruction; the scroll prefix is below. Use Copy or Email for the complete code.
                      </p>
                      <div style={{ color: C.inkMute, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Scroll prefix</div>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: C.inkDim, fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{scrollPrefix(code, 180)}</pre>
                    </div>
                  </div>
                </div>
              );
            })() : null}
            <label style={{ display: 'block', color: C.inkMute, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Paste a save code or JSON to import</label>
            <textarea aria-label="Paste a Save Scroll" value={importDraft} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setImportDraft(e.target.value); setImportNotice(''); }} onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); importScroll(); } }} rows={4} style={{ width: '100%', boxSizing: 'border-box', minHeight: 96, font: 'inherit', fontSize: 13, padding: '10px 12px', background: '#1a1610', color: C.ink, border: '1px solid ' + C.goldDim, borderRadius: 2, marginBottom: 8 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <Btn label="Import this scroll" kind="gold" disabled={!importDraft.trim()} onClick={importScroll} />
              {hasBackupLedger() ? <Btn label="Restore from backup" onClick={restoreFromBackup} /> : null}
            </div>
            {importNotice ? <p style={{ color: C.goldSoft, marginTop: 0 }}>{importNotice}</p> : null}
            <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>Dawn rewards</div>
            <p style={{ color: C.inkDim }}>A Dragon Soul is granted once at a 3-day, 7-day, and 14-day login streak.</p>
            <div style={{ color: C.goldSoft, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>Reset</div>
            {!resetAsk ? <Btn label="Reset to the opening ledger" kind="danger" onClick={() => setResetAsk(true)} /> : (
              <div>
                <p style={{ color: C.inkDim }}>This restores the seeded opening ledger on this device and cannot be undone. Seeded victories and starting experience will return; later trials will not. A backup of the current ledger is written first.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Btn label="Confirm the reset" kind="danger" onClick={() => { setPersistGate(false); setLedgerNotice(''); setSave(withEarned(applyDailyLogin(makeSeed()))); setResetAsk(false); setView('title'); setCinemaBeat(0); setShowCinema(true); setSession(null); trialLockRef.current = false; pushToast('rank', 'The opening ledger is restored'); }} />
                  <Btn label="Withdraw" onClick={() => setResetAsk(false)} />
                </div>
              </div>
            )}
          </div>
        ) : null}
        {view === 'bid' && !session ? (
          <div style={{ ...stoneBox, background: '#160c0c', borderColor: C.danger }}>
            <div style={headingStyle(theme, 13, C.goldSoft)}>Bid Day · The Dragon of Scope Gaps</div>
            <GoldRule />
            <p style={{ color: C.inkDim }}>The proposal is due at two o’clock. Five mixed questions, harder than a morning trial, drawn from every trade. A perfect run grants two Dragon Souls and a bonus of experience. Your best: {save.bidBest} of 5.</p>
            <Btn label="Begin the bid" kind="danger" onClick={startBid} />
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
