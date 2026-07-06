# Cycle KA - Line Selector Backend Selection Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Preserve backend live-detail `markets[].selection` through mobile normalization.
- Use backend selection identity when Event Detail Game Lines opens a line-family ticket.
- Keep deterministic line fixtures only as fallback when backend line market data is absent.

## Gate Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Backend live-detail exposes selector-ready market identity | Pass | `src/__tests__/mobile-live-event-detail.test.ts` covers selector-ready line and period switching identity. |
| Mobile adapter preserves backend selection block | Pass | `mobile/src/__tests__/worldCupAdapter.test.ts` verifies selector key, market id/group, market family, line, period, chart metadata, and outcome token metadata survive normalization. |
| Event Detail line ticket uses backend selection | Pass | `mobile/src/__tests__/eventDetailLineTicketService.test.ts` verifies selected Totals line tickets build metadata from backend `market.selection` and resolve to `backend-line-market`. |
| Harness proof records route-shaped contract | Pass | `docs/mobile/harness/cycle-KA-line-selector-backend-selection/cycle-KA-line-selector-backend-selection.json`. |
| P0 unresolved gaps | Pass | None for this focused contract scope. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/eventDetailLineTicketService.test.ts` - pass.
- `npx jest --runInBand src/__tests__/mobile-live-event-detail.test.ts` - pass.
- `npx tsc --noEmit` - pass.
- `cd mobile; npm run typecheck` - pass.
- `npx tsx scripts/prove_mobile_line_selector_backend_selection.ts --output=docs/mobile/harness/cycle-KA-line-selector-backend-selection/cycle-KA-line-selector-backend-selection.json` - pass.

## Remaining P1

- Repeat line selector identity proof against broader real-provider spread/totals/team-total families when exact provider markets are available.
- Consider immutable first-class line selection snapshots beyond `ApiOrderRequest.requestBody.selection` before production hardening.
