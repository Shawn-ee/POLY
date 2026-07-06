import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KJ-home-status-filters/cycle-KJ-home-status-filters.json";
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

const startOfUtcDay = (date: Date) => {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

async function createEventWithMarket(params: {
  suffix: string;
  key: string;
  status: string;
  startTime: Date;
}) {
  return prisma.event.create({
    data: {
      slug: `mobile-kj-${params.key}-${params.suffix}`,
      title: `KJ ${params.key} ${params.suffix}`,
      description: "Disposable event proving Home status filters.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `KJ ${params.key} Home`,
      awayTeamName: `KJ ${params.key} Away`,
      status: params.status,
      startTime: params.startTime,
      markets: {
        create: [{
          slug: `mobile-kj-${params.key}-winner-${params.suffix}`,
          title: `KJ ${params.key} winner`,
          description: "KJ Home status filter market.",
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
                slug: `mobile-kj-${params.key}-home-${params.suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Away",
                label: "Away",
                side: "away",
                code: "AWAY",
                slug: `mobile-kj-${params.key}-away-${params.suffix}`,
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

async function getFiltered(statusGroup: "live" | "today" | null, suffix: string) {
  const params = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search: suffix,
    includeMobileMarkets: "1",
    limit: "10",
  });
  if (statusGroup) params.set("statusGroup", statusGroup);
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${params.toString()}`));
  assert(response.status === 200, `Expected ${statusGroup ?? "all"} status 200, received ${response.status}.`);
  return response.json();
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const todayNoon = startOfUtcDay(new Date());
  todayNoon.setUTCHours(12, 0, 0, 0);
  const tomorrowNoon = addDays(todayNoon, 1);

  const liveEvent = await createEventWithMarket({ suffix, key: "live", status: "live", startTime: todayNoon });
  const todayEvent = await createEventWithMarket({ suffix, key: "today", status: "upcoming", startTime: todayNoon });
  const futureEvent = await createEventWithMarket({ suffix, key: "future", status: "upcoming", startTime: tomorrowNoon });

  const all = await getFiltered(null, suffix);
  const live = await getFiltered("live", suffix);
  const today = await getFiltered("today", suffix);

  const allSlugs = all.events.map((event: any) => event.slug);
  const liveSlugs = live.events.map((event: any) => event.slug);
  const todaySlugs = today.events.map((event: any) => event.slug);

  assert(allSlugs.includes(liveEvent.slug), "Expected unfiltered Home route to include live event.");
  assert(allSlugs.includes(todayEvent.slug), "Expected unfiltered Home route to include today event.");
  assert(allSlugs.includes(futureEvent.slug), "Expected unfiltered Home route to include future event.");
  assert(liveSlugs.includes(liveEvent.slug), "Expected live Home filter to include live event.");
  assert(!liveSlugs.includes(todayEvent.slug), "Expected live Home filter to exclude non-live today event.");
  assert(!liveSlugs.includes(futureEvent.slug), "Expected live Home filter to exclude future event.");
  assert(todaySlugs.includes(liveEvent.slug), "Expected today Home filter to include live event starting today.");
  assert(todaySlugs.includes(todayEvent.slug), "Expected today Home filter to include upcoming event starting today.");
  assert(!todaySlugs.includes(futureEvent.slug), "Expected today Home filter to exclude future event.");
  assert(today.events.every((event: any) => Array.isArray(event.markets) && event.markets.length > 0), "Expected today Home route to include compact mobile markets.");

  const summary = {
    pass: true,
    cycle: "Cycle KJ",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    query: {
      includeMobileMarkets: true,
      sportKey: "soccer",
      leagueKey: "world_cup",
      statusGroups: ["live", "today"],
    },
    seededEvents: {
      live: { id: liveEvent.id, slug: liveEvent.slug, status: liveEvent.status, startTime: liveEvent.startTime?.toISOString() },
      today: { id: todayEvent.id, slug: todayEvent.slug, status: todayEvent.status, startTime: todayEvent.startTime?.toISOString() },
      future: { id: futureEvent.id, slug: futureEvent.slug, status: futureEvent.status, startTime: futureEvent.startTime?.toISOString() },
    },
    results: {
      allSlugs,
      liveSlugs,
      todaySlugs,
      todayCompactMarketCounts: today.events.map((event: any) => ({ slug: event.slug, markets: event.markets.length })),
      nextCursor: {
        all: all.nextCursor ?? null,
        live: live.nextCursor ?? null,
        today: today.nextCursor ?? null,
      },
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
