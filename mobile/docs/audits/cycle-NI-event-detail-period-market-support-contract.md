# Cycle NI Event Detail Period Market Support Contract

Date: 2026-07-06

Scope:

- Route-backed Event Detail first-half and second-half winner market availability.
- `/api/mobile/events/:slug/live-detail` `supportedMarketTypes` and period winner market rows.

Out of scope:

- Event Detail visual redesign.
- Order book UI.
- Sports live-stat product work.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Backend rejects undeclared period winner market rows | Pass | `docs/mobile/harness/cycle-NI-event-detail-period-market-support-contract/cycle-NI-event-detail-period-market-support-contract.json` |
| Backend accepts declared period winner market rows | Pass | NI proof `routeAcceptsDeclaredFirstHalfWinner=true` |
| Route-backed UI requires declared period and backend market | Pass | NI proof `routeBackedUiRequiresDeclaredFirstHalf=true`, `routeBackedUiRequiresBackendPeriodMarket=true` |
| Local/mock fallback remains unchanged | Pass | NI proof `localUiFallbackUnaffected=true` |

Implementation notes:

- Event Detail route validation now rejects first-half and second-half winner markets when the event does not declare that period in `supportedMarketTypes`.
- The existing route-backed Game Lines render guard is proven for period winner rows as well as line-family rows.
- Local/mock Event Detail remains able to use fallback period rows outside server-backed detail pages.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts mobile/src/__tests__/eventDetailMarketProfileService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_period_market_support_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional disabled-row copy if product wants to explain omitted backend-disabled period markets.
