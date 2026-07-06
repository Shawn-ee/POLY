# Cycle NS Event List Pagination Contract

Date: 2026-07-06

Scope:

- Home, Search, Live, and Futures event-list pagination metadata.
- `/api/events` route data before visible pagination state applies.

Out of scope:

- Event card visual redesign.
- Backend event sorting or filtering behavior.
- Event Detail market profile contracts.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Positive integer page limit is accepted | Pass | `docs/mobile/harness/cycle-NS-event-list-pagination-contract/cycle-NS-event-list-pagination-contract.json` |
| Final page without cursor is accepted when `hasMore=false` | Pass | NS proof `acceptsFinalPageWithoutCursor=true` |
| Zero, negative, or fractional page limits are rejected | Pass | NS proof `rejectsZeroLimit=true`, `rejectsNegativeLimit=true`, `rejectsFractionalLimit=true` |
| `hasMore=true` without page cursor is rejected | Pass | NS proof `rejectsHasMoreWithoutCursor=true` |

Implementation notes:

- Event-list route page metadata now requires positive integer `page.limit`.
- `page.hasMore=true` now requires a non-empty `page.nextCursor`.
- Existing event, market, outcome, quote, and depth validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventListRouteShapeService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_list_pagination_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional pagination-specific retry/error copy.
