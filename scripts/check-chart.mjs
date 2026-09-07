/**
 * Constant-return illustration math (no browser required).
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const Chart = require("../js/chart.js");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function ok(name, cond, detail) {
  if (!cond) {
    throw new Error(name + (detail ? ": " + detail : ""));
  }
}

function almost(a, b, eps) {
  return Math.abs(a - b) < (eps || 0.02);
}

ok("default amount", Chart.DEFAULT_AMOUNT === 500);
ok("horizon", Chart.HORIZON === 18);
ok("three series", Chart.SERIES.length === 3);
ok(
  "no parents path",
  Chart.SERIES.every(function (s) {
    return s.key !== "parents";
  })
);

ok("t0 is principal", Chart.futureValue(500, 0.06, 0) === 500);
ok("growth 18", almost(Chart.futureValue(500, 0.06, 18), 500 * Math.pow(1.06, 18)));
ok("balanced 18", almost(Chart.futureValue(500, 0.04, 18), 500 * Math.pow(1.04, 18)));
ok("steady 18", almost(Chart.futureValue(500, 0.02, 18), 500 * Math.pow(1.02, 18)));

const points = Chart.seriesPoints(500, 0.06, 18);
ok("19 points", points.length === 19);
ok("last t", points[18].t === 18);

ok("clamp default-ish", Chart.clampAmount("500") === 500);
ok("clamp low", Chart.clampAmount(0) === Chart.MIN_AMOUNT);
ok("clamp high", Chart.clampAmount(99999) === Chart.MAX_AMOUNT);
ok("format", Chart.formatEuro(1427) === "€1,427");

const rates = Chart.SERIES.map(function (s) {
  return s.key + ":" + s.rate;
}).join(",");
ok("published rates", rates === "growth:0.06,balanced:0.04,steady:0.02");

const config = readFileSync(join(root, "js/config.js"), "utf8");
ok("account still waiting", /accountReady:\s*false/.test(config));
ok("iban still empty", /ibanDisplay:\s*""/.test(config) && /bic:\s*""/.test(config));

const home = readFileSync(join(root, "index.html"), "utf8");
ok("konto folgt", /Konto folgt/.test(home));
ok("no invented IBAN", !/\bDE\d{2}/.test(home));
ok("she/her story", /while she\s+learns to walk/.test(home));
ok("chart section", /id="growth"/.test(home) && /not a promise, forecast, or advice/.test(home));
ok("parents decide not a series in copy", /Parents decide is not plotted/.test(home));

console.log("chart checks passed");
console.log(
  "  €500 at 18y",
  Chart.formatEuro(Chart.futureValue(500, 0.06, 18)),
  Chart.formatEuro(Chart.futureValue(500, 0.04, 18)),
  Chart.formatEuro(Chart.futureValue(500, 0.02, 18))
);
