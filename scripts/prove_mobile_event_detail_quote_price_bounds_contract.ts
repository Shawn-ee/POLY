import fs from "node:fs";
import path from "node:path";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";

const CYCLE = "cycle-MQ-event-detail-quote-price-bounds-contract";
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
    marketProfile: "regulation_90",
    resultMode: "can_draw",
    gameRules: {
      allowDraw: true,
      includesOvertime: false,
      description: "Regulation market can settle as draw.",
    },
    supportedMarketTypes: ["regulation_90", "spread"],
  },
  markets: [{
    id: "moneyline-market",
    title: "Regulation Time Winner",
    description: null,
    status: "LIVE",
    marketGroupTitle: "Regulation Time Winner",
    marketType: "regulation_90",
    period: "regulation",
    line: null,
    propCategory: null,
    liquidity: "1000.50",
    outcomes: [
      {
        id: "home",
        name: "Mexico",
        label: "Mexico",
        side: "home",
        price: 0.42,
        bestBid: "0.4",
        bestAsk: "0.45",
        bestBidSize: "1000.5",
        bestAskSize: 2500,
        isTradable: true,
      },
      { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
      { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.27, bestBid: null, bestAsk: null, isTradable: true },
    ],
    event: null,
    rulesText: null,
  }],
});

const rejectedWith = (payload: unknown, message: string) => {
  try {
    assertEventDetailRoutePayloadShape(payload);
    return false;
  } catch (error) {
    return String((error as Error).message ?? error).includes(message);
  }
};

const withOutcomeField = (field: "price" | "bestBid" | "bestAsk" | "bestBidSize" | "bestAskSize", value: unknown) => {
  const payload = detailPayload() as any;
  payload.markets[0].outcomes[0][field] = value;
  return payload;
};

const main = () => {
  assertEventDetailRoutePayloadShape(detailPayload());
  assertEventDetailRoutePayloadShape(withOutcomeField("bestAskSize", "5000.75"));

  const assertions = {
    validProbabilityQuotesAccepted: true,
    largeDepthSizeAccepted: true,
    priceAboveOneRejects: rejectedWith(withOutcomeField("price", 1.2), "invalid price"),
    bidAboveOneRejects: rejectedWith(withOutcomeField("bestBid", "1.01"), "invalid bestBid"),
    askAboveOneRejects: rejectedWith(withOutcomeField("bestAsk", 2), "invalid bestAsk"),
    malformedQuoteRejects: rejectedWith(withOutcomeField("price", "not-a-number"), "invalid price"),
    negativeDepthSizeRejects: rejectedWith(withOutcomeField("bestAskSize", -1), "invalid bestAskSize"),
  };

  const proof = {
    cycle: "Cycle MQ",
    feature: "Event Detail outcome quote price bounds contract",
    generatedAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    contract: {
      validPayload: "Route-backed Event Detail outcome price, bestBid, and bestAsk must be probability values from 0 to 1.",
      malformedPayload: "Above-one or malformed quote prices reject before Event Detail can normalize market rows; depth sizes remain allowed above one.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MQ proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
