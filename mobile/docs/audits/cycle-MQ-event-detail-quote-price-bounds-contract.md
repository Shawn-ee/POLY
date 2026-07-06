# Cycle MQ Event Detail Quote Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode Event Detail route payloads.
- `/api/mobile/events/:slug/live-detail` outcome quote fields before game-page market rows apply.

Out of scope:

- Event Detail visual redesign.
- Order book, chat, live stats, and broad backend schema changes.
- Event-list card quote conversion.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Probability quote fields accepted inside bounds | Pass | `docs/mobile/harness/cycle-MQ-event-detail-quote-price-bounds-contract/cycle-MQ-event-detail-quote-price-bounds-contract.json` |
| Large backend depth sizes accepted | Pass | MQ proof `largeDepthSizeAccepted=true` |
| Above-one price rejects before Event Detail hydration | Pass | MQ proof `priceAboveOneRejects=true` |
| Above-one bid/ask rejects before Event Detail hydration | Pass | MQ proof `bidAboveOneRejects=true`, `askAboveOneRejects=true` |
| Malformed quote and negative depth reject | Pass | MQ proof `malformedQuoteRejects=true`, `negativeDepthSizeRejects=true` |

Implementation notes:

- Event Detail outcome `price`, `bestBid`, and `bestAsk` are validated as probability values from `0` to `1`.
- Outcome `bestBidSize` and `bestAskSize` remain non-negative depth values and can be larger than `1`.
- Server-mode route-backed Event Detail now rejects impossible quote prices before frontend normalization or market rendering.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts mobile/src/__tests__/eventDetailHydrationService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_quote_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle MQ validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific Event Detail quote error copy.
