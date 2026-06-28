export const WORLD_CUP_MARKET_SECTIONS = [
  { key: "match", label: "Match" },
  { key: "qualify", label: "Qualify" },
  { key: "first_half", label: "1st Half" },
  { key: "corners", label: "Corners" },
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "shots", label: "Shots" },
  { key: "player_prop", label: "Player Props" },
  { key: "team_prop", label: "Team Props" },
  { key: "special", label: "Specials" },
  { key: "live", label: "Live" },
] as const;

export type WorldCupMarketSectionKey = (typeof WORLD_CUP_MARKET_SECTIONS)[number]["key"];

export type WorldCupOutcomeLike = {
  id: string;
  name: string;
  label?: string | null;
  code?: string | null;
  side?: string | null;
  status?: string | null;
  displayOrder?: number | null;
  price?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
};

export type WorldCupMarketLike = {
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
  pricesByOutcome?: Record<string, number | null>;
  outcomes: WorldCupOutcomeLike[];
};

export type WorldCupMarketLine<TMarket extends WorldCupMarketLike = WorldCupMarketLike> = {
  key: string;
  line: string | null;
  label: string;
  market: TMarket;
  outcomes: WorldCupOutcomeLike[];
  selections: Array<{
    key: string;
    market: TMarket;
    outcome: WorldCupOutcomeLike;
    label: string;
    price: number | null;
  }>;
};

export type WorldCupMarketBundle<TMarket extends WorldCupMarketLike = WorldCupMarketLike> = {
  key: string;
  title: string;
  description: string;
  lineSelectable: boolean;
  defaultLineKey: string;
  markets: TMarket[];
  lines: WorldCupMarketLine<TMarket>[];
};

export type WorldCupMarketSection<TMarket extends WorldCupMarketLike = WorldCupMarketLike> = {
  key: WorldCupMarketSectionKey;
  label: string;
  marketCount: number;
  bundles: WorldCupMarketBundle<TMarket>[];
};

const sectionAliases: Record<string, WorldCupMarketSectionKey> = {
  assist: "assists",
  assists: "assists",
  corner: "corners",
  corners: "corners",
  first_half: "first_half",
  first_team_to_score: "goals",
  game_prop: "goals",
  game_props: "goals",
  goal: "goals",
  goals: "goals",
  match: "match",
  main: "match",
  moneyline: "match",
  period_prop: "first_half",
  player_prop: "player_prop",
  qualify: "qualify",
  shots: "shots",
  special: "special",
  specials: "special",
  team_prop: "team_prop",
  team_props: "team_prop",
  team_total: "team_prop",
  team_totals: "team_prop",
  total: "goals",
  totals: "goals",
  live: "live",
};

const marketTypeSections: Record<string, WorldCupMarketSectionKey> = {
  both_teams_to_score: "goals",
  clean_sheet: "goals",
  corner_prop: "corners",
  correct_score: "special",
  draw_no_bet: "match",
  first_team_to_score: "goals",
  match_winner_1x2: "match",
  moneyline: "match",
  player_prop: "player_prop",
  spread: "match",
  team_prop: "team_prop",
  team_to_qualify: "qualify",
  team_total_goals: "team_prop",
  total: "match",
  total_goals: "match",
};

export function normalizeWorldCupSection(value: string | null | undefined): WorldCupMarketSectionKey | null {
  if (!value) return null;
  const normalized = normalizeToken(value);
  return sectionAliases[normalized] ?? null;
}

export function getWorldCupMarketSectionKey(market: WorldCupMarketLike): WorldCupMarketSectionKey {
  const marketType = normalizeToken(market.marketType);
  if (marketType && marketTypeSections[marketType]) return marketTypeSections[marketType];
  const groupSection = normalizeWorldCupSection(market.marketGroupKey);
  if (groupSection) return groupSection;
  return "match";
}

export function buildWorldCupMarketSections<TMarket extends WorldCupMarketLike>(
  markets: TMarket[],
): WorldCupMarketSection<TMarket>[] {
  const bySection = new Map<WorldCupMarketSectionKey, TMarket[]>();
  for (const market of markets) {
    const sectionKey = getWorldCupMarketSectionKey(market);
    bySection.set(sectionKey, [...(bySection.get(sectionKey) ?? []), market]);
  }

  return WORLD_CUP_MARKET_SECTIONS.map((section) => {
    const sectionMarkets = bySection.get(section.key) ?? [];
    return {
      ...section,
      marketCount: sectionMarkets.length,
      bundles: buildWorldCupMarketBundles(sectionMarkets),
    };
  });
}

