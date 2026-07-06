import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeEventSummary } from "@/server/services/eventReadModel";
import { marketReadInclude, serializeMarketReadModel } from "@/server/services/marketReadModel";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";
import { resolveSortedMobilePageStart } from "@/server/services/mobileEventPagination";
import { eventMarketTypeFilter, listedMarketWhere } from "@/server/services/mobileEventListFilters";
import { eventStatusGroupFilter } from "@/server/services/mobileEventStatusFilters";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

type MobileMarketReadModel = Awaited<ReturnType<typeof serializeMarketReadModel>>;

const asNumberOrNull = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildMobileEventMetrics = ({
  marketCount,
  activeMarketCount,
  markets,
}: {
  marketCount: number;
  activeMarketCount: number;
  markets: MobileMarketReadModel[];
}) => {
  const liquidityTotal = markets.reduce((sum, market) => sum + (asNumberOrNull(market.liquidity) ?? 0), 0);

  return {
    source: "event-route-mobile-markets",
    marketCount,
    activeMarketCount,
    liquidity: liquidityTotal > 0 ? liquidityTotal : null,
    volume24h: null,
    commentCount: null,
  };
};

const mobileSortBy = (value: string | null) => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  return normalized === "popular" || normalized === "live" ? normalized : null;
};

const asTime = (value: unknown) => {
  const time = value instanceof Date ? value.getTime() : new Date(String(value ?? "")).getTime();
  return Number.isFinite(time) ? time : 0;
};

const isLiveEventStatus = (event: { status?: unknown; liveStatus?: unknown }) => {
  const status = `${event.status ?? ""}`.trim().toLowerCase();
  const liveStatus = `${event.liveStatus ?? ""}`.trim().toLowerCase();
  return status === "live" || liveStatus === "live" || liveStatus === "in_progress";
};

const sortMobileEventRows = <T extends {
  id: string;
  status?: unknown;
  liveStatus?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
  metrics?: { marketCount?: number | string | null; activeMarketCount?: number | string | null; liquidity?: number | string | null };
  marketCount?: number | string | null;
  activeMarketCount?: number | string | null;
}>(events: T[], sortBy: "popular" | "live") =>
  [...events].sort((left, right) => {
    if (sortBy === "live") {
      const liveDelta = Number(isLiveEventStatus(right)) - Number(isLiveEventStatus(left));
      if (liveDelta !== 0) return liveDelta;
    }

    const activeMarketDelta =
      (asNumberOrNull(right.metrics?.activeMarketCount ?? right.activeMarketCount) ?? 0) -
      (asNumberOrNull(left.metrics?.activeMarketCount ?? left.activeMarketCount) ?? 0);
    if (activeMarketDelta !== 0) return activeMarketDelta;

    const marketDelta =
      (asNumberOrNull(right.metrics?.marketCount ?? right.marketCount) ?? 0) -
      (asNumberOrNull(left.metrics?.marketCount ?? left.marketCount) ?? 0);
    if (marketDelta !== 0) return marketDelta;

    const liquidityDelta =
      (asNumberOrNull(right.metrics?.liquidity) ?? 0) -
      (asNumberOrNull(left.metrics?.liquidity) ?? 0);
    if (liquidityDelta !== 0) return liquidityDelta;

    const updatedDelta = asTime(right.updatedAt) - asTime(left.updatedAt);
    if (updatedDelta !== 0) return updatedDelta;

    const createdDelta = asTime(right.createdAt) - asTime(left.createdAt);
    if (createdDelta !== 0) return createdDelta;

    return right.id.localeCompare(left.id);
  });

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

