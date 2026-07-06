# Cycle LB - Event Detail Line Availability Contract

Gate status: Pass

## Scope

- Make visible Event Detail Game Lines line/period controls backend-driven in server/route-backed mode.
- Preserve local deterministic fallback only for non-route-backed fixture mode.
- Keep scope to backend/data correctness, not visual redesign.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LB-event-detail-line-availability-contract/cycle-LB-event-detail-line-availability-contract.json`
- Mobile tests:
  - `mobile/src/__tests__/eventDetailLineAvailabilityService.test.ts`
  - `mobile/src/__tests__/eventDetailLineTicketService.test.ts`
  - `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Route-backed Spread uses backend line/period availability | Pass | Proof starts from old default `1.5` Reg. Time and resolves backend `3.5` 2H. |
| Route-backed Totals uses backend line/period availability | Pass | Proof starts from old default `2.5` Reg. Time and resolves backend `4.5` 1H. |
| Route-backed Team Total uses backend line/period availability | Pass | Proof resolves backend `2.5` 2H instead of hardcoded `1.5` Reg. Time. |
| Static line defaults remain local fallback only | Pass | Unit coverage keeps fallback options when the event is not route-backed. |
| Unsupported backend line families are not invented | Pass | Builds on Cycle KZ; LB handles the available-family line/period selection case. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused Event Detail line availability.
- Remaining P1/P2: production active provider line-family breadth and live provider liquidity.
