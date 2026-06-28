import { formatPolymarketMmStatusReport, PolymarketMmOpsStatus } from "@/server/services/polymarketMmOpsLoop";

function status(overrides: Partial<PolymarketMmOpsStatus> = {}): PolymarketMmOpsStatus {
  return {
    generatedAt: "2026-06-27T12:00:00.000Z",
    importedMarkets: 2,
    verifiedMappings: 2,
    referenceSnapshots: 4,
    stalePrices: 1,
    activeBotConfigs: 1,
    totalBotConfigs: 2,
    dryRunIntents: 6,
    liveLocalOrders: 1,
    openOrders: 1,
    riskAlerts: 1,
    pendingResolutionProposals: 3,
    errors: [],
    nextAction: "Continue.",
    ...overrides,
  };
}

describe("formatPolymarketMmStatusReport", () => {
  it("renders required ops loop sections", () => {
    const report = formatPolymarketMmStatusReport(status({ errors: ["reference_sync:timeout"] }));

    expect(report).toContain("# Polymarket Reference MM Status");
    expect(report).toContain("| Imported Polymarket markets | 2 |");
    expect(report).toContain("| Verified mappings | 2 |");
    expect(report).toContain("| Reference snapshots | 4 |");
    expect(report).toContain("| Stale prices | 1 |");
    expect(report).toContain("| Risk alerts | 1 |");
    expect(report).toContain("| Pending resolution proposals | 3 |");
    expect(report).toContain("- reference_sync:timeout");
    expect(report).toContain("Automatic crypto payout signing: not implemented");
  });
});
