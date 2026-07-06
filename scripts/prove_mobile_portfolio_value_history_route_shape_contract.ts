import fs from "node:fs";
import path from "node:path";
import { loadPortfolioValueHistory } from "../mobile/src/services/portfolioValueHistoryService";
import type { PortfolioValueHistory } from "../mobile/src/types";

const CYCLE = "cycle-MA-portfolio-value-history-route-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const historyPayload = (): PortfolioValueHistory => ({
  range: "1D",
  ranges: ["1D", "1W", "1M", "All"],
  source: "portfolio-value-history-route",
  status: "ready",
  generatedAt: "2026-07-06T08:00:00.000Z",
  lastUpdated: "2026-07-06T08:00:00.000Z",
  emptyState: null,
  points: [
    { timestamp: "2026-07-06T08:00:00.000Z", value: 140.86, cash: 40.86, positionsValue: 100, pnl: -1.5 },
  ],
});

const apiForPayload = (payload: unknown) => ({
  getPortfolioValueHistory: async () => payload,
});

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadPortfolioValueHistory(apiForPayload(payload) as Parameters<typeof loadPortfolioValueHistory>[0]),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const validHistory = await loadPortfolioValueHistory(apiForPayload(historyPayload()));

  const wrongRange = { ...historyPayload(), range: "1W" };
  const missingGeneratedAt = { ...historyPayload(), generatedAt: "" };
  const invalidEmptyState = { ...historyPayload(), emptyState: "placeholder" };
  const negativeCash = { ...historyPayload(), points: [{ ...historyPayload().points[0], cash: -1 }] };

  const assertions = {
    validRequestedRangeApplies:
      validHistory.range === "1D" &&
      validHistory.generatedAt === "2026-07-06T08:00:00.000Z" &&
      validHistory.points[0]?.pnl === -1.5,
    wrongRangeRejects: await rejectedWith(wrongRange, "wrong range"),
    missingGeneratedAtRejects: await rejectedWith(missingGeneratedAt, "missing generatedAt"),
    invalidEmptyStateRejects: await rejectedWith(invalidEmptyState, "invalid emptyState"),
    negativeValueFieldRejects: await rejectedWith(negativeCash, "invalid point"),
  };

  const proof = {
    cycle: "Cycle MA",
    feature: "Portfolio value history route shape contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio/value-history",
    contract: {
      validPayload: "requested range, route metadata, empty state, and non-negative value fields validate before visible Portfolio chart state applies",
      malformedPayload: "wrong range, missing metadata, invalid empty state, or negative value/cash/positions values reject",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MA proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
