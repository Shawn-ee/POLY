import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { marketReadInclude, serializeMarketReadModel } from "@/server/services/marketReadModel";
import { publicEventMarketWhere, worldCupFreshReferenceCutoff } from "@/server/services/worldCupPublicEligibility";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const markets = await prisma.market.findMany({
    where: { eventId: event.id, AND: [publicEventMarketWhere(worldCupFreshReferenceCutoff())] },
    orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { marketType: "asc" }, { createdAt: "asc" }],
    include: marketReadInclude,
  });

  const payload = await Promise.all(markets.map((market) => serializeMarketReadModel(market)));
  return NextResponse.json({ markets: payload });
}
