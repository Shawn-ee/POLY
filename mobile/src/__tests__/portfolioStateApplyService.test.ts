import { describe, expect, test } from "vitest";
import type { LocalPortfolioState } from "../services/portfolioStateApplyService";
import { applyServerPortfolioState } from "../services/portfolioStateApplyService";

const current: LocalPortfolioState = {
  balance: 9000,
  positions: [
    {
      id: "local-position",
      mode: "mock",
      title: "World Cup winner",
      outcome: "France",
      side: "buy",
      amount: 100,
      probability: 42,
    },
  ],
  openOrders: [
    {
      id: "local-open-order",
      title: "World Cup winner",
      outcome: "Brazil",
      side: "buy",
      status: "OPEN",
      price: 0.32,
      remaining: 25,
    },
  ],
  activities: [
    {
      id: "local-activity",
      action: "opened",
      title: "World Cup winner",
      outcome: "France",
      amount: 100,
    },
  ],
};

describe("portfolio state apply service", () => {
  test("treats server snapshots as authoritative including empty positions and orders", () => {
    expect(
      applyServerPortfolioState(current, {
        syncStatus: "synced",
        snapshotStatus: "synced",
        historyStatus: "error",
        snapshot: {
          balance: 10000,
          positions: [],
          openOrders: [],
        },
      }),
    ).toEqual({
      balance: 10000,
      positions: [],
      openOrders: [],
      activities: current.activities,
    });
  });

  test("applies server history without requiring a snapshot", () => {
    const serverActivity = {
      id: "server-closed",
      action: "closed" as const,
      title: "World Cup winner",
      outcome: "France",
      amount: 120,
    };

    expect(
      applyServerPortfolioState(current, {
        syncStatus: "error",
        snapshotStatus: "error",
        historyStatus: "synced",
        activities: [serverActivity],
      }),
    ).toEqual({
      ...current,
      activities: [serverActivity],
    });
  });
});
