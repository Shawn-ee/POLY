# Cycle MY Portfolio Position Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio snapshot route.
- `/api/portfolio` position prices before visible Portfolio position and cashout state applies.

Out of scope:

- Portfolio visual redesign.
- Deposits/withdrawals.
- New Portfolio actions or order book UI.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid position probability prices accepted | Pass | `docs/mobile/harness/cycle-MY-portfolio-position-price-bounds-contract/cycle-MY-portfolio-position-price-bounds-contract.json` |
| Large depth sizes accepted separately from prices | Pass | MY proof `largeDepthSizesAccepted=true` |
| Position prices above `1` reject | Pass | MY proof `currentPriceAboveOneRejects=true`, `avgCostAboveOneRejects=true`, `bestAskAboveOneRejects=true` |
| Negative position P/L remains allowed | Pass | MY proof `negativePnlRemainsAllowed=true` |

Implementation notes:

- Portfolio position `avgCost`, `currentPrice`, `bestBid`, and `bestAsk` are contract probability prices and must be between `0` and `1`.
- `bestBidSize` and `bestAskSize` remain depth sizes and may be greater than `1`.
- Invalid server-mode position prices reject before Portfolio rows or cashout state consume them.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/positionCloseService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_position_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle MY validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Portfolio-specific malformed price copy.
