import {
  classifyWorldCupMarketVisibility,
  type WorldCupEligibilityReasonCode,
} from "@/lib/sports/worldCupMarketEligibility";

export type WorldCupEventPageStatus = "scheduled" | "live" | "closed" | "settled" | "stale" | "unknown";

export type WorldCupPriceSource =
  | "local_bot_book"
  | "reference_price"
  | "no_live_price"
  | "unmapped"
  | "stale";

export type WorldCupDisplayType =
  | "three_way"
  | "binary"
  | "line_selector"
  | "exact_score_grid"
  | "combo"
  | "player_prop"
  | "team_prop";

export type WorldCupEventPageModel = {
  eventHeader: {
    id: string;
    slug: string | null;
    title: string;
    description: string | null;
    homeTeamName: string | null;
    awayTeamName: string | null;
    startTime: string | null;
    venue: string | null;
    status: WorldCupEventPageStatus;
    source: string | null;
    mappedEvent: boolean;
    volume: number | null;
  };
  status: WorldCupEventPageStatus;
  volume: number | null;
  source: string | null;
  tabs: WorldCupEventTab[];
  combos: WorldCupEventCombo[];
  groups: WorldCupEventGroup[];
  diagnostics: WorldCupEventDiagnostics;
};

export type WorldCupEventTab = {
  id: string;
  label: string;
  count: number;
  enabled: boolean;
};

export type WorldCupEventCombo = {
  id: string;
  title: string;
  picks: Array<{ label: string; price: number | null }>;
  enabled: boolean;
};

export type WorldCupEventGroup = {
  id: string;
  title: string;
  category: string;
  family: string;
  period: string | null;
  volume: number | null;
  displayType: WorldCupDisplayType;
  lines: WorldCupEventLine[];
  selectedLine: string | null;
  outcomes: WorldCupEventOutcome[];
  sourceStatus: WorldCupPriceSource;
  tradeability: {
    tradeable: boolean;
    reasonIfDisabled: string | null;
  };
};

export type WorldCupEventLine = {
  id: string;
  value: string | null;
  label: string;
  order: number;
  outcomes: WorldCupEventOutcome[];
};

export type WorldCupEventOutcome = {
  label: string;
  code: string | null;
  teamSide: string | null;
  price: number | null;
  bid: number | null;
  ask: number | null;
  referencePrice: number | null;
  botPrice: number | null;
  source: WorldCupPriceSource;
  marketId: string;
  outcomeId: string;
  tradeable: boolean;
  reasonIfDisabled: string | null;
  lastUpdatedAt: string | null;
};

export type WorldCupEventDiagnostics = {
  mappedMarketsCount: number;
  unmappedMarketsCount: number;
  freshReferenceCount: number;
  staleReferenceCount: number;
  openBotOrderCount: number;
  localBotLiquidityMarkets: number;
  hiddenStaleMarkets: number;
  hiddenUnmappedCount: number;
  hiddenNoReferenceCount: number;
  hiddenDraftCount: number;
  userFacingEligibleMarketCount: number;
  hiddenReasonCounts: Partial<Record<WorldCupEligibilityReasonCode, number>>;
  publicDraftLeakCount: number;
};

export type WorldCupEventInput = {
  id: string;
  slug: string | null;
  title: string;
  description?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  startTime?: string | Date | null;
  venue?: string | null;
  status?: string | null;
  liveStatus?: string | null;
  source?: string | null;
  externalSlug?: string | null;
};

export type WorldCupMarketInput = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  marketGroupKey?: string | null;
  marketGroupTitle?: string | null;
  displayOrder?: number | null;
  line?: string | number | null;
  unit?: string | null;
  period?: string | null;
  participantType?: string | null;
  participantName?: string | null;
  propCategory?: string | null;
  marketType?: string | null;
  referenceSource?: string | null;
  importStatus?: string | null;
  referenceOnly?: boolean | null;
  tradable?: boolean | null;
  mmEnabled?: boolean | null;
  visibility?: string | null;
  isListed?: boolean | null;
  referenceSummary?: {
    source?: string | null;
    referenceBid?: number | null;
    referenceAsk?: number | null;
    plannedBotBid?: number | null;
    plannedBotAsk?: number | null;
    qualityStatus?: string | null;
    isFresh?: boolean;
    mmEligible?: boolean;
    hasSnapshot?: boolean;
  } | null;
  outcomes: WorldCupOutcomeInput[];
};

