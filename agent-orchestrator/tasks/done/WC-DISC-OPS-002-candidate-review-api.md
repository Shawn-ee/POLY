# WC-DISC-OPS-002 Candidate Review API

Status: done

Completed: 2026-06-28

Report: `agent-orchestrator/runs/20260628T021250-WC-DISC-OPS-002-candidate-review-api/REPORT.md`

Summary:

- Added admin-only persisted discovery candidate listing at `GET /api/admin/polymarket/discovery-candidates`.
- Added admin-only candidate detail at `GET /api/admin/polymarket/discovery-candidates/[id]`.
- Added admin-only candidate review transitions at `PATCH /api/admin/polymarket/discovery-candidates/[id]`.
- Supported status/review actions: `approve`, `mark_import_ready`, `ignore`, `reject`, `block`, and `mark_review_required`.
- Added route tests for public rejection, filters, detail loading, status transitions, and invalid action rejection.

Validation:

- `npm exec prisma generate --schema=prisma/schema.prisma`: pass
- `npm exec prisma validate --schema=prisma/schema.prisma`: pass
- `npx jest --runInBand --detectOpenHandles src/__tests__/admin.polymarket-discovery-candidates.route.test.ts src/__tests__/polymarket.discovery-candidate-store.test.ts`: pass
- `npx tsc --noEmit --pretty false --incremental false`: pass
- `npx eslint src/server/services/polymarket/discoveryCandidateStore.ts src/app/api/admin/polymarket/discovery-candidates/route.ts src/app/api/admin/polymarket/discovery-candidates/[id]/route.ts src/__tests__/admin.polymarket-discovery-candidates.route.test.ts`: pass
- changed-file secret scan: pass

