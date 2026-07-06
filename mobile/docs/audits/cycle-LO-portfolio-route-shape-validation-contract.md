# Cycle LO - Portfolio Route Shape Validation Contract

Gate status: Pass

## Scope

- Validate server-mode Portfolio route payloads before applying visible Portfolio state.
- Treat malformed `/api/portfolio` and `/api/portfolio/history` payloads as sync errors.
- Preserve successful empty/new-account Portfolio responses.
- Keep scope to route/data correctness; no Portfolio visual redesign.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LO-portfolio-route-shape-validation-contract/cycle-LO-portfolio-route-shape-validation-contract.json`
- Proof script: `scripts/prove_mobile_portfolio_route_shape_validation_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/portfolioSnapshotService.test.ts`
  - `mobile/src/__tests__/portfolioHistoryService.test.ts`
  - `mobile/src/__tests__/portfolioSyncService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Malformed snapshot rejects before apply | Pass | Missing/invalid required snapshot arrays are rejected. |
| Malformed history rejects before apply | Pass | Invalid activity numeric fields are rejected. |
| Malformed routes do not report synced | Pass | Sync resolver returns `error` when both route-shaped loaders reject. |
| Empty valid Portfolio remains renderable | Pass | Existing empty-account snapshot test still passes. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused Portfolio route shape validation contract.
- Remaining P1/P2: richer route-specific Portfolio retry copy remains optional.
