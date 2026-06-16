# Full Function Inventory

Audit branch: `audit/full-platform-verification`

Baseline: `origin/main` at the start of the audit.

## Branch And Workflow State

- `main` exists and contains the current CI workflow.
- `dev` exists as an integration branch but is currently behind `main` by the recent CI and agent workflow documentation commits.
- CI workflow: `.github/workflows/ci.yml`
- Package manager: npm with `package-lock.json`
- Node target in CI: Node 20

## Public Pages

- `/`
- `/login`
- `/markets`
- `/markets/[id]`
- `/events`
- `/events/[slug]`
- `/portfolio`
- `/wallet`
- `/create`
- `/my-pools`
- `/pool/[id]`

## Admin Pages

- `/admin`
- `/admin/agents`
- `/admin/bots`
- `/admin/deposits`
- `/admin/markets/[marketId]/invariants`
- `/admin/reference-markets`
- `/admin/system`
- `/admin/withdrawals`

## Public And User API Routes

Market and event routes:

- `GET /api/markets`
- `GET /api/markets/[id]`
- `GET /api/markets/[id]/chart`
- `GET /api/markets/[id]/positions`
- `GET /api/markets/[id]/quote`
- `GET /api/markets/[id]/reference`
- `POST /api/markets/[id]/resolve`
- `GET /api/markets/[id]/trades`
- `GET /api/events`
- `GET /api/events/[slug]`
- `GET /api/events/[slug]/markets`
- `GET /api/events/[slug]/grouped-markets`
- `GET /api/sports`
- `GET /api/sports/soccer/events`
- `GET /api/sports/soccer/world-cup/events`
- `GET /api/categories`
- `GET /api/tags`

