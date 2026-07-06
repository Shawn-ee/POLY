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
});
