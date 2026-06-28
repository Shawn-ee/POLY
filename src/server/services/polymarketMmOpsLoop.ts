import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { PolymarketDiscoveryClient, syncPolymarketReferencePricesOnce } from "@/server/services/polymarket";
import { runReferenceMarketMakerOnce, pauseAllReferenceMarketMakerQuotes } from "@/server/services/referenceMarketMaker";
import { runReferenceRiskMonitorOnce } from "@/server/services/referenceRiskMonitor";
import { generateResolutionProposalsOnce } from "@/server/services/resolutionProposalBot";

export const POLYMARKET_MM_STATUS_REPORT_PATH = path.join(
  process.cwd(),
  "docs",
  "reports",
  "POLYMARKET_REFERENCE_MM_STATUS.md",
);

export type PolymarketMmOpsStatus = {
  generatedAt: string;
  importedMarkets: number;
  verifiedMappings: number;
  referenceSnapshots: number;
  stalePrices: number;
  activeBotConfigs: number;
  totalBotConfigs: number;
  dryRunIntents: number;
  liveLocalOrders: number;
  openOrders: number;
  riskAlerts: number;
  pendingResolutionProposals: number;
  errors: string[];
  nextAction: string;
};

export type PolymarketMmLoopResult = {
  generatedAt: string;
  discovery: { attempted: boolean; candidateCount: number; error?: string };
  referenceSync: unknown;
  marketMaker: unknown;
  risk: unknown;
  resolution: unknown;
  status: PolymarketMmOpsStatus;
  reportPath: string;
};

export async function runPolymarketMmLoopOnce(options: {
  liveLocal?: boolean;
  reportPath?: string;
  skipDiscovery?: boolean;
} = {}): Promise<PolymarketMmLoopResult> {
  const errors: string[] = [];
  const discovery = await discoverCandidates(options.skipDiscovery === true).catch((error) => {
    const message = errorMessage(error);
    errors.push(`discovery:${message}`);
    return { attempted: true, candidateCount: 0, error: message };
  });
  const referenceSync = await syncPolymarketReferencePricesOnce({ onlyMmEnabled: false }).catch((error) => {
    const message = errorMessage(error);
    errors.push(`reference_sync:${message}`);
    return { error: message };
  });
  const marketMaker = await runReferenceMarketMakerOnce({ dryRun: options.liveLocal !== true }).catch((error) => {
    const message = errorMessage(error);
    errors.push(`market_maker:${message}`);
    return { error: message };
  });
  const risk = await runReferenceRiskMonitorOnce({
    pauseOnRisk: process.env.RISK_MONITOR_PAUSE_ON_ALERT === "true",
    logEvents: true,
  }).catch((error) => {
    const message = errorMessage(error);
    errors.push(`risk:${message}`);
    return { error: message };
  });
  const resolution = await generateResolutionProposalsOnce({ store: true }).catch((error) => {
    const message = errorMessage(error);
    errors.push(`resolution:${message}`);
    return { error: message };
  });

  const status = await getPolymarketMmOpsStatus(errors);
  const reportPath = await writePolymarketMmStatusReport(status, options.reportPath);
  return {
    generatedAt: new Date().toISOString(),
    discovery,
    referenceSync,
    marketMaker,
    risk,
    resolution,
    status,
    reportPath,
  };
}

