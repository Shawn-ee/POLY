import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeEventSummary } from "@/server/services/eventReadModel";
import { marketReadInclude, serializeMarketReadModel } from "@/server/services/marketReadModel";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const paginationLimit = (value: string | null) => {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
};

const eventCursorFilter = (cursor: { updatedAt: Date; createdAt: Date; id: string } | null): Prisma.EventWhereInput =>
  cursor
    ? {
        OR: [
          { updatedAt: { lt: cursor.updatedAt } },
          {
            updatedAt: cursor.updatedAt,
            createdAt: { lt: cursor.createdAt },
          },
          {
            updatedAt: cursor.updatedAt,
            createdAt: cursor.createdAt,
            id: { lt: cursor.id },
          },
        ],
      }
    : {};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const sportKey = url.searchParams.get("sportKey")?.trim() ?? "";
  const leagueKey = url.searchParams.get("leagueKey")?.trim() ?? "";
  const source = url.searchParams.get("source")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const includeMobileMarkets = url.searchParams.get("includeMobileMarkets") === "1";
  const limit = paginationLimit(url.searchParams.get("limit"));
  const cursorId = url.searchParams.get("cursor")?.trim() ?? "";
  const cursor = cursorId
    ? await prisma.event.findUnique({ where: { id: cursorId }, select: { id: true, updatedAt: true, createdAt: true } })
    : null;

  if (cursorId && !cursor) {
    return NextResponse.json({ error: "Invalid event cursor." }, { status: 400 });
  }

  const eventFilters: Prisma.EventWhereInput[] = [
    eventCursorFilter(cursor),
    {
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
    },
  ];
  const where: Prisma.EventWhereInput = { AND: eventFilters };

  if (includeMobileMarkets) {
    const rows = await prisma.event.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: {
        markets: {
          where: { visibility: "PUBLIC", isListed: true },
          orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
          include: marketReadInclude,
        },
      },
    });
    const events = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? events[events.length - 1]?.id ?? null : null;

    return NextResponse.json({
      events: (await Promise.all(
        events.map(async (event) => {
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
          const compactMarketIds = new Set(selectCompactLiveMarkets(event.markets).map((market) => market.id));
          const mobileMarkets = await Promise.all(
            event.markets
              .filter((market) => compactMarketIds.has(market.id))
              .map((market) => serializeMarketReadModel(market)),
          );
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
            markets: mobileMarkets,
          };
        }),
      )).filter((event) => event.marketCount > 0),
      nextCursor,
      page: {
        limit,
        nextCursor,
        hasMore: Boolean(nextCursor),
      },
    });
  }

  const rows = await prisma.event.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      markets: {
        where: { visibility: "PUBLIC", isListed: true },
        select: { status: true, title: true, referenceMetadata: true },
      },
    },
  });
  const events = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? events[events.length - 1]?.id ?? null : null;

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
    nextCursor,
    page: {
      limit,
      nextCursor,
      hasMore: Boolean(nextCursor),
    },
  });
}
