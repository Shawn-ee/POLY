# Cycle MA Portfolio Value History Route Shape Contract

Date: 2026-07-06

Scope:

- Portfolio value chart route payload from `/api/portfolio/value-history`.
- Requested range, route metadata, empty state, and point value shape before visible Portfolio chart state applies.

Out of scope:

- Portfolio visual redesign.
- Deposits/withdrawals.
- Portfolio chart UI expansion.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid requested-range value history applies | Pass | `docs/mobile/harness/cycle-MA-portfolio-value-history-route-shape-contract/cycle-MA-portfolio-value-history-route-shape-contract.json` |
| Wrong range rejects before visible apply | Pass | MA proof `wrongRangeRejects=true` |
| Missing generatedAt rejects before visible apply | Pass | MA proof `missingGeneratedAtRejects=true` |
| Invalid empty state rejects before visible apply | Pass | MA proof `invalidEmptyStateRejects=true` |
| Negative value/cash/positions value rejects before visible apply | Pass | MA proof `negativeValueFieldRejects=true` |

Implementation notes:

- `loadPortfolioValueHistory` now requires the response range to match the requested range.
- Route metadata `generatedAt`, nullable `lastUpdated`, and `emptyState` are validated.
- `value`, `cash`, and `positionsValue` must be finite non-negative numbers. `pnl` remains allowed to be negative.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioValueHistoryService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_value_history_route_shape_contract.ts`
- Full validation/gate: see latest Cycle MA validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Portfolio value-history-specific retry/error copy.
