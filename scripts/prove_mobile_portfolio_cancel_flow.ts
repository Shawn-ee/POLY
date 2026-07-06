import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { DELETE as cancelOrder } from "@/app/api/orders/[id]/route";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { GET as getPortfolioHistory } from "@/app/api/portfolio/history/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JW-portfolio-cancel-flow/cycle-JW-portfolio-cancel-flow.json";
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
      username: `mobile_jw_${suffix}`,
      email: `mobile-jw-${suffix}@example.test`,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-jw-${suffix}`,
    scopes: ["account:read", "orders:write"],
  });

  await prisma.userBalance.create({
    data: {
      userId: user.id,
      availableUSDC: dec("100.00"),
      lockedUSDC: dec("7.60"),
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-jw-cancel-${suffix}`,
      title: `JW Portfolio Cancel ${suffix}`,
      description: "Disposable event proving mobile open-order cancel route contract.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "JW Home",
      awayTeamName: "JW Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-jw-market-${suffix}`,
          title: "JW No contract total",
          description: "JW cancel proof no-contract total.",
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
          externalSlug: `jw-cancel-${suffix}`,
          externalMarketId: `gamma-jw-cancel-${suffix}`,
          conditionId: `condition-jw-cancel-${suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Yes",
                label: "Over 2.5",
                side: "yes",
                code: "YES",
                slug: `mobile-jw-outcome-yes-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jw-yes-${suffix}`,
                referenceOutcomeLabel: "Over 2.5",
              },
              {
                name: "No",
                label: "No Over 2.5",
                side: "no",
                code: "NO",
                slug: `mobile-jw-outcome-no-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jw-no-${suffix}`,
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
    limitShares: 20,
  };

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: noOutcome.id,
      createdApiCredentialId: credential.apiKey.id,
      side: "BUY",
      price: dec("0.38"),
      amount: dec("20"),
      remaining: dec("20"),
      reservedNotional: dec("7.60"),
      status: "OPEN",
    },
  });

  await prisma.apiOrderRequest.create({
    data: {
      userId: user.id,
      apiCredentialId: credential.apiKey.id,
      idempotencyKey: `mobile-jw-open-${suffix}`,
      requestFingerprint: `mobile-jw-open-${suffix}`,
      clientOrderId: `mobile-jw-client-${suffix}`,
      requestBody: {
        marketId: market.id,
        outcomeId: noOutcome.id,
        side: "BUY",
        contractSide: "NO",
        selection,
      },
      submittedNotional: dec("7.60"),
      status: "SUCCEEDED",
      orderId: order.id,
      responseStatus: 200,
      responseBody: { order: { id: order.id } },
    },
  });

  const beforePortfolioResponse = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(beforePortfolioResponse.status === 200, `Expected pre-cancel portfolio status 200, received ${beforePortfolioResponse.status}.`);
  const beforePortfolio = await beforePortfolioResponse.json();
  const beforeOpenOrder = beforePortfolio.openOrders.find((item: any) => item.id === order.id);
  assert(beforeOpenOrder, "Expected open order before cancel.");
  assert(beforeOpenOrder.selection?.contractSide === "no", "Expected pre-cancel open order contractSide=no.");

  const cancelResponse = await cancelOrder(
    new NextRequest(`http://localhost/api/orders/${order.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
    { params: Promise.resolve({ id: order.id }) },
  );
  assert(cancelResponse.status === 200, `Expected cancel status 200, received ${cancelResponse.status}.`);
  const cancelBody = await cancelResponse.json();
  assert(cancelBody.order?.id === order.id, "Expected cancel response to confirm same order id.");
  assert(cancelBody.order?.status === "CANCELED", "Expected cancel response status CANCELED.");
  assert(cancelBody.order?.canceledByApiKeyId === credential.apiKey.keyId, "Expected cancel response canceledByApiKeyId.");
  assert(cancelBody.balance?.lockedUSDC === "0", "Expected cancel to unlock locked USDC.");

  const afterPortfolioResponse = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(afterPortfolioResponse.status === 200, `Expected post-cancel portfolio status 200, received ${afterPortfolioResponse.status}.`);
  const afterPortfolio = await afterPortfolioResponse.json();
  const afterOpenOrder = afterPortfolio.openOrders.find((item: any) => item.id === order.id);
  assert(!afterOpenOrder, "Expected canceled order to disappear from open orders.");

  const historyResponse = await getPortfolioHistory(
    new NextRequest("http://localhost/api/portfolio/history", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(historyResponse.status === 200, `Expected portfolio history status 200, received ${historyResponse.status}.`);
  const historyBody = await historyResponse.json();
  const canceledOrder = historyBody.canceledOrders.find((item: any) => item.id === order.id);
  assert(canceledOrder, "Expected canceled order in portfolio history.");
  assert(canceledOrder.selection?.contractSide === "no", "Expected canceled activity contractSide=no.");
  assert(canceledOrder.selection?.referenceTokenId === noOutcome.referenceTokenId, "Expected canceled activity provider token.");
  assert(canceledOrder.selection?.limitSide === "bid", "Expected canceled activity limit side.");

  const repeatedCancelResponse = await cancelOrder(
    new NextRequest(`http://localhost/api/orders/${order.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
    { params: Promise.resolve({ id: order.id }) },
  );
  assert(repeatedCancelResponse.status === 400, `Expected repeated cancel status 400, received ${repeatedCancelResponse.status}.`);
  const repeatedCancelBody = await repeatedCancelResponse.json();
  assert(repeatedCancelBody.error?.message === "Order cannot be canceled", "Expected repeated cancel to be rejected clearly.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    cancelRoute: "/api/orders/:id",
    portfolioRoute: "/api/portfolio",
    historyRoute: "/api/portfolio/history",
    auth: "canonical API key with orders:write and account:read",
    order: {
      id: order.id,
      cancelStatus: cancelBody.order.status,
      type: cancelBody.order.type,
      clientOrderId: cancelBody.order.clientOrderId,
      canceledByApiKeyId: cancelBody.order.canceledByApiKeyId,
    },
    preCancelOpenOrder: {
      id: beforeOpenOrder.id,
      contractSide: beforeOpenOrder.selection.contractSide,
      referenceTokenId: beforeOpenOrder.selection.referenceTokenId,
    },
    postCancel: {
      openOrderRemoved: !afterOpenOrder,
      lockedUSDC: cancelBody.balance.lockedUSDC,
      availableUSDC: cancelBody.balance.availableUSDC,
    },
    canceledActivity: {
      id: canceledOrder.id,
      side: canceledOrder.side,
      contractSide: canceledOrder.selection.contractSide,
      referenceTokenId: canceledOrder.selection.referenceTokenId,
      limitSide: canceledOrder.selection.limitSide,
    },
    repeatedCancel: {
      status: repeatedCancelResponse.status,
      message: repeatedCancelBody.error.message,
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
