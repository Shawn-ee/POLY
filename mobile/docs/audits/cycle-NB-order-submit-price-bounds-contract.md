# Cycle NB Order Submit Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode Trade Ticket submit.
- `/api/orders` request price and size derivation before calling the backend.

Out of scope:

- Trade Ticket visual redesign.
- Order book UI.
- Backend matching behavior after a valid order request is accepted.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid Yes contract price accepted | Pass | `docs/mobile/harness/cycle-NB-order-submit-price-bounds-contract/cycle-NB-order-submit-price-bounds-contract.json` |
| Valid inverse No price accepted | Pass | NB proof `validNoInversePriceAccepted=true` |
| Zero Yes price blocked before API | Pass | NB proof `zeroYesPriceRejectsBeforeApi=true` |
| Above-one Yes price blocked before API | Pass | NB proof `aboveOneYesPriceRejectsBeforeApi=true` |
| Zero No price blocked before API | Pass | NB proof `zeroNoPriceRejectsBeforeApi=true` |

Implementation notes:

- Trade Ticket submit computes contract probability once and requires it to be finite and between `1` and `100` cents.
- The request `price`, request `size`, and returned local probability use the same validated probability.
- Invalid computed prices reject before `/api/orders` is called.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_order_submit_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle NB validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Trade Ticket-specific invalid-price copy.
