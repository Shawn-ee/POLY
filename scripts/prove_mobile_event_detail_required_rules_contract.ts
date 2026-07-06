import fs from "node:fs";
import path from "node:path";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";

const CYCLE = "cycle-MN-event-detail-required-rules-contract";
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

const advancePayload = () => {
  const payload = detailPayload();
  payload.event.marketProfile = "to_advance";
  payload.event.resultMode = "no_draw";
  payload.event.gameRules = {
    allowDraw: false,
    includesOvertime: true,
    description: "One team advances; no draw outcome.",
  };
  payload.event.supportedMarketTypes = ["to_advance"];
  payload.markets[0].id = "advance-market";
  payload.markets[0].title = "Who Advances";
  payload.markets[0].marketType = "to_advance";
  payload.markets[0].outcomes = [
    { id: "home", name: "Home advances", label: "Home advances", side: "home", price: 0.52, bestBid: null, bestAsk: null, isTradable: true },
    { id: "away", name: "Away advances", label: "Away advances", side: "away", price: 0.48, bestBid: null, bestAsk: null, isTradable: true },
  ];
  return payload;
};

const rejectedWith = (payload: unknown, message: string) => {
  try {
    assertEventDetailRoutePayloadShape(payload);
    return false;
  } catch (error) {
    return String((error as Error).message ?? error).includes(message);
  }
};

const withoutEventField = (field: "marketProfile" | "resultMode" | "gameRules" | "supportedMarketTypes") => {
  const payload = detailPayload() as any;
  delete payload.event[field];
  return payload;
};

const main = () => {
  assertEventDetailRoutePayloadShape(detailPayload());
  assertEventDetailRoutePayloadShape(advancePayload());

  const assertions = {
    validRegulationRulesAccepted: true,
    validAdvanceRulesAccepted: true,
    missingMarketProfileRejects: rejectedWith(withoutEventField("marketProfile"), "malformed marketProfile"),
    missingResultModeRejects: rejectedWith(withoutEventField("resultMode"), "malformed resultMode"),
    missingGameRulesRejects: rejectedWith(withoutEventField("gameRules"), "malformed gameRules"),
    missingSupportedMarketTypesRejects: rejectedWith(withoutEventField("supportedMarketTypes"), "malformed supportedMarketTypes"),
  };

  const proof = {
    cycle: "Cycle MN",
    feature: "Event Detail required backend rules contract",
    generatedAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    contract: {
      validPayload: "Route-backed Event Detail must include marketProfile, resultMode, gameRules, and supportedMarketTypes",
      malformedPayload: "missing backend rule fields reject before frontend Event Detail can infer market structure",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MN proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
