# Cycle KW - Event Detail Hydration Key Contract

## Scope

Backend/data-contract cycle for Event Detail hydration from visible discovery cards.

This does not redesign Event Detail. It makes server-mode card-open hydration explicitly use the backend event slug required by `/api/mobile/events/:slug/live-detail`.

## Changes

- Mobile normalized event summaries now preserve backend `slug` as `event.backendSlug`.
- Added Event Detail hydration service with a slug-first route key.
- `openEventDetail` now hydrates server-mode card opens through that service.
- Hydrated Event Detail still preserves backend-provided market rules before local fallback derivation.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KW-event-detail-hydration-contract/cycle-KW-event-detail-hydration-contract.json`
- Proof script: `scripts/prove_mobile_event_detail_hydration_contract.ts`
- Hydration service test: `mobile/src/__tests__/eventDetailHydrationService.test.ts`
- Adapter regression test: `mobile/src/__tests__/worldCupAdapter.test.ts`
- API regression test: `mobile/src/__tests__/api.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- None for the focused Event Detail hydration key/rules contract.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
