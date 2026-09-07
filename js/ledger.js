(function () {
  var Ref = window.GiftReference;
  var form = document.getElementById("decode-form");
  var input = document.getElementById("reference-input");
  var out = document.getElementById("decode-out");

  function show(decoded, raw) {
    if (!decoded.ok) {
      out.innerHTML =
        '<div class="warn"><strong>Could not decode</strong>' +
        escapeHtml(decoded.error) +
        "</div>";
      return;
    }

    var a = decoded.alloc;
    var warn = decoded.checksumOk
      ? ""
      : '<p class="warn"><strong>Check the typing</strong>' +
        escapeHtml(decoded.warning) +
        "</p>";

    out.innerHTML =
      warn +
      '<div class="card" style="margin-top:0.8rem">' +
      "<p class=\"kicker\">Matched code</p>" +
      '<p class="code-block">' +
      escapeHtml(decoded.code) +
      "</p>" +
      '<div class="mix-visual"><div class="mix" id="decoded-mix" role="img" aria-label="Decoded mix"></div><ul class="mix-legend" id="decoded-mix-legend"></ul></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Sleeve</th><th>%</th></tr></thead><tbody>' +
      row("Growth", a.growth) +
      row("Balanced", a.balanced) +
      row("Steady", a.steady) +
      row("Parents decide", a.parents) +
      "</tbody></table></div>" +
      "<p class=\"note\">Token <code>" +
      escapeHtml(decoded.token) +
      "</code> — checksum " +
      (decoded.checksumOk ? "ok" : "mismatch") +
      ". Paste the same string into the ledger CSV/JSON <code>reference</code> column.</p>" +
      "</div>";

    var mix = document.getElementById("decoded-mix");
    var legend = document.getElementById("decoded-mix-legend");
    if (window.GiftProjection) {
      window.GiftProjection.renderMix(mix, legend, a);
    } else if (mix) {
      mix.innerHTML =
        '<span class="g" style="flex-grow:' +
        a.growth +
        ';flex-basis:0"></span><span class="b" style="flex-grow:' +
        a.balanced +
        ';flex-basis:0"></span><span class="s" style="flex-grow:' +
        a.steady +
        ';flex-basis:0"></span><span class="p" style="flex-grow:' +
        a.parents +
        ';flex-basis:0"></span>';
    }

    if (raw && decoded.code && history.replaceState) {
      history.replaceState(null, "", "#" + decoded.code);
    }
  }

  function row(label, n) {
    return "<tr><td>" + escapeHtml(label) + "</td><td>" + n + "</td></tr>";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      show(Ref.decode(input.value), true);
    });
  }

  var hash = (location.hash || "").replace(/^#/, "");
  if (hash && input) {
    input.value = hash;
    show(Ref.decode(hash), false);
  }
})();
