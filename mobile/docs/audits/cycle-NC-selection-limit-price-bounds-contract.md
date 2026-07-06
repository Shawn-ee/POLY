# Cycle NC Selection Limit Price Bounds Contract

Date: 2026-07-06

Scope:

- Shared selected-market snapshot parser.
- `/api/orders` order selection echo.
- `/api/portfolio` position/open-order selection snapshots.
- `/api/portfolio/history` canceled/recent activity selection snapshots.

Out of scope:

- Portfolio visual redesign.
- Order book UI.
- New line-market families.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Limit price `1` accepted | Pass | `docs/mobile/harness/cycle-NC-selection-limit-price-bounds-contract/cycle-NC-selection-limit-price-bounds-contract.json` |
| Large limit shares accepted | Pass | NC proof `validLimitPriceOneAccepted=true` |
| Portfolio snapshot rejects above-one limit price | Pass | NC proof `portfolioSnapshotLimitPriceAboveOneRejects=true` |
| Portfolio history rejects above-one limit price | Pass | NC proof `portfolioHistoryLimitPriceAboveOneRejects=true` |
| Order selection echo rejects above-one limit price | Pass | NC proof `orderEchoLimitPriceAboveOneRejects=true` |

Implementation notes:

- Selection `limitPrice` is a contract probability price and must be between `0` and `1`.
- Selection `limitShares` remains a share size and may be greater than `1`.
- The shared parser enforces the rule before visible Portfolio, History, or submitted-order state consumes backend selection snapshots.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSelectionService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts mobile/src/__tests__/orderService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_selection_limit_price_bounds_contract.ts`
- Full validation/gate: see latest Cycle NC validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional selected-market snapshot-specific malformed price copy.
