// ============================================================
// Greater Seattle Camp Finder — Camp Data & Configuration
// Summer 2026 — Greater Seattle Area
// ============================================================

// ── School Districts ──
const SCHOOL_DISTRICTS = {
  "bsd405":  { label: "Bellevue SD (BSD 405)",       lastDay: "2026-06-23", firstDay: "2026-09-08" },
  "lwsd414": { label: "Lake Washington SD (LWSD 414)", lastDay: "2026-06-18", firstDay: "2026-09-02" },
  "isd411":  { label: "Issaquah SD (ISD 411)",       lastDay: "2026-06-19", firstDay: "2026-09-03" },
  "nsd417":  { label: "Northshore SD (NSD 417)",     lastDay: "2026-06-20", firstDay: "2026-09-04" },
  "sps":     { label: "Seattle Public Schools",       lastDay: "2026-06-20", firstDay: "2026-09-03" },
  "misd":    { label: "Mercer Island SD",             lastDay: "2026-06-19", firstDay: "2026-09-03" },
  "rsd403":  { label: "Renton SD (RSD 403)",          lastDay: "2026-06-19", firstDay: "2026-09-04" },
  "other":   { label: "Other (enter dates manually)", lastDay: null, firstDay: null }
};

// ── Dynamic Summer Weeks Generation ──
let SUMMER_WEEKS = [];

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShortDate(d) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatWeekLabel(mon, fri) {
  const ms = formatShortDate(mon);
  const fs = formatShortDate(fri);
  // Same month
  if (mon.getMonth() === fri.getMonth()) {
    return `${ms}\u2013${fri.getDate()}`;
  }
  return `${ms}\u2013${fs}`;
}

function generateSummerWeeks(lastDayStr, firstDayStr) {
  if (!lastDayStr || !firstDayStr) {
    SUMMER_WEEKS = [];
    return SUMMER_WEEKS;
  }

  const lastDay = new Date(lastDayStr + "T00:00:00");
  const firstDay = new Date(firstDayStr + "T00:00:00");

  // Find the Monday of lastDay's week, or next Monday if lastDay is Fri/Sat/Sun
  const dow = lastDay.getDay(); // 0=Sun, 1=Mon, ...
  let monday = new Date(lastDay);
  if (dow === 0) {
    // Sunday — next Monday is +1
    monday.setDate(monday.getDate() + 1);
  } else if (dow === 5) {
    // Friday — next Monday is +3
    monday.setDate(monday.getDate() + 3);
  } else if (dow === 6) {
    // Saturday — next Monday is +2
    monday.setDate(monday.getDate() + 2);
  } else {
    // Mon-Thu — go back to Monday of that week
    monday.setDate(monday.getDate() - (dow - 1));
  }

  const weeks = [];
  let weekNum = 1;

  while (monday < firstDay) {
    const fri = new Date(monday);
    fri.setDate(fri.getDate() + 4);

    const id = "w" + String(weekNum).padStart(2, "0");
    const label = formatWeekLabel(monday, fri);

    const week = {
      id: id,
      start: formatDate(monday),
      end: formatDate(fri),
      label: label
    };

    // Add notes for first and last weeks
    if (weekNum === 1) {
      week.note = "School ends " + formatShortDate(lastDay);
    }
    if (fri >= firstDay || (monday < firstDay && new Date(monday.getTime() + 7 * 86400000) >= firstDay)) {
      week.note = "School starts ~" + formatShortDate(firstDay);
    }
    // First week note takes priority if it's also the last
    if (weekNum === 1 && fri >= firstDay) {
      week.note = "School ends " + formatShortDate(lastDay) + " / starts ~" + formatShortDate(firstDay);
    }

    weeks.push(week);

    monday = new Date(monday);
    monday.setDate(monday.getDate() + 7);
    weekNum++;
  }

  SUMMER_WEEKS = weeks;
  return weeks;
}

// Initialize with default BSD 405 dates
generateSummerWeeks("2026-06-23", "2026-09-08");

// ── Adjacency Map (for "New Things to Try") ──
const ADJACENCY_MAP = {
  "field-sports":      ["court-sports", "multi-sport"],
  "court-sports":      ["field-sports", "multi-sport"],
  "water-sports":      ["high-adrenaline", "outdoor-survival"],
  "individual-combat": ["multi-sport", "high-adrenaline"],
  "multi-sport":       ["field-sports", "court-sports", "high-adrenaline"],
  "theater":           ["dance", "music", "digital-arts"],
  "dance":             ["theater", "music"],
  "music":             ["theater", "dance", "digital-arts"],
  "visual-arts":       ["digital-arts", "culinary"],
  "digital-arts":      ["coding", "visual-arts", "theater"],
  "coding":            ["engineering", "digital-arts"],
  "natural-sciences":  ["nature-study", "engineering", "outdoor-survival"],
  "engineering":       ["coding", "natural-sciences"],
  "humanities":        ["theater", "leadership"],
  "outdoor-survival":  ["high-adrenaline", "nature-study", "sleepaway"],
  "high-adrenaline":   ["outdoor-survival", "water-sports", "individual-combat"],
  "nature-study":      ["outdoor-survival", "natural-sciences"],
  "sleepaway":         ["outdoor-survival", "high-adrenaline", "nature-study"],
  "culinary":          ["visual-arts", "leadership"],
  "leadership":        ["humanities", "culinary"],
  "special-needs":     ["multi-sport", "nature-study"]
};

// ── Neighborhood Areas ──
const NEIGHBORHOOD_AREAS = [
  {
    area: "Core Eastside",
    neighborhoods: [
      { id: "bellevue", label: "Bellevue" },
      { id: "kirkland", label: "Kirkland" },
      { id: "redmond", label: "Redmond" }
    ]
  },
  {
    area: "North",
    neighborhoods: [
      { id: "woodinville", label: "Woodinville" },
      { id: "bothell", label: "Bothell" },
      { id: "kenmore", label: "Kenmore" },
      { id: "lake-forest-park", label: "Lake Forest Park" },
      { id: "shoreline", label: "Shoreline" }
    ]
  },
  {
    area: "South Eastside",
    neighborhoods: [
      { id: "issaquah", label: "Issaquah" },
      { id: "sammamish", label: "Sammamish" },
      { id: "newcastle", label: "Newcastle" },
      { id: "mercer-island", label: "Mercer Island" },
      { id: "renton", label: "Renton" }
    ]
  },
  {
    area: "Seattle",
    neighborhoods: [
      { id: "seattle", label: "Seattle" }
    ]
  }
];

// ── Main Categories (retro palette) ──
const CATEGORIES = [
  { id: "sports",    label: "Sports & Athletics",         icon: "\u26BD", color: "#C84B31" },
  { id: "arts",      label: "Arts & Creative Expression", icon: "\uD83C\uDFA8", color: "#8B4E8B" },
  { id: "stem",      label: "STEM & Academic",            icon: "\uD83E\uDDEA", color: "#2A6F6F" },
  { id: "adventure", label: "Adventure & Wilderness",     icon: "\uD83C\uDF32", color: "#3E6B48" },
  { id: "life",      label: "Life Skills & Specialized",  icon: "\uD83D\uDEE0\uFE0F", color: "#D4A843" }
];

