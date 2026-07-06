# Cycle KT - Home Event Metrics Contract

## Scope

Backend/data-contract cycle for visible Home game-card volume and liquidity metrics.

This does not redesign Home. It removes frontend-invented Home game-card metrics and keeps unavailable backend metrics visibly unknown.

## Changes

- Added mobile Home event-card metrics service.
- Home game-card volume now maps from backend `events[].metrics.volume24h`.
- Home game-card liquidity now maps from backend `events[].metrics.liquidity`.
- Backend `null` metric values remain unknown instead of converting to false zero.
- Home game-card metric rendering now uses the shared service instead of component-local formulas.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KT-home-event-metrics-contract/cycle-KT-home-event-metrics-contract.json`
- Proof script: `scripts/prove_mobile_home_event_metrics_contract.ts`
- Mobile metrics test: `mobile/src/__tests__/eventCardMetricsService.test.ts`
- Regression metrics test: `mobile/src/__tests__/futuresMetricsService.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- Provider-sourced 24h volume/open-interest fields remain future backend work if product requires them.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
