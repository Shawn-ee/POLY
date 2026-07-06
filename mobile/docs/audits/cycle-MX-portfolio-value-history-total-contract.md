# Cycle MX Portfolio Value History Total Contract

Date: 2026-07-06

Scope:

- Server-mode Portfolio value-history route.
- `/api/portfolio/value-history` chart point totals before visible Portfolio chart state applies.

Out of scope:

- Portfolio visual redesign.
- Deposits/withdrawals.
- Portfolio chart UI expansion.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Exact point total accepted | Pass | `docs/mobile/harness/cycle-MX-portfolio-value-history-total-contract/cycle-MX-portfolio-value-history-total-contract.json` |
| Currency tolerance accepted | Pass | MX proof `currencyToleranceAccepted=true` |
| Inconsistent total rejects | Pass | MX proof `inconsistentTotalRejects=true` |
| Negative P/L remains allowed | Pass | MX proof `negativePnlRemainsAllowed=true` |

Implementation notes:

- Portfolio value-history point `value` must equal `cash + positionsValue` within a small currency tolerance.
- `value`, `cash`, and `positionsValue` remain finite non-negative values.
- `pnl` remains a finite value and may be negative.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioValueHistoryService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_value_history_total_contract.ts`
- Full validation/gate: see latest Cycle MX validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional Portfolio value-history-specific total mismatch copy.
