import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";

export async function GET() {
  try {
    await assertReferenceBotAdmin();
    const now = Date.now();
    const [configs, snapshots] = await Promise.all([
      prisma.botQuoteConfig.findMany({
        where: { source: "polymarket" },
        include: { market: { select: { id: true, title: true } }, outcome: { select: { id: true, name: true } } },
      }),
      prisma.referenceQuoteSnapshot.findMany({
        where: { source: "polymarket" },
        include: { market: { select: { id: true, title: true } }, outcome: { select: { id: true, name: true } } },
        orderBy: { fetchedAt: "desc" },
        take: 200,
      }),
    ]);
    const staleAfterByMarket = new Map(configs.map((config) => [config.marketId, config.staleAfterSeconds]));
    const alerts = snapshots
      .map((snapshot) => {
        const staleAfter = staleAfterByMarket.get(snapshot.marketId) ?? 60;
        const ageSeconds = Math.max(0, Math.floor((now - snapshot.fetchedAt.getTime()) / 1000));
        const stale = ageSeconds > staleAfter || !snapshot.mmEligible;
        return {
          marketId: snapshot.marketId,
          marketTitle: snapshot.market.title,
          outcomeId: snapshot.outcomeId,
          outcomeName: snapshot.outcome.name,
          ageSeconds,
          staleAfterSeconds: staleAfter,
          qualityStatus: snapshot.qualityStatus,
          mmEligible: snapshot.mmEligible,
          reason: snapshot.reason,
          stale,
        };
      })
      .filter((item) => item.stale);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      configCount: configs.length,
      snapshotCount: snapshots.length,
      alertCount: alerts.length,
      alerts,
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
