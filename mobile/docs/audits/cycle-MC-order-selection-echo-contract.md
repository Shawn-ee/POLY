# Cycle MC Order Selection Echo Contract

Date: 2026-07-06

Scope:

- Trade Ticket server-mode order submit through `/api/orders`.
- Backend selection echo validation before visible submitted-order state applies.

Out of scope:

- Trade Ticket visual redesign.
- Order book.
- Chat or live stats.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Legacy id-only submit confirmation remains accepted | Pass | `docs/mobile/harness/cycle-MC-order-selection-echo-contract/cycle-MC-order-selection-echo-contract.json` |
| Valid future selection echo is preserved | Pass | MC proof `validFutureSelectionEchoPreserved=true` |
| Valid line-market selection echo is preserved | Pass | MC proof `validLineSelectionEchoPreserved=true` |
| Malformed future selection echo rejects before visible apply | Pass | MC proof `malformedFutureEchoRejects=true` |
| Malformed line selection echo rejects before visible apply | Pass | MC proof `malformedLineEchoRejects=true` |

Implementation notes:

- `/api/orders` selection echoes now pass through the shared selection validator before mobile accepts them.
- Id-only legacy confirmations remain allowed and use the request selection already built by mobile.
- Line-market submits still require a backend echo and still reject changed critical line/provider fields.
- Malformed echoed labels, market types, contract sides, limit sides, and limit numbers reject before visible submitted-order state applies.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSelectionService.test.ts mobile/src/__tests__/orderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_order_selection_echo_contract.ts`
- Full validation/gate: see latest Cycle MC validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional route-specific Trade Ticket order selection error copy.
