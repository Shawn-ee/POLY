# Cycle LC - Trade Ticket Availability Submit Contract

Gate status: Pass

## Scope

- Treat backend-provided `market.availability` as a Trade Ticket submit contract in server mode.
- Block route-backed `suspended` and `unavailable` markets before `/api/orders`.
- Preserve existing behavior for ready markets and warning states.
- Keep scope to backend/data correctness, not visual redesign.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LC-trade-ticket-availability-submit-contract/cycle-LC-trade-ticket-availability-submit-contract.json`
- Proof script: `scripts/prove_mobile_trade_ticket_availability_submit_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/orderService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Backend market availability survives mobile normalization | Pass | Proof starts from backend-shaped compact markets and checks mobile `availability.status`. |
| Unavailable market does not call the order API | Pass | Proof records `routeCallCount=0` for `availability.status=unavailable`. |
| Suspended market does not call the order API | Pass | Proof records `routeCallCount=0` for `availability.status=suspended`. |
| Blocked submit shows a clear reason | Pass | Error includes backend availability reason when provided. |
| Ready market still submits normally | Pass | Proof records one order API call and confirmed server order id for `availability.status=ready`. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused Trade Ticket availability submit safety.
- Remaining P1/P2: production active provider breadth/freshness; backend `/api/orders` remains final stale-client safety.
