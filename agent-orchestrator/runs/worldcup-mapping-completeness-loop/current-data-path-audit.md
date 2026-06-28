# World Cup Mapping Completeness Data-Path Audit

Timestamp: 2026-06-28T17:20:00-05:00

## Findings

1. User-facing World Cup event browsing comes from `src/app/api/sports/soccer/world-cup/events/route.ts`, consumed by `src/app/sports/soccer/world-cup/page.tsx` through `SportsEventsPage`.
2. User-facing World Cup event markets come from `src/app/api/events/[slug]/world-cup-model/route.ts`, which serializes public/listed markets and passes them into `buildWorldCupEventPageModel`.
3. Valid Polymarket mapping is represented by `Market.referenceSource=polymarket`, approved review metadata (`importStatus=approved`, `referenceOnly=true`), and fresh `ReferenceQuoteSnapshot` rows.
4. Draft/admin-only state is represented by private/unlisted markets and review metadata such as `importStatus=pending_review` or `rejected`.
5. Stale/ended events are inferred from event status strings and start-time age. The model already marks events stale after start + 6 hours.
6. Fresh reference price is represented by `ReferenceQuoteSnapshot` and the public-safe `referenceSummary` returned by `serializeMarketReadModel`.
7. Local bot book is represented by best bid/ask values from `getOutcomeQuotes`.
8. Unmapped/no-price markets could appear because `buildWorldCupEventPageModel` previously filtered only hidden stale markets, then rendered `unmapped` / `no_live_price` states as normal groups.
9. Zero-eligible events could appear because the World Cup list endpoint previously returned every event by league without checking approved mapping and fresh reference data.
10. Safe-basket MM previously treated non-null reference metadata as mapped, which was weaker than approved Polymarket mapping.

## Enforcement Points

- Canonical eligibility: `src/lib/sports/worldCupMarketEligibility.ts`.
- User-facing event model: `src/lib/sports/worldCupEventPageModel.ts`.
- World Cup browsing: `src/app/api/sports/soccer/world-cup/events/route.ts`.
- MM safe basket: `src/server/services/polymarketMmSafeBasket.ts`.
- Admin/runtime diagnostics: `src/server/services/closedBetaRuntimeStatus.ts` and `/admin/runtime`.
- Read-only CLI audit: `npm run worldcup:mapping:audit`.

## Bad Case: Japan vs Sweden

The historical fixture appears in seed/import scripts as `Japan vs Sweden`. If it has no approved Polymarket mapping or no fresh reference snapshot, the new gate excludes it from default World Cup browsing and from normal event-page groups. Admin/runtime and `worldcup:mapping:audit` expose the hidden reason instead.
