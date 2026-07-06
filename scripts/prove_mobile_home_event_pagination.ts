import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JR-home-event-list-pagination/cycle-JR-home-event-pagination.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createHomeProofEvent(params: { suffix: string; index: number }) {
  const start = new Date(Date.now() + (params.index + 1) * 60 * 60 * 1000);
  const title = `JR Home Page ${params.index} vs Backend ${params.suffix}`;
  return prisma.event.create({
    data: {
      slug: `mobile-jr-home-page-${params.index}-${params.suffix}`,
      title,
      description: "Disposable event proving backend Home list cursor pagination.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `JR Home ${params.index}`,
      awayTeamName: "JR Backend",
      status: "upcoming",
      startTime: start,
      markets: {
        create: [{
          slug: `mobile-jr-home-market-${params.index}-${params.suffix}`,
          title: `${title} - Regulation Time Winner`,
          description: "JR Home pagination proof market.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "moneyline",
          marketGroupKey: "main",
          marketGroupTitle: "Regulation Time Winner",
          displayOrder: 0,
          period: "regulation",
          line: dec("0"),
          referenceSource: "polymarket",
          externalSlug: `jr-home-market-${params.index}-${params.suffix}`,
          externalMarketId: `gamma-jr-home-${params.index}-${params.suffix}`,
          conditionId: `condition-jr-home-${params.index}-${params.suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: `JR Home ${params.index}`,
                label: `JR Home ${params.index}`,
                side: "home",
                code: "HOME",
                slug: `mobile-jr-home-outcome-home-${params.index}-${params.suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jr-home-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: `JR Home ${params.index}`,
              },
              {
                name: "Tie",
                label: "Tie",
                side: "draw",
                code: "DRAW",
                slug: `mobile-jr-home-outcome-draw-${params.index}-${params.suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jr-draw-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: "Tie",
              },
              {
                name: "JR Backend",
                label: "JR Backend",
                side: "away",
                code: "AWAY",
                slug: `mobile-jr-home-outcome-away-${params.index}-${params.suffix}`,
                displayOrder: 2,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jr-away-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: "JR Backend",
              },
            ],
          },
        }],
      },
    },
  });
}

async function readEvents(params: { limit: number; cursor?: string | null; search: string }) {
  const query = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    includeMobileMarkets: "1",
    limit: String(params.limit),
    search: params.search,
  });
  if (params.cursor) query.set("cursor", params.cursor);
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected /api/events status 200, received ${response.status}.`);
  return response.json();
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  await Promise.all([0, 1, 2].map((index) => createHomeProofEvent({ suffix, index })));

  const firstPage = await readEvents({ limit: 2, search: suffix });
  assert(firstPage.events.length === 2, `Expected first page of 2 events, received ${firstPage.events.length}.`);
  assert(firstPage.nextCursor, "Expected first page to return nextCursor.");
  assert(firstPage.page?.hasMore === true, "Expected first page hasMore=true.");
  assert(firstPage.events.every((event: any) => event.markets?.length > 0), "Expected first page events to include compact markets.");

  const secondPage = await readEvents({ limit: 2, cursor: firstPage.nextCursor, search: suffix });
  assert(secondPage.events.length === 1, `Expected second page of 1 event, received ${secondPage.events.length}.`);
  assert(secondPage.nextCursor === null, "Expected second page to end pagination.");
  assert(secondPage.page?.hasMore === false, "Expected second page hasMore=false.");
  assert(secondPage.events.every((event: any) => event.markets?.length > 0), "Expected second page events to include compact markets.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=2&cursor=<event-id>",
    firstPage: {
      count: firstPage.events.length,
      nextCursor: firstPage.nextCursor,
      hasMore: firstPage.page.hasMore,
      slugs: firstPage.events.map((event: any) => event.slug),
    },
    secondPage: {
      count: secondPage.events.length,
      nextCursor: secondPage.nextCursor,
      hasMore: secondPage.page.hasMore,
      slugs: secondPage.events.map((event: any) => event.slug),
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(summary, null, 2));
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
