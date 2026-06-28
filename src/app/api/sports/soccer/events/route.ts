import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEventSummary } from "@/server/services/eventReadModel";
import { eventWithWorldCupEligibilityWhere, publicEventMarketWhere, worldCupFreshReferenceCutoff } from "@/server/services/worldCupPublicEligibility";

export async function GET() {
  const staleCutoff = worldCupFreshReferenceCutoff();
  const events = await prisma.event.findMany({
    where: { category: "sports", sportKey: "soccer", AND: [eventWithWorldCupEligibilityWhere(staleCutoff)] },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { markets: true } },
      markets: { where: publicEventMarketWhere(staleCutoff), select: { status: true } },
    },
  });

  return NextResponse.json({
    events: events.map((event) => serializeEventSummary(event)),
  });
}
