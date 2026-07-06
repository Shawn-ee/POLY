import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { normalizeEventSummary } from "../mobile/src/adapters/worldCupAdapter";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KN-search-metrics-contract/cycle-KN-search-metrics-contract.json";

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
  const event = await prisma.event.create({
    data: {
      slug: `mobile-kn-search-metrics-${suffix}`,
      title: `KN Search Metrics Home vs Away ${suffix}`,
      description: "Disposable event proving Search row metrics are backend-owned.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "KN Search Metrics Home",
      awayTeamName: "KN Search Metrics Away",
      status: "upcoming",
      startTime: new Date(Date.now() + 90 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-kn-search-metrics-winner-${suffix}`,
          title: "KN Search Metrics winner",
          description: "KN Search metrics market.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "winner",
          marketGroupKey: "winner",
          marketGroupTitle: "Winner",
          displayOrder: 0,
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Home",
                label: "Home",
                side: "home",
                code: "HOME",
                slug: `mobile-kn-search-metrics-home-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Away",
                label: "Away",
                side: "away",
                code: "AWAY",
                slug: `mobile-kn-search-metrics-away-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
              },
            ],
          },
        }],
      },
    },
  });

  const query = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search: suffix,
    includeMobileMarkets: "1",
    limit: "5",
  });
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected Search metrics route status 200, received ${response.status}.`);
  const body = await response.json();
  const routeEvent = body.events.find((candidate: any) => candidate.id === event.id);
  assert(routeEvent, "Expected seeded event in Search metrics route response.");
  assert(routeEvent.metrics?.source === "event-route-mobile-markets", "Expected backend-owned metrics source.");
  assert(routeEvent.metrics.marketCount === 1, "Expected metrics.marketCount to reflect listed backend markets.");
  assert(routeEvent.metrics.activeMarketCount === 1, "Expected metrics.activeMarketCount to reflect live backend markets.");
  assert(routeEvent.metrics.volume24h === null, "Expected missing volume24h to remain null instead of synthetic.");
  assert(routeEvent.metrics.commentCount === null, "Expected missing commentCount to remain null instead of synthetic chat.");
  assert(!("chatCount" in routeEvent.metrics), "Expected metrics not to expose fake chatCount.");
  assert(Array.isArray(routeEvent.markets) && routeEvent.markets.length === 1, "Expected compact mobile markets in Search route.");

  const mobileEvent = normalizeEventSummary(routeEvent, routeEvent.markets);
  assert(mobileEvent.metrics?.source === "event-route-mobile-markets", "Expected mobile adapter to preserve metrics source.");
  assert(mobileEvent.metrics.marketCount === routeEvent.metrics.marketCount, "Expected mobile market count to match route metrics.");
  assert(mobileEvent.metrics.volume24h === null, "Expected mobile volume24h to remain null.");
  assert(mobileEvent.metrics.commentCount === null, "Expected mobile commentCount to remain null.");

  const summary = {
    pass: true,
    cycle: "Cycle KN",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    query: Object.fromEntries(query.entries()),
    seededEvent: {
      id: event.id,
      slug: event.slug,
    },
    routeMetrics: routeEvent.metrics,
    routeMarkets: routeEvent.markets.map((market: any) => ({
      id: market.id,
      title: market.title,
      liquidity: market.liquidity,
      outcomeCount: market.outcomes.length,
    })),
    mobileMetrics: mobileEvent.metrics,
    assertions: {
      backendOwnedMetrics: true,
      syntheticVolumeRemoved: true,
      syntheticChatRemoved: true,
      mobileAdapterPreservesMetrics: true,
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
