import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import {
  estimatedPositionPnl,
  portfolioPositionValue,
} from "../domain/portfolioPositionMetrics";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label, money } from "../presentation/formatters";
import { resolveLineTicketTarget, ticketSelectionFromBackendMarket } from "../services/eventDetailLineTicketService";
import { canRenderEventDetailLineFamily, selectEventDetailPrimaryMarket, selectEventDetailRegulationMarket } from "../services/eventDetailMarketProfileService";
import type { Position } from "./Portfolio";
import type { TicketSelection } from "./TradeTicket";

type EventDetailCopy = {
  worldCup: string;
  markets: string;
  volume: string;
  liquidity: string;
  traders: string;
  marketCount: string;
  outcomeCount: string;
  bestBid: string;
  bestAsk: string;
  spread: string;
  shares: string;
  buy: string;
  sell: string;
};

const marketDepth = (market: Market) => {
  const leadingProbability = Math.max(...market.outcomes.map((outcome) => outcome.probability));
  const midpoint = leadingProbability / 100;
  const bid = Math.max(midpoint - 0.02, 0.01);
  const ask = Math.min(midpoint + 0.02, 0.99);

  return {
    bid: `${bid.toFixed(2)} USDT`,
    ask: `${ask.toFixed(2)} USDT`,
    spread: `${Math.round((ask - bid) * 100)}c`,
  };
};

const outcomeOdds = (outcome: Outcome) => (outcome.probability > 0 ? 100 / outcome.probability : 0).toFixed(1);

const outcomeDepth = (outcome: Outcome) => {
  const bid = (outcome.bestBid ?? Math.max(outcome.probability - 3, 1)) / 100;
  const ask = (outcome.bestAsk ?? Math.min(outcome.probability + 4, 99)) / 100;
  return {
    bid: `${bid.toFixed(2)} USDT`,
    ask: `${ask.toFixed(2)} USDT`,
  };
};

