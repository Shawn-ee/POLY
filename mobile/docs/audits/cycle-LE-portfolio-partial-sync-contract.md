# Cycle LE - Portfolio Partial Sync Contract

Gate status: Pass

## Scope

- Treat `/api/portfolio` and `/api/portfolio/history` as separate required reads for full Portfolio sync.
- Show visible Portfolio sync error when either server route fails.
- Preserve successful partial data instead of discarding usable snapshot/history state.
- Keep scope to backend/data correctness, not Portfolio visual redesign.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LE-portfolio-partial-sync-contract/cycle-LE-portfolio-partial-sync-contract.json`
- Proof script: `scripts/prove_mobile_portfolio_partial_sync_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/portfolioSyncService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Both Portfolio routes succeed -> visible synced state | Pass | Proof `bothSucceeded.syncStatus=synced`. |
| Snapshot succeeds, history fails -> visible error state | Pass | Proof `historyFailed.syncStatus=error` while snapshot data remains present. |
| History succeeds, snapshot fails -> visible error state | Pass | Proof `snapshotFailed.syncStatus=error` while activity data remains present. |
| Both routes fail -> visible error and no invented data | Pass | Proof `bothFailed.syncStatus=error` with no snapshot or activity payload. |
| Successful partial data remains usable | Pass | Proof keeps `snapshot` or `activities` on partial failures. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused Portfolio partial sync status.
- Remaining P1/P2: granular UI copy for snapshot-vs-history partial failures.
