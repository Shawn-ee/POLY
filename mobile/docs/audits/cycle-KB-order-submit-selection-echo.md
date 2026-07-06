# Cycle KB - Order Submit Selection Echo Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Require `/api/orders` server responses to confirm selected line/provider ticket identity.
- Block fake success when a server response confirms only an order id but omits or mutates critical `selection` fields.
- Keep mock-mode ticket submit unchanged.

## Gate Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Matching backend selection echo is accepted | Pass | `docs/mobile/harness/cycle-KB-order-submit-selection-echo/cycle-KB-order-submit-selection-echo.json`. |
| Missing backend selection echo is blocked | Pass | Focused mobile test and proof expect `Order submit did not confirm the selected market line.` |
| Changed provider token is blocked | Pass | Focused mobile test and proof expect `Order submit changed selected market line (referenceTokenId).` |
| Normal simple ticket submit remains supported | Pass | `mobile/src/__tests__/orderService.test.ts`. |
| P0 unresolved gaps | Pass | None for this focused contract scope. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts` - pass.
- `npx tsc --noEmit` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsx scripts/prove_mobile_order_submit_selection_echo.ts --output=docs/mobile/harness/cycle-KB-order-submit-selection-echo/cycle-KB-order-submit-selection-echo.json` - pass.

## Remaining P1

- Repeat against full production route breadth for every selected line/provider path.
- Add immutable first-class selection snapshot columns for orders/fills/trades before production hardening.
