# Cycle NV Event Detail Line-Ticket Outcome Contract

Date: 2026-07-06

Scope:

- Event Detail route-backed Game Lines ticket targets.
- Backend market/outcome identity before Trade Ticket opens.

Out of scope:

- Visual redesign.
- Order book.
- Chat and live stats.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Route-backed matching market/outcome opens backend line ticket | Pass | `docs/mobile/harness/cycle-NV-event-detail-line-ticket-outcome-contract/cycle-NV-event-detail-line-ticket-outcome-contract.json` |
| Route-backed mismatched backend outcome is rejected | Pass | NV proof `rejectsRouteBackedOutcomeMismatch=true` |
| Non-route local fallback remains deterministic | Pass | NV proof `fallsBackForNonRouteOutcomeMismatch=true` |
| Stale backend outcome does not build backend ticket selection | Pass | NV proof `doesNotBuildSelectionFromStaleOutcome=true` |

Implementation notes:

- Backend line tickets now require the selected backend outcome to belong to the selected backend market.
- Route-backed line tickets return `null` instead of opening with mismatched market/outcome identity.
- Non-route local/mock fallback behavior remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailLineTicketService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_line_ticket_outcome_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional disabled-row copy for stale backend outcome identity.
