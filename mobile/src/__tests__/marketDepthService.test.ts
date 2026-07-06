import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import { applyDepthErrorToEvent, applyDepthLoadingToEvent, applyDepthStateToEvent, applyMarketDepthLoadingToEvent, depthMarketForEvent, loadMarketDepthState } from "../services/marketDepthService";
import { worldCupEvents } from "../mocks/worldCup";

describe("market depth service", () => {
  test("selects the primary live market for depth", () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;

    expect(depthMarketForEvent(event)?.id).toBe("france-argentina-live");
  });

  test("loads backend orderbook depth and applies it to the matching market", async () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const getOrderbook = vi.fn(async () => ({
      marketId: "france-argentina-live",
      outcomeId: null,
      generatedAt: "2026-06-15T12:00:00.000Z",
      availability: {
        source: "market-source-updated-at",
        status: "ready" as const,
        marketStatus: "LIVE",
        lastUpdated: "2026-06-15T11:59:30.000Z",
        stalenessSeconds: 30,
        staleAfterSeconds: 90,
        isStale: false,
        isSuspended: false,
        isDelayed: false,
        reason: "Selected market is live and fresh.",
      },
      emptyState: null,
      levels: [
        { outcomeId: "australia", side: "bid" as const, price: 0.4, shares: 120, total: 48 },
        { outcomeId: "egypt", side: "ask" as const, price: 0.63, shares: 90, total: 56.7 },
      ],
      bids: [],
      asks: [],
    }));

    const result = await loadMarketDepthState({ getOrderbook } as unknown as PolyApi, event);
    const hydrated = applyDepthStateToEvent(event, result);

    expect(getOrderbook).toHaveBeenCalledWith("france-argentina-live", { maxLevels: 24 });
    expect(result).toMatchObject({
      status: "ready",
      marketId: "france-argentina-live",
      lastUpdated: "2026-06-15T12:00:00.000Z",
      emptyState: null,
    });
    expect(hydrated.orderbookDepthSource).toBe("orderbook-route");
    expect(hydrated.orderbookDepthStatus).toBe("ready");
    expect(hydrated.orderbookDepthMarketId).toBe("france-argentina-live");
    expect(hydrated.orderbookAvailability).toMatchObject({
      status: "ready",
      marketStatus: "LIVE",
      stalenessSeconds: 30,
    });
    expect(hydrated.markets[0]?.orderbookDepth).toEqual(result.levels);
  });

  test("loads backend orderbook depth for an explicitly selected market", async () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const selectedMarketId = event.markets[1]!.id;
    const getOrderbook = vi.fn(async () => ({
      marketId: selectedMarketId,
      outcomeId: null,
      generatedAt: "2026-06-15T12:05:00.000Z",
      availability: {
        source: "market-updated-at",
        status: "suspended" as const,
        marketStatus: "PAUSED",
        lastUpdated: "2026-06-15T12:04:00.000Z",
        stalenessSeconds: 60,
        staleAfterSeconds: 90,
        isStale: false,
        isSuspended: true,
        isDelayed: false,
        reason: "Selected market is paused or suspended.",
      },
      emptyState: "no-depth" as const,
      levels: [],
      bids: [],
      asks: [],
    }));

    const result = await loadMarketDepthState({ getOrderbook } as unknown as PolyApi, event, selectedMarketId);
    const loading = applyMarketDepthLoadingToEvent(event, selectedMarketId);
    const hydrated = applyDepthStateToEvent(event, result);

    expect(depthMarketForEvent(event, selectedMarketId)?.id).toBe(selectedMarketId);
    expect(getOrderbook).toHaveBeenCalledWith(selectedMarketId, { maxLevels: 24 });
    expect(loading.orderbookDepthMarketId).toBe(selectedMarketId);
    expect(hydrated.orderbookDepthStatus).toBe("empty");
    expect(hydrated.orderbookDepthMarketId).toBe(selectedMarketId);
    expect(hydrated.orderbookDepthEmptyState).toBe("no-depth");
    expect(hydrated.orderbookAvailability?.status).toBe("suspended");
  });

  test("rejects malformed orderbook depth before applying route-backed rows", async () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const getOrderbook = vi.fn(async () => ({
      marketId: "france-argentina-live",
      outcomeId: null,
      generatedAt: "2026-06-15T12:00:00.000Z",
      emptyState: null,
      levels: [
        { outcomeId: "australia", side: "bid" as const, price: 0.4, shares: -120, total: 48 },
      ],
      bids: [],
      asks: [],
    }));

    await expect(loadMarketDepthState({ getOrderbook } as unknown as PolyApi, event)).rejects.toThrow(/malformed levels shares/);
  });

  test("preserves explicit empty and error states", () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const empty = applyDepthStateToEvent(event, {
      status: "empty",
      marketId: "france-argentina-live",
      lastUpdated: "2026-06-15T12:00:00.000Z",
      emptyState: "no-depth",
      availability: {
        source: "market-updated-at",
        status: "delayed",
        marketStatus: "UPCOMING",
        lastUpdated: "2026-06-15T11:59:00.000Z",
        stalenessSeconds: 60,
        staleAfterSeconds: 90,
        isStale: false,
        isSuspended: false,
        isDelayed: true,
        reason: "Selected market is not live yet.",
      },
      levels: [],
    });

    expect(empty.orderbookDepthStatus).toBe("empty");
    expect(empty.orderbookDepthEmptyState).toBe("no-depth");
    expect(empty.orderbookAvailability?.status).toBe("delayed");
    expect(applyDepthLoadingToEvent(event).orderbookDepthStatus).toBe("loading");
    expect(applyDepthErrorToEvent(event).orderbookDepthStatus).toBe("error");
  });
});
