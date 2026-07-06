# Cycle ME Portfolio Snapshot Economics Contract

Date: 2026-07-06

Scope:

- Portfolio snapshot route data from `/api/portfolio`.
- Visible Portfolio wallet, position, and open-order economics before state applies.

Out of scope:

- Portfolio visual redesign.
- Deposit/withdraw.
- New Portfolio chart behavior.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Valid non-negative snapshot applies | Pass | `docs/mobile/harness/cycle-ME-portfolio-snapshot-economics-contract/cycle-ME-portfolio-snapshot-economics-contract.json` |
| Negative wallet balance rejects before visible apply | Pass | ME proof `negativeWalletRejects=true` |
| Negative shares reject before visible apply | Pass | ME proof `negativeSharesRejects=true` |
| Negative current value rejects before visible apply | Pass | ME proof `negativeCurrentValueRejects=true` |
| Negative open-order economics reject before visible apply | Pass | ME proof `negativeOpenOrderPriceRejects=true` |
| Negative position P/L remains allowed | Pass | ME proof `negativePnlRemainsAllowed=true` |

Implementation notes:

- `/api/portfolio` `walletAvailableUSDC`, position cost basis, average cost, shares, current price, and current value must be finite non-negative values.
- Open-order price, remaining shares, and original shares must be finite non-negative values.
- `pnlTokens` remains a finite number and may be negative.
- Existing optional depth bid/ask values still degrade to `null` when absent or malformed.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSnapshotService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_snapshot_economics_contract.ts`
- Full validation/gate: see latest Cycle ME validation run before commit.

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional field-specific Portfolio snapshot error copy.
