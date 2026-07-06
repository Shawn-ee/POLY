import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JX-trade-ticket-submit-contract/cycle-JX-trade-ticket-submit-contract.json";
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
      username: `mobile_jx_${suffix}`,
      email: `mobile-jx-${suffix}@example.test`,
      isAdmin: true,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-jx-${suffix}`,
    scopes: ["orders:write", "account:read"],
  });

  await prisma.userBalance.create({
    data: {
      userId: user.id,
      availableUSDC: dec("100.00"),
      lockedUSDC: dec("0"),
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-jx-submit-${suffix}`,
      title: `JX Trade Ticket Submit ${suffix}`,
      description: "Disposable event proving mobile trade-ticket submit contract.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "JX Home",
      awayTeamName: "JX Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-jx-market-${suffix}`,
          title: "JX No contract spread",
          description: "JX no-contract ticket submit proof.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "spread",
          marketGroupKey: "spreads",
          marketGroupTitle: "Spreads",
          displayOrder: 0,
          period: "regulation",
          line: dec("1.5"),
          referenceSource: "polymarket",
          externalSlug: `jx-submit-${suffix}`,
          externalMarketId: `gamma-jx-submit-${suffix}`,
          conditionId: `condition-jx-submit-${suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Yes",
                label: "JX Home +1.5",
                side: "yes",
                code: "YES",
                slug: `mobile-jx-outcome-yes-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jx-yes-${suffix}`,
                referenceOutcomeLabel: "JX Home +1.5",
              },
              {
                name: "No",
                label: "No JX Home +1.5",
                side: "no",
                code: "NO",
                slug: `mobile-jx-outcome-no-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jx-no-${suffix}`,
                referenceOutcomeLabel: "No JX Home +1.5",
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

  await upsertReferenceQuoteSnapshots(market.outcomes.map((outcome, index) => ({
    marketId: market.id,
    outcomeId: outcome.id,
    source: "polymarket",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    tokenId: outcome.referenceTokenId,
    outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
    outcomePrice: index === 0 ? 0.62 : 0.38,
    bestBid: index === 0 ? 0.6 : 0.36,
    bestAsk: index === 0 ? 0.64 : 0.4,
    spread: 0.04,
    lastTradePrice: index === 0 ? 0.62 : 0.38,
    volume: 2500,
    volume24hr: 500,
    liquidity: 1800,
    liquidityClob: 2100,
    acceptingOrders: true,
    qualityStatus: "jx_submit_ready",
    mmEligible: false,
    reason: "jx_trade_ticket_submit_seed",
    fetchedAt: new Date(),
  })));

  const selection = {
    marketId: market.id,
    outcomeId: noOutcome.id,
    marketGroupId: "spreads",
    marketType: "spread",
    line: "1.5",
    period: "regulation",
    side: "no",
    displayLabel: "No JX Home +1.5",
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

  const clientOrderId = `mobile-jx-client-${suffix}`;
  const response = await createOrder(
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": clientOrderId,
      },
      body: JSON.stringify({
        marketId: market.id,
        outcomeId: noOutcome.id,
        side: "BUY",
        type: "LIMIT",
        price: "0.38",
        size: "20.00",
        contractSide: "NO",
        clientOrderId,
        selection,
      }),
    }),
  );
  assert(response.status === 200, `Expected submit status 200, received ${response.status}.`);
  const body = await response.json();
  assert(body.order?.id, "Expected route response order id.");
  assert(body.order?.status === "OPEN", `Expected open order response, received ${body.order?.status}.`);
  assert(body.order?.contractSide === "NO", "Expected response contractSide=NO.");
  assert(body.order?.selection?.contractSide === "no", "Expected response selection contractSide=no.");
  assert(body.order?.selection?.referenceTokenId === noOutcome.referenceTokenId, "Expected response provider token.");
  assert(body.order?.selection?.limitSide === "bid", "Expected response limit side.");

  const portfolioResponse = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(portfolioResponse.status === 200, `Expected portfolio status 200, received ${portfolioResponse.status}.`);
  const portfolio = await portfolioResponse.json();
  const openOrder = portfolio.openOrders.find((item: any) => item.id === body.order.id);
  assert(openOrder, "Expected submitted order in portfolio open orders.");
  assert(openOrder.selection?.contractSide === "no", "Expected portfolio open order contractSide=no.");
  assert(openOrder.selection?.referenceTokenId === noOutcome.referenceTokenId, "Expected portfolio open order provider token.");
  assert(openOrder.selection?.externalMarketId === market.externalMarketId, "Expected portfolio provider market id.");
  assert(openOrder.selection?.limitSide === "bid", "Expected portfolio limit side.");

  const replayResponse = await createOrder(
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": clientOrderId,
      },
      body: JSON.stringify({
        marketId: market.id,
        outcomeId: noOutcome.id,
        side: "BUY",
        type: "LIMIT",
        price: "0.38",
        size: "20.00",
        contractSide: "NO",
        clientOrderId,
        selection,
      }),
    }),
  );
  assert(replayResponse.status === 200, `Expected replay status 200, received ${replayResponse.status}.`);
  const replayBody = await replayResponse.json();
  assert(replayBody.order?.id === body.order.id, "Expected idempotent replay to return the same order id.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    submitRoute: "/api/orders",
    portfolioRoute: "/api/portfolio",
    auth: "canonical API key with orders:write and account:read",
    tradingGate: "internal beta enabled required",
    submittedOrder: {
      id: body.order.id,
      status: body.order.status,
      side: body.order.side,
      contractSide: body.order.contractSide,
      clientOrderId: body.order.clientOrderId,
      selectionContractSide: body.order.selection.contractSide,
      referenceTokenId: body.order.selection.referenceTokenId,
      limitSide: body.order.selection.limitSide,
    },
    portfolioOpenOrder: {
      id: openOrder.id,
      status: openOrder.status,
      contractSide: openOrder.selection.contractSide,
      externalMarketId: openOrder.selection.externalMarketId,
      referenceTokenId: openOrder.selection.referenceTokenId,
      limitSide: openOrder.selection.limitSide,
    },
    idempotentReplay: {
      sameOrderId: replayBody.order.id === body.order.id,
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
