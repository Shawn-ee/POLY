# WC-DISC-007 Reference Sync For Imported Drafts

Status: done

Objective: Ensure imported mapped drafts can run reference sync and store snapshots safely.

Completed evidence:

- Draft fixture reference data: `src/server/services/polymarket/draftImport.ts`
- Pending-review sync option: `src/server/services/polymarketReferenceSnapshots.ts`
- Command flag: `npm run reference:sync:once -- --includePendingReview`
- Tests: `src/__tests__/polymarket.imported-draft-reference-sync.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- Report: `agent-orchestrator/runs/20260628T010000-WC-DISC-007-reference-sync-for-imported-drafts/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.imported-draft-reference-sync.test.ts src/__tests__/polymarket.mapping-validator.test.ts src/__tests__/polymarket.draft-import.test.ts`
- `bash agent-orchestrator/harnesses/world_cup_market_promotion_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass.
