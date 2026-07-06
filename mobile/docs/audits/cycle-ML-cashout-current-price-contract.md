# Cycle ML Cashout Current Price Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio cashout/sell-all flow.
- Current-price requirement before `/api/orders` cashout submit.

Out of scope:

- Portfolio visual redesign.
- Partial cashout.
- Backend matching engine changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Position with current price is cashout-available | Pass | `docs/mobile/harness/cycle-ML-cashout-current-price-contract/cycle-ML-cashout-current-price-contract.json` |
| Missing current price is cashout-unavailable | Pass | ML proof `missingCurrentPriceUnavailable=true` |
| Zero current price is cashout-unavailable | Pass | ML proof `zeroCurrentPriceUnavailable=true` |
| Valid cashout uses current price | Pass | ML proof `validCashoutUsesCurrentPrice=true` |
| Missing current price rejects before submit | Pass | ML proof `missingCurrentPriceRejectsBeforeSubmit=true` |
| Zero current price rejects before submit | Pass | ML proof `zeroCurrentPriceRejectsBeforeSubmit=true` |

Implementation notes:

- Server-mode cashout no longer falls back to entry probability when `position.currentPrice` is missing.
- Cashout availability now requires positive shares and a finite positive current price.
- Submit still closes the full visible `position.shares` amount.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/positionCloseRouteShapeService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_current_price_contract.ts`
- Full validation/gate: see latest Cycle ML validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer unavailable-price row copy.
