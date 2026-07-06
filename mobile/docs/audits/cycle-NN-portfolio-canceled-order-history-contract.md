# Cycle NN Portfolio Canceled-Order History Contract

Date: 2026-07-06

Scope:

- Portfolio History canceled-order rows.
- `/api/portfolio/history` `canceledOrders` route data before visible activity state applies.

Out of scope:

- Portfolio visual redesign.
- Open Orders tab state, covered by Cycle NM.
- Cancel route confirmation, covered by earlier cancel cycles.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| CANCELED status maps to canceled activity | Pass | `docs/mobile/harness/cycle-NN-portfolio-canceled-order-history-contract/cycle-NN-portfolio-canceled-order-history-contract.json` |
| Non-canceled statuses are rejected | Pass | NN proof `rejectsOpenStatus=true`, `rejectsFilledStatus=true` |
| Remaining shares cannot exceed original size | Pass | NN proof `rejectsRemainingAboveSize=true` |
| Negative canceled-order size is rejected | Pass | NN proof `rejectsNegativeSize=true` |

Implementation notes:

- `canceledOrders` rows now require `status=CANCELED` before becoming visible Portfolio History activity.
- Canceled-order `size` is validated as non-negative, and `remaining <= size` is enforced.
- Existing price and selection validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioHistoryService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_canceled_order_history_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional history-row copy if backend sends malformed canceled-order rows.
