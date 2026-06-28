import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildCandidatePersistenceInput,
  persistWorldCupDiscoveryReport,
} from "@/server/services/polymarket/discoveryCandidateStore";
import { buildWorldCupDiscoveryReport } from "@/server/services/polymarket/discoveryReport";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

describe("polymarket discovery candidate store", () => {
  const now = new Date("2026-06-28T03:00:00.000Z");
  const report = buildWorldCupDiscoveryReport({
    rawMarkets: fixture.markets as PolymarketGammaWire[],
    source: "fixture",
    fixtureMode: true,
    now: now.toISOString(),
  });

  test("maps supported discovery candidate fields into a persistence row", () => {
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-france-win");
    if (!candidate) throw new Error("Missing France fixture candidate.");

    const input = buildCandidatePersistenceInput(candidate, { batchId: "batch-1", now });

    expect(input).toMatchObject({
      source: "polymarket",
      externalSlug: "will-france-win-2026-fifa-world-cup",
      externalMarketId: "pm-worldcup-france-win",
      conditionId: "cond-worldcup-france-win",
      title: "Will France win the 2026 FIFA World Cup?",
      question: "Will France win the 2026 FIFA World Cup?",
      marketType: "yes_no",
      status: "discovered",
      confidence: "high",
      batchId: "batch-1",
      firstSeenAt: now,
      lastSeenAt: now,
    });
    expect(input.tokenIds).toEqual(["tok-france-yes", "tok-france-no"]);
    expect(input.outcomes).toEqual([
      expect.objectContaining({ tokenId: "tok-france-yes", name: "Yes" }),
      expect.objectContaining({ tokenId: "tok-france-no", name: "No" }),
    ]);
  });

  test("classifies review and blocked candidates for queue triage", () => {
    const tbd = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-tbd-quarterfinal");
    const missingToken = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-missing-token");
    const closed = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-closed");
    if (!tbd || !missingToken || !closed) throw new Error("Missing fixture candidates.");

    expect(buildCandidatePersistenceInput(tbd, { batchId: "batch-1", now }).status).toBe("admin_review_required");
    expect(buildCandidatePersistenceInput(missingToken, { batchId: "batch-1", now }).status).toBe("blocked");
    expect(buildCandidatePersistenceInput(closed, { batchId: "batch-1", now }).status).toBe("blocked");
  });

  test("persists candidates and ignored markets with duplicate-safe create calls", async () => {
    const db = mockDb();
    db.polymarketDiscoveryCandidate.findFirst.mockResolvedValue(null);
    db.polymarketDiscoveryCandidate.create.mockImplementation(async () => ({ id: `created-${db.polymarketDiscoveryCandidate.create.mock.calls.length}` }));

    const result = await persistWorldCupDiscoveryReport(report, { batchId: "batch-1", now, db });

    expect(result).toMatchObject({
      batchId: "batch-1",
      createdCount: 7,
      updatedCount: 0,
      ignoredCount: 2,
    });
    expect(db.polymarketDiscoveryCandidate.create).toHaveBeenCalledTimes(7);
    expect(db.polymarketDiscoveryCandidate.create.mock.calls[0][0]).toMatchObject({
      data: expect.objectContaining({
        externalMarketId: "pm-worldcup-france-win",
        status: "discovered",
        batchId: "batch-1",
      }),
    });
    expect(db.polymarketDiscoveryCandidate.create.mock.calls.at(-1)?.[0]).toMatchObject({
      data: expect.objectContaining({
        status: "ignored",
        batchId: "batch-1",
      }),
    });
  });

  test("refreshes existing candidates without overwriting operator status or firstSeenAt", async () => {
    const db = mockDb();
    const firstSeenAt = new Date("2026-06-01T00:00:00.000Z");
    db.polymarketDiscoveryCandidate.findFirst.mockResolvedValue({
      id: "existing-1",
      status: "draft_import_ready",
      firstSeenAt,
    });
    db.polymarketDiscoveryCandidate.update.mockResolvedValue({ id: "existing-1" });

    const singleReport = {
      ...report,
      candidates: report.candidates.slice(0, 1),
      ignored: [],
    };
    const result = await persistWorldCupDiscoveryReport(singleReport, { batchId: "batch-2", now, db });

    expect(result).toMatchObject({ createdCount: 0, updatedCount: 1 });
    expect(db.polymarketDiscoveryCandidate.update).toHaveBeenCalledWith({
      where: { id: "existing-1" },
      data: expect.objectContaining({
        status: "draft_import_ready",
        firstSeenAt,
        lastSeenAt: now,
        batchId: "batch-2",
      }),
    });
  });
});

function mockDb() {
  return {
    polymarketDiscoveryCandidate: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}