export type WorldCupOutcomeInput = {
  id: string;
  name: string;
  label?: string | null;
  code?: string | null;
  side?: string | null;
  status?: string | null;
  isTradable?: boolean | null;
  displayOrder?: number | null;
  price?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  spread?: number | null;
};

const TABS = [
  ["all", "All"],
  ["match", "Match"],
  ["qualify", "Qualify"],
  ["first_half", "1st Half"],
  ["corners", "Corners"],
  ["goals", "Goals"],
  ["assists", "Assists"],
  ["shots", "Shots"],
  ["player_prop", "Player Props"],
  ["team_prop", "Team Props"],
  ["special", "Specials"],
  ["live", "Live"],
] as const;

const FAMILY_ORDER = new Map([
  ["match_winner", 10],
  ["draw_no_bet", 20],
  ["team_to_advance", 30],
  ["spread", 40],
  ["total_goals", 50],
  ["both_teams_to_score", 60],
  ["first_team_to_score", 70],
  ["team_total", 80],
  ["half_result", 90],
  ["corners", 100],
  ["player_prop", 110],
  ["special", 120],
]);

export function buildWorldCupEventPageModel(params: {
  event: WorldCupEventInput;
  markets: WorldCupMarketInput[];
  now?: Date;
  internalTradingEnabled?: boolean;
  tradingKillSwitch?: boolean;
  realMoneyMode?: boolean;
}): WorldCupEventPageModel {
  const now = params.now ?? new Date();
  const eventStatus = normalizeEventStatus(params.event, now);
  const classifiedMarkets = params.markets.map((market) => ({
    market,
    eligibility: classifyWorldCupMarketVisibility({
      market,
      eventStatus,
      internalTradingEnabled: params.internalTradingEnabled ?? false,
      tradingKillSwitch: params.tradingKillSwitch ?? false,
      realMoneyMode: params.realMoneyMode ?? false,
    }),
  }));
  const visibleMarkets = classifiedMarkets
    .filter((entry) => entry.eligibility.eligible && entry.eligibility.visibility === "user_facing")
    .map((entry) => entry.market);
  const groups = buildGroups({
    markets: visibleMarkets,
    eventStatus,
    internalTradingEnabled: params.internalTradingEnabled ?? false,
    tradingKillSwitch: params.tradingKillSwitch ?? false,
    realMoneyMode: params.realMoneyMode ?? false,
  });
  const tabs = buildTabs(groups);
  const diagnostics = buildDiagnostics(params.markets, classifiedMarkets);
  const volume = sumNumbers(groups.map((group) => group.volume));

  return {
    eventHeader: {
      id: params.event.id,
      slug: params.event.slug,
      title: params.event.title,
      description: params.event.description ?? null,
      homeTeamName: params.event.homeTeamName ?? null,
      awayTeamName: params.event.awayTeamName ?? null,
      startTime: toIso(params.event.startTime),
      venue: params.event.venue ?? null,
      status: eventStatus,
      source: params.event.source ?? null,
      mappedEvent: Boolean(params.event.externalSlug || params.event.source),
      volume,
    },
    status: eventStatus,
    volume,
    source: params.event.source ?? null,
    tabs,
    combos: [],
    groups,
    diagnostics,
  };
}

