export type PolymarketMarketType =
  | "yes_no"
  | "match_winner_1x2"
  | "total_goals"
  | "both_teams_to_score"
  | "team_to_qualify"
  | "correct_score_unsupported"
  | "unknown";

export type PolymarketOutcomeCandidate = {
  externalOutcomeId: string | null;
  tokenId: string | null;
  name: string;
  price: number | null;
  displayOrder: number;
  raw: unknown;
};

export type PolymarketMarketCandidate = {
  externalMarketId: string;
  conditionId: string | null;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  marketType: PolymarketMarketType;
  active: boolean;
  closed: boolean;
  archived: boolean;
  acceptingOrders: boolean;
  startDate: string | null;
  endDate: string | null;
  bestBid: number | null;
  bestAsk: number | null;
  mid: number | null;
  last: number | null;
  liquidity: number | null;
  volume: number | null;
  tags: string[];
  outcomes: PolymarketOutcomeCandidate[];
  raw: unknown;
};

export type PolymarketEventCandidate = {
  externalEventId: string | null;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string | null;
  image: string | null;
  icon: string | null;
  markets: PolymarketMarketCandidate[];
  raw: unknown;
};

export type PolymarketReferencePrice = {
  source: "polymarket";
  externalMarketId: string;
  externalOutcomeId: string | null;
  tokenId: string | null;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  last: number | null;
  liquidity: number | null;
  confidence: "high" | "medium" | "low" | "unavailable";
  updatedAt: string;
  staleAfterSeconds: number;
  raw: unknown;
};

export type PolymarketImportCandidate = {
  candidateId: string;
  source: "polymarket";
  event: PolymarketEventCandidate | null;
  market: PolymarketMarketCandidate;
  confidence: "high" | "medium" | "low";
  status: "draft" | "needs_review";
  duplicateKey: string;
  reasons: string[];
};

export type PolymarketGammaWire = Record<string, unknown>;
