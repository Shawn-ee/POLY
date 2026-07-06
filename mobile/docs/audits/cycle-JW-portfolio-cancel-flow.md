# Cycle JW - Portfolio Open-Order Cancel Flow

Status: Pass for focused backend/data-contract scope.

Scope:

- Portfolio open-order cancel in server mode.
- `DELETE /api/orders/:id` canonical cancel route.
- Post-cancel `/api/portfolio` open-order state and `/api/portfolio/history` canceled activity state.
- Mobile cancel service confirmation guard.
- No Portfolio visual redesign, deposits, withdrawals, orderbook, chat, or live stats product work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend cancels the actor's open order | Pass | Route proof at `docs/mobile/harness/cycle-JW-portfolio-cancel-flow/cycle-JW-portfolio-cancel-flow.json` verifies `DELETE /api/orders/:id` returns the same order with `status=CANCELED`. |
| Backend unlocks reserved collateral | Pass | Route proof verifies locked USDC becomes `0` and available USDC increases after cancel. |
| Canceled order is removed from open orders | Pass | Route proof verifies `/api/portfolio` no longer includes the canceled order in `openOrders`. |
| Canceled order appears in history with selection identity | Pass | Route proof verifies `/api/portfolio/history` includes the canceled activity with `selection.contractSide=no`, provider token, and limit side. |
| Repeated cancel is rejected clearly | Pass | Route proof verifies a second cancel returns `400` with `Order cannot be canceled`. |
| Mobile server mode requires backend confirmation | Pass | `mobile/src/__tests__/openOrderService.test.ts` verifies malformed or non-canceled responses are rejected. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/openOrderService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand src/__tests__/orders.cancel.route.test.ts` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `npx tsx scripts/prove_mobile_portfolio_cancel_flow.ts --output=docs/mobile/harness/cycle-JW-portfolio-cancel-flow/cycle-JW-portfolio-cancel-flow.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JW"` - pass.

## Remaining P1

- Richer mobile inline error state for cancel races where an order fills or is canceled before the tap is processed.
- First-class immutable `Order.selection` and `Trade.selection` or fill snapshot columns remain future hardening.
- Android Portfolio proof if visual/manual proof becomes required again.
