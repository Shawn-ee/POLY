# Cycle MR Cashout Fill Plus Remaining Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio cashout/sell-all flow.
- `/api/orders` cashout confirmation lifecycle totals before Portfolio refresh treats the close as accepted.

Out of scope:

- Portfolio visual redesign.
- Partial cashout.
- Backend matching engine changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Partial fill plus remaining under/equal to size accepted | Pass | `docs/mobile/harness/cycle-MR-cashout-fill-remaining-contract/cycle-MR-cashout-fill-remaining-contract.json` |
| Full fill plus zero remaining accepted | Pass | MR proof `fullFillPlusZeroRemainingAccepted=true` |
| Nested fill plus remaining above size rejects | Pass | MR proof `nestedFillPlusRemainingAboveSizeRejects=true` |
| Top-level fill plus remaining above size rejects | Pass | MR proof `topLevelFillPlusRemainingAboveSizeRejects=true` |

Implementation notes:

- Cashout confirmation validation now sums returned `fills[].size` values when fills are present.
- When order `size`, `remaining`, and `fills[]` are all returned, `filled + remaining` must not exceed order `size`.
- Existing requested-size, remaining-size, and fill-size validations continue to apply.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseRouteShapeService.test.ts mobile/src/__tests__/positionCloseService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_fill_remaining_contract.ts`
- Full validation/gate: see latest Cycle MR validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer cashout lifecycle mismatch copy.
