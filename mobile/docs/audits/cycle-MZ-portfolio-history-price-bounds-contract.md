# Cycle MZ Portfolio History Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio history/activity route.
- `/api/portfolio/history` canceled order and recent trade prices before visible Portfolio History state applies.

Out of scope:

- Portfolio visual redesign.
- Deposits/withdrawals.
- New history filters or activity types.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid history activity prices accepted | Pass | `docs/mobile/harness/cycle-MZ-portfolio-history-price-bounds-contract/cycle-MZ-portfolio-history-price-bounds-contract.json` |
| Price `1` accepted | Pass | MZ proof `priceOneAccepted=true` |
| Canceled order price above `1` rejects | Pass | MZ proof `canceledOrderPriceAboveOneRejects=true` |
| Recent trade execution price above `1` rejects | Pass | MZ proof `recentTradeExecutionPriceAboveOneRejects=true` |
| Nonzero cost without shares rejects | Pass | MZ proof `nonzeroCostWithoutSharesRejects=true` |
| Negative resolved P/L remains allowed | Pass | MZ proof `negativeResolvedPnlRemainsAllowed=true` |

Implementation notes:

- Canceled order `price` is a contract probability price and must be between `0` and `1`.
- Recent trade execution price is derived from `cost / shares` and must be between `0` and `1`.
- A recent trade with zero shares and nonzero cost is rejected before visible activity state applies.
- Resolved-market negative realized P/L remains allowed.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioHistoryService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_history_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle MZ validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Portfolio History-specific malformed price copy.
