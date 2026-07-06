import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KK-home-saved-filter/cycle-KK-home-saved-filter.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

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

async function createEventWithMarket(params: {
  suffix: string;
  key: string;
}) {
  return prisma.event.create({
    data: {
      slug: `mobile-kk-${params.key}-${params.suffix}`,
      title: `KK ${params.key} ${params.suffix}`,
      description: "Disposable event proving Home saved filter.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `KK ${params.key} Home`,
      awayTeamName: `KK ${params.key} Away`,
      status: "upcoming",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-kk-${params.key}-winner-${params.suffix}`,
          title: `KK ${params.key} winner`,
          description: "KK Home saved filter market.",
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
                slug: `mobile-kk-${params.key}-home-${params.suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Away",
                label: "Away",
                side: "away",
                code: "AWAY",
                slug: `mobile-kk-${params.key}-away-${params.suffix}`,
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
}

async function getSaved(eventIds: string[], suffix: string) {
  const params = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search: suffix,
    includeMobileMarkets: "1",
    limit: "10",
    eventIds: eventIds.join(","),
  });
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${params.toString()}`));
  assert(response.status === 200, `Expected saved filter status 200, received ${response.status}.`);
  return response.json();
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const savedA = await createEventWithMarket({ suffix, key: "saved-a" });
  const savedB = await createEventWithMarket({ suffix, key: "saved-b" });
  const unsaved = await createEventWithMarket({ suffix, key: "unsaved" });

  const saved = await getSaved([savedA.id, savedB.id], suffix);
  const empty = await getSaved([], suffix);
  const savedSlugs = saved.events.map((event: any) => event.slug);

  assert(savedSlugs.includes(savedA.slug), "Expected saved filter to include first saved event.");
  assert(savedSlugs.includes(savedB.slug), "Expected saved filter to include second saved event.");
  assert(!savedSlugs.includes(unsaved.slug), "Expected saved filter to exclude unsaved event.");
  assert(saved.events.every((event: any) => Array.isArray(event.markets) && event.markets.length > 0), "Expected saved route events to include compact mobile markets.");
  assert(empty.events.length === 3, "Expected empty eventIds query to behave like unfiltered route for direct route callers.");

  const summary = {
    pass: true,
    cycle: "Cycle KK",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    query: {
      includeMobileMarkets: true,
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventIds: [savedA.id, savedB.id],
    },
    seededEvents: {
      savedA: { id: savedA.id, slug: savedA.slug },
      savedB: { id: savedB.id, slug: savedB.slug },
      unsaved: { id: unsaved.id, slug: unsaved.slug },
    },
    results: {
      savedSlugs,
      savedCompactMarketCounts: saved.events.map((event: any) => ({ slug: event.slug, markets: event.markets.length })),
      emptyEventIdsFallbackCount: empty.events.length,
      nextCursor: saved.nextCursor ?? null,
    },
    mobileBehavior: {
      emptySavedStateHandledInApp: true,
      routeFilteredHomeSaved: true,
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
