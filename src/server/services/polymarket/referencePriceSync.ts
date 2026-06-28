import { prisma } from "@/lib/db";
import { refreshPolymarketReferenceSnapshots } from "@/server/services/polymarketReferenceSnapshots";

export async function syncPolymarketReferencePricesOnce(options: {
  marketId?: string | null;
  eventSlug?: string | null;
  onlyMmEnabled?: boolean;
  includePendingReview?: boolean;
} = {}) {
  return refreshPolymarketReferenceSnapshots({
    marketId: options.marketId,
    eventSlug: options.eventSlug,
    onlyMmEnabled: options.onlyMmEnabled,
    includePendingReview: options.includePendingReview,
  });
}

export async function listAdminReferencePrices(options: {
  marketId?: string | null;
  source?: string | null;
} = {}) {
  const snapshots = await prisma.referenceQuoteSnapshot.findMany({
    where: {
      ...(options.marketId ? { marketId: options.marketId } : {}),
      source: options.source ?? "polymarket",
    },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      market: {
        select: {
          id: true,
          title: true,
          externalSlug: true,
          externalMarketId: true,
          conditionId: true,
          referenceSource: true,
        },
      },
      outcome: {
        select: {
          id: true,
          name: true,
          referenceTokenId: true,
          referenceOutcomeLabel: true,
        },
      },
    },
  });

  return snapshots.map((snapshot) => {
    const bid = decimalToNumber(snapshot.bestBid);
    const ask = decimalToNumber(snapshot.bestAsk);
    return {
      id: snapshot.id,
      source: snapshot.source,
      internalMarketId: snapshot.marketId,
      internalOutcomeId: snapshot.outcomeId,
      externalMarketId: snapshot.externalMarketId,
      externalOutcomeId: snapshot.outcomeLabel,
      tokenId: snapshot.tokenId,
      bid,
      ask,
      mid: bid != null && ask != null ? Number(((bid + ask) / 2).toFixed(6)) : decimalToNumber(snapshot.outcomePrice),
      last: decimalToNumber(snapshot.lastTradePrice),
      liquidity: decimalToNumber(snapshot.liquidityClob) ?? decimalToNumber(snapshot.liquidity),
      confidence: confidenceFor(bid, ask),
      updatedAt: snapshot.updatedAt.toISOString(),
      staleAfterSeconds: 15,
      raw: {
        qualityStatus: snapshot.qualityStatus,
        reason: snapshot.reason,
        acceptingOrders: snapshot.acceptingOrders,
        fetchedAt: snapshot.fetchedAt.toISOString(),
        spread: decimalToNumber(snapshot.spread),
        volume: decimalToNumber(snapshot.volume),
        volume24hr: decimalToNumber(snapshot.volume24hr),
      },
      market: snapshot.market,
      outcome: snapshot.outcome,
    };
  });
}

function confidenceFor(bid: number | null, ask: number | null) {
  if (bid != null && ask != null && bid <= ask) return "high";
  if (bid != null || ask != null) return "low";
  return "unavailable";
}

function decimalToNumber(value: { toString(): string } | null | undefined) {
  return value == null ? null : Number(value.toString());
}
