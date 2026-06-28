import { prisma } from "@/lib/db";
import { getLatestReferenceQuotePlansForMarket } from "@/server/services/referenceQuoteSnapshots";
import { parseReferenceReview } from "@/server/services/polymarketReferenceImport";

type GroupMetadata = {
  title: string;
  slug: string;
  groupType: string;
  resolutionMode: string;
  source: string;
  expectedSumYesAround: number | null;
  negativeRiskLike: boolean;
  note: string | null;
};

export type GroupedEventRow = {
  marketId: string;
  yesOutcomeId: string | null;
  noOutcomeId: string | null;
  outcomeLabel: string;
  icon: string | null;
  question: string;
  probability: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  buyYesPrice: number | null;
  buyNoPrice: number | null;
  plannedBotBid: number | null;
  plannedBotAsk: number | null;
  mmEligible: boolean;
  botInitializationStatus: string | null;
  tradable: boolean;
  referenceOnly: boolean;
  volume24hr: number | null;
  liquidity: number | null;
  isFresh: boolean;
  qualityStatus: string | null;
  teamSlug: string;
};

export type GroupedEventReadModel = {
  event: {
    id: string;
    slug: string | null;
    title: string;
    description: string | null;
    category: string | null;
    status: string | null;
    source: string | null;
    image: string | null;
    icon: string | null;
  };
  marketGroup: GroupMetadata;
  rows: GroupedEventRow[];
  sumYes: number;
  importedOutcomeCount: number;
  allOutcomesImported: boolean;
  freshnessSummary: {
    freshCount: number;
    staleCount: number;
    averageAgeMs: number | null;
  };
  groupStatus: "healthy" | "incomplete" | "stale" | "overpriced" | "underpriced";
};

export async function getGroupedEventMarkets(eventSlug: string): Promise<GroupedEventReadModel | null> {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { visibility: "PUBLIC", isListed: true, referenceSource: "polymarket" },
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: { title: "asc" },
      },
    },
  });

  if (!event) {
    return null;
  }

  let group = parseGroupMetadata(event.metadata);
  let groupedMarkets: typeof event.markets;

  if (group) {
    // Primary path: use explicit referenceGroup metadata
    groupedMarkets = event.markets.filter((market) => {
      const metadata = normalizeRecord(market.referenceMetadata);
      const marketGroup = normalizeRecord(metadata.group);
      return marketGroup.slug === group!.slug;
    });
  } else {
    // Fallback: infer grouping from winner-style market title patterns
    const inferred = inferWinnerGroup(event.markets);
    if (!inferred) {
      return null;
    }
    group = inferred.group;
    groupedMarkets = inferred.markets;
  }

  const rows = await Promise.all(
    groupedMarkets.map(async (market) => {
      const plans = await getLatestReferenceQuotePlansForMarket(market.id);
      const yesPlan = plans.find((plan) => plan.outcomeName.trim().toUpperCase() === "YES") ?? plans[0] ?? null;
      const review = parseReferenceReview(market.referenceMetadata);
      const metadata = normalizeRecord(market.referenceMetadata);
      const marketGroup = normalizeRecord(metadata.group);
      const label =
        typeof marketGroup.outcomeLabel === "string"
          ? marketGroup.outcomeLabel
          : extractWinnerOutcomeLabel(market.title);
      const yesOutcome = market.outcomes.find(
        (outcome) => outcome.name.trim().toUpperCase() === "YES",
      );
      const noOutcome = market.outcomes.find(
        (outcome) => outcome.name.trim().toUpperCase() === "NO",
      );
      return {
        marketId: market.id,
        yesOutcomeId: yesOutcome?.id ?? null,
        noOutcomeId: noOutcome?.id ?? null,
        outcomeLabel: label,
        icon: extractMarketIcon(metadata, event),
        question: market.title,
        probability: yesPlan?.gammaOutcomePrice ?? null,
        bestBid: yesPlan?.gammaBestBid ?? null,
        bestAsk: yesPlan?.gammaBestAsk ?? null,
        buyYesPrice: yesPlan?.referenceAsk ?? null,
        buyNoPrice:
          yesPlan?.referenceBid != null
            ? Number((1 - yesPlan.referenceBid).toFixed(3))
            : null,
        plannedBotBid: yesPlan?.plannedBotBid ?? null,
        plannedBotAsk: yesPlan?.plannedBotAsk ?? null,
        mmEligible: yesPlan?.mmEligible ?? false,
        botInitializationStatus: extractBotStatus(metadata),
        tradable: review.tradable ?? false,
        referenceOnly: review.referenceOnly ?? true,
        volume24hr: yesPlan?.volume24hr ?? null,
        liquidity: yesPlan?.liquidity ?? null,
        isFresh: yesPlan?.isFresh ?? false,
        qualityStatus: yesPlan?.qualityStatus ?? null,
        teamSlug: slugify(label),
        ageMs: yesPlan?.ageMs ?? null,
      };
    }),
  );

  rows.sort((left, right) => (right.probability ?? -1) - (left.probability ?? -1));

  const sumYes = rows.reduce((sum, row) => sum + (row.probability ?? 0), 0);
  const freshCount = rows.filter((row) => row.isFresh).length;
  const staleCount = rows.length - freshCount;
  const ages = rows.map((row) => row.ageMs).filter((age): age is number => typeof age === "number");
  const averageAgeMs = ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : null;
  const importedCount = rows.length;
  const expectedCount = event.markets.length;

  return {
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      category: event.category,
      status: event.status,
      source: event.source,
      image: event.image,
      icon: event.icon,
    },
    marketGroup: group,
    rows: rows.map(({ ageMs: _ageMs, ...row }) => row),
    sumYes,
    importedOutcomeCount: importedCount,
    allOutcomesImported: importedCount === expectedCount,
    freshnessSummary: {
      freshCount,
      staleCount,
      averageAgeMs,
    },
    groupStatus: deriveGroupStatus({
      allOutcomesImported: importedCount === expectedCount,
      staleCount,
      sumYes,
    }),
  };
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const WINNER_TITLE_RE = /^Will\s+(?:the\s+)?(.+?)\s+win\s+(?:the\s+)?(.+?)\?$/i;