const eventSearchFilter = (search: string): Prisma.EventWhereInput =>
  search
    ? {
        OR: [
          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { homeTeamName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { awayTeamName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            markets: {
              some: {
                OR: [
                  { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  {
                    outcomes: {
                      some: {
                        OR: [
                          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { label: { contains: search, mode: Prisma.QueryMode.insensitive } },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
    }
    : {};

const eventIdsFilter = (eventIds: string[]): Prisma.EventWhereInput =>
  eventIds.length ? { id: { in: eventIds } } : {};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const sportKey = url.searchParams.get("sportKey")?.trim() ?? "";
  const leagueKey = url.searchParams.get("leagueKey")?.trim() ?? "";
  const source = url.searchParams.get("source")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const statusGroup = url.searchParams.get("statusGroup")?.trim() ?? "";
  const marketType = url.searchParams.get("marketType")?.trim() ?? "";
  const sortBy = mobileSortBy(url.searchParams.get("sortBy"));
  const eventIds = (url.searchParams.get("eventIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 100);
  const includeMobileMarkets = url.searchParams.get("includeMobileMarkets") === "1";
  const useMobileSortedPage = includeMobileMarkets && Boolean(sortBy);
  const limit = paginationLimit(url.searchParams.get("limit"));
  const cursorId = url.searchParams.get("cursor")?.trim() ?? "";
  const cursor = cursorId
    ? await prisma.event.findUnique({ where: { id: cursorId }, select: { id: true, updatedAt: true, createdAt: true } })
    : null;

  if (cursorId && !cursor) {
    return NextResponse.json({ error: "Invalid event cursor." }, { status: 400 });
  }

  const eventFilters: Prisma.EventWhereInput[] = [
    useMobileSortedPage ? {} : eventCursorFilter(cursor),
    eventIdsFilter(eventIds),
    eventMarketTypeFilter(marketType),
    {
      ...eventSearchFilter(search),
      ...(category ? { category } : {}),
      ...(sportKey ? { sportKey } : {}),
      ...(leagueKey ? { leagueKey } : {}),
      ...(source ? { source } : {}),
      ...(status ? { status } : {}),
      ...(!status && statusGroup ? eventStatusGroupFilter(statusGroup) : {}),
    },
  ];
  const where: Prisma.EventWhereInput = { AND: eventFilters };

  if (includeMobileMarkets) {
    const rows = await prisma.event.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: useMobileSortedPage ? MAX_LIMIT : limit + 1,
      include: {
        markets: {
          where: listedMarketWhere(marketType),
          orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
          include: marketReadInclude,
        },
      },
    });
    const events = useMobileSortedPage ? rows : rows.slice(0, limit);

    const mobileEvents = (await Promise.all(
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
          const metrics = buildMobileEventMetrics({
            marketCount: event.markets.length,
            activeMarketCount,
            markets: mobileMarkets,
          });
          return {
            ...base,
            marketCount: event.markets.length,
            activeMarketCount,
            metrics,
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
      )).filter((event) => event.marketCount > 0);
    const orderedEvents = sortBy ? sortMobileEventRows(mobileEvents, sortBy) : mobileEvents;
    const sortedPageStart = sortBy
      ? resolveSortedMobilePageStart(orderedEvents.map((event) => event.id), cursorId)
      : { pageStart: 0, error: null };
    if (sortedPageStart.error) {
      return NextResponse.json({ error: sortedPageStart.error }, { status: 400 });
    }
    const pageStart = sortedPageStart.pageStart;
    const pageEvents = sortBy ? orderedEvents.slice(pageStart, pageStart + limit) : orderedEvents;
    const nextCursor = sortBy
      ? orderedEvents.length > pageStart + limit ? pageEvents[pageEvents.length - 1]?.id ?? null : null
      : rows.length > limit ? pageEvents[pageEvents.length - 1]?.id ?? null : null;

    return NextResponse.json({
      events: pageEvents,
      nextCursor,
      page: {
        limit,
        nextCursor,
        hasMore: Boolean(nextCursor),
        sortBy,
      },
    });
  }

  const rows = await prisma.event.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      markets: {
        where: listedMarketWhere(marketType),
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
