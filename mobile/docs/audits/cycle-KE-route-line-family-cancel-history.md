# Cycle KE - Route Line Family Cancel and History

Status: Pass for focused backend/data-contract scope.

Scope:

- Prove selected Spread and Team Total line/provider identity through submit, cancel, Portfolio open-order removal, and canceled History activity.
- Use actual backend routes plus the mobile submit guard.
- Keep this as backend/data-contract evidence, not a UI redesign cycle.

## Gate Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Spread selected-line cancel preserves identity | Pass | `docs/mobile/harness/cycle-KE-route-line-family-cancel-history/cycle-KE-route-line-family-cancel-history.json`. |
| Team Total selected-line cancel preserves identity | Pass | Same KE route/mobile proof. |
| Canceled orders are removed from Portfolio open orders | Pass | KE proof verifies `openOrderRemoved=true` for both families. |
| Canceled History preserves line/provider selection | Pass | KE proof verifies canceled `selection.line`, `period`, `externalMarketId`, `referenceTokenId`, and `limitSide`. |
| P0 unresolved gaps | Pass | None for this focused cancel/history scope. |

## Validation

- `$env:INTERNAL_TRADING_BETA_ENABLED='true'; $env:TRADING_KILL_SWITCH='false'; npx tsx scripts/prove_mobile_route_line_family_cancel_history.ts --output=docs/mobile/harness/cycle-KE-route-line-family-cancel-history/cycle-KE-route-line-family-cancel-history.json` - pass.
- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts mobile/src/__tests__/openOrderService.test.ts` - pass.
- `npx jest --runInBand src/__tests__/orders.cancel.route.test.ts src/server/services/__tests__/canonical_order_submission.phase5.test.ts` - pass.
- `npx tsc --noEmit` - pass.
- `cd mobile; npm run typecheck` - pass.

## Remaining P1

- Extend selected spread/totals/team-total lifecycle breadth through filled states.
- Add immutable first-class selection snapshot columns for orders/fills/trades before production hardening.
