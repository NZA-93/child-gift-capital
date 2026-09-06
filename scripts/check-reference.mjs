/**
 * Encode/decode checks for GC1 preference codes (no browser required).
 */
import { createRequire } from "node:module";
import { strict as assert } from "node:assert";

const require = createRequire(import.meta.url);
const Ref = require("../js/reference.js");

function ok(name, cond, detail) {
  if (!cond) {
    throw new Error(name + (detail ? ": " + detail : ""));
  }
}

const encoded = Ref.encode({ growth: 70, balanced: 20, steady: 10, parents: 0 }, "K7M");
ok("encode", encoded.ok, encoded.error);
ok("shape", /^GC1-070-020-010-000-[0-9A-HJ-NP-TV-Z]{4}$/.test(encoded.code), encoded.code);

const decoded = Ref.decode(encoded.code);
ok("decode", decoded.ok, decoded.error);
ok("checksum", decoded.checksumOk);
assert.deepEqual(decoded.alloc, { growth: 70, balanced: 20, steady: 10, parents: 0 });

const parents = Ref.encode({ growth: 0, balanced: 0, steady: 0, parents: 100 });
ok("parents 100", parents.ok && parents.code.startsWith("GC1-000-000-000-100-"));

const badSum = Ref.encode({ growth: 40, balanced: 40, steady: 40, parents: 0 });
ok("reject sum", !badSum.ok);

const wrapped = Ref.decode("gift for baby  " + encoded.code + " thanks");
ok("extract from prose", wrapped.ok && wrapped.code === encoded.code);

const tampered = Ref.decode("GC1-070-020-010-000-K7M0");
ok("flag bad checksum or reject alphabet", !tampered.ok || tampered.checksumOk === false);

console.log("reference checks passed");
console.log("  sample", encoded.code);
console.log("  parents", parents.code);
