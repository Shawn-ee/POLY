# Cycle KQ - Home Futures Contract

## Scope

Backend/data-contract cycle for visible Home futures discovery.

This does not redesign Home. It wires server mode to backend-filtered World Cup futures markets and keeps the existing local futures only as a mock/offline fallback.

## Changes

- Added `/api/events` support for `marketType=future`.
- Backend event filtering now accepts futures/outrights aliases and includes only listed public matching compact markets.
- Added mobile API support for `listWorldCupEvents({ marketType: "future" })`.
- Server-mode Home loads futures from `/api/events?includeMobileMarkets=1&marketType=future`.
- Mobile normalization now classifies backend World Cup Winner/future markets as `type=future`.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KQ-home-futures-contract/cycle-KQ-home-futures-contract.json`
- Proof script: `scripts/prove_mobile_home_futures_contract.ts`
- Backend route test: `src/__tests__/public.events.no-leak.test.ts`
- Mobile API test: `mobile/src/__tests__/api.test.ts`
- Mobile adapter test: `mobile/src/__tests__/worldCupAdapter.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- Fuller production futures catalog breadth remains provider/data ingestion work.
- Provider-backed futures chart/history metrics remain future work.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
