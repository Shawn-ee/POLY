# World Cup Discovery/Import Scorecard

Updated: 2026-06-28

| Area | Max | Current | Evidence |
|---|---:|---:|---|
| Discovery bot | 10 | 10 | `polymarket:discover:once` exists, defaults to fixture report mode, harness validates output, optional live read-only smoke passed against the public reference source with DB skipped, and `POLYMARKET_DISCOVERY_PERSIST_CANDIDATES=true` can persist candidates when DB access is explicitly enabled. |
| Draft import | 10 | 10 | `polymarket:import:draft` converts fixture reports or `draft_import_ready` persisted DB candidates into draft import requests with `visibility=PRIVATE`, `desiredStatus=draft`, non-tradable outcomes, and dry-run reporting. Confirmed DB import marks candidates `imported_draft`. |
| Duplicate prevention | 8 | 8 | Discovery and draft import planning dedupe by condition ID, external market ID, slug, title, event keys, and outcome token IDs; fixture tests cover duplicate chains and repeated candidates. |
| Mapping validator | 12 | 9 | `polymarket:mapping:validate` validates fixture candidates with confidence, reason codes, missing fields, and lifecycle recommendations; DB-backed imported-record validation is still pending. |
| Confidence scoring/admin review | 8 | 8 | `polymarket:admin-review:report` summarizes mapping, validation confidence, reasons, reference prices, promotion eligibility, and recommended admin action; admin-only APIs list/detail/update persisted candidates, and the report can summarize the DB candidate queue. |
| Reference sync after import | 10 | 10 | Imported draft metadata carries fixture reference data, pending-review sync is supported, and local DB E2E stored 5 `ReferenceQuoteSnapshot` rows for eligible imported markets. |
| Two-tick pricing after import | 10 | 9 | Imported-draft fixture snapshots now feed quote plan tests showing two-tick-worse bid/ask; full promotion/E2E integration is still pending. |
| Promotion guardrails | 12 | 11 | `polymarket:promote:validated` evaluates required gates, guarded local DB lifecycle mutation is behind explicit safety flags, and local DB E2E promoted only 2 eligible markets while keeping 3 invalid markets private. |
| Public no-leak safety | 8 | 8 | Public market/event serializers no longer expose mapping IDs/tokens, event detail filters to public listed markets, and route tests cover imported enabled markets without mapping leaks. |
| Market maker dry-run after import | 7 | 7 | Imported candidates now have direct MM dry-run planning coverage for intents, stale references, closed markets, disabled mappings, and risk limits. |
| End-to-end discovery-to-trading smoke | 5 | 5 | `world_cup_discovery_to_trading_e2e_check.sh` chains fixture discovery, draft import, validation, admin review, promotion dry-run, public no-leak, and order-ticket gates. |
| Total | 100 | 99 | Fixture-first discovery/import through admin review, dry-run promotion, guarded DB lifecycle mutation, local DB lifecycle E2E, imported-market MM dry-run, public no-leak checks, E2E, read-only live-smoke gating, persisted discovery candidate storage, admin-only candidate review APIs, DB-backed review reporting, and queue-backed draft import are harnessed. |

Targets:

- 40/100 = documented prototype
- 60/100 = working fixture prototype
- 75/100 = safe internal beta candidate
- 90/100 = strong automated discovery/import system
- 95+/100 = production review candidate

Next target: 60/100 by implementing fixture candidate discovery, draft import, duplicate prevention, and mapping validation harnesses.

## 2026-06-28 WC-DISC-001

Discovery API audit completed. Finding: `reference:sync:once` only syncs already mapped/approved local markets; current discovery can build candidates but does not persist/import/validate/promote them. Score unchanged at 40/100 until fixture discovery and script harness work land.

## 2026-06-28 WC-DISC-002

Discovery fixture and `world_cup_market_discovery_check.sh` added. Focused Jest and harness pass. Score increased to 44/100.

## 2026-06-28 WC-DISC-003

Added `polymarket:discover:once`, fixture-first report builder, command validation, and TypeScript pass. Score increased to 48/100.

## 2026-06-28 WC-DISC-004

Added `polymarket:import:draft`, draft import request builder, dry-run report, focused tests, and `world_cup_market_import_check.sh`. Score increased to 53/100.

## 2026-06-28 WC-DISC-005

Added duplicate-key collection across external market IDs, condition IDs, slugs, titles, event keys, and outcome tokens. Draft import now skips duplicate candidates in dry-run/confirm planning. Score increased to 55/100.

## 2026-06-28 WC-DISC-006

Added `polymarket:mapping:validate`, mapping validator service, confidence scoring, lifecycle recommendations, tests, and `world_cup_mapping_validation_check.sh`. Score increased to 64/100.