function inferWinnerGroup<T extends { id: string; title: string; referenceMetadata: unknown }>(
  markets: T[],
): { group: GroupMetadata; markets: T[] } | null {
  if (markets.length < 2) return null;

  const parsed = markets.map((market) => {
    const match = market.title.match(WINNER_TITLE_RE);
    return match
      ? { market, outcomeLabel: match[1].trim(), eventContext: match[2].trim().toLowerCase() }
      : null;
  });

  const valid = parsed.filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  // Need at least 2 winner-style markets with the same event context
  if (valid.length < 2) return null;

  // Group by event context (e.g., "2026 fifa world cup", "2026 nba finals")
  const contextCounts = new Map<string, typeof valid>();
  for (const entry of valid) {
    const existing = contextCounts.get(entry.eventContext) ?? [];
    existing.push(entry);
    contextCounts.set(entry.eventContext, existing);
  }

  // Use the largest context group
  const largestGroup = [...contextCounts.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (!largestGroup || largestGroup[1].length < 2) return null;

  const grouped = largestGroup[1];

  return {
    group: {
      title: "Winner",
      slug: "winner",
      groupType: "MUTUALLY_EXCLUSIVE",
      resolutionMode: "ONE_WINNER",
      source: "polymarket",
      expectedSumYesAround: 1,
      negativeRiskLike: true,
      note: "Inferred from winner-style market title patterns.",
    },
    markets: grouped.map((entry) => entry.market),
  };
}

function parseGroupMetadata(value: unknown): GroupMetadata | null {
  const object =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const referenceGroup =
    object.referenceGroup && typeof object.referenceGroup === "object" && !Array.isArray(object.referenceGroup)
      ? (object.referenceGroup as Record<string, unknown>)
      : null;
  if (!referenceGroup) return null;
  return {
    title: typeof referenceGroup.title === "string" ? referenceGroup.title : "Group",
    slug: typeof referenceGroup.slug === "string" ? referenceGroup.slug : "group",
    groupType: typeof referenceGroup.groupType === "string" ? referenceGroup.groupType : "MUTUALLY_EXCLUSIVE",
    resolutionMode: typeof referenceGroup.resolutionMode === "string" ? referenceGroup.resolutionMode : "ONE_WINNER",
    source: typeof referenceGroup.source === "string" ? referenceGroup.source : "polymarket",
    expectedSumYesAround:
      typeof referenceGroup.expectedSumYesAround === "number" ? referenceGroup.expectedSumYesAround : 1,
    negativeRiskLike: referenceGroup.negativeRiskLike === true,
    note: typeof referenceGroup.note === "string" ? referenceGroup.note : null,
  };
}

function extractWinnerOutcomeLabel(title: string): string {
  const match = title.match(WINNER_TITLE_RE);
  return match?.[1]?.trim() || title.trim();
}

function extractBotStatus(value: Record<string, unknown>) {
  const bot =
    value.botInitialization && typeof value.botInitialization === "object" && !Array.isArray(value.botInitialization)
      ? (value.botInitialization as Record<string, unknown>)
      : null;
  return bot && typeof bot.status === "string" ? bot.status : null;
}

function extractMarketIcon(referenceMetadata: Record<string, unknown>, event: { image: string | null; icon: string | null }) {
  const sourceMarket =
    referenceMetadata.sourceMarket && typeof referenceMetadata.sourceMarket === "object" && !Array.isArray(referenceMetadata.sourceMarket)
      ? (referenceMetadata.sourceMarket as Record<string, unknown>)
      : {};
  return typeof sourceMarket.icon === "string"
    ? sourceMarket.icon
    : typeof sourceMarket.image === "string"
      ? sourceMarket.image
      : event.icon ?? event.image;
}

function deriveGroupStatus(params: { allOutcomesImported: boolean; staleCount: number; sumYes: number }) {
  if (!params.allOutcomesImported) return "incomplete";
  if (params.staleCount > 0) return "stale";
  if (params.sumYes > 1.05) return "overpriced";
  if (params.sumYes < 0.95) return "underpriced";
  return "healthy";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
