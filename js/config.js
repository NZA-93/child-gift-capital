/**
 * Transfer details — leave accountReady false until a real Juniorkonto exists.
 *
 * Never publish a fake DE-looking IBAN or BIC. An invented number can be
 * mistyped as a live account. Until the dedicated account is open, the
 * how-to page stays on “Do not transfer yet / Konto folgt”.
 *
 * When the real account exists, fill the fields below and set accountReady
 * to true. See README.md → “How to publish the real IBAN later”.
 */
window.GIFT_CAPITAL = Object.freeze({
  version: "GC1",
  siteName: "Gift capital",
  /** Must stay false until ibanDisplay / bic are a real Juniorkonto. */
  accountReady: false,
  ibanDisplay: "",
  ibanCompact: "",
  bic: "",
  accountHolder: "",
  bankName: "",
  currency: "EUR",
  waitTitle: "Do not transfer yet",
  waitTitleDe: "Konto folgt",
  waitNotice:
    "The dedicated Juniorkonto is not open yet. No IBAN or BIC is published here. Please do not transfer money.",
});
