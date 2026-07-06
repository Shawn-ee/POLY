# Cycle JR - Home Event List Pagination

Status: Pass for focused backend/data-contract scope.

Scope:

- Home event list in server market-data mode.
- `/api/events` pagination contract with compact mobile markets.
- Home "Load more" backend page append behavior.
- No visual redesign, Search tab backend pagination, orderbook, chat, live stats product work, deposit, or withdraw changes.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Backend supports paged Home event list | Pass | `/api/events` accepts `limit` and `cursor`; proof at `docs/mobile/harness/cycle-JR-home-event-list-pagination/cycle-JR-home-event-pagination.json`. |
| Backend returns the shape mobile needs | Pass | Response preserves `events[]` and adds `nextCursor` plus `page.limit/page.nextCursor/page.hasMore`; compact `markets[]` are still included with `includeMobileMarkets=1`. |
| Invalid cursor is rejected | Pass | Route validates cursor ids before querying the next page; focused route test covers cursor execution path. |
| Frontend sends backend pagination params | Pass | `PolyApi.listWorldCupEvents()` accepts `limit`, `cursor`, and `search`; mobile API test asserts query params. |
| Home Load more uses backend route in server mode | Pass | `App.tsx` stores `eventNextCursor`, calls the next backend page, and appends de-duplicated events; Home receives backend load-more controls only in server market-data mode. |
| Mock/local mode remains isolated | Pass | Mock market-data mode keeps the existing fixture behavior and does not call backend pagination. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand src/__tests__/public.events.no-leak.test.ts -t "GET /api/events returns event summaries|GET /api/events can include mobile compact markets|GET /api/events supports cursor pagination"` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsc --noEmit` - pass.
- `npx tsx scripts/prove_mobile_home_event_pagination.ts --output=docs/mobile/harness/cycle-JR-home-event-list-pagination/cycle-JR-home-event-pagination.json` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle JR"` - pass.

## Remaining P1

- Server-side pagination for Home `live` and `today` filters. Current filtering still applies to loaded pages.
- Search tab backend pagination.
- Android Load more proof if visual/manual proof becomes required again.
