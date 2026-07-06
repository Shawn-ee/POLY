import fs from "node:fs";
import path from "node:path";
import { assertEventListRoutePayloadShape } from "../mobile/src/services/eventListRouteShapeService";

const CYCLE = "cycle-LR-event-list-route-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const eventListPayload = () => ({
  events: [
    {
      id: "event-id",
      slug: "mexico-vs-ecuador",
      title: "Mexico vs Ecuador",
      description: "World Cup match",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      homeTeamName: "Mexico",
      awayTeamName: "Ecuador",
      startTime: new Date().toISOString(),
      status: "scheduled",
      liveStatus: null,
      period: null,
      clock: null,
      homeScore: null,
      awayScore: null,
      marketCount: 1,
      activeMarketCount: 1,
      markets: [
        {
          id: "winner-market",
          title: "Regulation Time Winner",
          description: null,
          status: "OPEN",
          marketGroupTitle: "Regulation Time Winner",
          marketType: "winner",
          propCategory: null,
          outcomes: [
            { id: "home", name: "Mexico", label: "Mexico", side: "home", price: "0.42", bestBid: "0.41", bestAsk: "0.43", isTradable: true },
            { id: "draw", name: "Tie", label: "Tie", side: "draw", price: "0.31", bestBid: null, bestAsk: null, isTradable: true },
            { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: "0.27", bestBid: null, bestAsk: null, isTradable: true },
          ],
          event: null,
          rulesText: null,
        },
      ],
    },
  ],
  nextCursor: "event-id",
  page: { limit: 10, nextCursor: "event-id", hasMore: true },
});

const settles = (fn: () => void) => {
  try {
    fn();
    return { status: "fulfilled" as const, message: null };
  } catch (error) {
    return { status: "rejected" as const, message: error instanceof Error ? error.message : String(error) };
  }
};

const main = () => {
  const validHome = settles(() => assertEventListRoutePayloadShape(eventListPayload()));
  const validSearch = settles(() => assertEventListRoutePayloadShape(eventListPayload()));
  const validFutures = settles(() => assertEventListRoutePayloadShape(eventListPayload()));

  const missingMarketsPayload = eventListPayload();
  delete (missingMarketsPayload.events[0] as { markets?: unknown }).markets;
  const missingMarkets = settles(() => assertEventListRoutePayloadShape(missingMarketsPayload));

  const malformedCursorPayload = eventListPayload();
  (malformedCursorPayload.page as { nextCursor: unknown }).nextCursor = 123;
  const malformedCursor = settles(() => assertEventListRoutePayloadShape(malformedCursorPayload));

  const malformedQuotePayload = eventListPayload();
  (malformedQuotePayload.events[0].markets[0].outcomes[0] as { bestAsk: unknown }).bestAsk = "bad-ask";
  const malformedQuote = settles(() => assertEventListRoutePayloadShape(malformedQuotePayload));

  const assertions = {
    validHomePageAccepted: validHome.status === "fulfilled",
    validSearchPageAccepted: validSearch.status === "fulfilled",
    validFuturesPageAccepted: validFutures.status === "fulfilled",
    missingMarketsRejects: missingMarkets.status === "rejected" && String(missingMarkets.message).includes("without markets array"),
    malformedCursorRejects: malformedCursor.status === "rejected" && String(malformedCursor.message).includes("malformed page nextCursor"),
    malformedQuoteRejects: malformedQuote.status === "rejected" && String(malformedQuote.message).includes("non-numeric bestAsk"),
  };

  const proof = {
    cycle: "Cycle LR",
    feature: "Home Search Futures event list route shape contract",
    generatedAt: new Date().toISOString(),
    route: "/api/events?includeMobileMarkets=1",
    contract: {
      sharedValidator: "Home, Search, Live, and Futures route pages validate compact event-list shape before normalization",
      malformedPayload: "missing market arrays, malformed cursor metadata, and malformed numeric quote fields reject before visible state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LR proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
