/**
 * Checks for the illustrative growth-to-18 picture (no browser required).
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { strict as assert } from "node:assert";

const require = createRequire(import.meta.url);
const P = require("../js/projection.js");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function approx(name, actual, expected, eps) {
  const delta = Math.abs(actual - expected);
  if (delta > (eps == null ? 0.02 : eps)) {
    throw new Error(name + ": expected ~" + expected + " got " + actual);
  }
}

assert.equal(P.EXAMPLE_RATES.growth, 0.06);
assert.equal(P.EXAMPLE_RATES.balanced, 0.04);
assert.equal(P.EXAMPLE_RATES.steady, 0.02);
assert.equal(P.EXAMPLE_RATES.parents, undefined);
assert.equal(P.SERIES.length, 3);
assert.ok(
  P.SERIES.every(function (s) {
    return s.key !== "parents";
  }),
  "chart series must omit Parents decide"
);

const g = P.project({ age: 0, lump: 500, monthly: 0 });
assert.equal(g.points, undefined);
assert.equal(g.series.growth.length, 19);
assert.equal(g.years, 18);
approx("€500 growth 18y", g.series.growth[18], 500 * Math.pow(1.06, 18));
approx("€500 balanced 18y", g.series.balanced[18], 500 * Math.pow(1.04, 18));
approx("€500 steady 18y", g.series.steady[18], 500 * Math.pow(1.02, 18));
approx("t0 is principal", g.series.growth[0], 500);
approx("FV helper matches path", P.futureValue(500, 0.06, 18), g.series.growth[18]);

assert.ok(g.series.growth[18] > g.series.balanced[18], "growth should outrun balanced");
assert.ok(g.series.balanced[18] > g.series.steady[18], "balanced should outrun steady");

const withMonthly = P.project({ age: 0, lump: 500, monthly: 50 });
assert.ok(withMonthly.series.growth[18] > g.series.growth[18], "monthly gifts should raise the illustration");
approx("first birthday with monthly at 6%", withMonthly.series.growth[1], 500 * 1.06 + 50 * 12);

const fromAge3 = P.project({ age: 3, lump: 500, monthly: 0 });
assert.equal(fromAge3.years, 15);
approx("age-now shortens horizon", fromAge3.series.growth[15], 500 * Math.pow(1.06, 15));

const at18 = P.project({ age: 18, lump: 800, monthly: 40 });
assert.equal(at18.years, 0);
approx("no remaining years", at18.series.growth[0], 800);

const svg = P.renderChart(g);
assert.ok(svg.indexOf("<svg") !== -1, "chart contains svg");
assert.ok(svg.indexOf("series-line") !== -1, "three series lines present");
assert.ok(svg.indexOf("years until she turns 18") !== -1, "x-axis title");
assert.ok(svg.indexOf("illustrative euro value") !== -1, "y-axis title");
assert.ok(svg.indexOf("sleeve-area") === -1, "mix stacked areas must not be drawn");
assert.ok(!/\bseries-line p\b/.test(svg) && svg.indexOf("series-area p") === -1, "parents series must not be drawn");
assert.ok(svg.indexOf(">18<") !== -1, "labels year 18 on a 0–18 horizon");

assert.equal(P.formatEur(1427.2), "€1,427");
assert.equal(P.formatEur(0), "€0");

const home = readFileSync(join(root, "index.html"), "utf8");
assert.ok(/If a gift could grow until her 18th birthday/.test(home), "Product title");
assert.ok(/A gentle illustration — not a promise, forecast, or advice/.test(home), "Product subtitle");
assert.ok(
  /Simple constant rates for illustration — markets go up and down; this is not a promise, forecast, or advice/.test(
    home
  ),
  "under-chart caption"
);
assert.ok(/Growth 6%/.test(home) && /Balanced 4%/.test(home) && /Steady 2%/.test(home), "locked rates in copy");
assert.ok(!/7%/.test(home) && !/4\.5%/.test(home), "old 7% / 4.5% rates must be gone");
assert.ok(/Parents decide — not plotted/.test(home), "parents decide greyed, not a series");
assert.ok(!/drawn at the Balanced/.test(home), "must not plot parents at Balanced");
assert.ok(/Konto folgt/.test(home), "Konto folgt wait state");
assert.ok(!/\bDE\d{2}/.test(home), "no invented DE IBAN");
assert.ok(/while she learns/.test(home), "she/her tone");

const config = readFileSync(join(root, "js/config.js"), "utf8");
assert.ok(/accountReady:\s*false/.test(config), "account still waiting");
assert.ok(/ibanDisplay:\s*""/.test(config) && /bic:\s*""/.test(config), "IBAN/BIC still empty");

const js = readFileSync(join(root, "js/projection.js"), "utf8");
assert.ok(!/parents:\s*0\.0/.test(js), "no parents example rate");
assert.ok(!/0\.07/.test(js) && !/0\.045/.test(js), "old decimal rates must be gone");

console.log("projection checks passed");
console.log(
  "  €500 at 18y",
  P.formatEur(g.series.growth[18]),
  P.formatEur(g.series.balanced[18]),
  P.formatEur(g.series.steady[18])
);