function buildGroups(params: {
  markets: WorldCupMarketInput[];
  eventStatus: WorldCupEventPageStatus;
  internalTradingEnabled: boolean;
  tradingKillSwitch: boolean;
  realMoneyMode: boolean;
}) {
  const byFamily = new Map<string, WorldCupMarketInput[]>();
  for (const market of params.markets) {
    const family = classifyFamily(market);
    byFamily.set(family.id, [...(byFamily.get(family.id) ?? []), market]);
  }

  return Array.from(byFamily.entries())
    .map(([familyId, markets]) => {
      const family = classifyFamily(markets[0]);
      const sortedMarkets = [...markets].sort(compareMarkets);
      const displayType = getDisplayType(family.id, sortedMarkets);
      const lines = buildLines({
        familyId,
        markets: sortedMarkets,
        eventStatus: params.eventStatus,
        internalTradingEnabled: params.internalTradingEnabled,
        tradingKillSwitch: params.tradingKillSwitch,
        realMoneyMode: params.realMoneyMode,
      });
      const outcomes = lines.flatMap((line) => line.outcomes);
      const sourceStatus = deriveGroupSource(outcomes);
      const disabledReason = deriveGroupDisabledReason(outcomes, params.eventStatus);
      return {
        id: familyId,
        title: family.title,
        category: family.category,
        family: family.id,
        period: normalizePeriod(sortedMarkets[0]?.period),
        volume: sumNumbers(sortedMarkets.map((market) => extractMarketVolume(market))),
        displayType,
        lines,
        selectedLine: lines[0]?.id ?? null,
        outcomes,
        sourceStatus,
        tradeability: {
          tradeable: outcomes.some((outcome) => outcome.tradeable),
          reasonIfDisabled: outcomes.some((outcome) => outcome.tradeable) ? null : disabledReason,
        },
      } satisfies WorldCupEventGroup;
    })
    .filter((group) => group.outcomes.length > 0)
    .sort((left, right) => (FAMILY_ORDER.get(left.family) ?? 999) - (FAMILY_ORDER.get(right.family) ?? 999));
}

function buildLines(params: {
  familyId: string;
  markets: WorldCupMarketInput[];
  eventStatus: WorldCupEventPageStatus;
  internalTradingEnabled: boolean;
  tradingKillSwitch: boolean;
  realMoneyMode: boolean;
}): WorldCupEventLine[] {
  const lineGroups = new Map<string, WorldCupMarketInput[]>();
  for (const market of params.markets) {
    const lineKey = params.familyId === "spread" ? absoluteLine(market.line) : lineValue(market.line);
    lineGroups.set(lineKey, [...(lineGroups.get(lineKey) ?? []), market]);
  }

  return Array.from(lineGroups.entries())
    .map(([line, markets], index) => {
      const sortedMarkets = [...markets].sort(compareMarkets);
      const outcomes = sortedMarkets.flatMap((market) =>
        market.outcomes
          .slice()
          .sort(compareOutcomes)
          .map((outcome) => buildOutcome({
            market,
            outcome,
            eventStatus: params.eventStatus,
            internalTradingEnabled: params.internalTradingEnabled,
            tradingKillSwitch: params.tradingKillSwitch,
            realMoneyMode: params.realMoneyMode,
          })),
      );
      return {
        id: `${params.familyId}:${normalizeToken(line || "default") || index}`,
        value: line === "default" ? null : line,
        label: line === "default" ? "Default" : line,
        order: index,
        outcomes,
      };
    })
    .sort((left, right) => Number(left.value ?? 0) - Number(right.value ?? 0));
}

function buildOutcome(params: {
  market: WorldCupMarketInput;
  outcome: WorldCupOutcomeInput;
  eventStatus: WorldCupEventPageStatus;
  internalTradingEnabled: boolean;
  tradingKillSwitch: boolean;
  realMoneyMode: boolean;
}): WorldCupEventOutcome {
  const bid = finiteOrNull(params.outcome.bestBid);
  const ask = finiteOrNull(params.outcome.bestAsk);
  const localMid = finiteOrNull(params.outcome.price);
  const reference = params.market.referenceSummary ?? null;
  const referencePrice = reference?.referenceBid != null && reference.referenceAsk != null
    ? roundPrice((reference.referenceBid + reference.referenceAsk) / 2)
    : finiteOrNull(reference?.referenceAsk) ?? finiteOrNull(reference?.referenceBid);
  const hasLocalBook = bid != null || ask != null;
  const source = deriveOutcomeSource({ hasLocalBook, reference, market: params.market });
  const price = hasLocalBook ? localMid : source === "reference_price" ? referencePrice : null;
  const disabledReason = deriveOutcomeDisabledReason({
    source,
    eventStatus: params.eventStatus,
    market: params.market,
    outcome: params.outcome,
    internalTradingEnabled: params.internalTradingEnabled,
    tradingKillSwitch: params.tradingKillSwitch,
    realMoneyMode: params.realMoneyMode,
  });

  return {
    label: formatOutcomeLabel(params.market, params.outcome),
    code: params.outcome.code ?? null,
    teamSide: params.outcome.side ?? null,
    price,
    bid,
    ask,
    referencePrice,
    botPrice: finiteOrNull(reference?.plannedBotAsk) ?? finiteOrNull(reference?.plannedBotBid),
    source,
    marketId: params.market.id,
    outcomeId: params.outcome.id,
    tradeable: disabledReason == null,
    reasonIfDisabled: disabledReason,
    lastUpdatedAt: null,
  };
}

