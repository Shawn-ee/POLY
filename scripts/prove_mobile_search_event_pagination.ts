import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JS-search-event-pagination/cycle-JS-search-event-pagination.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createSearchProofEvent(params: { token: string; index: number }) {
  const start = new Date(Date.now() + (params.index + 1) * 90 * 60 * 1000);
  const title = `JS Backend Search ${params.index}`;
  return prisma.event.create({
    data: {
      slug: `mobile-js-search-page-${params.index}-${params.token}`,
      title,
      description: "Disposable event proving backend Search tab route pagination.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `JS Home ${params.index}`,
      awayTeamName: "JS Backend",
      status: params.index === 0 ? "live" : "upcoming",
      startTime: start,
      markets: {
        create: [{
          slug: `mobile-js-search-market-${params.index}-${params.token}`,
          title: `Searchable route market ${params.token}`,
          description: `Search proof market text ${params.token}.`,
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
          externalSlug: `js-search-market-${params.index}-${params.token}`,
          externalMarketId: `gamma-js-search-${params.index}-${params.token}`,
          conditionId: `condition-js-search-${params.index}-${params.token}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: `JS Outcome ${params.token}`,
                label: `JS Outcome ${params.token}`,
                side: "home",
                code: "HOME",
                slug: `mobile-js-search-outcome-home-${params.index}-${params.token}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-js-search-home-${params.index}-${params.token}`,
                referenceOutcomeLabel: `JS Outcome ${params.token}`,
              },
              {
                name: "Tie",
                label: "Tie",
                side: "draw",
                code: "DRAW",
                slug: `mobile-js-search-outcome-draw-${params.index}-${params.token}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-js-search-draw-${params.index}-${params.token}`,
                referenceOutcomeLabel: "Tie",
              },
              {
                name: "JS Backend",
                label: "JS Backend",
                side: "away",
                code: "AWAY",
                slug: `mobile-js-search-outcome-away-${params.index}-${params.token}`,
                displayOrder: 2,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-js-search-away-${params.index}-${params.token}`,
                referenceOutcomeLabel: "JS Backend",
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
  const token = `search${randomUUID().slice(0, 8)}`;
  await Promise.all([0, 1, 2].map((index) => createSearchProofEvent({ token, index })));

  const firstPage = await readEvents({ limit: 2, search: token });
  assert(firstPage.events.length === 2, `Expected first Search page of 2 events, received ${firstPage.events.length}.`);
  assert(firstPage.nextCursor, "Expected first Search page to return nextCursor.");
  assert(firstPage.page?.hasMore === true, "Expected first Search page hasMore=true.");
  assert(firstPage.events.every((event: any) => event.markets?.length > 0), "Expected Search events to include compact markets.");

  const secondPage = await readEvents({ limit: 2, cursor: firstPage.nextCursor, search: token });
  assert(secondPage.events.length === 1, `Expected second Search page of 1 event, received ${secondPage.events.length}.`);
  assert(secondPage.nextCursor === null, "Expected second Search page to end pagination.");
  assert(secondPage.page?.hasMore === false, "Expected second Search page hasMore=false.");
  assert(secondPage.events.every((event: any) => event.markets?.length > 0), "Expected second Search page events to include compact markets.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<market-or-outcome-text>&limit=2&cursor=<event-id>",
    searchTokenSource: "market title, market description, and outcome name/label",
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