export function buildWorldCupMarketBundles<TMarket extends WorldCupMarketLike>(
  markets: TMarket[],
): WorldCupMarketBundle<TMarket>[] {
  const buckets = new Map<string, TMarket[]>();
  for (const market of markets) {
    const key = getWorldCupMarketBundleKey(market);
    buckets.set(key, [...(buckets.get(key) ?? []), market]);
  }

  return Array.from(buckets.entries())
    .map(([key, bucketMarkets]) => {
      const sortedMarkets = [...bucketMarkets].sort(compareMarketsForDisplay);
      const lines = key === "spread" ? buildSpreadLines(sortedMarkets) : buildStandardLines(sortedMarkets);
      const lineSelectable = isLineSelectableBundle(key, lines);
      return {
        key,
        title: getWorldCupBundleTitle(key, sortedMarkets),
        description: getWorldCupBundleDescription(key, sortedMarkets),
        lineSelectable,
        defaultLineKey: getDefaultLineKey(lines, lineSelectable),
        markets: sortedMarkets,
        lines,
      };
    })
    .sort((left, right) => {
      const leftOrder = left.markets[0]?.displayOrder ?? 0;
      const rightOrder = right.markets[0]?.displayOrder ?? 0;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.title.localeCompare(right.title);
    });
}

export function getWorldCupMarketBundleKey(market: WorldCupMarketLike) {
  const marketType = normalizeToken(market.marketType);
  if (marketType === "match_winner_1x2" || marketType === "moneyline" || marketType === "draw_no_bet") {
    return "match-result";
  }
  if (marketType === "spread") return "spread";
  if (marketType === "total" || marketType === "total_goals") return "total";
  if (marketType === "team_total_goals") return `team-total-${normalizeToken(market.participantName) || "team"}`;
  if (marketType === "both_teams_to_score") return "both-teams-score";
  if (marketType === "first_team_to_score") return "first-team-score";
  if (marketType === "clean_sheet") return "clean-sheet";
  const section = getWorldCupMarketSectionKey(market);
  return `${section}-${marketType || "market"}-${normalizeToken(market.participantName) || "all"}`;
}

export function getWorldCupMarketLineKey(market: WorldCupMarketLike) {
  const rawLine = market.line == null || market.line === "" ? "default" : String(market.line);
  return `${getWorldCupMarketBundleKey(market)}:${normalizeToken(rawLine) || "default"}:${market.id}`;
}

export function getSelectedWorldCupLine<TMarket extends WorldCupMarketLike>(
  bundle: WorldCupMarketBundle<TMarket>,
  selectedLineKey: string | undefined,
) {
  return (
    bundle.lines.find((line) => line.key === selectedLineKey) ??
    bundle.lines.find((line) => line.key === bundle.defaultLineKey) ??
    bundle.lines[0] ??
    null
  );
}

export function findWorldCupOutcomeSelection<TMarket extends WorldCupMarketLike>(
  sections: WorldCupMarketSection<TMarket>[],
  outcomeId: string | null,
) {
  if (!outcomeId) return null;
  for (const section of sections) {
    for (const bundle of section.bundles) {
      for (const line of bundle.lines) {
        const selection = line.selections.find((item) => item.outcome.id === outcomeId);
        if (selection) {
          return {
            section,
            bundle,
            line,
            selection,
          };
        }
      }
    }
  }
  return null;
}

export function getOutcomeDisplayPrice(market: WorldCupMarketLike, outcome: WorldCupOutcomeLike) {
  return outcome.price ?? market.pricesByOutcome?.[outcome.id] ?? null;
}

export function estimateWorldCupTicket(params: { amount: number; price: number | null }) {
  const amount = Number.isFinite(params.amount) && params.amount > 0 ? params.amount : 0;
  const price = typeof params.price === "number" && Number.isFinite(params.price) && params.price > 0 ? params.price : null;
  const shares = price ? amount / price : 0;
  return {
    cost: amount,
    shares,
    potentialPayout: shares,
    potentialProfit: Math.max(0, shares - amount),
  };
}

export type WorldCupComboLeg = {
  marketId: string;
  outcomeId: string;
  label: string;
  marketTitle: string;
  line: string | null;
  price: number | null;
};

export function canAddWorldCupComboLeg(legs: WorldCupComboLeg[], nextLeg: WorldCupComboLeg) {
  if (!nextLeg.marketId || !nextLeg.outcomeId) return false;
  if (legs.some((leg) => leg.outcomeId === nextLeg.outcomeId)) return false;
  return !legs.some((leg) => leg.marketId === nextLeg.marketId);
}

