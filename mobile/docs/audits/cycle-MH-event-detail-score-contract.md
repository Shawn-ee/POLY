# Cycle MH Event Detail Score Contract

Date: 2026-07-06

Scope:

- Event Detail route payloads used by the game page.
- Visible home/away score fields before frontend Event Detail state applies.

Out of scope:

- Event Detail visual polish.
- Market rendering, line groups, or ticket behavior.
- Provider live-score freshness semantics.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid non-negative live scores accepted | Pass | `docs/mobile/harness/cycle-MH-event-detail-score-contract/cycle-MH-event-detail-score-contract.json` |
| Null scores accepted for pre-match/unknown state | Pass | MH proof `nullScoresAcceptedForPreMatchOrUnknown=true` |
| Negative home score rejects before visible apply | Pass | MH proof `negativeHomeScoreRejects=true` |
| Negative away score rejects before visible apply | Pass | MH proof `negativeAwayScoreRejects=true` |

Implementation notes:

- Event Detail route validation now requires `homeScore` and `awayScore` to be finite non-negative numbers when present.
- `null` and omitted scores remain allowed for pre-match or unknown score state.
- Negative score payloads now reject before route-backed Event Detail state can render impossible match scores.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts mobile/src/__tests__/eventDetailHydrationService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_score_contract.ts`
- Full validation/gate: see latest Cycle MH validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Event Detail score-specific error copy.
