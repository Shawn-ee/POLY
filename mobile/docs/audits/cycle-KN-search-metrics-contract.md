# Cycle KN - Search Metrics Contract

## Scope

Backend/data-contract cycle for visible Search event row metrics.

The goal was to remove frontend-invented row numbers and make server mode consume backend-owned event metrics from `/api/events?includeMobileMarkets=1`.

## Changes

- Added `events[].metrics` to the mobile compact event-list route response.
- Aggregated real compact-market liquidity from serialized market read models when orderbook depth exists.
- Kept unavailable 24h volume and comment/activity counts as `null` instead of generating fake values.
- Mapped backend metrics through mobile event normalization.
- Updated Search rows to remove synthetic volume, today, liquidity, and chat counts.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KN-search-metrics-contract/cycle-KN-search-metrics-contract.json`
- Proof script: `scripts/prove_mobile_search_metrics_contract.ts`
- Backend route test: `src/__tests__/public.events.no-leak.test.ts`
- Mobile adapter test: `mobile/src/__tests__/worldCupAdapter.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- Real 24h volume can be added when a backend/provider source exists.
- Real comment/activity counts can be added if they become a product requirement. No chat UI/count was introduced in this cycle.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposit, withdraw, or visual redesign work.
