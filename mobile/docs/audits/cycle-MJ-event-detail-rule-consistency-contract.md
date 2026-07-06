# Cycle MJ Event Detail Rule Consistency Contract

Date: 2026-07-06

Scope:

- Event Detail route payloads used by the game page.
- Backend-owned `resultMode`, `gameRules.allowDraw`, `marketProfile`, and `supportedMarketTypes` consistency before frontend Event Detail state applies.

Out of scope:

- Event Detail visual polish.
- New market families or provider breadth.
- Changing backend game-rule semantics.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid regulation/draw rules accepted | Pass | `docs/mobile/harness/cycle-MJ-event-detail-rule-consistency-contract/cycle-MJ-event-detail-rule-consistency-contract.json` |
| Valid advance/no-draw rules accepted | Pass | MJ proof `validAdvanceRulesAccepted=true` |
| `can_draw` with `allowDraw=false` rejects before visible apply | Pass | MJ proof `canDrawButDisallowedRejects=true` |
| `no_draw` with `allowDraw=true` rejects before visible apply | Pass | MJ proof `noDrawButAllowedRejects=true` |
| Market profile missing from supported market types rejects before visible apply | Pass | MJ proof `unsupportedMarketProfileRejects=true` |

Implementation notes:

- Event Detail route validation now requires `resultMode` and `gameRules.allowDraw` to agree when both are present.
- When `supportedMarketTypes` and `marketProfile` are both present, the selected profile must be listed as supported.
- Contradictory backend rule payloads now reject before frontend market selectors can guess the game structure.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts mobile/src/__tests__/eventDetailHydrationService.test.ts mobile/src/__tests__/eventDetailMarketProfileService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_rule_consistency_contract.ts`
- Full validation/gate: see latest Cycle MJ validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Event Detail rule-specific error copy.
