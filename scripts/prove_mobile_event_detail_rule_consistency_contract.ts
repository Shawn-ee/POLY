import fs from "node:fs";
import path from "node:path";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";

const CYCLE = "cycle-MJ-event-detail-rule-consistency-contract";
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
  const validRegulation = detailPayload();
  assertEventDetailRoutePayloadShape(validRegulation);

  const validAdvance = detailPayload();
  validAdvance.event.marketProfile = "to_advance";
  validAdvance.event.resultMode = "no_draw";
  validAdvance.event.gameRules = {
    allowDraw: false,
    includesOvertime: true,
    description: "One team advances; no draw outcome.",
  };
  validAdvance.event.supportedMarketTypes = ["to_advance"];
  validAdvance.markets[0].id = "advance-market";
  validAdvance.markets[0].title = "Who Advances";
  validAdvance.markets[0].marketType = "to_advance";
  validAdvance.markets[0].outcomes = [
    { id: "home", name: "Home advances", label: "Home advances", side: "home", price: 0.52, bestBid: null, bestAsk: null, isTradable: true },
    { id: "away", name: "Away advances", label: "Away advances", side: "away", price: 0.48, bestBid: null, bestAsk: null, isTradable: true },
  ];
  assertEventDetailRoutePayloadShape(validAdvance);

  const canDrawButDisallowed = detailPayload();
  canDrawButDisallowed.event.resultMode = "can_draw";
  canDrawButDisallowed.event.gameRules.allowDraw = false;

  const noDrawButAllowed = detailPayload();
  noDrawButAllowed.event.resultMode = "no_draw";
  noDrawButAllowed.event.gameRules.allowDraw = true;

  const unsupportedProfile = detailPayload();
  unsupportedProfile.event.supportedMarketTypes = ["spread"];

  const assertions = {
    validRegulationRulesAccepted: true,
    validAdvanceRulesAccepted: true,
    canDrawButDisallowedRejects: rejectedWith(canDrawButDisallowed, "inconsistent draw rules"),
    noDrawButAllowedRejects: rejectedWith(noDrawButAllowed, "inconsistent draw rules"),
    unsupportedMarketProfileRejects: rejectedWith(unsupportedProfile, "unsupported marketProfile"),
  };

  const proof = {
    cycle: "Cycle MJ",
    feature: "Event Detail rule consistency contract",
    generatedAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    contract: {
      validPayload: "Event Detail resultMode must match gameRules.allowDraw, and marketProfile must be listed in supportedMarketTypes when both are present",
      malformedPayload: "contradictory draw rules or unsupported marketProfile reject before visible Event Detail state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MJ proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
