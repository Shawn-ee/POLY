# Cycle NM Portfolio Open-Order Status Contract

Date: 2026-07-06

Scope:

- Portfolio server-mode `openOrders` route data.
- Visible Portfolio Orders rows.

Out of scope:

- Order book UI.
- Portfolio visual redesign.
- Cancel route behavior, already covered by prior cycles.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Active open status remains renderable | Pass | `docs/mobile/harness/cycle-NM-portfolio-open-order-status-contract/cycle-NM-portfolio-open-order-status-contract.json` |
| Partial active open status remains renderable with positive remaining shares | Pass | NM proof `acceptsPartialWithPositiveRemaining=true` |
| Terminal order statuses are rejected from openOrders | Pass | NM proof `rejectsTerminalCanceledStatus=true`, `rejectsTerminalFilledStatus=true` |
| Zero-remaining openOrders rows are rejected | Pass | NM proof `rejectsZeroRemainingOpenOrder=true` |

Implementation notes:

- `/api/portfolio` open-order rows now require active statuses: `OPEN`, `PARTIAL`, `PARTIALLY_FILLED`, or `PENDING`.
- Terminal statuses such as canceled/filled/rejected/failed/expired no longer become visible Portfolio Orders rows.
- Open-order rows must have positive remaining shares; zero-remaining rows must be represented by history/activity routes instead.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSnapshotService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_open_order_status_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Portfolio Orders copy if backend sends stale terminal rows.
