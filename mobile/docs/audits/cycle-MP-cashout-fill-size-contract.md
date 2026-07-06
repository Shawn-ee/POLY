# Cycle MP Cashout Fill Size Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio cashout/sell-all flow.
- `/api/orders` cashout confirmation fill totals before Portfolio refresh treats the close as accepted.

Out of scope:

- Portfolio visual redesign.
- Partial cashout.
- Backend matching engine changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Partial fill total under size accepted | Pass | `docs/mobile/harness/cycle-MP-cashout-fill-size-contract/cycle-MP-cashout-fill-size-contract.json` |
| Full fill total equal to size accepted | Pass | MP proof `fullFillTotalAccepted=true` |
| Nested fill total above size rejects before Portfolio refresh | Pass | MP proof `nestedFillTotalAboveSizeRejects=true` |
| Top-level fill total above size rejects before Portfolio refresh | Pass | MP proof `topLevelFillTotalAboveSizeRejects=true` |

Implementation notes:

- Cashout confirmation validation now sums returned `fills[].size` values.
- When order `size` is returned, total filled size must not exceed order size.
- Existing numeric, requested-size, and remaining-size validations continue to apply.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseRouteShapeService.test.ts mobile/src/__tests__/positionCloseService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_fill_size_contract.ts`
- Full validation/gate: see latest Cycle MP validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer cashout fill mismatch copy.
