# Current State

Last audited: 2026-06-16

## What Works

- CI Phase 1 exists and passes on `main`.
- Prisma schema validates.
- All current migrations apply to an empty PostgreSQL 16 database.
- Public market list and market detail APIs work with seeded NBA markets.
- Public market detail UI loads after hydration.
- Order ticket amount input works in Chrome for an unauthenticated empty-book market.
- Admin pages and APIs are gated when unauthenticated.
- UI displays internal beta/test-credit warnings.

## What Is Partially Verified

- Wallet and portfolio pages load but authenticated balances/history were not verified in Chrome.
- Admin pages load/gate correctly, but authenticated admin flows were not completed.
- Ledger Phase 3 tests mostly pass against an isolated migrated database, except for one test-runner mismatch.
- Deposit and withdrawal routes were reviewed at architecture/interface level only.

## What Is Broken Or Missing

- `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup` return 404.
- Sports/event APIs return empty arrays after `seed:nba`; the seed creates sports-tagged markets but not `Event` records.
- Broad `npm run test:jest` fails and is not CI-safe.
- `npm run test:phase3` fails because a Vitest run calls the Jest global `jest`.
- Authenticated local dev/admin login flow is not present on `main`.
- A committed screenshot artifact exists under `screenshotsforchat/`.

## Launch Readiness

POLY is not pre-money launch ready.

Blocking areas:

- sports/event UI completion
- full DB-backed test isolation
- orderbook/ledger/settlement QA
- authenticated browser/admin QA
- production security guard confirmation

Deposit and withdrawal must remain disabled/restricted until a dedicated approval and security review.
