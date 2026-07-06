import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import type { Market } from "../mobile/src/mocks/worldCup";
import { worldCupEvents } from "../mobile/src/mocks/worldCup";
import { loadFutureChartState } from "../mobile/src/services/futuresChartService";
import { loadMarketChartState } from "../mobile/src/services/marketChartService";

const CYCLE = "cycle-MV-market-chart-price-bounds-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const chartPayload = (marketId: string, range: "1H" | "1D", price = 0.39) => ({
  marketId,
  source: "market-outcome-snapshot",
  range,
  ranges: ["1H", "1D", "1W", "1M", "MAX"],
  generatedAt: "2026-07-06T08:00:00.000Z",
  lastUpdated: "2026-07-06T07:59:00.000Z",
  emptyState: null,
  outcomes: [{ id: "home", name: "Mexico" }],
  history: [
    { outcomeId: "home", timestamp: "2026-07-06T07:58:00.000Z", price, probability: 39 },
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

const rejectedWith = async (promise: Promise<unknown>, message: string) => {
  const result = await Promise.allSettled([promise]);
  return result[0].status === "rejected" && String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const event = worldCupEvents.find((item) => item.status === "live");
  if (!event) throw new Error("Live fixture event is required for chart proof.");

  const validEventChart = await loadMarketChartState(apiForPayload(chartPayload("france-argentina-live", "1D", 1)), event);
  const validFutureChart = await loadFutureChartState(apiForPayload(chartPayload("world-cup-winner", "1H", 0)), futureMarket, "1H");

  const assertions = {
    eventChartPriceOneAccepted:
      validEventChart.status === "ready" &&
      validEventChart.range === "1D" &&
      validEventChart.chartHistory[0]?.probability === 39,
    futureChartPriceZeroAccepted:
      validFutureChart.status === "ready" &&
      validFutureChart.range === "1H" &&
      validFutureChart.chartHistory[0]?.probability === 39,
    eventChartPriceAboveOneRejects: await rejectedWith(
      loadMarketChartState(apiForPayload(chartPayload("france-argentina-live", "1D", 1.2)), event),
      "invalid price",
    ),
    futureChartPriceAboveOneRejects: await rejectedWith(
      loadFutureChartState(apiForPayload(chartPayload("world-cup-winner", "1H", 2)), futureMarket, "1H"),
      "invalid price",
    ),
    negativeChartPriceRejects: await rejectedWith(
      loadMarketChartState(apiForPayload(chartPayload("france-argentina-live", "1D", -0.01)), event),
      "invalid price",
    ),
  };

  const proof = {
    cycle: "Cycle MV",
    feature: "Market chart price bounds contract",
    generatedAt: new Date().toISOString(),
    route: "/api/markets/:id/chart",
    contract: {
      validPayload: "Market chart history price must be a contract price from 0 to 1 before visible Event Detail/Futures chart state applies.",
      malformedPayload: "Negative or above-one chart prices reject before visible chart state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MV proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
