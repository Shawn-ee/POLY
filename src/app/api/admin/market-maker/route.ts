import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { runReferenceMarketMakerOnce } from "@/server/services/referenceMarketMaker";

export async function GET() {
  try {
    await assertReferenceBotAdmin();
    const [configs, intents, openOrders] = await Promise.all([
      prisma.botQuoteConfig.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 50,
        include: {
          market: { select: { id: true, title: true, externalSlug: true, referenceSource: true } },
          outcome: { select: { id: true, name: true } },
        },
      }),
      prisma.botOrderIntent.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        include: {
          market: { select: { id: true, title: true } },
          outcome: { select: { id: true, name: true } },
        },
      }),
      prisma.order.findMany({
        where: { status: { in: ["OPEN", "PARTIAL"] } },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        include: {
          user: { select: { id: true, username: true, email: true } },
          market: { select: { id: true, title: true, referenceSource: true } },
          outcome: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      configs: configs.map((config) => ({
        id: config.id,
        marketId: config.marketId,
        marketTitle: config.market.title,
        externalSlug: config.market.externalSlug,
        outcomeId: config.outcomeId,
        outcomeName: config.outcome?.name ?? null,
        enabled: config.enabled,
        dryRun: config.dryRun,
        source: config.source,
        edgeTicks: config.edgeTicks,
        tickSize: config.tickSize.toString(),
        baseOrderSize: config.baseOrderSize.toString(),
        maxOrderSize: config.maxOrderSize.toString(),
        maxMarketExposure: config.maxMarketExposure.toString(),
        staleAfterSeconds: config.staleAfterSeconds,
        updatedAt: config.updatedAt.toISOString(),
      })),
      intents: intents.map((intent) => ({
        id: intent.id,
        marketId: intent.marketId,
        marketTitle: intent.market.title,
        outcomeId: intent.outcomeId,
        outcomeName: intent.outcome.name,
        side: intent.side,
        price: intent.price.toString(),
        size: intent.size.toString(),
        reason: intent.reason,
        status: intent.status,
        dryRun: intent.dryRun,
        createdAt: intent.createdAt.toISOString(),
      })),
      openOrders: openOrders.map((order) => ({
        id: order.id,
        userId: order.userId,
        username: order.user.username ?? order.user.email,
        marketId: order.marketId,
        marketTitle: order.market.title,
        outcomeId: order.outcomeId,
        outcomeName: order.outcome.name,
        side: order.side,
        price: order.price.toString(),
        remaining: order.remaining.toString(),
        reservedNotional: order.reservedNotional.toString(),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function POST() {
  try {
    await assertReferenceBotAdmin();
    const result = await runReferenceMarketMakerOnce({ dryRun: true });
    return NextResponse.json(result);
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
