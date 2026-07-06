import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { loadLiveEventFeed } from "../mobile/src/services/liveEventFeedService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KU-live-tab-feed-contract/cycle-KU-live-tab-feed-contract.json";

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

const createEvent = async (suffix: string, status: "live" | "upcoming") =>
  prisma.event.create({
    data: {
      slug: `mobile-ku-${status}-${suffix}`,
      title: `KU ${status} Mexico vs Ecuador ${suffix}`,
      description: `Disposable ${status} event proving Live tab backend feed.`,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status,
      liveStatus: status === "live" ? "in_progress" : null,
      startTime: new Date(),
      homeTeamName: "Mexico",
      awayTeamName: "Ecuador",
      markets: {
        create: [{
          slug: `mobile-ku-${status}-winner-${suffix}`,
          title: "KU Match Winner",
          description: "KU match market.",
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
                slug: `mobile-ku-${status}-mexico-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Ecuador",
                label: "Ecuador",
                side: "away",
                code: "ECU",
                slug: `mobile-ku-${status}-ecuador-${suffix}`,
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

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const liveEvent = await createEvent(suffix, "live");
  const upcomingEvent = await createEvent(suffix, "upcoming");

  const query = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    search: suffix,
    includeMobileMarkets: "1",
    statusGroup: "live",
    limit: "10",
  });
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected Live tab route status 200, received ${response.status}.`);
  const body = await response.json();
  const slugs = body.events.map((event: any) => event.slug);
  assert(slugs.includes(liveEvent.slug), "Expected live event in Live tab route response.");
  assert(!slugs.includes(upcomingEvent.slug), "Expected upcoming event to be excluded from Live tab route response.");

  const feed = await loadLiveEventFeed({
    listWorldCupEvents: async (input) => {
      assert(typeof input === "object" && input.statusGroup === "live", "Expected mobile service to request statusGroup=live.");
      return body;
    },
  });

  assert(feed.source === "events-route-statusGroup-live", "Expected mobile feed source marker.");
  assert(feed.events.length === 1, `Expected exactly one mobile live event, received ${feed.events.length}.`);
  assert(feed.events[0].status === "live", "Expected mobile normalized live event.");

  const summary = {
    pass: true,
    cycle: "Cycle KU",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    query: Object.fromEntries(query.entries()),
    seeded: {
      liveEvent: { id: liveEvent.id, slug: liveEvent.slug },
      excludedUpcomingEvent: { id: upcomingEvent.id, slug: upcomingEvent.slug },
    },
    routeResults: {
      slugs,
      eventCount: body.events.length,
      nextCursor: body.nextCursor ?? body.page?.nextCursor ?? null,
    },
    mobileLiveFeed: {
      source: feed.source,
      eventCount: feed.events.length,
      statuses: feed.events.map((event) => event.status),
      marketCounts: feed.events.map((event) => event.markets.length),
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
