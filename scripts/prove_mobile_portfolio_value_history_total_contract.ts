import fs from "node:fs";
import path from "node:path";
import { loadPortfolioValueHistory } from "../mobile/src/services/portfolioValueHistoryService";
import type { PortfolioValueHistory } from "../mobile/src/types";

const CYCLE = "cycle-MX-portfolio-value-history-total-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const historyPayload = (pointOverrides: Partial<PortfolioValueHistory["points"][number]> = {}): PortfolioValueHistory => ({
  range: "1D",
  ranges: ["1D", "1W", "1M", "All"],
  source: "portfolio-value-history-route",
  status: "ready",
  generatedAt: "2026-07-06T08:00:00.000Z",
  lastUpdated: "2026-07-06T08:00:00.000Z",
  emptyState: null,
  points: [
    {
      timestamp: "2026-07-06T08:00:00.000Z",
      value: 140.86,
      cash: 40.86,
      positionsValue: 100,
      pnl: -1.5,
      ...pointOverrides,
    },
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
  const exact = await loadPortfolioValueHistory(apiForPayload(historyPayload()));
  const tolerated = await loadPortfolioValueHistory(apiForPayload(historyPayload({ value: 140.87 })));

  const assertions = {
    exactTotalAccepted:
      exact.points[0]?.value === 140.86 &&
      exact.points[0]?.cash === 40.86 &&
      exact.points[0]?.positionsValue === 100 &&
      exact.points[0]?.pnl === -1.5,
    currencyToleranceAccepted: tolerated.points[0]?.value === 140.87,
    inconsistentTotalRejects: await rejectedWith(historyPayload({ value: 150 }), "inconsistent point total"),
    negativePnlRemainsAllowed: exact.points[0]?.pnl === -1.5,
  };

  const proof = {
    cycle: "Cycle MX",
    feature: "Portfolio value history total consistency contract",
    generatedAt: new Date().toISOString(),
    route: "/api/portfolio/value-history",
    contract: {
      validPayload: "Portfolio value-history point value must equal cash plus positionsValue within currency tolerance before visible chart state applies.",
      malformedPayload: "inconsistent value/cash/positionsValue totals reject before visible Portfolio chart state applies.",
      allowedLoss: "point pnl remains allowed to be negative.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MX proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
