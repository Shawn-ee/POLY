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
import type { TicketSelection } from "../mobile/src/components/TradeTicket";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KD-route-order-submit-line-family-breadth/cycle-KD-route-order-submit-line-family-breadth.json";
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

type ProofCase = {
  key: "spread" | "team-total";
  title: string;
  marketType: "spread" | "team_total_goals";
  marketGroupKey: string;
  marketGroupTitle: string;
  period: "regulation" | "second-half";
  line: string;
  selectedSide: "yes" | "over";
  selectedLabel: string;
  referenceOutcomeLabel: string;
  selectionMarketType: TicketSelection["marketType"];
  limitPrice: number;
  probability: number;
};

const cases: ProofCase[] = [
  {
    key: "spread",
    title: "KD Spread KC Home -1.5 regulation",
    marketType: "spread",
    marketGroupKey: "spreads",
    marketGroupTitle: "Spreads",
    period: "regulation",
    line: "1.5",
    selectedSide: "yes",
    selectedLabel: "KC Home -1.5",
    referenceOutcomeLabel: "KC Home -1.5 regulation",
    selectionMarketType: "spread",
    limitPrice: 0.47,
    probability: 47,
  },
  {
    key: "team-total",
    title: "KD KC Home team total second half 1.5",
    marketType: "team_total_goals",
    marketGroupKey: "team-totals",
    marketGroupTitle: "Team Totals",
    period: "second-half",
    line: "1.5",
    selectedSide: "over",
    selectedLabel: "KC Home over 1.5 2H",
    referenceOutcomeLabel: "KC Home over 1.5 second half",
    selectionMarketType: "team-total",
    limitPrice: 0.58,
    probability: 58,
  },
];

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_kd_${suffix}`,
      email: `mobile-kd-${suffix}@example.test`,
      isAdmin: true,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-kd-${suffix}`,
    scopes: ["orders:write", "account:read"],
  });

  await prisma.userBalance.create({
    data: {
      userId: user.id,
      availableUSDC: dec("250.00"),
      lockedUSDC: dec("0"),
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-kd-route-submit-${suffix}`,
      title: `KD Route Submit ${suffix}`,
      description: "Disposable event proving route-backed line family selection echo breadth.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "KC Home",
      awayTeamName: "KC Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: cases.map((proofCase, index) => ({
          slug: `mobile-kd-${proofCase.key}-${suffix}`,
          title: proofCase.title,
          description: `KD route-backed ${proofCase.key} ticket submit proof.`,
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: proofCase.marketType,
          marketGroupKey: proofCase.marketGroupKey,
          marketGroupTitle: proofCase.marketGroupTitle,
          displayOrder: index,
          period: proofCase.period,
          line: dec(proofCase.line),
          referenceSource: "polymarket",
          externalSlug: `kd-${proofCase.key}-${suffix}`,
          externalMarketId: `gamma-kd-${proofCase.key}-${suffix}`,
          conditionId: `condition-kd-${proofCase.key}-${suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: proofCase.selectedSide === "yes" ? "Yes" : "Over",
                label: proofCase.selectedLabel,
                side: proofCase.selectedSide,
                code: proofCase.selectedSide.toUpperCase(),
                slug: `mobile-kd-${proofCase.key}-selected-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kd-${proofCase.key}-selected-${suffix}`,
                referenceOutcomeLabel: proofCase.referenceOutcomeLabel,
              },
              {
                name: proofCase.selectedSide === "yes" ? "No" : "Under",
                label: proofCase.selectedSide === "yes" ? `No ${proofCase.selectedLabel}` : "KC Home under 1.5 2H",
                side: proofCase.selectedSide === "yes" ? "no" : "under",
                code: proofCase.selectedSide === "yes" ? "NO" : "UNDER",
                slug: `mobile-kd-${proofCase.key}-other-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kd-${proofCase.key}-other-${suffix}`,
                referenceOutcomeLabel: proofCase.selectedSide === "yes" ? `No ${proofCase.referenceOutcomeLabel}` : "KC Home under 1.5 second half",
              },
            ],
          },
        })),
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

  for (const market of event.markets) {
    await upsertReferenceQuoteSnapshots(market.outcomes.map((outcome, index) => ({
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
      outcomePrice: index === 0 ? 0.55 : 0.45,
      bestBid: index === 0 ? 0.53 : 0.43,
      bestAsk: index === 0 ? 0.57 : 0.47,
      spread: 0.04,
      lastTradePrice: index === 0 ? 0.55 : 0.45,
      volume: 2500,
      volume24hr: 500,
      liquidity: 1800,
      liquidityClob: 2100,
      acceptingOrders: true,
      qualityStatus: "kd_route_submit_ready",
      mmEligible: false,
      reason: "kd_route_order_submit_line_family_breadth_seed",
      fetchedAt: new Date(),
    })));
  }

  const proofs = [];

  for (const proofCase of cases) {
    const market = event.markets.find((item) => item.marketGroupKey === proofCase.marketGroupKey);
    assert(market, `Expected ${proofCase.key} market.`);
    const selectedOutcome = market.outcomes.find((outcome) => outcome.side === proofCase.selectedSide);
    assert(selectedOutcome, `Expected ${proofCase.key} selected outcome.`);

    const mobileMarket = {
      id: market.id,
      title: market.title,
      zhTitle: market.title,
      type: "game-line" as const,
      marketType: proofCase.selectionMarketType,
      marketGroupId: market.marketGroupKey ?? undefined,
      period: proofCase.period === "second-half" ? "second-half" as const : "regulation" as const,
      line: proofCase.line,
      referenceSource: market.referenceSource,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      outcomes: [],
    };
    const mobileOutcome = {
      id: selectedOutcome.id,
      label: selectedOutcome.label ?? selectedOutcome.name,
      zhLabel: selectedOutcome.label ?? selectedOutcome.name,
      probability: proofCase.probability,
      side: proofCase.selectedSide,
      referenceTokenId: selectedOutcome.referenceTokenId,
      referenceOutcomeLabel: selectedOutcome.referenceOutcomeLabel,
      color: "#0a8f61",
    };
    const selection = {
      marketType: proofCase.selectionMarketType,
      marketId: market.id,
      outcomeId: selectedOutcome.id,
      marketGroupId: proofCase.marketGroupKey,
      line: proofCase.line,
      period: proofCase.period,
      side: proofCase.selectedSide,
      displayLabel: proofCase.selectedLabel,
      contractSide: "yes" as const,
      referenceSource: "polymarket",
      externalSlug: market.externalSlug ?? undefined,
      externalMarketId: market.externalMarketId ?? undefined,
      conditionId: market.conditionId ?? undefined,
      referenceTokenId: selectedOutcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: selectedOutcome.referenceOutcomeLabel ?? undefined,
      limitPrice: proofCase.limitPrice,
      limitSide: "ask" as const,
      limitShares: 25,
    };

    let lastRouteBody: any = null;
    const api = {
      placeLimitOrder: async (input: any) => {
        const clientOrderId = `mobile-kd-${proofCase.key}-${suffix}`;
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
        assert(response.status === 200, `Expected ${proofCase.key} route submit status 200, received ${response.status}.`);
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

    assert(submit.mode === "server", `Expected ${proofCase.key} submit server mode.`);
    assert(submit.selection?.marketType === proofCase.selectionMarketType, `Expected ${proofCase.key} mobile market type.`);
    assert(submit.selection?.line === proofCase.line, `Expected ${proofCase.key} mobile line.`);
    assert(submit.selection?.period === proofCase.period, `Expected ${proofCase.key} mobile period.`);
    assert(submit.selection?.referenceTokenId === selectedOutcome.referenceTokenId, `Expected ${proofCase.key} mobile provider token.`);
    assert(lastRouteBody?.order?.selection?.referenceTokenId === selectedOutcome.referenceTokenId, `Expected ${proofCase.key} route provider token.`);

    proofs.push({
      family: proofCase.key,
      orderId: submit.id,
      routeStatus: lastRouteBody.order.status,
      mobileSelection: {
        marketId: submit.selection?.marketId,
        outcomeId: submit.selection?.outcomeId,
        marketType: submit.selection?.marketType,
        line: submit.selection?.line,
        period: submit.selection?.period,
        externalMarketId: submit.selection?.externalMarketId,
        conditionId: submit.selection?.conditionId,
        referenceTokenId: submit.selection?.referenceTokenId,
      },
      routeSelection: {
        marketId: lastRouteBody.order.selection.marketId,
        outcomeId: lastRouteBody.order.selection.outcomeId,
        marketType: lastRouteBody.order.selection.marketType,
        line: lastRouteBody.order.selection.line,
        period: lastRouteBody.order.selection.period,
        externalMarketId: lastRouteBody.order.selection.externalMarketId,
        conditionId: lastRouteBody.order.selection.conditionId,
        referenceTokenId: lastRouteBody.order.selection.referenceTokenId,
      },
    });
  }

  const portfolioResponse = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(portfolioResponse.status === 200, `Expected portfolio status 200, received ${portfolioResponse.status}.`);
  const portfolio = await portfolioResponse.json();

  for (const proof of proofs) {
    const openOrder = portfolio.openOrders.find((item: any) => item.id === proof.orderId);
    assert(openOrder, `Expected ${proof.family} order in portfolio open orders.`);
    assert(openOrder.selection?.line === proof.mobileSelection.line, `Expected ${proof.family} portfolio line.`);
    assert(openOrder.selection?.period === proof.mobileSelection.period, `Expected ${proof.family} portfolio period.`);
    assert(openOrder.selection?.referenceTokenId === proof.mobileSelection.referenceTokenId, `Expected ${proof.family} portfolio provider token.`);
    Object.assign(proof, {
      portfolioSelection: {
        line: openOrder.selection.line,
        period: openOrder.selection.period,
        externalMarketId: openOrder.selection.externalMarketId,
        referenceTokenId: openOrder.selection.referenceTokenId,
      },
    });
  }

  const summary = {
    pass: true,
    cycle: "Cycle KD",
    createdAt: new Date().toISOString(),
    routes: {
      submit: "/api/orders",
      portfolio: "/api/portfolio",
    },
    families: proofs,
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
