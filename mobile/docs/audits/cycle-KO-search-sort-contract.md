# Cycle KO - Search Sort Contract

## Scope

Backend/data-contract cycle for the visible Search `Popular` and `Live first` sort controls.

The goal was to stop server-mode Search from sorting only the currently loaded client page and instead request backend-sorted event pages from `/api/events`.

## Changes

- Added `sortBy=popular|live` support to `/api/events?includeMobileMarkets=1`.
- Added backend-owned sorted paging for mobile Search route responses.
- Added `page.sortBy` metadata to the mobile event-list response.
- Added `PolyApi.listWorldCupEvents({ sortBy })`.
- Lifted Search sort state into `App` so server-mode Search reloads the route when sort changes.
- Kept mock mode local sorting unchanged.
- Stopped Search from re-sorting server-mode route results on-device.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KO-search-sort-contract/cycle-KO-search-sort-contract.json`
- Proof script: `scripts/prove_mobile_search_sort_contract.ts`
- Backend route test: `src/__tests__/public.events.no-leak.test.ts`
- Mobile API test: `mobile/src/__tests__/api.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- Popular sort currently uses backend-owned active/listed market counts, liquidity, and recency tiebreaks.
- Provider-backed 24h volume/open-interest ranking remains future work if those metrics become product requirements.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposit, withdraw, or visual redesign work.
