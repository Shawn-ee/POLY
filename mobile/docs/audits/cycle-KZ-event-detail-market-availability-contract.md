# Cycle KZ - Event Detail Market Availability Contract

## Scope

Backend/data-contract cycle for route-backed Event Detail Game Lines availability.

This prevents route-backed Event Detail from inventing line-family sections when the backend live-detail route does not provide those markets.

## Changes

- Added route-backed line-family availability gating.
- Spread, Totals, Team Total, First Half, and Second Half sections require matching backend markets for route-backed events.
- Local/offline fixtures without `backendSlug` keep deterministic synthetic rows.
- Added proof for a backend event with only advance and regulation winner markets.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KZ-event-detail-market-availability-contract/cycle-KZ-event-detail-market-availability-contract.json`
- Proof script: `scripts/prove_mobile_event_detail_market_availability_contract.ts`
- Market-profile selector test: `mobile/src/__tests__/eventDetailMarketProfileService.test.ts`
- Hydration service test: `mobile/src/__tests__/eventDetailHydrationService.test.ts`
- Adapter regression test: `mobile/src/__tests__/worldCupAdapter.test.ts`
- API regression test: `mobile/src/__tests__/api.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- None for the focused Event Detail market availability contract.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
