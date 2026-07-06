# Cycle LJ - Cancel No Optimistic Server Contract

Gate status: Pass

## Scope

- Keep mock-mode open-order cancel optimistic.
- Prevent server-mode cancel from removing visible open orders or adding canceled activity before backend confirmation.
- Keep existing backend confirmation guard for `DELETE /api/orders/:id`.
- Keep scope to backend/data correctness, not Portfolio visual redesign.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LJ-cancel-no-optimistic-server-contract/cycle-LJ-cancel-no-optimistic-server-contract.json`
- Proof script: `scripts/prove_mobile_cancel_no_optimistic_server_contract.ts`
- Mobile tests:
  - `mobile/src/__tests__/openOrderService.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Mock cancel can remain optimistic | Pass | `shouldApplyOptimisticCancel("mock")=true`. |
| Server cancel is not optimistic | Pass | `shouldApplyOptimisticCancel("server")=false`. |
| Server cancel requires same canceled order confirmation | Pass | Malformed/non-canceled response rejects. |
| Failed server cancel does not create fake canceled UI state | Pass | App no longer removes open order/appends activity before server confirmation. |
| Confirmed server cancel can refresh Portfolio/history | Pass | Existing confirmed path calls refresh after cancel confirmation. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused server cancel optimism contract.
- Remaining P1/P2: richer inline cancel-race copy if an order fills/cancels before tap processing.
