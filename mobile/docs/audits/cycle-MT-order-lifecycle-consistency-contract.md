# Cycle MT Order Lifecycle Consistency Contract

Date: 2026-07-06

Scope:

- Server-mode Trade Ticket submit flow.
- `/api/orders` submit confirmation lifecycle fields before visible submitted-order state applies.

Out of scope:

- Trade Ticket visual redesign.
- Order book.
- Backend matching engine changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid fill plus remaining lifecycle accepted | Pass | `docs/mobile/harness/cycle-MT-order-lifecycle-consistency-contract/cycle-MT-order-lifecycle-consistency-contract.json` |
| Open order derives zero filled size | Pass | MT proof `openOrderDerivesZeroFilledSize=true` |
| Negative lifecycle size rejects | Pass | MT proof `negativeSizeRejects=true` |
| Remaining above size rejects | Pass | MT proof `remainingAboveSizeRejects=true` |
| Fill total above size rejects | Pass | MT proof `fillsAboveSizeRejects=true` |
| Fill total plus remaining above size rejects | Pass | MT proof `fillPlusRemainingAboveSizeRejects=true` |

Implementation notes:

- Trade Ticket submit now parses server order lifecycle fields through one consistency guard.
- Returned `size`, `remaining`, and `fills[].size` must be non-negative when present.
- When order `size`, `remaining`, and/or `fills[]` are returned, lifecycle totals must not describe more shares than the order size.
- Legacy id-only confirmations remain supported by the prior order confirmation contract.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_order_lifecycle_consistency_contract.ts`
- Full validation/gate: see latest Cycle MT validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer inline order lifecycle error copy.