export async function getPolymarketMmOpsStatus(errors: string[] = []): Promise<PolymarketMmOpsStatus> {
  const [importedMarkets, verifiedMappings, referenceSnapshots, stalePrices, activeBotConfigs, totalBotConfigs, dryRunIntents, liveLocalOrders, openOrders, riskResult, pendingResolutionProposals] =
    await Promise.all([
      prisma.market.count({ where: { referenceSource: "polymarket" } }),
      prisma.market.count({ where: { referenceSource: "polymarket", referenceMetadata: { path: ["importStatus"], equals: "approved" } } }),
      prisma.referenceQuoteSnapshot.count({ where: { source: "polymarket" } }),
      countStaleReferencePrices(),
      prisma.botQuoteConfig.count({ where: { source: "polymarket", enabled: true } }),
      prisma.botQuoteConfig.count({ where: { source: "polymarket" } }),
      prisma.botOrderIntent.count({ where: { dryRun: true } }),
      prisma.botOrderIntent.count({ where: { dryRun: false } }),
      prisma.order.count({ where: { status: { in: ["OPEN", "PARTIAL"] } } }),
      runReferenceRiskMonitorOnce({ pauseOnRisk: false, logEvents: false }).catch((error) => ({ alertCount: 0, error: errorMessage(error) })),
      countDistinctResolutionProposalMarkets(),
    ]);
  if ("error" in riskResult && riskResult.error) {
    errors.push(`risk_status:${riskResult.error}`);
  }

  return {
    generatedAt: new Date().toISOString(),
    importedMarkets,
    verifiedMappings,
    referenceSnapshots,
    stalePrices,
    activeBotConfigs,
    totalBotConfigs,
    dryRunIntents,
    liveLocalOrders,
    openOrders,
    riskAlerts: riskResult.alertCount,
    pendingResolutionProposals,
    errors,
    nextAction: errors.length > 0
      ? "Review loop errors before enabling live-local quoting."
      : activeBotConfigs > 0
        ? "Continue reference sync, dry-run quoting, risk monitor, and proposal generation."
        : "Review paused/disabled bot configs before placing live-local orders.",
  };
}

export async function stopPolymarketMmOpsLoop() {
  return pauseAllReferenceMarketMakerQuotes();
}

export async function writePolymarketMmStatusReport(status: PolymarketMmOpsStatus, outputPath = POLYMARKET_MM_STATUS_REPORT_PATH) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${formatPolymarketMmStatusReport(status)}\n`, "utf8");
  return outputPath;
}

export function formatPolymarketMmStatusReport(status: PolymarketMmOpsStatus) {
  const rows = [
    ["Imported Polymarket markets", status.importedMarkets],
    ["Verified mappings", status.verifiedMappings],
    ["Reference snapshots", status.referenceSnapshots],
    ["Stale prices", status.stalePrices],
    ["Active bot configs", status.activeBotConfigs],
    ["Total bot configs", status.totalBotConfigs],
    ["Dry-run intents", status.dryRunIntents],
    ["Live-local orders/intents", status.liveLocalOrders],
    ["Open orders", status.openOrders],
    ["Risk alerts", status.riskAlerts],
    ["Pending resolution proposals", status.pendingResolutionProposals],
  ];
  return [
    "# Polymarket Reference MM Status",
    "",
    `Generated: ${status.generatedAt}`,
    "",
    "| Area | Value |",
    "| --- | ---: |",
    ...rows.map(([label, value]) => `| ${label} | ${value} |`),
    "",
    "## Errors",
    "",
    ...(status.errors.length > 0 ? status.errors.map((error) => `- ${error}`) : ["- none"]),
    "",
    "## Next Action",
    "",
    status.nextAction,
    "",
    "## Safety",
    "",
    "- Production deployment: not performed",
    "- Real-money mode: not enabled by this loop",
    "- Automatic crypto payout signing: not implemented",
  ].join("\n");
}

async function discoverCandidates(skipDiscovery: boolean) {
  if (skipDiscovery) {
    return { attempted: false, candidateCount: 0 };
  }
  const client = new PolymarketDiscoveryClient();
  const candidates = await client.discoverWorldCupImportCandidates({ limit: 25 });
  return { attempted: true, candidateCount: candidates.length };
}

async function countStaleReferencePrices() {
  const snapshots = await prisma.referenceQuoteSnapshot.findMany({
    where: { source: "polymarket" },
    select: { fetchedAt: true, market: { select: { botQuoteConfigs: { where: { source: "polymarket" }, select: { staleAfterSeconds: true }, take: 1 } } } },
  });
  const now = Date.now();
  return snapshots.filter((snapshot) => {
    const staleAfterSeconds = snapshot.market.botQuoteConfigs[0]?.staleAfterSeconds ?? 60;
    return now - snapshot.fetchedAt.getTime() > staleAfterSeconds * 1000;
  }).length;
}

async function countDistinctResolutionProposalMarkets() {
  const rows = await prisma.canonicalEvent.groupBy({
    by: ["marketId"],
    where: { eventType: "resolution_proposal", marketId: { not: null } },
  });
  return rows.length;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
