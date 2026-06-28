import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEventSummary } from "@/server/services/eventReadModel";
import { worldCupEligibleMarketWhere, worldCupFreshReferenceCutoff } from "@/server/services/worldCupPublicEligibility";

export async function GET() {
  const staleCutoff = worldCupFreshReferenceCutoff();
  const events = await prisma.event.findMany({
    where: {
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      OR: [{ startTime: null }, { startTime: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } }],
      NOT: [{ status: { in: ["closed", "resolved", "ended", "canceled", "cancelled"] } }],
      markets: { some: worldCupEligibleMarketWhere(staleCutoff) },
    },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { markets: true } },
      markets: { select: { status: true } },
    },
  });

  return NextResponse.json({
    events: events.map((event) => serializeEventSummary(event)),
  });
}
