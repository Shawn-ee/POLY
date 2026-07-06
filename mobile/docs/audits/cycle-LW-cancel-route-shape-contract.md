# Cycle LW Cancel Route Shape Contract

Date: 2026-07-06

Scope:

- Portfolio open-order cancel confirmation from `DELETE /api/orders/:id`.
- Server-mode cancel response validation before visible Portfolio state treats the cancel as confirmed.

Out of scope:

- Portfolio visual redesign.
- Order book.
- Chat.
- Live stats as a sports-stat product.
- Cancel lifecycle breadth beyond the response contract.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Same-order `CANCELED` response confirms server cancel | Pass | `docs/mobile/harness/cycle-LW-cancel-route-shape-contract/cycle-LW-cancel-route-shape-contract.json` |
| Wrong-order cancel response rejects before visible confirm | Pass | LW proof `wrongOrderRejected=true` |
| Non-canceled status rejects before visible confirm | Pass | LW proof `nonCanceledStatusRejected=true` |
| Malformed payload rejects before visible confirm | Pass | LW proof `malformedPayloadRejected=true` |

Implementation notes:

- `assertCancelOrderRoutePayloadShape` validates cancel payload identity and terminal cancel status.
- `cancelOpenOrderOnServer` calls the validator after `api.cancelOrder(order.id)` and preserves the existing user-facing failure message.
- Server-mode Portfolio still avoids optimistic cancel state until backend confirmation succeeds.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/cancelOrderRouteShapeService.test.ts mobile/src/__tests__/openOrderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cancel_route_shape_contract.ts`
- Full validation/gate: see latest Cycle LW validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer inline cancel-race copy if an order fills/cancels before tap processing.
