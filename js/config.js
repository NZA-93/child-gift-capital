/**
 * Transfer details — swap these when the dedicated child IBAN is ready.
 *
 * All values below are PLACEHOLDERS. They are not a real account.
 * See README.md → “How to swap the real IBAN later”.
 */
window.GIFT_CAPITAL = Object.freeze({
  version: "GC1",
  siteName: "Gift capital",
  /** Display IBAN (grouped). Fake DE format. Check digits 00 — not a live account. */
  ibanDisplay: "DE00 0000 0000 0000 0000 00",
  ibanCompact: "DE00000000000000000000",
  /** 11-character BIC placeholder */
  bic: "XXXXXXXXXXX",
  accountHolder: "TO BE REPLACED — account holder",
  bankName: "TO BE REPLACED — bank name",
  currency: "EUR",
  placeholder: true,
  placeholderNotice:
    "PLACEHOLDER — TO BE REPLACED. This is not a real account. Do not send money until the family shares a live IBAN.",
});
