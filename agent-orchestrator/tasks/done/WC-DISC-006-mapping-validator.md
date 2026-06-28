# WC-DISC-006 Mapping Validator

Status: done

Objective: Implement mapping validation with confidence score, reason codes, and admin-review-needed state.

Completed evidence:

- Validator service: `src/server/services/polymarket/mappingValidator.ts`
- Command: `npm run polymarket:mapping:validate`
- Tests: `src/__tests__/polymarket.mapping-validator.test.ts`
- Harness: `agent-orchestrator/harnesses/world_cup_mapping_validation_check.sh`
- Report: `agent-orchestrator/runs/20260628T005500-WC-DISC-006-mapping-validator/REPORT.md`

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.mapping-validator.test.ts src/__tests__/polymarket.discovery-report.test.ts src/__tests__/polymarket.draft-import.test.ts`
- `bash agent-orchestrator/harnesses/world_cup_mapping_validation_check.sh`
- `npx tsc --noEmit --pretty false --incremental false`

Result: pass.
