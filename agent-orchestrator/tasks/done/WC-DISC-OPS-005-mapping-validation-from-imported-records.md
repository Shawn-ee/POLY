# WC-DISC-OPS-005 Mapping Validation From Imported Records

Status: done

Completed: 2026-06-28

Report: `agent-orchestrator/runs/20260628T023019-WC-DISC-OPS-005/REPORT.md`

Summary:

- Added imported-record mapping validation for persisted discovery candidates.
- Added `polymarket:mapping:validate --fromDb=true`.
- Explicit `--confirmUpdate=true` writes validation status, confidence, reason codes, admin-review flag, and promotion eligibility metadata.
- Invalid imported records are kept private, unlisted, paused, and non-tradable.

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.mapping-validator.test.ts`: pass
- `npx tsc --noEmit --pretty false --incremental false`: pass
- `npm run polymarket:discover:once -- --skipDb=true --output test-logs\\wc-disc-ops-005-discovery.json`: pass
- `npm run polymarket:mapping:validate -- --input test-logs\\wc-disc-ops-005-discovery.json --output test-logs\\wc-disc-ops-005-validation.json`: pass
- `npx eslint src/server/services/polymarket/mappingValidator.ts scripts/polymarket_mapping_validate.ts src/__tests__/polymarket.mapping-validator.test.ts`: pass
- changed-file secret scan: pass

