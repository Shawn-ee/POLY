# Cycle JS - Search Event Route Pagination

Status: Pass for focused backend/data-contract scope.

Scope:

- Search tab event discovery in server market-data mode.
- `/api/events` search contract with compact mobile markets.
- Search "Load more" backend page append behavior.
- No visual redesign, orderbook, chat, live stats product work, deposit, or withdraw changes.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend supports paged Search results | Pass | `/api/events` accepts `search`, `limit`, and `cursor`; proof at `docs/mobile/harness/cycle-JS-search-event-pagination/cycle-JS-search-event-pagination.json`. |
| Backend Search covers visible Search text dependencies | Pass | Route predicate matches event title/description, home/away team names, market title/description, and outcome name/label; focused route test asserts the predicate shape. |
| Backend returns the shape mobile needs | Pass | Response preserves `events[]` and adds `nextCursor` plus `page.limit/page.nextCursor/page.hasMore`; compact `markets[]` are included with `includeMobileMarkets=1`. |
| Frontend sends backend Search pagination params | Pass | `PolyApi.listWorldCupEvents()` accepts `search`, `limit`, and `cursor`; mobile API test asserts query params. |
| Search Load more uses backend route in server mode | Pass | `App.tsx` stores `searchNextCursor`, calls the next backend page for the active query, and appends de-duplicated events; Search receives backend load-more controls only in server market-data mode. |
| Server-mode route failures are clear | Pass | Search shows a route error state instead of silently replacing failed backend results with frontend fixtures. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand src/__tests__/public.events.no-leak.test.ts -t "GET /api/events search matches teams, markets, and outcomes|GET /api/events supports cursor pagination"` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `npx tsx scripts/prove_mobile_search_event_pagination.ts --output=docs/mobile/harness/cycle-JS-search-event-pagination/cycle-JS-search-event-pagination.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JS"` - pass.

## Remaining P1

- Server-side Search `live`, `upcoming`, and `saved` filters. Current filters still apply to loaded backend pages.
- Dedicated Search ranking/facet metadata such as category counts, volume/liquidity ranking, and saved-state-aware discovery.
- Android Search Load more proof if visual/manual proof becomes required again.
