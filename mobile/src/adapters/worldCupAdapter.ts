import type {
  EventDetail as BackendEventDetail,
  EventSummary as BackendEventSummary,
  Market as BackendMarket,
  Outcome as BackendOutcome,
} from "../types";
import type { Event, EventMarketProfile, EventMarketType, Market, MarketSelection, Outcome } from "../mocks/worldCup";

const COLORS = ["#2563eb", "#60a5fa", "#ef4444", "#0a8f61", "#f4c20d", "#7c3aed", "#94a3b8"];

const fallbackProbability = (index: number, total: number) => {
  if (total <= 0) return 50;
  return Math.max(1, Math.round(100 / total - index));
};

const asProbability = (value: string | number | null | undefined, index: number, total: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallbackProbability(index, total);
  if (parsed > 1) return Math.max(1, Math.min(99, Math.round(parsed)));
  return Math.max(1, Math.min(99, Math.round(parsed * 100)));
};

const firstPositivePrice = (...values: (string | number | null | undefined)[]) => {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const outcomeProbabilityPrice = (outcome: BackendOutcome) => {
  const price = firstPositivePrice(outcome.price);
  if (price !== null) return price;
  const bid = firstPositivePrice(outcome.bestBid);
  const ask = firstPositivePrice(outcome.bestAsk);
  if (bid !== null && ask !== null) return (bid + ask) / 2;
  return ask ?? bid ?? outcome.price;
};

const asTitleCase = (value: string | null | undefined, fallback: string) => {
  const clean = (value || fallback).replace(/[_-]+/g, " ").trim();
  if (!clean) return fallback;
  return clean.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const asNumberOrNull = (value: string | number | null | undefined) => {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeEventMetrics = (event: BackendEventSummary) => {
  if (event.metrics) {
    return {
      source: event.metrics.source,
      marketCount: event.metrics.marketCount,
      activeMarketCount: event.metrics.activeMarketCount,
      liquidity: asNumberOrNull(event.metrics.liquidity),
      volume24h: asNumberOrNull(event.metrics.volume24h),
      commentCount: event.metrics.commentCount,
    };
  }

  return undefined;
};

const asOutcomeSide = (value: string | null | undefined): Outcome["side"] | undefined => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (["yes", "no", "over", "under", "home", "away", "draw"].includes(normalized)) {
    return normalized as Outcome["side"];
  }
  return undefined;
};

const asMarketContractType = (value: string | null | undefined): Market["marketType"] | undefined => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (["moneyline", "match_winner", "match_winner_1x2", "winner"].includes(normalized)) return "moneyline";
  if (["to_advance", "to-advance", "to_qualify", "to-qualify", "team_to_qualify", "team-to-qualify"].includes(normalized)) return "to_advance";
  if (["spread", "handicap", "asian_handicap"].includes(normalized)) return "spread";
  if (["totals", "total", "total_goals"].includes(normalized)) return "totals";
  if (["team-total", "team_total", "team_totals", "team_total_goals"].includes(normalized)) return "team-total";
  if (["next-goal", "next_goal"].includes(normalized)) return "next-goal";
  if (["future", "outright"].includes(normalized)) return "future";
  if (normalized) return "prop";
  return undefined;
};

const asPeriod = (value: string | null | undefined): Market["period"] | undefined => {
  const normalized = `${value ?? ""}`.trim().toLowerCase().replace(/_/g, "-");
  if (["full-game", "regulation", "first-half", "second-half"].includes(normalized)) {
    return normalized as Market["period"];
  }
  return undefined;
};

const asMarketSelection = (selection: BackendMarket["selection"]): MarketSelection | null => {
  if (!selection) return null;
  return {
    selectorKey: selection.selectorKey ?? null,
    marketId: selection.marketId ?? null,
    outcomeId: selection.outcomeId ?? null,
    marketGroupKey: selection.marketGroupKey ?? null,
    marketGroupId: selection.marketGroupId ?? null,
    marketGroupTitle: selection.marketGroupTitle ?? null,
    marketType: selection.marketType ?? null,
    marketFamily: selection.marketFamily ?? null,
    displayLabel: selection.displayLabel ?? null,
    period: selection.period ?? null,
    line: selection.line ?? null,
    lineValue: typeof selection.lineValue === "number" ? selection.lineValue : asNumberOrNull(selection.lineValue),
    unit: selection.unit ?? null,
    chart: selection.chart ? {
      targetMarketId: selection.chart.targetMarketId ?? null,
      status: selection.chart.status ?? null,
      source: selection.chart.source ?? null,
      pointCount: typeof selection.chart.pointCount === "number" ? selection.chart.pointCount : null,
      outcomeCount: typeof selection.chart.outcomeCount === "number" ? selection.chart.outcomeCount : null,
      range: selection.chart.range ?? null,
      ranges: selection.chart.ranges ?? [],
      emptyState: selection.chart.emptyState ?? null,
    } : undefined,
    outcomes: selection.outcomes?.map((outcome) => ({
      id: outcome.id ?? null,
      outcomeId: outcome.outcomeId ?? null,
      side: outcome.side ?? null,
      label: outcome.label ?? null,
      tokenId: outcome.tokenId ?? null,
      referenceTokenId: outcome.referenceTokenId ?? null,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
      isTradable: outcome.isTradable ?? null,
    })) ?? [],
  };
};

const eventStatus = (event: BackendEventSummary): Event["status"] => {
  const liveStatus = `${event.liveStatus ?? ""}`.toLowerCase();
  const status = `${event.status ?? ""}`.toLowerCase();
  if (liveStatus.includes("live") || liveStatus === "in_progress" || status === "live") return "live";
  if (!event.startTime) return "future";
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return "future";
  const now = new Date();
  const startDay = start.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (startDay === now.toDateString()) return "today";
  if (startDay === tomorrow.toDateString()) return "tomorrow";
  return "future";
};

const startsAt = (event: BackendEventSummary) => {
  if (event.liveStatus || event.clock) {
    return ["Live", event.period, event.clock].filter(Boolean).join(" · ");
  }
  if (!event.startTime) return "Time TBD";
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return "Time TBD";
  const prefix = eventStatus(event) === "tomorrow" ? "Tomorrow" : eventStatus(event) === "today" ? "Today" : "";
  const time = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return [prefix, time].filter(Boolean).join(" ");
};

const zhPassthrough = (value: string) => value;

const isGenericFixtureTitle = (title: string) => /^fixture\b/i.test(title.trim());

const normalizeOutcome = (outcome: BackendOutcome, index: number, total: number): Outcome => ({
  id: outcome.id,
  label: outcome.label || outcome.name || `Outcome ${index + 1}`,
  zhLabel: zhPassthrough(outcome.label || outcome.name || `选项 ${index + 1}`),
  probability: asProbability(outcomeProbabilityPrice(outcome), index, total),
  side: asOutcomeSide(outcome.side),
  referenceTokenId: outcome.referenceTokenId ?? null,
  referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
  bestBid: asNumberOrNull(outcome.bestBid),
  bestAsk: asNumberOrNull(outcome.bestAsk),
  bestBidSize: asNumberOrNull(outcome.bestBidSize),
  bestAskSize: asNumberOrNull(outcome.bestAskSize),
  color: COLORS[index % COLORS.length],
});

const marketType = (market: BackendMarket): Market["type"] => {
  const key = `${market.marketType ?? ""} ${market.marketGroupTitle ?? ""} ${market.propCategory ?? ""} ${market.title}`.toLowerCase();
  if (key.includes("future") || key.includes("cup")) return "future";
  if (key.includes("to_advance") || key.includes("to advance")) return "game-line";
  if (key.includes("winner") || key.includes("moneyline") || key.includes("match")) return "game-line";
  if (key.includes("live")) return "live";
  return "prop";
};

const isAdvanceMarketKey = (key: string) =>
  /(^|[\s_-])(to[\s_-]?advance|to[\s_-]?qualify|team[\s_-]?to[\s_-]?qualify|qualify)([\s_-]|$)/i.test(key);

const equivalentMarketType = (market: Market): EventMarketType | null => {
  const key = `${market.marketType ?? ""} ${market.marketGroupId ?? ""} ${market.title}`.toLowerCase();
  if (isAdvanceMarketKey(key)) return "to_advance";
  if (market.period === "first-half") return "first-half";
  if (market.period === "second-half") return "second-half";
  if (market.outcomes.some((outcome) => outcome.side === "draw" || /^draw|tie$/i.test(outcome.label))) return "regulation_90";
  if (market.marketType === "spread") return "spread";
  if (market.marketType === "totals") return "totals";
  if (market.marketType === "team-total") return "team-total";
  if (market.type === "prop") return "player-props";
  return null;
};

const deriveMarketRules = (event: BackendEventSummary, markets: Market[]) => {
  const supported = new Set<EventMarketType>();
  for (const market of markets) {
    const type = equivalentMarketType(market);
    if (type) supported.add(type);
  }

  const regulationMarket = markets.find((market) => {
    const key = `${market.marketType ?? ""} ${market.marketGroupId ?? ""} ${market.title}`.toLowerCase();
    return !isAdvanceMarketKey(key) && (market.marketType === "moneyline" || key.includes("winner") || key.includes("regulation") || key.includes("90"));
  });
  const mainMarket = regulationMarket ?? markets.find((market) => market.type !== "prop" && market.type !== "future") ?? markets[0];
  const mainKey = `${mainMarket?.marketType ?? ""} ${mainMarket?.title ?? ""} ${mainMarket?.marketGroupId ?? ""}`.toLowerCase();
  const eventKey = `${event.sportKey ?? ""} ${event.leagueKey ?? ""} ${event.description ?? ""}`.toLowerCase();
  const isSoccerMatch = eventKey.includes("soccer") || eventKey.includes("football") || eventKey.includes("world_cup");
  const hasDraw = Boolean(mainMarket?.outcomes.some((outcome) => outcome.side === "draw" || /^draw|tie$/i.test(outcome.label)));
  const hasAdvanceMarket = markets.some((market) => equivalentMarketType(market) === "to_advance");
  const isAdvance = !regulationMarket && (isAdvanceMarketKey(mainKey) || mainMarket?.marketType === "future");
  const isTwoWaySoccerWinner = Boolean(
    isSoccerMatch &&
      !hasDraw &&
      mainMarket?.outcomes.length === 2 &&
      (mainKey.includes("winner") || mainKey.includes("moneyline") || mainKey.includes("main") || mainKey.includes("match")),
  );
  const includesOvertime = hasAdvanceMarket || isTwoWaySoccerWinner || mainKey.includes("overtime") || mainKey.includes("full match") || mainKey.includes("including overtime");
  const marketProfile: EventMarketProfile = isAdvance ? "to_advance" : includesOvertime ? "full_match_with_overtime" : "regulation_90";
  supported.add(marketProfile);
  if (marketProfile === "regulation_90") supported.add("regulation_90");

  return {
    marketProfile,
    resultMode: hasDraw ? "can_draw" as const : "no_draw" as const,
    gameRules: {
      allowDraw: hasDraw,
      includesOvertime,
      description: event.description || (isAdvance || isTwoWaySoccerWinner ? "Advancement/full-match market with no draw outcome." : hasDraw ? "Regulation market can settle as draw." : "Winner market has no draw outcome."),
    },
    supportedMarketTypes: [...supported],
  };
};

export const normalizeMarket = (market: BackendMarket): Market => ({
  id: market.id,
  marketGroupId: market.marketGroupId ?? market.marketGroupKey ?? undefined,
  marketType: asMarketContractType(market.marketType),
  period: asPeriod(market.period),
  line: market.line ?? null,
  referenceSource: market.referenceSource ?? null,
  externalSlug: market.externalSlug ?? null,
  externalMarketId: market.externalMarketId ?? null,
  conditionId: market.conditionId ?? null,
  selection: asMarketSelection(market.selection),
  title: market.marketGroupTitle || market.title,
  zhTitle: zhPassthrough(market.marketGroupTitle || market.title),
  type: marketType(market),
  liquidity: asNumberOrNull(market.liquidity) ?? undefined,
  orderbookDepth: market.orderbookDepth?.map((level) => ({
    outcomeId: level.outcomeId,
    side: level.side,
    price: level.price,
    shares: level.shares,
    total: level.total,
  })),
  availability: market.availability,
  outcomes: market.outcomes.map((outcome, index) => normalizeOutcome(outcome, index, market.outcomes.length)),
});

export const normalizeEventSummary = (event: BackendEventSummary, markets: BackendMarket[] = []): Event => {
  const home = event.homeTeamName || event.title.split(/\s+vs\.?\s+/i)[0] || "Home";
  const away = event.awayTeamName || event.title.split(/\s+vs\.?\s+/i)[1] || "Away";
  const status = eventStatus(event);
  const normalizedMarkets = markets.map(normalizeMarket).filter((market) => market.outcomes.length > 0);
  const rules = deriveMarketRules(event, normalizedMarkets);
  const depthMarket = normalizedMarkets.find((market) => (market.orderbookDepth?.length ?? 0) > 0);
  const isFuturesBundle = normalizedMarkets.length > 0 && normalizedMarkets.every((market) => market.type === "future");
  const title = isGenericFixtureTitle(event.title) && isFuturesBundle ? "World Cup futures" : event.title;
  return {
    id: event.slug || event.id,
    backendSlug: event.slug || event.id,
    title,
    zhTitle: isGenericFixtureTitle(event.title) && isFuturesBundle ? "世界杯期货" : zhPassthrough(title),
    league: asTitleCase(event.leagueKey, "World Cup"),
    startsAt: startsAt(event),
    status,
    tag: status === "live" ? "Live" : asTitleCase(event.status, "World Cup"),
    zhTag: status === "live" ? "滚球" : asTitleCase(event.status, "世界杯"),
    teams: [
      { name: home, zhName: zhPassthrough(home), flag: "•" },
      { name: away, zhName: zhPassthrough(away), flag: "•" },
    ],
    liveStats: event.liveStats,
    metrics: normalizeEventMetrics(event),
    liveDataStatus: event.liveDataStatus,
    chartHistory: event.chartHistory,
    marketProfile: event.marketProfile ?? rules.marketProfile,
    resultMode: event.resultMode ?? rules.resultMode,
    gameRules: event.gameRules ?? rules.gameRules,
    supportedMarketTypes: event.supportedMarketTypes ?? rules.supportedMarketTypes,
    chartHistorySource: event.chartHistory?.length ? "embedded" : undefined,
    chartHistoryStatus: event.chartHistory?.length ? "ready" : undefined,
    orderbookDepthSource: depthMarket ? "orderbook-route" : undefined,
    orderbookDepthStatus: depthMarket ? "ready" : undefined,
    orderbookDepthMarketId: depthMarket?.id,
    orderbookDepthEmptyState: depthMarket ? null : undefined,
    orderbookAvailability: depthMarket?.availability,
    markets: normalizedMarkets,
  };
};

export const normalizeEventDetail = (detail: BackendEventDetail): Event | null => {
  const event = normalizeEventSummary(detail.event, detail.markets);
  if (event.markets.length === 0) return null;
  return event;
};