Orderbook and canonical trading routes:

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/[id]`
- `DELETE /api/orders/[id]`
- `GET /api/fills`
- `POST /api/orderbook/place`
- `POST /api/orderbook/cancel`
- `GET /api/orderbook/[marketId]/book`
- `POST /api/orderbook/[marketId]/mint`
- `GET /api/orderbook/[marketId]/orders`
- `POST /api/orderbook/[marketId]/orders/place`
- `POST /api/orderbook/[marketId]/orders/cancel`
- `GET /api/orderbook/[marketId]/trades`

Portfolio, balance, and account routes:

- `GET /api/account/balance`
- `GET /api/account/ledger`
- `GET /api/account/positions`
- `GET /api/account/api-keys`
- `POST /api/account/api-keys`
- `PATCH /api/account/api-keys/[id]`
- `DELETE /api/account/api-keys/[id]`
- `GET /api/portfolio`
- `GET /api/portfolio/history`
- `GET /api/me`

Auth routes:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `GET /api/auth/link/google/start`
- `POST /api/auth/link/wallet/start`
- `POST /api/auth/link/wallet/verify`
- `POST /api/auth/wallet/nonce`
- `POST /api/auth/wallet/verify`

Wallet, deposit, and withdrawal routes:

- `GET /api/wallet/balance`
- `GET /api/wallet/challenge`
- `POST /api/wallet/deposit-confirm`
- `POST /api/wallet/deposit-intent`
- `GET /api/wallet/deposit-status`
- `POST /api/wallet/deposit-verify`
- `POST /api/wallet/faucet`
- `POST /api/wallet/link`
- `POST /api/wallet/link-manual`
- `GET /api/wallet/list`
- `GET /api/wallet/transactions`
- `GET /api/wallet/usdc-balance`
- `POST /api/wallet/withdraw`
- `POST /api/wallet/withdraw/complete`
- `GET /api/deposits`
- `GET /api/deposits/address`
- `GET /api/withdrawals`
- `POST /api/withdrawals/request`

Pool/private market routes:

- `GET /api/pool-markets`
- `POST /api/pool-markets`
- `GET /api/pool-markets/[id]`
- `POST /api/pool-markets/[id]/bet`
- `POST /api/pool-markets/[id]/cancel`
- `POST /api/pool-markets/[id]/join`
- `POST /api/pool-markets/[id]/resolve`
- `GET /api/pool-markets/mine`
- `POST /api/private-pools/[poolId]/cancel`
- `POST /api/private-pools/[poolId]/resolve`

Streaming routes:

- `GET /api/stream/market/[marketId]`
- `GET /api/stream/me/orders`

Health/profile routes:

- `GET /api/health`
- `PATCH /api/profile/avatar`

## Admin API Routes

Agent/admin operations:

- `GET /api/admin/agents/activity`
- `GET /api/admin/agents/status`
- `GET /api/admin/agents/runs`
- `GET /api/admin/agents/runs/[runId]`
- `GET /api/admin/agents/runs/[runId]/files`
- `GET /api/admin/agents/runs/[runId]/logs`
- `POST /api/admin/agents/runs/[runId]/memory-review`
- `GET /api/admin/agents/runs/[runId]/tasks`

Market and event administration:

- `GET /api/admin/markets`
- `POST /api/admin/markets/create`
- `POST /api/admin/markets/pause`
- `POST /api/admin/markets/resolve`
- `GET /api/admin/markets/[id]`
- `PATCH /api/admin/markets/[id]`
- `POST /api/admin/markets/[id]/cancel`
- `POST /api/admin/markets/[id]/close`
- `GET /api/admin/markets/[id]/invariants`
- `PATCH /api/admin/markets/[id]/outcomes`
- `POST /api/admin/markets/[id]/pause`
- `POST /api/admin/markets/[id]/resolve`
- `GET /api/admin/market-ops-stats`
- `POST /api/admin/events`
- `PATCH /api/admin/events/[id]`
- `POST /api/admin/events/[id]/markets/from-template`
- `POST /api/admin/events/[id]/markets/from-templates`

Reference market and bot operations:

- `GET /api/admin/reference-markets`
- `PATCH /api/admin/reference-markets/[id]`
- `POST /api/admin/reference-markets/[id]/refresh-snapshot`
- `POST /api/admin/reference-markets/[id]/seed-bot`
- `POST /api/admin/reference-markets/polymarket/import`
- `POST /api/admin/reference-quote-snapshots`
- `GET /api/admin/bots`
- `GET /api/admin/bots/[id]`

Deposit, withdrawal, and system administration:

- `GET /api/admin/deposits`
- `POST /api/admin/deposits/rescan`
- `GET /api/admin/withdrawals`
- `POST /api/admin/withdrawals/[id]/complete`
- `POST /api/admin/withdrawals/[id]/reject`
- `GET /api/admin/system`

## Database Models

Enums: `MarketStatus`, `MarketKind`, `MarketVisibility`, `MarketMechanism`, `MarketType`, `TradeSide`, `OrderStatus`, `LedgerReason`, `LedgerOperation`, `SupportedChain`, `SupportedToken`, `DepositAddressStatus`, `DepositStatus`, `LedgerAsset`, `LedgerEntryStatus`, `AuthProvider`, `WalletLinkMethod`, `LedgerTransactionType`, `LedgerTransactionStatus`, `WithdrawalRequestStatus`, `ApiOrderRequestStatus`, `ApiCredentialStatus`, `CanonicalEventStream`, `MarketMemberRole`.

Models: `User`, `Event`, `Market`, `Category`, `Tag`, `MarketTag`, `Outcome`, `ReferenceQuoteSnapshot`, `Position`, `Trade`, `Order`, `ApiOrderRequest`, `ApiCredential`, `ApiCredentialRateLimitBucket`, `ApiCredentialUsageLog`, `CanonicalEvent`, `Fill`, `MarketOutcomeSnapshot`, `LedgerEntry`, `UserDepositAddress`, `Deposit`, `UserBalance`, `Account`, `WalletNonce`, `Wallet`, `LedgerTransaction`, `DepositIntent`, `ChainDepositEvent`, `WithdrawalRequest`, `PoolBet`, `PoolStakePreset`, `MarketMember`.

## Prisma Migrations

There are migrations from the initial category/tag model through current sports event market support. Notable migration groups include market routing, wallet/deposit models, custody balances, orderbook hardening, manual withdrawals, canonical API credentials/event logs, reference quote snapshots, Polygon USDC deposits, and sports event market model.

## Background Workers And Scripts

Key operational scripts include:

- agent branch helpers under `scripts/agent/`
- seed scripts: `prisma/seed.ts`, `prisma/seed_nba.ts`, `scripts/seed_random_orderbook.ts`, `scripts/seed_used_environment.ts`
- orderbook QA scripts: `scripts/test_orderbook_*`, `scripts/test_phase5_matching.ts`
- deposit monitor and verification scripts: `scripts/run_polygon_deposit_monitor.ts`, `scripts/test_polygon_deposits.ts`, `prisma/check_deposit_verify.ts`
- reconciliation scripts: `scripts/reconcile_balances.ts`, `scripts/reconcile_markets.ts`, `scripts/reconcile_withdrawals.ts`
- reference market scripts: `scripts/refresh_reference_snapshots.ts`, `scripts/import_polymarket_reference_markets.ts`, `scripts/import_polymarket_event.ts`, `scripts/group_worldcup_event.ts`
- bot credential/reset scripts: `scripts/create_sim_bot_credentials.ts`, `scripts/reset_bot_state.ts`
- soak/simulation scripts: `scripts/soak_orderbook_bots.ts`, `scripts/simulate_exchange_phase85.ts`

## Test Files

Jest smoke tests live primarily in `src/__tests__/`. Service and DB-heavy suites live in `src/server/services/__tests__/`, with a mix of Jest and Vitest style tests. Current CI intentionally runs a focused Jest smoke set rather than the full broad Jest suite.

Bot E2E tests live under `tests/bot-e2e/`.

## CI Workflow

`.github/workflows/ci.yml` runs on:

- pull requests targeting `main`
- pushes to `main`

CI steps:

- checkout
- Node 20 setup
- `npm ci`
- Prisma generate
- Prisma validate
- TypeScript no-emit check
- focused Jest smoke tests

CI includes a Postgres 16 service and intentionally excludes Playwright, broader DB-backed Jest, and Vitest until those suites are isolated and stable.

## Inventory Notes

- The API surface is broad and includes both legacy pool-market routes and orderbook/canonical routes.
- Real-money-adjacent deposit, withdrawal, wallet, custody, and payment code exists and must remain restricted until explicitly approved.
- Sports/event market routes and admin event routes are present on `main`.
- `dev` is currently behind `main`; follow-up branches targeting `dev` should account for that branch drift.
