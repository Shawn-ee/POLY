# Cycle NQ Portfolio Open-Order Side Contract

Date: 2026-07-06

Scope:

- Portfolio Orders open-order rows.
- `/api/portfolio` `openOrders[]` route data before visible Orders state applies.

Out of scope:

- Portfolio visual redesign.
- Open-order status and remaining-share contract, covered by Cycle NM.
- Portfolio History side mapping, covered by Cycle NO.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| BUY open order maps to buy row | Pass | `docs/mobile/harness/cycle-NQ-portfolio-open-order-side-contract/cycle-NQ-portfolio-open-order-side-contract.json` |
| SELL open order maps to sell row | Pass | NQ proof `acceptsSellSide=true` |
| Unknown open-order side is rejected | Pass | NQ proof `rejectsUnknownSide=true` |
| Missing open-order side is rejected | Pass | NQ proof `rejectsMissingSide=true` |

Implementation notes:

- `openOrders[]` rows now require `side=BUY` or `side=SELL` before becoming visible Portfolio Orders rows.
- Unknown or missing side values reject instead of silently becoming buy rows.
- Existing open-order status, price, remaining, size, and selection validation remains unchanged.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSnapshotService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_portfolio_open_order_side_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional open-order side-specific error copy.
