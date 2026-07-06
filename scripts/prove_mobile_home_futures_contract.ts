import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { normalizeMarket } from "../mobile/src/adapters/worldCupAdapter";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KQ-home-futures-contract/cycle-KQ-home-futures-contract.json";

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
  const futuresEvent = await prisma.event.create({
    data: {
      slug: `mobile-kq-futures-${suffix}`,
      title: `KQ World Cup futures ${suffix}`,
      description: "Disposable event proving Home futures are backend-filtered.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "futures",
      status: "upcoming",
      startTime: null,
      markets: {
        create: [
          {
            slug: `mobile-kq-world-cup-winner-${suffix}`,
            title: "KQ World Cup Winner",
            description: "KQ backend future market.",
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
                  slug: `mobile-kq-france-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                },
                {
                  name: "Brazil",
                  label: "Brazil",
                  side: "yes",
                  code: "BRA",
                  slug: `mobile-kq-brazil-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                },
              ],
            },
          },
          {
            slug: `mobile-kq-non-future-${suffix}`,
            title: "KQ Non Future Winner",
            description: "Should be filtered from futures route.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "winner",
            marketGroupKey: "winner",
            marketGroupTitle: "Match Winner",
            displayOrder: 1,
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "Home",
                  label: "Home",
                  side: "home",
                  code: "HOME",
                  slug: `mobile-kq-home-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      slug: `mobile-kq-no-future-${suffix}`,
      title: `KQ non futures event ${suffix}`,
      description: "Disposable non-futures event.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "upcoming",
      markets: {
        create: [{
          slug: `mobile-kq-no-future-market-${suffix}`,
          title: "KQ regular market",
          description: "Regular market should not appear.",
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
            create: [{ name: "Home", label: "Home", side: "home", code: "HOME", slug: `mobile-kq-regular-home-${suffix}`, displayOrder: 0, isActive: true, isTradable: true }],
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
  assert(response.status === 200, `Expected Home futures route status 200, received ${response.status}.`);
  const body = await response.json();
  const returnedSlugs = body.events.map((event: any) => event.slug);
  assert(returnedSlugs.includes(futuresEvent.slug), "Expected futures event in backend futures response.");
  assert(body.events.every((event: any) => event.markets.every((market: any) => market.marketType === "future")), "Expected only future markets in mobile futures response.");
  assert(body.events.every((event: any) => event.markets.length > 0), "Expected every returned futures event to include compact future markets.");

  const normalizedFutures = body.events.flatMap((event: any) => event.markets.map(normalizeMarket));
  assert(normalizedFutures.length === 1, `Expected exactly one normalized future market, received ${normalizedFutures.length}.`);
  assert(normalizedFutures[0].type === "future", "Expected mobile normalized market type=future.");
  assert(normalizedFutures[0].outcomes.length === 2, "Expected normalized future outcomes.");

  const summary = {
    pass: true,
    cycle: "Cycle KQ",
    createdAt: new Date().toISOString(),
    route: "/api/events",
    query: Object.fromEntries(query.entries()),
    seeded: {
      futuresEvent: { id: futuresEvent.id, slug: futuresEvent.slug },
    },
    routeResults: {
      slugs: returnedSlugs,
      eventCount: body.events.length,
      marketTypes: body.events.flatMap((event: any) => event.markets.map((market: any) => market.marketType)),
    },
    mobileFutures: normalizedFutures.map((market) => ({
      id: market.id,
      title: market.title,
      type: market.type,
      marketType: market.marketType,
      outcomeCount: market.outcomes.length,
    })),
    mobileBehavior: {
      homeFuturesRouteParam: "marketType=future",
      fixtureFallbackIsolated: true,
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
