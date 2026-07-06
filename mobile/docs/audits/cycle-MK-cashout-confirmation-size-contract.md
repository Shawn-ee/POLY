# Cycle MK Cashout Confirmation Size Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio cashout/sell-all flow.
- `/api/orders` cashout confirmation size before Portfolio refresh treats the close as accepted.

Out of scope:

- Portfolio visual redesign.
- Partial cashout.
- Backend matching engine changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Matching full-position confirmation size accepted | Pass | `docs/mobile/harness/cycle-MK-cashout-confirmation-size-contract/cycle-MK-cashout-confirmation-size-contract.json` |
| Legacy id-only confirmation remains accepted | Pass | MK proof `legacyIdOnlyConfirmationAccepted=true` |
| Smaller confirmed size rejects before Portfolio refresh | Pass | MK proof `smallerConfirmedSizeRejects=true` |
| Larger confirmed size rejects before Portfolio refresh | Pass | MK proof `largerConfirmedSizeRejects=true` |

Implementation notes:

- Server-mode cashout still submits sell-all using the visible `position.shares`.
- Cashout confirmation validation now receives the requested full-position size.
- If the backend response includes `order.size` or top-level `size`, it must match the requested full-position size.
- Id-only confirmations remain compatible because prior route contracts allow legacy minimal confirmations.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseRouteShapeService.test.ts mobile/src/__tests__/positionCloseService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_confirmation_size_contract.ts`
- Full validation/gate: see latest Cycle MK validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer cashout confirmation mismatch copy.
