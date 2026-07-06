# Cycle JU - Portfolio Contract-Side Snapshot

Status: Pass for focused backend/data-contract scope.

Scope:

- Portfolio positions and open orders in server mode.
- `/api/portfolio` snapshot contract for `selection.contractSide`.
- Mobile Portfolio snapshot mapping for visible No-contract rows.
- No Portfolio visual redesign, deposits, withdrawals, orderbook, chat, or live stats product work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend returns position contract side | Pass | Route proof at `docs/mobile/harness/cycle-JU-portfolio-contract-side-snapshot/cycle-JU-portfolio-contract-side-snapshot.json` verifies a No-side position returns `selection.contractSide=no`. |
| Backend returns open-order contract side | Pass | Route proof verifies a No-side open order returns `selection.contractSide=no`, limit metadata, and provider token metadata. |
| Route uses real server auth path | Pass | Proof reads `/api/portfolio` with a canonical API key scoped to `account:read`. |
| Mobile data contract includes contract side | Pass | `mobile/src/types.ts` now includes `contractSide` on Portfolio selection payloads. |
| Mobile mapper preserves contract side | Pass | `mobile/src/__tests__/portfolioSnapshotService.test.ts` verifies `contractSide=no` survives positions and open orders. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSnapshotService.test.ts` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `npx tsx scripts/prove_mobile_portfolio_contract_side_snapshot.ts --output=docs/mobile/harness/cycle-JU-portfolio-contract-side-snapshot/cycle-JU-portfolio-contract-side-snapshot.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JU"` - pass.

## Remaining P1

- First-class immutable `Position.selection` and `Order.selection` columns remain future hardening.
- Resolved history and canceled-order breadth should be handled in a separate Portfolio/history cycle.
- Android Portfolio proof if visual/manual proof becomes required again.
