# Cycle NG Event Detail Line Ticket Route-Backed Contract

Date: 2026-07-06

Scope:

- Route-backed Event Detail Game Lines ticket identity.
- `/api/mobile/events/:slug/live-detail` line-market selections before opening Trade Ticket.

Out of scope:

- Event Detail visual redesign.
- Order book UI.
- New line-market families.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Matching backend line opens backend ticket target | Pass | `docs/mobile/harness/cycle-NG-event-detail-line-ticket-route-backed-contract/cycle-NG-event-detail-line-ticket-route-backed-contract.json` |
| Mismatched route-backed line does not invent ticket | Pass | NG proof `routeBackedMismatchedLineDoesNotInventTicket=true` |
| Missing route-backed line does not invent ticket | Pass | NG proof `routeBackedMissingLineDoesNotInventTicket=true` |
| Local fallback remains allowed off route-backed pages | Pass | NG proof `localFallbackStillAllowed=true` |
| Provider identity preserved in ticket selection | Pass | NG proof `backendSelectionPreservesProviderIdentity=true` |

Implementation notes:

- Route-backed Event Detail line selections now require matching backend market/outcome identity to open a ticket.
- If backend line identity is missing or mismatched, the row has no ticket target instead of falling back to deterministic synthetic market identity.
- Non-route-backed local/mock Event Detail still allows deterministic fallback fixtures.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailLineTicketService.test.ts mobile/src/__tests__/eventDetailLineAvailabilityService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_line_ticket_route_backed_contract.ts`
- Full validation/gate: see latest Cycle NG validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional disabled-row copy when a route-backed line has no matching backend ticket identity.
