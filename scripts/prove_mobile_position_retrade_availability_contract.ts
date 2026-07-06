import fs from "node:fs";
import path from "node:path";
import type { Position } from "../mobile/src/components/Portfolio";
import { worldCupEvents, worldCupFutures } from "../mobile/src/mocks/worldCup";
import { marketOrderBlockReason } from "../mobile/src/services/orderService";
import { resolvePositionTradeTarget } from "../mobile/src/services/positionTradeTargetService";

const CYCLE = "cycle-NL-position-retrade-availability-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const basePosition: Position = {
  id: "server-world-cup-winner-France",
  mode: "server",
  marketId: "world-cup-winner",
  outcomeId: "france",
  title: "World Cup winner",
  outcome: "France",
  side: "buy",
  amount: 210,
  probability: 42,
  shares: 500,
};

const unavailableAvailability = {
  source: "portfolio-market-status",
  status: "unavailable" as const,
  marketStatus: "CLOSED",
  lastUpdated: null,
  stalenessSeconds: null,
  staleAfterSeconds: 60,
  isStale: false,
  isSuspended: false,
  isDelayed: false,
  reason: "Portfolio route says this market is closed.",
};

const readyAvailability = {
  source: "local-market-fixture",
  status: "ready" as const,
  marketStatus: "LIVE",
  lastUpdated: "2026-07-06T08:00:00.000Z",
  stalenessSeconds: 0,
  staleAfterSeconds: 60,
  isStale: false,
  isSuspended: false,
  isDelayed: false,
  reason: "Local fixture is ready.",
};

const locallyReadyFutures = worldCupFutures.map((market) =>
  market.id === "world-cup-winner"
    ? { ...market, availability: readyAvailability }
    : market,
);

const matchedTarget = resolvePositionTradeTarget({
  position: { ...basePosition, marketAvailability: unavailableAvailability },
  futures: locallyReadyFutures,
  events: worldCupEvents,
});

const fallbackTarget = resolvePositionTradeTarget({
  position: {
    ...basePosition,
    marketId: "backend-only-market",
    outcomeId: "backend-only-outcome",
    title: "Backend-only market",
    outcome: "YES",
    marketAvailability: unavailableAvailability,
  },
  futures: worldCupFutures,
  events: worldCupEvents,
});

const assertions = {
  matchedLocalMarketUsesPortfolioAvailability:
    matchedTarget?.market.availability?.source === "portfolio-market-status" &&
    matchedTarget.market.availability.status === "unavailable",
  matchedLocalMarketBlocksOrders:
    matchedTarget !== undefined &&
    marketOrderBlockReason(matchedTarget.market) === "Portfolio route says this market is closed.",
  fallbackMarketUsesPortfolioAvailability:
    fallbackTarget?.market.availability?.source === "portfolio-market-status" &&
    fallbackTarget.market.availability.status === "unavailable",
  fallbackMarketBlocksOrders:
    fallbackTarget !== undefined &&
    marketOrderBlockReason(fallbackTarget.market) === "Portfolio route says this market is closed.",
};

const proof = {
  cycle: "Cycle NL",
  feature: "Portfolio position re-trade availability contract",
  generatedAt: new Date().toISOString(),
  route: "/api/portfolio",
  contract: {
    validPayload: "server-mode Portfolio position marketAvailability is authoritative for re-trade ticket targets.",
    malformedPayload: "locally loaded ready market state must not override backend Portfolio unavailable/suspended status.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NL proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
