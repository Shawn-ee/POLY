# Current State

Last audited: 2026-06-17

## What Works

- `dev` is synced with the current `main` CI and agent workflow baseline.
- CI Phase 1 exists and passes locally with the focused Jest smoke suite.
- Prisma schema validates.
- All current migrations apply to an empty PostgreSQL 16 database.
- Public home, markets, sports, soccer, World Cup, event detail, and market detail pages load in Chrome.
- Seeded soccer World Cup events display on the sports UI.
- `seed:dev` creates soccer event markets and general prediction markets.
- `seed:nba` creates sports `Event` rows and links NBA markets to them.
- Local Playwright admin login works when `ALLOW_DEV_LOGIN=true`.
- Authenticated admin page smoke passes in headed Chrome.
- Authenticated sports order smoke passes after the #18 locator fix.
- A clean light trading UI shell foundation now exists on the UI redesign branch, covering global tokens, top navigation, shared page/card/button/badge/state primitives, market cards, sports cards, and public market/event listing surfaces.
- Market detail and trade ticket polish is underway on the next UI branch, extending the light trading primitives into order tickets, grouped trade tickets, orderbook panels, positions, and open orders.
- Portfolio, admin landing, auth modal, and crypto transfer modal polish is underway on the next UI branch, using the same light trading primitives while leaving wallet/deposit/withdrawal behavior unchanged.
- Admin deposits/withdrawals, wallet internals, and private pool screens are being polished on the next UI branch with the same light trading primitives and no money-flow behavior changes.
- Public market detail UI exposes order-ticket content after hydration.
- Admin pages and APIs are gated when unauthenticated.
- UI displays internal beta/test-credit warnings.

## What Is Partially Verified

- Wallet and portfolio pages load but authenticated balances/history were not fully verified in Chrome.
- Admin dashboard loads authenticated, but full event/market management flows still need coverage.
- Ledger Phase 3 tests pass against an isolated migrated database.
- Deposit and withdrawal routes were reviewed at architecture/interface level only.

## What Is Broken Or Missing

- `npm run test:ci` is referenced by validation plans but is not defined in `package.json`.
- Broad `npm run test:jest` is still not declared CI-safe.
- Full orderbook/ledger/settlement e2e coverage remains incomplete.
- Full admin event/market management verification remains incomplete.
- Full visual redesign is incomplete beyond the initial shell and public listing/detail surfaces.
- Some authenticated account/admin surfaces still retain older styling while the UI redesign proceeds in focused branches.
- Deeper wallet, admin subpages, pool pages, and historical account surfaces still need follow-up visual passes.
- Some deeper admin tools, bot dashboards, reference market review internals, and pool-market edge states still need follow-up visual passes.
- Bot sports market discovery verification remains incomplete.
- A committed screenshot artifact exists under `screenshotsforchat/`.

## Launch Readiness

POLY is closer after the `dev` integration pass, but it is not pre-money launch ready.

Blocking areas:

- define or replace the missing `test:ci` script
- orderbook/ledger/settlement QA
- authenticated browser/admin management QA
- continue UI redesign into event detail trade tickets, market detail/orderbook panels, wallet/portfolio, and admin surfaces
- bot sports discovery QA
- production security guard confirmation

Deposit and withdrawal must remain disabled/restricted until a dedicated approval and security review.
