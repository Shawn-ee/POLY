import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildWorldCupEventPageModel } from "@/lib/sports/worldCupEventPageModel";
import { isWorldCupSoccerEvent } from "@/lib/sports/worldCupEventDetection";
import { serializeEventSummary } from "@/server/services/eventReadModel";
import { marketReadInclude, serializeMarketReadModel } from "@/server/services/marketReadModel";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      _count: { select: { markets: true } },
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

  const summary = serializeEventSummary(event);
  if (!isWorldCupSoccerEvent(summary)) {
    return NextResponse.json({ error: "World Cup event not found." }, { status: 404 });
  }

  const markets = await Promise.all(event.markets.map((market) => serializeMarketReadModel(market)));
  const model = buildWorldCupEventPageModel({
    event: summary,
    markets,
    internalTradingEnabled: process.env.INTERNAL_TRADING_BETA_ENABLED === "true",
    tradingKillSwitch: process.env.TRADING_KILL_SWITCH === "true",
    realMoneyMode: process.env.REAL_MONEY_MODE === "true",
  });

  return NextResponse.json({ model });
}
