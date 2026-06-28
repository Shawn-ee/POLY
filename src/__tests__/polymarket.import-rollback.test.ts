const prismaMock = {
  polymarketDiscoveryCandidate: {
    findMany: jest.fn(),
  },
  market: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import {
  buildPolymarketImportRollbackPlan,
  executePolymarketImportRollback,
  validateRollbackSelector,
} from "@/server/services/polymarket/importRollback";

describe("polymarket import rollback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(mockTx()),
    );
  });

  test("missing selector fails safely", () => {
    expect(() => validateRollbackSelector({})).toThrow("Rollback requires");
  });

  test("dry-run plans scoped rollback without mutating", async () => {
    mockCandidateAndMarket();

    const result = await executePolymarketImportRollback({
      selector: { batchId: "batch-1" },
    });

    expect(result).toMatchObject({
      dryRun: true,
      candidateCount: 1,
      mutatedCount: 0,
      plannedMarketIds: ["market-1"],
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.polymarketDiscoveryCandidate.findMany).toHaveBeenCalledWith({
      where: { batchId: "batch-1", importedMarketId: { not: null } },
      orderBy: [{ batchId: "asc" }, { updatedAt: "desc" }],
    });
  });

  test("confirmed rollback disables market, outcomes, bot configs, and candidate", async () => {
    const tx = mockTx();
    prismaMock.$transaction.mockImplementation(async (callback: (txArg: unknown) => Promise<unknown>) =>
      callback(tx),
    );
    mockCandidateAndMarket();

    const result = await executePolymarketImportRollback({
      selector: { batchId: "batch-1" },
      confirmRollback: true,
      reason: "Bad import batch.",
    });

    expect(result).toMatchObject({ dryRun: false, mutatedCount: 1 });
    expect(tx.polymarketDiscoveryCandidate.update).toHaveBeenCalledWith({
      where: { id: "candidate-1" },
      data: expect.objectContaining({
        status: "rollback_disabled",
        reviewNotes: "Bad import batch.",
      }),
    });
    expect(tx.market.update).toHaveBeenCalledWith({
      where: { id: "market-1" },
      data: expect.objectContaining({
        isListed: false,
        visibility: "PRIVATE",
        status: "PAUSED",
      }),
    });
    expect(tx.outcome.updateMany).toHaveBeenCalledWith({
      where: { marketId: "market-1" },
      data: { isTradable: false },
    });
    expect(tx.botQuoteConfig.updateMany).toHaveBeenCalledWith({
      where: { marketId: "market-1" },
      data: { enabled: false, dryRun: true },
    });
  });

  test("unrelated markets are untouched by candidate selector", async () => {
    prismaMock.polymarketDiscoveryCandidate.findMany.mockResolvedValue([]);

    const plan = await buildPolymarketImportRollbackPlan({ candidateIds: ["candidate-other"] });

    expect(plan).toEqual([]);
    expect(prismaMock.market.findUnique).not.toHaveBeenCalled();
  });

  test("already disabled candidates are idempotent in the plan", async () => {
    mockCandidateAndMarket({ status: "rollback_disabled" });

    const plan = await buildPolymarketImportRollbackPlan({ source: "polymarket" });

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      alreadyRollbackDisabled: true,
      actions: expect.arrayContaining(["set_market_private_unlisted_paused"]),
    });
  });
});

function mockCandidateAndMarket(params: { status?: string } = {}) {
  prismaMock.polymarketDiscoveryCandidate.findMany.mockResolvedValue([
    {
      id: "candidate-1",
      batchId: "batch-1",
      source: "polymarket",
      status: params.status ?? "promoted",
      importedMarketId: "market-1",
    },
  ]);
  prismaMock.market.findUnique.mockResolvedValue({
    id: "market-1",
    title: "Will France win the 2026 FIFA World Cup?",
    status: "LIVE",
    visibility: "PUBLIC",
    isListed: true,
    externalMarketId: "pm-worldcup-france-win",
    conditionId: "cond-worldcup-france-win",
    outcomes: [
      { id: "outcome-yes", isTradable: true },
      { id: "outcome-no", isTradable: true },
    ],
    botQuoteConfigs: [{ id: "config-1", enabled: true }],
  });
}

function mockTx() {
  return {
    market: {
      findUnique: jest.fn().mockResolvedValue({ referenceMetadata: { mmEnabled: true, tradable: true } }),
      update: jest.fn(),
    },
    polymarketDiscoveryCandidate: {
      update: jest.fn(),
    },
    outcome: {
      updateMany: jest.fn(),
    },
    botQuoteConfig: {
      updateMany: jest.fn(),
    },
  };
}
