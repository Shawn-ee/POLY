import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { GET as getPortfolioHistory } from "@/app/api/portfolio/history/route";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JY-trade-ticket-filled-lifecycle/cycle-JY-trade-ticket-filled-lifecycle.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createUserWithCredential(prefix: string, scopes: string[]) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}-${suffix}@example.test`,
      isAdmin: true,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `${prefix}-${suffix}`,
    scopes,
  });
  return { user, credential, suffix };
}

async function submitOrder(input: {
  token: string;
  idempotencyKey: string;
  body: Record<string, unknown>;
}) {
  return createOrder(
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify(input.body),
    }),
  );
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const buyer = await createUserWithCredential(`mobile_jy_buyer_${suffix}`, ["orders:write", "account:read"]);
  const seller = await createUserWithCredential(`mobile_jy_seller_${suffix}`, ["orders:write", "account:read"]);

  await prisma.userBalance.create({
    data: {
      userId: buyer.user.id,
      availableUSDC: dec("100.00"),
      lockedUSDC: dec("0"),
    },
  });
  await prisma.userBalance.create({
    data: {
      userId: seller.user.id,
      availableUSDC: dec("40.00"),
      lockedUSDC: dec("0"),
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-jy-filled-${suffix}`,
      title: `JY Filled Ticket ${suffix}`,
      description: "Disposable event proving mobile trade-ticket filled lifecycle.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "JY Home",
      awayTeamName: "JY Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-jy-market-${suffix}`,
          title: "JY No contract total",
          description: "JY no-contract filled lifecycle proof.",
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
          externalSlug: `jy-filled-${suffix}`,
          externalMarketId: `gamma-jy-filled-${suffix}`,
          conditionId: `condition-jy-filled-${suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Yes",
                label: "Over 2.5",
                side: "yes",
                code: "YES",
                slug: `mobile-jy-outcome-yes-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jy-yes-${suffix}`,
                referenceOutcomeLabel: "Over 2.5",
              },
              {
                name: "No",
                label: "No Over 2.5",
                side: "no",
                code: "NO",
                slug: `mobile-jy-outcome-no-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jy-no-${suffix}`,
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
    qualityStatus: "jy_filled_ready",
    mmEligible: false,
    reason: "jy_trade_ticket_filled_seed",
    fetchedAt: new Date(),
  })));

  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: seller.user.id,
    quantity: dec("25"),
  });

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
    limitSide: "ask",
    limitShares: 20,
  };

  const sellerResponse = await submitOrder({
    token: seller.credential.token,
    idempotencyKey: `mobile-jy-sell-${suffix}`,
    body: {
      marketId: market.id,
      outcomeId: noOutcome.id,
      side: "SELL",
      type: "LIMIT",
      price: "0.38",
      size: "20.00",
      contractSide: "NO",
      clientOrderId: `mobile-jy-sell-${suffix}`,
      selection: { ...selection, limitSide: "ask" },
    },
  });
  assert(sellerResponse.status === 200, `Expected maker sell status 200, received ${sellerResponse.status}.`);
  const sellerBody = await sellerResponse.json();
  assert(sellerBody.order?.status === "OPEN", `Expected maker order OPEN, received ${sellerBody.order?.status}.`);

  const buyerResponse = await submitOrder({
    token: buyer.credential.token,
    idempotencyKey: `mobile-jy-buy-${suffix}`,
    body: {
      marketId: market.id,
      outcomeId: noOutcome.id,
      side: "BUY",
      type: "LIMIT",
      price: "0.38",
      size: "20.00",
      contractSide: "NO",
      clientOrderId: `mobile-jy-buy-${suffix}`,
      selection: { ...selection, limitSide: "bid" },
    },
  });
  assert(buyerResponse.status === 200, `Expected taker buy status 200, received ${buyerResponse.status}.`);
  const buyerBody = await buyerResponse.json();
  assert(buyerBody.order?.id, "Expected buyer order id.");
  assert(buyerBody.order?.status === "FILLED", `Expected buyer order FILLED, received ${buyerBody.order?.status}.`);
  assert(buyerBody.order?.remaining === "0", `Expected buyer remaining 0, received ${buyerBody.order?.remaining}.`);
  assert(buyerBody.order?.selection?.contractSide === "no", "Expected buyer response contractSide=no.");
  assert(buyerBody.fills?.length === 1, `Expected exactly one fill, received ${buyerBody.fills?.length ?? 0}.`);
  assert(buyerBody.position?.shares === "20", `Expected buyer position shares 20, received ${buyerBody.position?.shares}.`);

  const portfolioResponse = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${buyer.credential.token}` },
    }),
  );
  assert(portfolioResponse.status === 200, `Expected buyer portfolio status 200, received ${portfolioResponse.status}.`);
  const portfolio = await portfolioResponse.json();
  const position = portfolio.positions.find((item: any) => item.market.id === market.id && item.outcomeId === noOutcome.id);
  assert(position, "Expected filled buyer position in portfolio.");
  assert(position.selection?.contractSide === "no", "Expected portfolio position contractSide=no.");
  assert(position.selection?.referenceTokenId === noOutcome.referenceTokenId, "Expected portfolio position provider token.");
  assert(position.selection?.externalMarketId === market.externalMarketId, "Expected portfolio position provider market id.");
  assert(position.shares === 20, `Expected portfolio shares 20, received ${position.shares}.`);

  const historyResponse = await getPortfolioHistory(
    new NextRequest("http://localhost/api/portfolio/history", {
      headers: { Authorization: `Bearer ${buyer.credential.token}` },
    }),
  );
  assert(historyResponse.status === 200, `Expected buyer history status 200, received ${historyResponse.status}.`);
  const history = await historyResponse.json();
  const recentTrade = history.recentTrades.find((item: any) => item.market.id === market.id && item.outcome.id === noOutcome.id);
  assert(recentTrade, "Expected buyer recent trade in portfolio history.");
  assert(recentTrade.selection?.contractSide === "no", "Expected recent trade contractSide=no.");
  assert(recentTrade.selection?.referenceTokenId === noOutcome.referenceTokenId, "Expected recent trade provider token.");
  assert(recentTrade.selection?.limitSide === "bid", "Expected recent trade buyer limit side.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    submitRoute: "/api/orders",
    portfolioRoute: "/api/portfolio",
    historyRoute: "/api/portfolio/history",
    auth: "canonical API keys with orders:write and account:read",
    tradingGate: "internal beta enabled required",
    makerOrder: {
      id: sellerBody.order.id,
      status: sellerBody.order.status,
      side: sellerBody.order.side,
      remaining: sellerBody.order.remaining,
    },
    takerOrder: {
      id: buyerBody.order.id,
      status: buyerBody.order.status,
      side: buyerBody.order.side,
      remaining: buyerBody.order.remaining,
      contractSide: buyerBody.order.contractSide,
      selectionContractSide: buyerBody.order.selection.contractSide,
      referenceTokenId: buyerBody.order.selection.referenceTokenId,
      fills: buyerBody.fills.length,
      filledSize: buyerBody.fills[0].size,
    },
    portfolioPosition: {
      marketId: position.market.id,
      outcomeId: position.outcomeId,
      shares: position.shares,
      contractSide: position.selection.contractSide,
      externalMarketId: position.selection.externalMarketId,
      referenceTokenId: position.selection.referenceTokenId,
    },
    recentTrade: {
      id: recentTrade.id,
      side: recentTrade.side,
      shares: recentTrade.shares,
      contractSide: recentTrade.selection.contractSide,
      referenceTokenId: recentTrade.selection.referenceTokenId,
      limitSide: recentTrade.selection.limitSide,
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
