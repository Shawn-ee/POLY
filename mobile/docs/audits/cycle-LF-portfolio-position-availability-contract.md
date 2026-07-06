# Cycle LF - Portfolio Position Availability Contract

Gate status: Pass

## Scope

- Add backend-owned market availability to `/api/portfolio` position and open-order market payloads.
- Preserve position market availability in mobile server Portfolio state.
- Carry that availability into backend-only Portfolio position re-trade fallback tickets.
- Keep Portfolio layout unchanged.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LF-portfolio-position-availability-contract/cycle-LF-portfolio-position-availability-contract.json`
- Proof script: `scripts/prove_mobile_portfolio_position_availability_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/portfolioSnapshotService.test.ts`
  - `mobile/src/__tests__/positionTradeTargetService.test.ts`
  - `mobile/src/__tests__/orderService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| `/api/portfolio` discloses market availability for visible positions | Pass | Backend maps market status into `ready`, `suspended`, or `unavailable`. |
| Mobile keeps availability on server positions | Pass | Snapshot mapper stores `position.marketAvailability`. |
| Backend-only position fallback ticket keeps availability | Pass | Fallback target uses the position availability when the market is not loaded locally. |
| Unavailable position re-trade cannot submit as normal | Pass | Existing ticket submit guard blocks `suspended`/`unavailable` fallback markets. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused Portfolio position availability contract.
- Remaining P1/P2: richer Portfolio copy for closed/paused position markets if product wants explicit row-level messaging.
