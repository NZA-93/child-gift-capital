# Parent ledger

This folder is a **paper trail for custodians**, not software that talks to a bank.

When the dedicated Juniorkonto exists, friends and family send a SEPA transfer and put a preference code in the transfer reference (`Verwendungszweck`). You match that incoming payment to a row here, then invest later in your own custody process.

Until that account is open: **do not transfer yet / Konto folgt.** The public site must not show a fake IBAN.

The public website never sees the money, never places a trade, and is not a brokerage.

## Preference code (`GC1`)

Example:

```text
GC1-070-020-010-000-K7MM
```

| Part | Meaning |
| --- | --- |
| `GC1` | Format version |
| `070` | Growth % |
| `020` | Balanced % |
| `010` | Steady % |
| `000` | Parents decide % |
| `K7MM` | 3 random characters + 1 checksum character |

Rules:

- The four percentages are whole numbers from `000` to `100`.
- They **must sum to 100**.
- The last character of the token is a checksum of the percentages plus the first three token characters.
- Alphabet: `0-9` and `A-Z` without `I`, `L`, `O`, `U` (easier to read on statements).

Decode in the browser: [ledger.html](../ledger.html)  
Or load `js/reference.js` and call `GiftReference.decode("GC1-070-020-010-000-K7MM")`.

## Matching a transfer

1. Export or copy the incoming SEPA credit (date, amount, counterparty, reference).
2. Paste the reference into [ledger.html](../ledger.html). Confirm the four sleeves and that the checksum is ok.
3. Add a row to your private copy of `gifts.template.csv` or `gifts.template.json`.
4. If the reference is missing or garbled, keep the bank fields and mark `status` as `unmatched`. You can still treat the gift as “parents decide”.
5. Do **not** commit real donor names, IBANs, or amounts to this public repository.

Suggested `status` values: `unmatched`, `matched`, `invested`, `thanked`.

## Templates

- [`gifts.template.csv`](gifts.template.csv) — spreadsheet-friendly
- [`gifts.template.json`](gifts.template.json) — same fields as structured data

Copy them out of git (for example `gifts.csv` on a private drive) before filling in live gifts. Sample rows use no account numbers.

## Publishing the live IBAN later

The site reads account fields from [`js/config.js`](../js/config.js). When the dedicated Juniorkonto exists:

1. Set the real `ibanDisplay`, `ibanCompact`, `bic`, `accountHolder`, and `bankName`.
2. Set `accountReady` to `true`.
3. Publish the change (push to `main` so GitHub Pages updates).

Until then, leave those strings empty. Do not invent a DE-looking placeholder.
