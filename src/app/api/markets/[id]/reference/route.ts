import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";
import { parseBotInitializationMetadata } from "@/server/services/referenceBotInitialization";
import { getLatestReferenceQuotePlansForMarket } from "@/server/services/referenceQuoteSnapshots";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const userId = await getUserId();
  const { id } = await context.params;

  const market = await prisma.market.findUnique({
    where: { id },
    select: {
      id: true,
      visibility: true,
      mechanism: true,
      ownerId: true,
      referenceSource: true,
      referenceMetadata: true,
    },
  });

  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  try {
    await assertMarketVisibleToUser({ market, userId });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const plans = await getLatestReferenceQuotePlansForMarket(market.id);
  const hasSnapshot = plans.some((plan) => plan.hasSnapshot);
  const botInitialization = parseBotInitializationMetadata(market.referenceMetadata);
  const botUserId = botInitialization?.capital?.botUserId ?? null;
  const [openOrders, balance, positions] = botUserId
    ? await Promise.all([
        prisma.order.findMany({
          where: {
            marketId: market.id,
            userId: botUserId,
            status: { in: ["OPEN", "PARTIAL"] },
          },
          select: {
            outcomeId: true,
            side: true,
            price: true,
            remaining: true,
            reservedNotional: true,
            createdAt: true,
          },
        }),
        prisma.userBalance.findUnique({
          where: { userId: botUserId },
          select: {
            availableUSDC: true,
            lockedUSDC: true,
          },
        }),
        prisma.position.findMany({
          where: {
            marketId: market.id,
            userId: botUserId,
          },
          select: {
            outcomeId: true,
            shares: true,
            reservedShares: true,
            realizedPnl: true,
          },
        }),
      ])
    : [[], null, []];
  const activeByOutcome = new Map<
    string,
    {
      activeBotBid: number | null;
      activeBotAsk: number | null;
    }
  >();
  let openOrderNotionalCents = 0;
  for (const order of openOrders) {
    openOrderNotionalCents += Math.round(Number(order.reservedNotional) * 100);
    const existing = activeByOutcome.get(order.outcomeId) ?? {
      activeBotBid: null,
      activeBotAsk: null,
    };
    const numericPrice = Number(order.price);
    if (order.side === "BUY") {
      if (existing.activeBotBid == null || numericPrice > existing.activeBotBid) {
        existing.activeBotBid = numericPrice;
      }
    } else if (existing.activeBotAsk == null || numericPrice < existing.activeBotAsk) {
      existing.activeBotAsk = numericPrice;
    }
    activeByOutcome.set(order.outcomeId, existing);
  }
  const dailyLossCents = Math.max(
    0,
    Math.round(
      positions.reduce((sum, position) => sum + Math.min(0, Number(position.realizedPnl ?? 0)), 0) * -100,
    ),
  );

  return NextResponse.json({
    marketId: market.id,
    source: market.referenceSource,
    hasSnapshot,
    reason: hasSnapshot ? null : "no_reference_snapshot",
    dryRun: process.env.SYSTEM_LIQUIDITY_DRY_RUN !== "false",
    liveOrdersEnabled: process.env.LIVE_SYSTEM_LIQUIDITY_ENABLED === "true",
    botInitialization: botInitialization
      ? {
          status: botInitialization.status,
          lastCheckedAt: botInitialization.lastCheckedAt,
          reason: botInitialization.reason,
          riskProfile: botInitialization.riskProfile,
          capital: botInitialization.capital
            ? {
                budgetCents: botInitialization.capital.budgetCents,
                mintBudgetCents: botInitialization.capital.mintBudgetCents,
                mintedCompleteSets: botInitialization.capital.mintedCompleteSets,
                cashReserveCents: botInitialization.capital.cashReserveCents,
                autoReplenish: botInitialization.capital.autoReplenish,
                initializedAt: botInitialization.capital.initializedAt,
                maxSingleOrderNotionalCents: botInitialization.capital.maxSingleOrderNotionalCents,
                maxOpenOrderNotionalCents: botInitialization.capital.maxOpenOrderNotionalCents,
                maxDailyLossCents: botInitialization.capital.maxDailyLossCents,
                openOrderNotionalCents,
                dailyLossCents,
              }
            : null,
          runtime: botInitialization.runtime
            ? {
                liveOrdersEnabled: botInitialization.runtime.liveOrdersEnabled,
                emergencyStop: botInitialization.runtime.emergencyStop,
                cancelRequestedAt: botInitialization.runtime.cancelRequestedAt,
                lastSeededAt: botInitialization.runtime.lastSeededAt,
                lastLiveRunAt: botInitialization.runtime.lastLiveRunAt,
                lastRuntimeSyncAt: botInitialization.runtime.lastRuntimeSyncAt,
              }
            : null,
          readiness: botInitialization.readiness,
        }
      : null,
    outcomes: plans.map((plan) => ({
      localMarketId: plan.localMarketId,
      localOutcomeId: plan.localOutcomeId,
      outcomeName: plan.outcomeName,
      referenceSource: plan.referenceSource,
      gammaOutcomePrice: plan.gammaOutcomePrice,
      gammaBestBid: plan.gammaBestBid,
      gammaBestAsk: plan.gammaBestAsk,
      gammaSpread: plan.gammaSpread,
      lastTradePrice: plan.lastTradePrice,
      volume: plan.volume,
      volume24hr: plan.volume24hr,
      liquidity: plan.liquidity,
      acceptingOrders: plan.acceptingOrders,
      fetchedAt: plan.fetchedAt,
      ageMs: plan.ageMs,
      isFresh: plan.isFresh,
      hasSnapshot: plan.hasSnapshot,
      qualityStatus: plan.qualityStatus,
      mmEligible: plan.mmEligible,
      mmEnabled: plan.mmEnabled,
      reason: plan.reason,
      tickSize: plan.tickSize,
      quoteOffsetTicks: plan.quoteOffsetTicks,
      plannedBotBid: plan.plannedBotBid,
      plannedBotAsk: plan.plannedBotAsk,
      referenceBid: plan.referenceBid,
      referenceAsk: plan.referenceAsk,
      dryRun: plan.dryRun,
      liveOrdersEnabled: plan.liveOrdersEnabled,
      quotePlanEnabled: plan.quotePlanEnabled,
      quotePreviewAvailable: plan.quotePreviewAvailable,
      activeBotBid: activeByOutcome.get(plan.localOutcomeId)?.activeBotBid ?? null,
      activeBotAsk: activeByOutcome.get(plan.localOutcomeId)?.activeBotAsk ?? null,
      formula: "plannedBotBid = referenceBid - 2 ticks; plannedBotAsk = referenceAsk + 2 ticks",
    })),
  });
}
