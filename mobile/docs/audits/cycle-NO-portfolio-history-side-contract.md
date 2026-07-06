# Cycle NO Portfolio History Side Contract

Date: 2026-07-06

Scope:

- Portfolio History recent trade rows.
- Portfolio History canceled-order rows.
- `/api/portfolio/history` `recentTrades` and `canceledOrders` route data before visible activity state applies.

Out of scope:

- Portfolio visual redesign.
- Open Orders tab state.
- Cancel route confirmation.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Recent trade BUY maps to opened activity | Pass | `docs/mobile/harness/cycle-NO-portfolio-history-side-contract/cycle-NO-portfolio-history-side-contract.json` |
| Recent trade SELL maps to sold activity | Pass | NO proof `acceptsRecentTradeSellSide=true` |
| Unknown recent trade side is rejected | Pass | NO proof `rejectsRecentTradeUnknownSide=true` |
| Canceled order BUY/SELL sides map explicitly | Pass | NO proof `acceptsCanceledOrderBuySide=true`, `acceptsCanceledOrderSellSide=true` |
| Unknown canceled order side is rejected | Pass | NO proof `rejectsCanceledOrderUnknownSide=true` |

Implementation notes:

- `recentTrades` and `canceledOrders` rows now require route side values to be `BUY` or `SELL`.
- Unknown side values reject before becoming visible Portfolio History activity.
- Existing economics, price, status, and selection validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioHistoryService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_history_side_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional side-specific Portfolio History error copy.
