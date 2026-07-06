# Cycle MO Cashout Remaining Size Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio cashout/sell-all flow.
- `/api/orders` cashout confirmation lifecycle numbers before Portfolio refresh treats the close as accepted.

Out of scope:

- Portfolio visual redesign.
- Partial cashout.
- Backend matching engine changes.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Equal remaining and size accepted | Pass | `docs/mobile/harness/cycle-MO-cashout-remaining-size-contract/cycle-MO-cashout-remaining-size-contract.json` |
| Lower remaining than size accepted | Pass | MO proof `lowerRemainingAccepted=true` |
| Nested remaining above size rejects before Portfolio refresh | Pass | MO proof `remainingAboveSizeRejects=true` |
| Top-level remaining above size rejects before Portfolio refresh | Pass | MO proof `topLevelRemainingAboveSizeRejects=true` |

Implementation notes:

- Cashout confirmation validation now checks `remaining <= size` when both values are returned.
- The check applies to nested `order.size`/`order.remaining` and legacy top-level `size`/`remaining`.
- Malformed lifecycle numbers still reject through the existing numeric guard.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseRouteShapeService.test.ts mobile/src/__tests__/positionCloseService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_remaining_size_contract.ts`
- Full validation/gate: see latest Cycle MO validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional richer cashout lifecycle mismatch copy.
