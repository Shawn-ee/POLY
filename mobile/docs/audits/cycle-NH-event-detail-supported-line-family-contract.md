# Cycle NH Event Detail Supported Line Family Contract

Date: 2026-07-06

Scope:

- Route-backed Event Detail Game Lines market-family availability.
- `/api/mobile/events/:slug/live-detail` `supportedMarketTypes` and line market rows.

Out of scope:

- Event Detail visual redesign.
- Order book UI.
- New market families.

Gate criteria:

| Criterion | Result | Evidence |
| --- | --- | --- |
| Backend rejects undeclared line-family market rows | Pass | `docs/mobile/harness/cycle-NH-event-detail-supported-line-family-contract/cycle-NH-event-detail-supported-line-family-contract.json` |
| Backend accepts declared line-family market rows | Pass | NH proof `routeAcceptsDeclaredLineFamily=true` |
| Route-backed UI requires declared family and backend market | Pass | NH proof `routeBackedUiRequiresDeclaredLineFamily=true`, `routeBackedUiRequiresBackendMarket=true` |
| Local/mock fallback remains unchanged | Pass | NH proof `localUiFallbackUnaffected=true` |

Implementation notes:

- Event Detail route validation now rejects spread, totals, or team-total markets when the event does not declare that family in `supportedMarketTypes`.
- Route-backed Game Lines render guards now require both a backend market and the matching backend-declared market family.
- First-half and second-half winner rows also require the matching route-backed backend support before rendering.

Validation:

- Focused tests: `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/eventDetailRouteShapeService.test.ts mobile/src/__tests__/eventDetailMarketProfileService.test.ts mobile/src/__tests__/eventDetailLineAvailabilityService.test.ts`
- Proof: `npx tsx scripts/prove_mobile_event_detail_supported_line_family_contract.ts`

Decision:

- Pass for focused backend/data-contract scope.
- P2 remaining: optional disabled-row copy if product wants to explain omitted backend-disabled market families.
