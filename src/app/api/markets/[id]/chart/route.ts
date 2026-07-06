import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";

const CHART_RANGES = ["1H", "1D", "1W", "1M", "MAX"] as const;

type ChartRange = (typeof CHART_RANGES)[number];

const chartRange = (value: string | null): ChartRange => {
  const normalized = (value ?? "1W").trim().toUpperCase();
  return CHART_RANGES.includes(normalized as ChartRange) ? normalized as ChartRange : "1W";
};

const probabilityFromPrice = (price: number) => {
  if (!Number.isFinite(price)) return null;
  if (price > 1) return Math.max(1, Math.min(99, Math.round(price)));
  return Math.max(1, Math.min(99, Math.round(price * 100)));
};

export const serializeMarketChart = async ({
  marketId,
  range,
  userId,
  now = Date.now(),
}: {
  marketId: string;
  range: ChartRange;
  userId: string | null;
  now?: number;
}) => {
  const cutoff = (() => {
    if (range === "1H") return new Date(now - 60 * 60 * 1000);
    if (range === "1D") return new Date(now - 24 * 60 * 60 * 1000);
    if (range === "1W") return new Date(now - 7 * 24 * 60 * 60 * 1000);
    if (range === "1M") return new Date(now - 30 * 24 * 60 * 60 * 1000);
    return null;
  })();

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!market) {
    return { body: { error: "Market not found." }, status: 404 };
  }
  try {
    await assertMarketVisibleToUser({ market, userId });
  } catch (error) {
    const response = toGuardResponse(error);
    return { body: response.body, status: response.status };
  }

  const snapshots = await prisma.marketOutcomeSnapshot.findMany({
    where: {
      marketId,
      ...(cutoff ? { ts: { gte: cutoff } } : {}),
    },
    orderBy: { ts: "asc" },
  });

  const capped =
    snapshots.length > 5000
      ? snapshots.slice(snapshots.length - 5000)
      : snapshots;

  const series: Record<string, { ts: string; price: number }[]> = {};
  const history: Array<{ outcomeId: string; timestamp: string; price: number; probability: number }> = [];
  for (const snap of capped) {
    const price = Number(snap.price);
    const probability = probabilityFromPrice(price);
    if (probability == null) continue;
    const timestamp = snap.ts.toISOString();
    if (!series[snap.outcomeId]) series[snap.outcomeId] = [];
    series[snap.outcomeId].push({
      ts: timestamp,
      price,
    });
    history.push({ outcomeId: snap.outcomeId, timestamp, price, probability });
  }
  const lastUpdated = history.at(-1)?.timestamp ?? null;

  return { body: {
    marketId,
    source: history.length > 0 && market.referenceSource === "polymarket"
      ? "polymarket-clob-prices-history"
      : history.length > 0
        ? "market-outcome-snapshot"
        : "empty",
    range,
    ranges: CHART_RANGES,
    generatedAt: new Date(now).toISOString(),
    lastUpdated,
    emptyState: history.length === 0 ? "no-history" : null,
    outcomes: market.outcomes.map((o) => ({ id: o.id, name: o.name })),
    history,
    series,
  }, status: 200 };
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getUserId();
  const url = new URL(request.url);
  const range = chartRange(url.searchParams.get("range"));

  const response = await serializeMarketChart({ marketId: id, range, userId });
  return NextResponse.json(response.body, { status: response.status });
}
