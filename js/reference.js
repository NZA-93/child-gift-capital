/**
 * Gift-capital preference codes for SEPA transfer references (Verwendungszweck).
 *
 * Format (26 characters, Crockford-ish token):
 *   GC1-<GGG>-<BBB>-<SSS>-<PPP>-<TTTT>
 *
 *   GGG / BBB / SSS / PPP  = Global / Balanced / Steady / Parents % (000–100)
 *   TTTT                   = 3 random chars + 1 checksum char
 *
 * Alphabet: 0-9 A-Z without I L O U (easy to read on bank statements).
 * Sum of the four percentages must be 100.
 */
(function (root) {
  var ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  var PATTERN =
    /^GC1-(\d{3})-(\d{3})-(\d{3})-(\d{3})-([0-9A-HJ-NP-TV-Z]{4})$/;

  var SLEEVES = [
    { key: "growth", id: "g", short: "G", label: "Growth" },
    { key: "balanced", id: "b", short: "B", label: "Balanced" },
    { key: "steady", id: "s", short: "S", label: "Steady" },
    { key: "parents", id: "p", short: "P", label: "Parents decide" },
  ];

  function pad3(n) {
    return String(n).padStart(3, "0");
  }

  function alphabetIndex(ch) {
    return ALPHABET.indexOf(ch);
  }

  function checksum(alloc, stem) {
    var n = alloc.growth + alloc.balanced * 3 + alloc.steady * 7 + alloc.parents * 11;
    for (var i = 0; i < stem.length; i++) {
      var idx = alphabetIndex(stem.charAt(i));
      if (idx < 0) return -1;
      n = (n * 32 + idx) % 1024;
    }
    return n % 32;
  }

  function normalizeAlloc(input) {
    return {
      growth: Number(input.growth) || 0,
      balanced: Number(input.balanced) || 0,
      steady: Number(input.steady) || 0,
      parents: Number(input.parents) || 0,
    };
  }

  function totalOf(alloc) {
    return alloc.growth + alloc.balanced + alloc.steady + alloc.parents;
  }

  function validateAlloc(alloc) {
    var keys = ["growth", "balanced", "steady", "parents"];
    for (var i = 0; i < keys.length; i++) {
      var n = alloc[keys[i]];
      if (!Number.isInteger(n) || n < 0 || n > 100) {
        return "Each sleeve must be a whole number from 0 to 100.";
      }
    }
    if (totalOf(alloc) !== 100) {
      return "The four sleeves must add up to 100%.";
    }
    return "";
  }

  function randomStem() {
    var bytes = new Uint8Array(3);
    if (root.crypto && root.crypto.getRandomValues) {
      root.crypto.getRandomValues(bytes);
    } else {
      bytes[0] = Math.floor(Math.random() * 32);
      bytes[1] = Math.floor(Math.random() * 32);
      bytes[2] = Math.floor(Math.random() * 32);
    }
    return (
      ALPHABET.charAt(bytes[0] % 32) +
      ALPHABET.charAt(bytes[1] % 32) +
      ALPHABET.charAt(bytes[2] % 32)
    );
  }

  function makeToken(alloc, stem) {
    var s = stem || randomStem();
    return s + ALPHABET.charAt(checksum(alloc, s));
  }

  function encode(input, tokenOrStem) {
    var alloc = normalizeAlloc(input);
    var err = validateAlloc(alloc);
    if (err) return { ok: false, error: err };

    var token = tokenOrStem || "";
    if (token.length === 4 && PATTERN.test("GC1-000-000-000-100-" + token)) {
      var stem = token.slice(0, 3);
      var expected = makeToken(alloc, stem);
      if (token !== expected) {
        token = expected;
      }
    } else if (token.length === 3) {
      token = makeToken(alloc, token);
    } else {
      token = makeToken(alloc);
    }

    var code =
      "GC1-" +
      pad3(alloc.growth) +
      "-" +
      pad3(alloc.balanced) +
      "-" +
      pad3(alloc.steady) +
      "-" +
      pad3(alloc.parents) +
      "-" +
      token;

    return {
      ok: true,
      code: code,
      alloc: alloc,
      token: token,
    };
  }

  function decode(raw) {
    if (raw == null) {
      return { ok: false, error: "No reference provided." };
    }
    var text = String(raw)
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();

    var match = text.match(PATTERN);
    if (!match) {
      var loose = text.match(
        /GC1-\d{3}-\d{3}-\d{3}-\d{3}-[0-9A-Z]{4}/
      );
      if (loose) {
        match = loose[0].match(PATTERN);
      }
    }
    if (!match) {
      return {
        ok: false,
        error:
          "Unrecognized code. Expected GC1-GGG-BBB-SSS-PPP-TTTT (for example GC1-070-020-010-000-K7MM).",
      };
    }

    var alloc = {
      growth: Number(match[1]),
      balanced: Number(match[2]),
      steady: Number(match[3]),
      parents: Number(match[4]),
    };
    var token = match[5];
    var err = validateAlloc(alloc);
    if (err) return { ok: false, error: err, alloc: alloc, token: token };

    var expected = makeToken(alloc, token.slice(0, 3));
    var checkOk = token === expected;

    return {
      ok: true,
      code: match[0],
      alloc: alloc,
      token: token,
      checksumOk: checkOk,
      warning: checkOk
        ? ""
        : "Checksum does not match — the percentages or token may have been mistyped.",
    };
  }

  function summarize(alloc) {
    return SLEEVES.map(function (s) {
      return s.label + " " + alloc[s.key] + "%";
    }).join(" · ");
  }

  root.GiftReference = {
    ALPHABET: ALPHABET,
    SLEEVES: SLEEVES,
    encode: encode,
    decode: decode,
    makeToken: makeToken,
    validateAlloc: validateAlloc,
    normalizeAlloc: normalizeAlloc,
    totalOf: totalOf,
    summarize: summarize,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.GiftReference;
  }
})(typeof window !== "undefined" ? window : globalThis);
