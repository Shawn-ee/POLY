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
import { submitTicketOrder } from "../mobile/src/services/orderService";
import type { PolyApi } from "../mobile/src/api";
import type { TicketSelection } from "../mobile/src/components/TradeTicket";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KF-route-line-family-filled-lifecycle/cycle-KF-route-line-family-filled-lifecycle.json";
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
  return { user, credential };
}

async function submitRouteOrder(input: {
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
  otherLabel: string;
  referenceOutcomeLabel: string;
  selectionMarketType: TicketSelection["marketType"];
  price: string;
  probability: number;
};

const cases: ProofCase[] = [
  {
    key: "spread",
    title: "KF Spread Home -1.5 regulation",
    marketType: "spread",
    marketGroupKey: "spreads",
    marketGroupTitle: "Spreads",
    period: "regulation",
    line: "1.5",
    selectedSide: "yes",
    selectedLabel: "KF Home -1.5",
    otherLabel: "No KF Home -1.5",
    referenceOutcomeLabel: "KF Home -1.5 regulation",
    selectionMarketType: "spread",
    price: "0.47",
    probability: 47,
  },
  {
    key: "team-total",
    title: "KF Home team total second half 1.5",
    marketType: "team_total_goals",
    marketGroupKey: "team-totals",
    marketGroupTitle: "Team Totals",
    period: "second-half",
    line: "1.5",
    selectedSide: "over",
    selectedLabel: "KF Home over 1.5 2H",
    otherLabel: "KF Home under 1.5 2H",
    referenceOutcomeLabel: "KF Home over 1.5 second half",
    selectionMarketType: "team-total",
    price: "0.58",
    probability: 58,
  },
];

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const buyer = await createUserWithCredential(`mobile_kf_buyer_${suffix}`, ["orders:write", "account:read"]);
  const seller = await createUserWithCredential(`mobile_kf_seller_${suffix}`, ["orders:write", "account:read"]);

  await prisma.userBalance.create({
    data: {
      userId: buyer.user.id,
      availableUSDC: dec("250.00"),
      lockedUSDC: dec("0"),
    },
  });
  await prisma.userBalance.create({
    data: {
      userId: seller.user.id,
      availableUSDC: dec("100.00"),
      lockedUSDC: dec("0"),
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-kf-filled-${suffix}`,
      title: `KF Filled ${suffix}`,
      description: "Disposable event proving selected line family filled lifecycle preservation.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "KF Home",
      awayTeamName: "KF Away",
      status: "live",
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      markets: {
        create: cases.map((proofCase, index) => ({
          slug: `mobile-kf-${proofCase.key}-${suffix}`,
          title: proofCase.title,
          description: `KF route-backed ${proofCase.key} filled proof.`,
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
          externalSlug: `kf-${proofCase.key}-${suffix}`,
          externalMarketId: `gamma-kf-${proofCase.key}-${suffix}`,
          conditionId: `condition-kf-${proofCase.key}-${suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: proofCase.selectedSide === "yes" ? "Yes" : "Over",
                label: proofCase.selectedLabel,
                side: proofCase.selectedSide,
                code: proofCase.selectedSide.toUpperCase(),
                slug: `mobile-kf-${proofCase.key}-selected-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kf-${proofCase.key}-selected-${suffix}`,
                referenceOutcomeLabel: proofCase.referenceOutcomeLabel,
              },
              {
                name: proofCase.selectedSide === "yes" ? "No" : "Under",
                label: proofCase.otherLabel,
                side: proofCase.selectedSide === "yes" ? "no" : "under",
                code: proofCase.selectedSide === "yes" ? "NO" : "UNDER",
                slug: `mobile-kf-${proofCase.key}-other-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kf-${proofCase.key}-other-${suffix}`,
                referenceOutcomeLabel: proofCase.selectedSide === "yes" ? `No ${proofCase.referenceOutcomeLabel}` : "KF Home under 1.5 second half",
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
      qualityStatus: "kf_route_filled_ready",
      mmEligible: false,
      reason: "kf_route_line_family_filled_lifecycle_seed",
      fetchedAt: new Date(),
    })));
    await mintCompleteSetForPublicOrderbook({
      marketId: market.id,
      userId: seller.user.id,
      quantity: dec("25"),
    });
  }

  const proofs = [];

  for (const proofCase of cases) {
    const market = event.markets.find((item) => item.marketGroupKey === proofCase.marketGroupKey);
    assert(market, `Expected ${proofCase.key} market.`);
    const selectedOutcome = market.outcomes.find((outcome) => outcome.side === proofCase.selectedSide);
    assert(selectedOutcome, `Expected ${proofCase.key} selected outcome.`);

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
      limitPrice: Number(proofCase.price),
      limitSide: "ask" as const,
      limitShares: 20,
    };

    const sellerResponse = await submitRouteOrder({
      token: seller.credential.token,
      idempotencyKey: `mobile-kf-sell-${proofCase.key}-${suffix}`,
      body: {
        marketId: market.id,
        outcomeId: selectedOutcome.id,
        side: "SELL",
        type: "LIMIT",
        price: proofCase.price,
        size: "20.00",
        contractSide: "YES",
        clientOrderId: `mobile-kf-sell-${proofCase.key}-${suffix}`,
        selection: { ...selection, limitSide: "ask" },
      },
    });
    assert(sellerResponse.status === 200, `Expected ${proofCase.key} maker sell status 200, received ${sellerResponse.status}.`);
    const sellerBody = await sellerResponse.json();
    assert(sellerBody.order?.status === "OPEN", `Expected ${proofCase.key} maker OPEN, received ${sellerBody.order?.status}.`);

    let buyerRouteBody: any = null;
    const api = {
      placeLimitOrder: async (input: any) => {
        const clientOrderId = `mobile-kf-buy-${proofCase.key}-${suffix}`;
        const response = await createOrder(
          new NextRequest("http://localhost/api/orders", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${buyer.credential.token}`,
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
        assert(response.status === 200, `Expected ${proofCase.key} taker buy status 200, received ${response.status}.`);
        buyerRouteBody = await response.json();
        return buyerRouteBody;
      },
    } as unknown as PolyApi;

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

    const submit = await submitTicketOrder({
      mode: "server",
      api,
      market: mobileMarket,
      outcome: mobileOutcome,
      selection: { ...selection, limitSide: "bid" },
      side: "buy",
      amount: 20 * Number(proofCase.price),
    });

    assert(submit.status === "FILLED", `Expected ${proofCase.key} taker FILLED, received ${submit.status}.`);
    assert(submit.remainingSize === 0, `Expected ${proofCase.key} taker remaining 0.`);
    assert(submit.selection?.referenceTokenId === selectedOutcome.referenceTokenId, `Expected ${proofCase.key} submit token.`);
    assert(buyerRouteBody?.fills?.length === 1, `Expected ${proofCase.key} exactly one fill.`);
    assert(buyerRouteBody?.position?.shares === "20", `Expected ${proofCase.key} position shares 20.`);

    proofs.push({
      family: proofCase.key,
      makerOrderId: sellerBody.order.id,
      takerOrderId: submit.id,
      fillCount: buyerRouteBody.fills.length,
      submitSelection: {
        marketId: submit.selection?.marketId,
        outcomeId: submit.selection?.outcomeId,
        marketType: submit.selection?.marketType,
        line: submit.selection?.line,
        period: submit.selection?.period,
        externalMarketId: submit.selection?.externalMarketId,
        referenceTokenId: submit.selection?.referenceTokenId,
        limitSide: submit.selection?.limitSide,
      },
      routeSelection: {
        marketId: buyerRouteBody.order.selection.marketId,
        outcomeId: buyerRouteBody.order.selection.outcomeId,
        marketType: buyerRouteBody.order.selection.marketType,
        line: buyerRouteBody.order.selection.line,
        period: buyerRouteBody.order.selection.period,
        externalMarketId: buyerRouteBody.order.selection.externalMarketId,
        referenceTokenId: buyerRouteBody.order.selection.referenceTokenId,
        limitSide: buyerRouteBody.order.selection.limitSide,
      },
    });
  }

  const portfolioResponse = await getPortfolio(
    new NextRequest("http://localhost/api/portfolio", {
      headers: { Authorization: `Bearer ${buyer.credential.token}` },
    }),
  );
  assert(portfolioResponse.status === 200, `Expected buyer portfolio status 200, received ${portfolioResponse.status}.`);
  const portfolio = await portfolioResponse.json();

  const historyResponse = await getPortfolioHistory(
    new NextRequest("http://localhost/api/portfolio/history", {
      headers: { Authorization: `Bearer ${buyer.credential.token}` },
    }),
  );
  assert(historyResponse.status === 200, `Expected buyer history status 200, received ${historyResponse.status}.`);
  const history = await historyResponse.json();

  for (const proof of proofs) {
    const position = portfolio.positions.find((item: any) => item.market.id === proof.submitSelection.marketId && item.outcomeId === proof.submitSelection.outcomeId);
    assert(position, `Expected ${proof.family} filled position.`);
    assert(position.shares === 20, `Expected ${proof.family} position shares 20, received ${position.shares}.`);
    assert(position.selection?.line === proof.submitSelection.line, `Expected ${proof.family} position line.`);
    assert(position.selection?.period === proof.submitSelection.period, `Expected ${proof.family} position period.`);
    assert(position.selection?.referenceTokenId === proof.submitSelection.referenceTokenId, `Expected ${proof.family} position provider token.`);

    const recentTrade = history.recentTrades.find((item: any) => item.market.id === proof.submitSelection.marketId && item.outcome.id === proof.submitSelection.outcomeId);
    assert(recentTrade, `Expected ${proof.family} recent trade.`);
    assert(recentTrade.selection?.line === proof.submitSelection.line, `Expected ${proof.family} recent line.`);
    assert(recentTrade.selection?.period === proof.submitSelection.period, `Expected ${proof.family} recent period.`);
    assert(recentTrade.selection?.referenceTokenId === proof.submitSelection.referenceTokenId, `Expected ${proof.family} recent provider token.`);
    assert(recentTrade.selection?.limitSide === "bid", `Expected ${proof.family} recent buyer limit side.`);

    Object.assign(proof, {
      portfolioPosition: {
        shares: position.shares,
        line: position.selection.line,
        period: position.selection.period,
        externalMarketId: position.selection.externalMarketId,
        referenceTokenId: position.selection.referenceTokenId,
      },
      recentTrade: {
        side: recentTrade.side,
        shares: recentTrade.shares,
        line: recentTrade.selection.line,
        period: recentTrade.selection.period,
        externalMarketId: recentTrade.selection.externalMarketId,
        referenceTokenId: recentTrade.selection.referenceTokenId,
        limitSide: recentTrade.selection.limitSide,
      },
    });
  }

  const summary = {
    pass: true,
    cycle: "Cycle KF",
    createdAt: new Date().toISOString(),
    routes: {
      submit: "/api/orders",
      portfolio: "/api/portfolio",
      history: "/api/portfolio/history",
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
