# Cycle NU Event Detail Profile Rules Contract

Date: 2026-07-06

Scope:

- Event Detail backend-owned profile fields.
- `/api/mobile/events/:slug/live-detail` `marketProfile`, `resultMode`, and `gameRules` before visible Event Detail state applies.

Out of scope:

- Visual redesign.
- Order book, chat, and live stats.
- Profile outcome row count, covered by Cycle NT.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Regulation 90 profile is draw-capable and excludes overtime | Pass | `docs/mobile/harness/cycle-NU-event-detail-profile-rules-contract/cycle-NU-event-detail-profile-rules-contract.json` |
| Regulation profile with overtime is rejected | Pass | NU proof `rejectsRegulationWithOvertime=true` |
| Advance profile is no-draw and includes overtime/advancement semantics | Pass | NU proof `acceptsAdvanceNoDrawOvertime=true` |
| Advance profile that can draw is rejected | Pass | NU proof `rejectsAdvanceCanDraw=true` |
| Full-match overtime profile without overtime is rejected | Pass | NU proof `rejectsFullMatchWithoutOvertime=true` |

Implementation notes:

- `regulation_90` now requires `resultMode=can_draw`, `gameRules.allowDraw=true`, and `gameRules.includesOvertime=false`.
- `to_advance` and `full_match_with_overtime` now require `resultMode=no_draw`, `gameRules.allowDraw=false`, and `gameRules.includesOvertime=true`.
- Existing supported-market, outcome, line-family, period, quote, and depth validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_profile_rules_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional event-rule-specific error copy.
