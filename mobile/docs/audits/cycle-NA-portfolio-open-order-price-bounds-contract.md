# Cycle NA Portfolio Open-Order Price Bounds Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio snapshot route.
- `/api/portfolio` open-order prices before visible Orders rows and cancel activity state apply.

Out of scope:

- Portfolio visual redesign.
- Order book UI.
- New cancel interactions.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid open-order price accepted | Pass | `docs/mobile/harness/cycle-NA-portfolio-open-order-price-bounds-contract/cycle-NA-portfolio-open-order-price-bounds-contract.json` |
| Price `1` accepted while share sizes remain large | Pass | NA proof `priceOneAccepted=true` |
| Price above `1` rejects | Pass | NA proof `openOrderPriceAboveOneRejects=true` |
| Negative price rejects | Pass | NA proof `negativeOpenOrderPriceRejects=true` |
| Remaining above size still rejects | Pass | NA proof `remainingAboveSizeStillRejects=true` |

Implementation notes:

- Open-order `price` is a contract probability price and must be between `0` and `1`.
- Open-order `size` and `remaining` remain share counts and may be greater than `1`.
- Invalid server-mode open-order prices reject before Portfolio Orders rows or cancel activity consume them.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/openOrderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_open_order_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle NA validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Portfolio Orders-specific malformed price copy.
