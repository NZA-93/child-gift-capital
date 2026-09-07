/**
 * Illustrative capital projection to an 18th birthday.
 *
 * These yearly rates are examples for a picture on the page — not forecasts,
 * not advice, and not a promise. See README.md → “Illustrative projection”.
 */
(function (root) {
  var HORIZON_AGE = 18;

  /** Example annual returns used only for the illustration. */
  var EXAMPLE_RATES = {
    growth: 0.07,
    balanced: 0.045,
    steady: 0.02,
    /** Parents-decide is drawn at the Balanced example rate. */
    parents: 0.045,
  };

  var EXAMPLE_RATE_LABELS = {
    growth: "7%",
    balanced: "4.5%",
    steady: "2%",
    parents: "4.5%",
  };

  var SLEEVES = [
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

  function sleeveRate(key) {
    return EXAMPLE_RATES[key] || 0;
  }

  /**
   * Compound once a year:
   *   now (current age) = starting gift, split by the mix
   *   each later birthday = previous × (1 + sleeve rate) + 12 × monthly × sleeve share
   *
   * Recurring gifts are treated as a year of monthly gifts, credited on the birthday.
   */
  function project(input) {
    var alloc = input.alloc || {};
    var age = clamp(Math.round(Number(input.age)), 0, HORIZON_AGE);
    var lump = clamp(Number(input.lump), 0, 1000000);
    var monthly = clamp(Number(input.monthly), 0, 20000);
    var years = HORIZON_AGE - age;
    var annualGift = monthly * 12;

    function seed() {
      var out = { age: age, total: 0 };
      SLEEVES.forEach(function (s) {
        var share = (Number(alloc[s.key]) || 0) / 100;
        out[s.key] = lump * share;
        out.total += out[s.key];
      });
      return out;
    }

    function step(prev) {
      var next = { age: prev.age + 1, total: 0 };
      SLEEVES.forEach(function (s) {
        var share = (Number(alloc[s.key]) || 0) / 100;
        var grown = prev[s.key] * (1 + sleeveRate(s.key)) + annualGift * share;
        next[s.key] = grown;
        next.total += grown;
      });
      return next;
    }

    var points = [seed()];
    for (var i = 0; i < years; i++) {
      points.push(step(points[points.length - 1]));
    }

    function pathAll(rate) {
      var values = [lump];
      var v = lump;
      for (var y = 0; y < years; y++) {
        v = v * (1 + rate) + annualGift;
        values.push(v);
      }
      return values;
    }

    return {
      age: age,
      years: years,
      lump: lump,
      monthly: monthly,
      annualGift: annualGift,
      points: points,
      comparison: {
        growth: pathAll(EXAMPLE_RATES.growth),
        balanced: pathAll(EXAMPLE_RATES.balanced),
        steady: pathAll(EXAMPLE_RATES.steady),
      },
    };
  }

  function lastPoint(model) {
    return model.points[model.points.length - 1];
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

  function areaPath(xs, tops, bottoms) {
    var i;
    var d = "M" + xs[0].toFixed(1) + "," + tops[0].toFixed(1);
    for (i = 1; i < xs.length; i++) d += " L" + xs[i].toFixed(1) + "," + tops[i].toFixed(1);
    for (i = xs.length - 1; i >= 0; i--) d += " L" + xs[i].toFixed(1) + "," + bottoms[i].toFixed(1);
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
    var pts = model.points;
    var w = 480;
    var h = 240;
    var m = { top: 14, right: 12, bottom: 36, left: 44 };
    var innerW = w - m.left - m.right;
    var innerH = h - m.top - m.bottom;
    var maxRaw = 0;
    pts.forEach(function (p) {
      if (p.total > maxRaw) maxRaw = p.total;
    });
    var yMax = niceMax(maxRaw * 1.12);

    function xAt(i) {
      if (pts.length === 1) return m.left + innerW / 2;
      return m.left + (i * innerW) / (pts.length - 1);
    }
    function yAt(v) {
      return m.top + innerH - (v / yMax) * innerH;
    }

    var xs = pts.map(function (_, i) {
      return xAt(i);
    });

    var tickCount = 4;
    var grid = "";
    for (var t = 0; t <= tickCount; t++) {
      var val = (yMax * t) / tickCount;
      var y = yAt(val);
      grid += svgEl("line", {
        x1: m.left,
        x2: w - m.right,
        y1: y.toFixed(1),
        y2: y.toFixed(1),
        class: "grid",
      });
      grid += svgEl(
        "text",
        {
          x: (m.left - 8).toFixed(1),
          y: (y + 4).toFixed(1),
          class: "tick",
          "text-anchor": "end",
          "font-size": "11",
        },
        formatAxis(val)
      );
    }

    var stacked = "";
    var cumulative = pts.map(function () {
      return 0;
    });
    SLEEVES.forEach(function (s) {
      var bottoms = cumulative.slice();
      var tops = pts.map(function (p, i) {
        return bottoms[i] + p[s.key];
      });
      var hasWidth = tops.some(function (v, i) {
        return v - bottoms[i] > 0.5;
      });
      if (hasWidth) {
        stacked += svgEl("path", {
          class: "sleeve-area " + s.cls,
          d: areaPath(
            xs,
            tops.map(yAt),
            bottoms.map(yAt)
          ),
        });
      }
      cumulative = tops;
    });

    var totalLine = svgEl("path", {
      class: "total-line",
      d: linePath(
        xs,
        pts.map(function (p) {
          return yAt(p.total);
        })
      ),
      fill: "none",
    });

    var end = lastPoint(model);
    var endX = xs[xs.length - 1];
    var endY = yAt(end.total);
    var endDot = svgEl("circle", {
      class: "end-dot",
      cx: endX.toFixed(1),
      cy: endY.toFixed(1),
      r: 5,
    });

    var xLabels = "";
    var labelIdx = [0];
    if (pts.length > 2) labelIdx.push(Math.round((pts.length - 1) / 2));
    if (pts.length > 1) labelIdx.push(pts.length - 1);
    var seen = {};
    labelIdx.forEach(function (i) {
      if (seen[i]) return;
      seen[i] = true;
      xLabels += svgEl(
        "text",
        {
          x: xs[i].toFixed(1),
          y: h - 14,
          class: "tick x-tick",
          "text-anchor": i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle",
          "font-size": "11",
        },
        "Age " + pts[i].age
      );
    });

    var baseline = svgEl("line", {
      x1: m.left,
      x2: w - m.right,
      y1: m.top + innerH,
      y2: m.top + innerH,
      class: "axis",
    });

    return (
      '<svg class="horizon-svg" viewBox="0 0 ' +
      w +
      " " +
      h +
      '" role="img" aria-hidden="true" focusable="false">' +
      grid +
      baseline +
      stacked +
      totalLine +
      endDot +
      xLabels +
      "</svg>"
    );
  }

  function renderMix(barEl, legendEl, alloc) {
    var html = SLEEVES.map(function (s) {
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
    var total = SLEEVES.reduce(function (sum, s) {
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
      legendEl.innerHTML = SLEEVES.map(function (s) {
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
    SLEEVES: SLEEVES,
    project: project,
    lastPoint: lastPoint,
    renderChart: renderChart,
    renderMix: renderMix,
    formatEur: formatEur,
    clamp: clamp,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.GiftProjection;
  }
})(typeof window !== "undefined" ? window : globalThis);
