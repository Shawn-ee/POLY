import { describe, expect, test, vi } from "vitest";
import { loadPortfolioValueHistory } from "../services/portfolioValueHistoryService";
import type { PortfolioValueHistory } from "../types";

const validHistory: PortfolioValueHistory = {
  range: "1D" as const,
  ranges: ["1D", "1W", "1M", "All"],
  source: "portfolio-value-history-route",
  status: "ready" as const,
  generatedAt: "2026-07-06T08:00:00.000Z",
  lastUpdated: "2026-07-06T08:00:00.000Z",
  emptyState: null,
  points: [{ timestamp: "2026-07-06T08:00:00.000Z", value: 140.86, cash: 40.86, positionsValue: 100, pnl: 0.07 }],
};

describe("portfolio value history service", () => {
  test("loads and validates backend portfolio value history", async () => {
    const getPortfolioValueHistory = vi.fn(async () => validHistory);

    const history = await loadPortfolioValueHistory({ getPortfolioValueHistory, range: "1D" });

    expect(getPortfolioValueHistory).toHaveBeenCalledWith("1D");
    expect(history.source).toBe("portfolio-value-history-route");
    expect(history.points[0].value).toBe(140.86);
  });

  test("rejects malformed value history points", async () => {
    const getPortfolioValueHistory = vi.fn(async () => ({
      ...validHistory,
      points: [{ timestamp: "2026-07-06T08:00:00.000Z", value: "140.86", cash: 40.86, positionsValue: 100, pnl: 0.07 }],
    } as any));

    await expect(loadPortfolioValueHistory({ getPortfolioValueHistory })).rejects.toThrow("invalid point");
  });

  test("rejects wrong-range value history responses", async () => {
    const getPortfolioValueHistory = vi.fn(async () => ({
      ...validHistory,
      range: "1W",
    } as PortfolioValueHistory));

    await expect(loadPortfolioValueHistory({ getPortfolioValueHistory, range: "1D" })).rejects.toThrow("wrong range");
  });

  test("rejects missing route metadata", async () => {
    const getPortfolioValueHistory = vi.fn(async () => ({
      ...validHistory,
      generatedAt: "",
    }));

    await expect(loadPortfolioValueHistory({ getPortfolioValueHistory })).rejects.toThrow("missing generatedAt");
  });

  test("rejects invalid empty state and negative value fields", async () => {
    const invalidEmptyState = vi.fn(async () => ({
      ...validHistory,
      emptyState: "placeholder",
    } as unknown as PortfolioValueHistory));
    const negativeValue = vi.fn(async () => ({
      ...validHistory,
      points: [{ ...validHistory.points[0], cash: -1 }],
    }));

    await expect(loadPortfolioValueHistory({ getPortfolioValueHistory: invalidEmptyState })).rejects.toThrow("invalid emptyState");
    await expect(loadPortfolioValueHistory({ getPortfolioValueHistory: negativeValue })).rejects.toThrow("invalid point");
  });

  test("accepts value history point totals within currency tolerance", async () => {
    const getPortfolioValueHistory = vi.fn(async () => ({
      ...validHistory,
      points: [{ ...validHistory.points[0], value: 140.87, cash: 40.86, positionsValue: 100 }],
    }));

    await expect(loadPortfolioValueHistory({ getPortfolioValueHistory })).resolves.toMatchObject({
      points: [{ value: 140.87, cash: 40.86, positionsValue: 100 }],
    });
  });

  test("rejects inconsistent value history point totals before visible chart state", async () => {
    const getPortfolioValueHistory = vi.fn(async () => ({
      ...validHistory,
      points: [{ ...validHistory.points[0], value: 150, cash: 40.86, positionsValue: 100 }],
    }));

    await expect(loadPortfolioValueHistory({ getPortfolioValueHistory })).rejects.toThrow("inconsistent point total");
  });
});
