import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getPortfolioHistory } from "@/app/api/portfolio/history/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JV-portfolio-history-contract-side/cycle-JV-portfolio-history-contract-side.json";
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
      username: `mobile_jv_${suffix}`,
      email: `mobile-jv-${suffix}@example.test`,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-jv-${suffix}`,
    scopes: ["account:read"],
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-jv-history-${suffix}`,
      title: `JV Portfolio History ${suffix}`,
      description: "Disposable event proving mobile portfolio history contract-side snapshots.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "JV Home",
      awayTeamName: "JV Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-jv-market-${suffix}`,
          title: "JV No contract total",
          description: "JV no-contract side history market.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "totals",
          marketGroupKey: "totals",
          marketGroupTitle: "Totals",
          displayOrder: 0,
          period: "regulation",
          line: dec("2.5"),
          referenceSource: "polymarket",
          externalSlug: `jv-contract-side-${suffix}`,
          externalMarketId: `gamma-jv-contract-side-${suffix}`,
          conditionId: `condition-jv-contract-side-${suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Yes",
                label: "Over 2.5",
                side: "yes",
                code: "YES",
                slug: `mobile-jv-outcome-yes-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jv-yes-${suffix}`,
                referenceOutcomeLabel: "Over 2.5",
              },
              {
                name: "No",
                label: "No Over 2.5",
                side: "no",
                code: "NO",
                slug: `mobile-jv-outcome-no-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jv-no-${suffix}`,
                referenceOutcomeLabel: "No Over 2.5",
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
    marketGroupId: "totals",
    marketType: "totals",
    line: "2.5",
    period: "regulation",
    side: "no",
    displayLabel: "No Over 2.5",
    contractSide: "no",
    referenceSource: "polymarket",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    referenceTokenId: noOutcome.referenceTokenId,
    referenceOutcomeLabel: noOutcome.referenceOutcomeLabel,
    limitPrice: 0.38,
    limitSide: "bid",
    limitShares: 40,
  };

  const canceledOrder = await prisma.order.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: noOutcome.id,
      createdApiCredentialId: credential.apiKey.id,
      canceledByApiCredentialId: credential.apiKey.id,
      side: "BUY",
      price: dec("0.38"),
      amount: dec("40"),
      remaining: dec("40"),
      reservedNotional: dec("0"),
      status: "CANCELED",
    },
  });
  await prisma.apiOrderRequest.create({
    data: {
      userId: user.id,
      apiCredentialId: credential.apiKey.id,
      idempotencyKey: `mobile-jv-canceled-${suffix}`,
      requestFingerprint: `mobile-jv-canceled-${suffix}`,
      requestBody: {
        marketId: market.id,
        outcomeId: noOutcome.id,
        side: "BUY",
        contractSide: "NO",
        selection,
      },
      submittedNotional: dec("15.20"),
      status: "SUCCEEDED",
      orderId: canceledOrder.id,
      responseStatus: 200,
      responseBody: { order: { id: canceledOrder.id } },
    },
  });

  const filledOrder = await prisma.order.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: noOutcome.id,
      createdApiCredentialId: credential.apiKey.id,
      side: "BUY",
      price: dec("0.38"),
      amount: dec("10"),
      remaining: dec("0"),
      reservedNotional: dec("0"),
      status: "FILLED",
    },
  });
  await prisma.apiOrderRequest.create({
    data: {
      userId: user.id,
      apiCredentialId: credential.apiKey.id,
      idempotencyKey: `mobile-jv-filled-${suffix}`,
      requestFingerprint: `mobile-jv-filled-${suffix}`,
      requestBody: {
        marketId: market.id,
        outcomeId: noOutcome.id,
        side: "BUY",
        contractSide: "NO",
        selection,
      },
      submittedNotional: dec("3.80"),
      status: "SUCCEEDED",
      orderId: filledOrder.id,
      responseStatus: 200,
      responseBody: { order: { id: filledOrder.id } },
    },
  });
  const trade = await prisma.trade.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: noOutcome.id,
      side: "BUY",
      shares: dec("10"),
      cost: dec("3.80"),
      fee: dec("0"),
    },
  });

  const response = await getPortfolioHistory(
    new NextRequest("http://localhost/api/portfolio/history", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(response.status === 200, `Expected /api/portfolio/history status 200, received ${response.status}.`);
  const body = await response.json();
  const canceled = body.canceledOrders.find((item: any) => item.id === canceledOrder.id);
  const recent = body.recentTrades.find((item: any) => item.id === trade.id);
  assert(canceled, "Expected canceled order in portfolio history response.");
  assert(recent, "Expected recent trade in portfolio history response.");
  assert(canceled.selection?.contractSide === "no", "Expected canceled order contractSide=no.");
  assert(recent.selection?.contractSide === "no", "Expected recent trade contractSide=no.");
  assert(canceled.selection?.referenceTokenId === noOutcome.referenceTokenId, "Expected canceled provider token.");
  assert(recent.selection?.limitSide === "bid", "Expected recent trade limit side.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/portfolio/history",
    auth: "canonical account:read API key",
    canceledOrder: {
      id: canceled.id,
      contractSide: canceled.selection.contractSide,
      displayLabel: canceled.selection.displayLabel,
      referenceTokenId: canceled.selection.referenceTokenId,
      limitSide: canceled.selection.limitSide,
    },
    recentTrade: {
      id: recent.id,
      contractSide: recent.selection.contractSide,
      displayLabel: recent.selection.displayLabel,
      referenceTokenId: recent.selection.referenceTokenId,
      limitSide: recent.selection.limitSide,
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
