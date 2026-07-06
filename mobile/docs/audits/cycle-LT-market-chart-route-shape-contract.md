# Cycle LT Market Chart Route Shape Contract

Date: 2026-07-06

Scope:

- Event Detail server-mode market chart route apply.
- Home Futures server-mode market chart route apply.
- Shared `/api/markets/:id/chart` payload validation before visible chart history is applied.

Out of scope:

- Visual redesign.
- Chart animation or touch polish.
- Order book.
- Chat.
- Live stats as a sports-stat product.
- Selected-line chart switching beyond the currently loaded market id/range.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Event Detail chart loader validates route shape before visible apply | Pass | `mobile/src/services/marketChartService.ts`; LT proof |
| Futures chart loader validates route shape before visible apply | Pass | `mobile/src/services/futuresChartService.ts`; LT proof |
| Wrong-market chart payload rejects | Pass | LT proof `wrongMarketRejects=true` |
| Wrong-range chart payload rejects | Pass | LT proof `wrongRangeRejects=true` |
| Malformed probability history rejects | Pass | LT proof `malformedProbabilityRejects=true` |

Implementation notes:

- `assertMarketChartRoutePayloadShape` validates chart route identity, selected range, available ranges, generated/last-updated metadata, empty state, outcome identities, and chart history point numbers.
- Event Detail and Futures loaders call the validator immediately after `api.getMarketChart`.
- Malformed chart route payloads reject before `chartHistory` is mapped into visible app state.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/marketChartRouteShapeService.test.ts mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/futuresChartService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_market_chart_route_shape_contract.ts`
- Full validation/gate: see latest Cycle LT validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional chart-specific retry/error copy.
