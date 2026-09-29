# Public Readiness Audit

Scope: the `FCN-Tracker-Public` portfolio repository. Review date: 2026-09-28.

| # | Statement | How it was verified |
|---|---|---|
| 1 | The repository has **fresh Git history**. It was initialised empty; no Git objects were imported from the private repository. | `git log` shows only this repository's own commits; no source `.git` directory was copied. |
| 2 | **All included products are synthetic** (`DEMO-FCN-001` … `003`), with fictional underlyings, dates, prices, levels and coupons. | `lib/demo/products.ts`, `lib/demo/paths.ts`; the scenario tests assert the catalogue contains only these three products. |
| 3 | No real product-registry (TDCC) records or codes are included. | Scanner rule for 12-digit identifiers plus a private term list of known production values; manual review. |
| 4 | **No broker / salesperson identifiers** or assignment data are included, and no route filters products by user code. | Scanner rules for assignment fields, code patterns and routes; the only routes are the landing page and `/products/[productId]`, each in English and Traditional Chinese (`/en`, `/zh-TW`). |
| 5 | No production customer information is included. | Scanner rules for personal data, e-mail addresses and account numbers; manual review. |
| 6 | **No admin console and no chat-bot submission workflow** are included. | Route inventory; scanner rules for admin surfaces and chat-bot identifiers. |
| 7 | **No production credentials** are included: no environment files, keys, tokens or storage configuration. | Scanner rules for keys, tokens, passwords and forbidden file types; the app reads no environment variables. |
| 8 | The **demo runs without private infrastructure**: no database, no key-value store, no scheduled jobs, no external market-data calls. | Fully static build (`next build` pre-renders every page); `MarketDataSource` has a single, synthetic implementation. |
| 9 | **Tests and CI validate the portfolio edition**: scanner, type check, unit/scenario tests and production build run on every push and pull request. | `.github/workflows/ci.yml`. |
| 10 | The **original private repository remains separate** and private; nothing was pushed to it and its visibility was not changed. | Verified with the repository host before publication. |

## Hosted demo

- The public portfolio edition is deployed as a separate Vercel project dedicated to this repository.
- The deployment uses no environment variables; none are configured on the project.
- No storage, database, scheduled job or other operational infrastructure is connected.
- The production deployment of the private project is separate and was not modified.
- Production builds run automatically from `main` of this repository through the Git
  integration (install with `npm ci`, then `npm run build`).
- The hosted demo serves only the three synthetic products. Every page is pre-rendered static
  HTML and the pages request resources from their own origin only.

## Scanner notes

- `scripts/check_public.py` prints paths and categories only — never values —
  and exits non-zero on any unreviewed finding.
- Reviewed exceptions are pinned line-by-line in
  `scripts/public_scan_allowlist.json` using a SHA-256 of the line, with a
  written reason. Editing an allowlisted line invalidates its entry.
- Employer names and known production values are screened through a private
  term list supplied at run time (environment variable or untracked file), so
  that the public repository does not itself contain the values it screens
  for. CI runs the full public rule set with or without that list.

## Pre-publication verification

- [x] `npm test` passes (115 tests)
- [x] `npm run build` passes (all pages statically generated)
- [x] Public-content scan passes — in CI mode and locally with the private term list
- [x] Scanner self-tests pass
- [x] `npm audit`: 0 known vulnerabilities
- [x] CI green on GitHub (checkout → `npm ci` → scanner tests → scan → type check → tests → build)
- [x] Git history reviewed: working tree, every revision and all commit messages;
      author identity is a no-reply address; no Git objects from the private repository
- [x] Every demo page reviewed at desktop width and at 375 px (no horizontal overflow);
      pages make no requests to any host other than their own origin

Changing repository visibility remains an explicit owner action.
