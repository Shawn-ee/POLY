import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { serializeMarketChart } from "@/app/api/markets/[id]/chart/route";
import { normalizeMarket } from "../mobile/src/adapters/worldCupAdapter";
import { applyFutureChartStateToMarket, futureChartHistoryFromMarketChart } from "../mobile/src/services/futuresChartService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KR-home-futures-chart-contract/cycle-KR-home-futures-chart-contract.json";

const dec = (value: string) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const now = new Date();
  const event = await prisma.event.create({
    data: {
      slug: `mobile-kr-futures-chart-${suffix}`,
      title: `KR World Cup futures chart ${suffix}`,
      description: "Disposable event proving Home futures chart data is backend-routed.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "futures",
      status: "upcoming",
      markets: {
        create: [{
          slug: `mobile-kr-world-cup-winner-${suffix}`,
          title: "KR World Cup Winner",
          description: "KR backend future market with chart snapshots.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "future",
          marketGroupKey: "world-cup-winner",
          marketGroupTitle: "World Cup Winner",
          displayOrder: 0,
          isListed: true,
          outcomes: {
            create: [
              {
                name: "France",
                label: "France",
                side: "yes",
                code: "FRA",
                slug: `mobile-kr-france-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Brazil",
                label: "Brazil",
                side: "yes",
                code: "BRA",
                slug: `mobile-kr-brazil-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
              },
            ],
          },
        }],
      },
    },
    include: {
      markets: {
        include: { outcomes: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });

  const market = event.markets[0];
  const france = market.outcomes[0];
  const brazil = market.outcomes[1];
  await prisma.marketOutcomeSnapshot.createMany({
    data: [
      { marketId: market.id, outcomeId: france.id, ts: new Date(now.getTime() - 45 * 60 * 1000), price: dec("0.31") },
      { marketId: market.id, outcomeId: brazil.id, ts: new Date(now.getTime() - 45 * 60 * 1000), price: dec("0.19") },
      { marketId: market.id, outcomeId: france.id, ts: new Date(now.getTime() - 5 * 60 * 1000), price: dec("0.37") },
      { marketId: market.id, outcomeId: brazil.id, ts: new Date(now.getTime() - 5 * 60 * 1000), price: dec("0.22") },
    ],
  });

  const eventQuery = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search: suffix,
    includeMobileMarkets: "1",
    marketType: "future",
    limit: "10",
  });
  const eventResponse = await listEvents(new NextRequest(`http://localhost/api/events?${eventQuery.toString()}`));
  assert(eventResponse.status === 200, `Expected futures route status 200, received ${eventResponse.status}.`);
  const eventBody = await eventResponse.json();
  const backendMarket = eventBody.events.flatMap((item: any) => item.markets).find((item: any) => item.id === market.id);
  assert(backendMarket, "Expected seeded future market in Home futures response.");

  const chartResponse = await serializeMarketChart({ marketId: market.id, range: "1H", userId: null, now: now.getTime() });
  assert(chartResponse.status === 200, `Expected market chart route status 200, received ${chartResponse.status}.`);
  const chart = chartResponse.body;
  const chartHistory = futureChartHistoryFromMarketChart(chart);
  const normalized = normalizeMarket(backendMarket);
  const hydrated = applyFutureChartStateToMarket(normalized, {
    status: chartHistory.length > 0 ? "ready" : "empty",
    source: chart.source,
    range: chart.range,
    lastUpdated: chart.lastUpdated,
    emptyState: chart.emptyState,
    chartHistory,
  });

  assert(chart.range === "1H", "Expected chart route to preserve selected 1H range.");
  assert(chart.history.length === 4, `Expected 4 route chart points, received ${chart.history.length}.`);
  assert(hydrated.chartHistoryStatus === "ready", "Expected mobile futures chart status ready.");
  assert(hydrated.chartHistoryRange === "1H", "Expected mobile futures chart range 1H.");
  assert((hydrated.chartHistory?.length ?? 0) === 4, "Expected mobile futures chart history points.");

  const summary = {
    pass: true,
    cycle: "Cycle KR",
    createdAt: new Date().toISOString(),
    routes: {
      futures: { path: "/api/events", query: Object.fromEntries(eventQuery.entries()) },
      chart: { path: `/api/markets/${market.id}/chart`, query: { range: "1H" } },
    },
    seeded: {
      event: { id: event.id, slug: event.slug },
      market: { id: market.id, marketType: market.marketType },
      outcomes: market.outcomes.map((outcome) => ({ id: outcome.id, label: outcome.label })),
    },
    chartRoute: {
      source: chart.source,
      range: chart.range,
      ranges: chart.ranges,
      historyPointCount: chart.history.length,
      lastUpdated: chart.lastUpdated,
      emptyState: chart.emptyState,
    },
    mobileFuturesChart: {
      marketId: hydrated.id,
      chartHistoryStatus: hydrated.chartHistoryStatus,
      chartHistorySource: hydrated.chartHistorySource,
      chartHistoryRange: hydrated.chartHistoryRange,
      chartHistoryPointCount: hydrated.chartHistory?.length ?? 0,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
