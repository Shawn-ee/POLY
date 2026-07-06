# Cycle KY - Event Detail Mixed Profile Contract

## Scope

Backend/data-contract cycle for mixed knockout Event Detail market rules.

This covers the case where a game has a two-way advance/no-draw primary market and a separate regulation 90-minute winner market with Home/Tie/Away in Game Lines.

## Changes

- Mobile now preserves backend `to_advance` as a first-class game-line market type instead of normalizing it to `prop`.
- Added Event Detail market-profile selector service.
- Event Detail primary outcome buttons prefer backend `to_advance` for advance/full-match profiles.
- Event Detail regulation Game Lines use a separate backend regulation winner market when one exists.
- Pure advance markets are not reused as fake regulation Game Lines.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KY-event-detail-mixed-profile-contract/cycle-KY-event-detail-mixed-profile-contract.json`
- Proof script: `scripts/prove_mobile_event_detail_mixed_profile_contract.ts`
- Market-profile selector test: `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`
- Hydration service test: `mobile/src/__tests__/eventDetailHydrationService.test.ts`
- Adapter regression test: `mobile/src/__tests__/worldCupAdapter.test.ts`
- API regression test: `mobile/src/__tests__/api.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- None for the focused mixed-profile Event Detail contract.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
