import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { normalizeEventSummary } from "../mobile/src/adapters/worldCupAdapter";
import { eventCardStats } from "../mobile/src/services/eventCardMetricsService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KT-home-event-metrics-contract/cycle-KT-home-event-metrics-contract.json";

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
      slug: `mobile-kt-event-metrics-${suffix}`,
      title: `KT Mexico vs Ecuador ${suffix}`,
      description: "Disposable event proving Home game card metrics are backend-owned.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "today",
      startTime: new Date(),
      homeTeamName: "Mexico",
      awayTeamName: "Ecuador",
      markets: {
        create: [{
          slug: `mobile-kt-match-winner-${suffix}`,
          title: "KT Match Winner",
          description: "KT backend match market without route volume.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "winner",
          marketGroupKey: "winner",
          marketGroupTitle: "Match Winner",
          displayOrder: 0,
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Mexico",
                label: "Mexico",
                side: "home",
                code: "MEX",
                slug: `mobile-kt-mexico-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Draw",
                label: "Draw",
                side: "draw",
                code: "DRAW",
                slug: `mobile-kt-draw-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Ecuador",
                label: "Ecuador",
                side: "away",
                code: "ECU",
                slug: `mobile-kt-ecuador-${suffix}`,
                displayOrder: 2,
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
    limit: "10",
  });
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected Home events route status 200, received ${response.status}.`);
  const body = await response.json();
  const backendEvent = body.events.find((item: any) => item.slug === event.slug);
  assert(backendEvent, "Expected seeded backend event in Home route response.");
  assert(backendEvent.metrics?.source === "event-route-mobile-markets", "Expected route-owned event metrics.");

  const normalized = normalizeEventSummary(backendEvent, backendEvent.markets);
  const stats = eventCardStats(normalized);

  assert(stats.source === "event-route-mobile-markets", "Expected mobile Home card metrics to preserve backend source.");
  assert(stats.volume === null, "Expected Home card volume to remain unknown when backend volume24h is null.");
  assert(stats.liquidity === null, "Expected Home card liquidity to remain unknown without backend depth.");

  const summary = {
    pass: true,
    cycle: "Cycle KT",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    query: Object.fromEntries(query.entries()),
    seeded: {
      event: { id: event.id, slug: event.slug },
    },
    backendMetrics: backendEvent.metrics,
    mobileHomeCardMetrics: {
      eventId: normalized.id,
      volume: stats.volume,
      liquidity: stats.liquidity,
      source: stats.source,
      noFrontendSyntheticMetrics: true,
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
