import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JT-search-status-filters/cycle-JT-search-status-filters.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createStatusProofEvent(params: { token: string; index: number; status: "live" | "upcoming" }) {
  const title = `JT Backend Status ${params.index}`;
  return prisma.event.create({
    data: {
      slug: `mobile-jt-search-${params.status}-${params.index}-${params.token}`,
      title,
      description: `Disposable Search status proof ${params.token}.`,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `JT ${params.status} ${params.index}`,
      awayTeamName: "JT Backend",
      status: params.status,
      startTime: new Date(Date.now() + (params.index + 1) * 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-jt-search-market-${params.status}-${params.index}-${params.token}`,
          title: `JT Search status ${params.token}`,
          description: `JT filter proof market ${params.token}.`,
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
          externalSlug: `jt-status-market-${params.status}-${params.index}-${params.token}`,
          externalMarketId: `gamma-jt-status-${params.status}-${params.index}-${params.token}`,
          conditionId: `condition-jt-status-${params.status}-${params.index}-${params.token}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: `JT ${params.status}`,
                label: `JT ${params.status}`,
                side: "home",
                code: "HOME",
                slug: `mobile-jt-search-outcome-home-${params.status}-${params.index}-${params.token}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jt-home-${params.status}-${params.index}-${params.token}`,
                referenceOutcomeLabel: `JT ${params.status}`,
              },
              {
                name: "Tie",
                label: "Tie",
                side: "draw",
                code: "DRAW",
                slug: `mobile-jt-search-outcome-draw-${params.status}-${params.index}-${params.token}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jt-draw-${params.status}-${params.index}-${params.token}`,
                referenceOutcomeLabel: "Tie",
              },
              {
                name: "JT Backend",
                label: "JT Backend",
                side: "away",
                code: "AWAY",
                slug: `mobile-jt-search-outcome-away-${params.status}-${params.index}-${params.token}`,
                displayOrder: 2,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jt-away-${params.status}-${params.index}-${params.token}`,
                referenceOutcomeLabel: "JT Backend",
              },
            ],
          },
        }],
      },
    },
  });
}

async function readEvents(params: { search: string; statusGroup: "live" | "upcoming" }) {
  const query = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    includeMobileMarkets: "1",
    limit: "10",
    search: params.search,
    statusGroup: params.statusGroup,
  });
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected /api/events status 200, received ${response.status}.`);
  return response.json();
}

async function main() {
  const token = `filter${randomUUID().slice(0, 8)}`;
  await Promise.all([
    createStatusProofEvent({ token, index: 0, status: "live" }),
    createStatusProofEvent({ token, index: 1, status: "live" }),
    createStatusProofEvent({ token, index: 2, status: "upcoming" }),
    createStatusProofEvent({ token, index: 3, status: "upcoming" }),
  ]);

  const livePage = await readEvents({ search: token, statusGroup: "live" });
  const upcomingPage = await readEvents({ search: token, statusGroup: "upcoming" });

  assert(livePage.events.length === 2, `Expected 2 live Search events, received ${livePage.events.length}.`);
  assert(upcomingPage.events.length === 2, `Expected 2 upcoming Search events, received ${upcomingPage.events.length}.`);
  assert(livePage.events.every((event: any) => event.status === "live"), "Expected live filter to return only live events.");
  assert(upcomingPage.events.every((event: any) => event.status !== "live"), "Expected upcoming filter to exclude live events.");
  assert(livePage.events.every((event: any) => event.markets?.length > 0), "Expected live Search events to include compact markets.");
  assert(upcomingPage.events.every((event: any) => event.markets?.length > 0), "Expected upcoming Search events to include compact markets.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<query>&statusGroup=live|upcoming",
    live: {
      count: livePage.events.length,
      statuses: livePage.events.map((event: any) => event.status),
      slugs: livePage.events.map((event: any) => event.slug),
    },
    upcoming: {
      count: upcomingPage.events.length,
      statuses: upcomingPage.events.map((event: any) => event.status),
      slugs: upcomingPage.events.map((event: any) => event.slug),
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
