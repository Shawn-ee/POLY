# Cycle KX - Event Detail Advance Profile Contract

## Scope

Backend/data-contract cycle for Event Detail one-team-advances/no-draw market rules.

This does not redesign Event Detail. It proves the existing slug-based Event Detail hydration path carries the backend advance profile without inventing a draw outcome.

## Changes

- Added focused route/mobile proof for a disposable backend advance-only event.
- Extended Event Detail hydration service tests to cover advance/no-draw payloads.
- Documented the route-owned advance profile contract in the mobile backend map, data gaps, gate report, and parity tracker.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KX-event-detail-advance-contract/cycle-KX-event-detail-advance-contract.json`
- Proof script: `scripts/prove_mobile_event_detail_advance_contract.ts`
- Hydration service test: `mobile/src/__tests__/eventDetailHydrationService.test.ts`
- Adapter regression test: `mobile/src/__tests__/worldCupAdapter.test.ts`
- API regression test: `mobile/src/__tests__/api.test.ts`

## Gate

Pass for focused backend/data-contract scope.

P0 result: 0 open.

P1 remaining:

- None for the focused advance/no-draw Event Detail contract.

## Notes

No schema migration was required. This cycle does not add order book, chat, live stats, deposits, withdrawals, or visual redesign.
