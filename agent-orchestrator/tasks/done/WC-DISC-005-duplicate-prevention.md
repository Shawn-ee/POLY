# WC-DISC-005 Duplicate Prevention

Status: done

Objective: Ensure import does not duplicate existing events, markets, or outcomes.

Completed evidence:

- Parser duplicate keys: `src/server/services/polymarket/parser.ts`
- Draft import plan duplicate skip: `src/server/services/polymarket/draftImport.ts`
- Discovery DB duplicate lookup: `scripts/polymarket_discover_once.ts`
- Draft import report duplicate fields: `scripts/polymarket_import_draft.ts`
- Tests: `src/__tests__/polymarket.discovery-report.test.ts`, `src/__tests__/polymarket.draft-import.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_market_import_check.sh`
- Report: `agent-orchestrator/runs/20260628T005000-WC-DISC-005-duplicate-prevention/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.discovery-report.test.ts src/__tests__/polymarket.draft-import.test.ts src/__tests__/polymarket.importer-foundation.test.ts`
- `bash agent-orchestrator/harnesses/world_cup_market_import_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass.
