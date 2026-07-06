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
import { submitTicketOrder } from "../mobile/src/services/orderService";
import type { PolyApi } from "../mobile/src/api";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KC-route-order-submit-selection-echo/cycle-KC-route-order-submit-selection-echo.json";
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
      username: `mobile_kc_${suffix}`,
      email: `mobile-kc-${suffix}@example.test`,
      isAdmin: true,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-kc-${suffix}`,
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
      slug: `mobile-kc-route-submit-${suffix}`,
      title: `KC Route Submit ${suffix}`,
      description: "Disposable event proving route-backed mobile submit selection echo.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "KC Home",
      awayTeamName: "KC Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: [{
          slug: `mobile-kc-total-${suffix}`,
          title: "KC Total goals first half 2.5",
          description: "KC route-backed totals ticket submit proof.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "total_goals",
          marketGroupKey: "totals",
          marketGroupTitle: "Totals",
          displayOrder: 0,
          period: "first-half",
          line: dec("2.5"),
          referenceSource: "polymarket",
          externalSlug: `kc-total-${suffix}`,
          externalMarketId: `gamma-kc-total-${suffix}`,
          conditionId: `condition-kc-total-${suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Over",
                label: "Over 2.5 1H",
                side: "over",
                code: "OVER",
                slug: `mobile-kc-outcome-over-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kc-over-${suffix}`,
                referenceOutcomeLabel: "Over 2.5 first half",
              },
              {
                name: "Under",
                label: "Under 2.5 1H",
                side: "under",
                code: "UNDER",
                slug: `mobile-kc-outcome-under-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kc-under-${suffix}`,
                referenceOutcomeLabel: "Under 2.5 first half",
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
  const overOutcome = market.outcomes.find((outcome) => outcome.side === "over");
  assert(overOutcome, "Expected proof Over outcome.");

  await upsertReferenceQuoteSnapshots(market.outcomes.map((outcome, index) => ({
    marketId: market.id,
    outcomeId: outcome.id,
    source: "polymarket",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    tokenId: outcome.referenceTokenId,
    outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
    outcomePrice: index === 0 ? 0.52 : 0.48,
    bestBid: index === 0 ? 0.5 : 0.46,
    bestAsk: index === 0 ? 0.54 : 0.5,
    spread: 0.04,
    lastTradePrice: index === 0 ? 0.52 : 0.48,
    volume: 2500,
    volume24hr: 500,
    liquidity: 1800,
    liquidityClob: 2100,
    acceptingOrders: true,
    qualityStatus: "kc_route_submit_ready",
    mmEligible: false,
    reason: "kc_route_order_submit_selection_echo_seed",
    fetchedAt: new Date(),
  })));

  const mobileMarket = {
    id: market.id,
    title: market.title,
    zhTitle: market.title,
    type: "game-line" as const,
    marketType: "totals" as const,
    marketGroupId: market.marketGroupKey ?? undefined,
    period: "first-half" as const,
    line: "2.5",
    referenceSource: market.referenceSource,
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    outcomes: [],
  };
  const mobileOutcome = {
    id: overOutcome.id,
    label: overOutcome.label ?? overOutcome.name,
    zhLabel: overOutcome.label ?? overOutcome.name,
    probability: 52,
    side: "over" as const,
    referenceTokenId: overOutcome.referenceTokenId,
    referenceOutcomeLabel: overOutcome.referenceOutcomeLabel,
    color: "#0a8f61",
  };
  const selection = {
    marketType: "totals" as const,
    marketId: market.id,
    outcomeId: overOutcome.id,
    marketGroupId: "totals",
    line: "2.5",
    period: "first-half",
    side: "over",
    displayLabel: "Over 2.5 1H",
    contractSide: "yes" as const,
    referenceSource: "polymarket",
    externalSlug: market.externalSlug ?? undefined,
    externalMarketId: market.externalMarketId ?? undefined,
    conditionId: market.conditionId ?? undefined,
    referenceTokenId: overOutcome.referenceTokenId ?? undefined,
    referenceOutcomeLabel: overOutcome.referenceOutcomeLabel ?? undefined,
    limitPrice: 0.52,
    limitSide: "ask" as const,
    limitShares: 25,
  };

  let lastRouteBody: any = null;
  const api = {
    placeLimitOrder: async (input: any) => {
      const clientOrderId = `mobile-kc-client-${suffix}`;
      const response = await createOrder(
        new NextRequest("http://localhost/api/orders", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credential.token}`,
            "Content-Type": "application/json",
            "Idempotency-Key": clientOrderId,
          },
          body: JSON.stringify({
            ...input,
            type: "LIMIT",
            clientOrderId,
          }),
        }),
      );
      assert(response.status === 200, `Expected route submit status 200, received ${response.status}.`);
      lastRouteBody = await response.json();
      return lastRouteBody;
    },
  } as unknown as PolyApi;

  const submit = await submitTicketOrder({
    mode: "server",
    api,
    market: mobileMarket,
    outcome: mobileOutcome,
    selection,
    side: "buy",
    amount: 25,
  });

  assert(submit.mode === "server", "Expected mobile submit to run in server mode.");
  assert(submit.selection?.referenceTokenId === overOutcome.referenceTokenId, "Expected mobile submit to preserve route provider token.");
  assert(submit.selection?.externalMarketId === market.externalMarketId, "Expected mobile submit to preserve route provider market id.");
  assert(submit.selection?.line === "2.5", "Expected mobile submit to preserve route line.");
  assert(submit.selection?.period === "first-half", "Expected mobile submit to preserve route period.");
  assert(lastRouteBody?.order?.selection?.referenceTokenId === overOutcome.referenceTokenId, "Expected route order selection provider token.");
  assert(lastRouteBody?.order?.selection?.externalMarketId === market.externalMarketId, "Expected route order selection provider market id.");

  const portfolioResponse = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(portfolioResponse.status === 200, `Expected portfolio status 200, received ${portfolioResponse.status}.`);
  const portfolio = await portfolioResponse.json();
  const openOrder = portfolio.openOrders.find((item: any) => item.id === submit.id);
  assert(openOrder, "Expected submitted route order in portfolio open orders.");
  assert(openOrder.selection?.referenceTokenId === overOutcome.referenceTokenId, "Expected portfolio open order provider token.");
  assert(openOrder.selection?.line === "2.5", "Expected portfolio open order line.");
  assert(openOrder.selection?.period === "first-half", "Expected portfolio open order period.");

  const summary = {
    pass: true,
    cycle: "Cycle KC",
    createdAt: new Date().toISOString(),
    routes: {
      submit: "/api/orders",
      portfolio: "/api/portfolio",
    },
    mobileGuard: {
      submitAcceptedRouteEcho: true,
      id: submit.id,
      mode: submit.mode,
      selection: {
        marketId: submit.selection?.marketId,
        outcomeId: submit.selection?.outcomeId,
        marketType: submit.selection?.marketType,
        line: submit.selection?.line,
        period: submit.selection?.period,
        externalMarketId: submit.selection?.externalMarketId,
        conditionId: submit.selection?.conditionId,
        referenceTokenId: submit.selection?.referenceTokenId,
        referenceOutcomeLabel: submit.selection?.referenceOutcomeLabel,
      },
    },
    routeEcho: {
      orderId: lastRouteBody.order.id,
      status: lastRouteBody.order.status,
      selection: {
        marketId: lastRouteBody.order.selection.marketId,
        outcomeId: lastRouteBody.order.selection.outcomeId,
        line: lastRouteBody.order.selection.line,
        period: lastRouteBody.order.selection.period,
        externalMarketId: lastRouteBody.order.selection.externalMarketId,
        conditionId: lastRouteBody.order.selection.conditionId,
        referenceTokenId: lastRouteBody.order.selection.referenceTokenId,
      },
    },
    portfolioOpenOrder: {
      id: openOrder.id,
      status: openOrder.status,
      selection: {
        line: openOrder.selection.line,
        period: openOrder.selection.period,
        externalMarketId: openOrder.selection.externalMarketId,
        referenceTokenId: openOrder.selection.referenceTokenId,
      },
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
