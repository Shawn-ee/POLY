import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getPortfolio } from "@/app/api/portfolio/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JU-portfolio-contract-side-snapshot/cycle-JU-portfolio-contract-side-snapshot.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_ju_${suffix}`,
      email: `mobile-ju-${suffix}@example.test`,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-ju-${suffix}`,
    scopes: ["account:read"],
  });

  await prisma.userBalance.create({
    data: {
      userId: user.id,
      availableUSDC: dec("125.50"),
      lockedUSDC: dec("14.50"),
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-ju-portfolio-${suffix}`,
      title: `JU Portfolio Contract Side ${suffix}`,
      description: "Disposable event proving mobile portfolio contract-side snapshots.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "JU Home",
      awayTeamName: "JU Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-ju-market-${suffix}`,
          title: "JU No contract spread",
          description: "JU no-contract side market.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "spread",
          marketGroupKey: "spreads",
          marketGroupTitle: "Spread",
          displayOrder: 0,
          period: "regulation",
          line: dec("1.5"),
          referenceSource: "polymarket",
          externalSlug: `ju-contract-side-${suffix}`,
          externalMarketId: `gamma-ju-contract-side-${suffix}`,
          conditionId: `condition-ju-contract-side-${suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Yes",
                label: "JU Home +1.5",
                side: "yes",
                code: "YES",
                slug: `mobile-ju-outcome-yes-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-ju-yes-${suffix}`,
                referenceOutcomeLabel: "JU Home +1.5",
              },
              {
                name: "No",
                label: "No JU Home +1.5",
                side: "no",
                code: "NO",
                slug: `mobile-ju-outcome-no-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-ju-no-${suffix}`,
                referenceOutcomeLabel: "No JU Home +1.5",
              },
            ],
          },
        }],
      },
    },
    include: {
      markets: {
        include: {
          outcomes: true,
        },
      },
    },
  });

  const market = event.markets[0];
  assert(market, "Expected proof market.");
  const noOutcome = market.outcomes.find((outcome) => outcome.side === "no");
  assert(noOutcome, "Expected proof No outcome.");

  const selection = {
    marketId: market.id,
    outcomeId: noOutcome.id,
    marketGroupId: "spreads",
    marketType: "spread",
    line: "1.5",
    period: "regulation",
    side: "no",
    displayLabel: "No JU Home +1.5",
    contractSide: "no",
    referenceSource: "polymarket",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    referenceTokenId: noOutcome.referenceTokenId,
    referenceOutcomeLabel: noOutcome.referenceOutcomeLabel,
    limitPrice: 0.42,
    limitSide: "ask",
    limitShares: 80,
  };

  await prisma.position.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: noOutcome.id,
      shares: dec("25"),
      avgCost: dec("0.42"),
      reservedShares: dec("0"),
      realizedPnl: dec("0"),
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: noOutcome.id,
      createdApiCredentialId: credential.apiKey.id,
      side: "SELL",
      price: dec("0.42"),
      amount: dec("10"),
      remaining: dec("10"),
      reservedNotional: dec("0"),
      status: "OPEN",
    },
  });

  await prisma.apiOrderRequest.create({
    data: {
      userId: user.id,
      apiCredentialId: credential.apiKey.id,
      idempotencyKey: `mobile-ju-${suffix}`,
      requestFingerprint: `mobile-ju-${suffix}`,
      requestBody: {
        marketId: market.id,
        outcomeId: noOutcome.id,
        side: "SELL",
        contractSide: "NO",
        selection,
      },
      submittedNotional: dec("4.20"),
      status: "SUCCEEDED",
      orderId: order.id,
      responseStatus: 200,
      responseBody: { order: { id: order.id } },
    },
  });

  const response = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(response.status === 200, `Expected /api/portfolio status 200, received ${response.status}.`);
  const body = await response.json();
  const position = body.positions.find((item: any) => item.market.id === market.id);
  const openOrder = body.openOrders.find((item: any) => item.id === order.id);
  assert(position, "Expected proof position in portfolio response.");
  assert(openOrder, "Expected proof open order in portfolio response.");
  assert(position.selection?.contractSide === "no", "Expected position selection contractSide=no.");
  assert(openOrder.selection?.contractSide === "no", "Expected open order selection contractSide=no.");
  assert(position.selection?.referenceTokenId === noOutcome.referenceTokenId, "Expected position provider token.");
  assert(openOrder.selection?.limitSide === "ask", "Expected open order limit side.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/portfolio",
    auth: "canonical account:read API key",
    walletAvailableUSDC: body.walletAvailableUSDC,
    walletLockedUSDC: body.walletLockedUSDC,
    position: {
      marketId: position.market.id,
      outcomeId: position.outcomeId,
      contractSide: position.selection.contractSide,
      displayLabel: position.selection.displayLabel,
      referenceTokenId: position.selection.referenceTokenId,
    },
    openOrder: {
      id: openOrder.id,
      side: openOrder.side,
      contractSide: openOrder.selection.contractSide,
      limitSide: openOrder.selection.limitSide,
      limitPrice: openOrder.selection.limitPrice,
      referenceTokenId: openOrder.selection.referenceTokenId,
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
