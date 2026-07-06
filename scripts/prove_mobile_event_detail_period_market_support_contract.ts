import fs from "node:fs";
import path from "node:path";
import { canRenderEventDetailLineFamily } from "../mobile/src/services/eventDetailMarketProfileService";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";
import type { Event, Market, Outcome } from "../mobile/src/mocks/worldCup";

const CYCLE = "cycle-NI-event-detail-period-market-support-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const routeOutcome = (id: string, side: string, price: number) => ({
  id,
  name: id,
  label: id,
  side,
  price,
  bestBid: null,
  bestAsk: null,
  isTradable: true,
});

const routePayload = (supportedMarketTypes: string[]) => ({
  event: {
    id: "db-event-id",
    slug: "backend-event-slug",
    title: "Mexico vs Ecuador",
    startTime: "2026-07-10T20:00:00.000Z",
    status: "live",
    liveStatus: "in_progress",
    homeScore: 1,
    awayScore: 1,
    marketCount: 2,
    activeMarketCount: 2,
    marketProfile: "regulation_90",
    resultMode: "can_draw",
    gameRules: {
      allowDraw: true,
      includesOvertime: false,
      description: "Regulation market can settle as draw.",
    },
    supportedMarketTypes,
  },
  markets: [
    {
      id: "regulation-market",
      title: "Regulation Time Winner",
      status: "LIVE",
      marketGroupTitle: "Regulation Time Winner",
      marketType: "regulation_90",
      period: "regulation",
      line: null,
      liquidity: "1000.50",
      outcomes: [
        routeOutcome("home", "home", 0.42),
        routeOutcome("draw", "draw", 0.31),
        routeOutcome("away", "away", 0.27),
      ],
    },
    {
      id: "first-half-winner",
      title: "1st Half Winner",
      status: "LIVE",
      marketGroupTitle: "1st Half Winner",
      marketType: "moneyline",
      period: "first-half",
      line: null,
      liquidity: "900.25",
      outcomes: [
        routeOutcome("home-1h", "home", 0.36),
        routeOutcome("draw-1h", "draw", 0.31),
        routeOutcome("away-1h", "away", 0.33),
      ],
    },
  ],
});

const outcome = (id: string, side: Outcome["side"]): Outcome => ({
  id,
  label: id,
  zhLabel: id,
  probability: 50,
  side,
  color: "#22c55e",
});

const firstHalfMarket: Market = {
  id: "first-half-winner",
  title: "1st Half Winner",
  zhTitle: "1st Half Winner",
  type: "game-line",
  marketType: "moneyline",
  period: "first-half",
  outcomes: [outcome("home", "home"), outcome("draw", "draw"), outcome("away", "away")],
};

const routeEvent: Pick<Event, "backendSlug" | "supportedMarketTypes"> = {
  backendSlug: "backend-event-slug",
  supportedMarketTypes: ["regulation_90", "first-half"],
};

const assertions = {
  routeRejectsUnsupportedFirstHalfWinner: (() => {
    try {
      assertEventDetailRoutePayloadShape(routePayload(["regulation_90"]));
      return false;
    } catch (error) {
      return error instanceof Error && error.message.includes("unsupported period market first-half");
    }
  })(),
  routeAcceptsDeclaredFirstHalfWinner: (() => {
    try {
      assertEventDetailRoutePayloadShape(routePayload(["regulation_90", "first-half"]));
      return true;
    } catch {
      return false;
    }
  })(),
  routeBackedUiRequiresDeclaredFirstHalf:
    canRenderEventDetailLineFamily(routeEvent, firstHalfMarket, "first-half") === true &&
    canRenderEventDetailLineFamily({ ...routeEvent, supportedMarketTypes: ["regulation_90"] }, firstHalfMarket, "first-half") === false,
  routeBackedUiRequiresBackendPeriodMarket:
    canRenderEventDetailLineFamily(routeEvent, undefined, "first-half") === false,
  localUiFallbackUnaffected:
    canRenderEventDetailLineFamily({}, undefined, "first-half") === true,
};

const proof = {
  cycle: "Cycle NI",
  feature: "Event Detail period market support contract",
  generatedAt: new Date().toISOString(),
  route: "/api/mobile/events/:slug/live-detail",
  contract: {
    validPayload: "route-backed first-half/second-half winner markets must be declared in event.supportedMarketTypes and backed by a matching backend market.",
    malformedPayload: "a period winner market for an undeclared period is rejected before Event Detail applies the payload.",
    localPayload: "non-route-backed/local Event Detail may still use fallback period winner fixtures.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NI proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
