# WC-DISC-OPS-004 Draft Import From Candidate Queue

Status: done

Completed: 2026-06-28

Report: `agent-orchestrator/runs/20260628T021851-WC-DISC-OPS-004-draft-import-from-candidate-queue/REPORT.md`

Summary:

- Added queue-backed draft import mode to `polymarket:import:draft --fromDb=true`.
- Queue import loads only persisted candidates with `status=draft_import_ready`.
- Confirmed imports retain the existing `POLYMARKET_AUTO_IMPORT_ENABLED` / `--confirmDraftImport=true` guard.
- Confirmed imports mark candidates `imported_draft` and store imported Event/Market/Outcome IDs.
- Existing report-file draft import mode remains supported.

Validation:

- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.discovery-candidate-store.test.ts src/__tests__/polymarket.draft-import.test.ts`: pass
- `npx tsc --noEmit --pretty false --incremental false`: pass
- `npm run polymarket:discover:once -- --skipDb=true --output test-logs\\wc-disc-ops-004-discovery.json`: pass
- `npm run polymarket:import:draft -- --input test-logs\\wc-disc-ops-004-discovery.json --output test-logs\\wc-disc-ops-004-import.json`: pass
- `npx eslint src/server/services/polymarket/discoveryCandidateStore.ts scripts/polymarket_import_draft.ts src/__tests__/polymarket.discovery-candidate-store.test.ts`: pass
- changed-file secret scan: pass

