# Cycle MG Event List Non-Negative Quote Contract

Date: 2026-07-06

Scope:

- Event-list route payloads used by Home, Search, Live, and Futures.
- Outcome quote and depth fields before frontend probability fallback or visible card state applies.

Out of scope:

- Event card visual redesign.
- Provider metric breadth.
- Event Detail market rendering.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid non-negative quote fields accepted | Pass | `docs/mobile/harness/cycle-MG-event-list-nonnegative-quote-contract/cycle-MG-event-list-nonnegative-quote-contract.json` |
| Negative price rejects before visible apply | Pass | MG proof `negativePriceRejects=true` |
| Negative bid rejects before visible apply | Pass | MG proof `negativeBidRejects=true` |
| Negative depth size rejects before visible apply | Pass | MG proof `negativeAskSizeRejects=true` |
| Malformed price rejects before visible apply | Pass | MG proof `malformedPriceRejects=true` |

Implementation notes:

- Shared event-list route validation now requires `price`, `bestBid`, `bestAsk`, `bestBidSize`, and `bestAskSize` to be finite non-negative number-like values when present.
- Null/empty optional quote fields remain allowed.
- Negative quote fields no longer reach `normalizeEventSummary`, where they could be clamped into misleading visible probabilities.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventListRouteShapeService.test.ts mobile/src/__tests__/liveEventFeedService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_list_nonnegative_quote_contract.ts`
- Full validation/gate: see latest Cycle MG validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional surface-specific event-list quote error copy.
