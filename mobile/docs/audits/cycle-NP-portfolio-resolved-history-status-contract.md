# Cycle NP Portfolio Resolved-History Status Contract

Date: 2026-07-06

Scope:

- Portfolio History resolved market rows.
- `/api/portfolio/history` `history[]` route data before visible closed activity state applies.

Out of scope:

- Portfolio visual redesign.
- Recent trade side mapping, covered by Cycle NO.
- Canceled order status and size mapping, covered by Cycle NN.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Terminal resolved status maps to closed activity | Pass | `docs/mobile/harness/cycle-NP-portfolio-resolved-history-status-contract/cycle-NP-portfolio-resolved-history-status-contract.json` |
| CLOSED/SETTLED/FINAL terminal aliases map to closed activity | Pass | NP proof `acceptsClosedStatus=true`, `acceptsSettledStatus=true`, `acceptsFinalStatus=true` |
| LIVE/ACTIVE/OPEN statuses are rejected | Pass | NP proof `rejectsLiveStatus=true`, `rejectsActiveStatus=true`, `rejectsOpenStatus=true` |

Implementation notes:

- `history[]` rows now require terminal market status before becoming visible closed Portfolio History activity.
- Allowed terminal statuses are `RESOLVED`, `CLOSED`, `SETTLED`, and `FINAL`.
- Existing economics, timestamp, recent trade, and canceled-order validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioHistoryService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_resolved_history_status_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional terminal-status-specific Portfolio History error copy.
