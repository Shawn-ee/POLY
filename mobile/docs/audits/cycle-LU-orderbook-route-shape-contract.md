# Cycle LU Orderbook Route Shape Contract

Date: 2026-07-06

Scope:

- Event Detail selected-market depth loading from `/api/orderbook/:marketId/book?maxLevels=24`.
- Route-backed depth identity, availability, empty state, and level validation before visible depth rows are applied.

Out of scope:

- Visual redesign.
- Book/orderbook breadth work.
- Chat.
- Live stats as a sports-stat product.
- Provider ingestion/schema changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid orderbook route payload applies visible depth | Pass | `docs/mobile/harness/cycle-LU-orderbook-route-shape-contract/cycle-LU-orderbook-route-shape-contract.json` |
| Wrong-market orderbook payload rejects before visible apply | Pass | LU proof `wrongMarketRejects=true` |
| Malformed level numbers reject before visible apply | Pass | LU proof `malformedLevelRejects=true` |
| Malformed availability rejects before visible apply | Pass | LU proof `malformedAvailabilityRejects=true` |

Implementation notes:

- `assertOrderbookRoutePayloadShape` validates selected route identity, generated time, empty state, optional availability metadata, `levels[]`, `bids[]`, and `asks[]`.
- `loadMarketDepthState` calls the validator immediately after `api.getOrderbook`.
- Malformed depth payloads reject before `orderbookDepth` rows are applied to the selected market.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderbookRouteShapeService.test.ts mobile/src/__tests__/marketDepthService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_orderbook_route_shape_contract.ts`
- Full validation/gate: see latest Cycle LU validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional depth-specific retry/error copy.
