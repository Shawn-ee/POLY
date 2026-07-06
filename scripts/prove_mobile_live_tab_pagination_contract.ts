import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { loadLiveEventFeed } from "../mobile/src/services/liveEventFeedService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KV-live-tab-pagination-contract/cycle-KV-live-tab-pagination-contract.json";

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

const createLiveEvent = async (suffix: string, label: string) =>
  prisma.event.create({
    data: {
      slug: `mobile-kv-live-${label}-${suffix}`,
      title: `KV Live ${label} Mexico vs Ecuador ${suffix}`,
      description: `Disposable live event proving Live tab pagination ${label}.`,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "live",
      liveStatus: "in_progress",
      startTime: new Date(),
      homeTeamName: "Mexico",
      awayTeamName: "Ecuador",
      markets: {
        create: [{
          slug: `mobile-kv-live-${label}-winner-${suffix}`,
          title: "KV Match Winner",
          description: "KV paginated live market.",
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
                slug: `mobile-kv-live-${label}-mexico-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Ecuador",
                label: "Ecuador",
                side: "away",
                code: "ECU",
                slug: `mobile-kv-live-${label}-ecuador-${suffix}`,
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

const callEvents = async (query: URLSearchParams) => {
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected Live tab route status 200, received ${response.status}.`);
  return response.json();
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const firstSeeded = await createLiveEvent(suffix, "first");
  const secondSeeded = await createLiveEvent(suffix, "second");

  const firstQuery = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search: suffix,
    includeMobileMarkets: "1",
    statusGroup: "live",
    limit: "1",
  });
  const firstPage = await callEvents(firstQuery);
  assert(firstPage.events.length === 1, `Expected first live page size 1, received ${firstPage.events.length}.`);
  assert(firstPage.nextCursor, "Expected first live page to return a next cursor.");

  const secondQuery = new URLSearchParams(firstQuery);
  secondQuery.set("cursor", firstPage.nextCursor);
  const secondPage = await callEvents(secondQuery);
  assert(secondPage.events.length === 1, `Expected second live page size 1, received ${secondPage.events.length}.`);

  const firstSlugs = firstPage.events.map((event: any) => event.slug);
  const secondSlugs = secondPage.events.map((event: any) => event.slug);
  assert(firstSlugs[0] !== secondSlugs[0], "Expected paginated Live pages to be non-overlapping.");

  const mobileCalls: Array<Record<string, unknown>> = [];
  const firstFeed = await loadLiveEventFeed({
    listWorldCupEvents: async (input) => {
      mobileCalls.push({ ...(typeof input === "object" ? input : {}) });
      return firstPage;
    },
  }, 1);
  const secondFeed = await loadLiveEventFeed({
    listWorldCupEvents: async (input) => {
      mobileCalls.push({ ...(typeof input === "object" ? input : {}) });
      assert(typeof input === "object" && input.cursor === firstFeed.nextCursor, "Expected mobile Live pagination to send the first page cursor.");
      return secondPage;
    },
  }, 1, firstFeed.nextCursor);

  assert(firstFeed.events.length === 1, "Expected first mobile live feed page.");
  assert(secondFeed.events.length === 1, "Expected second mobile live feed page.");

  const summary = {
    pass: true,
    cycle: "Cycle KV",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    seeded: {
      firstSeeded: { id: firstSeeded.id, slug: firstSeeded.slug },
      secondSeeded: { id: secondSeeded.id, slug: secondSeeded.slug },
    },
    firstPage: {
      query: Object.fromEntries(firstQuery.entries()),
      slugs: firstSlugs,
      nextCursor: firstPage.nextCursor ?? firstPage.page?.nextCursor ?? null,
    },
    secondPage: {
      query: Object.fromEntries(secondQuery.entries()),
      slugs: secondSlugs,
      nextCursor: secondPage.nextCursor ?? secondPage.page?.nextCursor ?? null,
    },
    mobileLiveFeed: {
      calls: mobileCalls,
      firstPageEventCount: firstFeed.events.length,
      secondPageEventCount: secondFeed.events.length,
      mergedUniqueEventIds: new Set([...firstFeed.events, ...secondFeed.events].map((event) => event.id)).size,
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
