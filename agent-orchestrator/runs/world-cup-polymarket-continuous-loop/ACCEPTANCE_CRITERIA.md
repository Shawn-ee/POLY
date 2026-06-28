# World Cup Polymarket Continuous Loop Acceptance Criteria

Updated: 2026-06-28

The loop is complete only when reviewer and auditor verdicts are `MERGE READY`, validation passes, and no blocker-before-merge remains.

| # | Criterion | Required Evidence | Status |
|---:|---|---|---|
| 1 | World Cup event page uses normalized Polymarket-style model | `worldCupEventPageModel.ts`, API/UI integration | PENDING_REVIEW |
| 2 | Structure is event -> tabs/categories -> market families -> line selector -> outcomes -> trade ticket | UI source plus browser/screenshot evidence | PENDING_REVIEW |
| 3 | Moneyline/Match Winner family works | model tests and seeded/browser evidence | PENDING_REVIEW |
| 4 | Draw No Bet works if data exists | model support or documented no data | PENDING_REVIEW |
| 5 | Spread/Handicap line selector works if data exists | model tests/browser evidence | PENDING_REVIEW |
| 6 | Total Goals line selector works if data exists | model tests/browser evidence | PENDING_REVIEW |
| 7 | Both Teams To Score works if data exists | model tests/browser evidence | PENDING_REVIEW |
| 8 | Team Total or Team Props work if data exists | model support or documented no data | PENDING_REVIEW |
| 9 | Empty/unavailable families hidden or clearly disabled | UI/model tests | PENDING_REVIEW |
| 10 | No fake 50% placeholders | serialization/model tests and reviewer scan | PENDING_REVIEW |
| 11 | No unexplained `-- / --` | UI source/browser evidence | PENDING_REVIEW |
| 12 | Price source hierarchy works | model tests | PENDING_REVIEW |
| 13 | Trade ticket updates from selected outcome and selected line | Playwright/DOM evidence or blocker | PENDING_REVIEW |
| 14 | Trade ticket explains disabled reason | model/UI tests | PENDING_REVIEW |
| 15 | Internal tradeability only for safe local/internal markets | model/runtime guards | PENDING_REVIEW |
| 16 | Stale/ended fixtures hidden or disabled clearly | API/model tests | PENDING_REVIEW |
| 17 | Event slug/mapping diagnostics exist | UI/runtime status | PENDING_REVIEW |
| 18 | `/admin/runtime` shows runtime health/safety flags | API/page/tests | PENDING_REVIEW |
| 19 | `runtime:closed-beta:status` gives CLI monitoring | script/build evidence | PENDING_REVIEW |
| 20 | Safe-basket MM identifies 3-5 eligible markets or proves why not | planner tests/CLI evidence | PENDING_REVIEW |
| 21 | Safe-basket MM does not create external orders | source/test evidence | PENDING_REVIEW |
| 22 | MM remains local-only | source/test evidence | PENDING_REVIEW |
| 23 | No real money/deposit/withdrawal/wallet/private-key path enabled | safety scan | PENDING_REVIEW |
| 24 | Build passes | validation report | PENDING_REVIEW |
| 25 | Relevant Jest tests pass | validation report | PENDING_REVIEW |
| 26 | UI/screenshot/Playwright verification exists or blocker documented | validation report | PENDING_REVIEW |
| 27 | Deployment handoff exists | docs path | PENDING_REVIEW |
| 28 | Server Codex deployment prompt exists | docs path | PENDING_REVIEW |
| 29 | Final report honestly lists remaining gaps | final report | PENDING_REVIEW |
| 30 | Reviewer/auditor verdict is `MERGE READY` or `OWNER DECISION REQUIRED` | cycle reports | PENDING_REVIEW |

Stop states:

- `LOOP COMPLETE - MERGE READY`
- `LOOP BLOCKED - OWNER DECISION REQUIRED`
- `LOOP NOT COMPLETE - CONTINUATION REQUIRED`
- `LOOP STOPPED - CRITICAL SAFETY ISSUE`
