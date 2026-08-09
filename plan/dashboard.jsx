const { useState, useEffect, useRef } = React;
const { Plane, Heart, UtensilsCrossed, Users, Shirt, ClipboardCheck, Plus, Trash2, Check, CalendarDays, Wallet, Briefcase, Phone, Mail, Clock, Sun, Moon } = LucideReact;

const STORAGE_KEY = "wedding_dashboard_state";
const uid = () => Math.random().toString(36).slice(2, 9);

const ICONS = {
  plane: Plane,
  heart: Heart,
  food: UtensilsCrossed,
  users: Users,
  shirt: Shirt,
  clip: ClipboardCheck,
};

// A sunset-to-sea hue for each section, in order.
const HUES = ["#E07CA3", "#5FA877", "#D98AB0", "#7FB98E", "#C76F97", "#6FAE86"];

// Festive plumeria-shower colors for the 100% celebration.
const PETAL_COLORS = ["#E07CA3", "#5FA877", "#F0A8C4", "#88C39A", "#D98AB0", "#A9D6B4", "#C76F97", "#FBF4F0"];
const PETAL_GLYPHS = ["❀", "✿", "❁"];

// The Wedding Bowl caps at ~40 guests.
const GUEST_CAP = 40;

// Jameson & Dawsyn at sunset (uploaded photo, optimized + embedded).
const COUPLE_PHOTO = "/img/couple.jpg";

