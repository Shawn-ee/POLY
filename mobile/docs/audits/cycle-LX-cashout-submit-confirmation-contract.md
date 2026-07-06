# Cycle LX Cashout Submit Confirmation Contract

Date: 2026-07-06

Scope:

- Portfolio/Event Detail server-mode cashout submit through `/api/orders`.
- Sell-all cashout response confirmation before visible Portfolio refresh treats the close as accepted.
- Preserve Cycle LA no-position/zero-share frontend guard and backend oversell safety.

Out of scope:

- Portfolio visual redesign.
- Partial cashout.
- Order book.
- Chat.
- Live stats as a sports-stat product.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid sell-all cashout confirmation is accepted | Pass | `docs/mobile/harness/cycle-LX-cashout-submit-confirmation-contract/cycle-LX-cashout-submit-confirmation-contract.json` |
| Cashout uses full held shares | Pass | LX proof `closeUsesFullHeldShares=true` |
| Zero-share cashout rejects before submit | Pass | LX proof `zeroShareCashoutRejectedBeforeSubmit=true` |
| Missing order confirmation rejects before Portfolio refresh | Pass | LX proof `missingOrderConfirmationRejected=true` |
| Malformed order lifecycle numbers reject before Portfolio refresh | Pass | LX proof `malformedOrderNumberRejected=true` |

Implementation notes:

- `assertPositionCloseOrderResponseShape` validates cashout order submit response identity and optional numeric lifecycle fields.
- `closePositionOnServer` now requires `/api/orders` to return nested `order.id` or top-level `id` before resolving.
- Malformed `size`, `remaining`, or `fills[].size` fields reject instead of allowing the visible cashout path to continue.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseRouteShapeService.test.ts mobile/src/__tests__/positionCloseService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_submit_confirmation_contract.ts`
- Full validation/gate: see latest Cycle LX validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer cashout submit error copy.
