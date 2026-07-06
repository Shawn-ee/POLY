import fs from "node:fs";
import path from "node:path";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";

const CYCLE = "cycle-MH-event-detail-score-contract";
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

  const negativeHomeScore = detailPayload();
  negativeHomeScore.event.homeScore = -1;

  const negativeAwayScore = detailPayload();
  negativeAwayScore.event.awayScore = -1;

  const nullScores = detailPayload();
  nullScores.event.homeScore = null;
  nullScores.event.awayScore = null;
  assertEventDetailRoutePayloadShape(nullScores);

  const assertions = {
    validLiveScoresAccepted: true,
    nullScoresAcceptedForPreMatchOrUnknown: true,
    negativeHomeScoreRejects: rejectedWith(negativeHomeScore, "malformed score"),
    negativeAwayScoreRejects: rejectedWith(negativeAwayScore, "malformed score"),
  };

  const proof = {
    cycle: "Cycle MH",
    feature: "Event Detail score contract",
    generatedAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    contract: {
      validPayload: "Event Detail live scores must be finite non-negative numbers when present; null remains allowed for unknown/pre-match scores",
      malformedPayload: "negative scores reject before visible Event Detail state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MH proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
