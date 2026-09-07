/**
 * Checks for the illustrative growth-to-18 projection (no browser required).
 */
import { createRequire } from "node:module";
import { strict as assert } from "node:assert";

const require = createRequire(import.meta.url);
const P = require("../js/projection.js");

function approx(name, actual, expected, eps) {
  const delta = Math.abs(actual - expected);
  if (delta > (eps == null ? 0.02 : eps)) {
    throw new Error(name + ": expected ~" + expected + " got " + actual);
  }
}

assert.equal(P.EXAMPLE_RATES.growth, 0.07);
assert.equal(P.EXAMPLE_RATES.balanced, 0.045);
assert.equal(P.EXAMPLE_RATES.steady, 0.02);
assert.equal(P.EXAMPLE_RATES.parents, P.EXAMPLE_RATES.balanced);

const growthAlloc = { growth: 100, balanced: 0, steady: 0, parents: 0 };
const g = P.project({ age: 0, lump: 1000, monthly: 0, alloc: growthAlloc });
assert.equal(g.points.length, 19);
assert.equal(g.points[0].age, 0);
assert.equal(g.points[18].age, 18);
approx("100% growth 18y lump", g.points[18].total, 1000 * Math.pow(1.07, 18));
approx("growth sleeve holds the pot", g.points[18].growth, g.points[18].total);

const steady = P.project({
  age: 0,
  lump: 1000,
  monthly: 0,
  alloc: { growth: 0, balanced: 0, steady: 100, parents: 0 },
});
assert.ok(g.points[18].total > steady.points[18].total, "growth should outrun steady in the example");
approx("100% steady 18y lump", steady.points[18].total, 1000 * Math.pow(1.02, 18));

const withMonthly = P.project({ age: 0, lump: 1000, monthly: 50, alloc: growthAlloc });
assert.ok(withMonthly.points[18].total > g.points[18].total, "monthly gifts should raise the illustration");
approx(
  "first birthday with monthly",
  withMonthly.points[1].total,
  1000 * 1.07 + 50 * 12
);

const mix = P.project({
  age: 0,
  lump: 1000,
  monthly: 0,
  alloc: { growth: 70, balanced: 20, steady: 10, parents: 0 },
});
approx("mix growth sleeve", mix.points[18].growth, 700 * Math.pow(1.07, 18));
approx("mix balanced sleeve", mix.points[18].balanced, 200 * Math.pow(1.045, 18));
approx("mix steady sleeve", mix.points[18].steady, 100 * Math.pow(1.02, 18));
approx(
  "mix total is sleeve sum",
  mix.points[18].total,
  mix.points[18].growth + mix.points[18].balanced + mix.points[18].steady
);

const parents = P.project({
  age: 3,
  lump: 500,
  monthly: 0,
  alloc: { growth: 0, balanced: 0, steady: 0, parents: 100 },
});
const balanced = P.project({
  age: 3,
  lump: 500,
  monthly: 0,
  alloc: { growth: 0, balanced: 100, steady: 0, parents: 0 },
});
assert.equal(parents.points.length, 16);
approx("parents-decide uses balanced example rate", parents.points[15].total, balanced.points[15].total);

const at18 = P.project({ age: 18, lump: 800, monthly: 40, alloc: growthAlloc });
assert.equal(at18.years, 0);
approx("no remaining years", at18.points[0].total, 800);

const svg = P.renderChart(mix);
assert.ok(svg.indexOf("<svg") !== -1, "chart contains svg");
assert.ok(svg.indexOf("sleeve-area") !== -1, "stacked sleeves present");
assert.ok(svg.indexOf("Age 18") !== -1, "labels the 18th birthday");

assert.equal(P.formatEur(3379.6), "€3,380");
assert.equal(P.formatEur(0), "€0");

console.log("projection checks passed");
console.log("  growth@18", P.formatEur(g.points[18].total));
console.log("  mix@18", P.formatEur(mix.points[18].total));
