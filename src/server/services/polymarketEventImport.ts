import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { upsertPolymarketReferenceMarket } from "@/server/services/polymarketReferenceImport";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";

type GammaWire = Record<string, unknown>;

export type PolymarketGroupedEventMarket = {
  question: string;
  slug: string;
  marketId: string;
  conditionId: string | null;
  groupItemTitle: string | null;
  outcomes: string[];
  clobTokenIds: string[];
  outcomePrices: number[];
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  lastTradePrice: number | null;
  volume: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  liquidityClob: number | null;
  acceptingOrders: boolean;
  active: boolean;
  closed: boolean;
  archived: boolean;
  endDate: string | null;
  image: string | null;
  icon: string | null;
  raw: GammaWire;
};

export type PolymarketGroupedEvent = {
  eventId: string;
  eventSlug: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string | null;
  source: "polymarket";
  externalEventId: string;
  externalSlug: string;
  image: string | null;
  icon: string | null;
  active: boolean;
  closed: boolean;
  archived: boolean;
  startTime: string | null;
  endDate: string | null;
  volume: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  liquidityClob: number | null;
  tags: string[];
  negativeRiskLike: boolean;
  markets: PolymarketGroupedEventMarket[];
  raw: GammaWire;
};

export type ImportPolymarketEventOptions = {
  dryRun: boolean;
  confirmImport: boolean;
  actorUserId: string;
  maxMarkets?: number | null;
};

export type ImportPolymarketEventResult = {
  ok: boolean;
  dryRun: boolean;
  eventId: string | null;
  eventSlug: string;
  localEventSlug: string;
  importedCount: number;
  skippedCount: number;
  groupedMarketCount: number;
  imported: Array<{
    team: string;
    slug: string;
    marketId: string;
    localMarketId: string | null;
    importStatus: string;
  }>;
  skipped: Array<{
    team: string;
    slug: string;
    reason: string;
  }>;
};

