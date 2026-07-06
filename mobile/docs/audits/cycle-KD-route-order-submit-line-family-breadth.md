# Cycle KD - Route-Backed Line Family Submit Breadth

Status: Pass for focused backend/data-contract scope.

Scope:

- Broaden route-backed selected line/provider submit echo beyond Totals.
- Prove actual `/api/orders` responses satisfy mobile `submitTicketOrder` guard for Spread and Team Total tickets.
- Prove `/api/portfolio` open orders preserve selected line/provider identity for both families.

## Gate Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Spread route submit echoes selected identity | Pass | `docs/mobile/harness/cycle-KD-route-order-submit-line-family-breadth/cycle-KD-route-order-submit-line-family-breadth.json`. |
| Team Total route submit echoes selected identity | Pass | Same KD route/mobile proof. |
| Mobile submit guard accepts both real route responses | Pass | Proof uses `submitTicketOrder` with route-backed `PolyApi.placeLimitOrder` shims. |
| Portfolio open orders preserve both selections | Pass | Proof verifies `openOrders[].selection.line`, `period`, `externalMarketId`, and `referenceTokenId` for both families. |
| P0 unresolved gaps | Pass | None for this focused submit echo breadth scope. |

## Validation

- `$env:INTERNAL_TRADING_BETA_ENABLED='true'; $env:TRADING_KILL_SWITCH='false'; npx tsx scripts/prove_mobile_route_order_submit_line_family_breadth.ts --output=docs/mobile/harness/cycle-KD-route-order-submit-line-family-breadth/cycle-KD-route-order-submit-line-family-breadth.json` - pass.
- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts` - pass.
- `npx jest --runInBand src/server/services/__tests__/canonical_order_submission.phase5.test.ts` - pass.
- `npx tsc --noEmit` - pass.
- `cd mobile; npm run typecheck` - pass.

## Remaining P1

- Extend selected spread/totals/team-total lifecycle breadth through filled and canceled states.
- Add immutable first-class selection snapshot columns for orders/fills/trades before production hardening.
