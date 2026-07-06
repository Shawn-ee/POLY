# Cycle NW Trade Ticket Order Amount Contract

Date: 2026-07-06

Scope:

- Trade Ticket order submit.
- `/api/orders` request preparation before server-mode submit.

Out of scope:

- Visual redesign.
- Cashout layout.
- Order book.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Positive finite amount can submit | Pass | `docs/mobile/harness/cycle-NW-order-amount-contract/cycle-NW-order-amount-contract.json` |
| Zero and negative amounts are rejected before API call | Pass | NW proof `rejectsZeroAmount=true`, `rejectsNegativeAmount=true` |
| `NaN` and infinite amounts are rejected before API call | Pass | NW proof `rejectsNaNAmount=true`, `rejectsInfiniteAmount=true` |

Implementation notes:

- Trade Ticket submit now requires `amount` to be finite and greater than zero.
- Invalid amounts reject before deriving order `size` or calling `/api/orders`.
- Existing price, market availability, selected-line echo, lifecycle, and status validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_order_amount_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional ticket-specific amount error copy.
