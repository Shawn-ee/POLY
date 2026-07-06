export type Locale = "en" | "zh";

export type AvailabilityStatus = "ready" | "stale" | "suspended" | "delayed" | "unavailable";

export type AvailabilityState = {
  source: string;
  status: AvailabilityStatus;
  marketStatus?: string;
  lastUpdated: string | null;
  stalenessSeconds: number | null;
  staleAfterSeconds: number;
  isStale: boolean;
  isSuspended: boolean;
  isDelayed: boolean;
  reason: string;
};

export type Outcome = {
  id: string;
  label: string;
  zhLabel: string;
  probability: number;
  side?: "yes" | "no" | "over" | "under" | "home" | "away" | "draw";
  referenceTokenId?: string | null;
  referenceOutcomeLabel?: string | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  bestBidSize?: number | null;
  bestAskSize?: number | null;
  color: string;
};

export type Market = {
  id: string;
  marketGroupId?: string;
  marketType?: "moneyline" | "to_advance" | "spread" | "totals" | "team-total" | "next-goal" | "prop" | "future";
  period?: "full-game" | "regulation" | "first-half" | "second-half";
  line?: string | null;
  referenceSource?: string | null;
  externalSlug?: string | null;
  externalMarketId?: string | null;
  conditionId?: string | null;
  title: string;
  zhTitle: string;
  type: "game-line" | "prop" | "future" | "live";
  liquidity?: number;
  orderbookDepth?: Array<{ outcomeId?: string; side: "bid" | "ask"; price: number; shares: number; total: number }>;
  availability?: AvailabilityState;
  outcomes: Outcome[];
};

export type EventMarketProfile = "to_advance" | "regulation_90" | "full_match_with_overtime";
export type EventResultMode = "can_draw" | "no_draw";
export type EventMarketType =
  | "to_advance"
  | "regulation_90"
  | "full_match_with_overtime"
  | "spread"
  | "totals"
  | "team-total"
  | "first-half"
  | "second-half"
  | "player-props";

export type Event = {
  id: string;
  title: string;
  zhTitle: string;
  league: string;
  startsAt: string;
  status: "live" | "today" | "tomorrow" | "future";
  tag: string;
  zhTag: string;
  teams: Array<{ name: string; zhName: string; flag: string }>;
  liveStats?: Array<{ statId: string; label: string; home: string; away: string }>;
  liveDataStatus?: AvailabilityState;
  chartHistory?: Array<{ outcomeId: string; timestamp: string; probability: number }>;
  chartHistorySource?: "embedded" | "market-chart-route" | "polymarket-clob-prices-history";
  chartHistoryStatus?: "idle" | "loading" | "ready" | "empty" | "error";
  chartHistoryRange?: "1D" | "1W" | "1M" | "MAX";
  chartHistoryLastUpdated?: string | null;
  chartHistoryEmptyState?: "no-history" | null;
  orderbookDepthSource?: "embedded" | "orderbook-route";
  orderbookDepthStatus?: "idle" | "loading" | "ready" | "empty" | "error";
  orderbookDepthMarketId?: string | null;
  orderbookDepthLastUpdated?: string | null;
  orderbookDepthEmptyState?: "no-depth" | null;
  orderbookAvailability?: AvailabilityState;
  marketProfile?: EventMarketProfile;
  resultMode?: EventResultMode;
  gameRules?: {
    allowDraw: boolean;
    includesOvertime: boolean;
    description: string;
  };
  supportedMarketTypes?: EventMarketType[];
  markets: Market[];
};

