# Cycle LA - Cashout/Sell Safety Contract

Gate status: Pass

## Scope

- Keep Portfolio layout mostly unchanged.
- Block invalid server-mode Cash out/Sell actions in the frontend when the visible position has no positive shares.
- Prove backend rejects no-position SELL and oversell even if the frontend fails.
- Prove valid sell-all can proceed normally as a server SELL order.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LA-cashout-sell-safety-contract/cycle-LA-cashout-sell-safety-contract.json`
- Mobile unit test: `mobile/src/__tests__/positionCloseService.test.ts`
- Backend safety coverage: `src/server/services/__tests__/phase7_kalshi_model.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Disable/block Cash out when `position.shares <= 0` | Pass | Portfolio and Event Detail use `canCashOutPosition`; zero/missing server shares disable visible actions. |
| Do not call backend for invalid frontend cashout | Pass | `closePositionOnServer` throws `Cash out requires an open position with available shares.` before API submission. |
| Default cashout all based on current value/current price | Pass | `cashOutEstimate` uses `currentValue`, falling back to `shares * currentPrice`; sell-all submit still uses full held shares. |
| Backend rejects no-position SELL | Pass | `/api/orders` returns `409` and Portfolio remains empty. |
| Backend rejects oversell | Pass | `/api/orders` returns `409`, preserves 2 shares, and creates no open order. |
| Valid sell-all can proceed | Pass | `/api/orders` accepts SELL size 2 and reserves all 2 shares. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused cashout/sell safety.
- Remaining P1/P2: provider-backed production close/cashout replay on real live markets when provider liquidity breadth is in scope.
