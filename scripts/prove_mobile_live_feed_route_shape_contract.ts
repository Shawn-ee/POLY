import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { loadLiveEventFeed } from "../mobile/src/services/liveEventFeedService";

const CYCLE = "cycle-LQ-live-feed-route-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const liveFeedPayload = () => ({
  events: [
    {
      id: "live-event-id",
      slug: "live-mexico-ecuador",
      title: "Mexico vs Ecuador",
      description: "Live match",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      homeTeamName: "Mexico",
      awayTeamName: "Ecuador",
      startTime: new Date().toISOString(),
      status: "live",
      liveStatus: "in_progress",
      period: "2H",
      clock: "67:10",
      homeScore: 1,
      awayScore: 1,
      marketCount: 1,
      activeMarketCount: 1,
      metrics: {
        source: "event-route-mobile-markets",
        marketCount: 1,
        activeMarketCount: 1,
        liquidity: null,
        volume24h: null,
        commentCount: null,
      },
      markets: [
        {
          id: "winner-market",
          title: "Match Winner",
          description: null,
          status: "LIVE",
          marketGroupTitle: "Match Winner",
          marketType: "winner",
          propCategory: null,
          outcomes: [
            { id: "mexico", name: "Mexico", label: "Mexico", side: "home", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
            { id: "draw", name: "Draw", label: "Draw", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
            { id: "ecuador", name: "Ecuador", label: "Ecuador", side: "away", price: 0.27, bestBid: null, bestAsk: null, isTradable: true },
          ],
          event: null,
          rulesText: null,
        },
      ],
    },
  ],
  nextCursor: "live-event-id",
  page: { limit: 10, nextCursor: "live-event-id", hasMore: true },
});

const loadWithPayload = (payload: unknown) =>
  loadLiveEventFeed(
    {
      listWorldCupEvents: async () => payload,
    } as unknown as PolyApi,
    10,
  );

const main = async () => {
  const valid = await loadWithPayload(liveFeedPayload());

  const missingMarketsPayload = liveFeedPayload();
  delete (missingMarketsPayload.events[0] as { markets?: unknown }).markets;

  const badPricePayload = liveFeedPayload();
  (badPricePayload.events[0].markets[0].outcomes[0] as { price: unknown }).price = "bad-price";

  const missingMarkets = await Promise.allSettled([loadWithPayload(missingMarketsPayload)]);
  const badPrice = await Promise.allSettled([loadWithPayload(badPricePayload)]);

  const assertions = {
    validLiveRoutePageRendersOneCard:
      valid.source === "events-route-statusGroup-live" &&
      valid.nextCursor === "live-event-id" &&
      valid.events.length === 1 &&
      valid.events[0].markets[0].outcomes.length === 3,
    malformedEventWithoutMarketsRejects:
      missingMarkets[0].status === "rejected" &&
      String(missingMarkets[0].reason?.message ?? missingMarkets[0].reason).includes("without markets array"),
    malformedOutcomePriceRejects:
      badPrice[0].status === "rejected" &&
      String(badPrice[0].reason?.message ?? badPrice[0].reason).includes("non-numeric price"),
  };

  const proof = {
    cycle: "Cycle LQ",
    feature: "Live feed route shape contract",
    generatedAt: new Date().toISOString(),
    route: "/api/events?statusGroup=live&includeMobileMarkets=1",
    contract: {
      validPayload: "server-mode Live tab accepts route pages with visible event, market, outcome, and cursor fields",
      malformedPayload: "malformed route pages reject before Live cards are normalized or rendered",
      numericFields: "outcome price and quote fields must be finite numeric values or null",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LQ proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
