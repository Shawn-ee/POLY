# Cycle KS - Home Futures Metrics Contract

## Scope

Backend/data-contract cycle for visible Home futures volume and liquidity metrics.

This does not redesign Home. It removes frontend-invented futures metrics and keeps unavailable provider metrics visibly unknown.

## Changes

- Added mobile futures metrics service.
- Futures market liquidity now maps from backend `market.liquidity` when present.
- Futures market volume renders as unknown when backend does not provide it.
- Futures outcome volume renders as unknown instead of being calculated from probability or row rank.
- Future list metric rendering now uses the shared service instead of component-local formulas.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KS-home-futures-metrics-contract/cycle-KS-home-futures-metrics-contract.json`
- Proof script: `scripts/prove_mobile_home_futures_metrics_contract.ts`
- Mobile metrics test: `mobile/src/__tests__/futuresMetricsService.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- Provider-sourced futures volume/open-interest fields remain future backend work.
- Per-outcome futures volume remains unavailable until a provider/data model supplies it.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
