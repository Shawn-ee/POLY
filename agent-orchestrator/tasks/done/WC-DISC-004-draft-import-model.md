# WC-DISC-004 Draft Import Model

Status: done

Objective: Implement draft import from discovery candidate to internal `Event -> Market -> Outcome` records, default hidden/disabled.

Completed evidence:

- Runtime draft import builder: `src/server/services/polymarket/draftImport.ts`
- Command: `npm run polymarket:import:draft`
- Tests: `src/__tests__/polymarket.draft-import.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_market_import_check.sh`
- Report: `agent-orchestrator/runs/20260628T004500-WC-DISC-004-draft-import-model/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.discovery-report.test.ts src/__tests__/polymarket.draft-import.test.ts src/__tests__/polymarket.importer-foundation.test.ts`
- `npm run polymarket:discover:once -- --output test-logs/polymarket-discovery-for-draft-import.json`
- `npm run polymarket:import:draft -- --input test-logs/polymarket-discovery-for-draft-import.json --output test-logs/polymarket-draft-import-dry-run.json`
- `npx tsc --noEmit --pretty false --incremental false`
- `bash agent-orchestrator/harnesses/world_cup_market_import_check.sh`

Result: pass.
