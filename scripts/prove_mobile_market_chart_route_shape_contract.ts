import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import type { Market } from "../mobile/src/mocks/worldCup";
import { worldCupEvents } from "../mobile/src/mocks/worldCup";
import { loadFutureChartState } from "../mobile/src/services/futuresChartService";
import { loadMarketChartState } from "../mobile/src/services/marketChartService";

const CYCLE = "cycle-LT-market-chart-route-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const chartPayload = (marketId: string, range: "1H" | "1D") => ({
  marketId,
  source: "market-outcome-snapshot",
  range,
  ranges: ["1H", "1D", "1W", "1M", "MAX"],
  generatedAt: "2026-07-06T08:00:00.000Z",
  lastUpdated: "2026-07-06T07:59:00.000Z",
  emptyState: null,
  outcomes: [{ id: "home", name: "Mexico" }],
  history: [
    { outcomeId: "home", timestamp: "2026-07-06T07:58:00.000Z", price: 0.39, probability: 39 },
  ],
  series: {},
});

const apiForPayload = (payload: unknown) =>
  ({
    getMarketChart: async () => payload,
  }) as unknown as PolyApi;

const futureMarket: Market = {
  id: "world-cup-winner",
  title: "World Cup Winner",
  zhTitle: "World Cup Winner",
  type: "future",
  marketType: "future",
  outcomes: [{ id: "france", label: "France", zhLabel: "France", probability: 41, color: "#2563eb" }],
};

const main = async () => {
  const event = worldCupEvents.find((item) => item.status === "live");
  if (!event) throw new Error("Live fixture event is required for chart proof.");

  const validEventChart = await loadMarketChartState(apiForPayload(chartPayload("france-argentina-live", "1D")), event);
  const validFutureChart = await loadFutureChartState(apiForPayload(chartPayload("world-cup-winner", "1H")), futureMarket, "1H");

  const malformedProbabilityPayload = chartPayload("france-argentina-live", "1D");
  malformedProbabilityPayload.history[0].probability = 101;
  const malformedProbability = await Promise.allSettled([
    loadMarketChartState(apiForPayload(malformedProbabilityPayload), event),
  ]);

  const wrongMarket = await Promise.allSettled([
    loadFutureChartState(apiForPayload(chartPayload("other-market", "1H")), futureMarket, "1H"),
  ]);

  const wrongRange = await Promise.allSettled([
    loadFutureChartState(apiForPayload(chartPayload("world-cup-winner", "1D")), futureMarket, "1H"),
  ]);

  const assertions = {
    validEventDetailChartApplies:
      validEventChart.status === "ready" &&
      validEventChart.range === "1D" &&
      validEventChart.chartHistory[0]?.probability === 39,
    validFutureChartApplies:
      validFutureChart.status === "ready" &&
      validFutureChart.range === "1H" &&
      validFutureChart.chartHistory[0]?.probability === 39,
    malformedProbabilityRejects:
      malformedProbability[0].status === "rejected" &&
      String(malformedProbability[0].reason?.message ?? malformedProbability[0].reason).includes("invalid probability"),
    wrongMarketRejects:
      wrongMarket[0].status === "rejected" &&
      String(wrongMarket[0].reason?.message ?? wrongMarket[0].reason).includes("requested market world-cup-winner"),
    wrongRangeRejects:
      wrongRange[0].status === "rejected" &&
      String(wrongRange[0].reason?.message ?? wrongRange[0].reason).includes("malformed range"),
  };

  const proof = {
    cycle: "Cycle LT",
    feature: "Market chart route shape contract",
    generatedAt: new Date().toISOString(),
    route: "/api/markets/:id/chart",
    contract: {
      validPayload: "valid Event Detail and Futures chart route payloads apply visible probability history",
      malformedPayload: "wrong market, wrong range, and malformed probabilities reject before visible chart state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LT proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
