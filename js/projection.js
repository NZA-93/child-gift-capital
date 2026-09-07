/**
 * Illustrative capital picture to an 18th birthday.
 *
 * Constant annual returns for a picture on the page — not forecasts,
 * not advice, and not a promise. See README.md → “Illustrative projection”.
 *
 * Series plotted: Growth 6% · Balanced 4% · Steady 2%.
 * Parents decide is never plotted (no invented path).
 */
(function (root) {
  var HORIZON_AGE = 18;

  /** Example annual returns used only for the illustration. */
  var EXAMPLE_RATES = {
    growth: 0.06,
    balanced: 0.04,
    steady: 0.02,
  };

  var EXAMPLE_RATE_LABELS = {
    growth: "6%",
    balanced: "4%",
    steady: "2%",
  };

  /** Chart series only — Parents decide is omitted on purpose. */
  var SERIES = [
    { key: "growth", cls: "g", label: "Growth" },
    { key: "balanced", cls: "b", label: "Balanced" },
    { key: "steady", cls: "s", label: "Steady" },
  ];

  /** Allocation bar still lists all four wish sleeves. */
  var MIX_SLEEVES = [
    { key: "growth", cls: "g", label: "Growth" },
    { key: "balanced", cls: "b", label: "Balanced" },
    { key: "steady", cls: "s", label: "Steady" },
    { key: "parents", cls: "p", label: "Parents decide" },
  ];

  function clamp(n, min, max) {
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function roundEuro(n) {
    return Math.round(n);
  }

  function formatEur(n) {
    var v = roundEuro(n);
    var sign = v < 0 ? "−" : "";
    var abs = Math.abs(v).toString();
    var withCommas = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return sign + "€" + withCommas;
  }

  function formatAxis(n) {
    var v = Math.abs(n);
    if (v >= 1000000) {
      var m = n / 1000000;
      return "€" + (Math.abs(m) >= 10 ? Math.round(m) : m.toFixed(1)) + "m";
    }
    if (v >= 1000) {
      return "€" + Math.round(n / 1000) + "k";
    }
    return "€" + Math.round(n);
  }

  function futureValue(principal, rate, years) {
    return principal * Math.pow(1 + rate, years);
  }

  /**
   * Compound once a year:
   *   year 0 = starting gift
   *   each later year = previous × (1 + rate) + 12 × monthly
   *
   * Recurring gifts are treated as a year of monthly gifts, credited on the birthday.
   * When monthly is 0 this matches FV = amount × (1 + r)^t.
   */
  function pathAll(lump, monthly, rate, years) {
    var annualGift = monthly * 12;
    var values = [lump];
    var v = lump;
    var y;
    for (y = 0; y < years; y++) {
      v = v * (1 + rate) + annualGift;
      values.push(v);
    }
    return values;
  }

  function project(input) {
    var age = clamp(Math.round(Number(input.age)), 0, HORIZON_AGE);
    var lump = clamp(Number(input.lump), 0, 1000000);
    var monthly = clamp(Number(input.monthly), 0, 20000);
    var years = HORIZON_AGE - age;
    var series = {};
    SERIES.forEach(function (s) {
      series[s.key] = pathAll(lump, monthly, EXAMPLE_RATES[s.key], years);
    });
    return {
      age: age,
      years: years,
      lump: lump,
      monthly: monthly,
      annualGift: monthly * 12,
      series: series,
    };
  }

  function lastValues(model) {
    var i = model.years;
    return {
      years: i,
      growth: model.series.growth[i],
      balanced: model.series.balanced[i],
      steady: model.series.steady[i],
    };
  }

  function svgEl(name, attrs, children) {
    var parts = [];
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] == null || attrs[k] === false) return;
      parts.push(k + '="' + String(attrs[k]).replace(/"/g, "&quot;") + '"');
    });
    var open = "<" + name + (parts.length ? " " + parts.join(" ") : "") + ">";
    if (children == null) return "<" + name + (parts.length ? " " + parts.join(" ") : "") + " />";
    return open + children + "</" + name + ">";
  }

  function areaPath(xs, ys, yBase) {
    var d = "M" + xs[0].toFixed(1) + "," + ys[0].toFixed(1);
    var i;
    for (i = 1; i < xs.length; i++) d += " L" + xs[i].toFixed(1) + "," + ys[i].toFixed(1);
    d += " L" + xs[xs.length - 1].toFixed(1) + "," + yBase.toFixed(1);
    d += " L" + xs[0].toFixed(1) + "," + yBase.toFixed(1);
    return d + " Z";
  }

  function linePath(xs, ys) {
    var d = "M" + xs[0].toFixed(1) + "," + ys[0].toFixed(1);
    for (var i = 1; i < xs.length; i++) d += " L" + xs[i].toFixed(1) + "," + ys[i].toFixed(1);
    return d;
  }

  function niceMax(n) {
    if (n <= 0) return 100;
    var exp = Math.pow(10, Math.floor(Math.log(n) / Math.log(10)));
    var f = n / exp;
    var nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nice * exp;
  }

  function renderChart(model) {
    var years = model.years;
    var count = years + 1;
    var w = 320;
    var h = 180;
    var yBase = h - 4;
    var maxRaw = 0;
    SERIES.forEach(function (s) {
      var last = model.series[s.key][years];
      if (last > maxRaw) maxRaw = last;
    });
    var yMax = niceMax(maxRaw * 1.12);

    function xAt(i) {
      var pad = 4;
      if (count === 1) return w / 2;
      return pad + (i * (w - pad * 2)) / (count - 1);
    }
    function yAt(v) {
      var pad = 4;
      return pad + (h - pad * 2) * (1 - v / yMax);
    }

    var xs = [];
    var i;
    for (i = 0; i < count; i++) xs.push(xAt(i));

    var tickCount = 2;
    var yTicks = [];
    var grid = "";
    for (var t = 0; t <= tickCount; t++) {
      var val = (yMax * t) / tickCount;
      yTicks.unshift(val);
      var y = yAt(val);
      grid += svgEl("line", {
        x1: 0,
        x2: w,
        y1: y.toFixed(1),
        y2: y.toFixed(1),
        class: t === 0 ? "axis" : "grid",
      });
    }

    var areas = "";
    var lines = "";
    var dots = "";
    SERIES.slice()
      .reverse()
      .forEach(function (s) {
        var ys = model.series[s.key].map(yAt);
        areas += svgEl("path", {
          class: "series-area " + s.cls,
          d: areaPath(xs, ys, yBase),
        });
      });
    SERIES.forEach(function (s) {
      var ys = model.series[s.key].map(yAt);
      var end = model.series[s.key][years];
      lines += svgEl("path", {
        class: "series-line " + s.cls,
        d: linePath(xs, ys),
        fill: "none",
      });
      dots += svgEl("circle", {
        class: "end-dot " + s.cls,
        cx: xs[xs.length - 1].toFixed(1),
        cy: yAt(end).toFixed(1),
        r: 4.5,
      });
    });

    var xIdx = [0];
    if (count > 2) xIdx.push(Math.round((count - 1) / 2));
    if (count > 1) xIdx.push(count - 1);
    var seen = {};
    var xLabels = [];
    xIdx.forEach(function (idx) {
      if (seen[idx]) return;
      seen[idx] = true;
      xLabels.push(String(idx));
    });

    var yHtml = yTicks
      .map(function (v) {
        return "<span>" + formatAxis(v) + "</span>";
      })
      .join("");
    var xHtml = xLabels
      .map(function (label) {
        return "<span>" + label + "</span>";
      })
      .join("");

    var svg =
      '<svg class="horizon-svg" viewBox="0 0 ' +
      w +
      " " +
      h +
      '" preserveAspectRatio="none" role="img" aria-hidden="true" focusable="false">' +
      grid +
      areas +
      lines +
      dots +
      "</svg>";

    return (
      '<div class="horizon-plot">' +
      '<p class="horizon-ytitle">illustrative euro value · nominal</p>' +
      '<div class="horizon-ylabels" aria-hidden="true">' +
      yHtml +
      "</div>" +
      '<div class="horizon-canvas">' +
      svg +
      "</div>" +
      '<div class="horizon-xlabels" aria-hidden="true">' +
      xHtml +
      "</div>" +
      '<p class="horizon-xtitle">years until she turns 18</p>' +
      "</div>"
    );
  }

  function renderMix(barEl, legendEl, alloc) {
    var html = MIX_SLEEVES.map(function (s) {
      var n = Number(alloc[s.key]) || 0;
      return (
        '<span class="' +
        s.cls +
        '" style="flex-grow:' +
        n +
        ";flex-shrink:0;flex-basis:0" +
        (n === 0 ? ";display:none" : "") +
        '" title="' +
        s.label +
        " " +
        n +
        '%"></span>'
      );
    }).join("");
    var total = MIX_SLEEVES.reduce(function (sum, s) {
      return sum + (Number(alloc[s.key]) || 0);
    }, 0);
    var rest = Math.max(0, 100 - total);
    if (rest > 0) {
      html +=
        '<span class="rest" style="flex-grow:' +
        rest +
        ';flex-shrink:0;flex-basis:0" title="Unallocated ' +
        rest +
        '%"></span>';
    }
    if (barEl) barEl.innerHTML = html;
    if (legendEl) {
      legendEl.innerHTML = MIX_SLEEVES.map(function (s) {
        var n = Number(alloc[s.key]) || 0;
        return (
          '<li class="' +
          (n === 0 ? "is-zero" : "") +
          '"><span class="swatch ' +
          s.cls +
          '" aria-hidden="true"></span><span class="mix-name">' +
          s.label +
          '</span><span class="mix-pct">' +
          n +
          "%</span></li>"
        );
      }).join("");
    }
  }

  root.GiftProjection = {
    HORIZON_AGE: HORIZON_AGE,
    EXAMPLE_RATES: EXAMPLE_RATES,
    EXAMPLE_RATE_LABELS: EXAMPLE_RATE_LABELS,
    SERIES: SERIES,
    MIX_SLEEVES: MIX_SLEEVES,
    project: project,
    lastValues: lastValues,
    lastPoint: lastValues,
    renderChart: renderChart,
    renderMix: renderMix,
    formatEur: formatEur,
    futureValue: futureValue,
    pathAll: pathAll,
    clamp: clamp,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.GiftProjection;
  }
})(typeof window !== "undefined" ? window : globalThis);
