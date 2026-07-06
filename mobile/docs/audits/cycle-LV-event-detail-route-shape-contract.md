# Cycle LV Event Detail Route Shape Contract

Date: 2026-07-06

Scope:

- Event Detail hydration from `/api/mobile/events/:slug/live-detail` and fallback `/api/events/:slug`.
- Backend-owned event rule fields that drive regulation/draw/advance rendering.
- Detail market/outcome shape validation before visible Event Detail state is applied.

Out of scope:

- Visual redesign.
- Order book.
- Chat.
- Live stats as a sports-stat product.
- Provider/schema refactors beyond validating the visible detail route contract.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Regulation 90-minute detail with draw hydrates after validation | Pass | `docs/mobile/harness/cycle-LV-event-detail-route-shape-contract/cycle-LV-event-detail-route-shape-contract.json` |
| Advance/no-draw detail hydrates after validation | Pass | LV proof `advanceNoDrawApplies=true` |
| Malformed event market profile rejects before Event Detail applies | Pass | LV proof `malformedProfileRejects=true` |
| Missing markets array rejects before Event Detail applies | Pass | LV proof `missingMarketsRejects=true` |
| Malformed outcome numeric fields reject before Event Detail applies | Pass | LV proof `malformedOutcomePriceRejects=true` |

Implementation notes:

- `assertEventDetailRoutePayloadShape` validates route payload, event identity/status/timing, backend game rule fields, supported market types, market rows, outcomes, tradability, and numeric quote fields.
- `loadEventDetailBySlug` and `loadEventDetailForCard` now validate detail route payloads before calling `normalizeEventDetail`.
- App deep-link/detail fallback paths use the same guarded loader instead of directly normalizing raw route payloads.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts mobile/src/__tests__/eventDetailHydrationService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_route_shape_contract.ts`
- Full validation/gate: see latest Cycle LV validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Event Detail route-specific retry/error copy when malformed backend data is rejected.