const DEFAULT_STATE = {
  partnerA: "Jameson",
  partnerB: "Dawsyn",
  weddingDate: "2026-12-30",
  dogsCaption: "Jameson & Dawsyn",
  dark: false,
  categories: [
    {
      id: uid(),
      num: "01",
      title: "Lodging & Travel",
      icon: "plane",
      tasks: [
        { id: uid(), title: "Book family hotel block", note: "Rooms near La Jolla for both families — first 2 nights", done: false },
        { id: uid(), title: "Reserve the honeymoon suite", note: "For you & Dawsyn — the night of the wedding", done: false },
        { id: uid(), title: "Book flights", note: "Confirm dates & all travelers", done: false },
        { id: uid(), title: "Arrange transportation to & from the venue", note: "", done: false },
        { id: uid(), title: "Plan the honeymoon trip", note: "Destination, flights, where you're staying", done: false },
      ],
    },
    {
      id: uid(),
      num: "02",
      title: "The Ceremony",
      icon: "heart",
      tasks: [
        { id: uid(), title: "Confirm the officiant", note: "Brother-in-law — already set up to officiate; California recognizes an ordained minister, no extra state registration needed", done: false },
        { id: "venue-bowl", title: "Reserve the Wedding Bowl (Cuvier Park permit)", note: "City of San Diego Shoreline Permit Center · 619-235-1169 · one permit per day, books up fast — lock Dec 30 ASAP", done: false },
        { id: "ca-license", title: "Get the CA marriage license (San Diego County Clerk)", note: "Both of you appear in person by appointment · ~$130 · valid 90 days · can't be done online — book the appointment early", done: false },
        { id: "ca-witness", title: "Line up a witness to sign the license", note: "California requires at least one witness on a public license", done: false },
        { id: uid(), title: "Choose wedding rings", note: "", done: false },
        { id: uid(), title: "Write & prepare vows", note: "", done: false },
        { id: uid(), title: "Plan ceremony music / processional", note: "Amplified sound is limited at the park — keep it modest & check the noise rules", done: false },
      ],
    },
    {
      id: uid(),
      num: "03",
      title: "Reception & Food",
      icon: "food",
      tasks: [
        { id: uid(), title: "Make the celebration dinner reservation", note: "Receptions aren't allowed at the Wedding Bowl — book a nearby La Jolla spot for right after", done: false },
        { id: uid(), title: "Order the cake", note: "Tasting → design → delivery details", done: false },
        { id: uid(), title: "Confirm catering / menu", note: "", done: false },
        { id: uid(), title: "Arrange bar & drinks", note: "", done: false },
        { id: uid(), title: "Book a DJ or band", note: "", done: false },
        { id: uid(), title: "Plan décor & florals", note: "", done: false },
      ],
    },
    {
      id: uid(),
      num: "04",
      title: "Guests & People",
      icon: "users",
      tasks: [
        { id: "guest-cap", title: "Keep the guest list to 40", note: "The Wedding Bowl caps at ~40 guests — track names in the Guest List below", done: false },
        { id: uid(), title: "Finalize the guest list", note: "", done: false },
        { id: uid(), title: "Send save-the-dates", note: "", done: false },
        { id: uid(), title: "Send invitations & track RSVPs", note: "", done: false },
        { id: uid(), title: "Choose the wedding party", note: "", done: false },
        { id: uid(), title: "Book photographer / videographer", note: "", done: false },
        { id: uid(), title: "Schedule hair & makeup", note: "", done: false },
      ],
    },
    {
      id: uid(),
      num: "05",
      title: "Attire",
      icon: "shirt",
      tasks: [
        { id: uid(), title: "Dress + alterations", note: "", done: false },
        { id: uid(), title: "Suit / tux + fitting", note: "", done: false },
        { id: uid(), title: "Shoes & accessories", note: "Dec 30 evenings are cool & breezy on the cliff — plan layers / a wrap", done: false },
      ],
    },
    {
      id: uid(),
      num: "06",
      title: "Final Details & After",
      icon: "clip",
      tasks: [
        { id: uid(), title: "Build the day-of timeline", note: "Dec 30 sunset is ~4:50pm — aim the ceremony for early/mid-afternoon light", done: false },
        { id: uid(), title: "Plan the rehearsal dinner", note: "", done: false },
        { id: uid(), title: "Make final vendor payments", note: "", done: false },
        { id: uid(), title: "Set up a gift registry", note: "", done: false },
        { id: uid(), title: "Send thank-you cards", note: "", done: false },
      ],
    },
  ],
  guests: Array.from({ length: GUEST_CAP }, () => ({ id: uid(), name: "", side: "", rsvp: "", meal: "" })),
  budget: {
    total: "",
    items: [
      { id: uid(), label: "Marriage license", est: "130", paid: "" },
      { id: uid(), label: "Wedding Bowl permit", est: "", paid: "" },
      { id: uid(), label: "Wedding rings", est: "", paid: "" },
      { id: uid(), label: "Attire (dress + suit)", est: "", paid: "" },
      { id: uid(), label: "Hotels & honeymoon suite", est: "", paid: "" },
      { id: uid(), label: "Honeymoon trip", est: "", paid: "" },
    ],
  },
  vendors: [
    { id: uid(), name: "", type: "Photographer / video", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
    { id: uid(), name: "", type: "Celebration dinner", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
    { id: uid(), name: "", type: "Cake", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
    { id: uid(), name: "", type: "Florist", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
    { id: uid(), name: "", type: "Music / DJ", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
    { id: uid(), name: "", type: "Hair & makeup", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
  ],
  timeline: {
    ceremony: "15:00",
    items: [
      { id: uid(), offset: -120, label: "Permit window opens — setup begins", note: "Chairs, arch, florals; nothing may be left overnight", done: false },
      { id: uid(), offset: -90, label: "Florist & photographer arrive", note: "Set up before guests start showing", done: false },
      { id: uid(), offset: -60, label: "Guests begin arriving", note: "Street parking in La Jolla is tight — tell people to come early", done: false },
      { id: uid(), offset: -10, label: "Seat the families", note: "", done: false },
      { id: uid(), offset: 0, label: "Ceremony begins", note: "Processional", done: false },
      { id: uid(), offset: 25, label: "Vows, rings & pronouncement", note: "", done: false },
      { id: uid(), offset: 30, label: "Sign the license", note: "Officiant + at least one witness", done: false },
      { id: uid(), offset: 35, label: "Group photos at the bowl", note: "", done: false },
      { id: uid(), offset: 60, label: "Couple's portraits — golden hour", note: "Best light is the half hour before sunset", done: false },
      { id: uid(), offset: 100, label: "Breakdown & clear the park", note: "Everything out before the permit window closes", done: false },
      { id: uid(), offset: 180, label: "Dinner at Piazza Cucina Italiana", note: "6:00pm · 7731 Fay Ave, La Jolla · 858-412-3108 — confirm reservation name & headcount", done: false },
    ],
  },
};

const hasStorage = () =>
  typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";

// Move any previously saved (Hawaii-era) state over to the San Diego / La Jolla plan.
const migrateState = (raw) => {
  const s = structuredClone(raw);
  if (s.partnerA === "You" || !s.partnerA) s.partnerA = "Jameson";
  if (!s.weddingDate) s.weddingDate = "2026-12-30";
  if (s.dogsCaption == null || s.dogsCaption === "Our ring bearers") s.dogsCaption = "Jameson & Dawsyn";
  if (s.dark == null) s.dark = false;
  if (!Array.isArray(s.categories)) return s;

  const cer = s.categories.find((c) => c.title === "The Ceremony");
  if (cer) {
    // Drop the old Hawaii tasks and the legacy generic license task.
    const obsolete = new Set(["hi-perf", "hi-lic-apply", "hi-lic-pickup"]);
    cer.tasks = cer.tasks.filter(
      (t) => !obsolete.has(t.id) && t.title !== "Apply for the marriage license"
    );

    // Refresh the officiant note only if it's still the old default.
    const off = cer.tasks.find((t) => t.title === "Confirm the officiant");
    if (off && off.note === "Hoping: brother-in-law — ask & lock it in") {
      off.note = "Brother-in-law — already set up to officiate; California recognizes an ordained minister, no extra state registration needed";
    }

    // Repurpose the generic venue task into the Wedding Bowl permit (keep its id/done/notes).
    const venue = cer.tasks.find((t) => t.title === "Book the ceremony venue" || t.id === "venue-bowl");
    if (venue) {
      venue.title = "Reserve the Wedding Bowl (Cuvier Park permit)";
      if (!venue.note) venue.note = "City of San Diego Shoreline Permit Center · 619-235-1169 · one permit per day, books up fast — lock Dec 30 ASAP";
    }

    // Ensure the California tasks exist.
    const ca = [
      { id: "venue-bowl", title: "Reserve the Wedding Bowl (Cuvier Park permit)", note: "City of San Diego Shoreline Permit Center · 619-235-1169 · one permit per day, books up fast — lock Dec 30 ASAP", done: false },
      { id: "ca-license", title: "Get the CA marriage license (San Diego County Clerk)", note: "Both of you appear in person by appointment · ~$130 · valid 90 days · can't be done online — book the appointment early", done: false },
      { id: "ca-witness", title: "Line up a witness to sign the license", note: "California requires at least one witness on a public license", done: false },
    ];
    let at = cer.tasks.findIndex((t) => t.title === "Confirm the officiant");
    at = at < 0 ? 0 : at + 1;
    ca.forEach((task) => {
      if (!cer.tasks.some((t) => t.id === task.id)) {
        cer.tasks.splice(at, 0, task);
        at += 1;
      }
    });
  }

  // Make sure the guest-cap reminder is in the Guests section.
  const ppl = s.categories.find((c) => c.title === "Guests & People");
  if (ppl && !ppl.tasks.some((t) => t.id === "guest-cap")) {
    ppl.tasks.unshift({ id: "guest-cap", title: "Keep the guest list to 40", note: "The Wedding Bowl caps at ~40 guests — track names in the Guest List below", done: false });
  }

  // Ensure there are 40 guest spots.
  if (!Array.isArray(s.guests)) s.guests = [];
  while (s.guests.length < GUEST_CAP) s.guests.push({ id: uid(), name: "", side: "", rsvp: "", meal: "" });
  s.guests.forEach((g) => {
    if (g.rsvp === undefined) g.rsvp = "";
    if (g.meal === undefined) g.meal = "";
  });

  // Give every task a due field, and seed suggested dates for the key milestones.
  const SEED_DUE = {
    "venue-bowl": "2026-08-14",
    "ca-license": "2026-12-04",
    "ca-witness": "2026-12-11",
    "guest-cap": "2026-08-28",
  };
  const SEED_BY_TITLE = {
    "Confirm the officiant": "2026-08-07",
    "Book family hotel block": "2026-09-11",
    "Reserve the honeymoon suite": "2026-09-11",
    "Book flights": "2026-09-25",
    "Send save-the-dates": "2026-08-28",
    "Send invitations & track RSVPs": "2026-10-16",
    "Book photographer / videographer": "2026-09-04",
    "Make the celebration dinner reservation": "2026-09-18",
    "Order the cake": "2026-11-06",
    "Choose wedding rings": "2026-10-09",
    "Dress + alterations": "2026-10-02",
    "Suit / tux + fitting": "2026-10-30",
    "Write & prepare vows": "2026-12-11",
    "Build the day-of timeline": "2026-12-18",
    "Make final vendor payments": "2026-12-23",
    "Plan the honeymoon trip": "2026-10-23",
    "Schedule hair & makeup": "2026-10-16",
    "Plan the rehearsal dinner": "2026-11-20",
    "Set up a gift registry": "2026-09-25",
  };
  s.categories.forEach((c) => {
    (c.tasks || []).forEach((t) => {
      if (t.due === undefined) t.due = SEED_DUE[t.id] || SEED_BY_TITLE[t.title] || "";
    });
  });

  // Ensure budget + vendors exist.
  if (!s.budget || typeof s.budget !== "object") {
    s.budget = {
      total: "",
      items: [
        { id: uid(), label: "Marriage license", est: "130", paid: "" },
        { id: uid(), label: "Wedding Bowl permit", est: "", paid: "" },
        { id: uid(), label: "Wedding rings", est: "", paid: "" },
        { id: uid(), label: "Attire (dress + suit)", est: "", paid: "" },
        { id: uid(), label: "Hotels & honeymoon suite", est: "", paid: "" },
        { id: uid(), label: "Honeymoon trip", est: "", paid: "" },
      ],
    };
  }
  if (!Array.isArray(s.budget.items)) s.budget.items = [];
  if (!Array.isArray(s.vendors)) {
    s.vendors = [
      { id: uid(), name: "", type: "Photographer / video", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
      { id: uid(), name: "", type: "Celebration dinner", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
      { id: uid(), name: "", type: "Cake", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
      { id: uid(), name: "", type: "Florist", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
      { id: uid(), name: "", type: "Music / DJ", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
      { id: uid(), name: "", type: "Hair & makeup", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" },
    ];
  }

  // Ensure the day-of timeline exists.
  if (!s.timeline || typeof s.timeline !== "object" || !Array.isArray(s.timeline.items)) {
    s.timeline = {
      ceremony: "15:00",
      items: [
        { id: uid(), offset: -120, label: "Permit window opens — setup begins", note: "Chairs, arch, florals; nothing may be left overnight", done: false },
        { id: uid(), offset: -90, label: "Florist & photographer arrive", note: "Set up before guests start showing", done: false },
        { id: uid(), offset: -60, label: "Guests begin arriving", note: "Street parking in La Jolla is tight — tell people to come early", done: false },
        { id: uid(), offset: -10, label: "Seat the families", note: "", done: false },
        { id: uid(), offset: 0, label: "Ceremony begins", note: "Processional", done: false },
        { id: uid(), offset: 25, label: "Vows, rings & pronouncement", note: "", done: false },
        { id: uid(), offset: 30, label: "Sign the license", note: "Officiant + at least one witness", done: false },
        { id: uid(), offset: 35, label: "Group photos at the bowl", note: "", done: false },
        { id: uid(), offset: 60, label: "Couple's portraits — golden hour", note: "Best light is the half hour before sunset", done: false },
        { id: uid(), offset: 100, label: "Breakdown & clear the park", note: "Everything out before the permit window closes", done: false },
        { id: uid(), offset: 180, label: "Dinner at Piazza Cucina Italiana", note: "6:00pm · 7731 Fay Ave, La Jolla · 858-412-3108 — confirm reservation name & headcount", done: false },
      ],
    };
  }

  // Apply the confirmed day-of timings to an existing saved timeline (matched by label,
  // so any other edits the couple made are left alone).
  if (s.timeline && Array.isArray(s.timeline.items)) {
    const retime = (match, offset, patch) => {
      const it = s.timeline.items.find((x) => x.label && match.test(x.label));
      if (it) {
        it.offset = offset;
        if (patch) Object.assign(it, patch);
      }
      return it;
    };
    retime(/setup begins|permit window opens/i, -120);
    retime(/florist|photographer arrive/i, -90);
    retime(/guests begin arriving|guests arrive/i, -60);
    const dinner = retime(/celebration dinner|dinner at/i, 180, {
      label: "Dinner at Piazza Cucina Italiana",
      note: "6:00pm · 7731 Fay Ave, La Jolla · 858-412-3108 — confirm reservation name & headcount",
    });
    if (!dinner) {
      s.timeline.items.push({
        id: uid(),
        offset: 180,
        label: "Dinner at Piazza Cucina Italiana",
        note: "6:00pm · 7731 Fay Ave, La Jolla · 858-412-3108 — confirm reservation name & headcount",
        done: false,
      });
    }
  }

  // Fill the celebration-dinner vendor card if it's still blank.
  if (Array.isArray(s.vendors)) {
    const dv = s.vendors.find((v) => /celebration dinner|dinner/i.test(v.type || "") && !(v.name || "").trim());
    if (dv) {
      dv.name = "Piazza Cucina Italiana";
      if (!dv.phone) dv.phone = "858-412-3108";
      if (!dv.note) dv.note = "7731 Fay Ave, La Jolla · 6:00pm Dec 30 · confirm headcount closer to the date";
    }
  }

  return s;
};

function WeddingDashboard() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("all");
  const [petals, setPetals] = useState([]);
  const [celebrate, setCelebrate] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const prevPct = useRef(null);
  const focusRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (hasStorage()) {
        try {
          const r = await window.storage.get(STORAGE_KEY);
          if (active && r && r.value) setState(migrateState(JSON.parse(r.value)));
        } catch (e) {
          /* first run — no saved state yet */
        }
      }
      if (active) setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !hasStorage()) return;
    const t = setTimeout(() => {
      window.storage.set(STORAGE_KEY, JSON.stringify(state), false).then(() => setSavedAt(Date.now())).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [state, loaded]);

  const allTasks = state.categories.flatMap((c) => c.tasks);
  const doneCount = allTasks.filter((t) => t.done).length;
  const total = allTasks.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  // Rain plumeria petals the moment the whole list hits 100%.
  useEffect(() => {
    if (!loaded) return;
    if (prevPct.current !== null && prevPct.current < 100 && pct === 100) {
      setPetals(
        Array.from({ length: 22 }, (_, i) => ({
          id: i + "-" + Date.now(),
          left: Math.random() * 100,
          delay: Math.random() * 1.3,
          dur: 3.4 + Math.random() * 2.6,
          size: 13 + Math.random() * 20,
          rot: (Math.random() * 2 - 1) * 540,
          drift: (Math.random() * 2 - 1) * 60,
          color: PETAL_COLORS[i % PETAL_COLORS.length],
          glyph: PETAL_GLYPHS[i % PETAL_GLYPHS.length],
        }))
      );
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 6000);
      prevPct.current = pct;
      return () => clearTimeout(t);
    }
    prevPct.current = pct;
  }, [pct, loaded]);

  const progressMsg =
    pct === 0 ? "Let's plan a wedding"
    : pct === 100 ? "You're ready — time to say \u201CI do\u201D"
    : pct < 25 ? "Just getting started"
    : pct < 50 ? "Making waves"
    : pct < 75 ? "Halfway to paradise"
    : "Almost to the aisle";

  const countdown = (() => {
    if (!state.weddingDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(state.weddingDate + "T00:00:00");
    const diff = Math.round((d - today) / 86400000);
    if (isNaN(diff)) return null;
    if (diff === 0) return "Today is the day";
    if (diff > 0) return diff + (diff === 1 ? " day to go" : " days to go");
    return "Married " + Math.abs(diff) + (Math.abs(diff) === 1 ? " day ago" : " days ago");
  })();

  const update = (fn) => setState((s) => fn(structuredClone(s)));

  const toggle = (cid, tid) =>
    update((s) => {
      const c = s.categories.find((x) => x.id === cid);
      const t = c.tasks.find((x) => x.id === tid);
      t.done = !t.done;
      return s;
    });

  const editTask = (cid, tid, key, val) =>
    update((s) => {
      const c = s.categories.find((x) => x.id === cid);
      const t = c.tasks.find((x) => x.id === tid);
      t[key] = val;
      return s;
    });

  const addTask = (cid) => {
    const nid = uid();
    focusRef.current = nid;
    update((s) => {
      const c = s.categories.find((x) => x.id === cid);
      c.tasks.push({ id: nid, title: "", note: "", due: "", done: false });
      return s;
    });
  };

  const removeTask = (cid, tid) =>
    update((s) => {
      const c = s.categories.find((x) => x.id === cid);
      c.tasks = c.tasks.filter((x) => x.id !== tid);
      return s;
    });

  const resetAll = () => {
    if (typeof window !== "undefined" && window.confirm("Reset the whole checklist back to the starting list? This clears everything you've checked or added.")) {
      setState(structuredClone(DEFAULT_STATE));
    }
  };

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = "wedding-plan-backup-" + stamp + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {
      /* ignore */
    }
  };

  const importData = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.categories)) throw new Error("bad file");
        if (window.confirm("Restore from this backup? It replaces what's currently on the dashboard.")) {
          setState(migrateState(data));
        }
      } catch (err) {
        if (typeof window !== "undefined") window.alert("That file didn't look like a wedding-plan backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const setGuest = (idx, key, val) =>
    update((s) => {
      s.guests[idx][key] = val;
      return s;
    });

  const cycleSide = (idx) =>
    update((s) => {
      const order = ["", "A", "B", "Both"];
      const cur = order.indexOf(s.guests[idx].side || "");
      s.guests[idx].side = order[(cur + 1) % order.length];
      return s;
    });

  const cycleRsvp = (idx) =>
    update((s) => {
      const order = ["", "invited", "yes", "no"];
      const cur = order.indexOf(s.guests[idx].rsvp || "");
      s.guests[idx].rsvp = order[(cur + 1) % order.length];
      return s;
    });

  const guests = state.guests || [];
  const guestFilled = guests.filter((g) => g.name.trim()).length;
  const sideA = guests.filter((g) => g.name.trim() && g.side === "A").length;
  const sideB = guests.filter((g) => g.name.trim() && g.side === "B").length;
  const sideBoth = guests.filter((g) => g.name.trim() && g.side === "Both").length;
  const initialA = (state.partnerA || "A").trim().charAt(0).toUpperCase() || "A";
  const initialB = (state.partnerB || "B").trim().charAt(0).toUpperCase() || "B";
  const sideLabel = (side) => (side === "A" ? initialA : side === "B" ? initialB : side === "Both" ? initialA + "&" + initialB : "+");
  const sideColor = (side) => (side === "A" ? "#E07CA3" : side === "B" ? "#5FA877" : side === "Both" ? "#A85C86" : "");

  const named = guests.filter((g) => g.name.trim());
  const rsvpYes = named.filter((g) => g.rsvp === "yes").length;
  const rsvpNo = named.filter((g) => g.rsvp === "no").length;
  const rsvpInvited = named.filter((g) => g.rsvp === "invited").length;
  const rsvpPending = named.length - rsvpYes - rsvpNo;
  const rsvpLabel = (r) => (r === "yes" ? "Yes" : r === "no" ? "No" : r === "invited" ? "Sent" : "RSVP");
  const rsvpColor = (r) => (r === "yes" ? "#5FA877" : r === "no" ? "#B08096" : r === "invited" ? "#E07CA3" : "");

  // ---- Budget + vendors ----
  const num = (v) => {
    const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  };
  const fmt = (n) => "$" + Math.round(n).toLocaleString();

  const budget = state.budget || { total: "", items: [] };
  const bItems = budget.items || [];
  const vendors = state.vendors || [];

  const itemsEst = bItems.reduce((a, i) => a + num(i.est), 0);
  const itemsPaid = bItems.reduce((a, i) => a + num(i.paid), 0);
  const vendCost = vendors.reduce((a, v) => a + num(v.cost), 0);
  const vendPaid = vendors.reduce((a, v) => a + num(v.deposit), 0);
  const totalEst = itemsEst + vendCost;
  const totalPaid = itemsPaid + vendPaid;
  const owed = Math.max(totalEst - totalPaid, 0);
  const bTotal = num(budget.total);
  const remaining = bTotal - totalEst;
  const spendBase = Math.max(bTotal, totalEst, 1);
  const paidW = (totalPaid / spendBase) * 100;
  const commitW = (Math.max(totalEst - totalPaid, 0) / spendBase) * 100;
  const budgetMark = bTotal > 0 ? (bTotal / spendBase) * 100 : null;
  const vendorsBooked = vendors.filter((v) => v.booked).length;

  // Command-center derived values.
  const daysToGo = (() => {
    if (!state.weddingDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(state.weddingDate + "T00:00:00");
    const diff = Math.round((d - today) / 86400000);
    return isNaN(diff) ? null : diff;
  })();
  const firstTodo = allTasks.find((t) => !t.done && t.title.trim());

  // ---- Due dates ----
  const todayMid = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const daysUntil = (due) => {
    if (!due) return null;
    const d = new Date(due + "T00:00:00");
    if (isNaN(d)) return null;
    return Math.round((d - todayMid) / 86400000);
  };
  const dueInfo = (task) => {
    const n = daysUntil(task.due);
    if (n === null) return null;
    if (task.done) return { cls: "done", label: "done" };
    if (n < 0) return { cls: "over", label: Math.abs(n) === 1 ? "1 day overdue" : Math.abs(n) + " days overdue" };
    if (n === 0) return { cls: "over", label: "due today" };
    if (n <= 14) return { cls: "soon", label: n === 1 ? "due tomorrow" : "due in " + n + " days" };
    return { cls: "", label: "due " + new Date(task.due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) };
  };
  const overdueCount = allTasks.filter((t) => !t.done && t.due && daysUntil(t.due) < 0).length;
  const soonCount = allTasks.filter((t) => {
    if (t.done || !t.due) return false;
    const n = daysUntil(t.due);
    return n !== null && n >= 0 && n <= 14;
  }).length;

  const setBudgetTotal = (val) =>
    update((s) => {
      if (!s.budget) s.budget = { total: "", items: [] };
      s.budget.total = val;
      return s;
    });
  const setBItem = (idx, key, val) =>
    update((s) => {
      s.budget.items[idx][key] = val;
      return s;
    });
  const addBItem = () =>
    update((s) => {
      s.budget.items.push({ id: uid(), label: "", est: "", paid: "" });
      return s;
    });
  const removeBItem = (idx) =>
    update((s) => {
      s.budget.items.splice(idx, 1);
      return s;
    });

  const setVendor = (idx, key, val) =>
    update((s) => {
      s.vendors[idx][key] = val;
      return s;
    });
  const toggleBooked = (idx) =>
    update((s) => {
      s.vendors[idx].booked = !s.vendors[idx].booked;
      return s;
    });
  const addVendor = () =>
    update((s) => {
      s.vendors.push({ id: uid(), name: "", type: "", phone: "", email: "", cost: "", deposit: "", booked: false, note: "" });
      return s;
    });
  const removeVendor = (idx) =>
    update((s) => {
      s.vendors.splice(idx, 1);
      return s;
    });

  // ---- Day-of timeline ----
  const SUNSET_MIN = 16 * 60 + 50; // ~4:50pm on Dec 30 in San Diego
  const PERMIT_MIN = 240; // 4-hour permit window incl. setup & breakdown
  const timeline = state.timeline || { ceremony: "15:00", items: [] };
  const tItems = (timeline.items || []).slice().sort((a, b) => a.offset - b.offset);
  const ceremonyMin = (() => {
    const [h, m] = String(timeline.ceremony || "15:00").split(":").map(Number);
    return (isNaN(h) ? 15 : h) * 60 + (isNaN(m) ? 0 : m);
  })();
  const toClock = (mins) => {
    let v = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(v / 60);
    const m = v % 60;
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + String(m).padStart(2, "0") + ampm;
  };
  const parkItems = tItems.filter((i) => i.label !== "Celebration dinner");
  const parkStart = parkItems.length ? ceremonyMin + parkItems[0].offset : ceremonyMin;
  const parkEnd = parkItems.length ? ceremonyMin + parkItems[parkItems.length - 1].offset : ceremonyMin;
  const parkUsed = Math.max(parkEnd - parkStart, 0);
  const permitOver = parkUsed > PERMIT_MIN;
  const darkItems = tItems.filter((i) => ceremonyMin + i.offset > SUNSET_MIN && i.label !== "Celebration dinner");
  const goldenStart = SUNSET_MIN - 30;

  const setCeremony = (val) =>
    update((s) => {
      if (!s.timeline) s.timeline = { ceremony: "15:00", items: [] };
      s.timeline.ceremony = val;
      return s;
    });
  const setTItem = (id, key, val) =>
    update((s) => {
      const it = s.timeline.items.find((x) => x.id === id);
      if (it) it[key] = key === "offset" ? parseInt(val, 10) || 0 : val;
      return s;
    });
  const toggleTItem = (id) =>
    update((s) => {
      const it = s.timeline.items.find((x) => x.id === id);
      if (it) it.done = !it.done;
      return s;
    });
  const addTItem = () =>
    update((s) => {
      const last = s.timeline.items.reduce((a, i) => Math.max(a, i.offset), 0);
      s.timeline.items.push({ id: uid(), offset: last + 15, label: "", note: "", done: false });
      return s;
    });
  const removeTItem = (id) =>
    update((s) => {
      s.timeline.items = s.timeline.items.filter((x) => x.id !== id);
      return s;
    });

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

.wd-root {
  --paper:#E9F2E6; --paper-2:#FCF6F8; --ink:#33503F; --ink-soft:#6E8676;
  --line:#DBE6DA; --clay:#E07CA3; --clay-deep:#C85F89; --sage:#5FA877; --gold:#86AC82;
  font-family:'Inter',sans-serif; color:var(--ink);
  background:
    radial-gradient(98% 56% at 50% -12%, rgba(245,198,216,.85) 0%, rgba(246,205,222,0) 60%),
    radial-gradient(72% 50% at 14% 12%, rgba(232,150,182,.26) 0%, rgba(232,150,182,0) 58%),
    radial-gradient(80% 55% at 86% 90%, rgba(150,200,160,.42) 0%, rgba(150,200,160,0) 60%),
    radial-gradient(74% 52% at 28% 118%, rgba(168,208,168,.36) 0%, rgba(168,208,168,0) 60%),
    linear-gradient(180deg, #F8E7EE 0%, #F4ECE8 38%, #E9F2E5 78%, #E2EFDF 100%);
  background-attachment:fixed;
  min-height:100vh; padding:48px 20px 72px; box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
}
.wd-root *{box-sizing:border-box;}
.wd-wrap{max-width:840px; margin:0 auto;}

.wd-mast{text-align:center; margin-bottom:38px; position:relative;}
.wd-kicker{font-family:'Inter'; font-size:11px; letter-spacing:.42em; text-transform:uppercase;
  color:var(--clay); font-weight:600; margin-bottom:14px; padding-left:.42em;}
.wd-names{display:flex; align-items:center; justify-content:center; gap:18px; flex-wrap:wrap;}
.wd-name-in{font-family:'Inter',sans-serif; font-size:clamp(34px,7vw,58px); font-weight:500;
  line-height:1.25; color:var(--ink); background:transparent; border:none; text-align:center;
  width:auto; min-width:60px; max-width:42vw; outline:none; padding:6px 4px;
  border-bottom:1.5px solid transparent; transition:border-color .2s;}
.wd-name-in:focus{border-bottom-color:var(--clay);}
.wd-amp{font-family:'Inter',sans-serif; font-style:italic; font-size:clamp(26px,5vw,42px);
  color:var(--clay); font-weight:400;}
.wd-namebox{display:inline-flex; flex-direction:column; align-items:center;}
.wd-namelabel{font-size:9.5px; letter-spacing:.28em; text-transform:uppercase; color:var(--ink-soft);
  margin-top:6px;}

.wd-daterow{display:flex; align-items:center; justify-content:center; gap:14px; margin-top:24px; flex-wrap:wrap;}
.wd-date-in{font-family:'Inter'; font-size:14px; color:var(--ink); background:var(--paper-2);
  border:1px solid var(--line); border-radius:999px; padding:9px 16px; outline:none; cursor:pointer;
  font-weight:500; transition:border-color .2s; color-scheme:light;}
.wd-date-in:focus{border-color:var(--clay);}
.wd-count{font-family:'Inter',sans-serif; font-style:italic; font-size:18px; color:var(--clay-deep);
  display:inline-flex; align-items:center; gap:8px;}
.wd-venue{margin-top:16px; font-family:'Inter',sans-serif; font-size:11px; font-weight:600;
  letter-spacing:.22em; text-transform:uppercase; color:var(--ink-soft);}
.wd-hero{position:relative; border-radius:18px; overflow:hidden; margin:24px 0 36px; line-height:0;
  border:1px solid rgba(255,255,255,.6); box-shadow:0 20px 46px -28px rgba(70,96,76,.6);}
.wd-hero svg{display:block; width:100%; height:auto;}
.wd-hero-cap{position:absolute; left:18px; bottom:14px; font-family:'Inter',sans-serif; font-style:italic;
  font-size:15px; color:#fff; text-shadow:0 1px 5px rgba(50,70,55,.55); letter-spacing:.01em; line-height:1;}
.wd-photo{position:relative; width:470px; max-width:92%; margin:0 auto 40px; background:#fff; padding:13px 13px 0;
  border-radius:5px; box-shadow:0 20px 44px -22px rgba(70,96,76,.65); transform:rotate(-1.8deg);
  transition:transform .3s cubic-bezier(.2,.7,.2,1);}
.wd-photo:hover{transform:rotate(0deg);}
.wd-photo::before{content:''; position:absolute; top:-11px; left:50%; transform:translateX(-50%) rotate(-2deg);
  width:96px; height:26px; background:linear-gradient(180deg, rgba(224,124,163,.55), rgba(95,168,119,.5));
  border-radius:2px; box-shadow:0 2px 5px rgba(70,96,76,.18);}
.wd-photo img{display:block; width:100%; border-radius:2px;}
.wd-photo-cap{font-family:'Inter',sans-serif; font-style:italic; font-size:18px; color:var(--ink); text-align:center;
  padding:11px 6px 14px; border:none; outline:none; width:100%; background:transparent;}
.wd-photo-cap::placeholder{color:#C6B2BD;}

.wd-meter{background:linear-gradient(135deg, rgba(255,255,255,.5), rgba(214,238,220,.55)); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.65); border-radius:16px;
  padding:22px 26px; margin-bottom:40px; display:flex; align-items:center; gap:26px;
  box-shadow:0 1px 0 rgba(255,255,255,.7) inset, 0 18px 40px -26px rgba(70,96,76,.55);}
.wd-pct{font-family:'Inter',sans-serif; font-size:46px; font-weight:500; line-height:.9; color:var(--clay);
  min-width:96px;}
.wd-pct small{font-size:18px; color:var(--ink-soft); font-weight:400;}
.wd-meter-mid{flex:1;}
.wd-meter-label{font-size:13px; color:var(--ink-soft); margin-bottom:9px; letter-spacing:.02em;}
.wd-meter-label b{color:var(--ink); font-weight:600;}
.wd-bar{height:9px; border-radius:99px; background:#EAD9E0; overflow:hidden;}
.wd-fill{height:100%; border-radius:99px;
  background:linear-gradient(90deg,var(--clay),#9CCBA6 58%,var(--sage)); transition:width .5s cubic-bezier(.4,0,.1,1);}

.wd-filters{display:flex; gap:8px; justify-content:center; margin-bottom:34px;}
.wd-chip{font-family:'Inter'; font-size:12px; letter-spacing:.04em; font-weight:600;
  text-transform:uppercase; padding:7px 16px; border-radius:999px; cursor:pointer;
  border:1px solid var(--line); background:transparent; color:var(--ink-soft); transition:all .18s;}
.wd-chip:hover{border-color:var(--clay); color:var(--clay);}
.wd-chip.on{background:var(--ink); border-color:var(--ink); color:var(--paper-2);}

.wd-sec{margin-bottom:30px; opacity:0; animation:wdUp .55s cubic-bezier(.2,.7,.2,1) forwards;}
@keyframes wdUp{from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:none;}}
.wd-sechead{display:flex; align-items:center; gap:14px; padding-bottom:13px;
  border-bottom:1.5px solid var(--line); margin-bottom:6px;}
.wd-secnum{font-family:'Inter',sans-serif; font-style:italic; font-size:15px; color:var(--gold); font-weight:500;}
.wd-secicon{width:34px; height:34px; border-radius:50%; background:var(--paper-2); border:1px solid var(--line);
  display:flex; align-items:center; justify-content:center; color:var(--clay); flex-shrink:0;}
.wd-sectitle{font-family:'Inter',sans-serif; font-size:23px; font-weight:500; flex:1; color:var(--ink);}
.wd-seccount{font-size:12px; color:var(--ink-soft); font-weight:600; letter-spacing:.03em;}

.wd-task{display:flex; align-items:flex-start; gap:14px; padding:13px 8px 13px 4px;
  border-bottom:1px solid #E5DEE2; transition:background .15s;}
.wd-task:hover{background:rgba(255,255,255,.55);}
.wd-task:last-of-type{border-bottom:none;}
.wd-check{width:23px; height:23px; border-radius:7px; border:1.5px solid #C7D3C7; background:var(--paper-2);
  position:relative;
  flex-shrink:0; margin-top:1px; cursor:pointer; display:flex; align-items:center; justify-content:center;
  color:#fff; transition:all .2s;}
.wd-check.done{background:var(--sage); border-color:var(--sage);}
.wd-check svg{opacity:0; transform:scale(.4); transition:all .2s;}
.wd-check.done svg{opacity:1; transform:scale(1);}
.wd-tbody{flex:1; min-width:0;}
.wd-title-in{font-family:'Inter'; font-size:15.5px; font-weight:600; color:var(--ink);
  background:transparent; border:none; outline:none; width:100%; padding:0; letter-spacing:.01em;}
.wd-title-in::placeholder{color:#BBA7B2; font-weight:500; font-style:italic;}
.wd-title-in.done{text-decoration:line-through; text-decoration-color:#CBBBC6; color:var(--ink-soft); font-weight:500;}
.wd-note-in{font-family:'Inter'; font-size:12.5px; color:var(--ink-soft); background:transparent;
  border:none; outline:none; width:100%; padding:2px 0 0; margin-top:2px;}
.wd-note-in::placeholder{color:#C6B2BD; font-style:italic;}
.wd-del{opacity:0; background:transparent; border:none; cursor:pointer; color:#C6A9B4; padding:4px;
  flex-shrink:0; transition:all .15s; border-radius:6px;}
.wd-task:hover .wd-del{opacity:1;}
.wd-del:hover{color:var(--clay-deep); background:rgba(224,124,163,.14);}

.wd-add{display:inline-flex; align-items:center; gap:7px; margin-top:10px; font-family:'Inter';
  font-size:12.5px; font-weight:600; letter-spacing:.03em; color:var(--clay); background:transparent;
  border:none; cursor:pointer; padding:6px 4px; transition:color .15s;}
.wd-add:hover{color:var(--clay-deep);}

.wd-foot{text-align:center; margin-top:50px; padding-top:26px; border-top:1.5px solid var(--line);}
.wd-foot-mark{font-family:'Inter',sans-serif; font-style:italic; color:var(--gold); font-size:20px; margin-bottom:12px;
  display:inline-block; animation:wdBob 4.8s ease-in-out infinite;}
@keyframes wdBob{0%,100%{transform:translateY(0) rotate(-6deg);} 50%{transform:translateY(-6px) rotate(8deg);}}
.wd-reset{font-family:'Inter'; font-size:11.5px; letter-spacing:.06em; text-transform:uppercase;
  color:var(--ink-soft); background:transparent; border:none; cursor:pointer; transition:color .15s; font-weight:600;}
.wd-reset:hover{color:var(--clay);}

/* Living progress message */
.wd-meter-msg{font-family:'Inter',sans-serif; font-style:italic; font-size:18px; line-height:1.2;
  color:var(--clay-deep); margin-bottom:7px; letter-spacing:.01em; transition:color .3s;}
.wd-meter-msg.full{color:var(--sage);}

/* Water-ripple ring when a task is checked */
.wd-check::after{content:''; position:absolute; inset:-3px; border-radius:9px;
  border:2px solid var(--sage); opacity:0; pointer-events:none;}
.wd-check.done::after{animation:wdRing .6s ease-out;}
@keyframes wdRing{0%{opacity:.85; transform:scale(.55);} 100%{opacity:0; transform:scale(1.85);}}

/* Plumeria celebration shower */
.wd-celebrate{position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:60;}
.wd-petal{position:absolute; top:-8%; opacity:0; will-change:transform,opacity;
  animation-name:wdFall; animation-timing-function:cubic-bezier(.45,.05,.55,.95); animation-fill-mode:forwards;
  filter:drop-shadow(0 1px 2px rgba(58,42,55,.12));}
@keyframes wdFall{
  0%{opacity:0; transform:translate(0,-12vh) rotate(0deg);}
  8%{opacity:1;}
  88%{opacity:1;}
  100%{opacity:0; transform:translate(var(--drift), 112vh) rotate(var(--rot));}
}

@media (max-width:560px){
  .wd-meter{flex-direction:column; align-items:flex-start; gap:16px;}
  .wd-meter-mid{width:100%;}
  .wd-name-in{max-width:38vw;}
  .wd-glist{grid-template-columns:1fr !important;}
  .wd-stats{grid-template-columns:1fr 1fr !important;}
  .wd-vtype{width:auto !important; flex:1;}
  .wd-cc{grid-template-columns:1fr 1fr !important;}
}

/* Command center */
.wd-cc{display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px;}
.wd-cc-tile{background:linear-gradient(135deg, rgba(255,255,255,.5), rgba(214,238,220,.5));
  backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.6); border-radius:14px; padding:15px 16px;
  box-shadow:0 12px 30px -24px rgba(70,96,76,.6);}
.wd-cc-tile .k{font-size:10px; letter-spacing:.09em; text-transform:uppercase; color:var(--ink-soft); font-weight:700; margin-bottom:8px;}
.wd-cc-tile .v{font-family:'Inter',sans-serif; font-size:27px; font-weight:500; color:var(--ink); line-height:1;}
.wd-cc-tile .v small{font-size:13px; color:var(--ink-soft); font-weight:400; font-family:'Inter',sans-serif;}
.wd-cc-tile .v.pink{color:var(--clay-deep);} .wd-cc-tile .v.green{color:var(--sage);}
.wd-cc-tile .s{font-size:11.5px; color:var(--ink-soft); font-weight:600; margin-top:7px;}
.wd-cc-tile .s.over{color:var(--clay-deep);} .wd-cc-tile .s.good{color:var(--sage);}
.wd-next{font-family:'Inter',sans-serif; font-style:italic; font-size:15.5px; color:var(--clay-deep);
  margin:0 0 30px; text-align:center;}
.wd-next b{font-style:normal; font-weight:600; font-family:'Inter',sans-serif; font-size:14px;}

/* Save + backup */
.wd-save{font-size:11px; letter-spacing:.05em; color:var(--sage); font-weight:700; text-transform:uppercase; margin-bottom:14px;}
.wd-backup{display:flex; gap:10px; justify-content:center; margin-bottom:18px; flex-wrap:wrap;}
.wd-bbtn{font-family:'Inter',sans-serif; font-size:11.5px; letter-spacing:.05em; text-transform:uppercase;
  font-weight:700; padding:9px 17px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,.5);
  color:var(--ink-soft); cursor:pointer; transition:all .15s;}
.wd-bbtn:hover{border-color:var(--clay); color:var(--clay);}
.wd-backup-note{font-size:11px; color:var(--ink-soft); margin-bottom:20px; opacity:.85;}

/* ---------- Dark mode ---------- */
.wd-root.dark{
  --paper:#182420; --paper-2:#1E2C27; --ink:#EDE4E8; --ink-soft:#9FB3A6;
  --line:#33453D; --clay:#F3A0C0; --clay-deep:#F7B9D1; --sage:#7FC898; --gold:#9CCBA6;
  background:
    radial-gradient(98% 56% at 50% -12%, rgba(196,92,134,.34) 0%, rgba(196,92,134,0) 62%),
    radial-gradient(72% 50% at 14% 10%, rgba(150,70,110,.28) 0%, rgba(150,70,110,0) 58%),
    radial-gradient(80% 55% at 88% 92%, rgba(52,120,88,.42) 0%, rgba(52,120,88,0) 62%),
    radial-gradient(74% 52% at 24% 118%, rgba(40,96,76,.42) 0%, rgba(40,96,76,0) 60%),
    linear-gradient(180deg, #241C24 0%, #1E2422 42%, #16211D 78%, #121C19 100%);
}
.wd-root.dark .wd-meter{background:linear-gradient(135deg, rgba(255,255,255,.05), rgba(120,200,150,.09));
  border-color:rgba(255,255,255,.09); box-shadow:0 1px 0 rgba(255,255,255,.06) inset, 0 20px 44px -26px #000;}
.wd-root.dark .wd-bar,.wd-root.dark .wd-gbar,.wd-root.dark .wd-spend{background:#2B3A34;}
.wd-root.dark .wd-spend-est{background:#8E4E70;}
.wd-root.dark .wd-spend-mark{background:#EDE4E8;}
.wd-root.dark .wd-task{border-bottom-color:#2A3A33;}
.wd-root.dark .wd-task:hover{background:rgba(255,255,255,.035);}
.wd-root.dark .wd-check{border-color:#3E5449; background:#22322C;}
.wd-root.dark .wd-title-in::placeholder,.wd-root.dark .wd-note-in::placeholder,
.wd-root.dark .wd-gname::placeholder,.wd-root.dark .wd-li-label::placeholder,
.wd-root.dark .wd-vname::placeholder,.wd-root.dark .wd-tllabel::placeholder,
.wd-root.dark .wd-tlnote::placeholder,.wd-root.dark .wd-gmeal::placeholder,
.wd-root.dark .wd-vnote::placeholder,.wd-root.dark .wd-photo-cap::placeholder{color:#6E8478;}
.wd-root.dark .wd-title-in.done{text-decoration-color:#5E7368;}
.wd-root.dark .wd-del{color:#8A6C79;}
.wd-root.dark .wd-del:hover{background:rgba(243,160,192,.14);}
.wd-root.dark .wd-chip.on{background:var(--clay); border-color:var(--clay); color:#1B2622;}
.wd-root.dark .wd-grow,.wd-root.dark .wd-litem{border-bottom-color:#2A3A33;}
.wd-root.dark .wd-gnum{color:#6E8478;}
.wd-root.dark .wd-gpill,.wd-root.dark .wd-stat,
.wd-root.dark .wd-vend,.wd-root.dark .wd-gside,.wd-root.dark .wd-grsvp,
.wd-root.dark .wd-mwrap input,.wd-root.dark .wd-tloff,.wd-root.dark .wd-bbtn{
  background:rgba(255,255,255,.045); border-color:var(--line);}
.wd-root.dark .wd-cc-tile{background:linear-gradient(135deg, rgba(255,255,255,.05), rgba(120,200,150,.08));
  border-color:rgba(255,255,255,.09); box-shadow:0 14px 32px -26px #000;}
.wd-root.dark .wd-gside,.wd-root.dark .wd-grsvp{color:#7E9488;}
.wd-root.dark .wd-tl-head input[type="time"]{background:rgba(255,255,255,.05); border-color:var(--line); color-scheme:dark;}
.wd-root.dark .wd-date-in{background:rgba(255,255,255,.05); border-color:var(--line); color-scheme:dark;}
.wd-root.dark .wd-due-in{color-scheme:dark;}
.wd-root.dark .wd-due-in:hover,.wd-root.dark .wd-due-in:focus{background:rgba(255,255,255,.05);}
.wd-root.dark .wd-duebadge{background:rgba(255,255,255,.05); border-color:var(--line); color:var(--ink-soft);}
.wd-root.dark .wd-duebadge.soon{background:rgba(214,170,90,.14); border-color:rgba(214,170,90,.34); color:#E3BE7C;}
.wd-root.dark .wd-duebadge.over{background:#B85480; border-color:transparent; color:#fff;}
.wd-root.dark .wd-warn.ok{background:rgba(127,200,152,.1); border-color:rgba(127,200,152,.28); color:#8FD3A6;}
.wd-root.dark .wd-warn.bad{background:rgba(243,160,192,.1); border-color:rgba(243,160,192,.3); color:#F3A0C0;}
.wd-root.dark .wd-warn.sun{background:rgba(214,170,90,.11); border-color:rgba(214,170,90,.3); color:#E3BE7C;}
.wd-root.dark .wd-tlmark{color:#E3BE7C;}
.wd-root.dark .wd-tlmark::before{background:linear-gradient(90deg,rgba(227,190,124,.5),transparent);}
.wd-root.dark .wd-tltime.dark{color:#8FA6C4;}
.wd-root.dark .wd-tldot i{background:#22322C;}
.wd-root.dark .wd-tl::before{opacity:.5;
  background:linear-gradient(180deg, var(--clay) 0%, #C29A6E 55%, #8FA6C4 100%);}
.wd-root.dark .wd-photo{background:#F1EAEC;}
.wd-root.dark .wd-photo-cap{color:#2A2430;}
.wd-root.dark .wd-hero{border-color:rgba(255,255,255,.1); box-shadow:0 22px 48px -26px #000;}
.wd-root.dark .wd-hero svg{filter:saturate(.9) brightness(.6) contrast(1.05) hue-rotate(-6deg);}
.wd-root.dark .wd-hero::after{content:''; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(180deg, rgba(40,26,44,.5) 0%, rgba(20,32,28,.34) 55%, rgba(14,24,20,.5) 100%);}
.wd-root.dark .wd-hero-cap{color:#F6E9EE; text-shadow:0 1px 8px rgba(0,0,0,.7);}
.wd-root.dark .wd-vtype{color:var(--sage);}
.wd-root.dark .wd-vbal{color:var(--clay);}
.wd-root.dark .wd-vbal.clear{color:var(--sage);}
.wd-root.dark .wd-secicon{background:rgba(255,255,255,.05) !important;}
.wd-root.dark .wd-save{color:var(--sage);}

/* Theme toggle */
.wd-theme{position:absolute; top:0; right:0; width:38px; height:38px; border-radius:50%;
  border:1px solid var(--line); background:rgba(255,255,255,.4); color:var(--ink-soft); cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:all .2s;}
.wd-theme:hover{color:var(--clay); border-color:var(--clay); transform:rotate(-18deg);}
.wd-root.dark .wd-theme{background:rgba(255,255,255,.06);}

/* Day-of timeline */
.wd-tl-head{display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:14px 0 6px; font-size:13px;
  color:var(--ink-soft); font-weight:600;}
.wd-tl-head input[type="time"]{font-family:'Inter',sans-serif; font-size:21px; font-weight:500; color:var(--ink);
  background:rgba(255,255,255,.5); border:1px solid var(--line); border-radius:10px; padding:5px 11px;
  outline:none; cursor:pointer; color-scheme:light; transition:border-color .2s;}
.wd-tl-head input[type="time"]:focus{border-color:var(--clay);}
.wd-warn{display:flex; gap:9px; align-items:flex-start; font-size:12.5px; font-weight:600; line-height:1.45;
  border-radius:11px; padding:10px 13px; margin:10px 0 0;}
.wd-warn.ok{background:rgba(95,168,119,.12); border:1px solid rgba(95,168,119,.3); color:#3E7A56;}
.wd-warn.bad{background:rgba(200,95,137,.12); border:1px solid rgba(200,95,137,.32); color:var(--clay-deep);}
.wd-warn.sun{background:#FBF1DE; border:1px solid #E8D2A8; color:#96682A;}
.wd-tl{margin-top:20px; position:relative;}
.wd-tl::before{content:''; position:absolute; left:69px; top:6px; bottom:16px; width:2px;
  background:linear-gradient(180deg, var(--clay) 0%, #E8C9A8 55%, #7E93B8 100%); opacity:.45; border-radius:2px;}
.wd-tlrow{display:flex; align-items:flex-start; gap:0; padding:9px 0; position:relative;}
.wd-tltime{width:62px; flex-shrink:0; text-align:right; padding-right:0; font-family:'Inter',sans-serif;
  font-size:14px; font-weight:500; color:var(--ink); padding-top:2px; font-variant-numeric:tabular-nums;}
.wd-tltime.dark{color:#7E93B8;}
.wd-tldot{width:16px; flex-shrink:0; display:flex; justify-content:center; padding-top:6px; margin:0 8px 0 0;
  position:relative; z-index:1;}
.wd-tldot i{width:11px; height:11px; border-radius:50%; background:var(--paper-2); border:2.5px solid var(--clay);
  display:block; cursor:pointer; transition:all .2s;}
.wd-tldot i.done{background:var(--sage); border-color:var(--sage);}
.wd-tlbody{flex:1; min-width:0; padding-left:4px;}
.wd-tllabel{font-family:'Inter',sans-serif; font-size:14.5px; font-weight:600; color:var(--ink);
  background:transparent; border:none; outline:none; width:100%; padding:1px 0;}
.wd-tllabel.done{text-decoration:line-through; text-decoration-color:#CBBBC6; color:var(--ink-soft);}
.wd-tllabel::placeholder{color:#C6B2BD; font-style:italic;}
.wd-tlnote{font-family:'Inter',sans-serif; font-size:12px; color:var(--ink-soft); background:transparent;
  border:none; outline:none; width:100%; padding:2px 0 0;}
.wd-tlnote::placeholder{color:#CBBBC6; font-style:italic;}
.wd-tloff{font-family:'Inter',sans-serif; font-size:11px; font-weight:700; color:var(--ink-soft);
  background:rgba(255,255,255,.5); border:1px solid var(--line); border-radius:7px; width:56px; text-align:right;
  padding:3px 6px; outline:none; flex-shrink:0; margin-left:8px; transition:border-color .2s;}
.wd-tloff:focus{border-color:var(--clay);}
.wd-tlmark{display:flex; align-items:center; gap:10px; margin:6px 0 6px 78px; font-size:11px; font-weight:800;
  letter-spacing:.08em; text-transform:uppercase; color:#96682A;}
.wd-tlmark::before{content:''; flex:1; height:1px; background:linear-gradient(90deg,#E8D2A8,transparent); max-width:120px;}

/* Due dates */
.wd-duerow{display:flex; align-items:center; gap:9px; margin-top:6px;}
.wd-due-in{font-family:'Inter',sans-serif; font-size:11.5px; font-weight:600; color:var(--ink-soft);
  background:transparent; border:1px solid transparent; border-radius:7px; padding:3px 5px; outline:none;
  cursor:pointer; color-scheme:light; transition:all .15s; opacity:.75;}
.wd-due-in:hover,.wd-due-in:focus{border-color:var(--line); background:rgba(255,255,255,.5); opacity:1;}
.wd-duebadge{font-size:10px; font-weight:800; letter-spacing:.06em; text-transform:uppercase;
  padding:3px 9px; border-radius:999px; background:rgba(255,255,255,.55); border:1px solid var(--line); color:var(--ink-soft);}
.wd-duebadge.soon{color:#B07A2E; border-color:#E8D2A8; background:#FBF1DE;}
.wd-duebadge.over{color:#fff; border-color:transparent; background:var(--clay-deep);}

/* RSVP */
.wd-grsvp{min-width:52px; height:24px; flex-shrink:0; border-radius:7px; border:1px solid var(--line);
  background:rgba(255,255,255,.5); cursor:pointer; font-family:'Inter',sans-serif; font-size:10.5px;
  font-weight:800; letter-spacing:.04em; color:#B6A2AC; transition:all .15s; padding:0 8px; text-transform:uppercase;}
.wd-grsvp:hover{border-color:var(--clay);}
.wd-grsvp.set{color:#fff; border-color:transparent;}
.wd-gmeal{font-family:'Inter',sans-serif; font-size:11.5px; color:var(--ink-soft); background:transparent;
  border:none; border-bottom:1px solid transparent; outline:none; width:76px; flex-shrink:0; padding:2px 0; transition:border-color .15s;}
.wd-gmeal:hover,.wd-gmeal:focus{border-bottom-color:var(--line);}
.wd-gmeal::placeholder{color:#CBBBC6; font-style:italic;}

/* Guest list */
.wd-gcap{font-size:12px; color:var(--ink-soft); font-weight:600; letter-spacing:.03em;}
.wd-gtally{display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 6px;}
.wd-gpill{font-size:11px; font-weight:700; letter-spacing:.04em; padding:5px 11px; border-radius:999px;
  border:1px solid var(--line); color:var(--ink-soft); background:rgba(255,255,255,.4);}
.wd-gpill b{font-weight:700;}
.wd-gbar{height:7px; border-radius:99px; background:#EAD9E0; overflow:hidden; margin:10px 0 18px;}
.wd-gbar-fill{height:100%; border-radius:99px; background:linear-gradient(90deg,var(--sage),var(--clay)); transition:width .45s cubic-bezier(.4,0,.1,1);}
.wd-glist{display:grid; grid-template-columns:1fr; gap:0;}
.wd-grow{display:flex; align-items:center; gap:10px; padding:7px 2px; border-bottom:1px solid #E5DEE2;}
.wd-gnum{font-family:'Inter',sans-serif; font-style:italic; font-size:12px; color:#BBA7B2; width:22px;
  text-align:right; flex-shrink:0; font-variant-numeric:tabular-nums;}
.wd-gname{font-family:'Inter'; font-size:14px; font-weight:500; color:var(--ink); background:transparent;
  border:none; outline:none; flex:1; min-width:0; padding:2px 0;}
.wd-gname::placeholder{color:#CBBBC6; font-style:italic;}
.wd-gside{min-width:32px; height:24px; flex-shrink:0; border-radius:7px; border:1px solid var(--line);
  background:rgba(255,255,255,.5); cursor:pointer; font-family:'Inter'; font-size:11px; font-weight:700;
  letter-spacing:.02em; color:#B6A2AC; transition:all .15s; padding:0 7px;}
.wd-gside:hover{border-color:var(--clay);}
.wd-gside.set{color:#fff; border-color:transparent;}

/* Budget */
.wd-budline{display:flex; align-items:center; gap:10px; margin:14px 0 4px; font-size:13px; color:var(--ink-soft); font-weight:600;}
.wd-budline input{font-family:'Inter',sans-serif; font-size:22px; font-weight:500; color:var(--ink); background:transparent;
  border:none; border-bottom:1.5px solid var(--line); outline:none; width:130px; padding:2px 2px 3px; transition:border-color .2s;}
.wd-budline input:focus{border-bottom-color:var(--clay);}
.wd-stats{display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:16px 0 8px;}
.wd-stat{background:rgba(255,255,255,.45); border:1px solid var(--line); border-radius:12px; padding:11px 13px;}
.wd-stat span{display:block; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink-soft); font-weight:700; margin-bottom:4px;}
.wd-stat b{font-family:'Inter',sans-serif; font-size:19px; font-weight:500; color:var(--ink); letter-spacing:.01em;}
.wd-stat.good b{color:var(--sage);} .wd-stat.over b{color:var(--clay-deep);}
.wd-spend{position:relative; height:12px; border-radius:99px; background:#EAD9E0; overflow:hidden; margin:14px 0 8px; display:flex;}
.wd-spend-paid{height:100%; background:var(--sage); transition:width .45s cubic-bezier(.4,0,.1,1);}
.wd-spend-est{height:100%; background:#F3B9D0; transition:width .45s cubic-bezier(.4,0,.1,1);}
.wd-spend-mark{position:absolute; top:-3px; bottom:-3px; width:2px; background:var(--ink); opacity:.5;}
.wd-legend{display:flex; gap:16px; flex-wrap:wrap; font-size:11.5px; color:var(--ink-soft); font-weight:600; margin-bottom:6px;}
.wd-legend i{display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; vertical-align:-1px;}
.wd-note-line{font-size:11.5px; color:var(--ink-soft); font-style:italic; margin:2px 0 4px;}
.wd-litem{display:flex; align-items:center; gap:10px; padding:8px 2px; border-bottom:1px solid #E5DEE2;}
.wd-litem .wd-li-label{font-family:'Inter'; font-size:14px; font-weight:600; color:var(--ink); background:transparent; border:none; outline:none; flex:1; min-width:0; padding:2px 0;}
.wd-litem .wd-li-label::placeholder{color:#C6B2BD; font-style:italic;}
.wd-mwrap{display:inline-flex; align-items:center; gap:2px; color:var(--ink-soft); font-size:13px; font-weight:600;}
.wd-mwrap input{font-family:'Inter'; font-size:13.5px; font-weight:600; color:var(--ink); background:rgba(255,255,255,.5);
  border:1px solid var(--line); border-radius:8px; outline:none; width:72px; padding:5px 8px; text-align:right; transition:border-color .2s;}
.wd-mwrap input:focus{border-color:var(--clay);}
.wd-mwrap.est input{width:66px;} .wd-mwrap.paid input{width:66px;}

/* Vendors */
.wd-vend{background:rgba(255,255,255,.42); border:1px solid var(--line); border-radius:14px; padding:13px 14px; margin-bottom:12px;}
.wd-vend-top{display:flex; align-items:center; gap:11px;}
.wd-vname{font-family:'Inter',sans-serif; font-size:16px; font-weight:500; color:var(--ink); background:transparent; border:none; outline:none; flex:1; min-width:0; padding:1px 0;}
.wd-vname::placeholder{color:#C6B2BD; font-style:italic; font-family:'Inter'; font-size:14px;}
.wd-vtype{font-family:'Inter'; font-size:11.5px; font-weight:700; letter-spacing:.03em; color:var(--sage);
  background:transparent; border:none; outline:none; text-align:right; width:130px; text-transform:uppercase;}
.wd-vtype::placeholder{color:#B6C6B8; font-style:italic; text-transform:none; letter-spacing:0;}
.wd-vrow{display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:9px; padding-left:34px;}
.wd-vc{display:inline-flex; align-items:center; gap:6px; color:var(--ink-soft);}
.wd-vc input{font-family:'Inter'; font-size:13px; color:var(--ink); background:transparent; border:none;
  border-bottom:1px solid var(--line); outline:none; padding:2px 0; min-width:120px; transition:border-color .2s;}
.wd-vc input:focus{border-bottom-color:var(--clay);}
.wd-vbal{font-family:'Inter'; font-size:12.5px; font-weight:700; color:var(--clay-deep); letter-spacing:.02em;}
.wd-vbal.clear{color:var(--sage);}
.wd-vnote{font-family:'Inter'; font-size:12.5px; color:var(--ink-soft); background:transparent; border:none; outline:none;
  width:100%; margin-top:9px; padding-left:34px;}
.wd-vnote::placeholder{color:#C6B2BD; font-style:italic;}

`;

  const visible = (t) => {
    if (filter === "todo") return !t.done;
    if (filter === "done") return t.done;
    if (filter === "due") {
      if (t.done || !t.due) return false;
      const n = daysUntil(t.due);
      return n !== null && n <= 30;
    }
    return true;
  };

  return (
    <div className={"wd-root" + (state.dark ? " dark" : "")}>
      <style>{css}</style>
      {celebrate && (
        <div className="wd-celebrate" aria-hidden="true">
          {petals.map((p) => (
            <span
              key={p.id}
              className="wd-petal"
              style={{
                left: p.left + "%",
                fontSize: p.size + "px",
                color: p.color,
                animationDelay: p.delay + "s",
                animationDuration: p.dur + "s",
                "--drift": p.drift + "px",
                "--rot": p.rot + "deg",
              }}
            >
              {p.glyph}
            </span>
          ))}
        </div>
      )}
      <div className="wd-wrap">
        {/* Masthead */}
        <header className="wd-mast">
          <button
            className="wd-theme"
            onClick={() => setState((s) => ({ ...s, dark: !s.dark }))}
            title={state.dark ? "Switch to light" : "Switch to dark"}
            aria-label="Toggle dark mode"
          >
            {state.dark ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
          </button>
          <div className="wd-kicker">The Wedding Of</div>
          <div className="wd-names">
            <div className="wd-namebox">
              <input
                className="wd-name-in"
                value={state.partnerA}
                onChange={(e) => setState((s) => ({ ...s, partnerA: e.target.value }))}
                spellCheck={false}
              />
            </div>
            <span className="wd-amp">&amp;</span>
            <div className="wd-namebox">
              <input
                className="wd-name-in"
                value={state.partnerB}
                onChange={(e) => setState((s) => ({ ...s, partnerB: e.target.value }))}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="wd-daterow">
            <input
              type="date"
              className="wd-date-in"
              value={state.weddingDate}
              onChange={(e) => setState((s) => ({ ...s, weddingDate: e.target.value }))}
            />
            {countdown && (
              <span className="wd-count">
                <CalendarDays size={16} /> {countdown}
              </span>
            )}
          </div>
          <div className="wd-venue">The Wedding Bowl · Cuvier Park · La Jolla, California</div>
        </header>

        {/* Wedding Bowl illustration */}
        <div className="wd-hero">
          <svg viewBox="0 0 840 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of the Wedding Bowl at Cuvier Park, La Jolla">
            <defs>
              <linearGradient id="wbSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F7D3E0" />
                <stop offset="55%" stopColor="#FBE6EE" />
                <stop offset="100%" stopColor="#F3EEE6" />
              </linearGradient>
              <linearGradient id="wbSea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#C3E3D4" />
                <stop offset="100%" stopColor="#76B79C" />
              </linearGradient>
              <linearGradient id="wbGrass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#A6D29A" />
                <stop offset="100%" stopColor="#6FAE77" />
              </linearGradient>
              <radialGradient id="wbSun" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#FCEFF4" />
                <stop offset="45%" stopColor="#F8CEDE" />
                <stop offset="100%" stopColor="#F8CEDE" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* sky */}
            <rect x="0" y="0" width="840" height="210" fill="url(#wbSky)" />
            {/* sun */}
            <circle cx="250" cy="92" r="100" fill="url(#wbSun)" />
            <circle cx="250" cy="92" r="40" fill="#FCEFF4" />
            {/* birds */}
            <g stroke="#C98AA8" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7">
              <path d="M472 70 q8 -7 16 0 q8 -7 16 0" />
              <path d="M520 92 q6 -5 12 0 q6 -5 12 0" />
            </g>

            {/* sea */}
            <rect x="0" y="150" width="840" height="72" fill="url(#wbSea)" />
            {/* distant headland */}
            <path d="M610 152 q70 -34 150 -18 q56 12 80 18 z" fill="#8FBE92" opacity="0.85" />
            {/* sea sparkle */}
            <g stroke="#EAF7EF" strokeWidth="2" strokeLinecap="round" opacity="0.55">
              <path d="M60 176 h40" /><path d="M150 190 h54" /><path d="M300 180 h40" />
              <path d="M470 194 h48" /><path d="M580 184 h40" />
            </g>

            {/* grassy bowl */}
            <path d="M0 206 C 150 176, 300 252, 420 252 C 560 252, 700 180, 840 208 L840 300 L0 300 Z" fill="url(#wbGrass)" />
            <path d="M0 206 C 150 176, 300 252, 420 252 C 560 252, 700 180, 840 208" fill="none" stroke="#C6E3B6" strokeWidth="3" opacity="0.6" />
            <ellipse cx="420" cy="286" rx="66" ry="11" fill="#9AC58C" opacity="0.55" />

            {/* moon-gate arch with florals */}
            <g>
              <circle cx="420" cy="226" r="45" fill="none" stroke="#FBF6F4" strokeWidth="6" />
              <circle cx="387" cy="200" r="6" fill="#E07CA3" />
              <circle cx="399" cy="188" r="5" fill="#F0A8C4" />
              <circle cx="379" cy="214" r="4" fill="#5FA877" />
              <circle cx="455" cy="202" r="5.5" fill="#D98AB0" />
              <circle cx="446" cy="190" r="4" fill="#88C39A" />
              <circle cx="461" cy="214" r="4" fill="#E07CA3" />
            </g>

            {/* left palm */}
            <g>
              <path d="M96 256 q-8 -54 8 -104" fill="none" stroke="#C39A74" strokeWidth="7" strokeLinecap="round" />
              <g stroke="#5FA877" strokeWidth="5" fill="none" strokeLinecap="round">
                <path d="M104 152 q-32 -10 -56 0" />
                <path d="M104 152 q-26 -24 -44 -30" />
                <path d="M104 152 q-4 -32 6 -52" />
                <path d="M104 152 q26 -24 50 -26" />
                <path d="M104 152 q32 -8 54 6" />
              </g>
            </g>

            {/* right palm */}
            <g>
              <path d="M748 252 q9 -44 -6 -86" fill="none" stroke="#C39A74" strokeWidth="6" strokeLinecap="round" />
              <g stroke="#6FAE86" strokeWidth="4.5" fill="none" strokeLinecap="round">
                <path d="M742 166 q-28 -8 -48 2" />
                <path d="M742 166 q-20 -22 -34 -28" />
                <path d="M742 166 q-2 -28 8 -44" />
                <path d="M742 166 q24 -20 44 -20" />
                <path d="M742 166 q28 -4 46 8" />
              </g>
            </g>
          </svg>
          <div className="wd-hero-cap">The Wedding Bowl, La Jolla</div>
        </div>

        {/* Jameson & Dawsyn */}
        <div className="wd-photo">
          <img src={COUPLE_PHOTO} alt="Jameson and Dawsyn dancing in the surf at sunset" />
          <input
            className="wd-photo-cap"
            value={state.dogsCaption == null ? "" : state.dogsCaption}
            placeholder="add a caption…"
            onChange={(e) => setState((s) => ({ ...s, dogsCaption: e.target.value }))}
            spellCheck={false}
          />
        </div>

        {/* Command center */}
        <div className="wd-cc">
          <div className="wd-cc-tile">
            <div className="k">Days to go</div>
            <div className="v pink">
              {daysToGo == null ? "—" : daysToGo < 0 ? "♥" : daysToGo}
              {daysToGo != null && daysToGo >= 0 && <small> days</small>}
            </div>
            <div className="s">{daysToGo == null ? "set a date up top" : daysToGo < 0 ? "married!" : "until Dec 30"}</div>
          </div>
          <div className="wd-cc-tile">
            <div className="k">Budget</div>
            <div className="v">{fmt(totalPaid)}<small> / {fmt(totalEst)} est</small></div>
            <div className={"s" + (bTotal > 0 ? (remaining < 0 ? " over" : " good") : "")}>
              {bTotal > 0 ? (remaining < 0 ? fmt(-remaining) + " over budget" : fmt(remaining) + " under budget") : "set a total in Budget"}
            </div>
          </div>
          <div className="wd-cc-tile">
            <div className="k">Guests</div>
            <div className="v green">{rsvpYes}<small> yes / {guestFilled} listed</small></div>
            <div className="s">{GUEST_CAP - guestFilled} spots open · {rsvpPending} awaiting</div>
          </div>
          <div className="wd-cc-tile">
            <div className="k">Vendors</div>
            <div className="v">{vendorsBooked}<small> / {vendors.length}</small></div>
            <div className="s">{fmt(Math.max(vendCost - vendPaid, 0))} balance due</div>
          </div>
        </div>
        <div className="wd-next">
          {overdueCount > 0 ? (
            <><b style={{ color: "var(--clay-deep)" }}>{overdueCount} overdue</b>{soonCount > 0 ? " · " + soonCount + " due soon" : ""} — {firstTodo ? <>next: <b>{firstTodo.title}</b></> : "catch up when you can"}</>
          ) : firstTodo ? (
            <>Next up: <b>{firstTodo.title}</b>{soonCount > 0 ? " · " + soonCount + " due in the next 2 weeks" : ""}</>
          ) : (
            <>Every task is done — {state.partnerA} &amp; {state.partnerB}, you're ready ♥</>
          )}
        </div>

        {/* Progress meter */}
        <div className="wd-meter">
          <div className="wd-pct">
            {pct}
            <small>%</small>
          </div>
          <div className="wd-meter-mid">
            <div className={"wd-meter-msg" + (pct === 100 ? " full" : "")}>{progressMsg}</div>
            <div className="wd-meter-label">
              <b>{doneCount}</b> of <b>{total}</b> done{total - doneCount > 0 ? " — " + (total - doneCount) + " to go" : ""}
            </div>
            <div className="wd-bar">
              <div className="wd-fill" style={{ width: pct + "%" }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="wd-filters">
          {[
            ["all", "Everything"],
            ["todo", "To do"],
            ["due", "Due soon"],
            ["done", "Done"],
          ].map(([k, label]) => (
            <button
              key={k}
              className={"wd-chip" + (filter === k ? " on" : "")}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sections */}
        {state.categories.map((cat, i) => {
          const Icon = ICONS[cat.icon] || Heart;
          const hue = HUES[i % HUES.length];
          const cd = cat.tasks.filter((t) => t.done).length;
          const shown = cat.tasks.filter(visible);
          if (filter !== "all" && shown.length === 0) return null;
          return (
            <section
              key={cat.id}
              className="wd-sec"
              style={{ animationDelay: i * 0.06 + "s" }}
            >
              <div className="wd-sechead">
                <span className="wd-secnum" style={{ color: hue }}>{cat.num}</span>
                <span
                  className="wd-secicon"
                  style={{ color: hue, background: hue + "16", borderColor: hue + "3A" }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <span className="wd-sectitle">{cat.title}</span>
                <span className="wd-seccount">
                  {cd}/{cat.tasks.length}
                </span>
              </div>

              {shown.map((t) => (
                <div className="wd-task" key={t.id}>
                  <div
                    className={"wd-check" + (t.done ? " done" : "")}
                    onClick={() => toggle(cat.id, t.id)}
                    role="checkbox"
                    aria-checked={t.done}
                  >
                    <Check size={15} strokeWidth={3} />
                  </div>
                  <div className="wd-tbody">
                    <input
                      className={"wd-title-in" + (t.done ? " done" : "")}
                      value={t.title}
                      placeholder="New to-do…"
                      onChange={(e) => editTask(cat.id, t.id, "title", e.target.value)}
                      ref={focusRef.current === t.id ? (el) => el && el.focus() : null}
                    />
                    <input
                      className="wd-note-in"
                      value={t.note}
                      placeholder="add a note…"
                      onChange={(e) => editTask(cat.id, t.id, "note", e.target.value)}
                    />
                    <div className="wd-duerow">
                      <input
                        type="date"
                        className="wd-due-in"
                        value={t.due || ""}
                        onChange={(e) => editTask(cat.id, t.id, "due", e.target.value)}
                      />
                      {(() => {
                        const info = dueInfo(t);
                        return info && info.cls !== "done" ? (
                          <span className={"wd-duebadge " + info.cls}>{info.label}</span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <button
                    className="wd-del"
                    onClick={() => removeTask(cat.id, t.id)}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </button>
                </div>
              ))}

              <button className="wd-add" onClick={() => addTask(cat.id)}>
                <Plus size={15} strokeWidth={2.4} /> Add to {cat.title}
              </button>
            </section>
          );
        })}

        {/* Guest list */}
        {filter === "all" && (
          <section className="wd-sec" style={{ animationDelay: state.categories.length * 0.06 + "s" }}>
            <div className="wd-sechead">
              <span className="wd-secnum" style={{ color: "#5FA877" }}>♡</span>
              <span
                className="wd-secicon"
                style={{ color: "#5FA877", background: "#5FA87716", borderColor: "#5FA8773A" }}
              >
                <Users size={17} strokeWidth={1.8} />
              </span>
              <span className="wd-sectitle">Guest List</span>
              <span className="wd-gcap">{rsvpYes} confirmed · {guestFilled}/{GUEST_CAP} listed</span>
            </div>

            <div className="wd-gbar">
              <div className="wd-gbar-fill" style={{ width: (guestFilled / GUEST_CAP) * 100 + "%" }} />
            </div>

            <div className="wd-gtally">
              <span className="wd-gpill" style={{ color: "#5FA877" }}>yes <b>{rsvpYes}</b></span>
              <span className="wd-gpill" style={{ color: "#B08096" }}>no <b>{rsvpNo}</b></span>
              <span className="wd-gpill" style={{ color: "#E07CA3" }}>invited <b>{rsvpInvited}</b></span>
              <span className="wd-gpill">awaiting <b>{rsvpPending}</b></span>
              <span className="wd-gpill">{GUEST_CAP - guestFilled} of {GUEST_CAP} open</span>
              <span className="wd-gpill" style={{ color: "#E07CA3" }}>{initialA}'s side <b>{sideA}</b></span>
              <span className="wd-gpill" style={{ color: "#5FA877" }}>{initialB}'s side <b>{sideB}</b></span>
              <span className="wd-gpill" style={{ color: "#A85C86" }}>both <b>{sideBoth}</b></span>
            </div>

            <div className="wd-glist">
              {guests.map((g, idx) => (
                <div className="wd-grow" key={g.id}>
                  <span className="wd-gnum">{idx + 1}</span>
                  <input
                    className="wd-gname"
                    value={g.name}
                    placeholder="Guest name…"
                    onChange={(e) => setGuest(idx, "name", e.target.value)}
                  />
                  <input
                    className="wd-gmeal"
                    value={g.meal || ""}
                    placeholder="meal / diet"
                    onChange={(e) => setGuest(idx, "meal", e.target.value)}
                  />
                  <button
                    className={"wd-grsvp" + (g.rsvp ? " set" : "")}
                    style={g.rsvp ? { background: rsvpColor(g.rsvp) } : null}
                    onClick={() => cycleRsvp(idx)}
                    title="RSVP — tap to cycle: invite sent → yes → no"
                  >
                    {rsvpLabel(g.rsvp)}
                  </button>
                  <button
                    className={"wd-gside" + (g.side ? " set" : "")}
                    style={g.side ? { background: sideColor(g.side) } : null}
                    onClick={() => cycleSide(idx)}
                    title="Whose side? Tap to cycle"
                  >
                    {sideLabel(g.side)}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Budget */}
        {filter === "all" && (
          <section className="wd-sec">
            <div className="wd-sechead">
              <span className="wd-secnum" style={{ color: "#E07CA3" }}>♡</span>
              <span className="wd-secicon" style={{ color: "#E07CA3", background: "#E07CA316", borderColor: "#E07CA33A" }}>
                <Wallet size={17} strokeWidth={1.8} />
              </span>
              <span className="wd-sectitle">Budget</span>
              <span className="wd-gcap">{fmt(totalPaid)} paid</span>
            </div>

            <div className="wd-budline">
              Total budget
              <input
                value={budget.total}
                placeholder="0"
                inputMode="decimal"
                onChange={(e) => setBudgetTotal(e.target.value)}
              />
              {bTotal > 0 && (
                <span className={remaining < 0 ? "" : ""} style={{ color: remaining < 0 ? "var(--clay-deep)" : "var(--sage)", fontWeight: 700 }}>
                  {remaining < 0 ? fmt(-remaining) + " over" : fmt(remaining) + " left to allocate"}
                </span>
              )}
            </div>

            <div className="wd-stats">
              <div className="wd-stat"><span>Estimated</span><b>{fmt(totalEst)}</b></div>
              <div className="wd-stat"><span>Paid</span><b>{fmt(totalPaid)}</b></div>
              <div className="wd-stat"><span>Still owed</span><b>{fmt(owed)}</b></div>
              <div className={"wd-stat " + (bTotal > 0 ? (remaining < 0 ? "over" : "good") : "")}>
                <span>{remaining < 0 ? "Over budget" : "Under budget"}</span>
                <b>{bTotal > 0 ? fmt(Math.abs(remaining)) : "—"}</b>
              </div>
            </div>

            <div className="wd-spend">
              <div className="wd-spend-paid" style={{ width: paidW + "%" }} />
              <div className="wd-spend-est" style={{ width: commitW + "%" }} />
              {budgetMark !== null && budgetMark < 100 && <div className="wd-spend-mark" style={{ left: budgetMark + "%" }} />}
            </div>
            <div className="wd-legend">
              <span><i style={{ background: "var(--sage)" }} />Paid {fmt(totalPaid)}</span>
              <span><i style={{ background: "#F3B9D0" }} />Committed {fmt(owed)}</span>
              {bTotal > 0 && <span><i style={{ background: "var(--ink)", opacity: 0.5 }} />Budget {fmt(bTotal)}</span>}
            </div>
            <div className="wd-note-line">Vendor costs below are included automatically.</div>

            {bItems.map((it, idx) => (
              <div className="wd-litem" key={it.id}>
                <input className="wd-li-label" value={it.label} placeholder="Budget item…" onChange={(e) => setBItem(idx, "label", e.target.value)} />
                <span className="wd-mwrap est">est $<input value={it.est} placeholder="0" inputMode="decimal" onChange={(e) => setBItem(idx, "est", e.target.value)} /></span>
                <span className="wd-mwrap paid">paid $<input value={it.paid} placeholder="0" inputMode="decimal" onChange={(e) => setBItem(idx, "paid", e.target.value)} /></span>
                <button className="wd-del" onClick={() => removeBItem(idx)} aria-label="Delete"><Trash2 size={16} strokeWidth={1.8} /></button>
              </div>
            ))}
            <button className="wd-add" onClick={addBItem}><Plus size={15} strokeWidth={2.4} /> Add a budget item</button>
          </section>
        )}

        {/* Vendors */}
        {filter === "all" && (
          <section className="wd-sec">
            <div className="wd-sechead">
              <span className="wd-secnum" style={{ color: "#5FA877" }}>♡</span>
              <span className="wd-secicon" style={{ color: "#5FA877", background: "#5FA87716", borderColor: "#5FA8773A" }}>
                <Briefcase size={17} strokeWidth={1.8} />
              </span>
              <span className="wd-sectitle">Vendors</span>
              <span className="wd-gcap">{vendorsBooked}/{vendors.length} booked</span>
            </div>

            <div className="wd-gtally">
              <span className="wd-gpill" style={{ color: "#5FA877" }}>booked <b>{vendorsBooked}</b></span>
              <span className="wd-gpill" style={{ color: "#E07CA3" }}>deposits <b>{fmt(vendPaid)}</b></span>
              <span className="wd-gpill" style={{ color: "#A85C86" }}>balance due <b>{fmt(Math.max(vendCost - vendPaid, 0))}</b></span>
            </div>

            {vendors.map((v, idx) => {
              const bal = num(v.cost) - num(v.deposit);
              return (
                <div className="wd-vend" key={v.id}>
                  <div className="wd-vend-top">
                    <div className={"wd-check" + (v.booked ? " done" : "")} onClick={() => toggleBooked(idx)} role="checkbox" aria-checked={v.booked} title="Booked?">
                      <Check size={15} strokeWidth={3} />
                    </div>
                    <input className="wd-vname" value={v.name} placeholder="Vendor name" onChange={(e) => setVendor(idx, "name", e.target.value)} />
                    <input className="wd-vtype" value={v.type} placeholder="type" onChange={(e) => setVendor(idx, "type", e.target.value)} />
                    <button className="wd-del" onClick={() => removeVendor(idx)} aria-label="Delete"><Trash2 size={16} strokeWidth={1.8} /></button>
                  </div>
                  <div className="wd-vrow">
                    <span className="wd-vc"><Phone size={13} strokeWidth={1.9} /><input value={v.phone} placeholder="phone" onChange={(e) => setVendor(idx, "phone", e.target.value)} /></span>
                    <span className="wd-vc"><Mail size={13} strokeWidth={1.9} /><input value={v.email} placeholder="email" onChange={(e) => setVendor(idx, "email", e.target.value)} /></span>
                  </div>
                  <div className="wd-vrow">
                    <span className="wd-mwrap">cost $<input value={v.cost} placeholder="0" inputMode="decimal" onChange={(e) => setVendor(idx, "cost", e.target.value)} /></span>
                    <span className="wd-mwrap">deposit $<input value={v.deposit} placeholder="0" inputMode="decimal" onChange={(e) => setVendor(idx, "deposit", e.target.value)} /></span>
                    <span className={"wd-vbal" + (bal <= 0 && num(v.cost) > 0 ? " clear" : "")}>
                      {num(v.cost) > 0 ? (bal <= 0 ? "paid in full" : fmt(bal) + " balance") : ""}
                    </span>
                  </div>
                  <input className="wd-vnote" value={v.note} placeholder="notes — contract, payment due dates…" onChange={(e) => setVendor(idx, "note", e.target.value)} />
                </div>
              );
            })}
            <button className="wd-add" onClick={addVendor}><Plus size={15} strokeWidth={2.4} /> Add a vendor</button>
          </section>
        )}

        {/* Day-of timeline */}
        {filter === "all" && (
          <section className="wd-sec">
            <div className="wd-sechead">
              <span className="wd-secnum" style={{ color: "#C76F97" }}>♡</span>
              <span className="wd-secicon" style={{ color: "#C76F97", background: "#C76F9716", borderColor: "#C76F973A" }}>
                <Clock size={17} strokeWidth={1.8} />
              </span>
              <span className="wd-sectitle">Day-Of Timeline</span>
              <span className="wd-gcap">Dec 30 · sunset {toClock(SUNSET_MIN)}</span>
            </div>

            <div className="wd-tl-head">
              Ceremony starts at
              <input type="time" value={timeline.ceremony || "15:00"} onChange={(e) => setCeremony(e.target.value)} />
              <span>everything below shifts with it</span>
            </div>

            <div className={"wd-warn " + (permitOver ? "bad" : "ok")}>
              <span>
                {permitOver
                  ? "Over the permit window — your park schedule runs " + Math.round(parkUsed / 60 * 10) / 10 + " hours (" + toClock(parkStart) + "–" + toClock(parkEnd) + "). The Wedding Bowl permit allows 4 hours including setup and breakdown."
                  : "Fits the permit — park time runs " + toClock(parkStart) + "–" + toClock(parkEnd) + " (" + Math.round(parkUsed / 60 * 10) / 10 + " of 4 hours, setup and breakdown included)."}
              </span>
            </div>

            {darkItems.length > 0 && (
              <div className="wd-warn sun">
                <span>
                  {darkItems.length} item{darkItems.length === 1 ? "" : "s"} fall after sunset ({toClock(SUNSET_MIN)}) — it gets dark fast on the cliff. Golden hour for photos is about {toClock(goldenStart)}–{toClock(SUNSET_MIN)}.
                </span>
              </div>
            )}

            <div className="wd-tl">
              {tItems.map((it, i) => {
                const abs = ceremonyMin + it.offset;
                const prev = i > 0 ? ceremonyMin + tItems[i - 1].offset : null;
                const crossesSunset = prev !== null && prev < SUNSET_MIN && abs >= SUNSET_MIN;
                return (
                  <React.Fragment key={it.id}>
                    {crossesSunset && <div className="wd-tlmark">sunset {toClock(SUNSET_MIN)}</div>}
                    <div className="wd-tlrow">
                      <span className={"wd-tltime" + (abs > SUNSET_MIN ? " dark" : "")}>{toClock(abs)}</span>
                      <span className="wd-tldot">
                        <i className={it.done ? "done" : ""} onClick={() => toggleTItem(it.id)} role="checkbox" aria-checked={it.done} />
                      </span>
                      <span className="wd-tlbody">
                        <input
                          className={"wd-tllabel" + (it.done ? " done" : "")}
                          value={it.label}
                          placeholder="What happens…"
                          onChange={(e) => setTItem(it.id, "label", e.target.value)}
                        />
                        <input
                          className="wd-tlnote"
                          value={it.note}
                          placeholder="note…"
                          onChange={(e) => setTItem(it.id, "note", e.target.value)}
                        />
                      </span>
                      <input
                        className="wd-tloff"
                        type="number"
                        step="5"
                        value={it.offset}
                        title="Minutes relative to the ceremony start"
                        onChange={(e) => setTItem(it.id, "offset", e.target.value)}
                      />
                      <button className="wd-del" onClick={() => removeTItem(it.id)} aria-label="Delete">
                        <Trash2 size={16} strokeWidth={1.8} />
                      </button>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <button className="wd-add" onClick={addTItem}><Plus size={15} strokeWidth={2.4} /> Add a moment</button>
          </section>
        )}

        <footer className="wd-foot">
          <div className="wd-foot-mark">❀</div>
          <div className="wd-save">{savedAt ? "✓ Saved in this browser" : "Auto-saves as you go"}</div>
          <div className="wd-backup">
            <button className="wd-bbtn" onClick={exportData}>Download backup</button>
            <button className="wd-bbtn" onClick={() => importRef.current && importRef.current.click()}>Restore from file</button>
          </div>
          <div className="wd-backup-note">Your plan lives in this browser — download a backup to keep it safe or open it on another device.</div>
          <input ref={importRef} type="file" accept="application/json,.json" onChange={importData} style={{ display: "none" }} />
          <button className="wd-reset" onClick={resetAll}>
            Reset checklist
          </button>
        </footer>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<WeddingDashboard />);
