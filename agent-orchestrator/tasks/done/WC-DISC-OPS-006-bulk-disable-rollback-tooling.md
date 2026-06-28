# WC-DISC-OPS-006 Bulk Disable/Rollback Tooling

Status: done

Completed: 2026-06-28

Report: `agent-orchestrator/runs/20260628T023319-WC-DISC-OPS-006/REPORT.md`

Summary:

- Added `npm run polymarket:imports:rollback`.
- Rollback requires `--batchId`, `--source`, or `--candidateIds`.
- Dry-run is default.
- Confirmed rollback disables scoped candidates/markets/outcomes/MM quote configs without deleting data.

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.import-rollback.test.ts`: pass
- `npx tsc --noEmit --pretty false --incremental false`: pass
- `npm run polymarket:imports:rollback -- --output test-logs\\wc-disc-ops-006-rollback-missing-selector.json`: expected fail-safe
- `npx eslint src/server/services/polymarket/importRollback.ts scripts/polymarket_imports_rollback.ts src/__tests__/polymarket.import-rollback.test.ts`: pass
- `npm exec prisma validate --schema=prisma/schema.prisma`: pass with local placeholder `DATABASE_URL`
- changed-file secret scan: pass

