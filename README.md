# Gift capital

A **public preference desk** for friends and family who want to gift money toward a little one’s long-horizon capital.

This is **scenario A**: people (1) send a SEPA transfer to a dedicated child IBAN and (2) say how they would like that gift split across a few portfolio sleeves. Parents (German tax residents) are the custodians and invest later. The site is a story plus an allocation helper — **not a brokerage and not a payment processor**.

There is no Stripe, PayPal, or card form. The child is not named. Branding stays generic (“Gift capital”, “a little one’s capital”).

**Live site (GitHub Pages):** <https://nza-93.github.io/child-gift-capital/>

## What donors do

1. Open the site and choose an allocation (presets or custom percentages that sum to 100%).
2. Copy the IBAN details and the generated preference code.
3. Pay from their own bank. The code goes in the transfer reference (`Verwendungszweck`).

The allocation UI works **without a backend**. Drafts are stored in `localStorage`, and the same code is written into the URL hash so a donor can bookmark it.

## Sleeves

| Sleeve | Intent |
| --- | --- |
| Global growth | Broad world equity ETF sleeve (higher long-run risk) |
| Balanced | Mix of equities and bonds |
| Steady | Bonds / cash-oriented |
| Parents decide | Donor leaves the mix to the custodians |

## Preference code

```text
GC1-070-020-010-000-K7MM
```

means 70% global growth, 20% balanced, 10% steady, 0% parents-decide, token `K7MM`.

Full matching notes: [`ledger/README.md`](ledger/README.md).  
In-browser decoder: [`ledger.html`](ledger.html).

## Placeholder IBAN

The published IBAN is a **fake German-format placeholder**, clearly labelled **TO BE REPLACED**:

```text
IBAN  DE00 0000 0000 0000 0000 00
BIC   XXXXXXXXXXX
```

It is not a real account. Do not send money to it.

## How to swap the real IBAN later

Edit [`js/config.js`](js/config.js) only:

1. Set `ibanDisplay` (grouped) and `ibanCompact` (no spaces).
2. Set `bic`, `accountHolder`, and `bankName`.
3. Set `placeholder` to `false` and rewrite `placeholderNotice` so the warning no longer says “do not send money”.
4. Commit to `main`. GitHub Pages will pick up the static files.

Keep a dedicated IBAN for this purpose. Do not reuse a household current account if you can avoid it.

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

## Repo map

| Path | Role |
| --- | --- |
| `index.html` | Landing, allocation UI, how to give |
| `privacy.html` | Privacy + “not advice / not buying securities” |
| `ledger.html` | Decode a bank reference |
| `js/config.js` | IBAN / BIC placeholders (swap here) |
| `js/reference.js` | Encode / decode `GC1` codes |
| `ledger/` | CSV + JSON templates and matching README |

## Legal tone (footer)

The site states, in English and German, that it is **not investment advice** and **does not buy securities**. It does not process payments. Allocation codes are preferences for a parent ledger, not broker orders.
