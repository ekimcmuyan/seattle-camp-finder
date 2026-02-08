// ============================================================
// Greater Seattle Camp Finder — App Logic
// ============================================================
(function () {
  "use strict";

  // ── Constants ──
  const PROFILE_KEY = "campFinderProfile";
  const SCHEDULE_KEY = "campFinderSchedule";
  const HOWTO_SEEN_KEY = "campFinderHowtoSeen";
  const KID_COLORS = ["#2e86de", "#e84393", "#00b894", "#f39c12"];
  const ALL_KIDS_COLOR = "#3E6B48";

  // ── State ──
  let currentCategory = "all-camps";
  let currentSubcategory = "all";
  let currentView = "browse";
  let searchQuery = "";
  let activeInterestKid = 0;

  // ── Category color map ──
  const catColorMap = {};
  CATEGORIES.forEach(c => { catColorMap[c.id] = c.color; });

  // ── Helpers ──
  function getProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROFILE_KEY));
      if (!raw) return null;
      return migrateProfile(raw);
    } catch { return null; }
  }
  function setProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
  function getSchedule() {
    try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || {}; } catch { return {}; }
  }
  function setSchedule(sched) {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(sched));
    updateScheduleCount();
  }
  function updateScheduleCount() {
    const el = document.getElementById("scheduleCount");
    if (el) el.textContent = Object.keys(getSchedule()).length;
  }
  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
  function getCatColor(catId) { return catColorMap[catId] || "#636e72"; }
  function getWeekById(wid) { return SUMMER_WEEKS.find(w => w.id === wid); }
  function getCampById(cid) { return CAMPS.find(c => c.id === cid); }

  // ── Profile migration ──
  function migrateProfile(profile) {
    // Add district if missing (old profiles)
    if (!profile.district) {
      profile.district = "bsd405";
    }
    // Add summerStart/summerEnd if missing
    if (!profile.summerStart || !profile.summerEnd) {
      const d = SCHOOL_DISTRICTS[profile.district];
      if (d && d.lastDay) {
        profile.summerStart = d.lastDay;
        profile.summerEnd = d.firstDay;
      } else {
        profile.summerStart = "2026-06-23";
        profile.summerEnd = "2026-09-08";
      }
    }
    // Migrate old top-level interests to per-kid interests
    if (profile.interests && profile.kids) {
      const hasOldInterests = Array.isArray(profile.interests) && profile.interests.length > 0;
      const kidsNeedInterests = profile.kids.some(k => !k.interests || k.interests.length === 0);
      if (hasOldInterests && kidsNeedInterests) {
        profile.kids.forEach(k => {
          if (!k.interests || k.interests.length === 0) {
            k.interests = [...profile.interests];
          }
        });
      }
      delete profile.interests;
    }
    // Ensure every kid has an interests array
    if (profile.kids) {
      profile.kids.forEach(k => {
        if (!k.interests) k.interests = [];
      });
    }
    return profile;
  }

  // ── Kid cycling logic ──
  function cycleKids(currentIndices, numKids) {
    if (!currentIndices || currentIndices.length === 0) {
      return [0];
    }
    if (numKids === 1) {
      return [];
    }
    if (currentIndices.length === 1) {
      const idx = currentIndices[0];
      if (idx < numKids - 1) {
        return [idx + 1];
      }
      return Array.from({ length: numKids }, (_, i) => i);
    }
    return [];
  }

  function getKidLabel(indices, kids) {
    if (!indices || indices.length === 0) return "";
    if (indices.length === kids.length && kids.length > 1) {
      return kids.map(k => k.name.charAt(0)).join("+");
    }
    return indices.map(i => kids[i] ? kids[i].name.charAt(0) : "?").join("+");
  }

  function getKidColor(indices, kids) {
    if (!indices || indices.length === 0) return "#ccc";
    if (indices.length === kids.length && kids.length > 1) return ALL_KIDS_COLOR;
    if (indices.length === 1) return kids[indices[0]] ? kids[indices[0]].color : "#ccc";
    return ALL_KIDS_COLOR;
  }

  function getKidBgColor(color) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},0.12)`;
  }

  function ageMatches(ageRange, kids) {
    if (!ageRange || !kids || kids.length === 0) return false;
    const match = ageRange.match(/(\d+)\s*[-\u2013]\s*(\d+)/);
    if (!match) return false;
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);
    return kids.some(k => k.age >= min && k.age <= max);
  }

  // ══════════════════════════════════════════════
  //  ONBOARDING WIZARD
  // ══════════════════════════════════════════════
  let wizardStep = 1;
  let wizardData = {
    district: "",
    summerStart: "",
    summerEnd: "",
    neighborhoods: [],
    kidCount: 0,
    kids: []
  };

  function showWizard(existingProfile) {
    const wizard = document.getElementById("wizard");
    const mainApp = document.getElementById("mainApp");
    wizard.style.display = "flex";
    mainApp.style.display = "none";

    if (existingProfile) {
      wizardData.district = existingProfile.district || "";
      wizardData.summerStart = existingProfile.summerStart || "";
      wizardData.summerEnd = existingProfile.summerEnd || "";
      wizardData.neighborhoods = [...existingProfile.neighborhoods];
      wizardData.kids = existingProfile.kids.map(k => ({ ...k, interests: [...(k.interests || [])] }));
      wizardData.kidCount = existingProfile.kids.length;
    } else {
      wizardData = { district: "", summerStart: "", summerEnd: "", neighborhoods: [], kidCount: 0, kids: [] };
    }

    wizardStep = 1;
    activeInterestKid = 0;
    renderWizardStep();
  }

  function hideWizard() {
    document.getElementById("wizard").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
  }

  function renderWizardStep() {
    document.querySelectorAll(".wizard-step-dot").forEach(dot => {
      const s = parseInt(dot.dataset.step);
      dot.classList.remove("active", "done");
      if (s === wizardStep) dot.classList.add("active");
      if (s < wizardStep) dot.classList.add("done");
    });

    document.querySelectorAll(".wizard-step").forEach(step => step.classList.remove("active"));
    document.getElementById("wizardStep" + wizardStep).classList.add("active");

    document.querySelectorAll(".wizard-error").forEach(e => e.classList.remove("show"));

    if (wizardStep === 1) renderDistrictStep();
    if (wizardStep === 2) renderNeighborhoods();
    if (wizardStep === 3) renderKidsForm();
    if (wizardStep === 4) renderPerKidInterests();
  }

  // ── Step 1: District ──
  function renderDistrictStep() {
    const select = document.getElementById("districtSelect");
    // Only populate if not already populated
    if (select.options.length <= 1) {
      Object.entries(SCHOOL_DISTRICTS).forEach(([id, d]) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = d.label;
        select.appendChild(opt);
      });
    }

    if (wizardData.district) {
      select.value = wizardData.district;
    }

    updateDistrictUI();

    select.onchange = function () {
      wizardData.district = select.value;
      const d = SCHOOL_DISTRICTS[select.value];
      if (d && d.lastDay) {
        wizardData.summerStart = d.lastDay;
        wizardData.summerEnd = d.firstDay;
      } else {
        wizardData.summerStart = "";
        wizardData.summerEnd = "";
      }
      updateDistrictUI();
    };

    // Custom date listeners
    const customLast = document.getElementById("customLastDay");
    const customFirst = document.getElementById("customFirstDay");
    if (wizardData.district === "other") {
      customLast.value = wizardData.summerStart || "";
      customFirst.value = wizardData.summerEnd || "";
    }
    customLast.onchange = function () {
      wizardData.summerStart = customLast.value;
      updateDistrictPreview();
    };
    customFirst.onchange = function () {
      wizardData.summerEnd = customFirst.value;
      updateDistrictPreview();
    };
  }

  function updateDistrictUI() {
    const customFields = document.getElementById("customDateFields");
    if (wizardData.district === "other") {
      customFields.style.display = "block";
      const customLast = document.getElementById("customLastDay");
      const customFirst = document.getElementById("customFirstDay");
      customLast.value = wizardData.summerStart || "";
      customFirst.value = wizardData.summerEnd || "";
    } else {
      customFields.style.display = "none";
    }
    updateDistrictPreview();
  }

  function updateDistrictPreview() {
    const preview = document.getElementById("districtPreview");
    if (!wizardData.summerStart || !wizardData.summerEnd) {
      preview.textContent = "";
      return;
    }
    const weeks = generateSummerWeeks(wizardData.summerStart, wizardData.summerEnd);
    const startDate = new Date(wizardData.summerStart + "T00:00:00");
    const endDate = new Date(wizardData.summerEnd + "T00:00:00");
    preview.textContent = `${weeks.length} weeks, ${formatShortDate(startDate)}\u2013${formatShortDate(endDate)}`;
  }

  // ── Step 2: Neighborhoods ──
  function renderNeighborhoods() {
    const grid = document.getElementById("neighborhoodGrid");
    grid.innerHTML = NEIGHBORHOOD_AREAS.map(area => {
      const options = area.neighborhoods.map(n => {
        const sel = wizardData.neighborhoods.includes(n.id) ? "selected" : "";
        return `<span class="neighborhood-option ${sel}" data-id="${n.id}">${n.label}</span>`;
      }).join("");
      return `<div class="neighborhood-area">
        <div class="neighborhood-area-title">${esc(area.area)}</div>
        <div class="neighborhood-options">${options}</div>
      </div>`;
    }).join("");

    grid.querySelectorAll(".neighborhood-option").forEach(opt => {
      opt.addEventListener("click", () => {
        const id = opt.dataset.id;
        if (wizardData.neighborhoods.includes(id)) {
          wizardData.neighborhoods = wizardData.neighborhoods.filter(n => n !== id);
          opt.classList.remove("selected");
        } else {
          wizardData.neighborhoods.push(id);
          opt.classList.add("selected");
        }
      });
    });
  }

  // ── Step 3: Kids ──
  function renderKidsForm() {
    document.querySelectorAll(".kid-count-btn").forEach(btn => {
      btn.classList.toggle("selected", parseInt(btn.dataset.count) === wizardData.kidCount);
    });

    const form = document.getElementById("kidsForm");
    if (wizardData.kidCount === 0) {
      form.innerHTML = "";
      return;
    }

    while (wizardData.kids.length < wizardData.kidCount) {
      const idx = wizardData.kids.length;
      wizardData.kids.push({ name: "", age: 9, color: KID_COLORS[idx] || KID_COLORS[0], interests: [] });
    }
    wizardData.kids = wizardData.kids.slice(0, wizardData.kidCount);

    form.innerHTML = wizardData.kids.map((kid, i) => {
      const ageOptions = Array.from({ length: 13 }, (_, a) => a + 4).map(age =>
        `<option value="${age}" ${kid.age === age ? "selected" : ""}>Age ${age}</option>`
      ).join("");
      return `<div class="kid-row">
        <div class="kid-color-dot" style="background:${kid.color}"></div>
        <input type="text" placeholder="Kid ${i + 1}'s name" value="${esc(kid.name)}" data-kid="${i}">
        <select data-kid="${i}">${ageOptions}</select>
      </div>`;
    }).join("");

    form.querySelectorAll("input[type=text]").forEach(input => {
      input.addEventListener("input", () => {
        wizardData.kids[parseInt(input.dataset.kid)].name = input.value.trim();
      });
    });
    form.querySelectorAll("select").forEach(sel => {
      sel.addEventListener("change", () => {
        wizardData.kids[parseInt(sel.dataset.kid)].age = parseInt(sel.value);
      });
    });
  }

  // ── Step 4: Per-Kid Interests ──
  function renderPerKidInterests() {
    // Render kid tabs
    const tabContainer = document.getElementById("kidInterestTabs");
    tabContainer.innerHTML = wizardData.kids.map((kid, i) => {
      const active = i === activeInterestKid ? "active" : "";
      const bgStyle = i === activeInterestKid ? `background:${kid.color};border-color:${kid.color};` : "";
      return `<button class="kid-interest-tab ${active}" style="${bgStyle}" data-kid="${i}">
        <span class="kid-tab-dot" style="background:${kid.color}"></span>
        ${esc(kid.name || "Kid " + (i + 1))}
      </button>`;
    }).join("");

    tabContainer.querySelectorAll(".kid-interest-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        activeInterestKid = parseInt(tab.dataset.kid);
        renderPerKidInterests();
      });
    });

    // Render interests grid for active kid
    const grid = document.getElementById("interestsGrid");
    const kidInterests = wizardData.kids[activeInterestKid]?.interests || [];

    grid.innerHTML = CATEGORIES.map(cat => {
      const subs = SUBCATEGORIES[cat.id] || [];
      const options = subs.map(sub => {
        const sel = kidInterests.includes(sub.id) ? "selected" : "";
        const bg = sel ? `background:${cat.color};border-color:${cat.color};` : "";
        return `<span class="interest-option ${sel}" style="${bg}" data-id="${sub.id}" data-cat-color="${cat.color}">
          <span>${sub.icon}</span> ${sub.label}
        </span>`;
      }).join("");
      return `<div class="interest-category">
        <div class="interest-category-title" style="color:${cat.color}">
          <span>${cat.icon}</span> ${cat.label}
        </div>
        <div class="interest-options">${options}</div>
      </div>`;
    }).join("");

    grid.querySelectorAll(".interest-option").forEach(opt => {
      opt.addEventListener("click", () => {
        const id = opt.dataset.id;
        const color = opt.dataset.catColor;
        const interests = wizardData.kids[activeInterestKid].interests;
        if (interests.includes(id)) {
          wizardData.kids[activeInterestKid].interests = interests.filter(i => i !== id);
          opt.classList.remove("selected");
          opt.style.background = "";
          opt.style.borderColor = "";
        } else {
          interests.push(id);
          opt.classList.add("selected");
          opt.style.background = color;
          opt.style.borderColor = color;
        }
      });
    });
  }

  function initWizardNav() {
    // Kid count buttons
    document.querySelectorAll(".kid-count-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        wizardData.kidCount = parseInt(btn.dataset.count);
        renderKidsForm();
      });
    });

    // Step 1 → 2 (District)
    document.getElementById("wizardNext1").addEventListener("click", () => {
      if (!wizardData.district) {
        document.getElementById("districtError").classList.add("show");
        return;
      }
      if (wizardData.district === "other" && (!wizardData.summerStart || !wizardData.summerEnd)) {
        document.getElementById("districtError").classList.add("show");
        return;
      }
      wizardStep = 2;
      renderWizardStep();
    });

    // Step 2 → 1
    document.getElementById("wizardBack2").addEventListener("click", () => {
      wizardStep = 1;
      renderWizardStep();
    });

    // Step 2 → 3 (Neighborhoods)
    document.getElementById("wizardNext2").addEventListener("click", () => {
      if (wizardData.neighborhoods.length === 0) {
        document.getElementById("neighborhoodError").classList.add("show");
        return;
      }
      wizardStep = 3;
      renderWizardStep();
    });

    // Step 3 → 2
    document.getElementById("wizardBack3").addEventListener("click", () => {
      wizardStep = 2;
      renderWizardStep();
    });

    // Step 3 → 4 (Kids)
    document.getElementById("wizardNext3").addEventListener("click", () => {
      if (wizardData.kidCount === 0 || wizardData.kids.some(k => !k.name)) {
        document.getElementById("kidsError").classList.add("show");
        return;
      }
      wizardStep = 4;
      activeInterestKid = 0;
      renderWizardStep();
    });

    // Step 4 → 3
    document.getElementById("wizardBack4").addEventListener("click", () => {
      wizardStep = 3;
      renderWizardStep();
    });

    // Finish
    document.getElementById("wizardFinish").addEventListener("click", () => {
      // Validate: each kid must have at least one interest
      const allHaveInterests = wizardData.kids.every(k => k.interests && k.interests.length > 0);
      if (!allHaveInterests) {
        document.getElementById("interestsError").classList.add("show");
        return;
      }

      const profile = {
        district: wizardData.district,
        summerStart: wizardData.summerStart,
        summerEnd: wizardData.summerEnd,
        neighborhoods: wizardData.neighborhoods,
        kids: wizardData.kids.map((k, i) => ({
          name: k.name,
          age: k.age,
          color: KID_COLORS[i] || KID_COLORS[0],
          interests: [...k.interests]
        }))
      };
      setProfile(profile);
      hideWizard();
      initApp();
    });
  }

  // ══════════════════════════════════════════════
  //  MAIN APP
  // ══════════════════════════════════════════════

  function initApp() {
    const profile = getProfile();
    if (!profile) return;

    // Generate summer weeks from profile dates
    generateSummerWeeks(profile.summerStart, profile.summerEnd);

    // Update header subtitle
    const subtitle = document.getElementById("headerSubtitle");
    const kidNames = profile.kids.map(k => k.name).join(" & ");
    subtitle.textContent = kidNames ? `Summer camps for ${kidNames}` : "Summer Camps for the Greater Seattle Area";

    // School note
    const districtInfo = SCHOOL_DISTRICTS[profile.district];
    const districtLabel = districtInfo ? districtInfo.label : profile.district;
    const startDate = new Date(profile.summerStart + "T00:00:00");
    const endDate = new Date(profile.summerEnd + "T00:00:00");
    document.getElementById("schoolNote").textContent =
      `${districtLabel}: ${SUMMER_WEEKS.length} weeks, ${formatShortDate(startDate)}\u2013${formatShortDate(endDate)}`;

    updateScheduleCount();

    // View nav
    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    // Home button (reopens wizard)
    document.getElementById("settingsBtn").addEventListener("click", () => {
      showWizard(getProfile());
    });

    // Help button
    document.getElementById("helpBtn").addEventListener("click", showHowTo);
    document.getElementById("howtoClose").addEventListener("click", hideHowTo);
    document.getElementById("howtoGotIt").addEventListener("click", hideHowTo);
    document.getElementById("howtoOverlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) hideHowTo();
    });

    // Show how-to on first visit
    if (!localStorage.getItem(HOWTO_SEEN_KEY)) {
      showHowTo();
    }

    // Search
    const searchBar = document.getElementById("searchBar");
    const searchClear = document.getElementById("searchClear");
    searchBar.addEventListener("input", () => {
      searchQuery = searchBar.value.trim().toLowerCase();
      searchClear.style.display = searchQuery ? "block" : "none";
      renderBrowseView();
    });
    searchClear.addEventListener("click", () => {
      searchBar.value = "";
      searchQuery = "";
      searchClear.style.display = "none";
      renderBrowseView();
    });

    // Calendar hint
    const calHint = document.getElementById("calendarHint");
    if (profile.kids.length === 1) {
      calHint.textContent = `Click week chips to schedule for ${profile.kids[0].name}. Click again to remove.`;
    } else {
      const names = profile.kids.map(k => k.name);
      calHint.textContent = `Click week chips to cycle: ${names.join(" \u2192 ")} \u2192 All \u2192 off.`;
    }

    // Initial render
    currentCategory = "all-camps";
    currentSubcategory = "all";
    renderBrowseView();
    renderLegends();
  }

  // ── Legends ──
  function renderLegends() {
    const profile = getProfile();
    if (!profile) return;

    const legendHtml = profile.kids.map(kid =>
      `<span class="legend-item"><span class="legend-dot" style="background:${kid.color}"></span> ${esc(kid.name)}</span>`
    ).join("");
    const allHtml = profile.kids.length > 1
      ? `<span class="legend-item"><span class="legend-dot" style="background:${ALL_KIDS_COLOR}"></span> All Kids</span>`
      : "";

    document.getElementById("scheduleLegend").innerHTML = legendHtml + allHtml;
    document.getElementById("calendarLegend").innerHTML = legendHtml + allHtml;
  }

  // ══════════════════════════════════════════════
  //  BROWSE VIEW — 3 Sections
  // ══════════════════════════════════════════════

  function getNeighborhoodCamps(profile) {
    return CAMPS.filter(c => profile.neighborhoods.includes(c.neighborhood));
  }

  function getRecommendedForKid(kidIndex, profile) {
    const kid = profile.kids[kidIndex];
    if (!kid || !kid.interests || kid.interests.length === 0) return [];
    const neighborhoodCamps = getNeighborhoodCamps(profile);
    return neighborhoodCamps.filter(c => kid.interests.includes(c.subcategory));
  }

  function getOneDropoffCamps(profile) {
    if (!profile.kids || profile.kids.length < 2) return [];
    const neighborhoodCamps = getNeighborhoodCamps(profile);
    return neighborhoodCamps.filter(c => {
      return profile.kids.every(k => (k.interests || []).includes(c.subcategory));
    });
  }

  function getNewThingsToTry(profile) {
    const allKidInterests = new Set();
    profile.kids.forEach(k => {
      (k.interests || []).forEach(i => allKidInterests.add(i));
    });

    // Collect adjacent subcategories
    const adjacentSubs = new Set();
    allKidInterests.forEach(interest => {
      const adj = ADJACENCY_MAP[interest] || [];
      adj.forEach(a => {
        if (!allKidInterests.has(a)) adjacentSubs.add(a);
      });
    });

    if (adjacentSubs.size === 0) return [];

    const neighborhoodCamps = getNeighborhoodCamps(profile);
    return neighborhoodCamps.filter(c => adjacentSubs.has(c.subcategory));
  }

  function renderBrowseView() {
    const profile = getProfile();
    if (!profile) return;

    const recSection = document.getElementById("recommendedSections");
    const newSection = document.getElementById("newThingsSection");
    const fullListSection = document.getElementById("fullListSection");

    if (searchQuery) {
      // When searching: hide A & B, filter C only
      recSection.innerHTML = "";
      newSection.innerHTML = "";
      fullListSection.style.display = "block";
      renderCategoryTabs();
      renderSubcategoryChips();
      renderFullListCamps();
      return;
    }

    // Section A: Recommended for each kid
    let recHtml = "";
    profile.kids.forEach((kid, i) => {
      const camps = getRecommendedForKid(i, profile);
      if (camps.length === 0) return;
      recHtml += `<div class="browse-section">
        <h3 class="browse-section-title">
          <span class="kid-dot" style="background:${kid.color}"></span>
          Recommended for ${esc(kid.name)}
        </h3>
        <div class="recommended-scroll-row" id="recRow${i}">
          ${camps.map(c => renderCard(c)).join("")}
        </div>
      </div>`;
    });
    recSection.innerHTML = recHtml;

    // Bind week chips in recommended sections
    profile.kids.forEach((kid, i) => {
      const row = document.getElementById("recRow" + i);
      if (row) bindWeekChips(row);
    });

    // Section B1: One Drop-off Options
    const oneDropoffCamps = getOneDropoffCamps(profile);
    let dropoffHtml = "";
    if (oneDropoffCamps.length > 0 && profile.kids.length >= 2) {
      const kidNames = profile.kids.map(k => k.name);
      const namesStr = kidNames.length === 2
        ? kidNames.join(" & ")
        : kidNames.slice(0, -1).join(", ") + " & " + kidNames[kidNames.length - 1];
      dropoffHtml = `<div class="browse-section">
        <h3 class="browse-section-title">
          <span class="dropoff-icon">&#128664;</span>
          One Drop-off Options
          <span class="browse-section-subtitle">— camps ${namesStr} all love</span>
        </h3>
        <div class="recommended-scroll-row" id="oneDropoffRow">
          ${oneDropoffCamps.map(c => renderCard(c)).join("")}
        </div>
      </div>`;
    }

    // Section B2: New Things to Try
    const newCamps = getNewThingsToTry(profile);
    let newHtml = "";
    if (newCamps.length > 0) {
      newHtml = `<div class="browse-section">
        <h3 class="browse-section-title">New Things to Try</h3>
        <div class="recommended-scroll-row" id="newThingsRow">
          ${newCamps.map(c => renderCard(c)).join("")}
        </div>
      </div>`;
    }

    newSection.innerHTML = dropoffHtml + newHtml;

    const dropoffRow = document.getElementById("oneDropoffRow");
    if (dropoffRow) bindWeekChips(dropoffRow);
    const newRow = document.getElementById("newThingsRow");
    if (newRow) bindWeekChips(newRow);

    // Section C: Full List
    fullListSection.style.display = "block";
    renderCategoryTabs();
    renderSubcategoryChips();
    renderFullListCamps();
    initScrollHints();
  }

  function initScrollHints() {
    document.querySelectorAll(".recommended-scroll-row").forEach(row => {
      const wrapper = row.closest(".scroll-row-wrapper");
      if (wrapper) return;

      const parent = row.parentNode;
      const wrap = document.createElement("div");
      wrap.className = "scroll-row-wrapper";
      parent.insertBefore(wrap, row);
      wrap.appendChild(row);

      const hint = document.createElement("div");
      hint.className = "scroll-hint";
      hint.innerHTML = '<span class="scroll-hint-arrow">&rsaquo;</span>';
      wrap.appendChild(hint);

      function updateHint() {
        const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 10;
        hint.classList.toggle("hidden", atEnd);
      }
      row.addEventListener("scroll", updateHint, { passive: true });
      updateHint();

      hint.addEventListener("click", () => {
        row.scrollBy({ left: 320, behavior: "smooth" });
      });
    });
  }

  // ── Full List Filtering ──
  function getFilteredCamps() {
    const profile = getProfile();
    if (!profile) return [];

    let camps = getNeighborhoodCamps(profile);

    // Search filter
    if (searchQuery) {
      camps = camps.filter(c => {
        const haystack = (c.name + " " + c.description + " " + (c.tags || []).join(" ") + " " + c.provider).toLowerCase();
        return haystack.includes(searchQuery);
      });
    }

    // Category filter
    if (currentCategory !== "all-camps") {
      camps = camps.filter(c => c.category === currentCategory);
    }

    // Subcategory filter
    if (currentSubcategory !== "all" && currentCategory !== "all-camps") {
      camps = camps.filter(c => c.subcategory === currentSubcategory);
    }

    return camps;
  }

  function getCampCountForCategory(catId) {
    const profile = getProfile();
    if (!profile) return 0;
    const inNeighborhood = getNeighborhoodCamps(profile);
    if (catId === "all-camps") {
      return inNeighborhood.length;
    }
    return inNeighborhood.filter(c => c.category === catId).length;
  }

  // ── Category Tabs ──
  function renderCategoryTabs() {
    const container = document.getElementById("categoryTabs");
    const profile = getProfile();
    if (!profile) return;

    // "All Camps" tab first
    const allCount = getCampCountForCategory("all-camps");
    const allActive = currentCategory === "all-camps" ? "active" : "";
    const allBg = currentCategory === "all-camps" ? "background:#3D2B1F;border-color:#3D2B1F;" : "";

    let html = `<button class="cat-tab ${allActive}" style="${allBg}" data-cat="all-camps">
      All Camps <span class="cat-count">(${allCount})</span>
    </button>`;

    html += CATEGORIES.map(cat => {
      const count = getCampCountForCategory(cat.id);
      const active = cat.id === currentCategory ? "active" : "";
      const bg = cat.id === currentCategory ? `background:${cat.color};border-color:${cat.color};` : "";
      return `<button class="cat-tab ${active}" style="${bg}" data-cat="${cat.id}">
        <span>${cat.icon}</span> ${cat.label} <span class="cat-count">(${count})</span>
      </button>`;
    }).join("");

    container.innerHTML = html;

    container.querySelectorAll(".cat-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        currentCategory = btn.dataset.cat;
        currentSubcategory = "all";
        renderCategoryTabs();
        renderSubcategoryChips();
        renderFullListCamps();
      });
    });
  }

  // ── Subcategory Chips ──
  function renderSubcategoryChips() {
    const container = document.getElementById("subcategoryChips");

    if (currentCategory === "all-camps") {
      container.innerHTML = "";
      return;
    }

    const subs = SUBCATEGORIES[currentCategory] || [];
    if (subs.length === 0) {
      container.innerHTML = "";
      return;
    }

    const catColor = getCatColor(currentCategory);
    const allActive = currentSubcategory === "all" ? "active" : "";
    const allBg = currentSubcategory === "all" ? `background:${catColor};border-color:${catColor};` : "";

    let html = `<button class="sub-chip ${allActive}" style="${allBg}" data-sub="all">All</button>`;
    html += subs.map(sub => {
      const active = currentSubcategory === sub.id ? "active" : "";
      const bg = currentSubcategory === sub.id ? `background:${catColor};border-color:${catColor};` : "";
      return `<button class="sub-chip ${active}" style="${bg}" data-sub="${sub.id}">
        <span>${sub.icon}</span> ${sub.label}
      </button>`;
    }).join("");

    container.innerHTML = html;

    container.querySelectorAll(".sub-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        currentSubcategory = chip.dataset.sub;
        renderSubcategoryChips();
        renderFullListCamps();
      });
    });
  }

  // ── Camp Card ──
  function renderCard(camp) {
    const profile = getProfile();
    const color = getCatColor(camp.category);
    const catObj = CATEGORIES.find(c => c.id === camp.category);
    const catLabel = catObj ? catObj.label : camp.category;
    const subObj = SUBCATEGORY_MAP[camp.subcategory];
    const subLabel = subObj ? subObj.label : "";
    const schedule = getSchedule();

    // Check if recommended for any kid
    const recommendedKids = profile ? profile.kids.filter(k => (k.interests || []).includes(camp.subcategory)) : [];
    const isRecommended = recommendedKids.length > 0;
    const ageMatch = profile && ageMatches(camp.ageRange, profile.kids);

    // Week chips
    const weeksHtml = camp.weeks.map(wid => {
      const week = getWeekById(wid);
      if (!week) return "";
      const key = camp.id + "::" + wid;
      const indices = schedule[key] || [];
      const hasAssignment = indices.length > 0;
      const kidColor = hasAssignment ? getKidColor(indices, profile.kids) : "";
      const kidBg = hasAssignment ? getKidBgColor(kidColor) : "";
      const label = hasAssignment
        ? getKidLabel(indices, profile.kids) + " " + week.label
        : week.label;
      const style = hasAssignment
        ? `background:${kidBg};color:${kidColor};border-color:${kidColor};`
        : "";
      const cls = hasAssignment ? "assigned" : "";

      let hint = "";
      if (profile.kids.length === 1) {
        hint = `Click to schedule for ${profile.kids[0].name}`;
      } else {
        hint = "Click to cycle: " + profile.kids.map(k => k.name).join(" \u2192 ") + " \u2192 All \u2192 off";
      }

      return `<span class="week-chip ${cls}" style="${style}" data-camp="${camp.id}" data-week="${wid}" title="${hint}">${esc(label)}</span>`;
    }).join("");

    const sentimentHtml = camp.sentiment
      ? `<div class="card-sentiment">${esc(camp.sentiment)}</div>`
      : "";

    const docsHtml = camp.documents && camp.documents.length
      ? `<div class="card-docs"><strong>Docs:</strong> ${camp.documents.map(esc).join(", ")}</div>`
      : "";

    const starHtml = isRecommended ? '<span class="star-badge" title="Matches your interests">\u2B50</span>' : "";

    const ageClass = ageMatch ? " age-match" : "";

    let weeksHintText = "";
    if (profile.kids.length === 1) {
      weeksHintText = `(click to schedule for ${profile.kids[0].name})`;
    } else {
      weeksHintText = "(click to schedule)";
    }

    return `
      <div class="camp-card" data-id="${camp.id}">
        <div class="card-accent" style="background:${color}"></div>
        <div class="card-body">
          <div class="card-header">
            <h3>${esc(camp.name)}</h3>
            ${starHtml}
          </div>
          <div class="provider">${esc(camp.provider)}</div>
          <div class="card-badges">
            <span class="category-badge" style="background:${color}">${esc(catLabel)}</span>
            <span class="subcategory-badge">${esc(subLabel)}</span>
          </div>
          <p class="card-description">${esc(camp.description)}</p>
          ${sentimentHtml}
          <div class="card-meta">
            <div class="meta-row"><span class="meta-icon">&#128100;</span><span class="meta-value${ageClass}">Ages ${esc(camp.ageRange)}</span></div>
            <div class="meta-row"><span class="meta-icon">&#128205;</span><span class="meta-value">${esc(camp.location)}</span></div>
            <div class="meta-row"><span class="meta-icon">&#128197;</span><span class="meta-value">${esc(camp.registrationDeadline)}</span></div>
          </div>
          <div class="card-weeks">
            <div class="weeks-label">Available Weeks <span class="weeks-hint">${weeksHintText}</span></div>
            <div class="weeks-list">${weeksHtml}</div>
          </div>
          ${docsHtml}
        </div>
        <div class="card-footer">
          <span class="cost-tag">${esc(camp.cost)}</span>
          <a href="${esc(camp.url)}" target="_blank" rel="noopener" class="register-btn" style="background:${color}">REGISTER &rarr;</a>
        </div>
      </div>`;
  }

  // ── Render Full List Camps ──
  function renderFullListCamps() {
    const grid = document.getElementById("campsGrid");
    const empty = document.getElementById("emptyState");
    const camps = getFilteredCamps();

    if (camps.length === 0) {
      grid.innerHTML = "";
      empty.style.display = "block";
    } else {
      empty.style.display = "none";
      grid.innerHTML = camps.map(renderCard).join("");
      bindWeekChips(grid);
    }
  }

  // ── Week Chip Click ──
  function bindWeekChips(container) {
    const profile = getProfile();
    if (!profile) return;

    container.querySelectorAll(".week-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const campId = chip.dataset.camp;
        const weekId = chip.dataset.week;
        const key = campId + "::" + weekId;
        const schedule = getSchedule();
        const current = schedule[key] || [];
        const next = cycleKids(current, profile.kids.length);

        if (next.length > 0) {
          schedule[key] = next;
        } else {
          delete schedule[key];
        }
        setSchedule(schedule);

        const week = getWeekById(weekId);
        const hasAssignment = next.length > 0;
        const kidColor = hasAssignment ? getKidColor(next, profile.kids) : "";
        const kidBg = hasAssignment ? getKidBgColor(kidColor) : "";

        chip.className = "week-chip" + (hasAssignment ? " assigned" : "");
        chip.style.background = hasAssignment ? kidBg : "";
        chip.style.color = hasAssignment ? kidColor : "";
        chip.style.borderColor = hasAssignment ? kidColor : "transparent";
        chip.textContent = hasAssignment
          ? getKidLabel(next, profile.kids) + " " + week.label
          : week.label;

        if (currentView === "schedule") renderSchedule();
        if (currentView === "calendar") renderCalendar();
      });
    });
  }

  // ── Schedule View ──
  function renderSchedule() {
    const profile = getProfile();
    if (!profile) return;

    const container = document.getElementById("scheduleContent");
    const empty = document.getElementById("scheduleEmpty");
    const schedule = getSchedule();
    const keys = Object.keys(schedule);

    if (keys.length === 0) {
      container.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    const byWeek = {};
    keys.forEach(key => {
      const [campId, weekId] = key.split("::");
      if (!byWeek[weekId]) byWeek[weekId] = [];
      byWeek[weekId].push({ campId, indices: schedule[key] });
    });

    const weekOrder = SUMMER_WEEKS.map(w => w.id);
    const sortedWeekIds = Object.keys(byWeek).sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b));

    let html = "";
    sortedWeekIds.forEach(weekId => {
      const week = getWeekById(weekId);
      if (!week) return;
      const noteStr = week.note ? ` (${week.note})` : "";
      html += `<div class="schedule-week">
        <div class="schedule-week-header">${esc(week.label)}${noteStr}</div>
        <div class="schedule-week-body">`;

      byWeek[weekId].forEach(({ campId, indices }) => {
        const camp = getCampById(campId);
        if (!camp) return;
        const catObj = CATEGORIES.find(c => c.id === camp.category);
        const kidColor = getKidColor(indices, profile.kids);
        const kidNames = indices.map(i => profile.kids[i] ? profile.kids[i].name : "?").join(", ");

        html += `<div class="schedule-item">
          <span class="schedule-child-dot" style="background:${kidColor}"></span>
          <span class="schedule-child-name">${esc(kidNames)}</span>
          <span class="schedule-camp-name">${esc(camp.name)}</span>
          <span class="schedule-camp-cat">${catObj ? catObj.label : ""}</span>
          <button class="schedule-remove" data-key="${campId}::${weekId}" title="Remove">&times;</button>
        </div>`;
      });
      html += "</div></div>";
    });

    container.innerHTML = html;

    container.querySelectorAll(".schedule-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const schedule = getSchedule();
        delete schedule[btn.dataset.key];
        setSchedule(schedule);
        renderSchedule();
        if (currentView === "browse") renderBrowseView();
      });
    });
  }

  // ── Calendar View ──
  function renderCalendar() {
    const profile = getProfile();
    if (!profile) return;

    const container = document.getElementById("calendarContainer");
    const schedule = getSchedule();
    const keys = Object.keys(schedule);

    if (keys.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Schedule some camps first! Go to Browse and click on week chips.</p></div>';
      return;
    }

    const campIds = [...new Set(keys.map(k => k.split("::")[0]))];
    const camps = campIds.map(getCampById).filter(Boolean);

    const catOrder = CATEGORIES.map(c => c.id);
    camps.sort((a, b) => {
      const ci = catOrder.indexOf(a.category) - catOrder.indexOf(b.category);
      if (ci !== 0) return ci;
      return a.name.localeCompare(b.name);
    });

    let html = '<table class="calendar-table"><thead><tr><th>Camp</th>';
    SUMMER_WEEKS.forEach(w => {
      const isOverlap = w.note ? ' class="school-overlap"' : "";
      html += `<th${isOverlap}>${w.label}</th>`;
    });
    html += "</tr></thead><tbody>";

    camps.forEach(camp => {
      html += "<tr>";
      html += `<td class="camp-name-col" title="${esc(camp.name)}">${esc(camp.name)}</td>`;
      SUMMER_WEEKS.forEach(w => {
        const key = camp.id + "::" + w.id;
        const indices = schedule[key];
        if (indices && indices.length > 0) {
          const kidColor = getKidColor(indices, profile.kids);
          const kidBg = getKidBgColor(kidColor);
          const kidLabel = getKidLabel(indices, profile.kids);
          html += `<td><div class="cal-block" style="background:${kidBg};color:${kidColor};border-left:3px solid ${kidColor};">${kidLabel}</div></td>`;
        } else {
          html += "<td></td>";
        }
      });
      html += "</tr>";
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  }

  // ── How-To Modal ──
  function showHowTo() {
    document.getElementById("howtoOverlay").style.display = "flex";
  }
  function hideHowTo() {
    document.getElementById("howtoOverlay").style.display = "none";
    localStorage.setItem(HOWTO_SEEN_KEY, "1");
  }

  // ── View Switching ──
  function switchView(view) {
    currentView = view;
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));

    const map = { browse: "browseView", schedule: "scheduleView", calendar: "calendarView" };
    document.getElementById(map[view]).classList.add("active");
    document.querySelector(`.view-btn[data-view="${view}"]`).classList.add("active");

    if (view === "browse") renderBrowseView();
    if (view === "schedule") renderSchedule();
    if (view === "calendar") renderCalendar();
  }

  // ── Init ──
  function init() {
    initWizardNav();

    const profile = getProfile();
    if (profile && profile.kids && profile.kids.length > 0 && profile.neighborhoods && profile.neighborhoods.length > 0) {
      hideWizard();
      initApp();
    } else {
      showWizard(null);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
