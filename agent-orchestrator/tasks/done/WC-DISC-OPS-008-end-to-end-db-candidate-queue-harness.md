# WC-DISC-OPS-008 End-To-End DB Candidate Queue Harness

Status: done

Completed: 2026-06-28

Report: `agent-orchestrator/runs/20260628T023825-WC-DISC-OPS-008/REPORT.md`

Summary:

- Added `agent-orchestrator/harnesses/world_cup_discovery_candidate_queue_e2e_check.sh`.
- Added `scripts/polymarket_candidate_queue_e2e.ts`.
- Harness flow: fixture discovery -> persisted DB candidate queue -> mark eligible rows import-ready -> draft import from DB -> DB-backed mapping validation -> rollback dry-run -> public no-leak.

Validation:

- `bash -n agent-orchestrator/harnesses/world_cup_discovery_candidate_queue_e2e_check.sh`: pass
- `npx tsc --noEmit --pretty false --incremental false`: pass
- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.mapping-validator.test.ts`: pass
- `bash agent-orchestrator/harnesses/world_cup_discovery_candidate_queue_e2e_check.sh`: pass
- changed-file secret scan: pass