const formatSize = (size: number) => {
  if (size >= 1000) return `${(size / 1000).toFixed(size >= 10000 ? 0 : 2).replace(/\.?0+$/, "")}k`;
  return size.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatWholeNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const formatBookValue = (value: number) => {
  if (value >= 1000) return `$${formatWholeNumber(value)}`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const outcomeDepthSize = (outcome: Outcome, labels: { bid: string; ask: string; shares: string }) => {
  const fallbackBidSize = Math.max(Math.round(outcome.probability * 20), 100);
  const fallbackAskSize = Math.max(Math.round((100 - outcome.probability) * 25), 100);
  const bidSize = typeof outcome.bestBidSize === "number" && Number.isFinite(outcome.bestBidSize) && outcome.bestBidSize > 0 ? outcome.bestBidSize : fallbackBidSize;
  const askSize = typeof outcome.bestAskSize === "number" && Number.isFinite(outcome.bestAskSize) && outcome.bestAskSize > 0 ? outcome.bestAskSize : fallbackAskSize;
  return `${labels.bid} ${formatSize(bidSize)} ${labels.shares} - ${labels.ask} ${formatSize(askSize)} ${labels.shares}`;
};

type DepthLevel = NonNullable<Market["orderbookDepth"]>[number];

const levelProbability = (price: number) => Math.max(1, Math.min(99, Math.round(price <= 1 ? price * 100 : price)));

const formatLevelPrice = (price: number) => `${(price <= 1 ? price : price / 100).toFixed(2)} USDT`;

const formatLevelCents = (price: number) => `${levelProbability(price)}c`;

type BookDisplayMode = "cents" | "decimal";

type StagedOrderBookLevel = {
  marketId: string;
  outcomeId: string;
  side: "bid" | "ask";
  price: number;
  shares: number;
  total: number;
};

const formatBookDisplayPrice = (price: number, mode: BookDisplayMode) =>
  mode === "decimal" ? formatLevelPrice(price) : formatLevelCents(price);

const fallbackDepthLevels = (outcome: Outcome, side: "bid" | "ask"): DepthLevel[] => {
  const baseProbability = side === "bid"
    ? outcome.bestBid ?? Math.max(outcome.probability - 3, 1)
    : outcome.bestAsk ?? Math.min(outcome.probability + 4, 99);
  const baseSize = side === "bid"
    ? outcome.bestBidSize ?? Math.max(Math.round(outcome.probability * 20), 100)
    : outcome.bestAskSize ?? Math.max(Math.round((100 - outcome.probability) * 25), 100);
  const direction = side === "bid" ? -1 : 1;

  return [0, 1, 2].map((index) => {
    const probability = Math.max(1, Math.min(99, baseProbability + direction * index));
    const shares = Math.max(25, Math.round(baseSize * (1 - index * 0.24)));
    const price = probability / 100;
    return {
      outcomeId: outcome.id,
      side,
      price,
      shares,
      total: price * shares,
    };
  });
};

const depthLevelsForOutcome = (market: Market, outcome: Outcome, side: "bid" | "ask") => {
  const explicitLevels = market.orderbookDepth?.filter((level) =>
    level.side === side &&
    (level.outcomeId === outcome.id || level.outcomeId === outcome.referenceOutcomeLabel || level.outcomeId === outcome.referenceTokenId),
  ) ?? [];
  const sharedLevels = market.orderbookDepth?.filter((level) => level.side === side && !level.outcomeId) ?? [];
  const levels = explicitLevels.length > 0 ? explicitLevels : sharedLevels;
  if (levels.length > 0) {
    return levels
      .slice()
      .sort((left, right) => side === "bid" ? right.price - left.price : left.price - right.price)
      .slice(0, 5);
  }
  return fallbackDepthLevels(outcome, side);
};

const orderBookGroupLabel = (market: Market) => {
  const title = market.title.toLowerCase();
  if (market.marketGroupId === "main" || market.marketType === "moneyline") return "Moneyline";
  if (market.marketType === "spread" || title.includes("spread")) return "Spreads";
  if (market.marketType === "totals" || title.includes("total goals")) return "Totals";
  if (market.marketType === "team-total" || title.includes("team total")) return "Team Totals";
  if (title.includes("winner") || title.includes("moneyline")) return "Moneyline";
  if (market.period === "first-half" || market.period === "second-half") return "Halves";
  if (market.type === "prop") return "Props";
  return "Other";
};

const orderBookSelectorKey = (market: Market) => {
  const family = market.marketGroupId ?? orderBookGroupLabel(market).toLowerCase().replace(/\s+/g, "-");
  return `${family}:${market.period ?? "full-game"}:${market.line ?? "default"}`;
};

const orderBookMarketType = (market: Market): TicketSelection["marketType"] => {
  if (market.marketType === "spread" || market.marketType === "totals" || market.marketType === "team-total" || market.marketType === "prop" || market.marketType === "future") {
    return market.marketType;
  }
  if (market.type === "live") return "live";
  if (market.type === "future") return "future";
  if (market.type === "prop") return "prop";
  return "winner";
};

const orderBookOutcomeSide = (market: Market, outcome: Outcome, index: number): "yes" | "no" => (
  outcome.side === "no" || label("en", outcome).toLowerCase().startsWith("no") || (market.outcomes.length === 2 && index === 1)
    ? "no"
    : "yes"
);

const orderBookTicketSelection = (market: Market, outcome: Outcome, outcomeIndex: number, displayLabel: string): TicketSelection => ({
  marketType: orderBookMarketType(market),
  marketId: market.id,
  outcomeId: outcome.id,
  marketGroupId: market.marketGroupId,
  line: market.line ?? undefined,
  period: market.period,
  side: outcome.side,
  displayLabel,
  contractSide: orderBookOutcomeSide(market, outcome, outcomeIndex),
  referenceSource: market.referenceSource ?? undefined,
  externalSlug: market.externalSlug ?? undefined,
  externalMarketId: market.externalMarketId ?? undefined,
  conditionId: market.conditionId ?? undefined,
  referenceTokenId: outcome.referenceTokenId ?? undefined,
  referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? undefined,
});

const marketStats = (event: Event) => {
  const outcomeCount = event.markets.reduce((total, market) => total + market.outcomes.length, 0);
  const volume = event.markets.length * 18250 + outcomeCount * 750;
  const liquidity = event.markets.length * 9400 + outcomeCount * 300;
  const traders = event.markets.length * 214 + outcomeCount * 17;

  return {
    volume: `${volume.toLocaleString("en-US")} USDT`,
    liquidity: `${liquidity.toLocaleString("en-US")} USDT`,
    traders: traders.toLocaleString("en-US"),
    marketCount: event.markets.length,
    outcomeCount,
  };
};

type RouteStatus = NonNullable<Event["chartHistoryStatus"]>;
type AvailabilityStatus = NonNullable<NonNullable<Event["liveDataStatus"]>["status"]>;
type ProviderLifecycle = "ready" | "refresh-due" | "refreshing" | "not-ready";

type ProviderStatusBadge = {
  lifecycle: ProviderLifecycle;
  text: string;
  meta: string;
  source: string;
};

const providerLifecycleText: Record<ProviderLifecycle, string> = {
  ready: "Provider ready",
  "refresh-due": "Refresh due",
  refreshing: "Refreshing",
  "not-ready": "Not ready",
};

const providerLifecycleIcon: Record<ProviderLifecycle, keyof typeof Ionicons.glyphMap> = {
  ready: "checkmark-circle-outline",
  "refresh-due": "time-outline",
  refreshing: "sync-outline",
  "not-ready": "alert-circle-outline",
};

const providerLifecycleFromRoute = (status: RouteStatus): ProviderLifecycle => {
  if (status === "ready") return "ready";
  if (status === "loading") return "refreshing";
  if (status === "idle") return "refresh-due";
  return "not-ready";
};

const providerLifecycleFromAvailability = (status: AvailabilityStatus): ProviderLifecycle => {
  if (status === "ready") return "ready";
  if (status === "stale" || status === "delayed") return "refresh-due";
  return "not-ready";
};

const providerStatusMeta = (source?: string | null, stalenessSeconds?: number | null, lastUpdated?: string | null) => {
  const sourceText = source ?? "deterministic-status-fixture";
  if (typeof stalenessSeconds === "number") return `${sourceText} - ${stalenessSeconds}s old`;
  if (lastUpdated) return `${sourceText} - timestamped`;
  return sourceText;
};

const providerBadgeFromAvailability = (
  prefix: string,
  status: NonNullable<Event["liveDataStatus"]> | undefined,
  fixtureStatus: AvailabilityStatus,
): ProviderStatusBadge => {
  const lifecycle = providerLifecycleFromAvailability(status?.status ?? fixtureStatus);
  return {
    lifecycle,
    text: `${prefix} ${providerLifecycleText[lifecycle].toLowerCase()}`,
    meta: providerStatusMeta(status?.source, status?.stalenessSeconds, status?.lastUpdated),
    source: status?.source ?? "deterministic-status-fixture",
  };
};

const providerBadgeFromRoute = (
  prefix: string,
  status: RouteStatus,
  source?: string | null,
  lastUpdated?: string | null,
): ProviderStatusBadge => {
  const lifecycle = providerLifecycleFromRoute(status);
  return {
    lifecycle,
    text: `${prefix} ${providerLifecycleText[lifecycle].toLowerCase()}`,
    meta: lastUpdated ? `${source ?? "deterministic-status-fixture"} - timestamped` : (source ?? "deterministic-status-fixture"),
    source: source ?? "deterministic-status-fixture",
  };
};

const teamCode = (name: string) => name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();

const positionCurrentProbability = (position: Position) => {
  if (typeof position.currentPrice === "number") return Math.round(position.currentPrice * 100);
  return Math.max(1, Math.min(99, position.probability + (position.side === "buy" ? 3 : -3)));
};

const homeChartPoints = [68, 69, 69, 68, 67, 68, 68, 67, 66, 66, 65, 64, 64, 63, 62, 62, 61, 61];
const awayChartPoints = [29, 28, 28, 29, 30, 30, 31, 31, 32, 32, 33, 34, 34, 35, 36, 36, 37, 37];

const chartFilters = ["All", "Game", "Live"] as const;

type ChartFilter = (typeof chartFilters)[number];
type ChartPointKey = "latest" | "mid" | "target";
type ChartContractKey = "moneyline" | "spread" | "totals";

type DisplayOutcome = {
  id: string;
  label: string;
  color: string;
  probability: number;
  odds?: string;
  icon?: string;
  miniLine?: number;
  ticketOutcome?: Outcome;
  ticketSelection?: TicketSelection;
};

type GameLineGroup = {
  id: string;
  title: string;
  subtitle?: string;
  backendMarket?: Market;
  rows: DisplayOutcome[];
  lineValue?: string;
  lineOptions?: string[];
  selectedPeriod?: LinePeriod;
  onSelectPeriod?: (period: LinePeriod) => void;
  onSelectLine?: (line: string) => void;
};

type LinePeriod = "Reg. Time" | "1st Half" | "2nd Half";

const linePeriods: LinePeriod[] = ["Reg. Time", "1st Half", "2nd Half"];

const linePeriodCode = (period: LinePeriod) => period === "Reg. Time" ? "RT" : period === "1st Half" ? "1H" : "2H";
const marketPeriodForLinePeriod = (period: LinePeriod): Market["period"] =>
  period === "Reg. Time" ? "regulation" : period === "1st Half" ? "first-half" : "second-half";

const boundedProbability = (value: number) => Math.max(1, Math.min(99, Math.round(value)));

const withLineOutcome = (base: Omit<Outcome, "zhLabel"> & Partial<Pick<Outcome, "zhLabel">>): Outcome => ({
  ...base,
  zhLabel: base.zhLabel ?? base.label,
});

const makeTieOutcome = (): DisplayOutcome => ({
  id: "tie-reg-time",
  label: "Tie",
  color: "#38bdf8",
  probability: 26,
  odds: "3.9x",
  icon: "%",
  miniLine: 58,
});

const ticketSelectionIdentityLabel = (selection?: TicketSelection) =>
  selection
    ? `selection-market-family-${selection.marketType} selection-market-type-${selection.marketType} selection-market-id-${selection.marketId ?? "none"} selection-outcome-id-${selection.outcomeId ?? "none"} selection-market-group-${selection.marketGroupId ?? "none"} selection-line-${selection.line ?? "none"} selection-period-${selection.period ?? "none"} selection-side-${selection.side ?? "yes"} selection-display-label-${selection.displayLabel} selection-contract-side-${selection.contractSide ?? "yes"} selection-provider-source-${selection.referenceSource ?? "none"} selection-provider-market-${selection.externalMarketId ?? "none"} selection-provider-condition-${selection.conditionId ?? "none"} selection-provider-token-${selection.referenceTokenId ?? "none"} selection-provider-outcome-${selection.referenceOutcomeLabel ?? "none"}`
    : "selection-market-family-none selection-line-none selection-period-none";

export function EventDetail({
  event,
  locale,
  t,
  openTicket,
  defaultSide,
  goBack,
  isSaved,
  toggleSavedEvent,
  requestMarketDepth,
  positions = [],
  closePosition,
  openPositionTrade,
}: {
  event: Event;
  locale: Locale;
  t: EventDetailCopy;
  openTicket: (market: Market, outcome: Outcome, event?: Event, side?: "buy" | "sell", selection?: TicketSelection) => void;
  defaultSide: "buy" | "sell";
  goBack: () => void;
  isSaved: boolean;
  toggleSavedEvent: (event: Event) => void;
  requestMarketDepth?: (marketId: string) => void;
  positions?: Position[];
  closePosition?: (position: Position) => void;
  openPositionTrade?: (position: Position, side: "buy" | "sell") => void;
}) {
  const [activeTab, setActiveTab] = useState<"game-lines" | "exact-score" | "halves" | "player-props">("game-lines");
  const showOrderBookDebug = process.env.EXPO_PUBLIC_SHOW_ORDERBOOK === "1";
  const [activeLineDetailTab, setActiveLineDetailTab] = useState<"order-book" | "graph" | "about">("graph");
  const [activeHeaderTab, setActiveHeaderTab] = useState<"game" | "chat">("game");
  const [activeBodyTab, setActiveBodyTab] = useState<"market" | "live-stats">("market");
  const [chartFilter, setChartFilter] = useState<ChartFilter>("Game");
  const [selectedChartPoint, setSelectedChartPoint] = useState<ChartPointKey>("latest");
  const [selectedChartOutcomeId, setSelectedChartOutcomeId] = useState<string | null>(null);
  const [selectedChartContract, setSelectedChartContract] = useState<ChartContractKey>("moneyline");
  const [spreadPeriod, setSpreadPeriod] = useState<LinePeriod>("Reg. Time");
  const [spreadLine, setSpreadLine] = useState("1.5");
  const [totalsPeriod, setTotalsPeriod] = useState<LinePeriod>("Reg. Time");
  const [totalsLine, setTotalsLine] = useState("2.5");
  const [savedNoticeVisible, setSavedNoticeVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [orderBookVisible, setOrderBookVisible] = useState(false);
  const [orderBookMarketId, setOrderBookMarketId] = useState<string | null>(null);
  const [orderBookOutcomeId, setOrderBookOutcomeId] = useState<string | null>(null);
  const [orderBookSettingsVisible, setOrderBookSettingsVisible] = useState(false);
  const [orderBookSelectorVisible, setOrderBookSelectorVisible] = useState(false);
  const [orderBookDisplayMode, setOrderBookDisplayMode] = useState<BookDisplayMode>("cents");
  const [stagedOrderBookLevel, setStagedOrderBookLevel] = useState<StagedOrderBookLevel | null>(null);
  const [refreshingDepthMarketId, setRefreshingDepthMarketId] = useState<string | null>(null);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);
  const [selectedPrimaryOutcomeId, setSelectedPrimaryOutcomeId] = useState<string | null>(null);
  const isLiveEvent = event.status === "live";
  const gameLineMarkets = useMemo(() => event.markets.filter((market) => market.type !== "prop" && market.type !== "future"), [event.markets]);
  const propMarkets = useMemo(() => event.markets.filter((market) => market.type === "prop"), [event.markets]);
  const primaryMarket = selectEventDetailPrimaryMarket(event, gameLineMarkets) ?? event.markets[0];
  const regulationWinnerMarket = selectEventDetailRegulationMarket(event, gameLineMarkets);
  const orderBookMarket = event.markets.find((market) => market.id === orderBookMarketId) ?? primaryMarket;
  const orderBookSelectedOutcome = orderBookMarket.outcomes.find((outcome) => outcome.id === orderBookOutcomeId) ?? orderBookMarket.outcomes[0];
  const primaryOutcomes = primaryMarket?.outcomes.slice(0, 2) ?? [];
  const selectedPrimaryOutcome = primaryOutcomes.find((outcome) => outcome.id === selectedPrimaryOutcomeId) ?? primaryOutcomes[0];
  const [expandedMarketIds, setExpandedMarketIds] = useState<Record<string, boolean>>({
    "regulation-time-winner": true,
    spread: true,
    totals: true,
    "first-half-winner": true,
    "second-half-winner": true,
    "team-total-goals": true,
  });
  useEffect(() => {
    if (!refreshingDepthMarketId) return undefined;
    const timer = setTimeout(() => setRefreshingDepthMarketId(null), 4000);
    return () => clearTimeout(timer);
  }, [refreshingDepthMarketId]);
  const stats = marketStats(event);
  const position = positions.find((item) =>
    event.markets.some((market) => market.id === item.marketId || market.title === item.title),
  );
  const teamA = event.teams[0];
  const teamB = event.teams[1];
  const leftOutcome = primaryOutcomes[0];
  const rightOutcome = primaryOutcomes[1];
  const selectedChartOutcome = primaryOutcomes.find((outcome) => outcome.id === selectedChartOutcomeId)
    ?? (isLiveEvent || chartFilter === "Live" ? rightOutcome ?? leftOutcome : leftOutcome ?? rightOutcome);
  const selectedChartColor = selectedChartOutcome?.color ?? "#22c55e";
  const selectedChartProbability = selectedChartOutcome?.probability ?? 0;
  const homeChartSeries = event.chartHistory?.filter((point) => point.outcomeId === leftOutcome?.id).map((point) => point.probability) ?? homeChartPoints;
  const awayChartSeries = event.chartHistory?.filter((point) => point.outcomeId === rightOutcome?.id).map((point) => point.probability) ?? awayChartPoints;
  const chartRouteStatus = event.chartHistoryStatus ?? (event.chartHistory?.length ? "ready" : event.chartHistorySource === "market-chart-route" ? "ready" : "idle");
  const liveDataStatus = event.liveDataStatus;
  const liveDataState = liveDataStatus?.status ?? (isLiveEvent ? "unavailable" : "ready");
  const liveDataBadge = providerBadgeFromAvailability("Live", liveDataStatus, isLiveEvent ? "stale" : "ready");
  const liveDataText = liveDataBadge.text;
  const liveDataMeta = liveDataBadge.meta;
  const depthMarketMatches = Boolean(orderBookMarket && event.orderbookDepthMarketId === orderBookMarket.id);
  const hasSelectedMarketDepth = (orderBookMarket?.orderbookDepth?.length ?? 0) > 0;
  const selectedDepthSource = depthMarketMatches
    ? event.orderbookDepthSource
    : hasSelectedMarketDepth
      ? "contract-fixture"
      : undefined;
  const resolvedDepthRouteStatus = depthMarketMatches
    ? (event.orderbookDepthStatus ?? (event.orderbookDepthSource === "orderbook-route" ? "ready" : "idle"))
    : hasSelectedMarketDepth
      ? "ready"
      : "idle";
  const depthRouteStatus = refreshingDepthMarketId === orderBookMarket?.id ? "loading" : resolvedDepthRouteStatus;
  const selectedOrderbookAvailabilityBase = depthMarketMatches ? event.orderbookAvailability : orderBookMarket?.availability;
  const selectedOrderbookAvailability =
    depthRouteStatus === "ready" && selectedDepthSource === "orderbook-route" && selectedOrderbookAvailabilityBase && selectedOrderbookAvailabilityBase.status !== "ready"
      ? {
          ...selectedOrderbookAvailabilityBase,
          source: "orderbook-route",
          status: "ready" as const,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "Route-backed orderbook depth is ready.",
        }
      : selectedOrderbookAvailabilityBase;
  const orderbookAvailabilityStatus = selectedOrderbookAvailability?.status ?? "unavailable";
  const orderbookAvailabilityBadge = providerBadgeFromAvailability("Book", selectedOrderbookAvailability, "unavailable");
  const orderbookAvailabilitySourceText =
    orderbookAvailabilityStatus === "ready"
      ? "Market live"
      : orderbookAvailabilityStatus === "stale"
        ? "Market stale"
        : orderbookAvailabilityStatus === "suspended"
          ? "Market suspended"
          : orderbookAvailabilityStatus === "delayed"
            ? "Market delayed"
            : "Market unavailable";
  const orderbookAvailabilityText = `${orderbookAvailabilityBadge.text} - ${orderbookAvailabilitySourceText}`;
  const chartStatusBadge = providerBadgeFromRoute(
    "Chart",
    chartRouteStatus,
    event.chartHistorySource ?? (event.chartHistory?.length ? "embedded-history" : "deterministic-status-fixture"),
    event.chartHistoryLastUpdated,
  );
  const chartSourceText =
    chartRouteStatus === "loading"
      ? "Updating chart"
      : chartRouteStatus === "empty"
        ? "No chart history"
        : chartRouteStatus === "error"
          ? "Chart unavailable"
          : event.chartHistoryLastUpdated
            ? `Updated ${event.chartHistoryRange ?? "1D"}`
            : event.chartHistorySource === "market-chart-route" || event.chartHistorySource === "polymarket-clob-prices-history"
              ? "Route chart"
              : "Fallback chart";
  const chartStateText = `${chartStatusBadge.text} - ${chartSourceText}`;
  const depthStatusBadge = providerBadgeFromRoute("Book depth", depthRouteStatus, selectedDepthSource, event.orderbookDepthLastUpdated);
  const depthSourceText =
    depthRouteStatus === "loading"
      ? "Loading depth"
      : depthRouteStatus === "empty"
        ? "No depth"
        : depthRouteStatus === "error"
          ? "Depth unavailable"
          : selectedDepthSource === "orderbook-route"
            ? "Route depth"
            : selectedDepthSource === "contract-fixture"
              ? "Fixture depth"
              : "Fallback depth";
  const depthStateText = `${depthStatusBadge.text} - ${depthSourceText}`;
  const openOrderBookForMarket = (market: Market) => {
    if (!showOrderBookDebug) return;
    setOrderBookMarketId(market.id);
    setOrderBookOutcomeId(market.outcomes[0]?.id ?? null);
    setStagedOrderBookLevel(null);
    setRefreshingDepthMarketId(market.id);
    requestMarketDepth?.(market.id);
    setOrderBookVisible(true);
  };
  const openPrimaryOutcomeTicket = (outcome: Outcome) => {
    if (!primaryMarket) return;
    setSelectedPrimaryOutcomeId(outcome.id);
    setShareSheetVisible(false);
    setOrderBookVisible(false);
    const outcomeIndex = primaryMarket.outcomes.findIndex((item) => item.id === outcome.id);
    const contractSide = orderBookOutcomeSide(primaryMarket, outcome, outcomeIndex);
    openTicket(primaryMarket, outcome, event, defaultSide, {
      marketType: isLiveEvent ? "live" : "winner",
      marketId: primaryMarket.id,
      outcomeId: outcome.id,
      marketGroupId: primaryMarket.marketGroupId,
      period: primaryMarket.period,
      side: outcome.side,
      displayLabel: isLiveEvent ? "Live Winner" : "Team to Advance",
      contractSide,
      referenceSource: primaryMarket.referenceSource ?? undefined,
      externalSlug: primaryMarket.externalSlug ?? undefined,
      externalMarketId: primaryMarket.externalMarketId ?? undefined,
      conditionId: primaryMarket.conditionId ?? undefined,
      referenceTokenId: outcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? undefined,
    });
  };
  const selectOrderBookMarket = (market: Market) => {
    setOrderBookMarketId(market.id);
    setOrderBookOutcomeId(market.outcomes[0]?.id ?? null);
    setStagedOrderBookLevel(null);
    setOrderBookSelectorVisible(false);
    setRefreshingDepthMarketId(market.id);
    requestMarketDepth?.(market.id);
  };
  const selectChartOutcome = (outcome: Outcome) => {
    setSelectedChartOutcomeId(outcome.id);
    setSelectedPrimaryOutcomeId(outcome.id);
    setChartFilter(outcome.id === rightOutcome?.id ? "Live" : "Game");
  };
  const selectChartPoint = (point: ChartPointKey) => {
    setSelectedChartPoint(point);
  };
  const liveStatRows = event.liveStats ?? [
    { label: "Possession", home: "54%", away: "46%" },
    { label: "Shots", home: "8", away: "5" },
    { label: "Shots on target", home: "3", away: "2" },
    { label: "Corners", home: "4", away: "3" },
    { label: "Expected goals", home: "1.12", away: "0.84" },
  ];
  const chartPointMeta = selectedChartPoint === "target"
    ? { label: "Target", value: `${Math.max(1, selectedChartProbability + 4)}%`, time: "Target line" }
    : selectedChartPoint === "mid"
      ? { label: "2H", value: `${Math.max(1, selectedChartProbability - 2)}%`, time: "Mid chart" }
      : { label: "Current", value: `${selectedChartProbability}%`, time: event.status === "live" ? "Live now" : event.startsAt };
  const liveClock = event.status === "live"
    ? event.startsAt.replace("Live", "").replace("·", "").trim()
    : "15'";
  const scoreboard = event.status === "live" ? "0 - 1" : "0 - 0";
  const handleScroll = (eventScroll: NativeSyntheticEvent<NativeScrollEvent>) => {
    const shouldShow = eventScroll.nativeEvent.contentOffset.y > 500;
    setCompactHeaderVisible((visible) => visible === shouldShow ? visible : shouldShow);
  };
  const regulationWinnerRows: DisplayOutcome[] = regulationWinnerMarket
    ? regulationWinnerMarket.outcomes.map((outcome) => ({
        id: outcome.id,
        label: `${label(locale, outcome)} (Reg. Time)`,
        color: outcome.color,
        probability: outcome.probability,
        odds: `${outcomeOdds(outcome)}x`,
        icon: outcome.side === "draw" ? "%" : outcome.side === "away" ? teamB?.flag ?? "" : teamA?.flag ?? "",
        miniLine: Math.max(18, outcome.probability),
        ticketOutcome: outcome,
      }))
    : [];
  const spreadLineOptions = ["0.5", "1.5", "2.5"];
  const totalsLineOptions = ["1.5", "2.5", "3.5"];
  const homeCode = teamCode(teamA?.name ?? "Home");
  const spreadProbability = boundedProbability(
    34
    - (spreadLine === "0.5" ? -14 : spreadLine === "2.5" ? 18 : 0)
    - (spreadPeriod === "1st Half" ? 13 : spreadPeriod === "2nd Half" ? 5 : 0),
  );
  const totalsOverProbability = boundedProbability(
    52
    + (totalsLine === "1.5" ? 18 : totalsLine === "3.5" ? -17 : 0)
    + (totalsPeriod === "1st Half" ? -20 : totalsPeriod === "2nd Half" ? -13 : 0),
  );
  const makeLineMarket = (id: string, title: string, outcomes: Outcome[], marketType?: Market["marketType"], line?: string, period?: Market["period"]): Market => ({
    id,
    title,
    zhTitle: title,
    type: "game-line",
    marketType,
    line,
    period,
    outcomes,
  });
  const lineAsNumber = (value: string | null | undefined) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const matchingBackendLineMarket = (type: string, line: string, period: LinePeriod) => {
    const target = Number(line);
    if (!Number.isFinite(target)) return undefined;
    const matchingTypes = type === "totals"
      ? ["totals", "total_goals"]
      : type === "team-total"
        ? ["team-total", "team_total", "team_totals", "team_total_goals"]
        : [type];
    const targetPeriod = marketPeriodForLinePeriod(period);
    const equivalentPeriod = (value?: Market["period"]) => value === "full-game" ? "regulation" : value;
    return event.markets.find((market) =>
      matchingTypes.includes(market.marketType ?? "") &&
      Math.abs(lineAsNumber(market.line) ?? Number.NaN) === target &&
      (!market.period || equivalentPeriod(market.period) === equivalentPeriod(targetPeriod))
    );
  };
  const backendSpreadMarket = matchingBackendLineMarket("spread", spreadLine, spreadPeriod);
  const backendTotalsMarket = matchingBackendLineMarket("totals", totalsLine, totalsPeriod);
  const backendTeamTotalMarket = matchingBackendLineMarket("team-total", "1.5", "Reg. Time");
  const matchingBackendPeriodWinnerMarket = (period: Market["period"]) =>
    event.markets.find((market) =>
      market.period === period &&
      ["moneyline", "match_winner_1x2", "winner"].includes(market.marketType ?? "") &&
      market.outcomes.length > 0);
  const backendFirstHalfMarket = matchingBackendPeriodWinnerMarket("first-half");
  const backendSecondHalfMarket = matchingBackendPeriodWinnerMarket("second-half");
  const canRenderSpread = canRenderEventDetailLineFamily(event, backendSpreadMarket);
  const spreadMarket = makeLineMarket(`${event.id}-spread-${spreadLine}-${linePeriodCode(spreadPeriod)}`, `Spread ${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}`, [], "spread", spreadLine, marketPeriodForLinePeriod(spreadPeriod));
  const spreadYesOutcome = withLineOutcome({
    id: `${spreadMarket.id}-yes`,
    label: `${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}`,
    probability: spreadProbability,
    bestBid: Math.max(spreadProbability - 3, 1),
    bestAsk: Math.min(spreadProbability + 4, 99),
    color: leftOutcome?.color ?? "#22c55e",
  });
  const spreadNoOutcome = withLineOutcome({
    id: `${spreadMarket.id}-no`,
    label: `No ${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}`,
    probability: boundedProbability(100 - spreadProbability),
    bestBid: Math.max(100 - spreadProbability - 3, 1),
    bestAsk: Math.min(100 - spreadProbability + 4, 99),
    color: "#64748b",
  });
  spreadMarket.outcomes = [spreadYesOutcome, spreadNoOutcome];
  const spreadRows: DisplayOutcome[] = [
    {
      id: "spread-yes",
      label: `Yes, ${homeCode} -${spreadLine}`,
      color: leftOutcome?.color ?? "#22c55e",
      probability: spreadYesOutcome.probability,
      odds: `${outcomeOdds(spreadYesOutcome)}x`,
      icon: "Y",
      miniLine: spreadYesOutcome.probability,
      ticketOutcome: spreadYesOutcome,
      ticketSelection: { marketType: "spread", line: spreadLine, period: spreadPeriod, displayLabel: `${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}` },
    },
    {
      id: "spread-no",
      label: "No",
      color: "#64748b",
      probability: spreadNoOutcome.probability,
      odds: `${outcomeOdds(spreadNoOutcome)}x`,
      icon: "N",
      miniLine: spreadNoOutcome.probability,
      ticketOutcome: spreadNoOutcome,
      ticketSelection: { marketType: "spread", line: spreadLine, period: spreadPeriod, displayLabel: `No ${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}` },
    },
  ];
  const totalsMarket = makeLineMarket(`${event.id}-totals-${totalsLine}-${linePeriodCode(totalsPeriod)}`, `Totals ${totalsLine} ${linePeriodCode(totalsPeriod)}`, [], "totals", totalsLine, marketPeriodForLinePeriod(totalsPeriod));
  const totalsOverOutcome = withLineOutcome({
    id: `${totalsMarket.id}-over`,
    label: `Over ${totalsLine} ${linePeriodCode(totalsPeriod)}`,
    probability: totalsOverProbability,
    bestBid: Math.max(totalsOverProbability - 3, 1),
    bestAsk: Math.min(totalsOverProbability + 4, 99),
    color: "#22c55e",
  });
  const totalsUnderOutcome = withLineOutcome({
    id: `${totalsMarket.id}-under`,
    label: `Under ${totalsLine} ${linePeriodCode(totalsPeriod)}`,
    probability: boundedProbability(100 - totalsOverProbability),
    bestBid: Math.max(100 - totalsOverProbability - 3, 1),
    bestAsk: Math.min(100 - totalsOverProbability + 4, 99),
    color: "#64748b",
  });
  totalsMarket.outcomes = [totalsOverOutcome, totalsUnderOutcome];
  const teamTotalLine = "1.5";
  const teamTotalCode = teamCode(teamA?.name ?? "Home");
  const teamTotalMarket = makeLineMarket(`${event.id}-team-total-${teamTotalLine}-RT`, `${teamTotalCode} team total ${teamTotalLine} RT`, [], "team-total", teamTotalLine, "regulation");
  const teamTotalOverOutcome = withLineOutcome({
    id: `${teamTotalMarket.id}-over`,
    label: `${teamTotalCode} Over ${teamTotalLine}`,
    probability: 57,
    bestBid: 0.54,
    bestAsk: 0.61,
    color: leftOutcome?.color ?? "#22c55e",
  });
  const teamTotalUnderOutcome = withLineOutcome({
    id: `${teamTotalMarket.id}-under`,
    label: `${teamTotalCode} Under ${teamTotalLine}`,
    probability: 44,
    bestBid: 0.41,
    bestAsk: 0.48,
    color: "#64748b",
  });
  teamTotalMarket.outcomes = [teamTotalOverOutcome, teamTotalUnderOutcome];
  const selectedChartMarket = selectedChartContract === "spread"
    ? backendSpreadMarket ?? primaryMarket
    : selectedChartContract === "totals"
      ? backendTotalsMarket ?? primaryMarket
      : primaryMarket;
  const selectedChartContractLabel = selectedChartContract === "spread"
    ? `${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}`
    : selectedChartContract === "totals"
      ? `O/U ${totalsLine} ${linePeriodCode(totalsPeriod)}`
      : (selectedChartOutcome ? label(locale, selectedChartOutcome) : "Moneyline");
  const selectedChartTicketOutcome = selectedChartContract === "spread"
    ? backendSpreadMarket?.outcomes[0] ?? spreadYesOutcome
    : selectedChartContract === "totals"
      ? backendTotalsMarket?.outcomes[0] ?? totalsOverOutcome
      : selectedChartOutcome;
  const selectedChartTicketSelection: TicketSelection | undefined = selectedChartContract === "spread"
    ? backendSpreadMarket && backendSpreadMarket.outcomes[0]
      ? orderBookTicketSelection(backendSpreadMarket, backendSpreadMarket.outcomes[0], 0, label(locale, backendSpreadMarket))
      : { marketType: "spread", line: spreadLine, period: spreadPeriod, displayLabel: selectedChartContractLabel }
    : selectedChartContract === "totals"
      ? backendTotalsMarket && backendTotalsMarket.outcomes[0]
        ? orderBookTicketSelection(backendTotalsMarket, backendTotalsMarket.outcomes[0], 0, label(locale, backendTotalsMarket))
        : { marketType: "totals", line: totalsLine, period: totalsPeriod, displayLabel: selectedChartContractLabel }
      : selectedChartOutcome && primaryMarket
        ? orderBookTicketSelection(primaryMarket, selectedChartOutcome, primaryMarket.outcomes.findIndex((outcome) => outcome.id === selectedChartOutcome.id), "Match winner")
        : undefined;
  const selectedChartTicketStatusBadge = providerBadgeFromAvailability("Ticket", selectedChartMarket?.availability, selectedChartMarket ? "ready" : "unavailable");
  const openSelectedChartBook = () => {
    if (!showOrderBookDebug) return;
    if (!selectedChartMarket) return;
    openOrderBookForMarket(selectedChartMarket);
  };
  const openSelectedChartTicket = () => {
    if (!selectedChartMarket || !selectedChartTicketOutcome) return;
    openTicket(selectedChartMarket, selectedChartTicketOutcome, event, defaultSide, selectedChartTicketSelection);
  };
  const gameLineGroups: GameLineGroup[] = [
    {
      id: "totals",
      title: "Totals",
      subtitle: `Total goals over ${totalsLine}`,
      backendMarket: backendTotalsMarket,
      lineValue: totalsLine,
      lineOptions: totalsLineOptions,
      selectedPeriod: totalsPeriod,
      onSelectPeriod: setTotalsPeriod,
      onSelectLine: setTotalsLine,
      rows: [
        {
          id: "totals-over",
          label: `Over ${totalsLine}`,
          color: "#22c55e",
          probability: totalsOverOutcome.probability,
          odds: `${outcomeOdds(totalsOverOutcome)}x`,
          icon: "O",
          miniLine: totalsOverOutcome.probability,
          ticketOutcome: totalsOverOutcome,
          ticketSelection: { marketType: "totals", line: totalsLine, period: totalsPeriod, displayLabel: `Over ${totalsLine} ${linePeriodCode(totalsPeriod)}` },
        },
        {
          id: "totals-under",
          label: `Under ${totalsLine}`,
          color: "#64748b",
          probability: totalsUnderOutcome.probability,
          odds: `${outcomeOdds(totalsUnderOutcome)}x`,
          icon: "U",
          miniLine: totalsUnderOutcome.probability,
          ticketOutcome: totalsUnderOutcome,
          ticketSelection: { marketType: "totals", line: totalsLine, period: totalsPeriod, displayLabel: `Under ${totalsLine} ${linePeriodCode(totalsPeriod)}` },
        },
      ],
    },
    {
      id: "first-half-winner",
      title: "1st Half Winner",
      subtitle: "Who wins the first half?",
      backendMarket: backendFirstHalfMarket,
      rows: [
        { id: "first-home", label: `${leftOutcome ? label(locale, leftOutcome) : teamA?.name ?? "Home"} 1H`, color: leftOutcome?.color ?? "#22c55e", probability: 44, odds: "2.3x", icon: teamA?.flag ?? "", miniLine: 44 },
        { id: "first-tie", label: "Tie 1H", color: "#38bdf8", probability: 45, odds: "2.2x", icon: "%", miniLine: 45 },
        { id: "first-away", label: `${rightOutcome ? label(locale, rightOutcome) : teamB?.name ?? "Away"} 1H`, color: rightOutcome?.color ?? "#ef4444", probability: 15, odds: "6.7x", icon: teamB?.flag ?? "", miniLine: 15 },
      ],
    },
    {
      id: "second-half-winner",
      title: "2nd Half Winner",
      subtitle: "Who wins the second half?",
      backendMarket: backendSecondHalfMarket,
      rows: [
        { id: "second-home", label: `${leftOutcome ? label(locale, leftOutcome) : teamA?.name ?? "Home"} 2H`, color: leftOutcome?.color ?? "#22c55e", probability: 54, odds: "1.9x", icon: teamA?.flag ?? "", miniLine: 54 },
        { id: "second-tie", label: "Tie 2H", color: "#38bdf8", probability: 33, odds: "3.0x", icon: "%", miniLine: 33 },
        { id: "second-away", label: `${rightOutcome ? label(locale, rightOutcome) : teamB?.name ?? "Away"} 2H`, color: rightOutcome?.color ?? "#ef4444", probability: 19, odds: "5.3x", icon: teamB?.flag ?? "", miniLine: 19 },
      ],
    },
    {
      id: "team-total-goals",
      title: "Full Game Team Total Goals (Reg. Time)",
      subtitle: `${teamCode(teamA?.name ?? "Home")} goals over 1.5`,
      backendMarket: backendTeamTotalMarket,
      lineValue: "1.5",
      rows: [
        {
          id: "team-total-over",
          label: `${teamTotalCode} Over ${teamTotalLine}`,
          color: leftOutcome?.color ?? "#22c55e",
          probability: teamTotalOverOutcome.probability,
          odds: `${outcomeOdds(teamTotalOverOutcome)}x`,
          icon: teamA?.flag ?? "",
          miniLine: teamTotalOverOutcome.probability,
          ticketOutcome: teamTotalOverOutcome,
          ticketSelection: { marketType: "team-total", line: teamTotalLine, period: "Reg. Time", displayLabel: `${teamTotalCode} Over ${teamTotalLine} RT` },
        },
        {
          id: "team-total-under",
          label: `${teamTotalCode} Under ${teamTotalLine}`,
          color: "#64748b",
          probability: teamTotalUnderOutcome.probability,
          odds: `${outcomeOdds(teamTotalUnderOutcome)}x`,
          icon: "U",
          miniLine: teamTotalUnderOutcome.probability,
          ticketOutcome: teamTotalUnderOutcome,
          ticketSelection: { marketType: "team-total", line: teamTotalLine, period: "Reg. Time", displayLabel: `${teamTotalCode} Under ${teamTotalLine} RT` },
        },
      ],
    },
  ];
  const visibleGameLineGroups = gameLineGroups.filter((group) => canRenderEventDetailLineFamily(event, group.backendMarket));
  const toggleGroup = (id: string) => {
    setExpandedMarketIds((current) => ({ ...current, [id]: !current[id] }));
  };

  const renderMarketTabs = (mode: "inline" | "sticky" = "inline") => {
    const tabs =
      mode === "sticky"
        ? [
            { id: "game-lines", label: "Game Lines" },
            { id: "player-props", label: "Player Props" },
          ]
        : [
            { id: "game-lines", label: "Game Lines" },
            { id: "exact-score", label: "Exact Score" },
            { id: "halves", label: "Halves" },
            { id: "player-props", label: "Player Props" },
          ];

    return (
      <View
        accessibilityLabel={mode === "sticky" ? "event-detail-sticky-market-tabs Game Lines Player Props" : "event-detail-market-tabs"}
        style={[styles.marketTabs, mode === "sticky" && styles.stickyMarketTabs]}
        testID={mode === "sticky" ? "event-detail-sticky-market-tabs" : "event-detail-market-tabs"}
      >
        {tabs.map((tab) => (
          <Pressable
            accessibilityLabel={`event-detail-${tab.id}-tab`}
            key={tab.id}
            onPress={() => setActiveTab(tab.id as typeof activeTab)}
            style={[styles.marketTab, activeTab === tab.id && styles.marketTabActive]}
            testID={mode === "sticky" ? `event-detail-sticky-${tab.id}-tab` : `event-detail-${tab.id}-tab`}
          >
            <Text style={[styles.marketTabText, activeTab === tab.id && styles.marketTabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderTeamToAdvanceCard = () => {
    if (!primaryMarket) return null;
    return (
      <View accessibilityLabel="event-detail-team-to-advance-card" style={styles.polymarketLineCard} testID="event-detail-team-to-advance-card">
        <View style={styles.marketTitleBlock}>
          <View style={styles.lineCardTitleRow}>
            <Text style={styles.marketTitle}>{isLiveEvent ? "Live Winner" : "Team to Advance"}</Text>
            <Ionicons name="information-circle-outline" color="#64748b" size={19} />
          </View>
          <Text style={styles.marketSubcopy}>{isLiveEvent ? "Live World Cup - prices moving" : "$60.9K Vol."}</Text>
        </View>
        <View style={styles.lineOutcomeButtonRow}>
          {primaryOutcomes.map((outcome, index) => (
            <Pressable
              accessibilityLabel={`event-detail-team-advance-${outcome.id}`}
              key={outcome.id}
              onPress={() => openPrimaryOutcomeTicket(outcome)}
              style={[styles.lineOutcomeButton, selectedPrimaryOutcome?.id === outcome.id && styles.lineOutcomeButtonSelected]}
              testID={`event-detail-team-advance-${outcome.id}`}
            >
              <Text style={styles.lineOutcomeButtonText}>{teamCode(outcome.label)} {isLiveEvent ? `${outcome.probability}%` : index === 0 ? "52¢" : "49¢"}</Text>
            </Pressable>
          ))}
        </View>
        <View accessibilityLabel="event-detail-line-detail-tabs" style={styles.lineDetailTabs} testID="event-detail-line-detail-tabs">
          {[
            ...(showOrderBookDebug ? [{ id: "order-book", label: "Order Book" }] : []),
            { id: "graph", label: "Graph" },
            { id: "about", label: "About" },
          ].map((tab) => (
            <Pressable
              accessibilityLabel={`event-detail-line-detail-${tab.id}`}
              key={tab.id}
              onPress={() => setActiveLineDetailTab(tab.id as typeof activeLineDetailTab)}
              style={styles.lineDetailTab}
              testID={`event-detail-line-detail-${tab.id}`}
            >
              <Text style={[styles.lineDetailTabText, activeLineDetailTab === tab.id && styles.lineDetailTabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
          <Ionicons name="cash-outline" color="#fbbf24" size={22} />
          <Ionicons name="gift-outline" color="#94a3b8" size={22} />
          <Ionicons name="swap-horizontal-outline" color="#94a3b8" size={22} />
          <Ionicons name="refresh-outline" color="#94a3b8" size={22} />
        </View>
        {activeLineDetailTab === "order-book" ? (
          <View accessibilityLabel="event-detail-inline-order-book" style={styles.inlineOrderBook} testID="event-detail-inline-order-book">
            <View style={styles.inlineOrderBookHeader}>
              <Text style={styles.inlineBookHeaderText}>PRICE</Text>
              <Text style={styles.inlineBookHeaderText}>SHARES</Text>
              <Text style={styles.inlineBookHeaderText}>TOTAL</Text>
            </View>
            {[55, 54].map((price, index) => (
              <View key={price} style={styles.inlineBookRow}>
                <Text style={styles.inlineBookPrice}>{price}¢</Text>
                <Text style={styles.inlineBookText}>{index === 0 ? "8,070.50" : "246,972.30"}</Text>
                <Text style={styles.inlineBookText}>{index === 0 ? "$293,440.88" : "$289,002.10"}</Text>
              </View>
            ))}
          </View>
        ) : activeLineDetailTab === "graph" ? (
          <View accessibilityLabel="event-detail-inline-graph" style={styles.inlineGraph} testID="event-detail-inline-graph">
            <View style={styles.inlineGraphLine} />
            <Text style={styles.inlineGraphText}>Line movement for {isLiveEvent ? "Live Winner" : "Team to Advance"}</Text>
          </View>
        ) : (
          <View accessibilityLabel="event-detail-inline-about" style={styles.inlineAbout} testID="event-detail-inline-about">
            <Text style={styles.inlineAboutText}>{isLiveEvent ? "This live market resolves from the selected World Cup in-game contract at settlement." : "This market resolves to the team that advances from this World Cup matchup."}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderExactScore = () => (
    <View accessibilityLabel="event-detail-exact-score" testID="event-detail-exact-score">
      <View style={styles.polymarketLineCard}>
        <Text style={styles.marketTitle}>Exact Score</Text>
        <Text style={styles.marketSubcopy}>Correct score at full time</Text>
        {["0-0", "1-0", "0-1", "1-1"].map((score, index) => (
          <View key={score} style={styles.exactScoreRow}>
            <Text style={styles.exactScoreText}>{score}</Text>
            <Pressable accessibilityLabel={`event-detail-exact-score-${score}`} style={styles.exactScoreButton} testID={`event-detail-exact-score-${score}`}>
              <Text style={styles.exactScoreButtonText}>{[11, 14, 13, 16][index]}¢</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );

  const renderHalves = () => (
    <View accessibilityLabel="event-detail-halves" testID="event-detail-halves">
      {visibleGameLineGroups.filter((group) => group.id === "first-half-winner" || group.id === "second-half-winner").map((group) => renderGroup(group))}
    </View>
  );

  const renderOrderBook = () => {
    if (!orderBookMarket || !orderBookSelectedOutcome) return null;
    const marketGroups = event.markets.reduce<Array<{ title: string; markets: Market[] }>>((groups, market) => {
      const title = orderBookGroupLabel(market);
      const group = groups.find((item) => item.title === title);
      if (group) {
        group.markets.push(market);
      } else {
        groups.push({ title, markets: [market] });
      }
      return groups;
    }, []);
    const bidLevels = depthLevelsForOutcome(orderBookMarket, orderBookSelectedOutcome, "bid");
    const askLevels = depthLevelsForOutcome(orderBookMarket, orderBookSelectedOutcome, "ask");
    const visibleAsks = askLevels.slice().sort((left, right) => right.price - left.price);
    const visibleBids = bidLevels.slice().sort((left, right) => right.price - left.price);
    const bestBid = bidLevels[0];
    const bestAsk = askLevels[0];
    const spreadCents = bestBid && bestAsk ? Math.max(0, levelProbability(bestAsk.price) - levelProbability(bestBid.price)) : null;
    const largest = Math.max(...bidLevels.map((level) => level.shares), ...askLevels.map((level) => level.shares), 1);
    const depthSourceLabel = selectedDepthSource === "orderbook-route"
      ? "route-depth-ladder"
      : selectedDepthSource === "contract-fixture"
        ? "contract-fixture-depth-ladder"
        : "quote-fallback-ladder";
    const selectedOutcomeIndex = orderBookMarket.outcomes.findIndex((outcome) => outcome.id === orderBookSelectedOutcome.id);
    const selectedContractSide = orderBookOutcomeSide(orderBookMarket, orderBookSelectedOutcome, selectedOutcomeIndex);
    const selectedMarketFamily = orderBookGroupLabel(orderBookMarket);
    const selectedTicketLabel = label(locale, orderBookMarket);
    const selectedTicketSelection = orderBookTicketSelection(orderBookMarket, orderBookSelectedOutcome, selectedOutcomeIndex, selectedTicketLabel);
    const selectedSelectorKey = orderBookSelectorKey(orderBookMarket);
    const selectedIdentityLabel = `selected-market-${orderBookMarket.id} selected-selector-key-${selectedSelectorKey} selected-family-${selectedMarketFamily} selected-outcome-${orderBookSelectedOutcome.id} selected-side-${selectedContractSide} selected-market-type-${selectedTicketSelection.marketType} selected-line-${selectedTicketSelection.line ?? "none"} selected-period-${selectedTicketSelection.period ?? "none"} selected-provider-source-${selectedTicketSelection.referenceSource ?? "none"} selected-provider-market-${selectedTicketSelection.externalMarketId ?? "none"} selected-provider-condition-${selectedTicketSelection.conditionId ?? "none"} selected-provider-token-${selectedTicketSelection.referenceTokenId ?? "none"} selected-provider-outcome-${selectedTicketSelection.referenceOutcomeLabel ?? "none"}`;
    const displayModeLabel = orderBookDisplayMode === "decimal" ? "Decimal" : "Cents";
    const priceHeaderLabel = orderBookDisplayMode === "decimal" ? "Price (USDT)" : "Price";
    const groupNamesLabel = marketGroups.map((group) => group.title).join(" ");
    const selectedLineText = selectedTicketSelection.line ? `Line ${selectedTicketSelection.line}` : "No line";
    const selectedPeriodText = selectedTicketSelection.period ?? "full game";
    const selectedContractText = `${selectedContractSide.toUpperCase()} - ${label(locale, orderBookSelectedOutcome)}`;
    const selectedBidPriceText = bestBid ? formatLevelPrice(bestBid.price) : "No bid";
    const selectedAskPriceText = bestAsk ? formatLevelPrice(bestAsk.price) : "No ask";
    const selectedBidSizeText = bestBid ? `${formatSize(bestBid.shares)} ${t.shares}` : `0 ${t.shares}`;
    const selectedAskSizeText = bestAsk ? `${formatSize(bestAsk.shares)} ${t.shares}` : `0 ${t.shares}`;
    const selectedSpreadText = spreadCents == null ? "-" : `${spreadCents}c`;
    const activeStagedLevel =
      stagedOrderBookLevel?.marketId === orderBookMarket.id && stagedOrderBookLevel?.outcomeId === orderBookSelectedOutcome.id
        ? stagedOrderBookLevel
        : null;
    const stagedTicketSide = activeStagedLevel?.side === "bid" ? "sell" : "buy";
    const stagedPriceText = activeStagedLevel ? formatBookDisplayPrice(activeStagedLevel.price, orderBookDisplayMode) : null;
    const stagedDecimalPriceText = activeStagedLevel ? formatLevelPrice(activeStagedLevel.price) : null;
    const stagedProbability = activeStagedLevel ? levelProbability(activeStagedLevel.price) : null;
    const stagedTicketOutcome =
      activeStagedLevel && stagedProbability
        ? {
            ...orderBookSelectedOutcome,
            probability: stagedProbability,
            bestBid: activeStagedLevel.side === "bid" ? stagedProbability : orderBookSelectedOutcome.bestBid,
            bestAsk: activeStagedLevel.side === "ask" ? stagedProbability : orderBookSelectedOutcome.bestAsk,
            bestBidSize: activeStagedLevel.side === "bid" ? activeStagedLevel.shares : orderBookSelectedOutcome.bestBidSize,
            bestAskSize: activeStagedLevel.side === "ask" ? activeStagedLevel.shares : orderBookSelectedOutcome.bestAskSize,
          }
        : orderBookSelectedOutcome;
    const openBookTicket = (side: "buy" | "sell") => {
      const stagedSelection =
        activeStagedLevel && stagedProbability
          ? {
              ...selectedTicketSelection,
              limitPrice: activeStagedLevel.price,
              limitSide: activeStagedLevel.side,
              limitShares: activeStagedLevel.shares,
            }
          : selectedTicketSelection;
      openTicket(orderBookMarket, stagedTicketOutcome, event, side, stagedSelection);
    };
    const stageLevel = (level: DepthLevel) => {
      setStagedOrderBookLevel({
        marketId: orderBookMarket.id,
        outcomeId: orderBookSelectedOutcome.id,
        side: level.side,
        price: level.price,
        shares: level.shares,
        total: level.total,
      });
    };
    return (
      <View accessibilityLabel={`event-detail-order-book-screen event-detail-order-book-market-${orderBookMarket.id} ${selectedIdentityLabel} book-display-mode-${orderBookDisplayMode} orderbook-source-${selectedDepthSource ?? "fallback"} orderbook-status-${depthRouteStatus} provider-lifecycle-${depthStatusBadge.lifecycle} orderbook-empty-${depthMarketMatches || hasSelectedMarketDepth ? event.orderbookDepthEmptyState ?? "none" : "not-selected"} orderbook-availability-${orderbookAvailabilityStatus} orderbook-availability-lifecycle-${orderbookAvailabilityBadge.lifecycle} orderbook-market-status-${selectedOrderbookAvailability?.marketStatus ?? "unknown"} staged-level-${activeStagedLevel ? `${activeStagedLevel.side}-${levelProbability(activeStagedLevel.price)}` : "none"}`} style={styles.orderBookOverlay} testID="event-detail-order-book-screen">
        <View style={styles.orderBookHeader}>
          <View>
            <Text style={styles.orderBookTitle}>Order Book</Text>
            <Text style={styles.orderBookSubtitle}>{label(locale, event)} - {label(locale, orderBookMarket)}</Text>
          </View>
          <View style={styles.orderBookHeaderActions}>
            <Pressable
              accessibilityLabel={`order-book-settings-open book-display-mode-${orderBookDisplayMode} ${selectedIdentityLabel}`}
              accessibilityState={{ expanded: orderBookSettingsVisible }}
              onPress={() => setOrderBookSettingsVisible((visible) => !visible)}
              style={[styles.orderBookClose, orderBookSettingsVisible && styles.orderBookSettingsButtonActive]}
              testID="order-book-settings-open"
            >
              <Ionicons name="options-outline" color="#f8fafc" size={22} />
            </Pressable>
            <Pressable accessibilityLabel="event-detail-order-book-close" onPress={() => setOrderBookVisible(false)} style={styles.orderBookClose} testID="event-detail-order-book-close">
              <Ionicons name="close" color="#f8fafc" size={22} />
            </Pressable>
          </View>
        </View>
        <View style={styles.orderBookSummary}>
          <Text style={styles.orderBookSummaryText}>{t.bestBid} {selectedBidPriceText} {selectedBidSizeText}</Text>
          <Text style={styles.orderBookSummaryText}>{t.bestAsk} {selectedAskPriceText} {selectedAskSizeText}</Text>
          <Text style={styles.orderBookSummaryText}>{t.spread} {selectedSpreadText}</Text>
        </View>
        {orderBookSettingsVisible && (
          <View
            accessibilityLabel={`order-book-settings-sheet book-display-mode-${orderBookDisplayMode} ${selectedIdentityLabel}`}
            style={styles.orderBookSettingsSheet}
            testID="order-book-settings-sheet"
          >
            <View style={styles.orderBookSettingsTextBlock}>
              <Text style={styles.orderBookSettingsTitle}>Book settings</Text>
              <Text style={styles.orderBookSettingsSubtitle}>Price display</Text>
            </View>
            <Pressable
              accessibilityLabel={`order-book-display-mode-toggle book-display-mode-${orderBookDisplayMode} decimalize-${orderBookDisplayMode === "decimal" ? "on" : "off"} selected-market-${orderBookMarket.id} selected-outcome-${orderBookSelectedOutcome.id} selected-side-${selectedContractSide}`}
              accessibilityRole="switch"
              accessibilityState={{ checked: orderBookDisplayMode === "decimal" }}
              onPress={() => setOrderBookDisplayMode((mode) => mode === "decimal" ? "cents" : "decimal")}
              style={[styles.orderBookDisplayToggle, orderBookDisplayMode === "decimal" && styles.orderBookDisplayToggleActive]}
              testID="order-book-display-mode-toggle"
            >
              <Text style={[styles.orderBookDisplayToggleText, orderBookDisplayMode === "decimal" && styles.orderBookDisplayToggleTextActive]}>{displayModeLabel}</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.orderBookSelectorWrap}>
          <Pressable
            accessibilityLabel={`order-book-grouped-market-selector order-book-market-selector-trigger ${groupNamesLabel} ${selectedIdentityLabel} ${label(locale, orderBookMarket)} ${orderBookSelectorVisible ? "selector-open" : "selector-closed"}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: orderBookSelectorVisible }}
            onPress={() => setOrderBookSelectorVisible((visible) => !visible)}
            style={[styles.orderBookSelectorTrigger, orderBookSelectorVisible && styles.orderBookSelectorTriggerActive]}
            testID="order-book-grouped-market-selector"
          >
            <View style={styles.orderBookSelectorMain}>
              <Text style={styles.orderBookSelectorFamily}>{selectedMarketFamily}</Text>
              <Text numberOfLines={1} style={styles.orderBookSelectorTitle}>{label(locale, orderBookMarket)}</Text>
              <Text style={styles.orderBookSelectorMeta}>{selectedTicketSelection.period ?? "full game"} - line {selectedTicketSelection.line ?? "none"} - {selectedTicketSelection.marketType}</Text>
            </View>
            <View style={styles.orderBookSelectorRight}>
              <Text style={styles.orderBookSelectorSide}>{selectedContractSide.toUpperCase()}</Text>
              <Ionicons name={orderBookSelectorVisible ? "chevron-up" : "chevron-down"} color="#dbeafe" size={20} />
            </View>
          </Pressable>
          {orderBookSelectorVisible && (
            <ScrollView
              accessibilityLabel={`order-book-market-selector-sheet ${selectedIdentityLabel} grouped-market-selector-sheet ${groupNamesLabel}`}
              style={styles.orderBookSelectorSheet}
              contentContainerStyle={styles.orderBookSelectorSheetContent}
              testID="order-book-market-selector-sheet"
            >
              {marketGroups.map((group) => (
                <View key={group.title} style={styles.orderBookMarketGroup}>
                  <Text style={styles.orderBookMarketGroupTitle}>{group.title}</Text>
                  {group.markets.map((market) => {
                    const isActive = market.id === orderBookMarket.id;
                    const marketType = orderBookMarketType(market);
                    const hasDepth = (market.orderbookDepth?.length ?? 0) > 0;
                    return (
                      <Pressable
                        accessibilityLabel={`order-book-market-choice-${market.id} ${group.title} ${label(locale, market)} ${isActive ? "selected-market-choice" : "inactive-market-choice"} market-type-${marketType} line-${market.line ?? "none"} period-${market.period ?? "none"} depth-${hasDepth ? "available" : "fallback"} selector-key-${orderBookSelectorKey(market)}`}
                        key={market.id}
                        onPress={() => selectOrderBookMarket(market)}
                        style={[styles.orderBookMarketChoice, isActive && styles.orderBookMarketChoiceActive]}
                        testID={`order-book-market-choice-${market.id}`}
                      >
                        <View style={styles.orderBookMarketChoiceTop}>
                          <Text numberOfLines={1} style={[styles.orderBookMarketChoiceText, isActive && styles.orderBookMarketChoiceTextActive]}>{label(locale, market)}</Text>
                          {isActive && <Ionicons name="checkmark-circle" color="#7dd3fc" size={16} />}
                        </View>
                        <Text style={[styles.orderBookMarketChoiceMeta, isActive && styles.orderBookMarketChoiceMetaActive]}>
                          {market.period ?? "full game"} - line {market.line ?? "none"} - {marketType}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
        <View accessibilityLabel="order-book-outcome-tabs Yes No" style={styles.orderBookOutcomeTabs} testID="order-book-outcome-tabs">
          {orderBookMarket.outcomes.map((outcome, index) => {
            const isActive = outcome.id === orderBookSelectedOutcome.id;
            const contractSide = orderBookOutcomeSide(orderBookMarket, outcome, index);
            const sideLabel = contractSide === "no" ? "No" : "Yes";
            return (
              <Pressable
                accessibilityLabel={`order-book-outcome-tab-${outcome.id} ${sideLabel} ${label(locale, outcome)} ${isActive ? `selected-side-${contractSide}` : `inactive-side-${contractSide}`} selected-market-${orderBookMarket.id}`}
                key={outcome.id}
                style={[styles.orderBookOutcomeTab, isActive && styles.orderBookOutcomeTabActive]}
                testID={`order-book-outcome-tab-${outcome.id}`}
                onPress={() => {
                  setOrderBookOutcomeId(outcome.id);
                  setStagedOrderBookLevel(null);
                }}
              >
                <Text style={[styles.orderBookOutcomeTabText, isActive && styles.orderBookOutcomeTabTextActive]}>{sideLabel}</Text>
                <Text numberOfLines={1} style={[styles.orderBookOutcomeTabMeta, isActive && styles.orderBookOutcomeTabMetaActive]}>{label(locale, outcome)}</Text>
              </Pressable>
            );
          })}
        </View>
        <View
          accessibilityLabel={`order-book-selected-contract ${selectedIdentityLabel} selected-contract-${selectedContractSide} ${selectedContractText} ${selectedLineText} ${selectedPeriodText} bid ${selectedBidPriceText} ask ${selectedAskPriceText} spread ${selectedSpreadText}`}
          style={styles.orderBookContractStrip}
          testID="order-book-selected-contract"
        >
          <View style={styles.orderBookContractTextBlock}>
            <Text style={styles.orderBookContractEyebrow}>{selectedMarketFamily} - {selectedPeriodText} - {selectedLineText}</Text>
            <Text style={styles.orderBookContractTitle}>{selectedContractText}</Text>
          </View>
          <View style={styles.orderBookQuoteRail}>
            <View style={styles.orderBookQuotePill}>
              <Text style={styles.orderBookQuoteLabel}>{t.bestBid}</Text>
              <Text style={styles.orderBookQuoteValue}>{selectedBidPriceText}</Text>
            </View>
            <View style={styles.orderBookQuotePill}>
              <Text style={styles.orderBookQuoteLabel}>{t.bestAsk}</Text>
              <Text style={styles.orderBookQuoteValue}>{selectedAskPriceText}</Text>
            </View>
          </View>
        </View>
        <View accessibilityLabel={`event-detail-order-book-depth-state orderbook-status-${depthRouteStatus} provider-lifecycle-${depthStatusBadge.lifecycle} provider-source-${depthStatusBadge.source} ${depthStateText}`} style={[styles.orderBookStatePill, depthStatusBadge.lifecycle === "not-ready" && styles.orderBookStatePillError, depthStatusBadge.lifecycle === "refresh-due" && styles.orderBookStatePillEmpty]} testID="event-detail-order-book-depth-state">
          <Ionicons
            name={providerLifecycleIcon[depthStatusBadge.lifecycle]}
            color={depthStatusBadge.lifecycle === "not-ready" ? "#f87171" : depthStatusBadge.lifecycle === "refresh-due" ? "#fbbf24" : "#7dd3fc"}
            size={14}
          />
          <Text style={[styles.orderBookStateText, depthStatusBadge.lifecycle === "not-ready" && styles.orderBookStateTextError, depthStatusBadge.lifecycle === "refresh-due" && styles.orderBookStateTextEmpty]}>{depthStateText}</Text>
        </View>
        <View
          accessibilityLabel={`event-detail-order-book-availability orderbook-availability-${orderbookAvailabilityStatus} provider-lifecycle-${orderbookAvailabilityBadge.lifecycle} orderbook-availability-source-${orderbookAvailabilityBadge.source} ${orderbookAvailabilityText}`}
          style={[styles.orderBookAvailabilityPill, orderbookAvailabilityBadge.lifecycle === "refresh-due" && styles.orderBookAvailabilityPillWarning, orderbookAvailabilityBadge.lifecycle === "not-ready" && styles.orderBookAvailabilityPillSuspended]}
          testID="event-detail-order-book-availability"
        >
          <Ionicons
            name={providerLifecycleIcon[orderbookAvailabilityBadge.lifecycle]}
            color={orderbookAvailabilityBadge.lifecycle === "ready" ? "#7dd3fc" : orderbookAvailabilityBadge.lifecycle === "not-ready" ? "#f87171" : "#fbbf24"}
            size={14}
          />
          <Text style={[styles.orderBookAvailabilityText, orderbookAvailabilityBadge.lifecycle !== "ready" && styles.orderBookAvailabilityTextWarning]}>{orderbookAvailabilityText}</Text>
        </View>
        <ScrollView style={styles.orderBookScroll} contentContainerStyle={styles.orderBookPad}>
          <View
            accessibilityLabel={`order-book-outcome-${orderBookSelectedOutcome.id} ${selectedIdentityLabel} book-display-mode-${orderBookDisplayMode} ${depthSourceLabel} ${bidLevels.length} bid-levels ${askLevels.length} ask-levels bid-side-label ask-side-label best-bid-${bestBid ? levelProbability(bestBid.price) : "none"} best-ask-${bestAsk ? levelProbability(bestAsk.price) : "none"} Price Shares Value ${bestBid ? formatLevelPrice(bestBid.price) : ""} ${bestAsk ? formatLevelPrice(bestAsk.price) : ""} ${formatSize(bidLevels.reduce((total, level) => total + level.shares, 0))} shares ${formatSize(askLevels.reduce((total, level) => total + level.shares, 0))} shares`}
            style={styles.orderBookOutcome}
            testID={`order-book-outcome-${orderBookSelectedOutcome.id}`}
          >
            <View style={styles.orderBookOutcomeTop}>
              <View style={styles.orderBookSelectedText}>
                <Text style={styles.orderBookOutcomeTitle}>{label(locale, orderBookSelectedOutcome)}</Text>
                <Text style={styles.orderBookOutcomeMeta}>{orderBookSelectedOutcome.probability}% - {outcomeOdds(orderBookSelectedOutcome)}x</Text>
              </View>
              <View style={styles.orderBookActionColumn}>
                <Text
                  accessibilityLabel={`order-book-ticket-handoff-status provider-lifecycle-${orderbookAvailabilityBadge.lifecycle} provider-source-${orderbookAvailabilityBadge.source} ${orderbookAvailabilityText}`}
                  style={[styles.orderBookTicketHandoff, orderbookAvailabilityBadge.lifecycle !== "ready" && styles.orderBookTicketHandoffWarning]}
                  testID="order-book-ticket-handoff-status"
                >
                  Ticket {providerLifecycleText[orderbookAvailabilityBadge.lifecycle].toLowerCase()}
                </Text>
                <View style={styles.orderBookActionRow}>
                  <Pressable
                    accessibilityLabel={`order-book-buy-${orderBookSelectedOutcome.id} provider-lifecycle-${orderbookAvailabilityBadge.lifecycle} staged-level-${activeStagedLevel ? `${activeStagedLevel.side}-${levelProbability(activeStagedLevel.price)}` : "none"} ${selectedIdentityLabel}`}
                    onPress={() => openBookTicket("buy")}
                    style={[styles.orderBookTradeButton, { backgroundColor: orderBookSelectedOutcome.color }, activeStagedLevel?.side === "ask" && styles.orderBookTradeButtonStaged]}
                    testID={`order-book-buy-${orderBookSelectedOutcome.id}`}
                  >
                    <Text style={styles.orderBookTradeText}>{t.buy}</Text>
                    <Text style={styles.orderBookTradeSubtext}>{activeStagedLevel?.side === "ask" && stagedPriceText ? stagedPriceText : selectedContractSide.toUpperCase()}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`order-book-sell-${orderBookSelectedOutcome.id} provider-lifecycle-${orderbookAvailabilityBadge.lifecycle} staged-level-${activeStagedLevel ? `${activeStagedLevel.side}-${levelProbability(activeStagedLevel.price)}` : "none"} ${selectedIdentityLabel}`}
                    onPress={() => openBookTicket("sell")}
                    style={[styles.orderBookSellButton, activeStagedLevel?.side === "bid" && styles.orderBookSellButtonStaged]}
                    testID={`order-book-sell-${orderBookSelectedOutcome.id}`}
                  >
                    <Text style={styles.orderBookSellText}>{t.sell}</Text>
                    <Text style={styles.orderBookTradeSubtext}>{activeStagedLevel?.side === "bid" && stagedPriceText ? stagedPriceText : selectedContractSide.toUpperCase()}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            <View
              accessibilityLabel={`order-book-staged-order staged-level-${activeStagedLevel ? `${activeStagedLevel.side}-${levelProbability(activeStagedLevel.price)}` : "none"} staged-ticket-side-${activeStagedLevel ? stagedTicketSide : "none"} staged-price-${stagedDecimalPriceText ?? "none"} staged-shares-${activeStagedLevel ? formatSize(activeStagedLevel.shares) : "none"} ${activeStagedLevel ? `${stagedTicketSide === "buy" ? "Buy ask" : "Sell bid"} ${stagedPriceText} ${formatSize(activeStagedLevel.shares)} shares` : "Tap a ladder price to stage an order"}`}
              style={[styles.orderBookStagedOrder, activeStagedLevel && styles.orderBookStagedOrderActive]}
              testID="order-book-staged-order"
            >
              <View style={styles.orderBookStagedTextBlock}>
                <Text style={styles.orderBookStagedLabel}>{activeStagedLevel ? (stagedTicketSide === "buy" ? "Buy ask" : "Sell bid") : "Tap ladder to stage"}</Text>
                <Text style={styles.orderBookStagedValue}>{activeStagedLevel && stagedPriceText ? `${stagedPriceText} - ${formatSize(activeStagedLevel.shares)} shares` : "Pick an ask or bid level"}</Text>
              </View>
              <Pressable
                accessibilityLabel={`order-book-staged-open-ticket staged-ticket-side-${activeStagedLevel ? stagedTicketSide : "none"} staged-price-${stagedDecimalPriceText ?? "none"} ${selectedIdentityLabel}`}
                disabled={!activeStagedLevel}
                onPress={() => openBookTicket(stagedTicketSide)}
                style={[styles.orderBookStagedButton, !activeStagedLevel && styles.orderBookStagedButtonDisabled]}
                testID="order-book-staged-open-ticket"
              >
                <Text style={[styles.orderBookStagedButtonText, !activeStagedLevel && styles.orderBookStagedButtonTextDisabled]}>{activeStagedLevel ? (stagedTicketSide === "buy" ? t.buy : t.sell) : "Stage"}</Text>
              </Pressable>
            </View>
            <View accessibilityLabel={`order-book-ladder Price Shares Value book-display-mode-${orderBookDisplayMode}`} style={styles.orderBookLadder} testID="order-book-ladder">
              <View style={styles.orderBookLadderHeader}>
                <Text style={styles.orderBookLadderHeaderText}>{priceHeaderLabel}</Text>
                <Text style={styles.orderBookLadderHeaderText}>Shares</Text>
                <Text style={styles.orderBookLadderHeaderText}>Value</Text>
              </View>
              {visibleAsks.map((level, index) => (
                <Pressable
                  accessibilityLabel={`order-book-ask-level-${orderBookSelectedOutcome.id}-${index + 1} ask-side-label tap-to-stage-buy book-display-mode-${orderBookDisplayMode} ${activeStagedLevel?.side === "ask" && activeStagedLevel.price === level.price ? "staged-level-selected" : "staged-level-inactive"} ${formatLevelCents(level.price)} ${formatLevelPrice(level.price)} ${formatSize(level.shares)} shares ${formatBookValue(level.total)}`}
                  key={`ask-${orderBookSelectedOutcome.id}-${level.price}-${index}`}
                  onPress={() => stageLevel(level)}
                  style={[styles.orderBookLadderRow, styles.orderBookAskRow, activeStagedLevel?.side === "ask" && activeStagedLevel.price === level.price && styles.orderBookLadderRowSelected]}
                  testID={`order-book-ask-level-${orderBookSelectedOutcome.id}-${index + 1}`}
                >
                  <View style={styles.orderBookLadderBarTrack}>
                    <View style={[styles.orderBookAskBar, { width: `${Math.max(10, (level.shares / largest) * 100)}%` }]} />
                  </View>
                  <Text style={[styles.orderBookLadderPrice, styles.orderBookAskPrice]}>{formatBookDisplayPrice(level.price, orderBookDisplayMode)}</Text>
                  <Text style={styles.orderBookLadderCell}>{formatSize(level.shares)}</Text>
                  <Text style={styles.orderBookLadderValue}>{formatBookValue(level.total)}</Text>
                </Pressable>
              ))}
              <View accessibilityLabel={`order-book-spread-separator Spread ${spreadCents ?? "unknown"}c`} style={styles.orderBookSpreadSeparator} testID="order-book-spread-separator">
                <View style={styles.orderBookSpreadLine} />
                <Text style={styles.orderBookSpreadText}>Spread {spreadCents ?? "-"}c</Text>
                <View style={styles.orderBookSpreadLine} />
              </View>
              {visibleBids.map((level, index) => (
                <Pressable
                  accessibilityLabel={`order-book-bid-level-${orderBookSelectedOutcome.id}-${index + 1} bid-side-label tap-to-stage-sell book-display-mode-${orderBookDisplayMode} ${activeStagedLevel?.side === "bid" && activeStagedLevel.price === level.price ? "staged-level-selected" : "staged-level-inactive"} ${formatLevelCents(level.price)} ${formatLevelPrice(level.price)} ${formatSize(level.shares)} shares ${formatBookValue(level.total)}`}
                  key={`bid-${orderBookSelectedOutcome.id}-${level.price}-${index}`}
                  onPress={() => stageLevel(level)}
                  style={[styles.orderBookLadderRow, styles.orderBookBidRow, activeStagedLevel?.side === "bid" && activeStagedLevel.price === level.price && styles.orderBookLadderRowSelected]}
                  testID={`order-book-bid-level-${orderBookSelectedOutcome.id}-${index + 1}`}
                >
                  <View style={styles.orderBookLadderBarTrack}>
                    <View style={[styles.orderBookBidBar, { width: `${Math.max(10, (level.shares / largest) * 100)}%` }]} />
                  </View>
                  <Text style={[styles.orderBookLadderPrice, styles.orderBookBidPrice]}>{formatBookDisplayPrice(level.price, orderBookDisplayMode)}</Text>
                  <Text style={styles.orderBookLadderCell}>{formatSize(level.shares)}</Text>
                  <Text style={styles.orderBookLadderValue}>{formatBookValue(level.total)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };
  const renderParityOutcomeRow = (outcome: DisplayOutcome, marketId: string, matchingOutcome?: Outcome, groupMarket?: Market) => {
    const ticketSelection = ticketSelectionFromBackendMarket(outcome.ticketSelection, groupMarket, matchingOutcome);
    const ticketTarget = resolveLineTicketTarget({
      selection: ticketSelection,
      backendMarket: groupMarket,
      backendOutcome: matchingOutcome,
      syntheticOutcome: outcome.ticketOutcome ?? matchingOutcome,
      syntheticMarkets: {
        spread: spreadMarket,
        totals: totalsMarket,
        teamTotal: backendTeamTotalMarket ?? teamTotalMarket,
      },
      fallbackMarket: groupMarket ?? primaryMarket,
    });
    return (
    <View key={outcome.id} style={styles.parityOutcomeRow}>
      <View style={styles.parityOutcomeIcon}>
        <Text style={styles.parityOutcomeIconText}>{outcome.icon}</Text>
      </View>
      <View style={styles.parityOutcomeTextBlock}>
        <Text style={styles.teamName}>{outcome.label}</Text>
        <View style={styles.miniLineTrack}>
          <View style={[styles.miniLineFill, { backgroundColor: outcome.color, width: `${Math.min(100, Math.max(12, outcome.miniLine ?? outcome.probability))}%` }]} />
        </View>
      </View>
      <Text style={styles.oddsMultiplier}>{outcome.odds}</Text>
      <Pressable
        accessibilityLabel={`event-detail-outcome-${marketId}-${outcome.id} ticket-source-${ticketTarget?.source ?? "unavailable"} ticket-market-${ticketTarget?.market.id ?? "none"} ticket-outcome-${ticketTarget?.outcome.id ?? "none"} ${ticketSelectionIdentityLabel(ticketSelection)} ${providerIdentityLabel(ticketTarget?.market ?? groupMarket, ticketTarget?.outcome ?? outcome.ticketOutcome ?? matchingOutcome)}`}
        onPress={() => {
          if (!ticketTarget) return;
          openTicket(ticketTarget.market, ticketTarget.outcome, event, defaultSide, ticketSelection);
        }}
        style={[styles.parityProbButton, { backgroundColor: outcome.color }]}
        testID={`event-detail-outcome-${marketId}-${outcome.id}`}
      >
        <Text style={styles.parityProbText}>{outcome.probability}%</Text>
      </Pressable>
    </View>
    );
  };
  const marketAvailabilityLabel = (market?: Market) => {
    const status = market?.availability?.status;
    if (status === "ready") return "Market live";
    if (status === "stale") return "Market stale";
    if (status === "suspended") return "Market suspended";
    if (status === "delayed") return "Market delayed";
    if (status === "unavailable") return "Market unavailable";
    return null;
  };
  const marketDepthBatchLabel = (market?: Market) =>
    (market?.orderbookDepth?.length ?? 0) > 0 ? "Route depth" : null;
  const providerIdentityLabel = (market?: Market, outcome?: Outcome) =>
    [
      market?.referenceSource ? `provider-source-${market.referenceSource}` : null,
      market?.externalMarketId ? `provider-market-${market.externalMarketId}` : null,
      market?.conditionId ? `provider-condition-${market.conditionId}` : null,
      outcome?.referenceTokenId ? `provider-token-${outcome.referenceTokenId}` : null,
      outcome?.referenceOutcomeLabel ? `provider-outcome-${outcome.referenceOutcomeLabel}` : null,
    ].filter(Boolean).join(" ");
  const renderGroup = (group: GameLineGroup) => (
    <View key={group.id} style={styles.marketBlock}>
      <Pressable
        accessibilityLabel={`event-detail-market-toggle-${group.id} ${group.title} ${group.subtitle ?? ""} market-availability-${group.backendMarket?.availability?.status ?? "unknown"} market-depth-${marketDepthBatchLabel(group.backendMarket) ? "batched" : "empty"} ${providerIdentityLabel(group.backendMarket)}`}
        onPress={() => toggleGroup(group.id)}
        style={styles.marketHeaderRow}
        testID={`event-detail-market-toggle-${group.id}`}
      >
        <View style={styles.marketTitleBlock}>
          <Text style={styles.marketTitle}>{group.title}</Text>
          {group.subtitle && <Text style={styles.marketSubcopy}>{group.subtitle}</Text>}
        </View>
        <View style={styles.headerRightCluster}>
          {group.backendMarket?.availability && (
            <View
              accessibilityLabel={`event-detail-market-availability-${group.id} market-availability-${group.backendMarket.availability.status} market-status-${group.backendMarket.availability.marketStatus ?? "unknown"} ${marketAvailabilityLabel(group.backendMarket) ?? ""}`}
              style={[styles.marketAvailabilityPill, group.backendMarket.availability.status !== "ready" && styles.marketAvailabilityPillWarning, group.backendMarket.availability.status === "suspended" && styles.marketAvailabilityPillSuspended]}
              testID={`event-detail-market-availability-${group.id}`}
            >
              <Text style={[styles.marketAvailabilityText, group.backendMarket.availability.status !== "ready" && styles.marketAvailabilityTextWarning]}>{marketAvailabilityLabel(group.backendMarket)}</Text>
            </View>
          )}
          {showOrderBookDebug && marketDepthBatchLabel(group.backendMarket) && (
            <View
              accessibilityLabel={`event-detail-market-depth-${group.id} market-depth-batched ${group.backendMarket?.orderbookDepth?.length ?? 0} levels Route depth`}
              style={styles.marketDepthPill}
              testID={`event-detail-market-depth-${group.id}`}
            >
              <Text style={styles.marketDepthText}>Route depth</Text>
            </View>
          )}
          {showOrderBookDebug && group.backendMarket && (
            <Pressable
              accessibilityLabel={`event-detail-open-order-book-${group.id} ${group.backendMarket.id} market-availability-${group.backendMarket.availability?.status ?? "unknown"} ${providerIdentityLabel(group.backendMarket)}`}
              onPress={() => openOrderBookForMarket(group.backendMarket!)}
              style={styles.depthBookButton}
              testID={`event-detail-open-order-book-${group.id}`}
            >
              <Ionicons name="book-outline" color="#dbeafe" size={14} />
              <Text style={styles.depthBookText}>Book</Text>
            </Pressable>
          )}
          {group.lineValue && (
            <View style={styles.lineValuePill}>
              <Text style={styles.lineValueText}>{group.lineValue}</Text>
              <Ionicons name="chevron-down" color="#86efac" size={16} />
            </View>
          )}
          <Ionicons name={expandedMarketIds[group.id] ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
        </View>
      </Pressable>
      {expandedMarketIds[group.id] && (
        <>
          {group.selectedPeriod && group.onSelectPeriod && (
            <View style={styles.subSegmentRow}>
              {linePeriods.map((period) => (
                <Pressable
                  accessibilityLabel={`event-detail-${group.id}-period-${period} chart-contract-${group.id} ${group.selectedPeriod === period ? "selected-line-period" : "inactive-line-period"}`}
                  key={period}
                  onPress={() => {
                    if (group.id === "totals") setSelectedChartContract("totals");
                    group.onSelectPeriod?.(period);
                  }}
                  style={[styles.subSegment, group.selectedPeriod === period && styles.subSegmentActive]}
                  testID={`event-detail-${group.id}-period-${period.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()}`}
                >
                  <Text style={[styles.subSegmentText, group.selectedPeriod === period && styles.subSegmentTextActive]}>{period}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {group.lineOptions && group.onSelectLine && (
            <View style={styles.lineRailRow}>
              {group.lineOptions.map((line) => (
                <Pressable
                  accessibilityLabel={`event-detail-${group.id}-line-${line} chart-contract-${group.id} ${group.lineValue === line ? "selected-line-value" : "inactive-line-value"}`}
                  key={line}
                  onPress={() => {
                    if (group.id === "totals") setSelectedChartContract("totals");
                    group.onSelectLine?.(line);
                  }}
                  style={[styles.lineRailOption, group.lineValue === line && styles.lineRailOptionActive]}
                  testID={`event-detail-${group.id}-line-${line.replace(".", "-")}`}
                >
                  <Text style={[styles.lineRailText, group.lineValue === line && styles.lineRailTextActive]}>{line}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {group.rows.map((outcome, index) => renderParityOutcomeRow(outcome, group.id, group.backendMarket?.outcomes[index], group.backendMarket))}
        </>
      )}
    </View>
  );
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="event-detail-back" onPress={goBack} style={styles.iconButton} testID="event-detail-back">
          <Ionicons name="chevron-back" size={26} color="#f8fafc" />
        </Pressable>
        <View style={styles.segmentedControl}>
          <Pressable
            accessibilityLabel="event-detail-tab-game"
            onPress={() => setActiveHeaderTab("game")}
            style={[styles.segment, activeHeaderTab === "game" && styles.segmentActive]}
            testID="event-detail-tab-game"
          >
            <Text style={[styles.segmentText, activeHeaderTab === "game" && styles.segmentTextActive]}>Game</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="event-detail-tab-chat"
            onPress={() => setActiveHeaderTab("chat")}
            style={[styles.segment, activeHeaderTab === "chat" && styles.segmentActive]}
            testID="event-detail-tab-chat"
          >
            <Text style={[styles.segmentText, activeHeaderTab === "chat" && styles.segmentTextActive]}>Chat</Text>
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>380</Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.topActions}>
          {showOrderBookDebug && (
            <Pressable
              accessibilityLabel="event-detail-top-order-book"
              onPress={() => {
                setOrderBookVisible(true);
                setShareSheetVisible(false);
              }}
              style={styles.iconButton}
              testID="event-detail-top-order-book"
            >
              <Ionicons name="book-outline" size={22} color="#f8fafc" />
            </Pressable>
          )}
          <Pressable
            accessibilityLabel="event-detail-share"
            onPress={() => {
              setShareSheetVisible(true);
              setSavedNoticeVisible(false);
            }}
            style={styles.iconButton}
            testID="event-detail-share"
          >
            <Ionicons name="share-outline" size={23} color="#f8fafc" />
          </Pressable>
        </View>
      </View>
      {savedNoticeVisible && (
        <Pressable accessibilityLabel="event-detail-save-notice" onPress={() => setSavedNoticeVisible(false)} style={styles.actionNotice} testID="event-detail-save-notice">
          <Ionicons name={isSaved ? "book" : "book-outline"} size={18} color="#bfdbfe" />
          <Text style={styles.actionNoticeText}>{isSaved ? "Saved to watchlist" : "Removed from watchlist"}</Text>
          <Text style={styles.actionNoticeDismiss}>Dismiss</Text>
        </Pressable>
      )}
      {shareSheetVisible && (
        <View accessibilityLabel="event-detail-share-sheet" style={styles.shareSheet} testID="event-detail-share-sheet">
          <View style={styles.shareSheetHeader}>
            <View>
              <Text style={styles.shareSheetTitle}>Share this market</Text>
              <Text style={styles.shareSheetSub}>{label(locale, event)}</Text>
            </View>
            <Pressable accessibilityLabel="event-detail-share-dismiss" onPress={() => setShareSheetVisible(false)} style={styles.shareDismissButton} testID="event-detail-share-dismiss">
              <Ionicons name="close" size={20} color="#f8fafc" />
            </Pressable>
          </View>
          <View style={styles.shareActionsRow}>
            {["Copy link", "Share to chat", "Invite"].map((item) => (
              <Pressable accessibilityLabel={`event-detail-share-action-${item}`} key={item} style={styles.shareActionButton} testID={`event-detail-share-action-${item.replace(/\s+/g, "-").toLowerCase()}`}>
                <Text style={styles.shareActionText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {showOrderBookDebug && orderBookVisible && renderOrderBook()}
      {compactHeaderVisible && activeHeaderTab === "game" && (
        <View accessibilityLabel="event-detail-sticky-market-shell" style={styles.stickyMarketShell} testID="event-detail-sticky-market-shell">
          <View
            accessibilityLabel={`event-detail-compact-game-header ${teamA ? teamCode(teamA.name) : ""} ${leftOutcome?.probability ?? 0}% ${event.startsAt} ${teamB ? teamCode(teamB.name) : ""} ${rightOutcome?.probability ?? 0}% Game Lines Player Props`}
            style={styles.compactGameHeader}
            testID="event-detail-compact-game-header"
          >
            <View style={styles.compactTeamSide}>
              <Text style={styles.compactFlag}>{teamA?.flag ?? ""}</Text>
              <View>
                <Text style={styles.compactTeamCode}>{teamA ? teamCode(teamA.name) : ""}</Text>
                <Text style={[styles.compactProbability, { color: leftOutcome?.color ?? "#22c55e" }]}>{leftOutcome?.probability ?? 0}%</Text>
              </View>
            </View>
            <View style={styles.compactMatchCenter}>
              <Text style={styles.compactDate}>{event.startsAt.split(" ")[0] === "Today" ? "Today" : event.startsAt}</Text>
              <Text style={styles.compactTime}>{event.status === "live" ? liveClock : event.startsAt.replace(/^Today\s*/, "")}</Text>
            </View>
            <View style={[styles.compactTeamSide, styles.compactTeamRight]}>
              <View style={styles.compactRightText}>
                <Text style={styles.compactTeamCode}>{teamB ? teamCode(teamB.name) : ""}</Text>
                <Text style={[styles.compactProbability, { color: rightOutcome?.color ?? "#ef4444" }]}>{rightOutcome?.probability ?? 0}%</Text>
              </View>
              <Text style={styles.compactFlag}>{teamB?.flag ?? ""}</Text>
            </View>
          </View>
          {renderMarketTabs("sticky")}
        </View>
      )}

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={80}
        style={styles.scroller}
        contentContainerStyle={styles.scrollPad}
      >
        <View accessibilityLabel="event-detail-legacy-summary" style={styles.legacySummary} testID="event-detail-legacy-summary">
          <Text style={styles.legacySummaryText}>{label(locale, event)}</Text>
          <Text style={styles.legacySummaryText}>{stats.marketCount} {t.marketCount}</Text>
          <Text style={styles.legacySummaryText}>{stats.outcomeCount} {t.outcomeCount}</Text>
          <Text style={styles.legacySummaryText}>{t.markets}</Text>
        </View>
        <View
          accessibilityLabel={`event-detail-summary event-detail-stats event-detail-market-summary ${label(locale, event)} ${stats.marketCount} ${t.marketCount} ${stats.outcomeCount} ${t.outcomeCount} Game lines ${gameLineMarkets.length === 1 ? "1 market" : `${gameLineMarkets.length} ${t.marketCount}`} Props ${propMarkets.length} ${t.marketCount} ${primaryMarket ? label(locale, primaryMarket) : ""} ${t.markets} ${t.volume} ${stats.volume} ${t.liquidity} ${stats.liquidity} ${t.traders} ${stats.traders} ${t.bestBid} ${t.bestAsk} ${t.spread}`}
          style={styles.matchHeader}
          testID="event-detail-summary"
        >
          <View style={styles.teamSide}>
            <Text style={styles.flag}>{teamA?.flag ?? ""}</Text>
            <View>
              <Text style={styles.teamCode}>{teamA ? teamCode(teamA.name) : ""}</Text>
              <Text style={[styles.teamProbability, { color: leftOutcome?.color ?? "#22c55e" }]}>{leftOutcome?.probability ?? 0}%</Text>
            </View>
          </View>
          <View style={styles.matchTime}>
            <Text style={styles.matchDate}>{event.startsAt.split(" ")[0] === "Today" ? "Today" : event.status === "live" ? "Live" : event.startsAt}</Text>
            <Text style={styles.scoreText}>{scoreboard}</Text>
            <Text style={styles.liveClock}>{liveClock}</Text>
          </View>
          <View style={[styles.teamSide, styles.teamSideRight]}>
            <View style={styles.rightTeamText}>
              <Text style={styles.teamCode}>{teamB ? teamCode(teamB.name) : ""}</Text>
              <Text style={[styles.teamProbability, { color: rightOutcome?.color ?? "#ef4444" }]}>{rightOutcome?.probability ?? 0}%</Text>
            </View>
            <Text style={styles.flag}>{teamB?.flag ?? ""}</Text>
          </View>
        </View>

        {activeHeaderTab === "chat" ? (
          <View accessibilityLabel="event-detail-chat-page" style={styles.chatPage} testID="event-detail-chat-page">
            <View style={styles.chatContextCard}>
              <Text style={styles.chatContextTitle}>{label(locale, event)}</Text>
              <Text style={styles.chatContextMeta}>
                {teamA ? teamCode(teamA.name) : ""} {leftOutcome?.probability ?? 0}% - {teamB ? teamCode(teamB.name) : ""} {rightOutcome?.probability ?? 0}% - {scoreboard} - {liveClock}
              </Text>
            </View>
            <View accessibilityLabel="event-detail-chat-feed" style={styles.chatFeed} testID="event-detail-chat-feed">
              {[
                { user: "gigglyeel0550", badge: "BTTS $36", text: "VAMOS", color: "#be18ff" },
                { user: "mktmaker21", badge: `${teamCode(teamA?.name ?? "MEX")} ${leftOutcome?.probability ?? 0}%`, text: "Pressure is all on the left side.", color: "#22c55e" },
                { user: "linewatcher", badge: "O2.5 $18", text: "Totals moving after that last attack.", color: "#38bdf8" },
                { user: "goalrush", badge: `${teamCode(teamB?.name ?? "ECU")} ${rightOutcome?.probability ?? 0}%`, text: "Counter still looks live.", color: "#f59e0b" },
              ].map((message) => (
                <View accessibilityLabel={`event-detail-chat-message-${message.user}`} key={message.user} style={styles.chatMessageRow} testID={`event-detail-chat-message-${message.user}`}>
                  <View style={[styles.chatAvatar, { backgroundColor: message.color }]} />
                  <View style={styles.chatMessageBubble}>
                    <View style={styles.chatMessageMetaRow}>
                      <Text style={styles.chatMessageUser}>{message.user}</Text>
                      <Text style={styles.chatMessageBadge}>{message.badge}</Text>
                    </View>
                    <Text style={styles.chatMessageText}>{message.text}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View accessibilityLabel="event-detail-chat-typing" style={styles.typingRow} testID="event-detail-chat-typing">
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
              <Text style={styles.typingText}>3 traders typing</Text>
            </View>
            <View accessibilityLabel="event-detail-chat-reactions" style={styles.reactionRow} testID="event-detail-chat-reactions">
              {["Vamos", "Goal", "Hold", "Cash out"].map((reaction) => (
                <Pressable accessibilityLabel={`event-detail-chat-reaction-${reaction}`} key={reaction} style={styles.reactionChip} testID={`event-detail-chat-reaction-${reaction.replace(/\s+/g, "-").toLowerCase()}`}>
                  <Text style={styles.reactionText}>{reaction}</Text>
                </Pressable>
              ))}
            </View>
            <View accessibilityLabel="event-detail-chat-input" style={styles.chatInputRow} testID="event-detail-chat-input">
              <Ionicons name="happy-outline" color="#cbd5e1" size={22} />
              <Text style={styles.chatInputPlaceholder}>Message this market</Text>
              <Ionicons name="send-outline" color="#94a3b8" size={20} />
            </View>
            <View accessibilityLabel="event-detail-chat-emoji-picker" style={styles.emojiPicker} testID="event-detail-chat-emoji-picker">
              {["+", "%", "!", "?"].map((item) => (
                <Text key={item} style={styles.emojiText}>{item}</Text>
              ))}
            </View>
            <View accessibilityLabel="event-detail-chat-sticky-outcomes" style={styles.chatStickyOutcomes} testID="event-detail-chat-sticky-outcomes">
              {primaryOutcomes.map((outcome) => (
                <Pressable
                  accessibilityLabel={`event-detail-chat-sticky-outcome-${primaryMarket.id}-${outcome.id}`}
                  key={outcome.id}
                  onPress={() => openPrimaryOutcomeTicket(outcome)}
                  style={[styles.chatStickyButton, { backgroundColor: outcome.color }, selectedPrimaryOutcome?.id === outcome.id && styles.chatStickyButtonSelected]}
                  testID={`event-detail-chat-sticky-outcome-${primaryMarket.id}-${outcome.id}`}
                >
                  <Text style={styles.chatStickyButtonText}>{teamCode(outcome.label)} {outcome.probability}%</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <>
        <View accessibilityLabel="event-detail-body-switch" style={styles.bodySwitchSection} testID="event-detail-body-switch">
          <View style={styles.bodySwitchMeta}>
            <Text style={styles.bodySwitchVolume}>{stats.volume} Vol.</Text>
            <Text style={styles.bodySwitchSource}>{isLiveEvent ? "Live World Cup" : "Holiwyn"}</Text>
            {liveDataStatus && (
              <Text
                accessibilityLabel={`event-detail-live-data-inline live-data-status-${liveDataState} provider-lifecycle-${liveDataBadge.lifecycle} live-data-source-${liveDataBadge.source} ${liveDataText}`}
                style={[styles.bodySwitchFreshness, liveDataState !== "ready" && styles.bodySwitchFreshnessWarning]}
                testID="event-detail-live-data-inline"
              >
                {liveDataText} · {liveDataMeta}
              </Text>
            )}
          </View>
          <View style={styles.bodySwitchTabs}>
            <Pressable
              accessibilityLabel="event-detail-body-tab-market"
              onPress={() => setActiveBodyTab("market")}
              style={[styles.bodySwitchTab, activeBodyTab === "market" && styles.bodySwitchTabActive]}
              testID="event-detail-body-tab-market"
            >
              <Ionicons name="analytics-outline" color={activeBodyTab === "market" ? "#38bdf8" : "#8b93a3"} size={18} />
              <Text style={[styles.bodySwitchTabText, activeBodyTab === "market" && styles.bodySwitchTabTextActive]}>Market</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="event-detail-body-tab-live-stats"
              onPress={() => setActiveBodyTab("live-stats")}
              style={[styles.bodySwitchTab, activeBodyTab === "live-stats" && styles.bodySwitchTabActive]}
              testID="event-detail-body-tab-live-stats"
            >
              <Ionicons name="bar-chart-outline" color={activeBodyTab === "live-stats" ? "#38bdf8" : "#8b93a3"} size={18} />
              <Text style={[styles.bodySwitchTabText, activeBodyTab === "live-stats" && styles.bodySwitchTabTextActive]}>Live stats</Text>
            </Pressable>
          </View>
        </View>

        {activeBodyTab === "live-stats" ? (
          <View accessibilityLabel="event-detail-live-stats-panel" style={styles.liveStatsPanel} testID="event-detail-live-stats-panel">
            <View style={styles.liveStatsHeader}>
              <Text style={styles.liveStatsTitle}>Live stats</Text>
              <View
                accessibilityLabel={`event-detail-live-data-status live-data-status-${liveDataState} provider-lifecycle-${liveDataBadge.lifecycle} live-data-source-${liveDataBadge.source} live-data-stale-after-${liveDataStatus?.staleAfterSeconds ?? "none"} ${liveDataText} ${liveDataMeta}`}
                style={[styles.liveDataPill, liveDataBadge.lifecycle === "refresh-due" && styles.liveDataPillWarning, liveDataBadge.lifecycle === "not-ready" && styles.liveDataPillSuspended]}
                testID="event-detail-live-data-status"
              >
                <Text style={[styles.liveDataText, liveDataBadge.lifecycle !== "ready" && styles.liveDataTextWarning]}>{event.status === "live" ? liveDataText : "Pregame preview"}</Text>
                <Text style={styles.liveDataMeta}>{liveDataMeta}</Text>
              </View>
            </View>
            {liveStatRows.map((row) => (
              <View accessibilityLabel={`event-detail-live-stat-${row.label}`} key={row.label} style={styles.liveStatRow} testID={`event-detail-live-stat-${row.label.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()}`}>
                <Text style={styles.liveStatValue}>{row.home}</Text>
                <View style={styles.liveStatMiddle}>
                  <Text style={styles.liveStatLabel}>{row.label}</Text>
                  <View style={styles.liveStatTrack}>
                    <View style={styles.liveStatFill} />
                  </View>
                </View>
                <Text style={styles.liveStatValue}>{row.away}</Text>
              </View>
            ))}
            <View accessibilityLabel="event-detail-live-stats-timeline" style={styles.liveStatsTimeline} testID="event-detail-live-stats-timeline">
              <Text style={styles.liveStatsTimelineTitle}>Match flow</Text>
              {["12' USA pressure", "28' Belgium counter", "41' Corner USA"].map((item) => (
                <Text key={item} style={styles.liveStatsTimelineText}>{item}</Text>
              ))}
            </View>
          </View>
        ) : (
          <>
        {isLiveEvent && (
          <View accessibilityLabel="event-detail-live-match-strip" style={styles.liveMatchStrip} testID="event-detail-live-match-strip">
            <View>
              <Text style={styles.liveStripLabel}>LIVE WORLD CUP</Text>
              <Text style={styles.liveStripScore}>{scoreboard} · {liveClock}</Text>
              <Text
                accessibilityLabel={`event-detail-live-data-inline live-data-status-${liveDataState} provider-lifecycle-${liveDataBadge.lifecycle} live-data-source-${liveDataBadge.source} ${liveDataText}`}
                style={[styles.liveStripFreshness, liveDataState !== "ready" && styles.liveStripFreshnessWarning]}
                testID="event-detail-live-data-inline"
              >
                {liveDataText} · {liveDataMeta}
              </Text>
            </View>
            <View style={styles.liveStripPriceRow}>
              {primaryOutcomes.map((outcome) => (
                <Text key={outcome.id} style={[styles.liveStripPrice, { color: outcome.color }]}>
                  {teamCode(outcome.label)} {outcome.probability}%
                </Text>
              ))}
            </View>
          </View>
        )}
        <View
          accessibilityLabel={`event-detail-price-chart chart-source-${event.chartHistorySource ?? "fallback"} chart-status-${chartRouteStatus} provider-lifecycle-${chartStatusBadge.lifecycle} chart-range-${event.chartHistoryRange ?? "none"} chart-empty-${event.chartHistoryEmptyState ?? "none"} chart-filter-${chartFilter} chart-selected-point-${selectedChartPoint} chart-selected-contract-${selectedChartContract} chart-selected-market-${selectedChartMarket?.id ?? "none"} chart-selected-line-${selectedChartTicketSelection?.line ?? "none"} chart-selected-period-${selectedChartTicketSelection?.period ?? "none"} two outcome traces ${chartFilter} ${label(locale, selectedChartOutcome ?? event)} ${selectedChartProbability}% ${chartPointMeta.label} ${chartPointMeta.value} +$9 +$39 +$479 All Game Live`}
          style={[styles.chartBlock, isLiveEvent && styles.liveChartBlock]}
          testID="event-detail-price-chart"
        >
          <View
            accessibilityLabel={`event-detail-chart-route-state chart-status-${chartRouteStatus} provider-lifecycle-${chartStatusBadge.lifecycle} provider-source-${chartStatusBadge.source} ${chartStateText}`}
            style={[styles.chartRouteState, chartStatusBadge.lifecycle === "not-ready" && styles.chartRouteStateError, chartStatusBadge.lifecycle === "refresh-due" && styles.chartRouteStateEmpty]}
            testID="event-detail-chart-route-state"
          >
            <Ionicons
              name={providerLifecycleIcon[chartStatusBadge.lifecycle]}
              color={chartStatusBadge.lifecycle === "not-ready" ? "#f87171" : chartStatusBadge.lifecycle === "refresh-due" ? "#fbbf24" : "#7dd3fc"}
              size={14}
            />
            <Text style={[styles.chartRouteStateText, chartStatusBadge.lifecycle === "not-ready" && styles.chartRouteStateTextError, chartStatusBadge.lifecycle === "refresh-due" && styles.chartRouteStateTextEmpty]}>
              {chartStateText}
            </Text>
          </View>
          <View style={styles.chartMarkers}>
            <Text style={styles.chartMarkerText}>+$9</Text>
            <Text style={styles.chartMarkerText}>+$39</Text>
            <Text style={styles.chartMarkerText}>+$479</Text>
          </View>
          <View style={styles.chartReferenceLine}>
            <Text style={styles.chartReferenceText}>Target</Text>
          </View>
          <View accessibilityLabel={`event-detail-chart-outcome-selector selected-chart-outcome-${selectedChartOutcome?.id ?? "none"}`} style={styles.chartOutcomeSelector} testID="event-detail-chart-outcome-selector">
            {primaryOutcomes.map((outcome) => {
              const isSelected = selectedChartOutcome?.id === outcome.id;
              return (
                <Pressable
                  accessibilityLabel={`event-detail-chart-outcome-${outcome.id} ${isSelected ? "selected-chart-outcome" : "inactive-chart-outcome"} ${label(locale, outcome)} ${outcome.probability}%`}
                  key={outcome.id}
                  onPress={() => selectChartOutcome(outcome)}
                  style={[styles.chartOutcomeChip, isSelected && styles.chartOutcomeChipActive]}
                  testID={`event-detail-chart-outcome-${outcome.id}`}
                >
                  <View style={[styles.chartOutcomeDot, { backgroundColor: outcome.color }]} />
                  <Text style={[styles.chartOutcomeText, isSelected && styles.chartOutcomeTextActive]}>{teamCode(outcome.label)} {outcome.probability}%</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.dualChart}>
            <View style={styles.chartTrace}>
              {homeChartSeries.map((point, index) => (
                <View
                  key={`home-${point}-${index}`}
                  style={[
                    styles.chartStep,
                    {
                      backgroundColor: leftOutcome?.color ?? "#22c55e",
                      marginTop: Math.max(0, 72 - point),
                      opacity: 0.7 + index / 70,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={[styles.chartTrace, styles.chartTraceOverlay]}>
              {awayChartSeries.map((point, index) => (
                <View
                  key={`away-${point}-${index}`}
                  style={[
                    styles.chartStep,
                    {
                      backgroundColor: rightOutcome?.color ?? "#ef4444",
                      marginTop: Math.max(0, 72 - point),
                      opacity: 0.62 + index / 80,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={[styles.chartDot, { backgroundColor: selectedChartColor }]} />
            <View
              accessibilityLabel={`event-detail-chart-selected-point-${selectedChartPoint}`}
              style={[styles.chartSelectedPoint, selectedChartPoint === "mid" && styles.chartSelectedPointMid, selectedChartPoint === "target" && styles.chartSelectedPointTarget, { borderColor: selectedChartColor }]}
              testID={`event-detail-chart-selected-point-${selectedChartPoint}`}
            />
          </View>
          <View style={styles.chartLabel}>
            <Text style={[styles.chartName, { color: selectedChartColor }]}>{selectedChartOutcome ? label(locale, selectedChartOutcome) : label(locale, event)}</Text>
            <Text style={[styles.chartPercent, { color: selectedChartColor }]}>{selectedChartOutcome?.probability ?? 0}%</Text>
          </View>
          <View accessibilityLabel={`event-detail-chart-tooltip chart-selected-point-${selectedChartPoint} ${chartPointMeta.label} ${chartPointMeta.value} ${chartPointMeta.time}`} style={styles.chartTooltip} testID="event-detail-chart-tooltip">
            <Text style={styles.chartTooltipLabel}>{chartPointMeta.label}</Text>
            <Text style={[styles.chartTooltipValue, { color: selectedChartColor }]}>{chartPointMeta.value}</Text>
            <Text style={styles.chartTooltipTime}>{chartPointMeta.time}</Text>
          </View>
          <View accessibilityLabel={`event-detail-chart-point-selector chart-selected-point-${selectedChartPoint}`} style={styles.chartPointSelector} testID="event-detail-chart-point-selector">
            {[
              { id: "latest" as const, label: "Now" },
              { id: "mid" as const, label: "2H" },
              { id: "target" as const, label: "Target" },
            ].map((point) => (
              <Pressable
                accessibilityLabel={`event-detail-chart-point-${point.id} ${selectedChartPoint === point.id ? "selected-chart-point" : "inactive-chart-point"}`}
                key={point.id}
                onPress={() => selectChartPoint(point.id)}
                style={[styles.chartPointChip, selectedChartPoint === point.id && styles.chartPointChipActive]}
                testID={`event-detail-chart-point-${point.id}`}
              >
                <Text style={[styles.chartPointText, selectedChartPoint === point.id && styles.chartPointTextActive]}>{point.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chartFilterRow}>
            {chartFilters.map((filter) => (
              <Pressable
                accessibilityLabel={`event-detail-chart-filter-${filter}`}
                key={filter}
                onPress={() => {
                  setChartFilter(filter);
                  if (filter === "Game" && leftOutcome) setSelectedChartOutcomeId(leftOutcome.id);
                  if (filter === "Live" && rightOutcome) setSelectedChartOutcomeId(rightOutcome.id);
                }}
                style={[styles.chartFilterPill, chartFilter === filter && styles.chartFilterPillActive]}
                testID={`event-detail-chart-filter-${filter.toLowerCase()}`}
              >
                <Text style={[styles.chartFilterText, chartFilter === filter && styles.chartFilterTextActive]}>{filter}</Text>
              </Pressable>
            ))}
          </View>
          <View
            accessibilityLabel={`event-detail-chart-contract-rail chart-selected-contract-${selectedChartContract} chart-selected-market-${selectedChartMarket?.id ?? "none"} chart-selected-outcome-${selectedChartTicketOutcome?.id ?? "none"} chart-selected-line-${selectedChartTicketSelection?.line ?? "none"} chart-selected-period-${selectedChartTicketSelection?.period ?? "none"} provider-lifecycle-${selectedChartTicketStatusBadge.lifecycle} ${selectedChartContractLabel}`}
            style={styles.chartContractRail}
            testID="event-detail-chart-contract-rail"
          >
            <View style={styles.chartContractTextBlock}>
              <Text style={styles.chartContractEyebrow}>{selectedChartContract === "moneyline" ? "Selected outcome" : "Selected line"}</Text>
              <Text numberOfLines={1} style={styles.chartContractTitle}>{selectedChartContractLabel}</Text>
              <Text
                accessibilityLabel={`event-detail-chart-ticket-handoff-status provider-lifecycle-${selectedChartTicketStatusBadge.lifecycle} provider-source-${selectedChartTicketStatusBadge.source} ${selectedChartTicketStatusBadge.text}`}
                style={[styles.chartContractStatus, selectedChartTicketStatusBadge.lifecycle !== "ready" && styles.chartContractStatusWarning]}
                testID="event-detail-chart-ticket-handoff-status"
              >
                {selectedChartTicketStatusBadge.text}
              </Text>
            </View>
            <View style={styles.chartContractActions}>
              {showOrderBookDebug && (
                <Pressable
                  accessibilityLabel={`event-detail-chart-open-book chart-selected-contract-${selectedChartContract} chart-selected-market-${selectedChartMarket?.id ?? "none"} chart-selected-line-${selectedChartTicketSelection?.line ?? "none"} chart-selected-period-${selectedChartTicketSelection?.period ?? "none"}`}
                  onPress={openSelectedChartBook}
                  style={styles.chartContractButton}
                  testID="event-detail-chart-open-book"
                >
                  <Ionicons name="book-outline" color="#dbeafe" size={16} />
                  <Text style={styles.chartContractButtonText}>Book</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityLabel={`event-detail-chart-open-ticket chart-selected-contract-${selectedChartContract} chart-selected-market-${selectedChartMarket?.id ?? "none"} chart-selected-outcome-${selectedChartTicketOutcome?.id ?? "none"} provider-lifecycle-${selectedChartTicketStatusBadge.lifecycle} ${ticketSelectionIdentityLabel(selectedChartTicketSelection)}`}
                onPress={openSelectedChartTicket}
                style={[styles.chartTradeButton, { backgroundColor: selectedChartColor }]}
                testID="event-detail-chart-open-ticket"
              >
                <Text style={styles.chartTradeButtonText}>Trade</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable accessibilityLabel="event-detail-chat-preview" style={styles.chatPreview} testID="event-detail-chat-preview">
          <View style={styles.chatPreviewTop}>
            <Text style={styles.chatCount}>78914 chatting</Text>
            <Ionicons name="chatbubbles-outline" color="#cbd5e1" size={20} />
          </View>
          <View style={styles.chatPreviewLine}>
            <View style={styles.userDot} />
            <Text style={styles.chatUser}>gigglyeel0550</Text>
            <Text style={styles.chatBetBadge}>BTTS $36</Text>
            <Text style={styles.chatMessage}>VAMOS</Text>
          </View>
        </Pressable>

        {position && (
          <View accessibilityLabel="event-detail-position-card" style={styles.positionSection} testID="event-detail-position-card">
            <Text style={styles.positionHeading}>Your position</Text>
            <View style={styles.positionCard}>
              <View style={styles.positionTopRow}>
                <View style={styles.positionMarketRow}>
                  <Ionicons name="pulse-outline" color="#9ca3af" size={18} />
                  <Text style={[styles.positionSidePill, position.side === "sell" && styles.positionSideSell]}>
                    {position.side === "buy" ? "Yes" : "No"}
                  </Text>
                  <Text style={styles.positionTitle} numberOfLines={1}>{position.title}</Text>
                </View>
                <Ionicons name="share-outline" color="#cbd5e1" size={18} />
              </View>
              <View style={styles.positionStats}>
                <View style={styles.positionStatBlock}>
                  <Text style={styles.positionLabel}>Cost {position.probability}%</Text>
                  <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.positionValue}>{money(position.amount)}</Text>
                </View>
                <View style={styles.positionStatBlock}>
                  <Text style={styles.positionLabel}>Current {positionCurrentProbability(position)}%</Text>
                  <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.positionValue}>
                    {money(portfolioPositionValue(position))} <Text style={estimatedPositionPnl(position) >= 0 ? styles.pnlUp : styles.pnlDown}>{estimatedPositionPnl(position) >= 0 ? "+" : ""}{money(estimatedPositionPnl(position))}</Text>
                  </Text>
                </View>
                <View style={styles.toWinBlock}>
                  <Text style={styles.positionLabel}>To win</Text>
                  <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.positionValue}>{money(position.amount / Math.max(position.probability / 100, 0.01))}</Text>
                </View>
              </View>
              <View style={styles.positionActions}>
                <Pressable
                  accessibilityLabel="event-detail-position-buy-more"
                  onPress={() => openPositionTrade?.(position, "buy")}
                  style={styles.buyMoreButton}
                  testID="event-detail-position-buy-more"
                >
                  <Text style={styles.buyMoreText}>Buy more {positionCurrentProbability(position)}%</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="event-detail-position-cash-out"
                  onPress={() => closePosition?.(position)}
                  style={styles.cashOutButton}
                  testID="event-detail-position-cash-out"
                >
                  <Text style={styles.cashOutText}>Cash out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View accessibilityLabel="event-detail-primary-outcomes" style={styles.primaryOutcomeRow} testID="event-detail-primary-outcomes">
          {primaryOutcomes.map((outcome) => (
            <Pressable
              accessibilityLabel={`event-detail-outcome-${primaryMarket.id}-${outcome.id}`}
              key={outcome.id}
              onPress={() => openPrimaryOutcomeTicket(outcome)}
              style={[styles.primaryOutcomeButton, { backgroundColor: outcome.color }, selectedPrimaryOutcome?.id === outcome.id && styles.primaryOutcomeButtonSelected]}
              testID={`event-detail-primary-outcome-${primaryMarket.id}-${outcome.id}`}
            >
              <Text style={styles.primaryOutcomeText}>
                {teamCode(outcome.label)} <Text style={styles.primaryOutcomePercent}>{outcome.probability}%</Text>
              </Text>
            </Pressable>
          ))}
        </View>

        {renderMarketTabs()}

        {activeTab === "player-props" ? (
          <View
            accessibilityLabel="event-detail-player-props event-detail-player-props-empty Player Props unavailable for this match"
            style={styles.emptyProps}
            testID="event-detail-player-props"
          >
            <Ionicons name="shirt-outline" color="#4b5563" size={34} />
            <Text style={styles.emptyPropsText}>Player Props unavailable for this match</Text>
          </View>
        ) : activeTab === "exact-score" ? (
          renderExactScore()
        ) : activeTab === "halves" ? (
          renderHalves()
        ) : (
          <View accessibilityLabel="event-detail-game-lines" testID="event-detail-game-lines">
            <View accessibilityLabel="event-detail-stats" style={styles.hiddenStats} testID="event-detail-stats">
              <Text style={styles.hiddenStatsText}>{stats.volume}</Text>
              <Text style={styles.hiddenStatsText}>{stats.liquidity}</Text>
              <Text style={styles.hiddenStatsText}>{stats.traders}</Text>
            </View>
            <View accessibilityLabel="event-detail-market-summary" style={styles.hiddenStats} testID="event-detail-market-summary">
              <Text style={styles.hiddenStatsText}>{stats.marketCount} {t.marketCount}</Text>
              <Text style={styles.hiddenStatsText}>{stats.outcomeCount} {t.outcomeCount}</Text>
              {primaryMarket && <Text style={styles.hiddenStatsText}>{label(locale, primaryMarket)}</Text>}
            </View>
            {renderTeamToAdvanceCard()}
            {regulationWinnerMarket && (
              <View style={styles.marketBlock}>
                <Pressable
                  accessibilityLabel={`event-detail-market-toggle-regulation-time-winner event-detail-market-toggle-${regulationWinnerMarket.id} ${providerIdentityLabel(regulationWinnerMarket)}`}
                  onPress={() => toggleGroup("regulation-time-winner")}
                  style={styles.marketHeaderRow}
                  testID={`event-detail-market-toggle-${regulationWinnerMarket.id}`}
                >
                  <View style={styles.marketTitleBlock}>
                    <Text style={styles.marketTitle}>{isLiveEvent ? "Live Winner" : "Moneyline"}</Text>
                    <Text style={styles.marketSubcopy}>{isLiveEvent ? `${scoreboard} · ${liveClock} · In-game winner` : "Regulation Time Winner · 90 Minutes Plus Stoppage Time"}</Text>
                  </View>
                  <Ionicons name={expandedMarketIds["regulation-time-winner"] ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
                </Pressable>
                {expandedMarketIds["regulation-time-winner"] && (
                  <>
                    {showOrderBookDebug && (
                      <View accessibilityLabel={`market-depth-${regulationWinnerMarket.id}`} style={styles.depthRow} testID={`market-depth-${regulationWinnerMarket.id}`}>
                        <Text style={styles.depthText}>{t.bestBid} {marketDepth(regulationWinnerMarket).bid}</Text>
                        <Text style={styles.depthText}>{t.bestAsk} {marketDepth(regulationWinnerMarket).ask}</Text>
                        <Text style={styles.depthText}>{t.spread} {marketDepth(regulationWinnerMarket).spread}</Text>
                        <Pressable accessibilityLabel={`event-detail-open-order-book ${providerIdentityLabel(regulationWinnerMarket)}`} onPress={() => openOrderBookForMarket(regulationWinnerMarket)} style={styles.depthBookButton} testID="event-detail-open-order-book">
                          <Ionicons name="book-outline" color="#dbeafe" size={14} />
                          <Text style={styles.depthBookText}>Book</Text>
                        </Pressable>
                      </View>
                    )}
                    {regulationWinnerRows.map((outcome) => {
                      const matchingOutcome = regulationWinnerMarket.outcomes.find((item) => item.id === outcome.id);
                      return renderParityOutcomeRow(outcome, regulationWinnerMarket.id, matchingOutcome, regulationWinnerMarket);
                    })}
                  </>
                )}
              </View>
            )}
            {canRenderSpread && (
              <View style={styles.marketBlock}>
                <Pressable
                  accessibilityLabel={`event-detail-market-toggle-spread Spread ${homeCode} to win by over ${spreadLine} goals ${spreadLine}`}
                  onPress={() => toggleGroup("spread")}
                  style={styles.marketHeaderRow}
                  testID="event-detail-market-toggle-spread"
                >
                  <View style={styles.marketTitleBlock}>
                    <Text style={styles.marketTitle}>Spread</Text>
                    <Text style={styles.marketSubcopy}>{homeCode} to win by over {spreadLine} goals</Text>
                  </View>
                  <View style={styles.headerRightCluster}>
                    {backendSpreadMarket?.availability && (
                      <View
                        accessibilityLabel={`event-detail-market-availability-spread market-availability-${backendSpreadMarket.availability.status} market-status-${backendSpreadMarket.availability.marketStatus ?? "unknown"} ${marketAvailabilityLabel(backendSpreadMarket) ?? ""}`}
                        style={[styles.marketAvailabilityPill, backendSpreadMarket.availability.status !== "ready" && styles.marketAvailabilityPillWarning, backendSpreadMarket.availability.status === "suspended" && styles.marketAvailabilityPillSuspended]}
                        testID="event-detail-market-availability-spread"
                      >
                        <Text style={[styles.marketAvailabilityText, backendSpreadMarket.availability.status !== "ready" && styles.marketAvailabilityTextWarning]}>{marketAvailabilityLabel(backendSpreadMarket)}</Text>
                      </View>
                    )}
                    {showOrderBookDebug && backendSpreadMarket && (
                      <Pressable
                        accessibilityLabel={`event-detail-open-order-book-spread ${backendSpreadMarket.id}`}
                        onPress={() => openOrderBookForMarket(backendSpreadMarket)}
                        style={styles.depthBookButton}
                        testID="event-detail-open-order-book-spread"
                      >
                        <Ionicons name="book-outline" color="#dbeafe" size={14} />
                        <Text style={styles.depthBookText}>Book</Text>
                      </Pressable>
                    )}
                    <View style={styles.lineValuePill}>
                      <Text style={styles.lineValueText}>{spreadLine}</Text>
                      <Ionicons name="chevron-down" color="#86efac" size={16} />
                    </View>
                    <Ionicons name={expandedMarketIds.spread ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
                  </View>
                </Pressable>
                {expandedMarketIds.spread && (
                  <>
                    <View style={styles.subSegmentRow}>
                      {linePeriods.map((period) => (
                        <Pressable
                          accessibilityLabel={`event-detail-spread-period-${period} chart-contract-spread ${spreadPeriod === period ? "selected-line-period" : "inactive-line-period"}`}
                          key={period}
                          onPress={() => {
                            setSelectedChartContract("spread");
                            setSpreadPeriod(period);
                          }}
                          style={[styles.subSegment, spreadPeriod === period && styles.subSegmentActive]}
                          testID={`event-detail-spread-period-${period.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()}`}
                        >
                          <Text style={[styles.subSegmentText, spreadPeriod === period && styles.subSegmentTextActive]}>{period}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.lineRailRow}>
                      {spreadLineOptions.map((line) => (
                        <Pressable
                          accessibilityLabel={`event-detail-spread-line-${line} chart-contract-spread ${spreadLine === line ? "selected-line-value" : "inactive-line-value"}`}
                          key={line}
                          onPress={() => {
                            setSelectedChartContract("spread");
                            setSpreadLine(line);
                          }}
                          style={[styles.lineRailOption, spreadLine === line && styles.lineRailOptionActive]}
                          testID={`event-detail-spread-line-${line.replace(".", "-")}`}
                        >
                          <Text style={[styles.lineRailText, spreadLine === line && styles.lineRailTextActive]}>{line}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {spreadRows.map((outcome, index) => renderParityOutcomeRow(outcome, "spread", backendSpreadMarket?.outcomes[index], backendSpreadMarket))}
                  </>
                )}
              </View>
            )}
            {visibleGameLineGroups.map((group) => renderGroup(group))}
          </View>
        )}
        <View accessibilityLabel="event-detail-market-rules" style={styles.rulesSection} testID="event-detail-market-rules">
          <View style={styles.marketHeaderRow}>
            <Text style={styles.marketTitle}>Market Rules</Text>
            <Ionicons name="chevron-up" color="#9ca3af" size={26} />
          </View>
          <View style={styles.ruleSelector}>
            <Text style={styles.ruleSelectorText}>{teamCode(teamA?.name ?? "MEX")} to advance</Text>
            <Ionicons name="chevron-down" color="#cbd5e1" size={16} />
          </View>
          <Text style={styles.ruleText}>This market settles based on the official match result and regulation-time market rules for the selected World Cup game.</Text>
          <Text style={styles.fullRulesText}>View Full Rules</Text>
        </View>
        <View accessibilityLabel="event-detail-more-events" style={styles.moreEventsSection} testID="event-detail-more-events">
          <Text style={styles.marketTitle}>More Events</Text>
          {[
            { time: "Today 10:00 PM", title: "Portugal vs. Croatia", home: "POR 72%", away: "CRO 29%" },
            { time: "Tomorrow 11:00 AM", title: "England vs. Congo DR", home: "ENG 88%", away: "COD 12%" },
          ].map((item) => (
            <View key={item.title} style={styles.moreEventRow}>
              <View style={styles.moreEventTextBlock}>
                <Text style={styles.moreEventTime}>{item.time}</Text>
                <Text style={styles.moreEventTitle}>{item.title}</Text>
              </View>
              <Text style={styles.moreEventPrice}>{item.home}</Text>
              <Text style={styles.moreEventPrice}>{item.away}</Text>
            </View>
          ))}
        </View>
          </>
        )}
          </>
        )}
      </ScrollView>
      {activeHeaderTab === "game" && primaryMarket && selectedPrimaryOutcomeId && selectedPrimaryOutcome && !orderBookVisible && (
        <View
          accessibilityLabel={`event-detail-selected-outcome-trade-rail selected-market-${primaryMarket.id} selected-outcome-${selectedPrimaryOutcome.id} selected-probability-${selectedPrimaryOutcome.probability} selected-ticket-ready`}
          style={styles.selectedTradeRail}
          testID="event-detail-selected-outcome-trade-rail"
        >
          <View style={styles.selectedTradeSummary}>
            <View style={[styles.selectedOutcomeDot, { backgroundColor: selectedPrimaryOutcome.color }]} />
            <View style={styles.selectedTradeTextBlock}>
              <Text numberOfLines={1} style={styles.selectedTradeTitle}>{teamCode(selectedPrimaryOutcome.label)} {selectedPrimaryOutcome.probability}%</Text>
              <Text numberOfLines={1} style={styles.selectedTradeMeta}>{isLiveEvent ? "Live Winner" : "Team to Advance"} - {marketDepth(primaryMarket).spread} spread</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel={`event-detail-selected-outcome-open-ticket selected-market-${primaryMarket.id} selected-outcome-${selectedPrimaryOutcome.id} ticket-entry-stable`}
            onPress={() => openPrimaryOutcomeTicket(selectedPrimaryOutcome)}
            style={styles.selectedTradeButton}
            testID="event-detail-selected-outcome-open-ticket"
          >
            <Text style={styles.selectedTradeButtonText}>Trade</Text>
            <Ionicons name="chevron-up" color="#06110b" size={18} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#060b14" },
  topBar: { minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  segmentedControl: { flexDirection: "row", alignItems: "center", padding: 4, borderRadius: 999, backgroundColor: "#171d2a" },
  segment: { minHeight: 38, minWidth: 84, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, paddingHorizontal: 12 },
  segmentActive: { backgroundColor: "#0b1220" },
  segmentText: { color: "#8d94a3", fontSize: 16, fontWeight: "800" },
  segmentTextActive: { color: "#ffffff" },
  chatBadge: { minWidth: 34, height: 26, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#ef233c" },
  chatBadgeText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  actionNotice: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, backgroundColor: "#0f1b2e", borderBottomWidth: 1, borderBottomColor: "#263247" },
  actionNoticeText: { flex: 1, color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  actionNoticeDismiss: { color: "#93c5fd", fontSize: 13, fontWeight: "900" },
  shareSheet: { padding: 16, backgroundColor: "#0b1220", borderBottomWidth: 1, borderBottomColor: "#263247" },
  shareSheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  shareSheetTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "900" },
  shareSheetSub: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 3 },
  shareDismissButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  shareActionsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  shareActionButton: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#172033", borderWidth: 1, borderColor: "#293548" },
  shareActionText: { color: "#e5e7eb", fontSize: 12, fontWeight: "900" },
  stickyMarketShell: { backgroundColor: "#060b14", borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  compactGameHeader: { minHeight: 78, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, backgroundColor: "#060b14", borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  compactTeamSide: { width: 132, flexDirection: "row", alignItems: "center", gap: 8 },
  compactTeamRight: { justifyContent: "flex-end" },
  compactFlag: { fontSize: 31 },
  compactTeamCode: { color: "#9ca3af", fontSize: 17, fontWeight: "900" },
  compactProbability: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  compactMatchCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  compactDate: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  compactTime: { color: "#cbd5e1", fontSize: 15, fontWeight: "800", marginTop: 3 },
  compactRightText: { alignItems: "flex-end" },
  scroller: { flex: 1 },
  scrollPad: { paddingBottom: 110 },
  legacySummary: { height: 1, overflow: "hidden", opacity: 0 },
  legacySummaryText: { color: "#060b14", fontSize: 1 },
  matchHeader: { minHeight: 96, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  teamSide: { width: 132, flexDirection: "row", alignItems: "center", gap: 6 },
  teamSideRight: { justifyContent: "flex-end" },
  flag: { fontSize: 34 },
  teamCode: { color: "#6b7280", fontSize: 15, fontWeight: "900" },
  teamProbability: { fontSize: 20, fontWeight: "900", marginLeft: -4 },
  matchTime: { alignItems: "center", justifyContent: "center" },
  matchDate: { color: "#f8fafc", fontSize: 17, fontWeight: "800" },
  matchHour: { color: "#cbd5e1", fontSize: 15, fontWeight: "700", marginTop: 4 },
  scoreText: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 4 },
  liveClock: { color: "#ef4444", fontSize: 14, fontWeight: "900", marginTop: 3 },
  rightTeamText: { alignItems: "flex-end" },
  bodySwitchSection: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 8 },
  bodySwitchMeta: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  bodySwitchVolume: { color: "#8b93a3", fontSize: 15, fontWeight: "800" },
  bodySwitchSource: { color: "#64748b", fontSize: 15, fontWeight: "900" },
  bodySwitchFreshness: { color: "#7dd3fc", fontSize: 12, fontWeight: "900" },
  bodySwitchFreshnessWarning: { color: "#fde68a" },
  bodySwitchTabs: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  bodySwitchTab: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, paddingHorizontal: 16, backgroundColor: "transparent" },
  bodySwitchTabActive: { backgroundColor: "#082f49" },
  bodySwitchTabText: { color: "#8b93a3", fontSize: 17, fontWeight: "900" },
  bodySwitchTabTextActive: { color: "#38bdf8" },
  liveStatsPanel: { marginHorizontal: 24, marginTop: 16, marginBottom: 24, padding: 16, borderRadius: 18, backgroundColor: "#10171f", borderWidth: 1, borderColor: "#26313f" },
  liveStatsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  liveStatsTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  liveStatsStatus: { overflow: "hidden", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, color: "#93c5fd", backgroundColor: "#0b2440", fontSize: 12, fontWeight: "900" },
  liveDataPill: { minHeight: 34, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#0b2440", borderWidth: 1, borderColor: "rgba(56, 189, 248, 0.35)", alignItems: "flex-end", justifyContent: "center" },
  liveDataPillWarning: { backgroundColor: "rgba(53, 43, 20, 0.84)", borderColor: "rgba(251, 191, 36, 0.45)" },
  liveDataPillSuspended: { backgroundColor: "rgba(58, 24, 31, 0.84)", borderColor: "rgba(248, 113, 113, 0.45)" },
  liveDataText: { color: "#93c5fd", fontSize: 12, fontWeight: "900" },
  liveDataTextWarning: { color: "#fde68a" },
  liveDataMeta: { color: "#94a3b8", fontSize: 10, fontWeight: "800" },
  liveStatRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: "#1f2937" },
  liveStatValue: { width: 52, color: "#f8fafc", fontSize: 17, fontWeight: "900", textAlign: "center" },
  liveStatMiddle: { flex: 1, minWidth: 0 },
  liveStatLabel: { color: "#cbd5e1", fontSize: 13, fontWeight: "900", textAlign: "center", marginBottom: 6 },
  liveStatTrack: { height: 5, borderRadius: 999, backgroundColor: "#26313f", overflow: "hidden" },
  liveStatFill: { width: "58%", height: 5, borderRadius: 999, backgroundColor: "#38bdf8" },
  liveStatsTimeline: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#26313f" },
  liveStatsTimelineTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "900", marginBottom: 8 },
  liveStatsTimelineText: { color: "#94a3b8", fontSize: 13, fontWeight: "800", marginTop: 4 },
  chartBlock: { minHeight: 250, paddingHorizontal: 0, paddingTop: 32, paddingBottom: 12 },
  liveChartBlock: { minHeight: 300, paddingTop: 48 },
  liveMatchStrip: { minHeight: 64, marginHorizontal: 24, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  liveStripLabel: { color: "#ef4444", fontSize: 11, fontWeight: "900" },
  liveStripScore: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 2 },
  liveStripFreshness: { color: "#7dd3fc", fontSize: 11, fontWeight: "800", marginTop: 3 },
  liveStripFreshnessWarning: { color: "#fde68a" },
  liveStripPriceRow: { alignItems: "flex-end", gap: 3 },
  liveStripPrice: { fontSize: 14, fontWeight: "900" },
  chartMarkers: { position: "absolute", left: 14, top: 34, gap: 20 },
  chartMarkerText: { color: "#546071", fontSize: 11, fontWeight: "900" },
  chartRouteState: { position: "absolute", left: 82, top: 12, minWidth: 132, height: 28, paddingHorizontal: 9, borderRadius: 999, backgroundColor: "rgba(15, 23, 42, 0.88)", borderWidth: 1, borderColor: "#243244", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  chartRouteStateEmpty: { borderColor: "rgba(251, 191, 36, 0.35)", backgroundColor: "rgba(53, 43, 20, 0.82)" },
  chartRouteStateError: { borderColor: "rgba(248, 113, 113, 0.38)", backgroundColor: "rgba(58, 24, 31, 0.82)" },
  chartRouteStateText: { color: "#bfdbfe", fontSize: 11, fontWeight: "900" },
  chartRouteStateTextEmpty: { color: "#fde68a" },
  chartRouteStateTextError: { color: "#fecaca" },
  chartReferenceLine: { position: "absolute", left: 0, right: 42, top: 63, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#64748b", opacity: 0.65 },
  chartReferenceText: { position: "absolute", right: -2, top: -15, overflow: "hidden", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, color: "#dbeafe", backgroundColor: "#475569", fontSize: 12, fontWeight: "900" },
  chartOutcomeSelector: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, marginRight: 22, marginBottom: 8 },
  chartOutcomeChip: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 10, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937" },
  chartOutcomeChipActive: { backgroundColor: "#172033", borderColor: "#94a3b8" },
  chartOutcomeDot: { width: 8, height: 8, borderRadius: 999 },
  chartOutcomeText: { color: "#94a3b8", fontSize: 12, fontWeight: "900" },
  chartOutcomeTextActive: { color: "#f8fafc" },
  dualChart: { width: "70%", height: 92, marginLeft: 0 },
  chartTrace: { position: "absolute", left: 0, right: 0, top: 0, height: 86, flexDirection: "row", alignItems: "flex-start" },
  chartTraceOverlay: { top: 28 },
  chartStep: { flex: 1, height: 5, borderRadius: 999, marginRight: -1 },
  chartDot: { position: "absolute", right: -8, top: 47, width: 15, height: 15, borderRadius: 999 },
  chartSelectedPoint: { position: "absolute", right: 20, top: 43, width: 22, height: 22, borderRadius: 999, borderWidth: 3, backgroundColor: "#0b1019" },
  chartSelectedPointMid: { right: "42%", top: 31 },
  chartSelectedPointTarget: { right: "18%", top: 12 },
  chartLabel: { position: "absolute", right: 28, top: 36, alignItems: "flex-start" },
  chartName: { fontSize: 17, fontWeight: "800" },
  chartPercent: { fontSize: 48, fontWeight: "500" },
  chartTooltip: { position: "absolute", left: "38%", top: 8, minWidth: 92, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: "#101827", borderWidth: 1, borderColor: "#334155" },
  chartTooltipLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900" },
  chartTooltipValue: { fontSize: 17, fontWeight: "900", marginTop: 1 },
  chartTooltipTime: { color: "#cbd5e1", fontSize: 11, fontWeight: "800", marginTop: 1 },
  chartPointSelector: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  chartPointChip: { minWidth: 74, minHeight: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937" },
  chartPointChipActive: { backgroundColor: "#dbeafe", borderColor: "#f8fafc" },
  chartPointText: { color: "#94a3b8", fontSize: 12, fontWeight: "900" },
  chartPointTextActive: { color: "#0b1220" },
  chartFilterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 },
  chartFilterPill: { minWidth: 62, minHeight: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  chartFilterPillActive: { backgroundColor: "#273244" },
  chartFilterText: { color: "#8b93a3", fontSize: 13, fontWeight: "900" },
  chartFilterTextActive: { color: "#f8fafc" },
  chartContractRail: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginHorizontal: 24, marginTop: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#243244" },
  chartContractTextBlock: { flex: 1, minWidth: 0 },
  chartContractEyebrow: { color: "#7dd3fc", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  chartContractTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "900", marginTop: 3 },
  chartContractStatus: { color: "#93c5fd", fontSize: 10, fontWeight: "900", marginTop: 4 },
  chartContractStatusWarning: { color: "#fde68a" },
  chartContractActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  chartContractButton: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 8, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247", paddingHorizontal: 10 },
  chartContractButtonText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  chartTradeButton: { minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, paddingHorizontal: 14 },
  chartTradeButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  chatPreview: { marginHorizontal: 24, marginTop: 8, padding: 14, borderRadius: 18, backgroundColor: "#181f2d" },
  chatPreviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chatCount: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  chatPreviewLine: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  userDot: { width: 26, height: 26, borderRadius: 999, backgroundColor: "#be18ff" },
  chatUser: { color: "#e5e7eb", fontSize: 15, fontWeight: "800" },
  chatBetBadge: { overflow: "hidden", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, color: "#22c55e", backgroundColor: "#082f1a", fontSize: 12, fontWeight: "900" },
  chatMessage: { color: "#a6adbb", fontSize: 14, fontWeight: "800" },
  chatPage: { paddingHorizontal: 18, paddingTop: 16, gap: 12 },
  chatContextCard: { padding: 14, borderRadius: 16, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247" },
  chatContextTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  chatContextMeta: { color: "#9ca3af", fontSize: 13, fontWeight: "800", marginTop: 6 },
  chatFeed: { gap: 10 },
  chatMessageRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  chatAvatar: { width: 34, height: 34, borderRadius: 999, marginTop: 3 },
  chatMessageBubble: { flex: 1, minWidth: 0, padding: 12, borderRadius: 14, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937" },
  chatMessageMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  chatMessageUser: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  chatMessageBadge: { overflow: "hidden", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, color: "#22c55e", backgroundColor: "#052e1b", fontSize: 11, fontWeight: "900" },
  chatMessageText: { color: "#cbd5e1", fontSize: 14, fontWeight: "800", lineHeight: 19 },
  typingRow: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 4 },
  typingDots: { flexDirection: "row", alignItems: "center", gap: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#64748b" },
  typingText: { color: "#94a3b8", fontSize: 13, fontWeight: "800" },
  reactionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reactionChip: { minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#172033", borderWidth: 1, borderColor: "#293548", paddingHorizontal: 14 },
  reactionText: { color: "#e5e7eb", fontSize: 13, fontWeight: "900" },
  chatInputRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 999, backgroundColor: "#111827", borderWidth: 1, borderColor: "#293548", paddingHorizontal: 14 },
  chatInputPlaceholder: { flex: 1, color: "#94a3b8", fontSize: 15, fontWeight: "800" },
  emojiPicker: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-around", borderRadius: 14, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  emojiText: { color: "#f8fafc", fontSize: 21, fontWeight: "900" },
  chatStickyOutcomes: { flexDirection: "row", gap: 12, marginTop: 4 },
  chatStickyButton: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  chatStickyButtonSelected: { borderWidth: 2, borderColor: "#f8fafc" },
  chatStickyButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  positionSection: { marginTop: 20, paddingHorizontal: 24 },
  positionHeading: { color: "#f8fafc", fontSize: 17, fontWeight: "800", marginBottom: 10 },
  positionCard: { borderRadius: 18, borderWidth: 1, borderColor: "#263247", backgroundColor: "#080d16", overflow: "hidden" },
  positionTopRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  positionMarketRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  positionSidePill: { overflow: "hidden", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, color: "#22c55e", backgroundColor: "#052e1b", fontWeight: "900" },
  positionSideSell: { color: "#ef4444", backgroundColor: "#3a0f15" },
  positionTitle: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  positionStats: { flexDirection: "row", justifyContent: "space-between", gap: 8, padding: 14 },
  positionStatBlock: { flex: 1, minWidth: 0 },
  positionLabel: { color: "#9ca3af", fontSize: 13, fontWeight: "800", marginBottom: 6 },
  positionValue: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  pnlUp: { color: "#22c55e", fontSize: 13 },
  pnlDown: { color: "#9ca3af", fontSize: 13 },
  toWinBlock: { flex: 1, minWidth: 0, alignItems: "flex-end" },
  positionActions: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  buyMoreButton: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#b8c0d1" },
  buyMoreText: { color: "#101827", fontSize: 16, fontWeight: "800" },
  cashOutButton: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: "#293548", backgroundColor: "#070c14" },
  cashOutText: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  primaryOutcomeRow: { flexDirection: "row", gap: 14, paddingHorizontal: 24, marginTop: 24, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#1f2937" },
  primaryOutcomeButton: { flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 8, elevation: 3 },
  primaryOutcomeButtonSelected: { borderWidth: 2, borderColor: "#f8fafc", transform: [{ translateY: -2 }] },
  primaryOutcomeText: { color: "rgba(255,255,255,0.72)", fontSize: 17, fontWeight: "900" },
  primaryOutcomePercent: { color: "#ffffff", fontSize: 20, fontWeight: "900" },
  selectedTradeRail: { position: "absolute", left: 12, right: 12, bottom: 12, minHeight: 74, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#2d3b52", shadowColor: "#000", shadowOpacity: 0.38, shadowRadius: 12, elevation: 9 },
  selectedTradeSummary: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  selectedOutcomeDot: { width: 36, height: 36, borderRadius: 999, borderWidth: 2, borderColor: "rgba(255,255,255,0.42)" },
  selectedTradeTextBlock: { flex: 1, minWidth: 0 },
  selectedTradeTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "900" },
  selectedTradeMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 3 },
  selectedTradeButton: { minWidth: 116, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 14, backgroundColor: "#d9f99d" },
  selectedTradeButtonText: { color: "#06110b", fontSize: 16, fontWeight: "900" },
  marketTabs: { flexDirection: "row", gap: 24, paddingHorizontal: 24, marginTop: 22, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  stickyMarketTabs: { marginTop: 0, paddingHorizontal: 20, borderBottomWidth: 0, backgroundColor: "#060b14" },
  marketTab: { minHeight: 46, justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  marketTabActive: { borderBottomColor: "#f8fafc" },
  marketTabText: { color: "#6b7280", fontSize: 18, fontWeight: "800" },
  marketTabTextActive: { color: "#f8fafc" },
  emptyProps: { minHeight: 280, alignItems: "center", justifyContent: "center" },
  emptyPropsText: { color: "#6b7280", fontSize: 18, fontWeight: "800" },
  hiddenStats: { height: 1, overflow: "hidden", opacity: 0 },
  hiddenStatsText: { color: "#060b14", fontSize: 1 },
  marketBlock: { borderBottomWidth: 1, borderBottomColor: "#172033", paddingHorizontal: 24, paddingVertical: 16 },
  marketHeaderRow: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  marketTitleBlock: { flex: 1 },
  marketTitle: { color: "#d1d5db", fontSize: 18, fontWeight: "800" },
  marketSubtitle: { color: "#8b93a3", fontSize: 15, fontWeight: "700", marginTop: 4 },
  marketSubcopy: { color: "#6b7280", fontSize: 14, fontWeight: "700", marginTop: 2 },
  polymarketLineCard: { marginHorizontal: 24, marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: "#10171f", borderWidth: 1, borderColor: "#26313f" },
  lineCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  lineOutcomeButtonRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  lineOutcomeButton: { flex: 1, minHeight: 62, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#25303a", borderBottomWidth: 5, borderBottomColor: "#1c2630" },
  lineOutcomeButtonSelected: { borderWidth: 2, borderColor: "#dbeafe", borderBottomColor: "#dbeafe" },
  lineOutcomeButtonText: { color: "#d1d5db", fontSize: 18, fontWeight: "900" },
  lineDetailTabs: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#26313f" },
  lineDetailTab: { minHeight: 34, justifyContent: "center" },
  lineDetailTabText: { color: "#7b8494", fontSize: 16, fontWeight: "900" },
  lineDetailTabTextActive: { color: "#f8fafc" },
  inlineOrderBook: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#26313f" },
  inlineOrderBookHeader: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  inlineBookHeaderText: { width: "30%", color: "#7b8494", fontSize: 12, fontWeight: "900", textAlign: "right" },
  inlineBookRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#172033" },
  inlineBookPrice: { width: "30%", color: "#ef4444", fontSize: 18, fontWeight: "900", textAlign: "right" },
  inlineBookText: { width: "30%", color: "#d1d5db", fontSize: 15, fontWeight: "800", textAlign: "right" },
  inlineGraph: { minHeight: 86, justifyContent: "center", marginTop: 12, borderTopWidth: 1, borderTopColor: "#26313f" },
  inlineGraphLine: { height: 5, borderRadius: 999, backgroundColor: "#38bdf8", marginHorizontal: 10 },
  inlineGraphText: { color: "#94a3b8", fontSize: 13, fontWeight: "800", marginTop: 10, textAlign: "center" },
  inlineAbout: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#26313f" },
  inlineAboutText: { color: "#cbd5e1", fontSize: 14, fontWeight: "700", lineHeight: 20 },
  exactScoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 54, borderTopWidth: 1, borderTopColor: "#26313f" },
  exactScoreText: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  exactScoreButton: { minWidth: 116, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#25303a" },
  exactScoreButtonText: { color: "#d1d5db", fontSize: 17, fontWeight: "900" },
  headerRightCluster: { flexDirection: "row", alignItems: "center", gap: 10 },
  marketAvailabilityPill: { minHeight: 28, justifyContent: "center", paddingHorizontal: 8, borderRadius: 999, backgroundColor: "rgba(14, 165, 233, 0.12)", borderWidth: 1, borderColor: "rgba(125, 211, 252, 0.28)" },
  marketAvailabilityPillWarning: { backgroundColor: "rgba(53, 43, 20, 0.78)", borderColor: "rgba(251, 191, 36, 0.35)" },
  marketAvailabilityPillSuspended: { backgroundColor: "rgba(58, 24, 31, 0.78)", borderColor: "rgba(248, 113, 113, 0.38)" },
  marketAvailabilityText: { color: "#bfdbfe", fontSize: 10, fontWeight: "900" },
  marketAvailabilityTextWarning: { color: "#fde68a" },
  marketDepthPill: { minHeight: 28, justifyContent: "center", paddingHorizontal: 8, borderRadius: 999, backgroundColor: "rgba(14, 165, 233, 0.12)", borderWidth: 1, borderColor: "rgba(125, 211, 252, 0.28)" },
  marketDepthText: { color: "#bfdbfe", fontSize: 10, fontWeight: "900" },
  lineValuePill: { minWidth: 58, minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 999, backgroundColor: "#052e1b", paddingHorizontal: 10 },
  lineValueText: { color: "#86efac", fontSize: 14, fontWeight: "900" },
  subSegmentRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 4 },
  subSegment: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  subSegmentActive: { backgroundColor: "#273244" },
  subSegmentText: { color: "#8b93a3", fontSize: 12, fontWeight: "900" },
  subSegmentTextActive: { color: "#f8fafc" },
  lineRailRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 10, marginBottom: 6 },
  lineRailOption: { minWidth: 62, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  lineRailOptionActive: { backgroundColor: "#052e1b", borderColor: "#0a8f61" },
  lineRailText: { color: "#8b93a3", fontSize: 16, fontWeight: "900" },
  lineRailTextActive: { color: "#86efac" },
  depthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 6 },
  depthText: { color: "#8b93a3", fontSize: 11, fontWeight: "800" },
  parityOutcomeRow: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 },
  parityOutcomeIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  parityOutcomeIconText: { color: "#cbd5e1", fontSize: 18, fontWeight: "900" },
  parityOutcomeTextBlock: { flex: 1, minWidth: 0 },
  miniLineTrack: { height: 4, borderRadius: 999, overflow: "hidden", backgroundColor: "#111827", marginTop: 8 },
  miniLineFill: { height: 4, borderRadius: 999 },
  oddsMultiplier: { width: 54, color: "#cbd5e1", fontSize: 14, fontWeight: "900", textAlign: "right" },
  parityProbButton: { width: 64, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  parityProbText: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  propToolsRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 6 },
  propFilterChip: { minHeight: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827", paddingHorizontal: 14 },
  propFilterChipActive: { backgroundColor: "#273244" },
  propFilterText: { color: "#8b93a3", fontSize: 12, fontWeight: "900" },
  propFilterTextActive: { color: "#f8fafc" },
  playerPropRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 10 },
  jerseyIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  playerTextBlock: { flex: 1, minWidth: 0 },
  playerTeamText: { color: "#6b7280", fontSize: 11, fontWeight: "900", marginTop: 3 },
  statPill: { minWidth: 48, minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 999, backgroundColor: "#111827" },
  statPillText: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  showAllRow: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 4 },
  showAllText: { color: "#cbd5e1", fontSize: 14, fontWeight: "900" },
  rulesSection: { borderTopWidth: 1, borderTopColor: "#172033", paddingHorizontal: 24, paddingVertical: 16 },
  ruleSelector: { alignSelf: "flex-start", minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, backgroundColor: "#111827", paddingHorizontal: 12, marginTop: 10 },
  ruleSelectorText: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  ruleText: { color: "#9ca3af", fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 12 },
  fullRulesText: { color: "#e5e7eb", fontSize: 14, fontWeight: "900", marginTop: 12 },
  moreEventsSection: { borderTopWidth: 1, borderTopColor: "#172033", paddingHorizontal: 24, paddingVertical: 16 },
  moreEventRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#111827" },
  moreEventTextBlock: { flex: 1, minWidth: 0 },
  moreEventTime: { color: "#6b7280", fontSize: 11, fontWeight: "900" },
  moreEventTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "900", marginTop: 3 },
  moreEventPrice: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  detailOutcome: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  outcomeTextBlock: { flex: 1 },
  teamName: { color: "#f8fafc", fontSize: 17, fontWeight: "800" },
  outcomeSizeText: { color: "#94a3b8", fontSize: 10, fontWeight: "800", marginTop: 4 },
  outcomeDepthText: { color: "#6b7280", fontSize: 11, fontWeight: "800", marginTop: 3 },
  depthBookButton: { minHeight: 30, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, borderRadius: 8, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247" },
  depthBookText: { color: "#dbeafe", fontSize: 11, fontWeight: "900" },
  probButton: { width: 92, minHeight: 62, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  probButtonSubtext: { color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: "900", marginTop: 2 },
  orderBookOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 30, backgroundColor: "#070c14", paddingTop: 16 },
  orderBookHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#172033" },
  orderBookTitle: { color: "#f8fafc", fontSize: 22, fontWeight: "900" },
  orderBookSubtitle: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 4 },
  orderBookHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderBookClose: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247" },
  orderBookSettingsButtonActive: { backgroundColor: "#172033", borderColor: "#38bdf8" },
  orderBookSummary: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#172033" },
  orderBookSummaryText: { flex: 1, color: "#cbd5e1", fontSize: 11, fontWeight: "900" },
  orderBookSettingsSheet: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#172033", backgroundColor: "#0b1220" },
  orderBookSettingsTextBlock: { flex: 1, minWidth: 0 },
  orderBookSettingsTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "900" },
  orderBookSettingsSubtitle: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 3 },
  orderBookDisplayToggle: { minWidth: 92, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827", borderWidth: 1, borderColor: "#293548", paddingHorizontal: 14 },
  orderBookDisplayToggleActive: { backgroundColor: "#dbeafe", borderColor: "#f8fafc" },
  orderBookDisplayToggleText: { color: "#dbeafe", fontSize: 13, fontWeight: "900" },
  orderBookDisplayToggleTextActive: { color: "#0b1220" },
  orderBookSelectorWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#172033", gap: 10 },
  orderBookSelectorTrigger: { minHeight: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#243244" },
  orderBookSelectorTriggerActive: { borderColor: "#38bdf8", backgroundColor: "#102132" },
  orderBookSelectorMain: { flex: 1, minWidth: 0 },
  orderBookSelectorFamily: { color: "#7dd3fc", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  orderBookSelectorTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "900", marginTop: 3 },
  orderBookSelectorMeta: { color: "#94a3b8", fontSize: 11, fontWeight: "800", marginTop: 3 },
  orderBookSelectorRight: { minWidth: 58, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  orderBookSelectorSide: { color: "#dbeafe", fontSize: 11, fontWeight: "900" },
  orderBookSelectorSheet: { maxHeight: 270, borderRadius: 8, backgroundColor: "#070c14", borderWidth: 1, borderColor: "#1f2937" },
  orderBookSelectorSheetContent: { gap: 10, padding: 10 },
  orderBookMarketGroup: { gap: 7 },
  orderBookMarketGroupTitle: { color: "#64748b", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  orderBookMarketChoice: { minHeight: 48, justifyContent: "center", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  orderBookMarketChoiceActive: { backgroundColor: "#102132", borderColor: "#38bdf8" },
  orderBookMarketChoiceTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  orderBookMarketChoiceText: { color: "#94a3b8", fontSize: 12, fontWeight: "900" },
  orderBookMarketChoiceTextActive: { color: "#f8fafc" },
  orderBookMarketChoiceMeta: { color: "#64748b", fontSize: 10, fontWeight: "800", marginTop: 3 },
  orderBookMarketChoiceMetaActive: { color: "#bfdbfe" },
  orderBookOutcomeTabs: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  orderBookOutcomeTab: { flex: 1, minHeight: 48, justifyContent: "center", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#111827", borderWidth: 1, borderColor: "#253043" },
  orderBookOutcomeTabActive: { backgroundColor: "#e5e7eb", borderColor: "#f8fafc" },
  orderBookOutcomeTabText: { color: "#94a3b8", fontSize: 15, fontWeight: "900" },
  orderBookOutcomeTabTextActive: { color: "#0b1220" },
  orderBookOutcomeTabMeta: { color: "#64748b", fontSize: 10, fontWeight: "900", marginTop: 2 },
  orderBookOutcomeTabMetaActive: { color: "#334155" },
  orderBookContractStrip: { minHeight: 74, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginHorizontal: 16, marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#243244" },
  orderBookContractTextBlock: { flex: 1, minWidth: 0 },
  orderBookContractEyebrow: { color: "#7dd3fc", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  orderBookContractTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 4 },
  orderBookQuoteRail: { width: 132, gap: 6 },
  orderBookQuotePill: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, borderRadius: 6, backgroundColor: "#111827", paddingHorizontal: 8 },
  orderBookQuoteLabel: { color: "#64748b", fontSize: 9, fontWeight: "900" },
  orderBookQuoteValue: { color: "#dbeafe", fontSize: 11, fontWeight: "900" },
  orderBookStatePill: { minHeight: 32, marginHorizontal: 16, marginTop: 10, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#243244" },
  orderBookStatePillEmpty: { borderColor: "rgba(251, 191, 36, 0.35)", backgroundColor: "rgba(53, 43, 20, 0.82)" },
  orderBookStatePillError: { borderColor: "rgba(248, 113, 113, 0.38)", backgroundColor: "rgba(58, 24, 31, 0.82)" },
  orderBookStateText: { color: "#bfdbfe", fontSize: 11, fontWeight: "900" },
  orderBookStateTextEmpty: { color: "#fde68a" },
  orderBookStateTextError: { color: "#fecaca" },
  orderBookAvailabilityPill: { minHeight: 32, marginHorizontal: 16, marginTop: 8, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#243244" },
  orderBookAvailabilityPillWarning: { borderColor: "rgba(251, 191, 36, 0.35)", backgroundColor: "rgba(53, 43, 20, 0.82)" },
  orderBookAvailabilityPillSuspended: { borderColor: "rgba(248, 113, 113, 0.38)", backgroundColor: "rgba(58, 24, 31, 0.82)" },
  orderBookAvailabilityText: { color: "#bfdbfe", fontSize: 11, fontWeight: "900" },
  orderBookAvailabilityTextWarning: { color: "#fde68a" },
  orderBookScroll: { flex: 1 },
  orderBookPad: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28 },
  orderBookOutcome: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#172033" },
  orderBookOutcomeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  orderBookSelectedText: { flex: 1, minWidth: 0 },
  orderBookOutcomeTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "900" },
  orderBookOutcomeMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 3 },
  orderBookActionColumn: { alignItems: "flex-end", gap: 5 },
  orderBookTicketHandoff: { color: "#93c5fd", fontSize: 10, fontWeight: "900" },
  orderBookTicketHandoffWarning: { color: "#fde68a" },
  orderBookActionRow: { flexDirection: "row", gap: 8 },
  orderBookTradeButton: { minWidth: 74, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  orderBookTradeButtonStaged: { borderWidth: 2, borderColor: "#f8fafc" },
  orderBookTradeText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  orderBookSellButton: { minWidth: 74, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  orderBookSellButtonStaged: { backgroundColor: "#334155", borderWidth: 2, borderColor: "#f8fafc" },
  orderBookSellText: { color: "#dbeafe", fontSize: 13, fontWeight: "900" },
  orderBookTradeSubtext: { color: "rgba(255,255,255,0.72)", fontSize: 9, fontWeight: "900", marginTop: 1 },
  orderBookStagedOrder: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#243244" },
  orderBookStagedOrderActive: { backgroundColor: "#102132", borderColor: "#38bdf8" },
  orderBookStagedTextBlock: { flex: 1, minWidth: 0 },
  orderBookStagedLabel: { color: "#7dd3fc", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  orderBookStagedValue: { color: "#f8fafc", fontSize: 14, fontWeight: "900", marginTop: 3 },
  orderBookStagedButton: { minWidth: 82, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#dbeafe", paddingHorizontal: 12 },
  orderBookStagedButtonDisabled: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247" },
  orderBookStagedButtonText: { color: "#0b1220", fontSize: 12, fontWeight: "900" },
  orderBookStagedButtonTextDisabled: { color: "#64748b" },
  orderBookColumns: { flexDirection: "row", gap: 10, marginTop: 12 },
  orderBookColumn: { flex: 1, gap: 8, padding: 10, borderRadius: 9, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  orderBookColumnHeader: { minHeight: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  orderBookColumnLabel: { color: "#64748b", fontSize: 10, fontWeight: "900" },
  orderBookColumnMeta: { color: "#64748b", fontSize: 10, fontWeight: "800" },
  orderBookPrice: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  orderBookSize: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  orderBookLadder: { marginTop: 12, overflow: "hidden", borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  orderBookLadderHeader: { minHeight: 40, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  orderBookLadderHeaderText: { flex: 1, color: "#64748b", fontSize: 11, fontWeight: "900", textAlign: "right" },
  orderBookLadderRow: { minHeight: 42, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: "#111827" },
  orderBookLadderRowSelected: { borderColor: "#dbeafe", borderTopWidth: 2 },
  orderBookAskRow: { backgroundColor: "rgba(127, 29, 29, 0.12)" },
  orderBookBidRow: { backgroundColor: "rgba(6, 95, 70, 0.12)" },
  orderBookLadderBarTrack: { position: "absolute", top: 9, right: 12, bottom: 9, width: "58%", overflow: "hidden", borderRadius: 6 },
  orderBookAskBar: { height: "100%", marginLeft: "auto", borderRadius: 6, backgroundColor: "rgba(239, 68, 68, 0.22)" },
  orderBookBidBar: { height: "100%", marginLeft: "auto", borderRadius: 6, backgroundColor: "rgba(34, 197, 94, 0.22)" },
  orderBookLadderPrice: { flex: 1, zIndex: 1, fontSize: 14, fontWeight: "900", textAlign: "right" },
  orderBookAskPrice: { color: "#f87171" },
  orderBookBidPrice: { color: "#22c55e" },
  orderBookLadderCell: { flex: 1, zIndex: 1, color: "#d1d5db", fontSize: 13, fontWeight: "900", textAlign: "right" },
  orderBookLadderValue: { flex: 1, zIndex: 1, color: "#94a3b8", fontSize: 13, fontWeight: "900", textAlign: "right" },
  orderBookSpreadSeparator: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, backgroundColor: "#070c14" },
  orderBookSpreadLine: { flex: 1, height: 1, backgroundColor: "#334155" },
  orderBookSpreadText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  depthLevelRow: { minHeight: 42, justifyContent: "center", gap: 6 },
  depthLevelValues: { minHeight: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5 },
  depthBarTrack: { height: 6, overflow: "hidden", borderRadius: 999, backgroundColor: "#111827" },
  depthBidBar: { height: 6, borderRadius: 999, backgroundColor: "#0a8f61" },
  depthAskBar: { height: 6, borderRadius: 999, backgroundColor: "#ef4444" },
});
