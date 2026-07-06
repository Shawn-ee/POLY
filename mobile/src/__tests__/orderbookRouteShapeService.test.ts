import { describe, expect, test } from "vitest";
import { assertOrderbookRoutePayloadShape } from "../services/orderbookRouteShapeService";

const orderbookPayload = () => ({
  marketId: "match-winner",
  outcomeId: null,
  generatedAt: "2026-07-06T08:00:00.000Z",
  availability: {
    source: "market-source-updated-at",
    status: "ready" as const,
    marketStatus: "LIVE",
    lastUpdated: "2026-07-06T07:59:00.000Z",
    stalenessSeconds: 30,
    staleAfterSeconds: 90,
    isStale: false,
    isSuspended: false,
    isDelayed: false,
    reason: "Selected market is live and fresh.",
  },
  emptyState: null,
  levels: [
    { outcomeId: "home", side: "bid" as const, price: 0.42, shares: 120, total: 50.4 },
    { outcomeId: "away", side: "ask" as const, price: 0.6, shares: 100, total: 60 },
  ],
  bids: [{ outcomeId: "home", price: 0.42, size: 120 }],
  asks: [{ outcomeId: "away", price: 0.6, size: 100 }],
});

describe("orderbook route shape service", () => {
  test("accepts valid orderbook route payloads", () => {
    expect(() => assertOrderbookRoutePayloadShape(orderbookPayload(), "match-winner")).not.toThrow();
  });

  test("rejects orderbook payloads for the wrong market", () => {
    const payload = orderbookPayload();
    payload.marketId = "other-market";

    expect(() => assertOrderbookRoutePayloadShape(payload, "match-winner")).toThrow(/requested market match-winner/);
  });

  test("rejects malformed level numbers before visible depth apply", () => {
    const payload = orderbookPayload();
    (payload.levels[0] as { shares: unknown }).shares = Number.NaN;

    expect(() => assertOrderbookRoutePayloadShape(payload, "match-winner")).toThrow(/malformed levels shares/);
  });

  test("rejects malformed availability before visible depth apply", () => {
    const payload = orderbookPayload();
    (payload.availability as { status: unknown }).status = "unknown";

    expect(() => assertOrderbookRoutePayloadShape(payload, "match-winner")).toThrow(/availability status/);
  });
});
