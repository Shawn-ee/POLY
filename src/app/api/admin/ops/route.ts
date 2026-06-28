import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";

export async function GET() {
  try {
    await assertReferenceBotAdmin();
    const [
      referenceMarkets,
      verifiedMappings,
      referenceSnapshots,
      botConfigs,
      dryRunIntents,
      liveLocalOrders,
      openOrders,
      pendingResolutionMarkets,
      resolutionProposals,
    ] = await Promise.all([
      prisma.market.count({ where: { referenceSource: "polymarket" } }),
      prisma.market.count({ where: { referenceSource: "polymarket", referenceMetadata: { path: ["importStatus"], equals: "approved" } } }),
      prisma.referenceQuoteSnapshot.count({ where: { source: "polymarket" } }),
      prisma.botQuoteConfig.count({ where: { source: "polymarket" } }),
      prisma.botOrderIntent.count({ where: { dryRun: true } }),
      prisma.botOrderIntent.count({ where: { dryRun: false } }),
      prisma.order.count({ where: { status: { in: ["OPEN", "PARTIAL"] } } }),
      prisma.market.count({ where: { status: { in: ["CLOSED", "PAUSED"] }, resolvedOutcomeId: null } }),
      prisma.canonicalEvent.count({ where: { eventType: "resolution_proposal" } }),
    ]);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      referenceMarkets,
      verifiedMappings,
      referenceSnapshots,
      botConfigs,
      dryRunIntents,
      liveLocalIntents: liveLocalOrders,
      openOrders,
      pendingResolutionMarkets,
      resolutionProposals,
      safety: {
        productionDeploy: false,
        realMoneyMode: process.env.REAL_MONEY_MODE === "true",
        automaticCryptoPayoutSigning: false,
      },
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
