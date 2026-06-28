import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeEventSummary } from "@/server/services/eventReadModel";
import { eventWithWorldCupEligibilityWhere, publicEventMarketWhere, worldCupFreshReferenceCutoff } from "@/server/services/worldCupPublicEligibility";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const sportKey = url.searchParams.get("sportKey")?.trim() ?? "";
  const leagueKey = url.searchParams.get("leagueKey")?.trim() ?? "";
  const source = url.searchParams.get("source")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";

  const where: Prisma.EventWhereInput = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
        : {}),
    ...(category ? { category } : {}),
    ...(sportKey ? { sportKey } : {}),
    ...(leagueKey ? { leagueKey } : {}),
    ...(source ? { source } : {}),
    ...(status ? { status } : {}),
  };

  const staleCutoff = worldCupFreshReferenceCutoff();
  const events = await prisma.event.findMany({
    where: { ...where, AND: [eventWithWorldCupEligibilityWhere(staleCutoff)] },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      markets: {
        where: publicEventMarketWhere(staleCutoff),
        select: { status: true, title: true, referenceMetadata: true },
      },
    },
  });

  return NextResponse.json({
    events: events
      .map((event) => {
        const base = serializeEventSummary(event);
        const metadata =
          event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
            ? (event.metadata as Record<string, unknown>)
            : {};
        const referenceGroup =
          metadata.referenceGroup && typeof metadata.referenceGroup === "object" && !Array.isArray(metadata.referenceGroup)
            ? (metadata.referenceGroup as Record<string, unknown>)
            : null;
        const activeMarketCount = event.markets.filter((market) => market.status === "LIVE").length;
        const topOutcomes = event.markets
          .map((market) => {
            const marketMetadata =
              market.referenceMetadata && typeof market.referenceMetadata === "object" && !Array.isArray(market.referenceMetadata)
                ? (market.referenceMetadata as Record<string, unknown>)
                : {};
            const group =
              marketMetadata.group && typeof marketMetadata.group === "object" && !Array.isArray(marketMetadata.group)
                ? (marketMetadata.group as Record<string, unknown>)
                : null;
            return typeof group?.outcomeLabel === "string" ? group.outcomeLabel : null;
          })
          .filter((value): value is string => Boolean(value))
          .slice(0, 4);
        return {
          ...base,
          marketCount: event.markets.length,
          activeMarketCount,
          hasGroupedMarkets: Boolean(referenceGroup) || base.hasGroupedMarkets,
          groupedSummary:
            referenceGroup && typeof referenceGroup.slug === "string"
              ? {
                  title: typeof referenceGroup.title === "string" ? referenceGroup.title : "Group",
                  slug: referenceGroup.slug,
                }
              : null,
          topOutcomes,
        };
      })
      .filter((event) => event.marketCount > 0),
  });
}
