import fs from "node:fs";
import path from "node:path";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";

const CYCLE = "cycle-MI-event-detail-market-count-contract";
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
    marketCount: 2,
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
      { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
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

const main = () => {
  const valid = detailPayload();
  assertEventDetailRoutePayloadShape(valid);

  const stringMarketCount = detailPayload() as any;
  stringMarketCount.event.marketCount = "2";

  const negativeActiveCount = detailPayload();
  negativeActiveCount.event.activeMarketCount = -1;

  const fractionalMarketCount = detailPayload();
  fractionalMarketCount.event.marketCount = 1.5;

  const activeAboveTotal = detailPayload();
  activeAboveTotal.event.marketCount = 1;
  activeAboveTotal.event.activeMarketCount = 2;

  const assertions = {
    validMarketCountsAccepted: true,
    stringMarketCountRejects: rejectedWith(stringMarketCount, "malformed market counts"),
    negativeActiveCountRejects: rejectedWith(negativeActiveCount, "malformed market counts"),
    fractionalMarketCountRejects: rejectedWith(fractionalMarketCount, "malformed market counts"),
    activeAboveTotalRejects: rejectedWith(activeAboveTotal, "inconsistent market counts"),
  };

  const proof = {
    cycle: "Cycle MI",
    feature: "Event Detail market count contract",
    generatedAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    contract: {
      validPayload: "Event Detail marketCount and activeMarketCount must be finite non-negative integers",
      malformedPayload: "string, negative, fractional, or active-greater-than-total counts reject before visible Event Detail state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MI proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