export const worldCupEvents: Event[] = [
  {
    id: "mexico-ecuador",
    title: "Mexico vs. Ecuador",
    zhTitle: "墨西哥 vs 厄瓜多尔",
    league: "World Cup",
    startsAt: "Today 8:00 PM",
    status: "today",
    tag: "Group Stage",
    zhTag: "小组赛",
    teams: [
      { name: "Mexico", zhName: "墨西哥", flag: "🇲🇽" },
      { name: "Ecuador", zhName: "厄瓜多尔", flag: "🇪🇨" },
    ],
    orderbookDepthSource: "embedded",
    orderbookDepthStatus: "ready",
    orderbookDepthMarketId: "mexico-ecuador-winner",
    orderbookDepthEmptyState: null,
    orderbookAvailability: {
      source: "deterministic-contract-fixture",
      status: "ready",
      marketStatus: "LIVE",
      lastUpdated: "2026-07-04T12:00:00.000Z",
      stalenessSeconds: 15,
      staleAfterSeconds: 90,
      isStale: false,
      isSuspended: false,
      isDelayed: false,
      reason: "DU-B visible UI proof fixture exposes provider-ready Book state.",
    },
    markets: [
      {
        id: "mexico-ecuador-winner",
        marketGroupId: "mexico-ecuador-game-lines",
        marketType: "moneyline",
        period: "regulation",
        line: null,
        referenceSource: "polymarket-fixture",
        externalSlug: "world-cup-2026-mexico-vs-ecuador",
        externalMarketId: "gamma-mexico-ecuador-winner",
        conditionId: "condition-mexico-ecuador-winner",
        title: "Match winner",
        zhTitle: "比赛获胜方",
        type: "game-line",
        liquidity: 48200,
        availability: {
          source: "deterministic-contract-fixture",
          status: "ready",
          marketStatus: "LIVE",
          lastUpdated: "2026-07-04T12:00:00.000Z",
          stalenessSeconds: 15,
          staleAfterSeconds: 90,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "DU-B visible UI proof fixture exposes provider-ready Book state.",
        },
        orderbookDepth: [
          { outcomeId: "mexico", side: "ask", price: 0.68, shares: 900, total: 612 },
          { outcomeId: "mexico", side: "ask", price: 0.67, shares: 620, total: 415.4 },
          { outcomeId: "mexico", side: "bid", price: 0.61, shares: 1280, total: 780.8 },
          { outcomeId: "mexico", side: "bid", price: 0.6, shares: 740, total: 444 },
          { outcomeId: "ecuador", side: "ask", price: 0.42, shares: 760, total: 319.2 },
          { outcomeId: "ecuador", side: "bid", price: 0.34, shares: 1100, total: 374 },
        ],
        outcomes: [
          { id: "mexico", label: "Mexico", zhLabel: "墨西哥", probability: 64, color: "#0a8f61" },
          { id: "ecuador", label: "Ecuador", zhLabel: "厄瓜多尔", probability: 36, color: "#f4c20d" },
        ],
      },
      {
        id: "mexico-ecuador-total",
        marketGroupId: "mexico-ecuador-game-lines",
        marketType: "totals",
        period: "regulation",
        line: "2.5",
        referenceSource: "polymarket-fixture",
        externalSlug: "world-cup-2026-mexico-vs-ecuador-total-goals-25",
        externalMarketId: "gamma-mexico-ecuador-total-25",
        conditionId: "condition-mexico-ecuador-total-25",
        title: "Total goals over 2.5",
        zhTitle: "总进球大于 2.5",
        type: "live",
        liquidity: 23600,
        availability: {
          source: "deterministic-contract-fixture",
          status: "ready",
          marketStatus: "LIVE",
          lastUpdated: "2026-07-04T12:00:00.000Z",
          stalenessSeconds: 18,
          staleAfterSeconds: 90,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "DU-B totals fixture carries line and period into Book and ticket.",
        },
        orderbookDepth: [
          { outcomeId: "over", side: "ask", price: 0.52, shares: 820, total: 426.4 },
          { outcomeId: "over", side: "ask", price: 0.51, shares: 610, total: 311.1 },
          { outcomeId: "over", side: "bid", price: 0.45, shares: 960, total: 432 },
          { outcomeId: "over", side: "bid", price: 0.44, shares: 680, total: 299.2 },
          { outcomeId: "under", side: "ask", price: 0.6, shares: 770, total: 462 },
          { outcomeId: "under", side: "bid", price: 0.53, shares: 1040, total: 551.2 },
        ],
        outcomes: [
          { id: "over", label: "Over", zhLabel: "大于", probability: 47, color: "#2563eb" },
          { id: "under", label: "Under", zhLabel: "小于", probability: 53, color: "#7c3aed" },
        ],
      },
      {
        id: "mexico-ecuador-spread",
        marketGroupId: "mexico-ecuador-game-lines",
        marketType: "spread",
        period: "regulation",
        line: "1.5",
        referenceSource: "polymarket-fixture",
        externalSlug: "world-cup-2026-mexico-vs-ecuador-spread-15",
        externalMarketId: "gamma-mexico-ecuador-spread-15",
        conditionId: "condition-mexico-ecuador-spread-15",
        title: "Mexico -1.5 spread",
        zhTitle: "Mexico -1.5 spread",
        type: "live",
        liquidity: 21400,
        availability: {
          source: "deterministic-contract-fixture",
          status: "ready",
          marketStatus: "LIVE",
          lastUpdated: "2026-07-04T12:00:00.000Z",
          stalenessSeconds: 20,
          staleAfterSeconds: 90,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "DU-B spread fixture carries structured line data into Book and ticket.",
        },
        orderbookDepth: [
          { outcomeId: "yes", side: "ask", price: 0.41, shares: 870, total: 356.7 },
          { outcomeId: "yes", side: "ask", price: 0.4, shares: 620, total: 248 },
          { outcomeId: "yes", side: "bid", price: 0.34, shares: 1120, total: 380.8 },
          { outcomeId: "yes", side: "bid", price: 0.33, shares: 730, total: 240.9 },
          { outcomeId: "no", side: "ask", price: 0.72, shares: 690, total: 496.8 },
          { outcomeId: "no", side: "bid", price: 0.65, shares: 930, total: 604.5 },
        ],
        outcomes: [
          { id: "yes", label: "Yes", zhLabel: "Yes", side: "yes", referenceTokenId: "token-spread-yes-15", referenceOutcomeLabel: "Yes", probability: 36, bestBid: 34, bestAsk: 41, bestBidSize: 1120, bestAskSize: 870, color: "#0a8f61" },
          { id: "no", label: "No", zhLabel: "No", side: "no", referenceTokenId: "token-spread-no-15", referenceOutcomeLabel: "No", probability: 64, bestBid: 65, bestAsk: 72, bestBidSize: 930, bestAskSize: 690, color: "#64748b" },
        ],
      },
      {
        id: "mexico-ecuador-both-score",
        title: "Both teams to score",
        zhTitle: "双方都进球",
        type: "prop",
        outcomes: [
          { id: "yes", label: "Yes", zhLabel: "是", probability: 51, color: "#0a8f61" },
          { id: "no", label: "No", zhLabel: "否", probability: 49, color: "#64748b" },
        ],
      },
      {
        id: "mexico-ecuador-first-goal",
        title: "First goal scorer team",
        zhTitle: "首球球队",
        type: "prop",
        outcomes: [
          { id: "mexico", label: "Mexico", zhLabel: "墨西哥", probability: 55, color: "#0a8f61" },
          { id: "ecuador", label: "Ecuador", zhLabel: "厄瓜多尔", probability: 45, color: "#f4c20d" },
        ],
      },
    ],
  },
  {
    id: "england-congo",
    title: "England vs. Congo DR",
    zhTitle: "英格兰 vs 刚果（金）",
    league: "World Cup",
    startsAt: "Tomorrow 11:00 AM",
    status: "tomorrow",
    tag: "International Friendly",
    zhTag: "国际友谊赛",
    teams: [
      { name: "England", zhName: "英格兰", flag: "🏴" },
      { name: "Congo DR", zhName: "刚果（金）", flag: "🇨🇩" },
    ],
    markets: [
      {
        id: "england-congo-winner",
        title: "Match winner",
        zhTitle: "比赛获胜方",
        type: "game-line",
        outcomes: [
          { id: "england", label: "England", zhLabel: "英格兰", probability: 88, color: "#ef233c" },
          { id: "congo", label: "Congo DR", zhLabel: "刚果（金）", probability: 12, color: "#0a84ff" },
        ],
      },
      {
        id: "england-clean-sheet",
        title: "England clean sheet",
        zhTitle: "英格兰零封",
        type: "prop",
        outcomes: [
          { id: "yes", label: "Yes", zhLabel: "是", probability: 58, color: "#0a8f61" },
          { id: "no", label: "No", zhLabel: "否", probability: 42, color: "#64748b" },
        ],
      },
    ],
  },
  {
    id: "france-argentina-final",
    title: "Australia vs. Egypt",
    zhTitle: "澳大利亚 vs 埃及",
    league: "World Cup",
    startsAt: "Live · 63'",
    status: "live",
    tag: "Live",
    zhTag: "滚球",
    teams: [
      { name: "Australia", zhName: "澳大利亚", flag: "🇦🇺" },
      { name: "Egypt", zhName: "埃及", flag: "🇪🇬" },
    ],
    markets: [
      {
        id: "france-argentina-live",
        marketGroupId: "aus-egy-live-game-lines",
        marketType: "moneyline",
        period: "regulation",
        line: null,
        title: "Live winner",
        zhTitle: "滚球获胜方",
        type: "live",
        liquidity: 60800,
        orderbookDepth: [
          { side: "bid", price: 0.59, shares: 8070.5, total: 293440.88 },
          { side: "ask", price: 0.63, shares: 246972.3, total: 289002.1 },
        ],
        outcomes: [
          { id: "australia", label: "Australia", zhLabel: "澳大利亚", side: "home", probability: 40, color: "#2563eb" },
          { id: "egypt", label: "Egypt", zhLabel: "埃及", side: "away", probability: 61, color: "#ef233c" },
        ],
      },
      {
        id: "france-argentina-next-goal",
        marketGroupId: "aus-egy-live-game-lines",
        marketType: "next-goal",
        period: "regulation",
        line: null,
        title: "Next goal",
        zhTitle: "下一球",
        type: "live",
        liquidity: 27400,
        outcomes: [
          { id: "australia", label: "Australia", zhLabel: "澳大利亚", side: "home", probability: 28, color: "#2563eb" },
          { id: "egypt", label: "Egypt", zhLabel: "埃及", side: "away", probability: 44, color: "#ef233c" },
          { id: "none", label: "No goal", zhLabel: "无进球", side: "no", probability: 18, color: "#94a3b8" },
        ],
      },
      {
        id: "australia-egypt-live-total",
        marketGroupId: "aus-egy-live-game-lines",
        marketType: "totals",
        period: "regulation",
        line: "2.5",
        title: "Live total goals over 2.5",
        zhTitle: "滚球总进球大于 2.5",
        type: "live",
        liquidity: 22300,
        outcomes: [
          { id: "over", label: "Over", zhLabel: "大于", side: "over", probability: 58, color: "#22c55e" },
          { id: "under", label: "Under", zhLabel: "小于", side: "under", probability: 42, color: "#64748b" },
        ],
      },
      {
        id: "australia-egypt-live-spread",
        marketGroupId: "aus-egy-live-game-lines",
        marketType: "spread",
        period: "regulation",
        line: "-0.5",
        title: "Egypt -0.5 live spread",
        zhTitle: "埃及 -0.5 滚球让球",
        type: "live",
        liquidity: 19800,
        outcomes: [
          { id: "yes", label: "Yes", zhLabel: "是", side: "yes", probability: 53, color: "#ef233c" },
          { id: "no", label: "No", zhLabel: "否", side: "no", probability: 47, color: "#64748b" },
        ],
      },
      {
        id: "australia-egypt-live-team-total",
        marketGroupId: "aus-egy-live-game-lines",
        marketType: "team-total",
        period: "regulation",
        line: "1.5",
        title: "Egypt team total over 1.5",
        zhTitle: "埃及进球大于 1.5",
        type: "live",
        liquidity: 17100,
        outcomes: [
          { id: "over", label: "Over", zhLabel: "大于", side: "over", probability: 49, color: "#ef233c" },
          { id: "under", label: "Under", zhLabel: "小于", side: "under", probability: 51, color: "#64748b" },
        ],
      },
    ],
    liveStats: [
      { statId: "possession", label: "Possession", home: "46%", away: "54%" },
      { statId: "shots", label: "Shots", home: "7", away: "10" },
      { statId: "shots-on-target", label: "Shots on target", home: "2", away: "5" },
      { statId: "corners", label: "Corners", home: "3", away: "6" },
      { statId: "expected-goals", label: "Expected goals", home: "0.84", away: "1.42" },
    ],
    chartHistory: [
      { outcomeId: "australia", timestamp: "55'", probability: 51 },
      { outcomeId: "australia", timestamp: "57'", probability: 49 },
      { outcomeId: "australia", timestamp: "59'", probability: 46 },
      { outcomeId: "australia", timestamp: "61'", probability: 43 },
      { outcomeId: "australia", timestamp: "63'", probability: 40 },
      { outcomeId: "egypt", timestamp: "55'", probability: 50 },
      { outcomeId: "egypt", timestamp: "57'", probability: 52 },
      { outcomeId: "egypt", timestamp: "59'", probability: 55 },
      { outcomeId: "egypt", timestamp: "61'", probability: 58 },
      { outcomeId: "egypt", timestamp: "63'", probability: 61 },
    ],
  },
];

