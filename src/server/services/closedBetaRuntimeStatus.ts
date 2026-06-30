import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { referenceSnapshotConfig } from "@/server/services/referenceQuoteSnapshots";
import { runReferenceRiskMonitorOnce } from "@/server/services/referenceRiskMonitor";

export type ClosedBetaRuntimeStatus = Awaited<ReturnType<typeof getClosedBetaRuntimeStatus>>;

export async function getClosedBetaRuntimeStatus() {
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - referenceSnapshotConfig.staleMs);
  const [
    latestReference,
    referenceSnapshots,
    freshReferenceSnapshots,
    staleReferenceSnapshots,
    mappedMarkets,
    verifiedMappings,
    unmappedWorldCupMarkets,
    enabledMmConfigs,
    dryRunMmConfigs,
    openBotOrders,
    dryRunIntents,
    liveLocalIntents,
    recentDryRunIntents,
    recentLiveLocalIntents,
    latestDryRunIntent,
    latestLiveLocalIntent,
    latestOpenBotOrder,
    riskAlerts,
    recentRiskEvents,
    currentRisk,
    publicDraftLeakCount,
    worldCupEvents,
    eligibleWorldCupMarkets,
    hiddenUnmappedWorldCupMarkets,
    hiddenNoReferenceWorldCupMarkets,
    hiddenDraftWorldCupMarkets,
    worldCupEventsWithEligibleMarkets,
    hiddenStaleEvents,
    ownerBalanceCount,
    recentExecutions,
    quoteExplanations,
  ] = await Promise.all([
    prisma.referenceQuoteSnapshot.findFirst({
      where: { source: "polymarket" },
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    }),
    prisma.referenceQuoteSnapshot.count({ where: { source: "polymarket" } }),
    prisma.referenceQuoteSnapshot.count({ where: { source: "polymarket", fetchedAt: { gte: staleCutoff } } }),
    prisma.referenceQuoteSnapshot.count({ where: { source: "polymarket", fetchedAt: { lt: staleCutoff } } }),
    prisma.market.count({ where: { referenceSource: "polymarket" } }),
    prisma.market.count({ where: { referenceSource: "polymarket", referenceMetadata: { path: ["importStatus"], equals: "approved" } } }),
    prisma.market.count({
      where: {
        event: { sportKey: "soccer", leagueKey: "world_cup" },
        OR: [{ referenceSource: null }, { referenceSource: { not: "polymarket" } }],
      },
    }),
    prisma.botQuoteConfig.count({ where: { source: "polymarket", enabled: true } }),
    prisma.botQuoteConfig.count({ where: { source: "polymarket", enabled: true, dryRun: true } }),
    prisma.order.count({ where: { status: { in: ["OPEN", "PARTIAL"] } } }),
    prisma.botOrderIntent.count({ where: { dryRun: true } }),
    prisma.botOrderIntent.count({ where: { dryRun: false } }),
    prisma.botOrderIntent.count({ where: { dryRun: true, createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } } }),
    prisma.botOrderIntent.count({ where: { dryRun: false, createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } } }),
    prisma.botOrderIntent.findFirst({ where: { dryRun: true }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.botOrderIntent.findFirst({ where: { dryRun: false }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    loadLatestOpenBotOrderTimestamp(),
    prisma.canonicalEvent.count({ where: { eventType: { contains: "risk" } } }).catch(() => 0),
    prisma.canonicalEvent.findMany({
      where: { eventType: { contains: "risk" }, createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { payload: true, createdAt: true },
    }).catch(() => []),
    runReferenceRiskMonitorOnce({ pauseOnRisk: false, logEvents: false, now }).catch((error) => ({
      generatedAt: now.toISOString(),
      alertCount: 0,
      pauseRequired: false,
      paused: false,
      eventsLogged: 0,
      alerts: [{
        type: "repeated_reference_error" as const,
        severity: "warn" as const,
        action: "skip" as const,
        marketId: "runtime-status",
        message: error instanceof Error ? error.message : String(error),
      }],
    })),
    prisma.market.count({
      where: {
        event: { sportKey: "soccer", leagueKey: "world_cup" },
        OR: [
          { visibility: { not: "PUBLIC" }, isListed: true },
          { visibility: "PUBLIC", isListed: false, referenceMetadata: { path: ["lifecycle"], equals: "draft" } },
        ],
      },
    }),
    prisma.event.count({ where: { sportKey: "soccer", leagueKey: "world_cup" } }),
    prisma.market.count({ where: eligibleWorldCupMarketWhere(staleCutoff) }),
    prisma.market.count({
      where: {
        event: { sportKey: "soccer", leagueKey: "world_cup" },
        OR: [
          { referenceSource: null },
          { referenceSource: { not: "polymarket" } },
          { referenceMetadata: { path: ["importStatus"], not: "approved" } },
        ],
      },
    }),
    prisma.market.count({
      where: {
        event: { sportKey: "soccer", leagueKey: "world_cup" },
        referenceSource: "polymarket",
        referenceMetadata: { path: ["importStatus"], equals: "approved" },
        referenceQuoteSnapshots: { none: { source: "polymarket", fetchedAt: { gte: staleCutoff } } },
      },
    }),
    prisma.market.count({
      where: {
        event: { sportKey: "soccer", leagueKey: "world_cup" },
        OR: [{ visibility: { not: "PUBLIC" } }, { isListed: false }, { referenceMetadata: { path: ["importStatus"], equals: "pending_review" } }],
      },
    }),
    prisma.event.count({
      where: {
        sportKey: "soccer",
        leagueKey: "world_cup",
        markets: { some: eligibleWorldCupMarketWhere(staleCutoff) },
      },
    }),
    prisma.event.count({
      where: {
        sportKey: "soccer",
        leagueKey: "world_cup",
        OR: [{ status: { in: ["closed", "resolved", "ended"] } }, { startTime: { lt: new Date(now.getTime() - 6 * 60 * 60 * 1000) } }],
      },
    }),
    prisma.userBalance.count({ where: { availableUSDC: { gt: 0 } } }),
    loadRecentExecutionDiagnostics(),
    loadQuoteExplanations(staleCutoff),
  ]);

  const safety = {
    realMoneyMode: process.env.REAL_MONEY_MODE === "true",
    fundingEnabled: process.env.INTERNAL_FUNDING_BETA_ENABLED === "true",
    fundingKillSwitch: process.env.FUNDING_KILL_SWITCH !== "false",
    autoDepositCredit: process.env.ALLOW_AUTO_DEPOSIT_CREDIT === "true",
    autoImport: process.env.POLYMARKET_AUTO_IMPORT_ENABLED === "true",
    autoPromote: process.env.POLYMARKET_AUTO_PROMOTE_ENABLED === "true",
    localBotTradingOnly: process.env.LOCAL_BOT_TRADING_ONLY === "true",
    liveLocalMm: process.env.POLYMARKET_MM_LIVE_LOCAL === "true",
  };

  const unsafeFlags = [
    safety.realMoneyMode ? "REAL_MONEY_MODE=true" : null,
    safety.fundingEnabled ? "INTERNAL_FUNDING_BETA_ENABLED=true" : null,
    !safety.fundingKillSwitch ? "FUNDING_KILL_SWITCH=false" : null,
    safety.autoDepositCredit ? "ALLOW_AUTO_DEPOSIT_CREDIT=true" : null,
    safety.autoImport ? "POLYMARKET_AUTO_IMPORT_ENABLED=true" : null,
    safety.autoPromote ? "POLYMARKET_AUTO_PROMOTE_ENABLED=true" : null,
    !safety.localBotTradingOnly ? "LOCAL_BOT_TRADING_ONLY is not true" : null,
  ].filter((flag): flag is string => flag !== null);
  const currentCriticalRiskAlerts = currentRisk.alerts.filter((alert) => alert.severity === "critical").length;
  const currentRiskTopReasons = summarizeCurrentRiskReasons(currentRisk.alerts);
  const historicalRiskTopReasons = summarizeHistoricalRiskReasons(recentRiskEvents.map((event) => event.payload));
  const mmHeartbeat = latestDate(
    latestLiveLocalIntent?.createdAt ?? null,
    latestOpenBotOrder?.updatedAt ?? null,
    latestDryRunIntent?.createdAt ?? null,
  );

  return {
    generatedAt: now.toISOString(),
    serviceHealth: {
      referenceSyncHeartbeat: latestReference?.fetchedAt?.toISOString() ?? null,
      mmHeartbeat: mmHeartbeat?.toISOString() ?? null,
      mmHealthSource: latestLiveLocalIntent?.createdAt
        ? "latest_live_local_intent"
        : latestOpenBotOrder?.updatedAt
          ? "latest_open_bot_order"
          : latestDryRunIntent?.createdAt
            ? "latest_dry_run_intent"
            : null,
      status: unsafeFlags.length
        ? "unsafe_env"
        : currentCriticalRiskAlerts > 0
          ? "risk_review_required"
          : "ready_for_rehearsal",
    },
    referenceSync: {
      latestSnapshotAt: latestReference?.fetchedAt?.toISOString() ?? null,
      totalSnapshots: referenceSnapshots,
      freshSnapshots: freshReferenceSnapshots,
      staleSnapshots: staleReferenceSnapshots,
      staleAfterMs: referenceSnapshotConfig.staleMs,
    },
    marketMaker: {
      enabledConfigCount: enabledMmConfigs,
      dryRunConfigCount: dryRunMmConfigs,
      openInternalOrders: openBotOrders,
      dryRunIntentCount: dryRunIntents,
      liveLocalIntentCount: liveLocalIntents,
      recentDryRunIntentCount: recentDryRunIntents,
      recentLiveLocalIntentCount: recentLiveLocalIntents,
      latestDryRunIntentAt: latestDryRunIntent?.createdAt?.toISOString() ?? null,
      latestLiveLocalIntentAt: latestLiveLocalIntent?.createdAt?.toISOString() ?? null,
      latestOpenBotOrderAt: latestOpenBotOrder?.updatedAt?.toISOString() ?? null,
    },
    worldCup: {
      events: worldCupEvents,
      mappedMarkets,
      verifiedMappings,
      unmappedMarkets: unmappedWorldCupMarkets,
      eligibleUserFacingMarkets: eligibleWorldCupMarkets,
      hiddenUnmappedMarkets: hiddenUnmappedWorldCupMarkets,
      hiddenNoReferenceMarkets: hiddenNoReferenceWorldCupMarkets,
      hiddenDraftMarkets: hiddenDraftWorldCupMarkets,
      eventsWithEligibleMarkets: worldCupEventsWithEligibleMarkets,
      eventsWithZeroEligibleMarkets: Math.max(0, worldCupEvents - worldCupEventsWithEligibleMarkets),
      hiddenStaleEvents,
      publicDraftLeakCount,
    },
    risk: {
      alerts: riskAlerts,
      historicalAlerts: riskAlerts,
      recentHistoricalAlerts: recentRiskEvents.length,
      currentAlerts: currentRisk.alertCount,
      currentCriticalAlerts: currentCriticalRiskAlerts,
      currentPauseRequired: currentRisk.pauseRequired,
      currentTopReasons: currentRiskTopReasons,
      recentHistoricalTopReasons: historicalRiskTopReasons,
      unsafeFlags,
    },
    safety,
    ownerTesting: {
      canOwnerTrade: unsafeFlags.length === 0 && enabledMmConfigs > 0,
      ownerTestBalanceRecords: ownerBalanceCount,
      activeLiquidityMarkets: enabledMmConfigs,
    },
    execution: {
      recent: recentExecutions,
    },
    quoteExplanations,
  };
}

async function loadLatestOpenBotOrderTimestamp() {
  const botUsername = process.env.REFERENCE_MM_BOT_USERNAME ?? "system-liquidity-bot";
  const order = await prisma.order.findFirst({
    where: {
      user: { username: botUsername },
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: new Prisma.Decimal(0) },
    },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  return order;
}

function latestDate(...values: Array<Date | null | undefined>) {
  const dates = values.filter((value): value is Date => value instanceof Date && Number.isFinite(value.getTime()));
  if (dates.length === 0) return null;
  return dates.reduce((latest, value) => value > latest ? value : latest, dates[0]);
}

function summarizeCurrentRiskReasons(alerts: Array<{ type: string; severity: string }>) {
  return summarizeReasons(alerts.map((alert) => `${alert.severity}:${alert.type}`));
}

function summarizeHistoricalRiskReasons(payloads: Prisma.JsonValue[]) {
  return summarizeReasons(payloads.map((payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "unknown";
    const type = typeof payload.type === "string" ? payload.type : "unknown";
    const severity = typeof payload.severity === "string" ? payload.severity : "unknown";
    return `${severity}:${type}`;
  }));
}

function summarizeReasons(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([reason, count]) => ({ reason, count }));
}

async function loadRecentExecutionDiagnostics() {
  const fills = await prisma.fill.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      market: { select: { id: true, title: true } },
      outcome: { select: { id: true, name: true } },
    },
  });
  const fillIds = fills.map((fill) => fill.id);
  const orderIds = Array.from(new Set(fills.flatMap((fill) => [fill.takerOrderId, fill.makerOrderId])));
  const [orders, ledgerCounts] = await Promise.all([
    prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        user: { select: { id: true, username: true, email: true } },
        apiOrderRequest: { select: { requestBody: true } },
      },
    }),
    fillIds.length
      ? prisma.ledgerEntry.groupBy({
          by: ["referenceId"],
          where: { referenceType: "Fill", referenceId: { in: fillIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);
  const ordersById = new Map(orders.map((order) => [order.id, order]));
  const ledgerCountByFillId = new Map(ledgerCounts.map((row) => [row.referenceId ?? "", row._count._all]));

  return fills.map((fill) => {
    const takerOrder = ordersById.get(fill.takerOrderId);
    const makerOrder = ordersById.get(fill.makerOrderId);
    const submittedLimit = effectiveSubmittedLimit(takerOrder, fill.price);
    const priceImprovement = fill.side === "BUY"
      ? Prisma.Decimal.max(new Prisma.Decimal(0), submittedLimit.sub(fill.price).mul(fill.size))
      : Prisma.Decimal.max(new Prisma.Decimal(0), fill.price.sub(submittedLimit).mul(fill.size));
    return {
      fillId: fill.id,
      createdAt: fill.createdAt.toISOString(),
      marketId: fill.marketId,
      marketTitle: fill.market.title,
      outcomeId: fill.outcomeId,
      outcomeName: fill.outcome.name,
      takerOrderId: fill.takerOrderId,
      makerOrderId: fill.makerOrderId,
      taker: displayUser(takerOrder?.user),
      maker: displayUser(makerOrder?.user),
      makerIsBot: makerOrder?.user?.username === (process.env.REFERENCE_MM_BOT_USERNAME ?? "system-liquidity-bot"),
      side: fill.side,
      submittedLimit: submittedLimit.toString(),
      actualFillPrice: fill.price.toString(),
      shares: fill.size.toString(),
      notionalUSDC: fill.notionalUSDC.toString(),
      feeUSDC: fill.feeUSDC.toString(),
      priceImprovementUSDC: priceImprovement.toDecimalPlaces(6, Prisma.Decimal.ROUND_DOWN).toString(),
      ledgerEntryCount: ledgerCountByFillId.get(fill.id) ?? 0,
    };
  });
}

function effectiveSubmittedLimit(
  order: {
    side: string;
    price: Prisma.Decimal;
    amount: Prisma.Decimal;
    apiOrderRequest?: { requestBody: Prisma.JsonValue } | null;
  } | null | undefined,
  fallback: Prisma.Decimal,
) {
  if (!order) return fallback;
  const requestBody = order.apiOrderRequest?.requestBody;
  if (
    order.side === "BUY" &&
    requestBody &&
    typeof requestBody === "object" &&
    !Array.isArray(requestBody) &&
    requestBody.type === "MARKET" &&
    (typeof requestBody.maxSpend === "string" || typeof requestBody.maxSpend === "number")
  ) {
    const maxSpend = new Prisma.Decimal(requestBody.maxSpend);
    if (order.amount.gt(0)) {
      return Prisma.Decimal.min(new Prisma.Decimal(1), maxSpend.div(order.amount)).toDecimalPlaces(
        8,
        Prisma.Decimal.ROUND_DOWN,
      );
    }
  }
  return order.price;
}

async function loadQuoteExplanations(staleCutoff: Date) {
  const botUsername = process.env.REFERENCE_MM_BOT_USERNAME ?? "system-liquidity-bot";
  const openBotOrders = await prisma.order.findMany({
    where: {
      user: { username: botUsername },
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: new Prisma.Decimal(0) },
      market: { referenceSource: "polymarket" },
    },
    orderBy: [{ marketId: "asc" }, { outcomeId: "asc" }, { side: "asc" }, { price: "asc" }],
    include: {
      market: {
        select: {
          id: true,
          title: true,
          marketType: true,
          status: true,
        },
      },
      outcome: { select: { id: true, name: true } },
    },
  });

  const pairs = Array.from(new Set(openBotOrders.map((order) => `${order.marketId}:${order.outcomeId}`)));
  if (pairs.length === 0) {
    return [];
  }
  const snapshots = await prisma.referenceQuoteSnapshot.findMany({
    where: {
      source: "polymarket",
      OR: pairs.map((pair) => {
        const [marketId, outcomeId] = pair.split(":");
        return { marketId, outcomeId };
      }),
    },
  });
  const snapshotsByPair = new Map(snapshots.map((snapshot) => [`${snapshot.marketId}:${snapshot.outcomeId}`, snapshot]));
  const grouped = new Map<string, typeof openBotOrders>();
  for (const order of openBotOrders) {
    const key = `${order.marketId}:${order.outcomeId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), order]);
  }

  return Array.from(grouped.entries()).slice(0, 24).map(([key, orders]) => {
    const first = orders[0];
    const snapshot = snapshotsByPair.get(key) ?? null;
    const bids = orders.filter((order) => order.side === "BUY");
    const asks = orders.filter((order) => order.side === "SELL");
    const bestBid = bids.sort((left, right) => Number(right.price) - Number(left.price))[0] ?? null;
    const bestAsk = asks.sort((left, right) => Number(left.price) - Number(right.price))[0] ?? null;
    const isStale = !snapshot?.fetchedAt || snapshot.fetchedAt < staleCutoff;
    return {
      marketId: first.marketId,
      marketTitle: first.market.title,
      marketType: first.market.marketType,
      marketStatus: first.market.status,
      outcomeId: first.outcomeId,
      outcomeName: first.outcome.name,
      referenceBid: snapshot?.bestBid?.toString() ?? null,
      referenceAsk: snapshot?.bestAsk?.toString() ?? null,
      referenceMid: snapshot?.outcomePrice?.toString() ?? null,
      localBotBid: bestBid?.price.toString() ?? null,
      localBotAsk: bestAsk?.price.toString() ?? null,
      bidSize: bestBid?.remaining.toString() ?? null,
      askSize: bestAsk?.remaining.toString() ?? null,
      lastReferenceAt: snapshot?.fetchedAt?.toISOString() ?? null,
      lastBotRefreshAt: orders.reduce((latest, order) => order.updatedAt > latest ? order.updatedAt : latest, orders[0].updatedAt).toISOString(),
      stale: isStale,
      riskStatus: isStale ? "reference_stale" : "ok",
      skipReason: null,
    };
  });
}

function displayUser(user: { username: string | null; email: string | null } | null | undefined) {
  return user?.username ?? user?.email ?? "unknown";
}

function eligibleWorldCupMarketWhere(staleCutoff: Date): Prisma.MarketWhereInput {
  return {
    event: {
      sportKey: "soccer",
      leagueKey: "world_cup",
      OR: [{ startTime: null }, { startTime: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } }],
      NOT: [{ status: { in: ["closed", "resolved", "ended", "canceled", "cancelled"] } }],
    },
    visibility: "PUBLIC" as const,
    isListed: true,
    referenceSource: "polymarket",
    referenceMetadata: { path: ["importStatus"], equals: "approved" },
    status: { in: ["LIVE", "UPCOMING"] },
    referenceQuoteSnapshots: { some: { source: "polymarket", fetchedAt: { gte: staleCutoff } } },
  };
}
