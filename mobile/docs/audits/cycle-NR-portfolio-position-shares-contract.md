# Cycle NR Portfolio Position Shares Contract

Date: 2026-07-06

Scope:

- Portfolio visible position rows.
- `/api/portfolio` `positions[]` route data before visible Portfolio state applies.

Out of scope:

- Portfolio visual redesign.
- Open Orders tab contracts.
- Cashout confirmation route status, covered by earlier cashout cycles.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Positive-share position maps to visible row | Pass | `docs/mobile/harness/cycle-NR-portfolio-position-shares-contract/cycle-NR-portfolio-position-shares-contract.json` |
| Empty positions array remains valid | Pass | NR proof `keepsEmptyPositionsRenderable=true` |
| Zero-share position is rejected | Pass | NR proof `rejectsZeroShares=true` |
| Negative-share position is rejected | Pass | NR proof `rejectsNegativeShares=true` |

Implementation notes:

- `positions[]` rows now require positive `shares` before becoming visible Portfolio position rows.
- Empty `positions: []` remains valid for new or flat accounts.
- Existing position price, economics, selection, and availability validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSnapshotService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_position_shares_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional zero-position-specific Portfolio row copy if backend sends omitted rows as warnings later.