export function estimateWorldCupComboTicket(params: { amount: number; legs: WorldCupComboLeg[] }) {
  const amount = Number.isFinite(params.amount) && params.amount > 0 ? params.amount : 0;
  const validPrices = params.legs
    .map((leg) => leg.price)
    .filter((price): price is number => typeof price === "number" && Number.isFinite(price) && price > 0);
  const comboPrice = validPrices.length === params.legs.length && validPrices.length >= 2
    ? validPrices.reduce((product, price) => product * price, 1)
    : null;
  const potentialPayout = comboPrice ? amount / comboPrice : 0;
  return {
    legCount: params.legs.length,
    valid: Boolean(comboPrice),
    comboPrice,
    cost: amount,
    potentialPayout,
    potentialProfit: Math.max(0, potentialPayout - amount),
  };
}

export function formatWorldCupOutcomeLabel(outcome: WorldCupOutcomeLike) {
  const side = normalizeToken(outcome.side);
  if (side === "yes") return "Yes";
  if (side === "no") return "No";
  if (side === "over") return "Over";
  if (side === "under") return "Under";
  if (side === "home") return "Home";
  if (side === "away") return "Away";
  if (side === "draw") return "Draw";
  return outcome.label ?? outcome.name;
}

export function formatWorldCupMarketRowTitle(market: WorldCupMarketLike) {
  const marketType = normalizeToken(market.marketType);
  if (marketType === "match_winner_1x2" || marketType === "moneyline") return "Winner";
  if (marketType === "draw_no_bet") return `${market.participantName ?? cleanMarketTitle(market.title)} draw no bet`;
  if (marketType === "spread") return [market.participantName, formatSignedLine(market.line)].filter(Boolean).join(" ");
  if (marketType === "total" || marketType === "total_goals") {
    return [formatSignedLine(market.line), market.unit ?? "goals"].filter(Boolean).join(" ");
  }
  if (marketType === "team_total_goals") {
    return [market.participantName, formatSignedLine(market.line), market.unit ?? "goals"].filter(Boolean).join(" ");
  }
  if (marketType === "both_teams_to_score") return "Both teams to score";
  if (marketType === "first_team_to_score") return "First team to score";
  if (marketType === "clean_sheet") return `${market.participantName ?? "Team"} clean sheet`;
  return cleanMarketTitle(market.title);
}

export function formatWorldCupLineLabel(market: WorldCupMarketLike) {
  const marketType = normalizeToken(market.marketType);
  if (market.line == null || market.line === "") return "Default";
  if (marketType === "spread") return formatSignedLine(market.line);
  return String(market.line);
}

function getDefaultLineKey<TMarket extends WorldCupMarketLike>(
  lines: WorldCupMarketLine<TMarket>[],
  lineSelectable: boolean,
) {
  if (!lines.length) return "";
  if (!lineSelectable) return lines[0].key;
  const preferred = lines.find((line) => line.line === "2.5") ?? lines.find((line) => line.line === "1.5");
  return preferred?.key ?? lines[0].key;
}

function buildStandardLines<TMarket extends WorldCupMarketLike>(markets: TMarket[]): WorldCupMarketLine<TMarket>[] {
  return markets.map((market) => {
    const outcomes = [...market.outcomes].sort(compareOutcomesForDisplay);
    return {
      key: getWorldCupMarketLineKey(market),
      line: market.line == null || market.line === "" ? null : String(market.line),
      label: formatWorldCupLineLabel(market),
      market,
      outcomes,
      selections: outcomes.map((outcome) => ({
        key: `${market.id}:${outcome.id}`,
        market,
        outcome,
        label: formatWorldCupOutcomeLabel(outcome),
        price: getOutcomeDisplayPrice(market, outcome),
      })),
    };
  });
}

