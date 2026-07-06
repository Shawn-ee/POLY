# Cycle MM Cashout Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio cashout/sell-all flow.
- Current-price bounds before `/api/orders` cashout submit.

Out of scope:

- Portfolio visual redesign.
- Partial cashout.
- Backend matching engine changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| `currentPrice=1.00` is cashout-available | Pass | `docs/mobile/harness/cycle-MM-cashout-price-bounds-contract/cycle-MM-cashout-price-bounds-contract.json` |
| `currentPrice>1.00` is cashout-unavailable | Pass | MM proof `aboveOneDollarPriceUnavailable=true` |
| `currentPrice=0` is cashout-unavailable | Pass | MM proof `zeroPriceUnavailable=true` |
| `currentPrice=1.00` submits price `1.00` | Pass | MM proof `oneDollarCashoutSubmitsPriceOne=true` |
| Above-one current price rejects before submit | Pass | MM proof `aboveOneDollarRejectsBeforeSubmit=true` |
| Missing current price rejects before submit | Pass | MM proof `missingPriceRejectsBeforeSubmit=true` |

Implementation notes:

- Server-mode cashout now requires `position.currentPrice` to be finite and within `(0, 1]`.
- Missing, zero, negative, or above-one current prices block cashout before `/api/orders`.
- Submit still closes the full visible `position.shares` amount.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/positionCloseRouteShapeService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle MM validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer invalid-price row copy.