## 2026-06-28 WC-DISC-007

Added imported-draft fixture reference data, pending-review reference sync option, snapshot-input helper tests, and promotion-stage harness coverage. Score increased to 66/100.

## 2026-06-28 WC-DISC-008

Added imported-draft two-tick pricing test and extended the promotion-stage harness. Score increased to 68/100.

## 2026-06-28 WC-DISC-009

Added `polymarket:promote:validated`, dry-run promotion guardrail evaluator, tests, and harness assertions. Score increased to 75/100, reaching the safe internal beta candidate threshold for the fixture pipeline.

## 2026-06-28 WC-DISC-010

Added imported-market MM dry-run helper and tests covering dry-run intents, stale references, closed markets, disabled mappings, and risk limits. Score increased to 77/100.

## 2026-06-28 WC-DISC-011

Tightened public market/event serializers, filtered event detail markets to public listed rows, removed public mapping ID/token leakage, and extended the promotion harness with public no-leak tests. Score increased to 80/100.

## 2026-06-28 WC-DISC-012

Added `polymarket:admin-review:report`, admin review report builder, tests, and mapping validation harness assertions. Score increased to 83/100.

## 2026-06-28 WC-DISC-013

Added deterministic discovery-to-trading E2E harness chaining fixture commands and Jest gates through promotion dry-run, public no-leak, and order-ticket checks. Score increased to 88/100.

## 2026-06-28 WC-DISC-014

Updated discovery harness with optional live read-only smoke gated by `POLYMARKET_DISCOVERY_LIVE_SMOKE=true` and skipped by default. Score increased to 89/100. No live API run is claimed.

## 2026-06-28 WC-DISC-DB-001

Added guarded DB-backed lifecycle mutation planning/application with explicit local safety flags and mocked DB tests. Score increased to 91/100.

## 2026-06-28 WC-DISC-DB-002

Added and ran guarded local DB discovery/import/promotion E2E. The harness imported 5 fixture candidates, promoted 2 eligible markets, kept 3 invalid markets private/unlisted/non-tradable, stored 5 reference snapshots, created 10 dry-run MM intents, and verified `draftLeaked=0`. Score increased to 94/100.

## 2026-06-28 WC-DISC-LIVE-001

Ran the optional live read-only discovery smoke with fixture mode disabled and DB skipped. The public reference path returned 5 live markets, all correctly ignored as non-World-Cup or unsupported for this scope. Score increased to 95/100.

## 2026-06-28 WC-DISC-OPS-001

Added the DB-backed `PolymarketDiscoveryCandidate` model, non-destructive migration, persistence service, discovery command persistence flag, duplicate-safe candidate upsert behavior, and focused tests. Score increased to 96/100. Remaining ops gaps: candidate review API/UI, draft import from queue, DB-backed imported-record validation, rollback tooling, scheduler playbook, and candidate-queue E2E harness.

## 2026-06-28 WC-DISC-OPS-002

Added admin-only persisted candidate review APIs for list/filter, detail, and status transitions. Public users are rejected, filtering supports status/source/batch ID, and review actions can move candidates to ignored, rejected, blocked, admin-review-required, or draft-import-ready. Score increased to 97/100.

## 2026-06-28 WC-DISC-OPS-003

Upgraded the admin review report flow with a persisted candidate queue report builder and `polymarket:admin-review:report --fromDb=true`. The report shows title, market type, outcomes, token IDs, confidence, blockers, duplicate status, raw metadata summary, import IDs, and recommended actions. Score increased to 98/100.

## 2026-06-28 WC-DISC-OPS-004

Updated draft import to support `polymarket:import:draft --fromDb=true`, loading only persisted candidates marked `draft_import_ready`. Confirmed imports mark candidates `imported_draft` and store imported Event/Market/Outcome IDs. Score increased to 99/100.

## 2026-06-28 WC-DISC-OPS-005

Added DB-backed mapping validation for imported `PolymarketDiscoveryCandidate` records. The validator checks imported Event/Market/Outcome IDs, external mapping fields, token IDs, labels, supported market type, duplicate keys, TBD/closed/missing-token blockers, and writes candidate/market validation metadata when explicitly confirmed. Score remains 99/100 until rollback, scheduler playbook, and candidate-queue E2E are complete.

## 2026-06-28 WC-DISC-OPS-006

Added `polymarket:imports:rollback`, dry-run-first rollback planning, confirmed rollback disable behavior, and tests. Confirmed rollback sets candidates `rollback_disabled`, markets private/unlisted/paused, outcomes non-tradable, bot quote configs disabled/dry-run, and rollback metadata. Score remains 99/100 until scheduler playbook and candidate-queue E2E pass.
