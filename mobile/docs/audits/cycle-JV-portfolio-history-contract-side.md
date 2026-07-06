# Cycle JV - Portfolio History Contract-Side Snapshot

Status: Pass for focused backend/data-contract scope.

Scope:

- Portfolio canceled orders and recent trades in server mode.
- `/api/portfolio/history` snapshot contract for `selection.contractSide`.
- Mobile Portfolio history/activity mapping for visible No-contract rows.
- No Portfolio visual redesign, deposits, withdrawals, orderbook, chat, or live stats product work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend returns canceled-order contract side | Pass | Route proof at `docs/mobile/harness/cycle-JV-portfolio-history-contract-side/cycle-JV-portfolio-history-contract-side.json` verifies a No-side canceled order returns `selection.contractSide=no`. |
| Backend returns recent-trade contract side | Pass | Route proof verifies a No-side recent trade returns `selection.contractSide=no`, provider token metadata, and limit metadata. |
| Route uses real server auth path | Pass | Proof reads `/api/portfolio/history` with a canonical API key scoped to `account:read`. |
| Mobile history mapper preserves contract side | Pass | `mobile/src/__tests__/portfolioHistoryService.test.ts` verifies `contractSide=no` survives canceled-order and recent-trade activity mapping. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioHistoryService.test.ts` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `npx tsx scripts/prove_mobile_portfolio_history_contract_side.ts --output=docs/mobile/harness/cycle-JV-portfolio-history-contract-side/cycle-JV-portfolio-history-contract-side.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JV"` - pass.

## Remaining P1

- First-class immutable `Order.selection` and `Trade.selection` or fill snapshot columns remain future hardening.
- Broader resolved-history economics proof remains separate from this focused activity contract-side cycle.
- Android Portfolio proof if visual/manual proof becomes required again.
