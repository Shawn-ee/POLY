# Cycle KP - Portfolio Value History Contract

## Scope

Backend/data-contract cycle for Portfolio value-history route wiring.

This does not redesign Portfolio. It wires server mode to the existing `/api/portfolio/value-history` route and exposes a compact auditable route-source marker in the current Portfolio layout.

## Changes

- Added mobile types for portfolio value history.
- Added `PolyApi.getPortfolioValueHistory(range)`.
- Added `loadPortfolioValueHistory()` validation service.
- Server-mode Portfolio sync now loads `/api/portfolio/value-history?range=1D`.
- Portfolio exposes source, status, range, point count, and latest value in a compact route-backed row.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KP-portfolio-value-history-contract/cycle-KP-portfolio-value-history-contract.json`
- Proof script: `scripts/prove_mobile_portfolio_value_history_contract.ts`
- Backend route test: `src/__tests__/portfolio.value-history.route.test.ts`
- Mobile API test: `mobile/src/__tests__/api.test.ts`
- Mobile validation test: `mobile/src/__tests__/portfolioValueHistoryService.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- Richer Portfolio chart/range controls remain future visual work.
- Provider breadth depends on `MarketOutcomeSnapshot` coverage for every visible held position.

## Notes

No schema migration was required. This cycle does not add deposits, withdrawals, order book, chat, live stats, or Portfolio visual redesign.