function deriveOutcomeSource(params: {
  hasLocalBook: boolean;
  reference: WorldCupMarketInput["referenceSummary"] | null;
  market: WorldCupMarketInput;
}): WorldCupPriceSource {
  if (params.hasLocalBook) return "local_bot_book";
  if (!params.market.referenceSummary && !params.market.referenceOnly && params.market.referenceOnly !== false) return "unmapped";
  if (params.reference?.hasSnapshot && params.reference.isFresh === false) return "stale";
  if (params.reference?.isFresh && (params.reference.referenceBid != null || params.reference.referenceAsk != null)) {
    return "reference_price";
  }
  if (params.market.referenceOnly || params.market.referenceSummary) return "no_live_price";
  return "unmapped";
}

function deriveOutcomeDisabledReason(params: {
  source: WorldCupPriceSource;
  eventStatus: WorldCupEventPageStatus;
  market: WorldCupMarketInput;
  outcome: WorldCupOutcomeInput;
  internalTradingEnabled: boolean;
  tradingKillSwitch: boolean;
  realMoneyMode: boolean;
}) {
  if (params.realMoneyMode) return "Real-money mode is not allowed for closed beta trading.";
  if (!params.internalTradingEnabled) return "Internal beta trading is disabled.";
  if (params.tradingKillSwitch) return "Trading kill switch is active.";
  if (params.eventStatus === "closed" || params.eventStatus === "settled" || params.eventStatus === "stale") {
    return "Event is not open for trading.";
  }
  if (!["LIVE", "ACTIVE", "OPEN"].includes(params.market.status.toUpperCase())) {
    return "Market is not open for trading.";
  }
  if (params.outcome.status && params.outcome.status.toLowerCase() !== "active") {
    return "Outcome is inactive.";
  }
  if (params.outcome.isTradable === false) return "Outcome is not tradable.";
  if (params.source === "local_bot_book") return null;
  if (params.source === "reference_price") return "Reference price only. No internal liquidity.";
  if (params.source === "stale") return "Stale price.";
  if (params.source === "unmapped") return "Not mapped.";
  return "No live price.";
}

function buildTabs(groups: WorldCupEventGroup[]): WorldCupEventTab[] {
  const counts = new Map<string, number>();
  for (const group of groups) {
    counts.set(group.category, (counts.get(group.category) ?? 0) + 1);
  }
  const total = groups.length;
  return TABS.map(([id, label]) => {
    const count = id === "all" ? total : counts.get(id) ?? 0;
    return { id, label, count, enabled: count > 0 || id === "all" };
  });
}