export async function fetchPolymarketEventBySlug(
  eventSlug: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PolymarketGroupedEvent> {
  const url = new URL("/events", GAMMA_BASE_URL);
  url.searchParams.set("slug", eventSlug);
  const response = await fetchImpl(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Gamma event request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length === 0 || !payload[0] || typeof payload[0] !== "object") {
    throw new Error("Gamma event payload was empty or malformed.");
  }
  return normalizeGammaEvent(payload[0] as GammaWire);
}

export async function importPolymarketGroupedEvent(
  eventSlug: string,
  options: ImportPolymarketEventOptions,
): Promise<ImportPolymarketEventResult> {
  if (!options.dryRun && !options.confirmImport) {
    throw new Error("confirmImport=true is required for live event import.");
  }

  const groupedEvent = await fetchPolymarketEventBySlug(eventSlug);
  const filteredMarkets = groupedEvent.markets
    .filter((market) => market.active && !market.closed && !market.archived)
    .filter((market) => market.outcomes.length === 2 && market.clobTokenIds.length >= 2)
    .slice(0, options.maxMarkets && options.maxMarkets > 0 ? options.maxMarkets : undefined);

  const imported: ImportPolymarketEventResult["imported"] = [];
  const skipped: ImportPolymarketEventResult["skipped"] = [];

  if (options.dryRun) {
    for (const market of filteredMarkets) {
      const qualityStatus = deriveQualityStatus(market);
      imported.push({
        team: market.groupItemTitle ?? market.question,
        slug: market.slug,
        marketId: market.marketId,
        localMarketId: null,
        importStatus: qualityStatus === "approved" ? "approved" : "pending_review",
      });
    }
    return {
      ok: true,
      dryRun: true,
      eventId: null,
      eventSlug,
      localEventSlug: deriveLocalEventSlug(groupedEvent),
      importedCount: imported.length,
      skippedCount: skipped.length,
      groupedMarketCount: filteredMarkets.length,
      imported,
      skipped,
    };
  }

  const localEventSlug = deriveLocalEventSlug(groupedEvent);
  const localEvent = await prisma.event.upsert({
    where: { slug: localEventSlug },
    update: {
      title: groupedEvent.title.trim(),
      description: groupedEvent.description,
      category: "sports",
      status: groupedEvent.active ? "active" : groupedEvent.closed ? "closed" : "upcoming",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: parseMatchTeams(groupedEvent.title)?.home ?? null,
      awayTeamName: parseMatchTeams(groupedEvent.title)?.away ?? null,
      startTime: groupedEvent.startTime ?? groupedEvent.endDate,
      liveStatus: groupedEvent.active ? "pre_match" : groupedEvent.closed ? "closed" : "scheduled",
      source: "polymarket",
      externalEventId: groupedEvent.externalEventId,
      externalSlug: groupedEvent.externalSlug,
      image: groupedEvent.image,
      icon: groupedEvent.icon,
      metadata: buildEventMetadata(groupedEvent),
    },
    create: {
      slug: localEventSlug,
      title: groupedEvent.title.trim(),
      description: groupedEvent.description,
      category: "sports",
      status: groupedEvent.active ? "active" : groupedEvent.closed ? "closed" : "upcoming",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: parseMatchTeams(groupedEvent.title)?.home ?? null,
      awayTeamName: parseMatchTeams(groupedEvent.title)?.away ?? null,
      startTime: groupedEvent.startTime ?? groupedEvent.endDate,
      liveStatus: groupedEvent.active ? "pre_match" : groupedEvent.closed ? "closed" : "scheduled",
      source: "polymarket",
      externalEventId: groupedEvent.externalEventId,
      externalSlug: groupedEvent.externalSlug,
      image: groupedEvent.image,
      icon: groupedEvent.icon,
      metadata: buildEventMetadata(groupedEvent),
      createdBy: options.actorUserId,
    },
  });

  for (const market of filteredMarkets) {
    const teamLabel = market.groupItemTitle ?? extractTeamLabel(market.question);
    const qualityStatus = deriveQualityStatus(market);
    const classification = classifyGroupedMarket(market);
    try {
      const result = await upsertPolymarketReferenceMarket(
        {
          createEvents: false,
          event: null,
          market: {
            title: market.question,
            description: groupedEvent.description,
            category: groupedEvent.category ?? "Sports / Soccer",
            resolveTime: market.endDate,
            type: "BINARY",
            marketType: classification.marketType,
            marketGroupKey: classification.marketGroupKey,
            marketGroupTitle: classification.marketGroupTitle,
            line: classification.line,
            unit: classification.unit,
            period: classification.period,
            participantType: classification.participantType,
            participantName: classification.participantName ?? teamLabel,
            propCategory: classification.propCategory,
            desiredStatus: "live",
            externalMarketId: market.marketId,
            conditionId: market.conditionId,
            externalSlug: market.slug,
            referenceSource: "polymarket",
            referenceMetadata: {
              importedFrom: "polymarket",
              importStatus: qualityStatus === "approved" ? "approved" : "pending_review",
              referenceOnly: true,
              tradable: false,
              mmEnabled: false,
              reviewedAt: qualityStatus === "approved" ? new Date().toISOString() : null,
              reviewedBy: qualityStatus === "approved" ? options.actorUserId : null,
              reviewNotes: qualityStatus === "approved" ? "Imported from grouped World Cup event." : "Imported pending review from grouped World Cup event.",
              group: {
                title: "Winner",
                slug: "winner",
                groupType: "MUTUALLY_EXCLUSIVE",
                resolutionMode: "ONE_WINNER",
                source: "polymarket",
                externalSlug: groupedEvent.externalSlug,
                eventSlug: localEventSlug,
                outcomeLabel: teamLabel,
                negativeRiskLike: true,
                expectedSumYesAround: 1,
              },
              sourceEvent: {
                externalEventId: groupedEvent.externalEventId,
                externalSlug: groupedEvent.externalSlug,
                title: groupedEvent.title,
              },
              sourceMarket: {
                bestBid: market.bestBid,
                bestAsk: market.bestAsk,
                spread: market.spread,
                lastTradePrice: market.lastTradePrice,
                volume: market.volume,
                volume24hr: market.volume24hr,
                liquidity: market.liquidity,
                liquidityClob: market.liquidityClob,
                acceptingOrders: market.acceptingOrders,
                active: market.active,
                closed: market.closed,
                archived: market.archived,
              },
            },
            outcomes: [
              {
                name: "Yes",
                displayOrder: 0,
                isTradable: false,
                referenceTokenId: market.clobTokenIds[0] ?? null,
                referenceOutcomeLabel: "Yes",
                referenceMetadata: {
                  importedOutcomeLabel: "Yes",
                  teamLabel,
                  outcomePrice: market.outcomePrices[0] ?? null,
                },
              },
              {
                name: "No",
                displayOrder: 1,
                isTradable: false,
                referenceTokenId: market.clobTokenIds[1] ?? null,
                referenceOutcomeLabel: "No",
                referenceMetadata: {
                  importedOutcomeLabel: "No",
                  teamLabel,
                  outcomePrice: market.outcomePrices[1] ?? null,
                },
              },
            ],
          },
        },
        options.actorUserId,
      );

      await prisma.market.update({
        where: { id: result.marketId },
        data: {
          eventId: localEvent.id,
          isListed: true,
          referenceMetadata: buildListedReferenceMetadata({
            current: await prisma.market.findUnique({ where: { id: result.marketId }, select: { referenceMetadata: true } }).then((row) => row?.referenceMetadata ?? null),
            teamLabel,
          }),
        },
      });

      imported.push({
        team: teamLabel,
        slug: market.slug,
        marketId: market.marketId,
        localMarketId: result.marketId,
        importStatus: qualityStatus === "approved" ? "approved" : "pending_review",
      });
    } catch (error) {
      skipped.push({
        team: teamLabel,
        slug: market.slug,
        reason: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  return {
    ok: true,
    dryRun: false,
    eventId: localEvent.id,
    eventSlug,
    localEventSlug,
    importedCount: imported.length,
    skippedCount: skipped.length,
    groupedMarketCount: filteredMarkets.length,
    imported,
    skipped,
  };
}

function normalizeGammaEvent(input: GammaWire): PolymarketGroupedEvent {
  const externalEventId = asString(input.id);
  const externalSlug = asString(input.slug) ?? asString(input.ticker);
  const title = asString(input.title) ?? asString(input.slug);
  if (!externalEventId || !externalSlug || !title) {
    throw new Error("Gamma event payload is missing required fields.");
  }
  const markets = Array.isArray(input.markets)
    ? input.markets.filter((item): item is GammaWire => Boolean(item && typeof item === "object")).map(normalizeGammaEventMarket)
    : [];
  return {
    eventId: externalEventId,
    eventSlug: externalSlug,
    title,
    description: asString(input.description),
    category: deriveEventCategory(input),
    status: asString(input.status),
    source: "polymarket",
    externalEventId,
    externalSlug,
    image: asString(input.image),
    icon: asString(input.icon),
    active: asBoolean(input.active),
    closed: asBoolean(input.closed),
    archived: asBoolean(input.archived),
    startTime: asIsoString(input.startTime),
    endDate: asIsoString(input.endDate),
    volume: asNumber(input.volume),
    volume24hr: asNumber(input.volume24hr),
    liquidity: asNumber(input.liquidity),
    liquidityClob: asNumber(input.liquidityClob),
    tags: parseTags(input.tags),
    negativeRiskLike: asBoolean(input.negRisk) || asBoolean(input.enableNegRisk),
    markets,
    raw: input,
  };
}

function normalizeGammaEventMarket(input: GammaWire): PolymarketGroupedEventMarket {
  return {
    question: asString(input.question) ?? asString(input.title) ?? "Unknown market",
    slug: asString(input.slug) ?? "",
    marketId: asString(input.id) ?? asString(input.questionID) ?? "",
    conditionId: asString(input.conditionId),
    groupItemTitle: asString(input.groupItemTitle),
    outcomes: parseStringArray(input.outcomes),
    clobTokenIds: parseStringArray(input.clobTokenIds),
    outcomePrices: parseNumberArray(input.outcomePrices),
    bestBid: asNumber(input.bestBid),
    bestAsk: asNumber(input.bestAsk),
    spread: asNumber(input.spread),
    lastTradePrice: asNumber(input.lastTradePrice),
    volume: asNumber(input.volume ?? input.volumeNum),
    volume24hr: asNumber(input.volume24hr),
    liquidity: asNumber(input.liquidity ?? input.liquidityNum),
    liquidityClob: asNumber(input.liquidityClob),
    acceptingOrders: asBoolean(input.acceptingOrders),
    active: asBoolean(input.active),
    closed: asBoolean(input.closed),
    archived: asBoolean(input.archived),
    endDate: asIsoString(input.endDate),
    image: asString(input.image),
    icon: asString(input.icon),
    raw: input,
  };
}

function buildEventMetadata(event: PolymarketGroupedEvent): Prisma.InputJsonValue {
  return {
    ...(event.raw.eventMetadata && typeof event.raw.eventMetadata === "object" ? { eventMetadata: event.raw.eventMetadata } : {}),
    referenceGroup: {
      title: "Winner",
      slug: "winner",
      groupType: "MUTUALLY_EXCLUSIVE",
      resolutionMode: "ONE_WINNER",
      source: "polymarket",
      externalSlug: event.externalSlug,
      expectedSumYesAround: 1,
      negativeRiskLike: true,
      note: "Local engine uses grouped binary markets, not true negative-risk conversion.",
    },
    import: {
      importedFrom: "polymarket",
      importedAt: new Date().toISOString(),
      childMarketCount: event.markets.length,
      tags: event.tags,
    },
  };
}

function buildListedReferenceMetadata(params: {
  current: Prisma.JsonValue | null;
  teamLabel: string;
}): Prisma.InputJsonValue {
  const current =
    params.current && typeof params.current === "object" && !Array.isArray(params.current)
      ? (params.current as Record<string, unknown>)
      : {};
  return {
    ...current,
    group: {
      ...(current.group && typeof current.group === "object" && !Array.isArray(current.group)
        ? (current.group as Record<string, unknown>)
        : {}),
      outcomeLabel: params.teamLabel,
    },
  };
}

function deriveLocalEventSlug(event: PolymarketGroupedEvent) {
  if (event.externalSlug === "2026-fifa-world-cup-winner-595") {
    return "2026-fifa-world-cup-winner";
  }
  return slugify(event.title);
}

function deriveQualityStatus(market: PolymarketGroupedEventMarket) {
  const hasBook =
    market.bestBid != null &&
    market.bestAsk != null &&
    market.bestBid >= 0.01 &&
    market.bestAsk <= 0.99 &&
    market.bestBid <= market.bestAsk;
  const tight = market.spread != null && market.spread <= 0.1;
  return hasBook && tight && market.acceptingOrders ? "approved" : "pending_review";
}

function deriveEventCategory(input: GammaWire) {
  const tags = parseTags(input.tags);
  if (tags.some((tag) => tag.toLowerCase() === "soccer")) {
    return "Sports / Soccer";
  }
  return asString(input.category) ?? "Sports";
}

function parseMatchTeams(title: string) {
  const cleanTitle = title.replace(/\s+-\s+More Markets$/i, "").trim();
  const match = cleanTitle.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (!match) return null;
  return {
    home: match[1].trim(),
    away: match[2].trim(),
  };
}

function classifyGroupedMarket(market: PolymarketGroupedEventMarket) {
  const rawMarketType = asString(market.raw.sportsMarketType);
  const rawMetadata =
    market.raw.marketMetadata && typeof market.raw.marketMetadata === "object" && !Array.isArray(market.raw.marketMetadata)
      ? (market.raw.marketMetadata as GammaWire)
      : {};
  const opticMarketId = asString(rawMetadata.opticOddsMarketId);
  const haystack = `${market.slug} ${market.question} ${rawMarketType ?? ""} ${opticMarketId ?? ""}`.toLowerCase();
  const line = parseMarketLine(market.groupItemTitle) ?? parseMarketLine(market.slug) ?? parseMarketLine(market.question);

  if (haystack.includes("team-to-advance") || haystack.includes("team_to_advance") || haystack.includes("to advance")) {
    return {
      marketType: "team_to_qualify",
      marketGroupKey: "team_to_qualify",
      marketGroupTitle: "Team to Advance",
      line: null,
      unit: null,
      period: null,
      participantType: "team",
      participantName: market.groupItemTitle,
      propCategory: "advance",
    };
  }
  if (haystack.includes("btts") || haystack.includes("both_teams_to_score") || haystack.includes("both teams to score")) {
    return {
      marketType: "both_teams_to_score",
      marketGroupKey: "both_teams_to_score",
      marketGroupTitle: "Both Teams To Score",
      line: null,
      unit: null,
      period: null,
      participantType: null,
      participantName: null,
      propCategory: "goals",
    };
  }
  if (haystack.includes("spread")) {
    return {
      marketType: "spread",
      marketGroupKey: "spread",
      marketGroupTitle: "Spread",
      line,
      unit: "goals",
      period: null,
      participantType: "team",
      participantName: market.groupItemTitle,
      propCategory: "spread",
    };
  }
  if (haystack.includes("total")) {
    return {
      marketType: "total_goals",
      marketGroupKey: "total_goals",
      marketGroupTitle: "Total Goals",
      line,
      unit: "goals",
      period: null,
      participantType: null,
      participantName: null,
      propCategory: "goals",
    };
  }

  return {
    marketType: "generic",
    marketGroupKey: null,
    marketGroupTitle: null,
    line: null,
    unit: null,
    period: null,
    participantType: null,
    participantName: market.groupItemTitle,
    propCategory: null,
  };
}

function parseMarketLine(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.replace(/pt/g, ".");
  const match = normalized.match(/([+-]?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractTeamLabel(question: string) {
  const match = question.match(/^Will\s+(.+?)\s+win\b/i);
  return match?.[1]?.trim() || question.trim();
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === "object") {
        return asString((item as GammaWire).label) ?? asString((item as GammaWire).name);
      }
      return typeof item === "string" ? item : null;
    })
    .filter((item): item is string => Boolean(item && item.trim()));
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((entry) => entry.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => asNumber(item)).filter((item): item is number => item != null);
  }
  if (typeof value === "string") {
    try {
      return parseNumberArray(JSON.parse(value) as unknown);
    } catch {
      return value
        .split(",")
        .map((entry) => asNumber(entry.trim()))
        .filter((item): item is number => item != null);
    }
  }
  return [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown) {
  return value === true || value === "true";
}

function asIsoString(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
