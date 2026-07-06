# Cycle MU Portfolio Open Order Lifecycle Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio snapshot route.
- `/api/portfolio` open-order size and remaining fields before visible Orders state applies.

Out of scope:

- Portfolio visual redesign.
- Cancel route behavior.
- Backend matching engine changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Partial open order accepted | Pass | `docs/mobile/harness/cycle-MU-portfolio-open-order-lifecycle-contract/cycle-MU-portfolio-open-order-lifecycle-contract.json` |
| Remaining equal to original size accepted | Pass | MU proof `equalRemainingOpenOrderAccepted=true` |
| Remaining above original size rejects | Pass | MU proof `remainingAboveSizeRejects=true` |

Implementation notes:

- Portfolio snapshot open-order `price`, `size`, and `remaining` are parsed once before visible order rows are created.
- Open orders now reject `remaining > size` before Portfolio state applies.
- `orderValue`, `remaining`, `remainingShares`, and `originalShares` now reuse the same validated lifecycle numbers.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSnapshotService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_open_order_lifecycle_contract.ts`
- Full validation/gate: see latest Cycle MU validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific Portfolio open-order lifecycle error copy.
