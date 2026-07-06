# Cycle LR Event List Route Shape Contract

Date: 2026-07-06

Scope:

- Home event list server-mode route apply.
- Search event list server-mode route apply.
- Live tab server-mode route apply through the shared validator.
- Home futures server-mode route apply.

Out of scope:

- Visual redesign.
- Order book.
- Chat.
- Live stats as a sports-stat product.
- New discovery/search route design.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Shared compact event-list route validator exists | Pass | `mobile/src/services/eventListRouteShapeService.ts` |
| Home/Search/Futures call the validator before normalization | Pass | `mobile/App.tsx` route loaders |
| Live feed uses the same validator | Pass | `mobile/src/services/liveEventFeedService.ts` |
| Missing market arrays reject before frontend fallback rows | Pass | `docs/mobile/harness/cycle-LR-event-list-route-shape-contract/cycle-LR-event-list-route-shape-contract.json` |
| Malformed cursor metadata rejects before pagination state apply | Pass | LR proof `malformedCursorRejects=true` |
| Malformed outcome quote fields reject before fallback odds | Pass | LR proof `malformedQuoteRejects=true` |

Implementation notes:

- `assertEventListRoutePayloadShape` validates route page, event, market, outcome, and cursor metadata for compact `/api/events` responses.
- Home, Search, and Futures now call it immediately after `api.listWorldCupEvents(...)`, before `normalizeEventSummary` or `normalizeMarket`.
- Live keeps its existing service boundary, but now imports the shared validator instead of owning separate Live-only rules.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventListRouteShapeService.test.ts mobile/src/__tests__/liveEventFeedService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_list_route_shape_contract.ts`
- Full validation/gate: see latest Cycle LR validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional surface-specific retry/error copy.
