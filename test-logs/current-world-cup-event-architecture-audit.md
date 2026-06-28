# Current World Cup Event Architecture Audit

Updated: 2026-06-28

## 1. Where does the event page get its data?

- `src/app/events/[slug]/page.tsx` is the client event page.
- It loads event detail from `GET /api/events/[slug]`.
- For events with `metadata.referenceGroup`, it loads `GET /api/events/[slug]/grouped-markets`.
- Otherwise it loads sports markets from `GET /api/events/[slug]/markets`.
- World Cup event listing uses `GET /api/sports/soccer/world-cup/events`.

## 2. How are markets grouped today?

- `src/lib/worldCupMarketStructure.ts` groups raw event markets into broad sections and bundles.
- It recognizes match, qualify, goals, corners, assists, shots, player/team props, specials, and live.
- It supports spread/total/team-total line selectors.
- `src/server/services/eventGroupedMarkets.ts` is a separate reference-group path mainly for winner-style Polymarket imported groups.

## 3. Why are current groups not Polymarket-like enough?

- The page still uses raw internal market data as its primary shape.
- Price source and tradeability are not first-class per outcome.
- The grouped reference path is narrow and winner-focused.
- The sports event branch has a preview-only ticket and still routes users to market detail for real trading.
- The model does not expose diagnostics such as mapped count, stale references, bot liquidity markets, or public draft leak count.

## 4. How does the page decide price?

- `src/server/services/marketReadModel.ts` calls `getOutcomeQuotes`.
- `src/lib/orderbookPricing.ts` returns local orderbook best bid/ask and a midpoint.
- Before this refactor, missing local book quotes could fall back to `0.5`.
- Reference quote summaries come from `src/server/services/referenceQuoteSnapshots.ts`.

## 5. How does the page decide bid/ask?

- Bid/ask come from open local `Order` rows grouped by outcome.
- Reference bid/ask can be shown through `referenceSummary`, but individual outcome reference plans are not normalized into the event-page model yet.

## 6. How does the page decide tradeability?

- Market status and `referenceMetadata` review flags (`referenceOnly`, `tradable`, `mmEnabled`, `importStatus`) are serialized.
- The current event-page ticket is intentionally preview-only.
- Real order placement is still handled by market detail/orderbook routes.

## 7. Why is bot liquidity narrow?

- `BotQuoteConfig` controls which markets are MM-enabled.
- Existing dry-run/live-local scripts operate only on enabled configs.
- There is no broad safe-basket enablement command yet for 3-5 World Cup markets.

## 8. How does mapping to Polymarket work?

- Market fields store `referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, and `referenceMetadata`.
- Outcome fields store `referenceTokenId`, `referenceOutcomeLabel`, and `referenceMetadata`.
- `ReferenceQuoteSnapshot` links source/external IDs/token ID to internal market/outcome IDs.

## 9. Where are stale/ended events filtered?

- World Cup event listing currently queries events by `category=sports`, `sportKey=soccer`, and `leagueKey=world_cup`.
- Default listing does not strongly filter stale/ended events.
- Event and market statuses disable trading, but stale/ended visibility needs tightening.

## 10. Which parts need refactor vs small fixes?

Refactor:

- Add a normalized World Cup event page model.
- Refactor event UI to render tabs, family groups, lines, outcomes, source labels, and ticket state from the model.
- Add admin/runtime diagnostics and CLI status if absent.

Small fixes:

- Remove fake `0.5` price fallbacks from public market serialization.
- Label reference-only, stale, unmapped, and no-live-price states.
- Hide stale/ended fixtures from default browsing unless admin/debug.
- Add safe-basket MM tooling or document the operational gap if DB data is insufficient.

