import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KO-search-sort-contract/cycle-KO-search-sort-contract.json";

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

async function createEventWithMarkets(params: {
  suffix: string;
  key: string;
  status: string;
  marketCount: number;
}) {
  return prisma.event.create({
    data: {
      slug: `mobile-ko-search-sort-${params.key}-${params.suffix}`,
      title: `KO Search Sort ${params.key} ${params.suffix}`,
      description: "Disposable event proving Search sort is backend-owned.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `KO ${params.key} Home`,
      awayTeamName: `KO ${params.key} Away`,
      status: params.status,
      liveStatus: params.status === "live" ? "in_progress" : null,
      startTime: new Date(Date.now() + 120 * 60 * 1000),
      markets: {
        create: Array.from({ length: params.marketCount }, (_, index) => ({
          slug: `mobile-ko-search-sort-${params.key}-market-${index}-${params.suffix}`,
          title: `KO ${params.key} market ${index}`,
          description: "KO Search sort market.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "winner",
          marketGroupKey: `winner-${index}`,
          marketGroupTitle: "Winner",
          displayOrder: index,
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Home",
                label: "Home",
                side: "home",
                code: "HOME",
                slug: `mobile-ko-search-sort-${params.key}-home-${index}-${params.suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Away",
                label: "Away",
                side: "away",
                code: "AWAY",
                slug: `mobile-ko-search-sort-${params.key}-away-${index}-${params.suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
              },
            ],
          },
        })),
      },
    },
  });
}

async function getSorted(search: string, sortBy: "popular" | "live") {
  const query = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search,
    includeMobileMarkets: "1",
    sortBy,
    limit: "2",
  });
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected Search sort status 200, received ${response.status}.`);
  return response.json();
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const oneMarket = await createEventWithMarkets({ suffix, key: "one", status: "upcoming", marketCount: 1 });
  const threeMarkets = await createEventWithMarkets({ suffix, key: "three", status: "upcoming", marketCount: 3 });
  const liveTwoMarkets = await createEventWithMarkets({ suffix, key: "live-two", status: "live", marketCount: 2 });

  const popular = await getSorted(suffix, "popular");
  const live = await getSorted(suffix, "live");
  const popularSlugs = popular.events.map((event: any) => event.slug);
  const liveSlugs = live.events.map((event: any) => event.slug);

  assert(popularSlugs[0] === threeMarkets.slug, "Expected Popular sort to return highest market-count event first.");
  assert(popularSlugs[1] === liveTwoMarkets.slug, "Expected Popular sort to return second-highest market-count event second.");
  assert(popular.page?.sortBy === "popular", "Expected Popular route page.sortBy=popular.");
  assert(popular.nextCursor === liveTwoMarkets.id, "Expected Popular nextCursor to use the last event in the backend-sorted page.");

  assert(liveSlugs[0] === liveTwoMarkets.slug, "Expected Live-first sort to promote live event first.");
  assert(liveSlugs[1] === threeMarkets.slug, "Expected Live-first sort to use backend popularity tiebreak after live promotion.");
  assert(live.page?.sortBy === "live", "Expected Live route page.sortBy=live.");
  assert(live.nextCursor === threeMarkets.id, "Expected Live nextCursor to use the last event in the backend-sorted page.");

  const summary = {
    pass: true,
    cycle: "Cycle KO",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    seededEvents: {
      oneMarket: { id: oneMarket.id, slug: oneMarket.slug, marketCount: 1, status: oneMarket.status },
      threeMarkets: { id: threeMarkets.id, slug: threeMarkets.slug, marketCount: 3, status: threeMarkets.status },
      liveTwoMarkets: { id: liveTwoMarkets.id, slug: liveTwoMarkets.slug, marketCount: 2, status: liveTwoMarkets.status },
    },
    popular: {
      slugs: popularSlugs,
      nextCursor: popular.nextCursor,
      sortBy: popular.page?.sortBy,
      marketCounts: popular.events.map((event: any) => ({ slug: event.slug, marketCount: event.metrics?.marketCount })),
    },
    live: {
      slugs: liveSlugs,
      nextCursor: live.nextCursor,
      sortBy: live.page?.sortBy,
      statuses: live.events.map((event: any) => ({ slug: event.slug, status: event.status, liveStatus: event.liveStatus })),
    },
    mobileBehavior: {
      searchSortParam: "PolyApi.listWorldCupEvents(sortBy)",
      serverModeUsesRouteOrder: true,
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
