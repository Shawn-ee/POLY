# World Cup Tradable Scorecard

Updated: 2026-06-28

Permission note: no repository area requires separate owner approval. Dangerous execution still requires explicit task scope, evidence, rollback notes, and relevant harnesses. The score is unchanged by this policy-only update.

| Area | Max | Current | Evidence |
|---|---:|---:|---|
| World Cup discovery | 8 | 8 | Polymarket World Cup discovery supports fixture and read-only live smoke, persisted DB candidate queue, admin review, queue import, DB mapping validation, rollback dry-run, and candidate-queue E2E. |
| Event grouping | 8 | 6 | Event model and grouped event UI exist; grouped market contract needs hardening. |
| Market/contract model | 8 | 5 | Market fields support line/group/participants/reference IDs; v1 scope excludes player props. |
| Order ticket calculation | 10 | 4 | Ticket preview exists in event UI, order-ticket tests exist; unified Robinhood-like ticket needs completion. |
| Internal test trade flow | 10 | 5 | `POST /api/orders` guarded by internal trading beta; requires full World Cup trade smoke. |
| Position/mark value | 8 | 5 | Portfolio computes current mark/P&L from orderbook mid; needs World Cup-specific validation. |
| Polymarket reference sync | 10 | 8 | Snapshot sync, fixture mode, reference price APIs, harness checks, and imported-draft/reference-MM integration exist; server scheduler validation remains closed-beta work. |
| Two-tick pricing policy | 10 | 8 | Quote engine/snapshot tests cover two-tick behavior and imported-market pricing gates are harnessed; broader UI display regression remains future work. |
| Market-making bot safety | 10 | 8 | Dry-run/live-local guards, risk monitor, imported-market dry-run gate, pause commands, and rollback tooling exist; closed-beta live-local soak remains future work. |
| Bot inventory cleanup | 5 | 2 | Initial audit created; needs verification and cleanup tasks. |
| Combo validation/model | 5 | 2 | Combo quote/order exists but correlation/impossible combo model incomplete. |
| Early cash-out estimate | 5 | 1 | Spec only; no safe estimate implementation verified. |
| Public route/no-leak safety | 3 | 3 | Route security harness passed after SEC-001. |
| Discovery/import pipeline | 5 | 5 | Discovery/import scorecard is 100/100 for operational v2: DB candidate queue, admin API/report, queue import, imported-record validation, rollback, playbook, and candidate-queue E2E pass. |
| Total | 100 | 70 | Discovery/import operational hardening is complete for closed internal beta, lifting the platform to usable internal-demo readiness while broader trading UX, bot cleanup, combo, and cash-out work remain. |

Targets:

- 50/100 = rough prototype
- 70/100 = usable internal demo
- 85/100 = controlled internal beta candidate
- 95/100 = production review candidate

Analyzer note 2026-06-28: discovery/import scorecard added at `agent-orchestrator/memory/WORLD_CUP_DISCOVERY_IMPORT_SCORECARD.md`. Overall score remains capped until fixture discovery-to-promotion harness passes.

WC-DISC-001 note 2026-06-28: discovery API audit completed. Overall score unchanged; current blocker remains executable discovery/import lifecycle.

WC-DISC-002 note 2026-06-28: deterministic discovery fixture and harness added. Discovery/import score is now 44/100. Overall score unchanged until executable discovery/import path lands.

WC-DISC-003 note 2026-06-28: `polymarket:discover:once` added and harnessed in fixture mode. Discovery/import score is now 48/100. Overall score remains capped until draft import and validation land.

WC-DISC-004 note 2026-06-28: `polymarket:import:draft` added and harnessed in fixture dry-run mode. Discovery/import score is now 53/100. Overall score increases to 56/100 but remains capped until duplicate prevention, mapping validation, promotion, and E2E pass.

WC-DISC-005 note 2026-06-28: Duplicate prevention now covers external IDs, condition IDs, slugs, event keys, and outcome token IDs in discovery/import planning. Discovery/import score is now 55/100. Overall score unchanged until validator/promotion work lands.

WC-DISC-006 note 2026-06-28: `polymarket:mapping:validate` added with confidence scoring and lifecycle recommendations. Discovery/import score is now 64/100. Overall score increases to 57/100 but remains capped until reference sync-after-import, promotion, and E2E pass.

WC-DISC-007 note 2026-06-28: imported drafts now carry fixture reference data and pending-review reference sync is explicitly supported. Discovery/import score is now 66/100. Overall score unchanged until pricing/promotion/E2E land.

WC-DISC-008 note 2026-06-28: imported-draft two-tick pricing is harnessed through fixture snapshots. Discovery/import score is now 68/100. Overall score unchanged until promotion/E2E land.

WC-DISC-009 note 2026-06-28: `polymarket:promote:validated` dry-run guardrails are harnessed. Discovery/import score is now 75/100, reaching internal beta candidate threshold for fixture flow. Overall score increases to 58/100.

WC-DISC-010 note 2026-06-28: imported-market MM dry-run planning is harnessed for valid, stale, closed, disabled mapping, and risk-limited cases. Discovery/import score is now 77/100. Overall score unchanged until public no-leak/listing and E2E land.

WC-DISC-011 note 2026-06-28: public market/event payloads no longer expose external mapping IDs or outcome reference tokens, and event detail now filters to public listed markets. Discovery/import score is now 80/100. Overall score increases to 59/100.

WC-DISC-012 note 2026-06-28: admin review report command now summarizes mapping, confidence, reference prices, promotion eligibility, and recommended action. Discovery/import score is now 83/100.

WC-DISC-013 note 2026-06-28: discovery-to-trading fixture E2E harness now passes. Discovery/import score is now 88/100. Overall score increases to 60/100.

WC-DISC-014 note 2026-06-28: optional live discovery smoke is gated and skipped by default. Discovery/import score is now 89/100. No live API result is claimed.

WC-DISC-DB-001 note 2026-06-28: guarded DB-backed lifecycle mutation path added behind explicit local flags. Discovery/import score is now 91/100.

WC-DISC-DB-002 note 2026-06-28: local DB discovery/import/promotion E2E passed with 5 imported candidates, 2 promoted eligible markets, 3 hidden invalid markets, 5 reference snapshots, 10 dry-run MM intents, and no draft public leak. Discovery/import score is now 94/100. Overall score increases to 61/100.

WC-DISC-LIVE-001 note 2026-06-28: optional live read-only Polymarket discovery smoke passed with `fixtureMode=false`, `liveSmoke=true`, `dryRun=true`, and DB skipped. Discovery/import score is now 95/100. Overall score increases to 62/100.

WC-DISC-OPS v2 note 2026-06-28: persisted discovery candidate queue, admin review API/report, queue-backed draft import, imported-record DB mapping validation, rollback tooling, server runtime playbook, and candidate-queue E2E harness are complete. Discovery/import score is now 100/100. Overall score increases to 70/100.
