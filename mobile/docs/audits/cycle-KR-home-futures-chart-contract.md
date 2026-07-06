# Cycle KR - Home Futures Chart Contract

## Scope

Backend/data-contract cycle for visible Home futures chart and range controls.

This does not redesign Home. It keeps the existing chart surface and wires server mode to backend chart history for current futures markets.

## Changes

- Added `1H` support to `/api/markets/:marketId/chart`.
- Extracted a chart serializer used by the route and harness proof.
- Added mobile futures chart service for loading and mapping route chart history.
- Server-mode Home loads `/api/markets/:id/chart?range=<selected>` for current futures market ids.
- Futures chart harness labels now expose route `chart-status`, `chart-source`, `chart-range`, and point count.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KR-home-futures-chart-contract/cycle-KR-home-futures-chart-contract.json`
- Proof script: `scripts/prove_mobile_home_futures_chart_contract.ts`
- Backend route test: `src/__tests__/public.market-chart.no-leak.test.ts`
- Mobile chart service test: `mobile/src/__tests__/futuresChartService.test.ts`
- Mobile API test: `mobile/src/__tests__/api.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- Provider-backed futures volume/open-interest metrics remain future work.
- Production breadth depends on snapshot coverage for each visible futures market.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
