# Cycle KF - Route Line Family Filled Lifecycle

Status: Pass for focused backend/data-contract scope.

Scope:

- Prove selected Spread and Team Total line/provider identity through maker liquidity, taker fill, Portfolio positions, and recent History trades.
- Use actual backend routes and the mobile submit guard.
- Keep this as backend/data-contract evidence, not a UI redesign cycle.

## Gate Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Spread selected-line filled lifecycle preserves identity | Pass | `docs/mobile/harness/cycle-KF-route-line-family-filled-lifecycle/cycle-KF-route-line-family-filled-lifecycle.json`. |
| Team Total selected-line filled lifecycle preserves identity | Pass | Same KF route/mobile proof. |
| Portfolio positions preserve selected identity | Pass | KF proof verifies position `selection.line`, `period`, `externalMarketId`, and `referenceTokenId`. |
| Recent trades preserve selected identity | Pass | KF proof verifies recent trade `selection.line`, `period`, `externalMarketId`, `referenceTokenId`, and buyer `limitSide=bid`. |
| P0 unresolved gaps | Pass | None for this focused filled lifecycle scope. |

## Validation

- `$env:INTERNAL_TRADING_BETA_ENABLED='true'; $env:TRADING_KILL_SWITCH='false'; npx tsx scripts/prove_mobile_route_line_family_filled_lifecycle.ts --output=docs/mobile/harness/cycle-KF-route-line-family-filled-lifecycle/cycle-KF-route-line-family-filled-lifecycle.json` - pass.
- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts` - pass.
- `npx jest --runInBand src/server/services/__tests__/canonical_order_submission.phase5.test.ts` - pass.
- `npx tsc --noEmit` - pass.
- `cd mobile; npm run typecheck` - pass.

## Remaining P1

- Repeat against real provider-backed live line markets when exact markets are available.
- Add immutable first-class selection snapshot columns for orders/fills/trades before production hardening.
