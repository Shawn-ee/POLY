# Cycle KC - Route-Backed Order Submit Selection Echo

Status: Pass for focused backend/data-contract scope.

Scope:

- Prove actual `/api/orders` response satisfies mobile `submitTicketOrder` selected line/provider selection echo guard.
- Prove route-backed selected Totals line identity is preserved into `/api/portfolio` open orders.
- Keep this as backend/data-contract evidence, not a new UI cycle.

## Gate Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Actual route submit echoes selected line/provider identity | Pass | `docs/mobile/harness/cycle-KC-route-order-submit-selection-echo/cycle-KC-route-order-submit-selection-echo.json`. |
| Mobile submit guard accepts the real route response | Pass | Proof uses `submitTicketOrder` with a route-backed `PolyApi.placeLimitOrder` shim. |
| Portfolio open order preserves selected identity | Pass | Proof verifies `openOrders[].selection.line`, `period`, `externalMarketId`, and `referenceTokenId`. |
| Canonical backend selection echo remains covered | Pass | `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`. |
| P0 unresolved gaps | Pass | None for this focused route-backed Totals line echo scope. |

## Validation

- `$env:INTERNAL_TRADING_BETA_ENABLED='true'; $env:TRADING_KILL_SWITCH='false'; npx tsx scripts/prove_mobile_route_order_submit_selection_echo.ts --output=docs/mobile/harness/cycle-KC-route-order-submit-selection-echo/cycle-KC-route-order-submit-selection-echo.json` - pass.
- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts` - pass.
- `npx jest --runInBand src/server/services/__tests__/canonical_order_submission.phase5.test.ts` - pass.
- `npx tsc --noEmit` - pass.
- `cd mobile; npm run typecheck` - pass.

## Remaining P1

- Repeat route-backed echo proof for spread and team-total families.
- Extend selected line/provider lifecycle breadth through filled/canceled states.
- Add immutable first-class selection snapshot columns for orders/fills/trades before production hardening.
