/**
 * Illustrative growth chart — constant annual returns, not a forecast.
 *
 * FV = amount * (1 + r)^t for t = 0..18
 * Growth 6% · Balanced 4% · Steady 2%
 * Parents decide is not plotted (no invented path).
 */
(function (root) {
  var HORIZON = 18;
  var DEFAULT_AMOUNT = 500;
  var MIN_AMOUNT = 50;
  var MAX_AMOUNT = 5000;
  var STEP_AMOUNT = 50;

  var SERIES = [
    { key: "growth", label: "Growth", rate: 0.06, color: "#3d5c45" },
    { key: "balanced", label: "Balanced", rate: 0.04, color: "#7d9a78" },
    { key: "steady", label: "Steady", rate: 0.02, color: "#c4b189" },
  ];

  function clampAmount(n) {
    var v = Math.round(Number(n));
    if (!Number.isFinite(v)) v = DEFAULT_AMOUNT;
    v = Math.round(v / STEP_AMOUNT) * STEP_AMOUNT;
    return Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, v));
  }

  function futureValue(principal, rate, years) {
    return principal * Math.pow(1 + rate, years);
  }

  function seriesPoints(principal, rate, years) {
    var pts = [];
    for (var t = 0; t <= years; t++) {
      pts.push({ t: t, v: futureValue(principal, rate, t) });
    }
    return pts;
  }

  function formatEuro(n) {
    var rounded = Math.round(n);
    var abs = Math.abs(rounded);
    var withCommas = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (rounded < 0 ? "−" : "") + "€" + withCommas;
  }

  function niceCeiling(value) {
    if (value <= 0) return 100;
    var exp = Math.pow(10, Math.floor(Math.log(value) / Math.LN10));
    var n = value / exp;
    var nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return nice * exp;
  }

  function yTicks(maxValue) {
    var top = niceCeiling(maxValue);
    var steps = 4;
    var ticks = [];
    for (var i = 0; i <= steps; i++) {
      ticks.push((top * i) / steps);
    }
    return { top: top, ticks: ticks };
  }

  function attr(el, name, value) {
    el.setAttribute(name, value);
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", name);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        attr(el, key, attrs[key]);
      });
    }
    return el;
  }

  function plotPath(points, xOf, yOf) {
    return points
      .map(function (p, i) {
        return (i === 0 ? "M" : "L") + xOf(p.t).toFixed(2) + " " + yOf(p.v).toFixed(2);
      })
      .join(" ");
  }

  function areaPath(points, xOf, yOf, yBase) {
    var line = plotPath(points, xOf, yOf);
    var last = points[points.length - 1];
    var first = points[0];
    return (
      line +
      " L" +
      xOf(last.t).toFixed(2) +
      " " +
      yBase.toFixed(2) +
      " L" +
      xOf(first.t).toFixed(2) +
      " " +
      yBase.toFixed(2) +
      " Z"
    );
  }

  function renderChart(svg, amount) {
    var width = 520;
    var height = 340;
    var pad = { top: 30, right: 18, bottom: 52, left: 72 };
    var innerW = width - pad.left - pad.right;
    var innerH = height - pad.top - pad.bottom;
    var yBase = pad.top + innerH;

    var computed = SERIES.map(function (s) {
      var points = seriesPoints(amount, s.rate, HORIZON);
      return {
        key: s.key,
        label: s.label,
        color: s.color,
        rate: s.rate,
        points: points,
        end: points[points.length - 1].v,
      };
    });

    var maxV = computed.reduce(function (m, s) {
      return Math.max(m, s.end);
    }, amount);
    var scale = yTicks(maxV * 1.08);
    var xOf = function (t) {
      return pad.left + (t / HORIZON) * innerW;
    };
    var yOf = function (v) {
      return pad.top + innerH - (v / scale.top) * innerH;
    };

    while (svg.firstChild) svg.removeChild(svg.firstChild);
    attr(svg, "viewBox", "0 0 " + width + " " + height);
    attr(svg, "role", "img");
    attr(
      svg,
      "aria-label",
      "Illustration of an example " +
        formatEuro(amount) +
        " gift until she turns 18, using constant Growth, Balanced, and Steady rates. Not a promise, forecast, or advice."
    );

    var title = svgEl("title");
    title.textContent = "If a gift could grow until her 18th birthday";
    svg.appendChild(title);

    var desc = svgEl("desc");
    desc.textContent =
      "Nominal euro illustration of a one-off gift of " +
      formatEuro(amount) +
      " over " +
      HORIZON +
      " years. Growth 6%, Balanced 4%, Steady 2%. Parents decide is not plotted. Markets go up and down; this is not a promise, forecast, or advice, and not her real account.";
    svg.appendChild(desc);

    var yTitle = svgEl("text", {
      x: String(pad.left),
      y: "18",
      fill: "#6d6558",
      "font-size": "13",
      "font-family": "Avenir Next, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif",
    });
    yTitle.textContent = "illustrative euro value";
    svg.appendChild(yTitle);

    scale.ticks.forEach(function (tick) {
      var y = yOf(tick);
      svg.appendChild(
        svgEl("line", {
          x1: String(pad.left),
          x2: String(pad.left + innerW),
          y1: String(y),
          y2: String(y),
          stroke: tick === 0 ? "#d8cebb" : "#ece4d4",
          "stroke-width": tick === 0 ? "1.4" : "1",
        })
      );
      var label = svgEl("text", {
        x: String(pad.left - 8),
        y: String(y + 4),
        fill: "#6d6558",
        "font-size": "13",
        "text-anchor": "end",
        "font-family": "Avenir Next, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif",
      });
      label.textContent = formatEuro(tick);
      svg.appendChild(label);
    });

    [0, 6, 12, 18].forEach(function (t) {
      var x = xOf(t);
      svg.appendChild(
        svgEl("line", {
          x1: String(x),
          x2: String(x),
          y1: String(pad.top),
          y2: String(yBase),
          stroke: t === 0 ? "none" : "#ece4d4",
          "stroke-width": "1",
          "stroke-dasharray": "3 4",
        })
      );
      var label = svgEl("text", {
        x: String(x),
        y: String(yBase + 20),
        fill: "#6d6558",
        "font-size": "13",
        "text-anchor": "middle",
        "font-family": "Avenir Next, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif",
      });
      label.textContent = String(t);
      svg.appendChild(label);
    });

    var xTitle = svgEl("text", {
      x: String(pad.left + innerW / 2),
      y: String(height - 8),
      fill: "#4a4338",
      "font-size": "14",
      "text-anchor": "middle",
      "font-family": "Avenir Next, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif",
    });
    xTitle.textContent = "years until she turns 18";
    svg.appendChild(xTitle);

    computed
      .slice()
      .reverse()
      .forEach(function (s) {
        svg.appendChild(
          svgEl("path", {
            d: areaPath(s.points, xOf, yOf, yBase),
            fill: s.color,
            "fill-opacity": "0.2",
            stroke: "none",
          })
        );
      });

    computed.forEach(function (s) {
      svg.appendChild(
        svgEl("path", {
          d: plotPath(s.points, xOf, yOf),
          fill: "none",
          stroke: s.color,
          "stroke-width": "2.6",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        })
      );
      var endX = xOf(HORIZON);
      var endY = yOf(s.end);
      svg.appendChild(
        svgEl("circle", {
          cx: String(endX),
          cy: String(endY),
          r: "4.2",
          fill: s.color,
        })
      );
    });

    return computed;
  }

  function fillReadout(rootEl, computed, amount) {
    if (!rootEl) return;
    rootEl.innerHTML = computed
      .map(function (s) {
        return (
          '<li><span class="swatch" style="background:' +
          s.color +
          '"></span><strong>' +
          s.label +
          "</strong> " +
          formatEuro(s.end) +
          " at year " +
          HORIZON +
          "</li>"
        );
      })
      .join("") +
      '<li class="is-muted"><span class="swatch is-muted"></span><strong>Parents decide</strong> not plotted — they choose later, so there is no fake path</li>';
    rootEl.setAttribute(
      "aria-label",
      "Illustrated year-" +
        HORIZON +
        " values for an example " +
        formatEuro(amount) +
        " gift. Parents decide is not plotted."
    );
  }

  function bindAmount(form, onChange) {
    var number = form.querySelector("[data-gift-amount]");
    var range = form.querySelector("[data-gift-range]");
    if (!number || !range) return;

    function sync(from) {
      var next = clampAmount(from.value);
      number.value = String(next);
      range.value = String(next);
      onChange(next);
    }

    number.addEventListener("input", function () {
      var raw = Number(number.value);
      if (!Number.isFinite(raw)) return;
      range.value = String(clampAmount(raw));
      onChange(clampAmount(raw));
    });
    number.addEventListener("change", function () {
      sync(number);
    });
    range.addEventListener("input", function () {
      sync(range);
    });
  }

  function init() {
    var svg = document.getElementById("growth-chart");
    var readout = document.querySelector("[data-growth-legend]");
    var form = document.querySelector("[data-growth-amount]");
    if (!svg) return;

    var amount = DEFAULT_AMOUNT;
    if (form) {
      var number = form.querySelector("[data-gift-amount]");
      if (number) amount = clampAmount(number.value);
    }

    function draw(next) {
      var computed = renderChart(svg, next);
      fillReadout(readout, computed, next);
    }

    draw(amount);
    if (form) bindAmount(form, draw);
  }

  var api = {
    HORIZON: HORIZON,
    DEFAULT_AMOUNT: DEFAULT_AMOUNT,
    MIN_AMOUNT: MIN_AMOUNT,
    MAX_AMOUNT: MAX_AMOUNT,
    STEP_AMOUNT: STEP_AMOUNT,
    SERIES: SERIES,
    clampAmount: clampAmount,
    futureValue: futureValue,
    seriesPoints: seriesPoints,
    formatEuro: formatEuro,
    init: init,
  };

  root.GiftGrowthChart = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
