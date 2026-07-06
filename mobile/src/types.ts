export type Outcome = {
  id: string;
  name: string;
  label: string;
  side?: string | null;
  referenceTokenId?: string | null;
  referenceOutcomeLabel?: string | null;
  price: number | string | null;
  bestBid: number | string | null;
  bestAsk: number | string | null;
  bestBidSize?: number | string | null;
  bestAskSize?: number | string | null;
  isTradable: boolean;
};

export type EventLiveStat = {
  statId: string;
  label: string;
  home: string;
  away: string;
};

export type EventChartPoint = {
  outcomeId: string;
  timestamp: string;
  probability: number;
};

export type EventLiveDataStatus = {
  source: string;
  status: "ready" | "stale" | "suspended" | "delayed" | "unavailable";
  lastUpdated: string | null;
  stalenessSeconds: number | null;
  staleAfterSeconds: number;
  isStale: boolean;
  isSuspended: boolean;
  isDelayed: boolean;
  reason: string;
};

export type OrderbookAvailability = {
  source: string;
  status: "ready" | "stale" | "suspended" | "delayed" | "unavailable";
  marketStatus: string;
  lastUpdated: string | null;
  stalenessSeconds: number | null;
  staleAfterSeconds: number;
  isStale: boolean;
  isSuspended: boolean;
  isDelayed: boolean;
  reason: string;
};

export type MarketChartRange = "1H" | "1D" | "1W" | "1M" | "MAX";

export type MarketChartHistoryPoint = {
  outcomeId: string;
  timestamp: string;
  price: number;
  probability: number;
};

export type MarketChart = {
  marketId: string;
  source?: "polymarket-clob-prices-history" | "market-outcome-snapshot" | "empty" | string;
  range: MarketChartRange;
  ranges: MarketChartRange[];
  generatedAt: string;
  lastUpdated: string | null;
  emptyState: "no-history" | null;
  outcomes: Array<{ id: string; name: string }>;
  history: MarketChartHistoryPoint[];
  series: Record<string, Array<{ ts: string; price: number }>>;
};

export type PortfolioValueHistoryRange = "1D" | "1W" | "1M" | "All";

export type PortfolioValueHistoryPoint = {
  timestamp: string;
  value: number;
  cash: number;
  positionsValue: number;
  pnl: number;
};

export type PortfolioValueHistory = {
  range: PortfolioValueHistoryRange;
  ranges: PortfolioValueHistoryRange[];
  source: "portfolio-value-history-route" | string;
  status: "ready" | "empty";
  generatedAt: string;
  lastUpdated: string | null;
  emptyState: "no-history" | null;
  points: PortfolioValueHistoryPoint[];
};

export type MarketSelection = {
  selectorKey?: string | null;
  marketId?: string | null;
  outcomeId?: string | null;
  marketGroupKey?: string | null;
  marketGroupId?: string | null;
  marketGroupTitle?: string | null;
  marketType?: string | null;
  marketFamily?: string | null;
  displayLabel?: string | null;
  period?: string | null;
  line?: string | null;
  lineValue?: number | null;
  unit?: string | null;
  chart?: {
    targetMarketId?: string | null;
    status?: string | null;
    source?: string | null;
    pointCount?: number | null;
    outcomeCount?: number | null;
    range?: string | null;
    ranges?: string[];
    emptyState?: string | null;
  };
  outcomes?: Array<{
    id?: string | null;
    outcomeId?: string | null;
    side?: string | null;
    label?: string | null;
    tokenId?: string | null;
    referenceTokenId?: string | null;
    referenceOutcomeLabel?: string | null;
    isTradable?: boolean | null;
  }>;
};

export type OrderbookDepthLevel = {
  outcomeId?: string;
  side: "bid" | "ask";
  price: number;
  shares: number;
  total: number;
};

export type OrderbookBookLevel = {
  outcomeId: string;
  side: "bid" | "ask";
  price: number;
  shares: number;
  total: number;
};

export type OrderbookBook = {
  marketId: string;
  outcomeId: string | null;
  generatedAt: string;
  availability?: OrderbookAvailability;
  emptyState: "no-depth" | null;
  levels: OrderbookBookLevel[];
  bids: Array<{ outcomeId: string; price: number; size: number }>;
  asks: Array<{ outcomeId: string; price: number; size: number }>;
};

export type EventSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  sportKey: string | null;
  leagueKey: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  startTime: string | null;
  status: string;
  liveStatus: string | null;
  period: string | null;
  clock: string | null;
  homeScore: number | null;
  awayScore: number | null;
  imageUrl?: string | null;
  marketCount: number;
  activeMarketCount: number;
  metrics?: {
    source: string;
    marketCount: number;
    activeMarketCount: number;
    liquidity: number | string | null;
    volume24h: number | string | null;
    commentCount: number | null;
  };
  liveStats?: EventLiveStat[];
  liveDataStatus?: EventLiveDataStatus;
  chartHistory?: EventChartPoint[];
  marketProfile?: "to_advance" | "regulation_90" | "full_match_with_overtime";
  resultMode?: "can_draw" | "no_draw";
  gameRules?: {
    allowDraw: boolean;
    includesOvertime: boolean;
    description: string;
  };
  supportedMarketTypes?: Array<
    | "to_advance"
    | "regulation_90"
    | "full_match_with_overtime"
    | "spread"
    | "totals"
    | "team-total"
    | "first-half"
    | "second-half"
    | "player-props"
  >;
  topOutcomes?: string[];
  markets?: Market[];
};