function buildDiagnostics(
  allMarkets: WorldCupMarketInput[],
  classifiedMarkets: Array<{
    market: WorldCupMarketInput;
    eligibility: ReturnType<typeof classifyWorldCupMarketVisibility>;
  }>,
): WorldCupEventDiagnostics {
  const hiddenReasonCounts: Partial<Record<WorldCupEligibilityReasonCode, number>> = {};
  for (const entry of classifiedMarkets) {
    if (entry.eligibility.eligible && entry.eligibility.visibility === "user_facing") continue;
    hiddenReasonCounts[entry.eligibility.reasonCode] = (hiddenReasonCounts[entry.eligibility.reasonCode] ?? 0) + 1;
  }

  return {
    mappedMarketsCount: allMarkets.filter((market) => market.importStatus === "approved" && (market.referenceOnly || market.referenceSummary)).length,
    unmappedMarketsCount: allMarkets.filter((market) => market.importStatus !== "approved" || (!market.referenceOnly && !market.referenceSummary)).length,
    freshReferenceCount: allMarkets.filter((market) => market.referenceSummary?.isFresh).length,
    staleReferenceCount: allMarkets.filter((market) => market.referenceSummary?.hasSnapshot && market.referenceSummary?.isFresh === false).length,
    openBotOrderCount: allMarkets.reduce(
      (count, market) => count + market.outcomes.filter((outcome) => outcome.bestBid != null || outcome.bestAsk != null).length,
      0,
    ),
    localBotLiquidityMarkets: allMarkets.filter((market) =>
      market.outcomes.some((outcome) => outcome.bestBid != null || outcome.bestAsk != null),
    ).length,
    hiddenStaleMarkets: hiddenReasonCounts.stale_event ?? 0,
    hiddenUnmappedCount: (hiddenReasonCounts.missing_polymarket_mapping ?? 0) + (hiddenReasonCounts.mapping_not_validated ?? 0),
    hiddenNoReferenceCount: hiddenReasonCounts.no_fresh_reference ?? 0,
    hiddenDraftCount: (hiddenReasonCounts.draft_only ?? 0) + (hiddenReasonCounts.admin_review_only ?? 0),
    userFacingEligibleMarketCount: classifiedMarkets.filter((entry) => entry.eligibility.eligible && entry.eligibility.visibility === "user_facing").length,
    hiddenReasonCounts,
    publicDraftLeakCount: 0,
  };
}

function classifyFamily(market: WorldCupMarketInput | undefined) {
  const type = normalizeToken(market?.marketType);
  const group = normalizeToken(market?.marketGroupKey);
  const period = normalizeToken(market?.period);
  if (type === "match_winner_1x2" || type === "moneyline") return { id: "match_winner", title: "Match Winner", category: "match" };
  if (type === "draw_no_bet") return { id: "draw_no_bet", title: "Draw No Bet", category: "match" };
  if (type === "team_to_qualify" || group === "qualify") return { id: "team_to_advance", title: "Team to Advance", category: "qualify" };
  if (type === "spread") return { id: "spread", title: "Spread", category: "match" };
  if (type === "total_goals" || type === "total") return { id: "total_goals", title: "Total Goals", category: "goals" };
  if (type === "both_teams_to_score") return { id: "both_teams_to_score", title: "Both Teams to Score", category: "goals" };
  if (type === "first_team_to_score") return { id: "first_team_to_score", title: "First Team to Score", category: "goals" };
  if (type === "team_total_goals") return { id: `team_total:${normalizeToken(market?.participantName) || "team"}`, title: `${market?.participantName ?? "Team"} Total`, category: "team_prop" };
  if (period.includes("half")) return { id: `half_result:${period || "half"}`, title: market?.marketGroupTitle ?? "Half Result", category: "first_half" };
  if (group.includes("corner") || type.includes("corner")) return { id: "corners", title: "Corners", category: "corners" };
  if (type.includes("player")) return { id: `player_prop:${normalizeToken(market?.participantName) || "player"}`, title: market?.marketGroupTitle ?? "Player Props", category: "player_prop" };
  return { id: `special:${type || group || "market"}`, title: market?.marketGroupTitle ?? "Specials", category: "special" };
}

function getDisplayType(familyId: string, markets: WorldCupMarketInput[]): WorldCupDisplayType {
  if (familyId === "match_winner") return "three_way";
  if (familyId === "spread" || familyId === "total_goals" || familyId.startsWith("team_total")) return "line_selector";
  if (familyId.includes("player_prop")) return "player_prop";
  if (familyId.startsWith("team_total")) return "team_prop";
  if (markets.some((market) => market.marketType === "correct_score")) return "exact_score_grid";
  return "binary";
}

function deriveGroupSource(outcomes: WorldCupEventOutcome[]): WorldCupPriceSource {
  if (outcomes.some((outcome) => outcome.source === "local_bot_book")) return "local_bot_book";
  if (outcomes.some((outcome) => outcome.source === "reference_price")) return "reference_price";
  if (outcomes.some((outcome) => outcome.source === "stale")) return "stale";
  if (outcomes.every((outcome) => outcome.source === "unmapped")) return "unmapped";
  return "no_live_price";
}

