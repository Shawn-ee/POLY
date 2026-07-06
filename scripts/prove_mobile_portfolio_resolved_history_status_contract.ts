import fs from "node:fs";
import path from "node:path";
import { portfolioHistoryToActivity } from "../mobile/src/services/portfolioHistoryService";
import type { PortfolioHistoryItem } from "../mobile/src/types";

const CYCLE = "cycle-NP-portfolio-resolved-history-status-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const historyItem = (status: string): PortfolioHistoryItem => ({
  market: {
    id: `world-cup-${status.toLowerCase()}`,
    title: `World Cup ${status} winner`,
    status,
    resolveTime: "2026-07-19T22:30:00.000Z",
    resolvedOutcomeId: "france",
    createdAt: "2026-07-01T14:00:00.000Z",
  },
  resolvedOutcomeName: "France",
  totalBuyCostTokens: 100,
  totalSellProceedsTokens: 0,
  netInvestedTokens: 100,
  winningsTokens: 172.5,
  refundsTokens: 0,
  realizedPnLTokens: 72.5,
});

const acceptsStatus = (status: string) => {
  const activity = portfolioHistoryToActivity([historyItem(status)])[0];
  return activity?.action === "closed" && activity.id === `history-world-cup-${status.toLowerCase()}`;
};

const rejectsStatus = (status: string) => {
  try {
    portfolioHistoryToActivity([historyItem(status)]);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes("invalid history[].market.status");
  }
};

const assertions = {
  acceptsResolvedStatus: acceptsStatus("RESOLVED"),
  acceptsClosedStatus: acceptsStatus("CLOSED"),
  acceptsSettledStatus: acceptsStatus("SETTLED"),
  acceptsFinalStatus: acceptsStatus("FINAL"),
  rejectsLiveStatus: rejectsStatus("LIVE"),
  rejectsActiveStatus: rejectsStatus("ACTIVE"),
  rejectsOpenStatus: rejectsStatus("OPEN"),
};

const proof = {
  cycle: "Cycle NP",
  feature: "Portfolio resolved-history status contract",
  generatedAt: new Date().toISOString(),
  route: "/api/portfolio/history",
  contract: {
    validPayload: "history rows must reference terminal market statuses before becoming visible closed Portfolio History activity.",
    malformedPayload: "live, active, or open market statuses reject before visible closed activity applies.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NP proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
