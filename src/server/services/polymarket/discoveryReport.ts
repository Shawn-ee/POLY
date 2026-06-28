import {
  buildPolymarketImportCandidates,
  parsePolymarketMarketCandidate,
} from "@/server/services/polymarket/parser";
import {
  PolymarketGammaWire,
  PolymarketImportCandidate,
  PolymarketMarketCandidate,
} from "@/server/services/polymarket/types";

export type WorldCupDiscoveryIgnoredMarket = {
  externalMarketId: string | null;
  slug: string | null;
  title: string | null;
  reasons: string[];
};

export type WorldCupDiscoveryReport = {
  generatedAt: string;
  source: "fixture" | "polymarket";
  fixtureMode: boolean;
  liveSmoke: boolean;
  dryRun: true;
  autoImportEnabled: false;
  autoPromoteEnabled: false;
  parsedMarketCount: number;
  candidateCount: number;
  ignoredCount: number;
  candidates: PolymarketImportCandidate[];
  ignored: WorldCupDiscoveryIgnoredMarket[];
};

const EXCLUDED_DISCOVERY_REASONS = new Set(["not_world_cup_soccer", "unsupported_market_type"]);

export function buildWorldCupDiscoveryReport(params: {
  rawMarkets: PolymarketGammaWire[];
  source: "fixture" | "polymarket";
  fixtureMode: boolean;
  liveSmoke?: boolean;
  existingDuplicateKeys?: Set<string>;
  now?: string;
}): WorldCupDiscoveryReport {
  const parsed = params.rawMarkets
    .map(parsePolymarketMarketCandidate)
    .filter((market): market is PolymarketMarketCandidate => market != null);
  const importCandidates = buildPolymarketImportCandidates({
    event: null,
    markets: parsed,
    existingDuplicateKeys: params.existingDuplicateKeys,
  });

  const candidates: PolymarketImportCandidate[] = [];
  const ignored: WorldCupDiscoveryIgnoredMarket[] = [];
  for (const candidate of importCandidates) {
    const excludedReasons = candidate.reasons.filter((reason) => EXCLUDED_DISCOVERY_REASONS.has(reason));
    if (excludedReasons.length > 0) {
      ignored.push({
        externalMarketId: candidate.market.externalMarketId,
        slug: candidate.market.slug,
        title: candidate.market.title,
        reasons: excludedReasons,
      });
      continue;
    }
    candidates.push(candidate);
  }

  return {
    generatedAt: params.now ?? new Date().toISOString(),
    source: params.source,
    fixtureMode: params.fixtureMode,
    liveSmoke: params.liveSmoke === true,
    dryRun: true,
    autoImportEnabled: false,
    autoPromoteEnabled: false,
    parsedMarketCount: parsed.length,
    candidateCount: candidates.length,
    ignoredCount: ignored.length,
    candidates,
    ignored,
  };
}
