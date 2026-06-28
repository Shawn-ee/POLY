# World Cup Mapping Completeness Acceptance Criteria

Status: ACTIVE

The loop is complete only when reviewer and auditor both return `MERGE READY`, validation passes, and no blocker-before-merge remains.

| # | Criterion | Status |
|---:|---|---|
| 1 | Canonical World Cup market eligibility model exists | PENDING |
| 2 | User-facing World Cup markets require valid Polymarket mapping | PENDING |
| 3 | User-facing World Cup events require at least one eligible mapped market | PENDING |
| 4 | Unmapped markets are hidden from normal user-facing pages | PENDING |
| 5 | Unmapped markets remain visible in admin/debug with reason | PENDING |
| 6 | Mapped markets without fresh reference are hidden or admin/debug only by default | PENDING |
| 7 | Fresh reference markets can show reference-only state | PENDING |
| 8 | Local bot book markets show bid/ask | PENDING |
| 9 | No fake 50 | PENDING |
| 10 | No unexplained `-- / --` | PENDING |
| 11 | No normal user-facing empty No live price / No local book rows for unmapped markets | PENDING |
| 12 | Event with zero eligible markets is hidden from browsing | PENDING |
| 13 | Stale/ended events are hidden or disabled | PENDING |
| 14 | MM safe basket only selects mapped/fresh/active markets | PENDING |
| 15 | MM remains local-only | PENDING |
| 16 | Real money/deposit/withdrawal/wallet/private-key/external-fund paths remain disabled | PENDING |
| 17 | Mapping audit CLI exists and runs | PENDING |
| 18 | Admin/runtime or admin mapping page shows hidden counts and reasons | PENDING |
| 19 | Tests cover eligibility, model/API, browsing, MM, and admin diagnostics | PENDING |
| 20 | Build passes | PENDING |
| 21 | Reviewer/auditor verdict is MERGE READY or OWNER DECISION REQUIRED | PENDING |
| 22 | Server deployment handoff and server Codex prompt exist | PENDING |

Stop states:

- `LOOP COMPLETE - MERGE READY`
- `LOOP BLOCKED - OWNER DECISION REQUIRED`
- `LOOP NOT COMPLETE - CONTINUATION REQUIRED`
- `LOOP STOPPED - CRITICAL SAFETY ISSUE`
