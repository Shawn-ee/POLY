import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getPortfolioValueHistory } from "@/app/api/portfolio/value-history/route";
import { loadPortfolioValueHistory } from "../mobile/src/services/portfolioValueHistoryService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KP-portfolio-value-history-contract/cycle-KP-portfolio-value-history-contract.json";
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

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_kp_value_history_${suffix}`,
      email: `mobile-kp-value-history-${suffix}@example.test`,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-kp-value-history-${suffix}`,
    scopes: ["account:read"],
  });

  await prisma.userBalance.create({
    data: {
      userId: user.id,
      availableUSDC: dec("40.86"),
      lockedUSDC: dec("0"),
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-kp-value-history-${suffix}`,
      title: `KP Portfolio Value History ${suffix}`,
      description: "Disposable event proving Portfolio value history route wiring.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "KP Home",
      awayTeamName: "KP Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-kp-value-history-market-${suffix}`,
          title: "KP Portfolio value market",
          description: "KP value history proof market.",
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
                name: "Yes",
                label: "KP Home",
                side: "yes",
                code: "YES",
                slug: `mobile-kp-value-history-yes-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
              },
              {
                name: "No",
                label: "KP Away",
                side: "no",
                code: "NO",
                slug: `mobile-kp-value-history-no-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
              },
            ],
          },
        }],
      },
    },
    include: { markets: { include: { outcomes: true } } },
  });
  const market = event.markets[0];
  const yesOutcome = market?.outcomes.find((outcome) => outcome.side === "yes");
  assert(market && yesOutcome, "Expected proof market and outcome.");

  await prisma.position.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: yesOutcome.id,
      shares: dec("100"),
      avgCost: dec("0.80"),
      reservedShares: dec("0"),
      realizedPnl: dec("0"),
    },
  });

  const now = new Date();
  await prisma.marketOutcomeSnapshot.createMany({
    data: [
      {
        marketId: market.id,
        outcomeId: yesOutcome.id,
        ts: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        price: dec("0.91"),
      },
      {
        marketId: market.id,
        outcomeId: yesOutcome.id,
        ts: now,
        price: dec("1.00"),
      },
    ],
  });

  const response = await getPortfolioValueHistory(
    new NextRequest("http://localhost/api/portfolio/value-history?range=1D", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  const routeHistory = await response.json();
  assert(response.status === 200, `Expected portfolio value history status 200, received ${response.status}.`);
  assert(routeHistory.source === "portfolio-value-history-route", "Expected portfolio value route source.");
  assert(routeHistory.status === "ready", "Expected ready portfolio value history.");
  assert(routeHistory.points.length === 6, `Expected 6 route points, received ${routeHistory.points.length}.`);

  const mobileHistory = await loadPortfolioValueHistory({
    getPortfolioValueHistory: async () => routeHistory,
    range: "1D",
  });
  const latest = mobileHistory.points.at(-1);
  assert(latest, "Expected latest mobile value-history point.");
  assert(latest.value === 140.86, `Expected latest portfolio value 140.86, received ${latest.value}.`);

  const summary = {
    pass: true,
    cycle: "Cycle KP",
    createdAt: new Date().toISOString(),
    route: "/api/portfolio/value-history",
    account: {
      userId: user.id,
      auth: "canonical API key with account:read",
    },
    seeded: {
      marketId: market.id,
      outcomeId: yesOutcome.id,
      shares: 100,
      cash: 40.86,
      latestPrice: 1,
    },
    routeHistory: {
      source: routeHistory.source,
      status: routeHistory.status,
      range: routeHistory.range,
      pointCount: routeHistory.points.length,
      latest,
    },
    mobileHistory: {
      source: mobileHistory.source,
      status: mobileHistory.status,
      range: mobileHistory.range,
      pointCount: mobileHistory.points.length,
      latestValue: latest.value,
    },
    mobileBehavior: {
      portfolioRouteClient: "PolyApi.getPortfolioValueHistory(range)",
      portfolioScreenSourceMarker: "portfolio-value-history-source-portfolio-value-history-route",
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
