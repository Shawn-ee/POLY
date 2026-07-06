# Cycle KV - Live Tab Pagination Contract

## Scope

Backend/data-contract cycle for visible Live tab cursor pagination.

This does not redesign Live. It adds a backend-driven load-more path when the `/api/events` live feed returns `nextCursor`.

## Changes

- Live feed service now accepts a backend cursor and sends it with `statusGroup=live`.
- Live tab server mode stores route `nextCursor`.
- Live tab shows load-more only when the backend returns another page.
- Load-more appends unique returned live events instead of replacing the first page.
- Mock/offline mode keeps local fixture filtering.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KV-live-tab-pagination-contract/cycle-KV-live-tab-pagination-contract.json`
- Proof script: `scripts/prove_mobile_live_tab_pagination_contract.ts`
- Mobile feed test: `mobile/src/__tests__/liveEventFeedService.test.ts`
- API regression test: `mobile/src/__tests__/api.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- None for the focused Live tab pagination contract.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
