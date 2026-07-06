# Cycle MS Event List Quote Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode Home, Search, Live, and Futures compact event-list payloads.
- `/api/events?...includeMobileMarkets=1` outcome quote fields before visible card state applies.

Out of scope:

- Event Detail route payloads, covered by Cycle MQ.
- Event card visual redesign.
- Backend provider quote sourcing changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Probability quote fields accepted inside bounds | Pass | `docs/mobile/harness/cycle-MS-event-list-quote-price-bounds-contract/cycle-MS-event-list-quote-price-bounds-contract.json` |
| Large backend depth sizes accepted | Pass | MS proof `largeDepthSizeAccepted=true` |
| Above-one price rejects before visible cards apply | Pass | MS proof `priceAboveOneRejects=true` |
| Above-one bid/ask rejects before visible cards apply | Pass | MS proof `bidAboveOneRejects=true`, `askAboveOneRejects=true` |
| Malformed quote and negative depth reject | Pass | MS proof `malformedQuoteRejects=true`, `negativeDepthSizeRejects=true` |

Implementation notes:

- Event-list outcome `price`, `bestBid`, and `bestAsk` are validated as probability values from `0` to `1`.
- Outcome `bestBidSize` and `bestAskSize` remain non-negative depth values and can be larger than `1`.
- Home/Search/Live/Futures server-mode cards now reject impossible quote prices before frontend normalization or card rendering.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventListRouteShapeService.test.ts mobile/src/__tests__/liveEventFeedService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_list_quote_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle MS validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific event-list quote error copy.