export type Market = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  referenceSource?: string | null;
  externalSlug?: string | null;
  externalMarketId?: string | null;
  conditionId?: string | null;
  outcomes: Outcome[];
  event: EventSummary | null;
  rulesText: string | null;
  marketGroupKey?: string | null;
  marketGroupId?: string | null;
  marketGroupTitle: string | null;
  marketType?: string | null;
  period?: string | null;
  line?: string | null;
  selection?: MarketSelection | null;
  liquidity?: number | string | null;
  orderbookDepth?: OrderbookDepthLevel[];
  availability?: OrderbookAvailability;
  propCategory: string | null;
};

export type EventDetail = {
  event: EventSummary;
  markets: Market[];
};

export type Quote = {
  outcomeId: string;
  outcomeName: string;
  bestBid: string | number | null;
  bestAsk: string | number | null;
  bestBidSize?: string | number | null;
  bestAskSize?: string | number | null;
  midPrice: string | number | null;
  lastPrice: string | number | null;
};

export type PortfolioHistoryItem = {
  market: {
    id: string;
    title: string;
    status: string;
    resolveTime: string | null;
    resolvedOutcomeId: string | null;
    createdAt: string;
  };
  resolvedOutcomeName: string | null;
  totalBuyCostTokens: number;
  totalSellProceedsTokens: number;
  netInvestedTokens: number;
  winningsTokens: number;
  refundsTokens: number;
  realizedPnLTokens: number;
};

export type PortfolioCanceledOrderItem = {
  id: string;
  market: {
    id: string;
    title: string;
    status: string;
  };
  outcome: {
    id: string;
    name: string;
  };
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
    contractSide?: "yes" | "no";
    referenceSource?: string;
    externalSlug?: string;
    externalMarketId?: string;
    conditionId?: string;
    referenceTokenId?: string;
    referenceOutcomeLabel?: string;
    limitPrice?: number;
    limitSide?: "bid" | "ask";
    limitShares?: number;
  } | null;
  side: "BUY" | "SELL";
  status: string;
  price: number;
  size: number;
  remaining: number;
  canceledAt: string;
};

export type PortfolioRecentTradeItem = {
  id: string;
  market: {
    id: string;
    title: string;
    status: string;
  };
  outcome: {
    id: string;
    name: string;
  };
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
    contractSide?: "yes" | "no";
    referenceSource?: string;
    externalSlug?: string;
    externalMarketId?: string;
    conditionId?: string;
    referenceTokenId?: string;
    referenceOutcomeLabel?: string;
    limitPrice?: number;
    limitSide?: "bid" | "ask";
    limitShares?: number;
  } | null;
  side: "BUY" | "SELL";
  shares: number;
  cost: number;
  fee: number;
  createdAt: string;
};

export type PortfolioPositionItem = {
  market: {
    id: string;
    title: string;
    status: string;
    availability?: OrderbookAvailability;
    resolveTime: string | null;
    createdAt: string;
  };
  outcomeId?: string;
  outcome: string;
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
    contractSide?: "yes" | "no";
    referenceSource?: string;
    externalSlug?: string;
    externalMarketId?: string;
    conditionId?: string;
    referenceTokenId?: string;
    referenceOutcomeLabel?: string;
    limitPrice?: number;
    limitSide?: "bid" | "ask";
    limitShares?: number;
  } | null;
  shares: number;
  avgCost: number;
  currentPrice: number;
  bestBid?: number | string | null;
  bestAsk?: number | string | null;
  bestBidSize?: number | string | null;
  bestAskSize?: number | string | null;
  valueTokens: number;
  costBasisTokens: number;
  totalCostBasisTokens: number;
  pnlTokens: number;
};

export type PortfolioOpenOrderItem = {
  id: string;
  market: {
    id: string;
    title: string;
    status: string;
    availability?: OrderbookAvailability;
  };
  outcome: {
    id: string;
    name: string;
  };
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
    contractSide?: "yes" | "no";
    referenceSource?: string;
    externalSlug?: string;
    externalMarketId?: string;
    conditionId?: string;
    referenceTokenId?: string;
    referenceOutcomeLabel?: string;
    limitPrice?: number;
    limitSide?: "bid" | "ask";
    limitShares?: number;
  } | null;
  side: "BUY" | "SELL";
  status: string;
  price: number;
  size: number;
  remaining: number;
  reservedNotional: number;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioSnapshot = {
  walletAvailableUSDC: number;
  walletLockedUSDC: number;
  walletTotalUSDC: number;
  walletBalance: number;
  totalValue: number;
  totalCostBasis: number;
  totalRealizedPnl: number;
  totalPnl: number;
  positions: PortfolioPositionItem[];
  openOrders: PortfolioOpenOrderItem[];
  comboOrders: unknown[];
};

export type AccountBalance = {
  availableUSDC: number | string;
  lockedUSDC: number | string;
  totalUSDC: number | string;
  updatedAt?: string | null;
};

export type AccountProfile = {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  image?: string | null;
  hasCustomAvatar?: boolean;
  isAdmin?: boolean;
  walletAddress?: string | null;
  hasWalletLinked?: boolean;
  hasGoogleLinked?: boolean;
  createdAt?: string;
};

export type AccountNavigationItem = {
  id: string;
  label: string;
  icon: string;
  kind: "internal" | "external" | "placeholder";
  enabled: boolean;
  status: "available" | "unavailable";
  destination: string | null;
  reason?: string | null;
};

export type AccountNavigation = {
  source: "account-navigation-route" | string;
  generatedAt: string;
  items: AccountNavigationItem[];
};

export type ProfilePreferences = {
  locale: "en" | "zh";
  ticketDefaultAmount: string;
  ticketDefaultSide: "BUY" | "SELL";
  ticketDefaultSlippage?: string;
  savedEventIds: string[];
  updatedAt?: string;
};