// ── Subcategories ──
const SUBCATEGORIES = {
  sports: [
    { id: "field-sports",     label: "Field Sports",       icon: "\u26BD" },
    { id: "court-sports",     label: "Court Sports",       icon: "\uD83C\uDFC0" },
    { id: "water-sports",     label: "Water Sports",       icon: "\uD83C\uDFCA" },
    { id: "individual-combat", label: "Individual & Combat", icon: "\uD83E\uDD4A" },
    { id: "multi-sport",      label: "Multi-Sport",        icon: "\uD83C\uDFC5" }
  ],
  arts: [
    { id: "theater",      label: "Theater",      icon: "\uD83C\uDFAD" },
    { id: "dance",        label: "Dance",         icon: "\uD83D\uDC83" },
    { id: "music",        label: "Music",         icon: "\uD83C\uDFB5" },
    { id: "visual-arts",  label: "Visual Arts",   icon: "\uD83D\uDD8C\uFE0F" },
    { id: "digital-arts", label: "Digital Arts",  icon: "\uD83C\uDFAC" }
  ],
  stem: [
    { id: "coding",           label: "Technology & Coding", icon: "\uD83D\uDCBB" },
    { id: "natural-sciences", label: "Natural Sciences",    icon: "\uD83D\uDD2C" },
    { id: "engineering",      label: "Engineering",         icon: "\u2699\uFE0F" },
    { id: "humanities",       label: "Humanities & Logic",  icon: "\u265F\uFE0F" }
  ],
  adventure: [
    { id: "outdoor-survival", label: "Outdoor Survival", icon: "\uD83D\uDD25" },
    { id: "high-adrenaline",  label: "High-Adrenaline",  icon: "\uD83E\uDDD7" },
    { id: "nature-study",     label: "Nature Study",     icon: "\uD83C\uDF3F" },
    { id: "sleepaway",        label: "Sleepaway",        icon: "\uD83C\uDFD5\uFE0F" }
  ],
  life: [
    { id: "culinary",      label: "Culinary",              icon: "\uD83C\uDF73" },
    { id: "leadership",    label: "Leadership & Business",  icon: "\uD83D\uDCBC" },
    { id: "special-needs", label: "Special Needs",          icon: "\uD83D\uDC9A" }
  ]
};

// ── All Subcategory Icons (flat lookup) ──
const SUBCATEGORY_MAP = {};
Object.values(SUBCATEGORIES).flat().forEach(sc => { SUBCATEGORY_MAP[sc.id] = sc; });

