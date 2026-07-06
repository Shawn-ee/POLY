# Cycle MN Event Detail Required Rules Contract

Date: 2026-07-06

Scope:

- Event Detail route payloads used by the game page.
- Required backend-owned game-rule fields before frontend Event Detail state applies.

Out of scope:

- Event Detail visual polish.
- New market families or provider breadth.
- Changing backend game-rule semantics.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid regulation/draw rules accepted | Pass | `docs/mobile/harness/cycle-MN-event-detail-required-rules-contract/cycle-MN-event-detail-required-rules-contract.json` |
| Valid advance/no-draw rules accepted | Pass | MN proof `validAdvanceRulesAccepted=true` |
| Missing `marketProfile` rejects before visible apply | Pass | MN proof `missingMarketProfileRejects=true` |
| Missing `resultMode` rejects before visible apply | Pass | MN proof `missingResultModeRejects=true` |
| Missing `gameRules` rejects before visible apply | Pass | MN proof `missingGameRulesRejects=true` |
| Missing `supportedMarketTypes` rejects before visible apply | Pass | MN proof `missingSupportedMarketTypesRejects=true` |

Implementation notes:

- Event Detail route validation now requires `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes`.
- Missing backend rule fields reject before frontend market selectors can infer game structure.
- Existing consistency checks from Cycle MJ still apply after required-field validation.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts mobile/src/__tests__/eventDetailHydrationService.test.ts mobile/src/__tests__/eventDetailMarketProfileService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_required_rules_contract.ts`
- Full validation/gate: see latest Cycle MN validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Event Detail missing-rule-field error copy.
