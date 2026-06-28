import { NextResponse } from "next/server";
import { getGroupedEventMarkets } from "@/server/services/eventGroupedMarkets";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  const grouped = await getGroupedEventMarkets(slug);
  if (!grouped) {
    return NextResponse.json({ error: "Grouped event not found." }, { status: 404 });
  }
  return NextResponse.json({
    event: {
      id: grouped.event.id,
      slug: grouped.event.slug,
      title: grouped.event.title,
      description: grouped.event.description,
      category: grouped.event.category,
      status: grouped.event.status,
      source: grouped.event.source,
      image: grouped.event.image,
      icon: grouped.event.icon,
    },
    marketGroup: {
      title: grouped.marketGroup.title,
      slug: grouped.marketGroup.slug,
      groupType: grouped.marketGroup.groupType,
      resolutionMode: grouped.marketGroup.resolutionMode,
      source: grouped.marketGroup.source,
      expectedSumYesAround: grouped.marketGroup.expectedSumYesAround,
      negativeRiskLike: grouped.marketGroup.negativeRiskLike,
      note: grouped.marketGroup.note,
    },
    rows: grouped.rows.map((row) => ({
      marketId: row.marketId,
      yesOutcomeId: row.yesOutcomeId,
      noOutcomeId: row.noOutcomeId,
      outcomeLabel: row.outcomeLabel,
      icon: row.icon,
      question: row.question,
      probability: row.probability,
      bestBid: row.bestBid,
      bestAsk: row.bestAsk,
      buyYesPrice: row.buyYesPrice,
      buyNoPrice: row.buyNoPrice,
      plannedBotBid: row.plannedBotBid,
      plannedBotAsk: row.plannedBotAsk,
      mmEligible: row.mmEligible,
      botInitializationStatus: row.botInitializationStatus,
      tradable: row.tradable,
      referenceOnly: row.referenceOnly,
      volume24hr: row.volume24hr,
      liquidity: row.liquidity,
      isFresh: row.isFresh,
      qualityStatus: row.qualityStatus,
      teamSlug: row.teamSlug,
    })),
    sumYes: grouped.sumYes,
    importedOutcomeCount: grouped.importedOutcomeCount,
    allOutcomesImported: grouped.allOutcomesImported,
    freshnessSummary: grouped.freshnessSummary,
    groupStatus: grouped.groupStatus,
  });
}
