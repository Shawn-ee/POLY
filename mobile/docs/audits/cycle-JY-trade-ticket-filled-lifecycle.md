# Cycle JY - Trade Ticket Filled Lifecycle

Status: Pass for focused backend/data-contract scope.

Scope:

- Trade Ticket server-mode submit that fills against existing liquidity.
- `POST /api/orders` canonical maker and taker route path.
- Post-fill `/api/portfolio` position state and `/api/portfolio/history` recent trade state.
- No Portfolio visual redesign, orderbook UI, chat, live stats product work, deposits, or withdrawals.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend fills a route-submitted ticket order | Pass | Route proof at `docs/mobile/harness/cycle-JY-trade-ticket-filled-lifecycle/cycle-JY-trade-ticket-filled-lifecycle.json` verifies taker `POST /api/orders` returns `status=FILLED`, `remaining=0`, and one fill. |
| Backend returns buyer position in submit response | Pass | Route proof verifies the taker response includes buyer `position.shares=20`. |
| Portfolio shows filled buyer position | Pass | Route proof verifies `/api/portfolio` includes the filled position with `shares=20`. |
| Portfolio position preserves selected identity | Pass | Route proof verifies position `selection.contractSide=no`, provider market id, and provider token. |
| History shows recent trade | Pass | Route proof verifies `/api/portfolio/history` includes the buyer recent trade with `selection.contractSide=no`, provider token, and buyer limit side. |
| Proof respects orderbook collateral invariant | Pass | Proof mints complete-set inventory for the maker before placing the route-created `SELL`, instead of directly inserting one-sided inventory. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `$env:INTERNAL_TRADING_BETA_ENABLED='true'; $env:TRADING_KILL_SWITCH='false'; npx tsx scripts/prove_mobile_trade_ticket_filled_lifecycle.ts --output=docs/mobile/harness/cycle-JY-trade-ticket-filled-lifecycle/cycle-JY-trade-ticket-filled-lifecycle.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JY"` - pass.

## Remaining P1

- Filled lifecycle breadth across spread/team-total families and partial-fill states.
- Richer mobile filled/partial status copy after server submit.
- First-class immutable `Fill.selection` and `Trade.selection` snapshots remain future hardening.
