# Cycle LP - Order Response Numeric Contract

Gate status: Pass

## Scope

- Validate numeric lifecycle fields from server order submit responses before visible order state is applied.
- Keep legacy id-only server confirmations accepted.
- Reject malformed `size`, `remaining`, and `fills[].size` values when the backend includes them.
- Keep scope to Trade Ticket order response data; no ticket visual redesign or orderbook work.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LP-order-response-numeric-contract/cycle-LP-order-response-numeric-contract.json`
- Proof script: `scripts/prove_mobile_order_response_numeric_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/orderService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Id-only confirmations remain accepted | Pass | Backward-compatible route responses with only order id still create server result. |
| Valid lifecycle fields are applied | Pass | Valid `size`, `remaining`, and `fills[].size` map to visible size/fill state. |
| Malformed order size rejects | Pass | Invalid `order.size` throws before visible order state is applied. |
| Malformed fill size rejects | Pass | Invalid `fills[].size` throws before visible order state is applied. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused order response numeric contract.
- Remaining P1/P2: richer inline submit error copy remains optional.
