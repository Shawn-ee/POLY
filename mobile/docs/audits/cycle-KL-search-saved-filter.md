# Cycle KL - Search Saved Filter

## Scope

- Wire the visible Search Saved filter to backend event-id filtering in server mode.
- Reuse the existing `/api/events?eventIds=...&includeMobileMarkets=1` route contract from Cycle KK.
- Keep Search UI/layout unchanged except for passing Saved filter state up to the server query.

## Route/Data Contract

| Flow | Route | Required shape | Result |
| --- | --- | --- | --- |
| Search Saved results | `GET /api/events?search=...&eventIds=...&includeMobileMarkets=1` | `events[]`, compact `events[].markets[]`, `nextCursor`/`page.nextCursor` | Pass |
| Empty Search Saved state | App-owned empty state when no saved ids exist | No stale unfiltered route fallback | Pass |

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-KL-search-saved-filter/cycle-KL-search-saved-filter.json`
- Proof script: `scripts/prove_mobile_search_saved_filter.ts`
- Focused client test: `mobile/src/__tests__/api.test.ts`

## Gate

- P0: 0 for focused backend/data-contract scope.
- P1: first-class saved/followed market route if saved state moves beyond profile preferences.
- P2: none opened.

## Notes

- No order book, chat, live stats, deposits, withdrawals, or Portfolio visual redesign work was included.
- No schema migration was required. Saved ids still come from profile preferences.
