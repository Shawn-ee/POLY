# Cycle JT - Search Status Filter Backend Wiring

Status: Pass for focused backend/data-contract scope.

Scope:

- Search tab `Live` and `Upcoming` filters in server market-data mode.
- `/api/events` `statusGroup=live|upcoming` contract with compact mobile markets.
- Search filtered page append behavior.
- No visual redesign, orderbook, chat, live stats product work, deposit, or withdraw changes.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend supports Live Search filter | Pass | `/api/events` accepts `statusGroup=live`; proof at `docs/mobile/harness/cycle-JT-search-status-filters/cycle-JT-search-status-filters.json`. |
| Backend supports Upcoming Search filter | Pass | `/api/events` accepts `statusGroup=upcoming` and excludes live rows; proof at `docs/mobile/harness/cycle-JT-search-status-filters/cycle-JT-search-status-filters.json`. |
| Search filter keeps query and compact markets | Pass | Proof calls include `search`, `statusGroup`, `limit`, and `includeMobileMarkets=1`; returned events include compact markets. |
| Frontend sends backend status filter params | Pass | `PolyApi.listWorldCupEvents()` accepts `statusGroup`; mobile API test asserts the query param. |
| Visible Search filters use backend route in server mode | Pass | `SearchScreen` reports Live/Upcoming selection to `App.tsx`; server mode reloads Search from the backend with the active `statusGroup` and appends filtered cursor pages. |
| Mock/local mode remains isolated | Pass | Mock market-data mode keeps the existing local Search filtering and does not call backend status-group pagination. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand src/__tests__/public.events.no-leak.test.ts -t "GET /api/events supports mobile Search statusGroup filters|GET /api/events search matches teams, markets, and outcomes"` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `npx tsx scripts/prove_mobile_search_status_filters.ts --output=docs/mobile/harness/cycle-JT-search-status-filters/cycle-JT-search-status-filters.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JT"` - pass.

## Remaining P1

- Server-side Saved filter integration. Saved state is still local/profile-driven and applied to loaded backend Search rows.
- Dedicated Search ranking/facet metadata such as category counts, volume/liquidity ranking, and saved-state-aware discovery.
- Android Search filter proof if visual/manual proof becomes required again.
