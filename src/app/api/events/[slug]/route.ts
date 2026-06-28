import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { marketReadInclude, serializeMarketReadModel } from "@/server/services/marketReadModel";
import { serializeEventSummary } from "@/server/services/eventReadModel";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { markets: true },
      },
      markets: {
        where: { visibility: "PUBLIC", isListed: true },
        include: marketReadInclude,
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const activeMarketCount = event.markets.filter((market) => market.status === "LIVE").length;
  const closedMarketCount = event.markets.filter(
    (market) => market.status === "CLOSED" || market.status === "RESOLVED",
  ).length;
  const markets = await Promise.all(event.markets.map((market) => serializeMarketReadModel(market)));

  return NextResponse.json({
    event: {
      ...serializeEventSummary(event),
      marketCount: event.markets.length,
      activeMarketCount,
      closedMarketCount,
      hasGroupedMarkets:
        Boolean(
          event.metadata &&
            typeof event.metadata === "object" &&
            !Array.isArray(event.metadata) &&
            "referenceGroup" in (event.metadata as Record<string, unknown>),
        ),
    },
    markets,
  });
}
