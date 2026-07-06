# Cycle LN - Mobile Saved Event Identity Filter Contract

Gate status: Pass

## Scope

- Ensure Home/Search Saved filters work when mobile saves normalized event identity.
- Backend `/api/events?eventIds=...` must accept both database event ids and event slugs.
- Keep scope to saved event filtering; no new saved/followed product, UI redesign, orderbook, chat, or deposit/withdraw work.

## Evidence

- Harness proof: `docs/mobile/harness/cycle-LN-mobile-saved-event-identity-filter-contract/cycle-LN-mobile-saved-event-identity-filter-contract.json`
- Proof script: `scripts/prove_mobile_saved_event_identity_filter_contract.ts`
- Backend tests:
  - `src/__tests__/public.events.no-leak.test.ts`

## Results

| Requirement | Result | Notes |
| --- | --- | --- |
| Empty saved filter does not constrain route | Pass | Empty saved state remains handled locally by mobile. |
| Saved filter matches database ids | Pass | `eventIds` is matched against `Event.id`. |
| Saved filter matches mobile slugs | Pass | `eventIds` is also matched against `Event.slug`. |
| Same saved values are used for both identities | Pass | Backend applies one OR filter across id and slug. |

## Decision

- Pass/fail: Pass.
- Unresolved P0 gaps: 0 for focused saved event identity filter contract.
- Remaining P1/P2: first-class saved/followed market route remains optional if saved state outgrows profile preferences.
