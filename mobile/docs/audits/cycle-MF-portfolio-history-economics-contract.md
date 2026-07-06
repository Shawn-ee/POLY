# Cycle MF Portfolio History Economics Contract

Date: 2026-07-06

Scope:

- Portfolio activity/history data from `/api/portfolio/history`.
- Visible resolved history, recent trade, and canceled order economics before activity state applies.

Out of scope:

- Portfolio visual redesign.
- Deposits/withdrawals.
- New history filters.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid history economics apply | Pass | `docs/mobile/harness/cycle-MF-portfolio-history-economics-contract/cycle-MF-portfolio-history-economics-contract.json` |
| Negative resolved payout rejects before visible apply | Pass | MF proof `negativeWinningsRejects=true` |
| Negative trade shares reject before visible apply | Pass | MF proof `negativeTradeSharesRejects=true` |
| Negative trade cost rejects before visible apply | Pass | MF proof `negativeTradeCostRejects=true` |
| Negative canceled-order economics reject before visible apply | Pass | MF proof `negativeCanceledOrderPriceRejects=true` |
| Negative realized P/L remains allowed | Pass | MF proof `negativeRealizedPnlRemainsAllowed=true` |

Implementation notes:

- Resolved history `winningsTokens`, `refundsTokens`, and `netInvestedTokens` must be finite non-negative values.
- Recent trade `shares` and `cost` must be finite non-negative values.
- Canceled order `remaining` and `price` must be finite non-negative values.
- `realizedPnLTokens` may remain negative because the visible activity row amount is derived from payout or net invested, not realized P/L.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioHistoryService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_history_economics_contract.ts`
- Full validation/gate: see latest Cycle MF validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific Portfolio history error copy.
