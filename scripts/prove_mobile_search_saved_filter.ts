import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KL-search-saved-filter/cycle-KL-search-saved-filter.json";

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
  searchableTitle: string;
}) {
  return prisma.event.create({
    data: {
      slug: `mobile-kl-${params.key}-${params.suffix}`,
      title: `${params.searchableTitle} ${params.key}`,
      description: "Disposable event proving Search saved filter.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `KL ${params.key} Home`,
      awayTeamName: `KL ${params.key} Away`,
      status: "upcoming",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-kl-${params.key}-winner-${params.suffix}`,
          title: `KL ${params.key} winner`,
          description: "KL Search saved filter market.",
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
                slug: `mobile-kl-${params.key}-home-${params.suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Away",
                label: "Away",
                side: "away",
                code: "AWAY",
                slug: `mobile-kl-${params.key}-away-${params.suffix}`,
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

async function getSearch(params: { eventIds?: string[]; search: string }) {
  const query = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search: params.search,
    includeMobileMarkets: "1",
    limit: "10",
  });
  if (params.eventIds?.length) query.set("eventIds", params.eventIds.join(","));
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected Search saved filter status 200, received ${response.status}.`);
  return response.json();
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const searchableTitle = `KL Search ${suffix}`;
  const savedA = await createEventWithMarket({ suffix, key: "saved-a", searchableTitle });
  const savedB = await createEventWithMarket({ suffix, key: "saved-b", searchableTitle });
  const unsaved = await createEventWithMarket({ suffix, key: "unsaved", searchableTitle });

  const unfiltered = await getSearch({ search: suffix });
  const saved = await getSearch({ search: suffix, eventIds: [savedA.id, savedB.id] });
  const emptySaved = await getSearch({ search: suffix, eventIds: [] });
  const unfilteredSlugs = unfiltered.events.map((event: any) => event.slug);
  const savedSlugs = saved.events.map((event: any) => event.slug);

  assert(unfilteredSlugs.includes(unsaved.slug), "Expected unfiltered Search to include the unsaved matching event.");
  assert(savedSlugs.includes(savedA.slug), "Expected Search Saved to include first saved event.");
  assert(savedSlugs.includes(savedB.slug), "Expected Search Saved to include second saved event.");
  assert(!savedSlugs.includes(unsaved.slug), "Expected Search Saved to exclude unsaved matching event.");
  assert(saved.events.every((event: any) => Array.isArray(event.markets) && event.markets.length > 0), "Expected Search Saved route events to include compact mobile markets.");
  assert(emptySaved.events.length === 3, "Expected empty eventIds query to behave like unfiltered route for direct route callers.");

  const summary = {
    pass: true,
    cycle: "Cycle KL",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    query: {
      includeMobileMarkets: true,
      sportKey: "soccer",
      leagueKey: "world_cup",
      search: suffix,
      eventIds: [savedA.id, savedB.id],
    },
    seededEvents: {
      savedA: { id: savedA.id, slug: savedA.slug },
      savedB: { id: savedB.id, slug: savedB.slug },
      unsaved: { id: unsaved.id, slug: unsaved.slug },
    },
    results: {
      unfilteredSlugs,
      savedSlugs,
      savedCompactMarketCounts: saved.events.map((event: any) => ({ slug: event.slug, markets: event.markets.length })),
      emptyEventIdsFallbackCount: emptySaved.events.length,
      nextCursor: saved.nextCursor ?? null,
    },
    mobileBehavior: {
      routeFilteredSearchSaved: true,
      emptySavedStateHandledInApp: true,
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
