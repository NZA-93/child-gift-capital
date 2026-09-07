# Gift capital

A **public preference desk** for friends and family who want to gift money toward her long-horizon capital.

This is **scenario A**: people will later (1) send a SEPA transfer to a dedicated Juniorkonto and (2) say how they would like that gift split across a few portfolio sleeves. Parents are the custodians and invest later. The site is a story plus an allocation helper — **not a brokerage and not a payment processor**.

**Do not transfer yet. Konto folgt.** Until a real Juniorkonto exists, this site does **not** publish an IBAN or BIC — not even a fake DE-looking number, which someone could mistype as a live account.

There is no Stripe, PayPal, or card form. She is not named. Branding stays generic (“Gift capital”, “a little one’s capital”). Donors never buy a sleeve here.

**Live site (GitHub Pages):** <https://nza-93.github.io/child-gift-capital/>

## What donors do now

1. Open the site and choose an allocation (presets or custom percentages that sum to 100%).
2. Copy the preference code. Drafts stay in `localStorage` and the URL hash.
3. Wait. When the Juniorkonto is published on this page, transfer from your own bank and paste the code as the `Verwendungszweck`.

The allocation UI works **without a backend**.

## Illustration until 18

A `#growth` section sketches what an example one-off gift *could* look like at constant rates until she turns 18. It is **not** her real account path, **not** a promise, forecast, or advice, and **not** a Schenkung outcome.

| Assumption | Value |
| --- | --- |
| Units | Nominal euros (not inflation-adjusted) |
| Growth | 6% a year, constant |
| Balanced | 4% a year, constant |
| Steady | 2% a year, constant |
| Parents decide | Not plotted — no invented path |
| Example gift | €500 one-off (donors can nudge the amount) |
| Horizon | 18 years from today |
| Fees / tax | None in the picture |

Formula: `FV = amount × (1 + r)^t` for `t = 0…18`. Drawn with inline SVG in [`js/chart.js`](js/chart.js) — no chart library.

## Sleeves

| Sleeve | Intent |
| --- | --- |
| Growth | Mostly global equity ETFs. Higher ups and downs; built for decades. |
| Balanced | Stocks and bonds together. Medium swings; smoother than Growth. |
| Steady | Bonds / cash-like. Lower swing; slower growth. |
| Parents decide | Leave the mix to the parents. They’ll allocate as custodians. |

These are wishes parents may follow — not a trade order, and not investment advice.

## Preference code

```text
GC1-070-020-010-000-K7MM
```

means 70% growth, 20% balanced, 10% steady, 0% parents-decide, token `K7MM`.

Full matching notes: [`ledger/README.md`](ledger/README.md).  
In-browser decoder: [`ledger.html`](ledger.html).

## How to publish the real IBAN later

Edit [`js/config.js`](js/config.js) only, and only when the dedicated Juniorkonto is open:

1. Set `ibanDisplay` (grouped) and `ibanCompact` (no spaces) to the **real** IBAN.
2. Set `bic`, `accountHolder`, and `bankName` to the real values.
3. Set `accountReady` to `true`.
4. Commit to `main`. GitHub Pages will pick up the static files.

Until then, leave `accountReady` false and the account strings empty. Do **not** invent a placeholder IBAN.

## GitHub Pages

This is a **static site** at the repository root (no build step).

1. Repo **Settings → Pages**.
2. Source: **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`.
4. Wait a minute, then open <https://nza-93.github.io/child-gift-capital/>.

A `.nojekyll` file is included so GitHub does not run Jekyll on these files.

Local preview:

```bash
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

Checks (no browser):

```bash
node scripts/check-reference.mjs
node scripts/check-chart.mjs
```

## Repo map

| Path | Role |
| --- | --- |
| `index.html` | Landing, illustration until 18, allocation UI, how to give, FAQ |
| `privacy.html` | Privacy + “not advice / not a brokerage” |
| `ledger.html` | Decode a bank reference |
| `js/config.js` | Account gate (`accountReady`) — empty until the Juniorkonto exists |
| `js/chart.js` | Illustrative SVG growth paths (constant rates) |
| `js/reference.js` | Encode / decode `GC1` codes |
| `ledger/` | CSV + JSON templates and matching README |

## Legal tone (footer)

The site states, in English and German, that it is **not investment advice** and **does not buy or sell securities**. It does not process payments. Allocation codes are wishes for a parent ledger, not broker orders. Donors do not buy a sleeve on this page.