function buildSpreadLines<TMarket extends WorldCupMarketLike>(markets: TMarket[]): WorldCupMarketLine<TMarket>[] {
  const byAbsoluteLine = new Map<string, TMarket[]>();
  for (const market of markets) {
    const absoluteLine = formatAbsoluteLine(market.line);
    byAbsoluteLine.set(absoluteLine, [...(byAbsoluteLine.get(absoluteLine) ?? []), market]);
  }

  return Array.from(byAbsoluteLine.entries())
    .flatMap(([absoluteLine, lineMarkets]) => {
      const sortedMarkets = [...lineMarkets].sort(compareMarketsForDisplay);
      const primaryMarket = sortedMarkets[0];
      if (!primaryMarket) return [];
      const selections = sortedMarkets.flatMap((market) => {
        const primaryOutcome =
          market.outcomes.find((outcome) => normalizeToken(outcome.side) === "yes") ??
          market.outcomes.find((outcome) => normalizeToken(outcome.code) === "yes") ??
          market.outcomes[0];
        if (!primaryOutcome) return [];
        return [
          {
            key: `${market.id}:${primaryOutcome.id}`,
            market,
            outcome: primaryOutcome,
            label: formatSpreadSelectionLabel(market),
            price: getOutcomeDisplayPrice(market, primaryOutcome),
          },
        ];
      });
      return [{
        key: `spread:${normalizeToken(absoluteLine)}`,
        line: absoluteLine,
        label: absoluteLine,
        market: primaryMarket,
        outcomes: selections.map((selection) => selection.outcome),
        selections,
      }];
    })
    .sort((left, right) => Number(left.line ?? 0) - Number(right.line ?? 0));
}

function isLineSelectableBundle<TMarket extends WorldCupMarketLike>(
  key: string,
  lines: WorldCupMarketLine<TMarket>[],
) {
  return (key === "spread" || key === "total" || key.startsWith("team-total-")) && lines.length > 1;
}

function getWorldCupBundleTitle(key: string, markets: WorldCupMarketLike[]) {
  if (key === "match-result") return "Match result";
  if (key === "spread") return "Spread";
  if (key === "total") return "Total";
  if (key.startsWith("team-total-")) return `${markets[0]?.participantName ?? "Team"} total`;
  if (key === "both-teams-score") return "Both teams to score";
  if (key === "first-team-score") return "First team to score";
  if (key === "clean-sheet") return "Clean sheet";
  return markets[0]?.marketGroupTitle ?? formatMarketType(markets[0]?.marketType);
}

function getWorldCupBundleDescription(key: string, markets: WorldCupMarketLike[]) {
  if (key === "match-result") return "Winner, draw, and draw-no-bet outcomes.";
  if (key === "spread") return "Pick a handicap line to compare team prices.";
  if (key === "total") return "Pick a goal total line to compare over and under.";
  if (key.startsWith("team-total-")) return "Pick a team goal line to compare over and under.";
  if (key === "both-teams-score") return "Whether both teams score at least once.";
  if (key === "first-team-score") return "Which side scores first, including no goal if listed.";
  return `${markets.length} related ${markets.length === 1 ? "market" : "markets"}.`;
}

function compareMarketsForDisplay(left: WorldCupMarketLike, right: WorldCupMarketLike) {
  const leftOrder = left.displayOrder ?? 0;
  const rightOrder = right.displayOrder ?? 0;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  const leftLine = Number(left.line);
  const rightLine = Number(right.line);
  if (Number.isFinite(leftLine) && Number.isFinite(rightLine) && leftLine !== rightLine) return leftLine - rightLine;
  return formatWorldCupMarketRowTitle(left).localeCompare(formatWorldCupMarketRowTitle(right));
}

function compareOutcomesForDisplay(left: WorldCupOutcomeLike, right: WorldCupOutcomeLike) {
  const leftOrder = left.displayOrder ?? 0;
  const rightOrder = right.displayOrder ?? 0;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return (left.label ?? left.name).localeCompare(right.label ?? right.name);
}

function cleanMarketTitle(title: string) {
  return title.includes(":") ? title.split(":").slice(1).join(":").trim() : title;
}

function formatMarketType(value: string | null | undefined) {
  if (!value) return "Market";
  return value.replaceAll("_", " ");
}

function formatSignedLine(value: string | number | null | undefined) {
  if (value == null || value === "") return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric > 0 ? `+${numeric}` : `${numeric}`;
}

function formatAbsoluteLine(value: string | number | null | undefined) {
  if (value == null || value === "") return "Default";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return String(Math.abs(numeric));
}

function formatSpreadSelectionLabel(market: WorldCupMarketLike) {
  return [market.participantName ?? cleanMarketTitle(market.title), formatSignedLine(market.line)].filter(Boolean).join(" ");
}

function normalizeToken(value: string | number | null | undefined) {
  if (value == null) return "";
  return String(value).trim().toLowerCase().replaceAll("+", "plus").replaceAll("-", "minus").replaceAll(".", "_").replaceAll(" ", "_");
}
