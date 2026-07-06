import fs from "node:fs";
import path from "node:path";
import { canRenderEventDetailLineFamily } from "../mobile/src/services/eventDetailMarketProfileService";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";
import type { Event, Market, Outcome } from "../mobile/src/mocks/worldCup";

const CYCLE = "cycle-NH-event-detail-supported-line-family-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const outcome = (id: string, side: Outcome["side"], label = id): Outcome => ({
  id,
  label,
  zhLabel: label,
  probability: 50,
  side,
  color: side === "no" || side === "under" ? "#64748b" : "#22c55e",
});

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

const routePayload = () => ({
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
    supportedMarketTypes: ["regulation_90", "spread"],
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
      id: "spread-market",
      title: "Spread Mexico -1.5",
      status: "LIVE",
      marketGroupTitle: "Spread",
      marketType: "spread",
      period: "regulation",
      line: "1.5",
      liquidity: "900.25",
      outcomes: [routeOutcome("yes", "yes", 0.45), routeOutcome("no", "no", 0.55)],
    },
  ],
});

const spreadMarket: Market = {
  id: "spread-market",
  title: "Spread Mexico -1.5",
  zhTitle: "Spread Mexico -1.5",
  type: "game-line",
  marketType: "spread",
  period: "regulation",
  line: "1.5",
  outcomes: [outcome("yes", "yes", "Yes"), outcome("no", "no", "No")],
};

const routeEvent: Pick<Event, "backendSlug" | "supportedMarketTypes"> = {
  backendSlug: "backend-event-slug",
  supportedMarketTypes: ["regulation_90", "spread"],
};

const unsupportedRoutePayload = routePayload();
unsupportedRoutePayload.event.supportedMarketTypes = ["regulation_90"];

const assertions = {
  routeRejectsUnsupportedLineFamily: (() => {
    try {
      assertEventDetailRoutePayloadShape(unsupportedRoutePayload);
      return false;
    } catch (error) {
      return error instanceof Error && error.message.includes("unsupported line family spread");
    }
  })(),
  routeAcceptsDeclaredLineFamily: (() => {
    try {
      assertEventDetailRoutePayloadShape(routePayload());
      return true;
    } catch {
      return false;
    }
  })(),
  routeBackedUiRequiresDeclaredLineFamily:
    canRenderEventDetailLineFamily(routeEvent, spreadMarket, "spread") === true &&
    canRenderEventDetailLineFamily({ ...routeEvent, supportedMarketTypes: ["regulation_90"] }, spreadMarket, "spread") === false,
  routeBackedUiRequiresBackendMarket:
    canRenderEventDetailLineFamily(routeEvent, undefined, "spread") === false,
  localUiFallbackUnaffected:
    canRenderEventDetailLineFamily({}, undefined, "spread") === true,
};

const proof = {
  cycle: "Cycle NH",
  feature: "Event Detail supported line family contract",
  generatedAt: new Date().toISOString(),
  route: "/api/mobile/events/:slug/live-detail",
  contract: {
    validPayload: "route-backed line families must be declared in event.supportedMarketTypes and backed by a matching backend market.",
    malformedPayload: "a line market for an undeclared family is rejected before Event Detail applies the payload.",
    localPayload: "non-route-backed/local Event Detail may still use fallback line fixtures.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NH proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
