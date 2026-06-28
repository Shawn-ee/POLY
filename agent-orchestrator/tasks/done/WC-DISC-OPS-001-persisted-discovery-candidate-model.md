# WC-DISC-OPS-001 Persisted Discovery Candidate Model

Status: done

Completed: 2026-06-28

Report: `agent-orchestrator/runs/20260628T020816-WC-DISC-OPS-001-persisted-discovery-candidate-model/REPORT.md`

Summary:

- Added DB-backed `PolymarketDiscoveryCandidate` storage with source, external IDs, condition ID, slug, title/question, outcomes, token IDs, status, confidence, reason codes, raw metadata, first/last seen timestamps, and batch ID.
- Added duplicate-prevention constraints for source/external market ID, source/condition ID, and source/external slug.
- Added a persistence service that creates or refreshes discovery candidates without overwriting operator-controlled status or original `firstSeenAt`.
- Extended `polymarket:discover:once` with explicit candidate persistence support behind `POLYMARKET_DISCOVERY_PERSIST_CANDIDATES=true` or `--persistCandidates=true`; persistence is blocked when DB access is skipped.
- Added focused Jest coverage.

Validation:

- `npm exec prisma generate --schema=prisma/schema.prisma`: pass
- `npm exec prisma validate --schema=prisma/schema.prisma`: pass
- `npx jest --runInBand --detectOpenHandles src/__tests__/polymarket.discovery-candidate-store.test.ts src/__tests__/polymarket.discovery-report.test.ts`: pass
- `npx tsc --noEmit --pretty false --incremental false`: pass
- `npm run polymarket:discover:once -- --skipDb=true --output test-logs\\wc-disc-ops-001-discovery.json`: pass
- `POLYMARKET_DISCOVERY_PERSIST_CANDIDATES=true npm run polymarket:discover:once -- --skipDb=true`: fails safely before DB access, as expected
- changed-file secret scan: pass

