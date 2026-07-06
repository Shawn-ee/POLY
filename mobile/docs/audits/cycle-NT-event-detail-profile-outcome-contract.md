# Cycle NT Event Detail Profile Outcome Contract

Date: 2026-07-06

Scope:

- Event Detail primary profile markets.
- `/api/mobile/events/:slug/live-detail` profile outcome structure before visible Event Detail markets apply.

Out of scope:

- Visual redesign.
- Order book, chat, and live stats.
- Line-family availability, covered by earlier Event Detail cycles.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Regulation 90 market includes draw outcome | Pass | `docs/mobile/harness/cycle-NT-event-detail-profile-outcome-contract/cycle-NT-event-detail-profile-outcome-contract.json` |
| Regulation 90 market without draw is rejected | Pass | NT proof `rejectsRegulationWithoutDraw=true` |
| Advance/no-draw market accepts two team outcomes | Pass | NT proof `acceptsAdvanceNoDraw=true` |
| Advance/no-draw market with draw is rejected | Pass | NT proof `rejectsAdvanceWithDraw=true` |

Implementation notes:

- Route-backed `regulation_90` markets now require a draw outcome before visible Event Detail state applies.
- Route-backed `to_advance` and `full_match_with_overtime` markets reject draw outcomes and require two team outcomes.
- Existing game-rule, supported-market-type, line-family, period, quote, and depth validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_profile_outcome_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional disabled-market copy when backend omits profile outcome rows.
