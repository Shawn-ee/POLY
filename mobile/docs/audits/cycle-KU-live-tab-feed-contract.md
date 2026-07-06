# Cycle KU - Live Tab Feed Contract

## Scope

Backend/data-contract cycle for the visible Live tab event feed.

This does not redesign Live. It makes server-mode Live request backend live events directly instead of depending on the Home feed's currently loaded page.

## Changes

- Added mobile Live event feed service.
- Live tab server mode now calls `/api/events` with `statusGroup=live`.
- Live tab server mode normalizes compact backend event/market data through the shared World Cup adapter.
- Server order mode applies ticket quote hydration to the returned live markets.
- Mock/offline mode keeps local fixture filtering.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KU-live-tab-feed-contract/cycle-KU-live-tab-feed-contract.json`
- Proof script: `scripts/prove_mobile_live_tab_feed_contract.ts`
- Mobile feed test: `mobile/src/__tests__/liveEventFeedService.test.ts`
- API regression test: `mobile/src/__tests__/api.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- None for the focused Live tab feed contract.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
