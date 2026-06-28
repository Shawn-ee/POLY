import type { Event } from "@prisma/client";

type EventCounts = {
  markets?: number | { markets?: number };
};

export const serializeEventSummary = (
  event: Pick<
    Event,
    | "id"
    | "slug"
    | "title"
    | "description"
    | "category"
    | "sportKey"
    | "leagueKey"
    | "eventType"
    | "homeTeamName"
    | "awayTeamName"
    | "startTime"
    | "status"
    | "liveStatus"
    | "period"
    | "clock"
    | "homeScore"
    | "awayScore"
    | "source"
    | "externalEventId"
    | "externalSlug"
    | "venue"
    | "image"
    | "imageUrl"
    | "icon"
    | "metadata"
    | "sourceUpdatedAt"
    | "createdAt"
    | "updatedAt"
  > & {
    _count?: EventCounts;
    markets?: Array<{ status: string; referenceMetadata?: unknown }>;
  },
) => {
  const markets = event.markets ?? [];
  const marketCount =
    typeof event._count?.markets === "number"
      ? event._count.markets
      : typeof event._count?.markets === "object"
        ? event._count.markets.markets ?? markets.length
        : markets.length;
  const activeMarketCount = markets.filter((market) => market.status === "LIVE").length;
  const metadata =
    event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
      ? (event.metadata as Record<string, unknown>)
      : {};

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    category: event.category,
    sportKey: event.sportKey,
    leagueKey: event.leagueKey,
    eventType: event.eventType,
    homeTeamName: event.homeTeamName,
    awayTeamName: event.awayTeamName,
    startTime: event.startTime,
    status: event.status,
    liveStatus: event.liveStatus,
    period: event.period,
    clock: event.clock,
    homeScore: event.homeScore,
    awayScore: event.awayScore,
    venue: event.venue,
    image: event.image,
    imageUrl: event.imageUrl,
    icon: event.icon,
    marketCount,
    activeMarketCount,
    hasGroupedMarkets: Boolean(metadata.referenceGroup),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};
