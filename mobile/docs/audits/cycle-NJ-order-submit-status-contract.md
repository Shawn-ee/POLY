# Cycle NJ Order Submit Status Contract

Date: 2026-07-06

Scope:

- Trade Ticket server-mode `/api/orders` submit confirmation status.
- Visible submitted-order state before Portfolio/open-order refresh.

Out of scope:

- Order book UI.
- Cashout flow.
- Portfolio visual redesign.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Active/success order status still applies | Pass | `docs/mobile/harness/cycle-NJ-order-submit-status-contract/cycle-NJ-order-submit-status-contract.json` |
| Legacy missing status remains accepted with server id | Pass | NJ proof `acceptsLegacyMissingStatus=true` |
| Rejected status is blocked despite returned id | Pass | NJ proof `rejectsNestedRejectedStatus=true` |
| Canceled/failed terminal status is blocked despite returned id | Pass | NJ proof `rejectsTopLevelCanceledStatus=true`, `rejectsFailedStatus=true` |

Implementation notes:

- Server-mode Trade Ticket submit now rejects explicit failed terminal statuses: `CANCELED`, `CANCELLED`, `REJECTED`, `FAILED`, and `EXPIRED`.
- Existing legacy responses that confirm an order id without a status remain accepted.
- Existing order price, size, lifecycle, availability, and selection-echo validation remain unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_order_submit_status_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Trade Ticket-specific rejected-status copy.