export const worldCupFutures: Market[] = [
  {
    id: "world-cup-winner",
    title: "World Cup winner",
    zhTitle: "世界杯冠军",
    type: "future",
    outcomes: [
      { id: "france", label: "France", zhLabel: "法国", probability: 34, color: "#2563eb" },
      { id: "argentina", label: "Argentina", zhLabel: "阿根廷", probability: 20, color: "#60a5fa" },
      { id: "spain", label: "Spain", zhLabel: "西班牙", probability: 13, color: "#ef4444" },
      { id: "england", label: "England", zhLabel: "英格兰", probability: 9, color: "#f97316" },
      { id: "brazil", label: "Brazil", zhLabel: "巴西", probability: 8, color: "#16a34a" },
      { id: "portugal", label: "Portugal", zhLabel: "葡萄牙", probability: 6, color: "#dc2626" },
      { id: "germany", label: "Germany", zhLabel: "德国", probability: 5, color: "#eab308" },
      { id: "netherlands", label: "Netherlands", zhLabel: "荷兰", probability: 4, color: "#fb923c" },
      { id: "italy", label: "Italy", zhLabel: "意大利", probability: 3, color: "#0ea5e9" },
      { id: "uruguay", label: "Uruguay", zhLabel: "乌拉圭", probability: 2.8, color: "#38bdf8" },
      { id: "belgium", label: "Belgium", zhLabel: "比利时", probability: 2.4, color: "#facc15" },
      { id: "croatia", label: "Croatia", zhLabel: "克罗地亚", probability: 2.1, color: "#ef4444" },
      { id: "colombia", label: "Colombia", zhLabel: "哥伦比亚", probability: 1.9, color: "#f59e0b" },
      { id: "usa", label: "USA", zhLabel: "美国", probability: 1.7, color: "#2563eb" },
      { id: "mexico", label: "Mexico", zhLabel: "墨西哥", probability: 1.5, color: "#22c55e" },
      { id: "japan", label: "Japan", zhLabel: "日本", probability: 1.3, color: "#f43f5e" },
      { id: "morocco", label: "Morocco", zhLabel: "摩洛哥", probability: 1.1, color: "#be123c" },
      { id: "switzerland", label: "Switzerland", zhLabel: "瑞士", probability: 1, color: "#ef4444" },
      { id: "denmark", label: "Denmark", zhLabel: "丹麦", probability: 0.9, color: "#dc2626" },
      { id: "senegal", label: "Senegal", zhLabel: "塞内加尔", probability: 0.8, color: "#16a34a" },
      { id: "australia", label: "Australia", zhLabel: "澳大利亚", probability: 0.6, color: "#fbbf24" },
    ],
  },
  {
    id: "golden-boot",
    title: "Golden Boot winner",
    zhTitle: "金靴奖得主",
    type: "future",
    outcomes: [
      { id: "mbappe", label: "Mbappe", zhLabel: "姆巴佩", probability: 22, color: "#2563eb" },
      { id: "haaland", label: "Haaland", zhLabel: "哈兰德", probability: 18, color: "#0a8f61" },
      { id: "messi", label: "Messi", zhLabel: "梅西", probability: 13, color: "#60a5fa" },
    ],
  },
];
