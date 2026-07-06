# Cycle NK Cashout Status Contract

Date: 2026-07-06

Scope:

- Portfolio server-mode cashout confirmation status.
- `/api/orders` response used by full-position sell/cashout.

Out of scope:

- Portfolio visual redesign.
- Partial cashout.
- Order book UI.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Active/success cashout status still applies | Pass | `docs/mobile/harness/cycle-NK-cashout-status-contract/cycle-NK-cashout-status-contract.json` |
| Legacy missing status remains accepted with server id | Pass | NK proof `acceptsLegacyMissingStatus=true` |
| Rejected status is blocked despite returned id/full size | Pass | NK proof `rejectsNestedRejectedStatus=true` |
| Canceled/failed terminal status is blocked despite returned id/full size | Pass | NK proof `rejectsTopLevelCanceledStatus=true`, `rejectsFailedStatus=true` |

Implementation notes:

- Server-mode cashout now rejects explicit failed terminal statuses: `CANCELED`, `CANCELLED`, `REJECTED`, `FAILED`, and `EXPIRED`.
- Existing legacy responses that confirm an order id without a status remain accepted.
- Existing full-position size, current price, remaining, and fills validation remain unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseRouteShapeService.test.ts mobile/src/__tests__/positionCloseService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_cashout_status_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Portfolio-specific rejected-cashout copy.