// ── Camp Catalog ──
const CAMPS = [

  // ═══════════════════════════════════════════════
  //  SPORTS & ATHLETICS
  // ═══════════════════════════════════════════════

  // — Field Sports —
  {
    id: "nike-soccer",
    name: "Nike Soccer Camp",
    provider: "US Sports Camps / Bellevue College",
    category: "sports",
    subcategory: "field-sports",
    tags: ["soccer"],
    neighborhood: "bellevue",
    description: "High-energy soccer camp with professional coaching. Dribbling, passing, shooting, and game play. All skill levels welcome.",
    sentiment: "Well-established national brand. Consistently praised for quality coaching.",
    ageRange: "7-12",
    cost: "$450-$550/week",
    location: "Bellevue College, 3000 Landerholm Circle SE",
    url: "https://www.ussportscamps.com/soccer/nike",
    registrationDeadline: "Fills quickly — register early",
    documents: ["Health/medical form", "Waiver"],
    weeks: ["w01", "w04", "w07"]
  },
  {
    id: "bellevue-united-soccer",
    name: "Bellevue United FC Summer Camp",
    provider: "Bellevue United FC",
    category: "sports",
    subcategory: "field-sports",
    tags: ["soccer"],
    neighborhood: "bellevue",
    description: "Community soccer camp run by Bellevue United FC coaches. Skills training, scrimmages, and team play in a fun, supportive environment.",
    sentiment: "Local favorite. Great value for the area. Coaches know the kids.",
    ageRange: "6-12",
    cost: "$225-$300/week",
    location: "Wilburton Hill Park, Bellevue",
    url: "https://www.bellevueunitedfc.com/",
    registrationDeadline: "Opens March 2026",
    documents: ["Registration form", "Medical release"],
    weeks: ["w02", "w05", "w08"]
  },
  {
    id: "crossfire-soccer",
    name: "Crossfire Premier Day Camps",
    provider: "Crossfire Premier Soccer Club",
    category: "sports",
    subcategory: "field-sports",
    tags: ["soccer"],
    neighborhood: "redmond",
    description: "Elite-level coaching in a day-camp format. Technical skill development, tactical awareness, and competitive small-sided games.",
    sentiment: "Top club on the Eastside. Excellent for kids who love competitive soccer.",
    ageRange: "7-14",
    cost: "$300-$400/week",
    location: "60 Acres Park, Redmond",
    url: "https://crossfirepremier.com/",
    registrationDeadline: "Check website — spring 2026",
    documents: ["Medical form", "Waiver"],
    weeks: ["w01", "w03", "w06"]
  },
  {
    id: "real-madrid-camp",
    name: "Real Madrid Foundation Camp",
    provider: "Real Madrid Foundation / Coerver Coaching",
    category: "sports",
    subcategory: "field-sports",
    tags: ["soccer"],
    neighborhood: "bellevue",
    description: "Train the Real Madrid way! Official methodology focusing on technique, creativity, and sportsmanship. Includes official Real Madrid jersey.",
    sentiment: "Unique experience — kids love getting the jersey. Sells out fast. Premium coaching.",
    ageRange: "6-14",
    cost: "$400-$500/week",
    location: "Bellevue area (venue TBA)",
    url: "https://www.realmadridfoundationclinics.com/",
    registrationDeadline: "Spring 2026 — sells out fast",
    documents: ["Registration form", "Medical release", "Photo waiver"],
    weeks: ["w03", "w04"]
  },
  {
    id: "eastside-fc-camp",
    name: "Eastside FC Youth Camp",
    provider: "Eastside FC",
    category: "sports",
    subcategory: "field-sports",
    tags: ["soccer"],
    neighborhood: "issaquah",
    description: "Eastside FC coaches run week-long soccer camps for all skill levels. Focus on ball control, team play, and love of the game.",
    sentiment: "Friendly community club. Coaches are patient with beginners. Good value.",
    ageRange: "5-14",
    cost: "$200-$350/week",
    location: "Pickering Fields, Issaquah",
    url: "https://www.eastsidefc.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Medical release"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "issaquah-little-league",
    name: "Issaquah Little League Camp",
    provider: "Issaquah Little League",
    category: "sports",
    subcategory: "field-sports",
    tags: ["baseball", "softball"],
    neighborhood: "issaquah",
    description: "Baseball and softball fundamentals camp. Batting, fielding, throwing, and base running with experienced coaches. Half-day and full-day options.",
    sentiment: "Great introduction to baseball. Coaches are volunteers who love the game.",
    ageRange: "5-12",
    cost: "$150-$250/week",
    location: "Central Park Fields, Issaquah",
    url: "https://www.issaquahll.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w03", "w05", "w07"]
  },
  {
    id: "eastside-lax",
    name: "Eastside Lacrosse Camp",
    provider: "Eastside Youth Lacrosse",
    category: "sports",
    subcategory: "field-sports",
    tags: ["lacrosse"],
    neighborhood: "redmond",
    description: "Introductory and intermediate lacrosse camp. Stick skills, cradling, passing, shooting, and game play. Equipment provided for beginners.",
    sentiment: "Growing sport on the Eastside. Fun way to try lacrosse without committing to a team.",
    ageRange: "7-14",
    cost: "$250-$350/week",
    location: "Redmond Ridge Park, Redmond",
    url: "https://www.eastsidelacrosse.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Medical release"],
    weeks: ["w03", "w06", "w09"]
  },

  // — Court Sports —
  {
    id: "nw-juniors-vball",
    name: "NW Juniors Volleyball Camp",
    provider: "NW Juniors Volleyball",
    category: "sports",
    subcategory: "court-sports",
    tags: ["volleyball"],
    neighborhood: "bellevue",
    description: "Top-tier volleyball camp: passing, setting, serving, and hitting. Run by experienced club coaches. Great for beginners and intermediate players.",
    sentiment: "The premier volleyball club on the Eastside. Excellent fundamentals coaching.",
    ageRange: "8-14",
    cost: "$250-$400/week",
    location: "Forest Ridge School, Bellevue",
    url: "https://www.nwjuniors.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Medical release"],
    weeks: ["w02", "w04", "w07"]
  },
  {
    id: "nbc-vball",
    name: "NBC Volleyball Camp",
    provider: "NBC Camps",
    category: "sports",
    subcategory: "court-sports",
    tags: ["volleyball"],
    neighborhood: "kirkland",
    description: "Intensive volleyball training focused on skill development and character building. Known for high-quality instruction and positive culture.",
    sentiment: "NBC has a strong reputation nationwide. Positive, encouraging environment.",
    ageRange: "9-14",
    cost: "$300-$450/week",
    location: "Kirkland area gym",
    url: "https://www.nbccamps.com/volleyball",
    registrationDeadline: "Early 2026",
    documents: ["Online registration", "Medical form"],
    weeks: ["w03", "w05"]
  },
  {
    id: "bellevue-basketball",
    name: "Bellevue Parks Basketball Camp",
    provider: "City of Bellevue Parks & Recreation",
    category: "sports",
    subcategory: "court-sports",
    tags: ["basketball"],
    neighborhood: "bellevue",
    description: "Youth basketball camp covering dribbling, shooting, passing, defense, and game play. Run by local high school and college coaches.",
    sentiment: "Affordable city program. Great for beginners. Good way to stay active.",
    ageRange: "6-14",
    cost: "$150-$250/week",
    location: "Highland Community Center, Bellevue",
    url: "https://bellevuewa.gov/city-government/departments/parks",
    registrationDeadline: "Check city website",
    documents: ["Online registration"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "seattle-tennis-academy",
    name: "Seattle Tennis Academy Camp",
    provider: "Seattle Tennis Academy",
    category: "sports",
    subcategory: "court-sports",
    tags: ["tennis"],
    neighborhood: "seattle",
    description: "Tennis camp for all levels. Forehand, backhand, serve, volley, and match play. Small group instruction ensures personal attention.",
    sentiment: "Well-run program with experienced USPTA-certified coaches. Good progression system.",
    ageRange: "6-16",
    cost: "$300-$450/week",
    location: "Amy Yee Tennis Center, Seattle",
    url: "https://www.seattletennisacademy.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w01", "w03", "w05", "w07", "w09"]
  },
  {
    id: "eastside-tennis",
    name: "Eastside Tennis Center Camp",
    provider: "Eastside Tennis Center",
    category: "sports",
    subcategory: "court-sports",
    tags: ["tennis", "pickleball"],
    neighborhood: "kirkland",
    description: "Tennis and pickleball camp. Learn proper strokes, footwork, and strategy. Fun drills, games, and match play. Indoor and outdoor courts.",
    sentiment: "Great facility with indoor courts for any weather. Patient instructors for beginners.",
    ageRange: "6-14",
    cost: "$275-$400/week",
    location: "Eastside Tennis Center, Kirkland",
    url: "https://www.eastsidetenniscenter.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w02", "w04", "w06", "w08"]
  },

  // — Water Sports —
  {
    id: "proclub-synchro",
    name: "PRO Club Synchronized Swimming",
    provider: "PRO Club",
    category: "sports",
    subcategory: "water-sports",
    tags: ["swimming", "synchronized swimming"],
    neighborhood: "bellevue",
    description: "Learn synchronized swimming! Basic synchro skills, underwater techniques, choreography, and teamwork in PRO Club's beautiful indoor pool.",
    sentiment: "PRO Club is a ParentMap award finalist. Premium facilities.",
    ageRange: "7-14",
    cost: "$300-$450/week",
    location: "PRO Club, 4455 148th Ave NE, Bellevue",
    url: "https://www.proclub.com/",
    registrationDeadline: "Spring 2026",
    documents: ["PRO Club registration", "Swim assessment", "Medical form"],
    weeks: ["w01", "w03", "w05", "w07"]
  },
  {
    id: "samena-swim",
    name: "SAMENA Swim Camp",
    provider: "SAMENA Swim & Recreation Club",
    category: "sports",
    subcategory: "water-sports",
    tags: ["swimming"],
    neighborhood: "bellevue",
    description: "Swim camp with stroke development, water safety, diving, and water games. Outdoor pool with experienced swim instructors.",
    sentiment: "Community gem. Pool is well-maintained. Instructors are patient and encouraging.",
    ageRange: "5-12",
    cost: "$200-$350/week",
    location: "SAMENA Swim & Recreation Club, Bellevue",
    url: "https://www.samena.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Swim level assessment"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "sail-sand-point",
    name: "Sail Sand Point Youth Sailing",
    provider: "Sail Sand Point",
    category: "sports",
    subcategory: "water-sports",
    tags: ["sailing"],
    neighborhood: "seattle",
    description: "Learn to sail on Lake Washington! Introductory and intermediate sailing in small boats. Water safety, knot tying, wind reading, and boat handling.",
    sentiment: "Amazing program. Kids gain real independence on the water. Beautiful setting.",
    ageRange: "8-16",
    cost: "$400-$550/week",
    location: "Magnuson Park, Seattle",
    url: "https://www.sailsandpoint.org/",
    registrationDeadline: "Opens March 2026 — popular",
    documents: ["Registration form", "Swim test", "Medical form"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },

  // — Individual & Combat —
  {
    id: "seattle-gymnastics",
    name: "Seattle Gymnastics Academy Camp",
    provider: "Seattle Gymnastics Academy",
    category: "sports",
    subcategory: "individual-combat",
    tags: ["gymnastics"],
    neighborhood: "kirkland",
    description: "Gymnastics camp with tumbling, bars, beam, vault, trampoline, and ninja course. Fun themed weeks. All levels from beginner to advanced.",
    sentiment: "Fantastic facility. Kids love the ninja course. Coaches are supportive and safety-focused.",
    ageRange: "5-14",
    cost: "$300-$450/week",
    location: "Seattle Gymnastics Academy, Kirkland",
    url: "https://www.seattlegymnastics.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Waiver"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "nwfa-fencing",
    name: "Northwest Fencing Academy Camp",
    provider: "Northwest Fencing Academy",
    category: "sports",
    subcategory: "individual-combat",
    tags: ["fencing"],
    neighborhood: "bellevue",
    description: "Introduction to Olympic fencing! Footwork, blade work, bouting, and fencing history. Equipment provided. All experience levels welcome.",
    sentiment: "Unique sport that kids love. Coaches are competitive fencers. Great mental and physical workout.",
    ageRange: "7-16",
    cost: "$350-$500/week",
    location: "Northwest Fencing Academy, Bellevue",
    url: "https://www.nwfencing.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Waiver"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "eastside-martial-arts",
    name: "Eastside Martial Arts Summer Camp",
    provider: "Eastside Martial Arts Academy",
    category: "sports",
    subcategory: "individual-combat",
    tags: ["martial arts", "karate", "taekwondo"],
    neighborhood: "bellevue",
    description: "Martial arts camp combining karate, taekwondo, and self-defense. Focus on discipline, respect, and confidence. Belt testing available.",
    sentiment: "Builds character and confidence. Kids love the structure and earning belts.",
    ageRange: "5-14",
    cost: "$250-$400/week",
    location: "Eastside Martial Arts, Bellevue",
    url: "https://www.eastsidemartialarts.com/",
    registrationDeadline: "Rolling registration",
    documents: ["Registration form", "Medical form"],
    weeks: ["w01", "w03", "w05", "w07", "w09"]
  },
  {
    id: "archery-games",
    name: "Archery Games Camp",
    provider: "Archery Games Seattle",
    category: "sports",
    subcategory: "individual-combat",
    tags: ["archery"],
    neighborhood: "seattle",
    description: "Learn archery fundamentals and play archery-based games. Target shooting, competitions, and archery tag. Equipment provided.",
    sentiment: "Super fun format. Kids get hooked on archery. Safe foam-tipped arrows for games.",
    ageRange: "7-16",
    cost: "$250-$350/week",
    location: "Archery Games Seattle",
    url: "https://www.archerygamesseattle.com/",
    registrationDeadline: "Check website",
    documents: ["Registration form", "Waiver"],
    weeks: ["w03", "w05", "w07", "w09"]
  },

  // — Multi-Sport —
  {
    id: "bgc-sports",
    name: "Boys & Girls Club Sports Camp",
    provider: "Boys & Girls Clubs of Bellevue",
    category: "sports",
    subcategory: "multi-sport",
    tags: ["multi-sport", "basketball", "soccer", "flag football"],
    neighborhood: "bellevue",
    description: "Affordable, fun-focused sports camp (soccer, basketball, flag football, and more). Great for building skills and making friends. Half-day and full-day options.",
    sentiment: "Best value in Bellevue. Inclusive, welcoming. Scholarships available for up to 4 weeks.",
    ageRange: "6-12",
    cost: "$150-$250/week",
    location: "Boys & Girls Club, Bellevue",
    url: "https://www.bgcbellevue.org/",
    registrationDeadline: "Rolling registration",
    documents: ["Club membership form", "Medical form"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "camp-galileo",
    name: "Camp Galileo",
    provider: "Galileo Learning",
    category: "sports",
    subcategory: "multi-sport",
    tags: ["multi-sport", "STEAM", "outdoor"],
    neighborhood: "bellevue",
    description: "Acclaimed STEAM + outdoor adventure combo. Creative projects in the morning, outdoor activities in the afternoon. Innovation-focused curriculum that changes each week.",
    sentiment: "\"Best camp ever!\" — multiple parent reviews. Well-organized, counselors are engaged and kind. Early bird: $50 off/week before Feb 28.",
    ageRange: "5-10",
    cost: "$450-$600/week",
    location: "11033 NE 24th St area, Bellevue",
    url: "https://galileo-camps.com/our-camps/locations/bellevue/",
    registrationDeadline: "$50 off/week if enrolled by Feb 28, 2026",
    documents: ["Online registration"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },
  {
    id: "steve-kates",
    name: "Steve & Kate's Camp",
    provider: "Steve & Kate's",
    category: "sports",
    subcategory: "multi-sport",
    tags: ["multi-sport", "self-directed", "media", "baking"],
    neighborhood: "bellevue",
    description: "Self-directed day camp — kids choose activities minute-to-minute: Media Lab, Sewing Salon, Bakery, Sports, Water Games. No pre-planning needed. Automatic refunds for missed days.",
    sentiment: "Parents love the flexibility — \"completely low-stress.\" Staff remember every kid's name. Two Bellevue locations.",
    ageRange: "4-12",
    cost: "$500-$700/week",
    location: "Forest Ridge School, Bellevue",
    url: "https://steveandkatescamp.com/bellevue/",
    registrationDeadline: "Rolling — flexible scheduling",
    documents: ["Online registration"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09", "w10"]
  },
  {
    id: "sammamish-ymca-sports",
    name: "Sammamish YMCA Sports Camp",
    provider: "YMCA of Greater Seattle",
    category: "sports",
    subcategory: "multi-sport",
    tags: ["multi-sport", "swimming", "basketball", "soccer"],
    neighborhood: "sammamish",
    description: "Multi-sport camp with daily swimming, team sports, and outdoor games. YMCA values of caring, honesty, respect, and responsibility woven throughout.",
    sentiment: "Reliable, well-organized YMCA program. Financial aid available. Inclusive environment.",
    ageRange: "5-12",
    cost: "$250-$400/week",
    location: "Sammamish YMCA",
    url: "https://www.seattleymca.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Online registration", "Medical form"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },

  // ═══════════════════════════════════════════════
  //  ARTS & CREATIVE EXPRESSION
  // ═══════════════════════════════════════════════

  // — Theater —
  {
    id: "studio-east",
    name: "Studio East — PlayMakers",
    provider: "Studio East",
    category: "arts",
    subcategory: "theater",
    tags: ["musical theater", "acting", "singing", "dancing"],
    neighborhood: "kirkland",
    description: "Immersive theater camp — rehearse and perform a full musical! Singing, dancing, costumes, and a live performance for family. Founded 1992.",
    sentiment: "Extremely popular — sells out early. Yelp reviews praise it as \"excellent.\" Financial aid available.",
    ageRange: "8-11",
    cost: "$400-$550/2-week session",
    location: "Studio East, Kirkland",
    url: "https://studio-east.org/summer-camps/",
    registrationDeadline: "Opens Feb/March 2026 — very popular",
    documents: ["Online registration", "Emergency contact form"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "bellevue-youth-theatre",
    name: "Bellevue Youth Theatre Camp",
    provider: "City of Bellevue Parks",
    category: "arts",
    subcategory: "theater",
    tags: ["theater", "acting", "singing"],
    neighborhood: "bellevue",
    description: "City-funded theater program — every kid who auditions gets a part! Theater day camps, acting, singing, and performance.",
    sentiment: "\"The best kept secret in Bellevue.\" Staff are warm, welcoming, and inclusive. Affordable city program.",
    ageRange: "6-14",
    cost: "$50 registration + camp fee",
    location: "Bellevue Youth Theatre, 16051 NE 10th St",
    url: "https://bellevuewa.gov/city-government/departments/parks/community-centers/bellevue-youth-theatre/classes-camps",
    registrationDeadline: "Check City of Bellevue website",
    documents: ["$50 non-refundable registration fee", "Online registration"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "village-theatre",
    name: "Village Theatre KIDSTAGE",
    provider: "Village Theatre",
    category: "arts",
    subcategory: "theater",
    tags: ["musical theater", "acting", "writing", "design"],
    neighborhood: "issaquah",
    description: "Widest variety of youth theater camps on the Eastside. Acting, musical theatre, writing, design — half-day and full-day options.",
    sentiment: "A major Eastside institution. Financial aid available — no student turned away. 10% multi-camp discount.",
    ageRange: "5-14",
    cost: "$300-$500/session",
    location: "Village Theatre, Issaquah",
    url: "https://villagetheatre.org/youth-education/classes-camps/kidstage-summer-camps/",
    registrationDeadline: "Check website",
    documents: ["Online registration"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "sct-improv",
    name: "Seattle Children's Theatre Camp",
    provider: "Seattle Children's Theatre",
    category: "arts",
    subcategory: "theater",
    tags: ["theater", "improv", "acting"],
    neighborhood: "seattle",
    description: "Drama camps at the legendary Seattle Children's Theatre. Improv, scene work, ensemble building, and original performance creation.",
    sentiment: "World-class theater company's education program. Professional teaching artists lead every session.",
    ageRange: "6-16",
    cost: "$350-$550/week",
    location: "Seattle Center, Seattle",
    url: "https://www.sct.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Online registration"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },

  // — Dance —
  {
    id: "pacific-nw-ballet",
    name: "PNB Summer Course",
    provider: "Pacific Northwest Ballet",
    category: "arts",
    subcategory: "dance",
    tags: ["ballet", "contemporary"],
    neighborhood: "seattle",
    description: "Summer dance intensives from Pacific Northwest Ballet. Classical ballet technique, contemporary dance, and performance preparation. Multiple levels available.",
    sentiment: "One of the top ballet companies in the US. World-class instruction. Audition required for advanced levels.",
    ageRange: "7-16",
    cost: "$400-$700/week",
    location: "PNB Studios, Seattle Center",
    url: "https://www.pnb.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Online registration", "Photo"],
    weeks: ["w02", "w03", "w04", "w05", "w06"]
  },
  {
    id: "bellevue-dance-camp",
    name: "Eastside Dance Academy Camp",
    provider: "Eastside Dance Academy",
    category: "arts",
    subcategory: "dance",
    tags: ["hip-hop", "jazz", "contemporary", "ballet"],
    neighborhood: "bellevue",
    description: "Dance camp offering hip-hop, jazz, contemporary, and ballet. Learn choreography, perform at end-of-week showcase. All levels welcome.",
    sentiment: "Energetic and fun. Kids love the hip-hop sessions. Supportive instructors for beginners.",
    ageRange: "5-14",
    cost: "$250-$400/week",
    location: "Eastside Dance Academy, Bellevue",
    url: "https://www.eastsidedanceacademy.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w02", "w04", "w06", "w08"]
  },

  // — Music —
  {
    id: "musicworks",
    name: "Music Works Northwest",
    provider: "Music Works Northwest",
    category: "arts",
    subcategory: "music",
    tags: ["piano", "guitar", "voice", "ukulele"],
    neighborhood: "bellevue",
    description: "Piano, voice, guitar, ukulele, electronic music, and musical theater camps. Ensemble playing, music games, and a mini-recital. Non-profit community music school.",
    sentiment: "Parents love the nurturing environment. Kids feel safe while having fun and learning.",
    ageRange: "4-16",
    cost: "$330-$530/week",
    location: "Music Works NW, Bellevue/Redmond border",
    url: "https://www.musicworksnw.org/summer-camps",
    registrationDeadline: "Opens spring 2026",
    documents: ["Online registration"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "byso-music",
    name: "BYSO Summer Music Program",
    provider: "Bellevue Youth Symphony Orchestra",
    category: "arts",
    subcategory: "music",
    tags: ["orchestra", "ensemble", "chamber music"],
    neighborhood: "bellevue",
    description: "Orchestra and ensemble camp. Work with professional musicians on repertoire, chamber music, and sectionals. End-of-session concert for families.",
    sentiment: "For kids already playing an instrument. Excellent for motivated young musicians.",
    ageRange: "7-14",
    cost: "$350-$500/week",
    location: "Bellevue (venue varies)",
    url: "https://www.byso.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Online registration", "Teacher recommendation (optional)"],
    weeks: ["w03", "w04"]
  },
  {
    id: "rockory",
    name: "Rockory Rock Band Camp",
    provider: "Rockory",
    category: "arts",
    subcategory: "music",
    tags: ["rock band", "guitar", "drums", "vocals"],
    neighborhood: "kirkland",
    description: "Form a band, learn songs, perform a live show! Vocals, guitar, bass, drums, and keys. All experience levels. End-of-week concert for parents.",
    sentiment: "Super fun format. Kids love performing for real audiences. Great for building confidence.",
    ageRange: "7-14",
    cost: "$350-$450/week",
    location: "Rockory, Kirkland",
    url: "https://www.rockory.com/",
    registrationDeadline: "Check website",
    documents: ["Online registration"],
    weeks: ["w02", "w05", "w07"]
  },
  {
    id: "school-of-rock",
    name: "School of Rock Camp",
    provider: "School of Rock Bellevue",
    category: "arts",
    subcategory: "music",
    tags: ["rock band", "guitar", "bass", "drums"],
    neighborhood: "bellevue",
    description: "Rock band camp where kids form bands, rehearse classic and modern rock songs, and perform a live concert. Instruments provided if needed.",
    sentiment: "National franchise with great curriculum. Performance-focused — builds confidence fast.",
    ageRange: "7-16",
    cost: "$400-$550/week",
    location: "School of Rock, Bellevue",
    url: "https://www.schoolofrock.com/bellevue",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w01", "w03", "w05", "w07"]
  },

  // — Visual Arts —
  {
    id: "fashion-forward",
    name: "Fashion Forward Camp",
    provider: "Fashion Forward",
    category: "arts",
    subcategory: "visual-arts",
    tags: ["fashion", "sewing", "design"],
    neighborhood: "bellevue",
    description: "Design and sew your own fashion creations! Sketching, fabric selection, basic sewing, and styling. Culminates in a mini fashion show.",
    sentiment: "Unique creative outlet. Kids take home real garments they designed and made.",
    ageRange: "8-14",
    cost: "$350-$500/week",
    location: "Bellevue (location TBA)",
    url: "https://www.fashionforwardcamp.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Online registration"],
    weeks: ["w03", "w05", "w07"]
  },
  {
    id: "gage-academy",
    name: "Gage Academy Art Camp",
    provider: "Gage Academy of Art",
    category: "arts",
    subcategory: "visual-arts",
    tags: ["painting", "drawing", "sculpting"],
    neighborhood: "seattle",
    description: "Drawing, painting, sculpture, and mixed media camps led by professional artists. Develop real artistic skills in a supportive studio environment.",
    sentiment: "One of the top art schools in the PNW. Teaching artists are working professionals. Beautiful studio spaces.",
    ageRange: "8-16",
    cost: "$350-$500/week",
    location: "Gage Academy, Capitol Hill, Seattle",
    url: "https://www.gageacademy.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "kirkland-arts-center",
    name: "Kirkland Arts Center Summer Camp",
    provider: "Kirkland Arts Center",
    category: "arts",
    subcategory: "visual-arts",
    tags: ["painting", "pottery", "printmaking"],
    neighborhood: "kirkland",
    description: "Art camps in painting, pottery, printmaking, and mixed media. Explore different artistic mediums each week. Camps for various age groups.",
    sentiment: "Beloved community art center. Excellent instructors who inspire creativity. Gorgeous lakeside setting.",
    ageRange: "5-14",
    cost: "$250-$400/week",
    location: "Kirkland Arts Center, downtown Kirkland",
    url: "https://www.kirklandartscenter.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },

  // — Digital Arts —
  {
    id: "digital-media-academy",
    name: "Digital Media Academy",
    provider: "Digital Media Academy",
    category: "arts",
    subcategory: "digital-arts",
    tags: ["filmmaking", "animation", "graphic design"],
    neighborhood: "bellevue",
    description: "Camps in filmmaking, 3D animation, graphic design, and photography. Industry-standard tools and software. Create a portfolio-quality project.",
    sentiment: "Tech-meets-art approach perfect for the Eastside. Kids produce impressive final projects.",
    ageRange: "8-16",
    cost: "$500-$700/week",
    location: "Bellevue College area",
    url: "https://www.digitalmediaacademy.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Online registration"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "reel-kids",
    name: "Reel Kids Film Camp",
    provider: "Reel Kids",
    category: "arts",
    subcategory: "digital-arts",
    tags: ["filmmaking", "video", "editing"],
    neighborhood: "seattle",
    description: "Write, direct, act, and edit your own short film! Learn cinematography, sound design, and storytelling. Premiere screening for families on Friday.",
    sentiment: "Kids are amazed by what they create in just one week. Great for aspiring YouTubers and filmmakers.",
    ageRange: "8-16",
    cost: "$400-$550/week",
    location: "Various Seattle locations",
    url: "https://www.reelkids.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w03", "w05", "w07"]
  },

  // ═══════════════════════════════════════════════
  //  STEM & ACADEMIC
  // ═══════════════════════════════════════════════

  // — Technology & Coding —
  {
    id: "idtech",
    name: "iD Tech Camp",
    provider: "iD Tech",
    category: "stem",
    subcategory: "coding",
    tags: ["coding", "Python", "Roblox", "Minecraft", "AI"],
    neighborhood: "bellevue",
    description: "Industry-leading tech camp: coding (Python, Scratch), game design (Roblox, Minecraft), robotics, AI. Small class sizes, expert instructors.",
    sentiment: "The gold standard for tech camps. Premium price but top-tier instruction.",
    ageRange: "7-12",
    cost: "$600-$900/week",
    location: "Bellevue College, Bellevue",
    url: "https://www.idtech.com/",
    registrationDeadline: "Opens early 2026 — popular weeks sell out",
    documents: ["Online registration", "Medical/allergy info"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "icode",
    name: "iCode Bellevue",
    provider: "iCode",
    category: "stem",
    subcategory: "coding",
    tags: ["LEGO Robotics", "Scratch", "Minecraft", "Roblox"],
    neighborhood: "bellevue",
    description: "LEGO Robotics, Scratch coding, Minecraft modding, Roblox game creation. Fun project-based learning in small groups with patient instructors.",
    sentiment: "Affordable alternative to iD Tech. Kids love the hands-on projects. Small groups mean more attention.",
    ageRange: "6-14",
    cost: "$350-$500/week",
    location: "iCode Bellevue, 1515 127th St SE",
    url: "https://www.icodeschool.com/bellevue",
    registrationDeadline: "Rolling — check website",
    documents: ["Online registration"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07"]
  },
  {
    id: "code-ninjas",
    name: "Code Ninjas Camp",
    provider: "Code Ninjas",
    category: "stem",
    subcategory: "coding",
    tags: ["coding", "game development", "Scratch", "JavaScript"],
    neighborhood: "redmond",
    description: "Game-building coding camps where kids create their own video games. Scratch for beginners, JavaScript for intermediate. Ninja belt progression system.",
    sentiment: "Kids love the game-building focus. The belt system keeps them motivated. Multiple Eastside locations.",
    ageRange: "5-14",
    cost: "$300-$450/week",
    location: "Code Ninjas, Redmond",
    url: "https://www.codeninjas.com/redmond-wa",
    registrationDeadline: "Rolling registration",
    documents: ["Online registration"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "alexa-cafe",
    name: "Alexa Cafe (all-girls tech)",
    provider: "iD Tech",
    category: "stem",
    subcategory: "coding",
    tags: ["coding", "girls", "entrepreneurship", "STEM"],
    neighborhood: "bellevue",
    description: "All-girls tech camp emphasizing entrepreneurship and philanthropy alongside coding, game design, and robotics. Collaborative, project-based environment.",
    sentiment: "Empowering program for girls. Unique philanthropic angle. Same quality as iD Tech in a supportive all-girls environment.",
    ageRange: "10-15",
    cost: "$600-$900/week",
    location: "Bellevue College",
    url: "https://www.idtech.com/alexa-cafe",
    registrationDeadline: "Spring 2026",
    documents: ["Online registration"],
    weeks: ["w03", "w05", "w07"]
  },

  // — Natural Sciences —
  {
    id: "pacsci-mercer",
    name: "PacSci Camps at Mercer Slough",
    provider: "Pacific Science Center",
    category: "stem",
    subcategory: "natural-sciences",
    tags: ["science", "nature", "experiments"],
    neighborhood: "bellevue",
    description: "Award-winning science camps at the Mercer Slough Environmental Education Center. Explore 320 acres of wetlands through hands-on experiments.",
    sentiment: "\"This is the only camp my child will do.\" Over 100 camp themes. Member early reg Feb 2.",
    ageRange: "5-14",
    cost: "$350-$500/week",
    location: "Mercer Slough Environmental Education Center, Bellevue",
    url: "https://pacificsciencecenter.org/education/camps/",
    registrationDeadline: "Member reg: Feb 2, 2026. Public: Feb 9, 2026.",
    documents: ["Online registration"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },
  {
    id: "wise-camps",
    name: "WISE Summer Camps",
    provider: "WISE Camps",
    category: "stem",
    subcategory: "natural-sciences",
    tags: ["STEAM", "sports", "science"],
    neighborhood: "bellevue",
    description: "Hands-on STEAM activities plus sports and outdoor fun. Morning sports + afternoon STEAM projects. Lunch included daily.",
    sentiment: "\"Best value compared to other camps.\" Kids leap into the car excited. Families come back year after year.",
    ageRange: "5-12",
    cost: "$300-$450/week",
    location: "Chinook Middle School, Bellevue",
    url: "https://www.wisecamps.com/bellevue-summer-camps/",
    registrationDeadline: "Check website",
    documents: ["Online registration"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "mad-science",
    name: "Mad Science Camp",
    provider: "Mad Science of Seattle",
    category: "stem",
    subcategory: "natural-sciences",
    tags: ["science", "experiments", "chemistry", "physics"],
    neighborhood: "kirkland",
    description: "Explosive science experiments, chemistry, physics, and space exploration. Hands-on experiments every day. Themed weeks like NASA Space, Crazy Chemistry, and Spy Science.",
    sentiment: "Kids love the wow-factor experiments. Each day has a take-home project. Engaging presenters.",
    ageRange: "5-12",
    cost: "$300-$400/week",
    location: "Various Kirkland/Eastside locations",
    url: "https://seattle.madscience.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w02", "w03", "w05", "w07", "w09"]
  },

  // — Engineering —
  {
    id: "play-well-lego",
    name: "Play-Well LEGO Engineering",
    provider: "Play-Well TEKnologies",
    category: "stem",
    subcategory: "engineering",
    tags: ["LEGO", "engineering", "physics"],
    neighborhood: "bellevue",
    description: "Learn engineering and physics principles through LEGO! Build 2 projects per day with tens of thousands of LEGO parts. Themed weeks: Star Wars, Harry Potter, and more.",
    sentiment: "\"He has never learned so much, so fast.\" Awesome instructors — kids love them.",
    ageRange: "5-12",
    cost: "$250-$400/week",
    location: "Various Bellevue/Eastside locations",
    url: "https://www.play-well.org/camps.php",
    registrationDeadline: "Check website for Bellevue dates",
    documents: ["Online registration"],
    weeks: ["w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "museum-of-flight",
    name: "Museum of Flight ACE Camp",
    provider: "Museum of Flight",
    category: "stem",
    subcategory: "engineering",
    tags: ["aerospace", "aviation", "engineering"],
    neighborhood: "seattle",
    description: "Aerospace Camp Experience — hands-on aviation and space activities, group projects, experiments, visits from aerospace professionals.",
    sentiment: "Incredible facility. Registration opens Feb 20 for members. Camperships available.",
    ageRange: "5-14",
    cost: "$400-$550/week",
    location: "Museum of Flight, Seattle (Tukwila border)",
    url: "https://www.museumofflight.org/ace",
    registrationDeadline: "Member reg: Feb 20. Public: Feb 21.",
    documents: ["Online registration"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09", "w10"]
  },
  {
    id: "steamoji",
    name: "Steamoji Maker Academy",
    provider: "Steamoji",
    category: "stem",
    subcategory: "engineering",
    tags: ["maker", "3D printing", "electronics"],
    neighborhood: "kirkland",
    description: "Creative STEAM camp combining coding, electronics, 3D printing, and maker projects. Kids build real projects they take home.",
    sentiment: "Unique maker focus — kids get to keep what they build. Great for hands-on learners.",
    ageRange: "6-12",
    cost: "$350-$450/week",
    location: "Steamoji, Kirkland",
    url: "https://www.steamoji.com/",
    registrationDeadline: "Check website for 2026 dates",
    documents: ["Online registration", "Liability waiver"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "first-lego-league",
    name: "FIRST LEGO League Camp",
    provider: "FIRST Washington",
    category: "stem",
    subcategory: "engineering",
    tags: ["LEGO", "robotics", "competition"],
    neighborhood: "redmond",
    description: "Intro to FIRST LEGO League robotics competition. Build and program LEGO Mindstorm robots to complete missions. Teamwork and engineering design process.",
    sentiment: "Pipeline to competitive robotics. Kids learn real programming and engineering skills in a fun format.",
    ageRange: "9-14",
    cost: "$350-$500/week",
    location: "DigiPen Institute, Redmond",
    url: "https://www.firstwa.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w03", "w05", "w07"]
  },

  // — Humanities & Logic —
  {
    id: "chess-wizards",
    name: "Chess Wizards Camp",
    provider: "Chess Wizards",
    category: "stem",
    subcategory: "humanities",
    tags: ["chess", "strategy"],
    neighborhood: "bellevue",
    description: "Chess camp for all levels. Opening theory, tactics, endgames, and tournament play. Daily puzzles, team challenges, and fun chess variants.",
    sentiment: "Makes chess fun and accessible. Kids improve rapidly. Small class sizes allow personalized instruction.",
    ageRange: "5-14",
    cost: "$250-$350/week",
    location: "Various Bellevue locations",
    url: "https://www.chesswizards.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "writopia-lab",
    name: "Writopia Lab Writing Camp",
    provider: "Writopia Lab",
    category: "stem",
    subcategory: "humanities",
    tags: ["creative writing", "storytelling"],
    neighborhood: "seattle",
    description: "Creative writing camp where kids develop stories, poems, screenplays, and graphic novels. Workshop format with peer feedback. Published anthology at end.",
    sentiment: "National award-winning program. Writers flourish in this supportive, creative environment. Small groups.",
    ageRange: "8-16",
    cost: "$400-$550/week",
    location: "Various Seattle locations",
    url: "https://www.writopialab.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "debate-camp-eastside",
    name: "Eastside Debate Academy",
    provider: "Eastside Debate Academy",
    category: "stem",
    subcategory: "humanities",
    tags: ["debate", "public speaking"],
    neighborhood: "bellevue",
    description: "Public speaking and debate camp. Learn argumentation, research skills, and persuasive speaking. Practice rounds and mini-tournament on the final day.",
    sentiment: "Builds critical thinking and confidence. Great preparation for middle school speech and debate.",
    ageRange: "9-16",
    cost: "$300-$450/week",
    location: "Bellevue area",
    url: "https://www.eastsidedebateacademy.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w03", "w05", "w07"]
  },

  // ═══════════════════════════════════════════════
  //  ADVENTURE & WILDERNESS
  // ═══════════════════════════════════════════════

  // — Outdoor Survival —
  {
    id: "wilderness-awareness",
    name: "Wilderness Awareness School",
    provider: "Wilderness Awareness School",
    category: "adventure",
    subcategory: "outdoor-survival",
    tags: ["nature", "tracking", "survival", "mentoring"],
    neighborhood: "woodinville",
    description: "Nature discovery camp using \"coyote mentoring\" techniques. Animal tracking, plant ID, shelter building, knot-tying, fire safety. Small staff-to-student ratio.",
    sentiment: "ParentMap \"Best Nature Camp\" 9 YEARS IN A ROW. 4.8 stars. \"Our son comes home dirty, tired, and bursting with knowledge.\"",
    ageRange: "6-14",
    cost: "$585-$1,795/session",
    location: "Duvall / Woodinville area",
    url: "https://wildernessawareness.org/youth-programs/summer-camps/",
    registrationDeadline: "Prices increase after Jan 31. Financial aid available.",
    documents: ["Online registration", "Medical form", "Liability waiver"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "wolf-camp",
    name: "Wolf Camp at Lake Sammamish",
    provider: "Wolf Camp & School of Natural Science",
    category: "adventure",
    subcategory: "outdoor-survival",
    tags: ["wilderness", "survival", "cooking", "herbology"],
    neighborhood: "issaquah",
    description: "Wilderness survival, herbology, wildlife search & rescue, wild cooking. Hallmark 6:1 student-teacher ratio for safe, profound outdoor experiences.",
    sentiment: "Golden Teddy Award winner for \"Best Wild Nature Day Camp.\" Passionate, skilled instructors.",
    ageRange: "7-14",
    cost: "$350-$500/week",
    location: "Lake Sammamish State Park",
    url: "https://wolfcamp.org/",
    registrationDeadline: "Check website",
    documents: ["Online registration", "Medical form"],
    weeks: ["w02", "w03", "w04", "w06", "w07", "w09"]
  },
  {
    id: "trackers-earth",
    name: "Trackers Earth Outdoor Camp",
    provider: "Trackers Earth",
    category: "adventure",
    subcategory: "outdoor-survival",
    tags: ["nature", "survival", "archery", "fort building"],
    neighborhood: "kirkland",
    description: "Story-driven nature-immersion camps: wilderness survival, archery, fort building, ninjas, secret agents. Creative adventures that get kids outdoors.",
    sentiment: "\"My child loves Trackers like no other camp.\" Incredible parent loyalty. Staff radiate serenity and competence.",
    ageRange: "6-12",
    cost: "$350-$500/week",
    location: "Kirkland (various parks)",
    url: "https://seattle.trackersearth.com/",
    registrationDeadline: "Opens spring 2026",
    documents: ["Online registration", "Medical form", "Liability waiver"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },

  // — High-Adrenaline —
  {
    id: "avid4-adventure",
    name: "Avid4 Adventure Camp",
    provider: "Avid4 Adventure",
    category: "adventure",
    subcategory: "high-adrenaline",
    tags: ["paddleboarding", "kayaking", "rock climbing", "mountain biking"],
    neighborhood: "bellevue",
    description: "Paddleboarding, kayaking, rock climbing, mountain biking, and hiking. Build confidence and outdoor skills. Siblings can attend together!",
    sentiment: "Parents rave about confidence-building. \"My son came home incredibly confident.\" Counselors praised as awesome.",
    ageRange: "6-13",
    cost: "$450-$600/week",
    location: "Bellevue area (various outdoor sites)",
    url: "https://avid4.com/bellevue-washington-summer-camps/",
    registrationDeadline: "Opens January 2026 — sells out fast",
    documents: ["Online registration", "Medical form", "Swim assessment", "Liability waiver"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09", "w10"]
  },
  {
    id: "stone-gardens-climbing",
    name: "Stone Gardens Climbing Camp",
    provider: "Stone Gardens",
    category: "adventure",
    subcategory: "high-adrenaline",
    tags: ["rock climbing", "bouldering"],
    neighborhood: "bellevue",
    description: "Indoor rock climbing camp with bouldering, top-rope, and lead climbing instruction. Technique, safety, and problem-solving on the wall.",
    sentiment: "Kids love climbing. Safe, supervised environment. Builds physical and mental strength.",
    ageRange: "6-14",
    cost: "$350-$500/week",
    location: "Stone Gardens, Bellevue",
    url: "https://stonegardens.com/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Waiver"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "evergreen-mtb",
    name: "Evergreen Mountain Bike Camp",
    provider: "Evergreen Mountain Bike Alliance",
    category: "adventure",
    subcategory: "high-adrenaline",
    tags: ["mountain biking", "trails"],
    neighborhood: "issaquah",
    description: "Mountain biking skills camp on real trails! Learn cornering, braking, climbing, and descending. Trail rides at Tiger Mountain and Duthie Hill.",
    sentiment: "Amazing trails right in our backyard. Experienced instructors keep kids safe. Bike provided if needed.",
    ageRange: "8-16",
    cost: "$400-$550/week",
    location: "Tiger Mountain / Duthie Hill, Issaquah",
    url: "https://www.evergreenmtb.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Waiver", "Bike inspection"],
    weeks: ["w03", "w05", "w07", "w09"]
  },

  // — Nature Study —
  {
    id: "overlake-farm",
    name: "Overlake Farm Horse Camp",
    provider: "Overlake Farm",
    category: "adventure",
    subcategory: "nature-study",
    tags: ["horseback riding", "horses", "farm"],
    neighborhood: "bellevue",
    description: "Horseback riding camp on a 50-acre farm — the oldest horse farm in Bellevue. Riding lessons, grooming, horsemanship, and games. Adjacent to Bridle Trails!",
    sentiment: "Beautiful setting. Exceptional horse-centered program with decades of experience.",
    ageRange: "8-12",
    cost: "$400-$600/week",
    location: "Overlake Farm, Bellevue (adjacent to Bridle Trails State Park)",
    url: "https://overlakefarmbellevue.com/camp/",
    registrationDeadline: "Check website — popular",
    documents: ["Registration form", "Medical release", "Liability waiver"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "seattle-aquarium",
    name: "Seattle Aquarium Camp",
    provider: "Seattle Aquarium",
    category: "adventure",
    subcategory: "nature-study",
    tags: ["marine biology", "ocean", "animals"],
    neighborhood: "seattle",
    description: "Marine biology camps at the Seattle Aquarium. Explore tide pools, meet ocean animals, conduct experiments, and learn about marine conservation.",
    sentiment: "Incredible hands-on experience with real marine animals. Kids come home obsessed with the ocean.",
    ageRange: "5-12",
    cost: "$350-$500/week",
    location: "Seattle Aquarium, Pier 59, Seattle",
    url: "https://www.seattleaquarium.org/camps",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "woodland-park-zoo",
    name: "Woodland Park Zoo Camp",
    provider: "Woodland Park Zoo",
    category: "adventure",
    subcategory: "nature-study",
    tags: ["animals", "wildlife", "conservation"],
    neighborhood: "seattle",
    description: "Zoo-based camp exploring animal behavior, habitats, and conservation. Behind-the-scenes tours, animal encounters, and nature crafts.",
    sentiment: "Kids get up-close animal experiences you can't get as a regular visitor. Educational and fun.",
    ageRange: "4-14",
    cost: "$300-$450/week",
    location: "Woodland Park Zoo, Seattle",
    url: "https://www.zoo.org/camps",
    registrationDeadline: "Spring 2026 — popular",
    documents: ["Registration form"],
    weeks: ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },
  {
    id: "tilth-alliance-farm",
    name: "Tilth Alliance Farm Camp",
    provider: "Tilth Alliance",
    category: "adventure",
    subcategory: "nature-study",
    tags: ["farming", "garden", "sustainability"],
    neighborhood: "seattle",
    description: "Farm and garden camp at the Good Shepherd Center. Plant, harvest, cook, and explore sustainable food systems. Hands-on from soil to plate.",
    sentiment: "Unique urban farming experience. Kids love getting their hands dirty. Great snacks from the garden!",
    ageRange: "5-12",
    cost: "$300-$400/week",
    location: "Tilth Alliance, Good Shepherd Center, Seattle",
    url: "https://tilthalliance.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w03", "w05", "w07"]
  },

  // — Sleepaway —
  {
    id: "sambica",
    name: "SAMBICA Lakefront Camp",
    provider: "SAMBICA",
    category: "adventure",
    subcategory: "sleepaway",
    tags: ["swimming", "kayaking", "high ropes", "campfire"],
    neighborhood: "bellevue",
    description: "Day and overnight camps on the shores of Lake Sammamish. Swimming, kayaking, canoeing, high ropes, campfires, and sand volleyball on 9 acres.",
    sentiment: "\"My daughter has attended for 6 years — she loves it.\" Christian-based but welcoming. Over 100 years of history.",
    ageRange: "7-15",
    cost: "$350-$550/week",
    location: "4114 W Lake Sammamish Pkwy SE, Bellevue",
    url: "https://www.sambica.com/",
    registrationDeadline: "Opens spring 2026",
    documents: ["Online registration", "Medical form", "Swim assessment"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },
  {
    id: "camp-orkila",
    name: "Camp Orkila (YMCA)",
    provider: "YMCA of Greater Seattle",
    category: "adventure",
    subcategory: "sleepaway",
    tags: ["sleepaway", "sailing", "kayaking", "archery", "hiking"],
    neighborhood: "seattle",
    description: "Overnight camp on Orcas Island! Sailing, kayaking, archery, hiking, campfires, and lifelong friendships. 1-week and 2-week sessions available.",
    sentiment: "Transformative experience. Kids come back different — more confident, independent, and resilient. YMCA financial aid available.",
    ageRange: "8-16",
    cost: "$800-$1,200/week",
    location: "Orcas Island (transport from Seattle)",
    url: "https://www.camporkila.org/",
    registrationDeadline: "Opens February 2026",
    documents: ["Online registration", "Medical form", "Immunization records"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },
  {
    id: "camp-sealth",
    name: "Camp Sealth",
    provider: "Camp Fire",
    category: "adventure",
    subcategory: "sleepaway",
    tags: ["sleepaway", "nature", "swimming", "arts"],
    neighborhood: "seattle",
    description: "Overnight camp on Vashon Island. Nature exploration, swimming, canoeing, arts and crafts, campfires, and outdoor living skills. 1-week sessions.",
    sentiment: "Classic Pacific Northwest sleepaway camp. Affordable with scholarship options. Kids make lifelong friends.",
    ageRange: "6-16",
    cost: "$500-$800/week",
    location: "Vashon Island (ferry transport from Seattle)",
    url: "https://www.campsealth.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Medical form", "Immunization records"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },

  // ═══════════════════════════════════════════════
  //  LIFE SKILLS & SPECIALIZED
  // ═══════════════════════════════════════════════

  // — Culinary —
  {
    id: "froglegs-cooking",
    name: "FrogLegs Cooking School Camp",
    provider: "FrogLegs Cooking School",
    category: "life",
    subcategory: "culinary",
    tags: ["cooking", "baking", "international cuisine"],
    neighborhood: "kirkland",
    description: "Kids cooking camp! Themed weeks (Food Truck Chef, Baking, International Cuisine). Hands-on cooking, healthy eating habits. Accommodates allergies.",
    sentiment: "\"Super cute and clean place.\" Kids leave looking forward to more. Caters to dietary needs.",
    ageRange: "5-14",
    cost: "$350-$500/week",
    location: "FrogLegs, 501 Market St, Kirkland",
    url: "https://froglegskca.com/summer-cooking-camps/",
    registrationDeadline: "Check website",
    documents: ["Online registration", "Allergy/dietary info"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08"]
  },
  {
    id: "froglegs-redmond",
    name: "FrogLegs Cooking Camp (Redmond)",
    provider: "FrogLegs Cooking School",
    category: "life",
    subcategory: "culinary",
    tags: ["cooking", "baking"],
    neighborhood: "redmond",
    description: "Same great FrogLegs cooking camp at the Redmond location. Themed cooking weeks with hands-on instruction. All dietary needs accommodated.",
    sentiment: "Convenient Redmond location. Same quality as the Kirkland flagship.",
    ageRange: "5-14",
    cost: "$350-$500/week",
    location: "FrogLegs, Redmond",
    url: "https://froglegskca.com/summer-cooking-camps/",
    registrationDeadline: "Check website",
    documents: ["Online registration", "Allergy/dietary info"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "taste-buds-kitchen",
    name: "Taste Buds Kitchen Camp",
    provider: "Taste Buds Kitchen",
    category: "life",
    subcategory: "culinary",
    tags: ["cooking", "baking", "farm-to-table"],
    neighborhood: "bellevue",
    description: "Culinary camp where kids learn real cooking techniques, food science, and nutrition. Themed weeks: Pastry Chef, World Traveler, Junior MasterChef.",
    sentiment: "Professional kitchen designed for kids. Excellent instruction. Kids cook a full meal each day.",
    ageRange: "5-14",
    cost: "$400-$550/week",
    location: "Taste Buds Kitchen, Bellevue",
    url: "https://www.tastebudskitchen.com/bellevue",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Allergy info"],
    weeks: ["w02", "w03", "w05", "w07", "w09"]
  },

  // — Leadership & Business —
  {
    id: "junior-achievement",
    name: "Junior Achievement BizTown",
    provider: "Junior Achievement of Washington",
    category: "life",
    subcategory: "leadership",
    tags: ["entrepreneurship", "business", "financial literacy"],
    neighborhood: "bellevue",
    description: "Kids run their own businesses in a simulated economy! Financial literacy, entrepreneurship, marketing, and teamwork. Apply for jobs, earn wages, manage budgets.",
    sentiment: "Eye-opening experience. Kids learn about money, work, and responsibility in a fun, immersive way.",
    ageRange: "8-14",
    cost: "$300-$450/week",
    location: "JA BizTown, Bellevue",
    url: "https://www.juniorachievement.org/web/jawash/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w03", "w05", "w07"]
  },
  {
    id: "camp-invention",
    name: "Camp Invention",
    provider: "National Inventors Hall of Fame",
    category: "life",
    subcategory: "leadership",
    tags: ["invention", "entrepreneurship", "STEM", "creativity"],
    neighborhood: "redmond",
    description: "STEM + entrepreneurship camp where kids solve real-world problems through invention. Design, build, test, and pitch their creations. New curriculum each year.",
    sentiment: "National program with stellar reputation. Curriculum designed by National Inventors Hall of Fame inductees.",
    ageRange: "6-12",
    cost: "$275-$400/week",
    location: "Various Redmond elementary schools",
    url: "https://www.invent.org/programs/camp-invention",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form"],
    weeks: ["w03", "w04", "w06", "w08"]
  },

  // — Special Needs —
  {
    id: "outdoors-for-all",
    name: "Outdoors for All Summer Camp",
    provider: "Outdoors for All Foundation",
    category: "life",
    subcategory: "special-needs",
    tags: ["adaptive", "therapeutic", "outdoor", "inclusive"],
    neighborhood: "seattle",
    description: "Adaptive outdoor recreation camp for children with disabilities. Cycling, kayaking, skiing, hiking, and more with specialized instruction. Inclusive and supportive.",
    sentiment: "Life-changing program. \"My child did things I never thought possible.\" Expert adaptive instructors.",
    ageRange: "5-16",
    cost: "$250-$400/week",
    location: "Various Seattle/Eastside locations",
    url: "https://outdoorsforall.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Medical/accommodation info"],
    weeks: ["w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09"]
  },
  {
    id: "autism-society-camp",
    name: "Autism Society Camp Connect",
    provider: "Autism Society of Washington",
    category: "life",
    subcategory: "special-needs",
    tags: ["autism", "sensory-friendly", "therapeutic", "social skills"],
    neighborhood: "bellevue",
    description: "Sensory-friendly camp designed for children on the autism spectrum. Social skills groups, structured activities, sensory breaks, and fun. Low staff-to-camper ratio.",
    sentiment: "Finally a camp where my child feels comfortable and welcomed. Staff truly understand autism.",
    ageRange: "5-16",
    cost: "$200-$400/week",
    location: "Bellevue area",
    url: "https://www.autismsocietyofwa.org/",
    registrationDeadline: "Spring 2026",
    documents: ["Registration form", "Medical form", "Accommodation plan"],
    weeks: ["w02", "w04", "w06", "w08"]
  },
  {
    id: "camp-korey",
    name: "Camp Korey",
    provider: "Camp Korey (SeriousFun Network)",
    category: "life",
    subcategory: "special-needs",
    tags: ["medical", "therapeutic", "inclusive"],
    neighborhood: "woodinville",
    description: "Free camp for children with serious medical conditions. Horseback riding, fishing, boating, arts, and more — all adapted for medical needs. Part of the SeriousFun Network (founded by Paul Newman).",
    sentiment: "Absolutely incredible — free of charge. Life-changing for kids who can't attend regular camps. World-class medical staff on-site.",
    ageRange: "7-16",
    cost: "FREE",
    location: "Camp Korey, Carnation/Woodinville area",
    url: "https://www.campkorey.org/",
    registrationDeadline: "Application-based",
    documents: ["Application", "Medical records", "Physician approval"],
    weeks: ["w03", "w04", "w05", "w06", "w07", "w08"]
  }
];
