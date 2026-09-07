(function () {
  var cfg = window.GIFT_CAPITAL;
  var Ref = window.GiftReference;
  var Proj = window.GiftProjection;
  var STORAGE_KEY = "gift-capital-draft-v1";
  var HORIZON_KEY = "gift-capital-horizon-v1";

  var PRESETS = [
    { id: "growth", label: "All growth", growth: 100, balanced: 0, steady: 0, parents: 0 },
    { id: "mostly", label: "Mostly growth", growth: 70, balanced: 20, steady: 10, parents: 0 },
    { id: "balanced", label: "All balanced", growth: 0, balanced: 100, steady: 0, parents: 0 },
    { id: "steady", label: "All steady", growth: 0, balanced: 0, steady: 100, parents: 0 },
    { id: "parents", label: "Parents decide", growth: 0, balanced: 0, steady: 0, parents: 100 },
    { id: "custom", label: "Custom", custom: true },
  ];

  var state = {
    growth: 70,
    balanced: 20,
    steady: 10,
    parents: 0,
    tokenStem: "",
    preset: "mostly",
    age: 0,
    lump: 500,
    monthly: 0,
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var draft = JSON.parse(raw);
      if (!draft || typeof draft !== "object") return;
      state.growth = Number(draft.growth) || 0;
      state.balanced = Number(draft.balanced) || 0;
      state.steady = Number(draft.steady) || 0;
      state.parents = Number(draft.parents) || 0;
      if (draft.token && draft.token.length >= 3) {
        state.tokenStem = String(draft.token).slice(0, 3).toUpperCase();
      }
      state.preset = matchPreset(state) || "custom";
    } catch (e) {
      /* ignore quota / parse errors */
    }
  }

  function loadHorizon() {
    try {
      var raw = localStorage.getItem(HORIZON_KEY);
      if (!raw) return;
      var draft = JSON.parse(raw);
      if (!draft || typeof draft !== "object") return;
      if (draft.age != null) state.age = Proj.clamp(Math.round(Number(draft.age)), 0, 18);
      if (draft.lump != null) state.lump = Proj.clamp(Number(draft.lump), 0, 1000000);
      if (draft.monthly != null) state.monthly = Proj.clamp(Number(draft.monthly), 0, 20000);
    } catch (e) {
      /* ignore */
    }
  }

  function saveHorizon() {
    try {
      localStorage.setItem(
        HORIZON_KEY,
        JSON.stringify({
          age: state.age,
          lump: state.lump,
          monthly: state.monthly,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function saveDraft() {
    try {
      var encoded = Ref.encode(state, state.tokenStem);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          growth: state.growth,
          balanced: state.balanced,
          steady: state.steady,
          parents: state.parents,
          token: encoded.ok ? encoded.token : state.tokenStem,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function matchPreset(alloc) {
    for (var i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i];
      if (p.custom) continue;
      if (
        p.growth === alloc.growth &&
        p.balanced === alloc.balanced &&
        p.steady === alloc.steady &&
        p.parents === alloc.parents
      ) {
        return p.id;
      }
    }
    return "";
  }

  function applyHash() {
    var hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    var decoded = Ref.decode(hash);
    if (!decoded.ok) return;
    state.growth = decoded.alloc.growth;
    state.balanced = decoded.alloc.balanced;
    state.steady = decoded.alloc.steady;
    state.parents = decoded.alloc.parents;
    state.tokenStem = decoded.token.slice(0, 3);
    state.preset = matchPreset(state) || "custom";
  }

  function accountIsLive() {
    return Boolean(
      cfg.accountReady &&
        cfg.ibanDisplay &&
        cfg.ibanCompact &&
        cfg.bic &&
        cfg.accountHolder
    );
  }

  /** In-page section ids — do not overwrite these with a preference code. */
  var SECTION_HASHES = {
    main: true,
    why: true,
    how: true,
    sleeves: true,
    allocate: true,
    horizon: true,
    give: true,
    faq: true,
  };

  function hashId() {
    return (location.hash || "").replace(/^#/, "");
  }

  function shouldWriteCodeHash(current) {
    if (!current) return true;
    if (SECTION_HASHES[current]) return false;
    return Ref.decode(current).ok;
  }

  function fillAccountFields() {
    var live = accountIsLive();
    $all("[data-waiting-block]").forEach(function (el) {
      el.hidden = live;
    });
    $all("[data-waiting-field]").forEach(function (el) {
      el.hidden = live;
    });
    $all("[data-live-account]").forEach(function (el) {
      el.hidden = !live;
    });
    if (!live) return;
    $all("[data-iban]").forEach(function (el) {
      el.textContent = cfg.ibanDisplay;
    });
    $all("[data-iban-compact]").forEach(function (el) {
      el.textContent = cfg.ibanCompact;
    });
    $all("[data-bic]").forEach(function (el) {
      el.textContent = cfg.bic;
    });
    $all("[data-holder]").forEach(function (el) {
      el.textContent = cfg.accountHolder;
    });
    $all("[data-bank]").forEach(function (el) {
      el.textContent = cfg.bankName;
    });
  }

  function currentAlloc() {
    return {
      growth: state.growth,
      balanced: state.balanced,
      steady: state.steady,
      parents: state.parents,
    };
  }

  function encoded() {
    return Ref.encode(currentAlloc(), state.tokenStem);
  }

  function renderHorizon() {
    var ready = $("[data-horizon-ready]");
    var empty = $("[data-horizon-empty]");
    var chart = $("[data-horizon-chart]");
    var readout = $("[data-horizon-readout]");
    var summary = $("[data-horizon-summary]");
    if (!ready || !empty) return;

    var hasMoney = state.lump > 0 || state.monthly > 0;

    $all("[data-horizon]").forEach(function (input) {
      var key = input.getAttribute("data-horizon");
      if (document.activeElement === input) return;
      input.value = state[key];
    });

    if (!hasMoney) {
      ready.hidden = true;
      empty.hidden = false;
      empty.textContent = "Enter a starting gift or a monthly gift to see the illustration.";
      return;
    }

    var model = Proj.project({
      age: state.age,
      lump: state.lump,
      monthly: state.monthly,
    });
    var end = Proj.lastValues(model);
    var endGrowth = Proj.formatEur(end.growth);
    var endBalanced = Proj.formatEur(end.balanced);
    var endSteady = Proj.formatEur(end.steady);
    var yearLabel = model.years === 1 ? "1 year" : model.years + " years";

    ready.hidden = false;
    empty.hidden = true;
    if (chart) chart.innerHTML = Proj.renderChart(model);
    if (readout) {
      readout.innerHTML =
        '<div class="horizon-stat"><span class="label">Growth 6%</span><span class="value">' +
        endGrowth +
        '</span></div><div class="horizon-stat"><span class="label">Balanced 4%</span><span class="value">' +
        endBalanced +
        '</span></div><div class="horizon-stat"><span class="label">Steady 2%</span><span class="value">' +
        endSteady +
        '</span></div><p class="horizon-muted"><span class="swatch is-muted" aria-hidden="true"></span> Parents decide is not plotted — they choose later, so there is no invented path.</p>';
    }
    if (summary) {
      summary.textContent =
        model.years === 0
          ? "She is already 18 in this illustration. Starting gift " +
            Proj.formatEur(model.lump) +
            " is unchanged. Parents decide is not plotted."
          : "Illustration in nominal euros over " +
            yearLabel +
            " until she turns 18: Growth " +
            endGrowth +
            ", Balanced " +
            endBalanced +
            ", Steady " +
            endSteady +
            ". Not a promise, forecast, or advice, and not her real account. Parents decide is not plotted.";
    }
    saveHorizon();
  }

  function render() {
    var alloc = currentAlloc();
    var total = Ref.totalOf(alloc);
    var ok = Ref.validateAlloc(alloc) === "";

    ["growth", "balanced", "steady", "parents"].forEach(function (key) {
      $all('[data-sleeve="' + key + '"]').forEach(function (input) {
        if (document.activeElement === input && input.type === "number") return;
        input.value = alloc[key];
      });
    });

    $all("[data-total]").forEach(function (el) {
      el.textContent = String(total);
    });
    $all("[data-total-bar]").forEach(function (el) {
      el.setAttribute("data-ok", ok ? "true" : "false");
    });

    var delta = 100 - total;
    var hint =
      delta === 0
        ? "Ready — the mix adds up to 100%."
        : delta > 0
          ? "Add " + delta + "% more so the mix reaches 100%."
          : "Remove " + Math.abs(delta) + "% so the mix reaches 100%.";
    $all("[data-total-hint]").forEach(function (el) {
      el.textContent = hint;
    });

    $all(".chip[data-preset]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-preset") === state.preset ? "true" : "false");
    });

    Proj.renderMix($("#live-mix"), $("#live-mix-legend"), alloc);
    renderHorizon();

    var result = encoded();
    if (result.ok) {
      state.tokenStem = result.token.slice(0, 3);
      $all("[data-reference]").forEach(function (el) {
        el.textContent = result.code;
      });
      $all("[data-summary]").forEach(function (el) {
        el.textContent = Ref.summarize(result.alloc);
      });
      if (history.replaceState && shouldWriteCodeHash(hashId())) {
        history.replaceState(null, "", "#" + result.code);
      }
    } else {
      $all("[data-reference]").forEach(function (el) {
        el.textContent = "—";
      });
    }

    $all("[data-needs-100]").forEach(function (el) {
      el.hidden = ok;
    });
    $all("[data-when-ready]").forEach(function (el) {
      el.hidden = !ok;
    });
    $all("button[data-copy]").forEach(function (btn) {
      btn.disabled = !ok && btn.getAttribute("data-copy") === "reference";
    });

    saveDraft();
  }

  function setAlloc(next, presetId) {
    state.growth = next.growth;
    state.balanced = next.balanced;
    state.steady = next.steady;
    state.parents = next.parents;
    state.preset = presetId || matchPreset(state) || "custom";
    render();
  }

  function bindSleeves() {
    $all("[data-sleeve]").forEach(function (input) {
      var key = input.getAttribute("data-sleeve");
      input.addEventListener("input", function () {
        var n = Math.round(Number(input.value));
        if (Number.isNaN(n)) n = 0;
        n = Math.max(0, Math.min(100, n));
        state[key] = n;
        state.preset = matchPreset(state) || "custom";
        render();
      });
    });
  }

  function bindPresets() {
    $all(".chip[data-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-preset");
        var preset = PRESETS.filter(function (p) {
          return p.id === id;
        })[0];
        if (!preset || preset.custom) {
          state.preset = "custom";
          render();
          return;
        }
        setAlloc(preset, preset.id);
      });
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    } finally {
      document.body.removeChild(area);
    }
  }

  function bindCopy() {
    $all("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-copy");
        var result = encoded();
        var live = accountIsLive();
        var map = {
          iban: live ? cfg.ibanCompact : "",
          bic: live ? cfg.bic : "",
          holder: live ? cfg.accountHolder : "",
          reference: result.ok ? result.code : "",
          slip: result.ok
            ? live
              ? [
                  "Gift capital — SEPA transfer note",
                  "",
                  "Recipient: " + cfg.accountHolder,
                  "IBAN: " + cfg.ibanDisplay,
                  "BIC: " + cfg.bic,
                  "Bank: " + cfg.bankName,
                  "Reference / Verwendungszweck: " + result.code,
                  "Wish: " + Ref.summarize(result.alloc),
                  "",
                  "These are wishes parents may follow — not a trade order, and not investment advice.",
                ].join("\n")
              : [
                  "Gift capital — preference note",
                  cfg.waitNotice || "Do not transfer yet. Konto folgt.",
                  "",
                  "Preference code (for later Verwendungszweck): " + result.code,
                  "Wish: " + Ref.summarize(result.alloc),
                  "",
                  "These are wishes parents may follow — not a trade order, and not investment advice.",
                  "Do not transfer yet. Konto folgt.",
                ].join("\n")
            : "",
        };
        var value = map[kind] || "";
        if (!value) return;
        copyText(value).then(
          function () {
            var prev = btn.textContent;
            btn.textContent = "Copied";
            setTimeout(function () {
              btn.textContent = prev;
            }, 1400);
          },
          function () {
            btn.textContent = "Copy failed";
          }
        );
      });
    });
  }

  function bindHorizon() {
    $all("[data-horizon]").forEach(function (input) {
      var key = input.getAttribute("data-horizon");
      input.addEventListener("input", function () {
        var n = Number(input.value);
        if (key === "age") n = Math.round(n);
        if (key === "age") state.age = Proj.clamp(n, 0, 18);
        else if (key === "lump") state.lump = Proj.clamp(n, 0, 1000000);
        else if (key === "monthly") state.monthly = Proj.clamp(n, 0, 20000);
        renderHorizon();
      });
    });
  }

  function bindNewDraft() {
    var btn = $("[data-new-draft]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      state.tokenStem = "";
      render();
    });
  }

  loadDraft();
  loadHorizon();
  applyHash();
  if (!state.tokenStem) {
    var first = Ref.encode(currentAlloc());
    if (first.ok) state.tokenStem = first.token.slice(0, 3);
  }
  fillAccountFields();
  bindSleeves();
  bindPresets();
  bindCopy();
  bindNewDraft();
  bindHorizon();
  render();
})();
