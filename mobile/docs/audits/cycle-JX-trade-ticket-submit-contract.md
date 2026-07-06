# Cycle JX - Trade Ticket Submit Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Trade Ticket server-mode submit.
- `POST /api/orders` canonical order route.
- Post-submit `/api/portfolio` open-order state.
- Mobile submit service confirmation guard.
- No Portfolio visual redesign, orderbook UI, chat, live stats product work, deposits, or withdrawals.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend accepts ticket submit through real order route | Pass | Route proof at `docs/mobile/harness/cycle-JX-trade-ticket-submit-contract/cycle-JX-trade-ticket-submit-contract.json` verifies `POST /api/orders` returns a real order id with `status=OPEN`. |
| Backend preserves selected contract side | Pass | Route proof verifies response `order.contractSide=NO` and `order.selection.contractSide=no`. |
| Backend preserves provider and limit identity | Pass | Route proof verifies provider token, external market id, and limit side survive the order response and Portfolio open order. |
| Submitted order appears in Portfolio | Pass | Route proof verifies `/api/portfolio` returns the submitted order in `openOrders[]` with the same selected identity. |
| Submit route is idempotent | Pass | Route proof verifies replaying the same `Idempotency-Key` and body returns the same backend order id. |
| Mobile server mode requires backend confirmation | Pass | `mobile/src/__tests__/orderService.test.ts` verifies malformed responses without an order id are rejected instead of creating a local fallback id. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `$env:INTERNAL_TRADING_BETA_ENABLED='true'; $env:TRADING_KILL_SWITCH='false'; npx tsx scripts/prove_mobile_trade_ticket_submit_contract.ts --output=docs/mobile/harness/cycle-JX-trade-ticket-submit-contract/cycle-JX-trade-ticket-submit-contract.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JX"` - pass.

## Remaining P1

- Route-backed filled lifecycle for this same simple ticket path when counterparty liquidity exists.
- Richer mobile-visible server submit error states for trading gate, unavailable provider, and insufficient collateral errors.
- First-class immutable `Order.selection`, `Fill.selection`, and `Trade.selection` snapshots remain future hardening.
