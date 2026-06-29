import { prisma } from "@/lib/db";
import { parseReferenceReview } from "@/server/services/polymarketReferenceImport";
import { referenceSnapshotConfig } from "@/server/services/referenceQuoteSnapshots";
import { publicEventMarketWhere } from "@/server/services/worldCupPublicEligibility";

type HiddenReason =
  | "eligible"
  | "missing_polymarket_mapping"
  | "mapping_not_validated"
  | "draft_only"
  | "closed_or_stale"
  | "no_fresh_reference"
  | "reference_only"
  | "local_book";

async function main() {
  const commit = await currentCommit();
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - referenceSnapshotConfig.staleMs);
  const events = await prisma.event.findMany({
    where: { sportKey: "soccer", leagueKey: "world_cup" },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    include: {
      markets: {
        include: {
          outcomes: { where: { isActive: true }, select: { id: true, isTradable: true, referenceTokenId: true } },
          referenceQuoteSnapshots: {
            where: { source: "polymarket", fetchedAt: { gte: staleCutoff } },
            select: { id: true, outcomeId: true, bestBid: true, bestAsk: true, fetchedAt: true },
          },
          botQuoteConfigs: { where: { enabled: true, source: "polymarket" }, select: { id: true, dryRun: true } },
        },
      },
    },
  });

  const marketRows = events.flatMap((event) =>
    event.markets.map((market) => {
      const review = parseReferenceReview(market.referenceMetadata);
      const reason = classify({
        eventStatus: event.status,
        eventStartTime: event.startTime,
        marketStatus: market.status,
        visibility: market.visibility,
        isListed: market.isListed,
        referenceSource: market.referenceSource,
        importStatus: review.importStatus,
        referenceOnly: review.referenceOnly,
        freshReferenceCount: market.referenceQuoteSnapshots.length,
        outcomeCount: market.outcomes.length,
        botConfigCount: market.botQuoteConfigs.length,
      });
      return {
        eventId: event.id,
        eventSlug: event.slug,
        eventTitle: event.title,
        marketId: market.id,
        marketTitle: market.title,
        marketType: market.marketType,
        reason,
        eligible: reason === "eligible" || reason === "reference_only" || reason === "local_book",
        userTradeableCandidate: reason === "local_book",
      };
    }),
  );

  const hiddenReasons = countBy(marketRows.filter((row) => !row.eligible).map((row) => row.reason));
  const eligibleMarkets = marketRows.filter((row) => row.eligible);
  const eventsWithEligibleMarkets = new Set(eligibleMarkets.map((row) => row.eventId));
  const rawUnmappedOpenRows = marketRows.filter(
    (row) => row.reason === "missing_polymarket_mapping" || row.reason === "mapping_not_validated",
  );
  const userFacingLeakWithoutMapping = await prisma.market.count({
    where: {
      event: { sportKey: "soccer", leagueKey: "world_cup" },
      AND: [
        publicEventMarketWhere(staleCutoff),
        {
          OR: [
            { referenceSource: { not: "polymarket" } },
            { referenceSource: null },
            { referenceMetadata: { path: ["importStatus"], not: "approved" } },
          ],
        },
      ],
    },
  });

  const result = {
    generatedAt: now.toISOString(),
    commit,
    totals: {
      worldCupEvents: events.length,
      worldCupMarkets: marketRows.length,
      validatedMappedMarkets: marketRows.filter((row) => row.reason !== "missing_polymarket_mapping" && row.reason !== "mapping_not_validated").length,
      userFacingEligibleMarkets: eligibleMarkets.length,
      referenceOnlyMarkets: marketRows.filter((row) => row.reason === "reference_only").length,
      localBotBookMarkets: marketRows.filter((row) => row.reason === "local_book").length,
      hiddenFromUserFacing: marketRows.length - eligibleMarkets.length,
      eventsWithEligibleMarkets: eventsWithEligibleMarkets.size,
      eventsWithZeroEligibleMarkets: events.filter((event) => !eventsWithEligibleMarkets.has(event.id)).length,
      userFacingLeakWithoutMapping,
      rawUnmappedOpenRows: rawUnmappedOpenRows.length,
    },
    hiddenReasons,
    sampleEligibleMarkets: eligibleMarkets.slice(0, 10),
    sampleHiddenMarkets: marketRows.filter((row) => !row.eligible).slice(0, 10),
  };

  console.log(JSON.stringify(result, null, 2));
}

function classify(input: {
  eventStatus: string | null;
  eventStartTime: Date | null;
  marketStatus: string;
  visibility: string;
  isListed: boolean;
  referenceSource: string | null;
  importStatus: string | undefined;
  referenceOnly: boolean | undefined;
  freshReferenceCount: number;
  outcomeCount: number;
  botConfigCount: number;
}): HiddenReason {
  const eventStatus = (input.eventStatus ?? "").toLowerCase();
  const eventStale =
    input.eventStartTime != null &&
    Number.isFinite(input.eventStartTime.getTime()) &&
    input.eventStartTime.getTime() + 6 * 60 * 60 * 1000 < Date.now();
  if (eventStale || ["closed", "resolved", "ended", "canceled", "cancelled"].includes(eventStatus)) return "closed_or_stale";
  if (input.visibility !== "PUBLIC" || !input.isListed) return "draft_only";
  if (input.referenceSource !== "polymarket" || input.referenceOnly !== true) return "missing_polymarket_mapping";
  if (input.importStatus !== "approved") return "mapping_not_validated";
  if (!["LIVE", "ACTIVE", "OPEN", "UPCOMING"].includes(input.marketStatus)) return "closed_or_stale";
  if (input.freshReferenceCount < Math.max(1, input.outcomeCount)) return "no_fresh_reference";
  if (input.botConfigCount > 0) return "local_book";
  return "reference_only";
}

function countBy(values: HiddenReason[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

async function currentCommit() {
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    const result = await execFileAsync("git", ["rev-parse", "HEAD"]);
    return result.stdout.trim();
  } catch {
    return "unknown";
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
