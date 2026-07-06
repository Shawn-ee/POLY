import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { normalizeMarket } from "../mobile/src/adapters/worldCupAdapter";
import { futureMarketStats, futureOutcomeVolume } from "../mobile/src/services/futuresMetricsService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KS-home-futures-metrics-contract/cycle-KS-home-futures-metrics-contract.json";

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
      slug: `mobile-ks-futures-metrics-${suffix}`,
      title: `KS World Cup futures metrics ${suffix}`,
      description: "Disposable event proving Home futures metrics are not frontend-invented.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "futures",
      status: "upcoming",
      markets: {
        create: [{
          slug: `mobile-ks-world-cup-winner-${suffix}`,
          title: "KS World Cup Winner",
          description: "KS backend future market without provider volume.",
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
                slug: `mobile-ks-france-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Brazil",
                label: "Brazil",
                side: "yes",
                code: "BRA",
                slug: `mobile-ks-brazil-${suffix}`,
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
    marketType: "future",
    limit: "10",
  });
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected futures route status 200, received ${response.status}.`);
  const body = await response.json();
  const backendMarket = body.events.flatMap((item: any) => item.markets).find((item: any) => item.marketType === "future");
  assert(backendMarket, "Expected seeded backend future market.");

  const normalized = normalizeMarket(backendMarket);
  const stats = futureMarketStats(normalized);
  const outcomeVolume = normalized.outcomes[0] ? futureOutcomeVolume(normalized, normalized.outcomes[0]) : null;

  assert(stats.volume === null, "Expected future market volume to remain unknown when backend does not provide it.");
  assert(stats.liquidity === null, "Expected future market liquidity to remain unknown without backend depth.");
  assert(outcomeVolume === null, "Expected future outcome volume to remain unknown instead of probability-derived.");

  const summary = {
    pass: true,
    cycle: "Cycle KS",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    query: Object.fromEntries(query.entries()),
    seeded: {
      event: { id: event.id, slug: event.slug },
    },
    backendMarket: {
      id: backendMarket.id,
      marketType: backendMarket.marketType,
      liquidity: backendMarket.liquidity,
    },
    mobileFuturesMetrics: {
      marketId: normalized.id,
      volume: stats.volume,
      liquidity: stats.liquidity,
      source: stats.source,
      firstOutcomeVolume: outcomeVolume,
      noFrontendSyntheticVolume: true,
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
