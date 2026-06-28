import { prisma } from "@/lib/db";
import { referenceSnapshotConfig } from "@/server/services/referenceQuoteSnapshots";

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
    unmappedWorldCupMarkets,
    enabledMmConfigs,
    dryRunMmConfigs,
    openBotOrders,
    dryRunIntents,
    liveLocalIntents,
    riskAlerts,
    publicDraftLeakCount,
    worldCupEvents,
    hiddenStaleEvents,
    ownerBalanceCount,
  ] = await Promise.all([
    prisma.referenceQuoteSnapshot.findFirst({
      where: { source: "polymarket" },
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    }),
    prisma.referenceQuoteSnapshot.count({ where: { source: "polymarket" } }),
    prisma.referenceQuoteSnapshot.count({ where: { source: "polymarket", fetchedAt: { gte: staleCutoff } } }),
    prisma.referenceQuoteSnapshot.count({ where: { source: "polymarket", fetchedAt: { lt: staleCutoff } } }),
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
    prisma.canonicalEvent.count({ where: { eventType: { contains: "risk" } } }).catch(() => 0),
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
    prisma.event.count({
      where: {
        sportKey: "soccer",
        leagueKey: "world_cup",
        OR: [{ status: { in: ["closed", "resolved", "ended"] } }, { startTime: { lt: new Date(now.getTime() - 6 * 60 * 60 * 1000) } }],
      },
    }),
    prisma.userBalance.count({ where: { availableUSDC: { gt: 0 } } }),
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

  return {
    generatedAt: now.toISOString(),
    serviceHealth: {
      referenceSyncHeartbeat: latestReference?.fetchedAt?.toISOString() ?? null,
      mmHeartbeat: null,
      status: unsafeFlags.length ? "unsafe_env" : "ready_for_rehearsal",
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
    },
    worldCup: {
      events: worldCupEvents,
      mappedMarkets,
      unmappedMarkets: unmappedWorldCupMarkets,
      hiddenStaleEvents,
      publicDraftLeakCount,
    },
    risk: {
      alerts: riskAlerts,
      unsafeFlags,
    },
    safety,
    ownerTesting: {
      canOwnerTrade: unsafeFlags.length === 0 && enabledMmConfigs > 0,
      ownerTestBalanceRecords: ownerBalanceCount,
      activeLiquidityMarkets: enabledMmConfigs,
    },
  };
}
