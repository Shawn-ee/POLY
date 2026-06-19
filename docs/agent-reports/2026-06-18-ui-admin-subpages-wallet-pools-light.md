# UI Admin Subpages Wallet Pools Light

Branch: `agent/ui-admin-subpages-wallet-pools-light`

Date: 2026-06-18

## Goal

Polish admin subpages, wallet page internals, pool pages, and deeper account surfaces using the Robinhood Light custom blue/indigo/teal design foundation.

## Scope

- Updated wallet page presentation for balance, disabled deposit/withdraw notices, history tables, withdrawal requests, and linked wallet sections.
- Updated private pool listing cards and empty states.
- Updated pool market detail shells, owner/action panels, pool side panels, and status chips.
- Updated admin deposits page shell, rescan card, tables, and controls.
- Updated admin withdrawals page shell, pending/recent tables, inputs, and complete/reject action styling.
- Updated `docs/CURRENT_STATE.md` to note this UI branch.

## Intentionally Not Changed

- Wallet, deposit, withdrawal, custody, or payment behavior
- Real-money flow enablement
- Deposit modal opener behavior
- Ledger, matching, orderbook, settlement, or trading behavior
- API routes or request payloads
- Pool bet, cancel, or resolve semantics
- Admin deposit or withdrawal operation semantics
- Production deployment configuration

## Validation

| Check | Result | Notes |
| --- | --- | --- |
| `git diff --check` | PASS | No whitespace errors |
| `npm ci` | PASS | Existing npm audit/deprecation warnings remain |
| `npm exec -- prisma generate --schema=prisma/schema.prisma` | PASS | Existing Prisma config deprecation warning |
| `npm exec -- prisma validate --schema=prisma/schema.prisma` | PASS | Existing Prisma config deprecation warning |
| `npx tsc --noEmit --pretty false --incremental false` | PASS | No TypeScript errors |
| `npm run test:ci` | PASS | 13 suites, 39 tests passed |
| `npm run e2e:auth:setup` | PASS | Ran against local app on `http://127.0.0.1:3001` |
| `npm run e2e:sports:auth` | PASS | 2 Playwright tests passed |
| Focused ESLint on changed files | PASS | No errors; existing wallet warnings remain |
| Changed-file secret scan | PASS | No secret-like patterns found |
| Chrome smoke | PASS | `/wallet`, `/admin/deposits`, `/admin/withdrawals`, and `/my-pools` returned 200 and displayed expected UI text |

## Screenshots

Generated under ignored `test-results/`:

- `test-results/ui-admin-subpages-wallet-pools-light/wallet.png`
- `test-results/ui-admin-subpages-wallet-pools-light/admin-deposits.png`
- `test-results/ui-admin-subpages-wallet-pools-light/admin-withdrawals.png`
- `test-results/ui-admin-subpages-wallet-pools-light/my-pools.png`

## Known Limitations

- This pass focuses on wallet internals, private pool screens, and deposit/withdrawal admin pages. Bot dashboards, reference market review internals, system pages, agent pages, and pool edge states still need additional visual QA.
