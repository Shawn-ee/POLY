# Cycle MV Market Chart Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode chart route consumed by visible Event Detail/Futures chart state.
- `/api/markets/:id/chart` history price fields before chart state applies.

Out of scope:

- Event Detail visual redesign.
- Order book.
- Backend chart provider sourcing changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Event chart price `1` accepted | Pass | `docs/mobile/harness/cycle-MV-market-chart-price-bounds-contract/cycle-MV-market-chart-price-bounds-contract.json` |
| Futures chart price `0` accepted | Pass | MV proof `futureChartPriceZeroAccepted=true` |
| Event chart price above `1` rejects | Pass | MV proof `eventChartPriceAboveOneRejects=true` |
| Futures chart price above `1` rejects | Pass | MV proof `futureChartPriceAboveOneRejects=true` |
| Negative chart price rejects | Pass | MV proof `negativeChartPriceRejects=true` |

Implementation notes:

- Market chart `history[].price` is now validated as a contract price from `0` to `1`.
- Existing `history[].probability` remains validated as `0` to `100`.
- Event Detail and Futures chart loaders reject malformed route prices before visible chart state applies.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/marketChartRouteShapeService.test.ts mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/futuresChartService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_market_chart_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle MV validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific chart price error copy.
