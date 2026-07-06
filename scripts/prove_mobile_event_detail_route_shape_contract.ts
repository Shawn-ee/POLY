import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import { loadEventDetailBySlug } from "../mobile/src/services/eventDetailHydrationService";

const CYCLE = "cycle-LV-event-detail-route-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const detailPayload = () => ({
  event: {
    id: "db-event-id",
    slug: "backend-event-slug",
    title: "Mexico vs Ecuador",
    description: "Backend detail rules.",
    category: "Sports / Soccer",
    sportKey: "soccer",
    leagueKey: "world_cup",
    homeTeamName: "Mexico",
    awayTeamName: "Ecuador",
    startTime: "2026-07-10T20:00:00.000Z",
    status: "live",
    liveStatus: "in_progress",
    period: "2H",
    clock: "67:10",
    homeScore: 1,
    awayScore: 1,
    imageUrl: null,
    marketCount: 1,
    activeMarketCount: 1,
    marketProfile: "regulation_90" as const,
    resultMode: "can_draw" as const,
    gameRules: {
      allowDraw: true,
      includesOvertime: false,
      description: "Regulation market can settle as draw.",
    },
    supportedMarketTypes: ["regulation_90" as const, "spread" as const],
  },
  markets: [{
    id: "regulation-market",
    title: "Regulation Time Winner",
    description: null,
    status: "LIVE",
    marketGroupTitle: "Regulation Time Winner",
    marketType: "moneyline",
    period: "regulation",
    line: null,
    propCategory: null,
    outcomes: [
      { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
      { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
      { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.27, bestBid: null, bestAsk: null, isTradable: true },
    ],
    event: null,
    rulesText: null,
  }],
});

const advancePayload = () => {
  const payload = detailPayload();
  return {
    ...payload,
    event: {
      ...payload.event,
      id: "advance-db-id",
      slug: "advance-event-slug",
      title: "Advance Home vs Away",
      marketProfile: "to_advance" as const,
      resultMode: "no_draw" as const,
      gameRules: {
        allowDraw: false,
        includesOvertime: true,
        description: "One team advances; no draw outcome.",
      },
      supportedMarketTypes: ["to_advance" as const, "regulation_90" as const],
    },
    markets: [
      {
        ...payload.markets[0],
        id: "advance-market",
        title: "Who Advances",
        marketGroupTitle: "Who Advances",
        marketType: "to_advance",
        outcomes: [
          { id: "home", name: "Home advances", label: "Home advances", side: "home", price: 0.52, bestBid: null, bestAsk: null, isTradable: true },
          { id: "away", name: "Away advances", label: "Away advances", side: "away", price: 0.48, bestBid: null, bestAsk: null, isTradable: true },
        ],
      },
      {
        ...payload.markets[0],
        id: "regulation-market",
      },
    ],
  };
};

const apiForPayload = (payload: unknown) =>
  ({
    getEvent: async () => payload,
  }) as unknown as PolyApi;

const main = async () => {
  const regulationEvent = await loadEventDetailBySlug(apiForPayload(detailPayload()), "backend-event-slug");
  const advanceEvent = await loadEventDetailBySlug(apiForPayload(advancePayload()), "advance-event-slug");

  const badProfile = detailPayload();
  badProfile.event.marketProfile = "shootout" as "regulation_90";
  const badProfileResult = await Promise.allSettled([
    loadEventDetailBySlug(apiForPayload(badProfile), "backend-event-slug"),
  ]);

  const noMarkets = detailPayload() as unknown as { markets?: unknown };
  delete noMarkets.markets;
  const noMarketsResult = await Promise.allSettled([
    loadEventDetailBySlug(apiForPayload(noMarkets), "backend-event-slug"),
  ]);

  const badOutcomePrice = detailPayload();
  badOutcomePrice.markets[0].outcomes[0].price = -0.01;
  const badOutcomePriceResult = await Promise.allSettled([
    loadEventDetailBySlug(apiForPayload(badOutcomePrice), "backend-event-slug"),
  ]);

  const assertions = {
    regulationWithDrawApplies:
      regulationEvent?.marketProfile === "regulation_90" &&
      regulationEvent.resultMode === "can_draw" &&
      regulationEvent.gameRules?.allowDraw === true &&
      regulationEvent.markets[0]?.outcomes.map((outcome) => outcome.side).join(",") === "home,draw,away",
    advanceNoDrawApplies:
      advanceEvent?.marketProfile === "to_advance" &&
      advanceEvent.resultMode === "no_draw" &&
      advanceEvent.gameRules?.includesOvertime === true &&
      advanceEvent.supportedMarketTypes?.includes("regulation_90") &&
      advanceEvent.markets.some((market) => market.marketType === "to_advance") &&
      advanceEvent.markets.some((market) => market.marketType === "moneyline" && market.outcomes.some((outcome) => outcome.side === "draw")),
    malformedProfileRejects:
      badProfileResult[0].status === "rejected" &&
      String(badProfileResult[0].reason?.message ?? badProfileResult[0].reason).includes("malformed marketProfile"),
    missingMarketsRejects:
      noMarketsResult[0].status === "rejected" &&
      String(noMarketsResult[0].reason?.message ?? noMarketsResult[0].reason).includes("without markets array"),
    malformedOutcomePriceRejects:
      badOutcomePriceResult[0].status === "rejected" &&
      String(badOutcomePriceResult[0].reason?.message ?? badOutcomePriceResult[0].reason).includes("non-numeric price"),
  };

  const proof = {
    cycle: "Cycle LV",
    feature: "Event Detail route shape contract",
    generatedAt: new Date().toISOString(),
    routes: ["/api/mobile/events/:slug/live-detail", "/api/events/:slug"],
    contract: {
      validPayload: "regulation-with-draw and advance/no-draw detail payloads hydrate only after backend rule and market arrays validate",
      malformedPayload: "malformed market profile, missing markets, or bad outcome numeric fields reject before visible Event Detail state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LV proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
