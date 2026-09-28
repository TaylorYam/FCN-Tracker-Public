# Public Readiness Audit

Scope: the `FCN-Tracker-Public` portfolio repository. Review date: 2026-09-28.

| # | Statement | How it was verified |
|---|---|---|
| 1 | The repository has **fresh Git history**. It was initialised empty; no Git objects were imported from the private repository. | `git log` shows only this repository's own commits; no source `.git` directory was copied. |
| 2 | **All included products are synthetic** (`DEMO-FCN-001` … `003`), with fictional underlyings, dates, prices, levels and coupons. | `lib/demo/products.ts`, `lib/demo/paths.ts`; the scenario tests assert the catalogue contains only these three products. |
| 3 | No real product-registry (TDCC) records or codes are included. | Scanner rule for 12-digit identifiers plus a private term list of known production values; manual review. |
| 4 | **No broker / salesperson identifiers** or assignment data are included, and no route filters products by user code. | Scanner rules for assignment fields, code patterns and routes; the only routes are `/` and `/products/[productId]`. |
| 5 | No production customer information is included. | Scanner rules for personal data, e-mail addresses and account numbers; manual review. |
| 6 | **No admin console and no chat-bot submission workflow** are included. | Route inventory; scanner rules for admin surfaces and chat-bot identifiers. |
| 7 | **No production credentials** are included: no environment files, keys, tokens or storage configuration. | Scanner rules for keys, tokens, passwords and forbidden file types; the app reads no environment variables. |
| 8 | The **demo runs without private infrastructure**: no database, no key-value store, no scheduled jobs, no external market-data calls. | Fully static build (`next build` pre-renders every page); `MarketDataSource` has a single, synthetic implementation. |
| 9 | **Tests and CI validate the portfolio edition**: scanner, type check, unit/scenario tests and production build run on every push and pull request. | `.github/workflows/ci.yml`. |
| 10 | The **original private repository remains separate** and private; nothing was pushed to it and its visibility was not changed. | Verified with the repository host before publication. |

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

## Publication checklist

- [x] `npm test` passes
- [x] `npm run build` passes
- [x] Public-content scan passes (with private term list, locally)
- [ ] CI green on GitHub
- [ ] Git history reviewed (working tree and all commits)
- [ ] Owner review of every demo page
- [ ] Repository visibility changed to public (owner decision)