function deriveGroupDisabledReason(outcomes: WorldCupEventOutcome[], eventStatus: WorldCupEventPageStatus) {
  if (eventStatus === "closed" || eventStatus === "settled" || eventStatus === "stale") return "Event is not open for trading.";
  return outcomes.find((outcome) => outcome.reasonIfDisabled)?.reasonIfDisabled ?? "No tradable outcomes.";
}

function normalizeEventStatus(event: WorldCupEventInput, now: Date): WorldCupEventPageStatus {
  const raw = normalizeToken(event.liveStatus || event.status);
  if (raw.includes("live")) return "live";
  if (raw.includes("resolved") || raw.includes("settled")) return "settled";
  if (raw.includes("closed") || raw.includes("cancel") || raw.includes("ended")) return "closed";
  const start = event.startTime ? new Date(event.startTime) : null;
  if (start && Number.isFinite(start.getTime()) && start.getTime() + 6 * 60 * 60 * 1000 < now.getTime()) {
    return "stale";
  }
  if (raw.includes("scheduled") || raw.includes("open") || raw.includes("active")) return "scheduled";
  return "unknown";
}

function isHiddenStaleMarket(market: WorldCupMarketInput, eventStatus: WorldCupEventPageStatus) {
  if (eventStatus !== "stale") return false;
  return ["CLOSED", "RESOLVED", "CANCELED"].includes(market.status.toUpperCase());
}

function formatOutcomeLabel(market: WorldCupMarketInput, outcome: WorldCupOutcomeInput) {
  if (market.marketType === "spread" && normalizeToken(outcome.name) === "yes") {
    return [market.participantName, signedLine(market.line)].filter(Boolean).join(" ");
  }
  if (["total_goals", "team_total_goals", "total"].includes(normalizeToken(market.marketType))) {
    const base = outcome.label ?? outcome.name;
    const line = lineValue(market.line);
    return line === "default" || base.includes(line) ? base : `${base} ${line}`;
  }
  return outcome.label ?? outcome.name;
}

function extractMarketVolume(market: WorldCupMarketInput) {
  const summary = market.referenceSummary as (WorldCupMarketInput["referenceSummary"] & { volume?: number | null }) | null;
  return finiteOrNull(summary?.volume);
}

function compareMarkets(left: WorldCupMarketInput, right: WorldCupMarketInput) {
  const leftOrder = left.displayOrder ?? 0;
  const rightOrder = right.displayOrder ?? 0;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  const leftLine = Number(left.line);
  const rightLine = Number(right.line);
  if (Number.isFinite(leftLine) && Number.isFinite(rightLine) && leftLine !== rightLine) return leftLine - rightLine;
  return left.title.localeCompare(right.title);
}

function compareOutcomes(left: WorldCupOutcomeInput, right: WorldCupOutcomeInput) {
  const leftOrder = left.displayOrder ?? 0;
  const rightOrder = right.displayOrder ?? 0;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return (left.label ?? left.name).localeCompare(right.label ?? right.name);
}

function normalizePeriod(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : null;
}

function lineValue(value: string | number | null | undefined) {
  return value == null || value === "" ? "default" : String(value);
}

function absoluteLine(value: string | number | null | undefined) {
  const line = Number(value);
  if (Number.isFinite(line)) return String(Math.abs(line));
  return lineValue(value);
}

function signedLine(value: string | number | null | undefined) {
  const line = Number(value);
  if (!Number.isFinite(line)) return value == null ? "" : String(value);
  return line > 0 ? `+${line}` : String(line);
}

function normalizeToken(value: string | number | null | undefined) {
  if (value == null) return "";
  return String(value).trim().toLowerCase().replaceAll("+", "plus").replaceAll("-", "minus").replaceAll(".", "_").replace(/\s+/g, "_");
}

function finiteOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundPrice(value: number) {
  return Number(value.toFixed(2));
}

function sumNumbers(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) : null;
}

function toIso(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
