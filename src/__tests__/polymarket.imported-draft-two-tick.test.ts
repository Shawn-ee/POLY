const mockPrisma = {
  market: {
    findUnique: jest.fn(),
  },
};

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  buildDraftImportRequestFromCandidate,
  buildWorldCupDiscoveryReport,
} from "@/server/services/polymarket";
import {
  buildReferenceSnapshotInputsForMarket,
  readFixtureGammaMarketFromMetadata,
} from "@/server/services/polymarketReferenceSnapshots";
import { getLatestReferenceQuotePlansForMarket } from "@/server/services/referenceQuoteSnapshots";
import { PolymarketGammaWire } from "@/server/services/polymarket/types";

describe("imported draft two-tick pricing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("derives bot prices two ticks worse from imported draft reference snapshots", async () => {
    const report = buildWorldCupDiscoveryReport({
      rawMarkets: fixture.markets as PolymarketGammaWire[],
      source: "fixture",
      fixtureMode: true,
    });
    const candidate = report.candidates.find((item) => item.market.externalMarketId === "pm-worldcup-france-win");
    expect(candidate).toBeDefined();
    const request = buildDraftImportRequestFromCandidate(candidate!);
    const gamma = readFixtureGammaMarketFromMetadata(request.market.referenceMetadata);
    expect(gamma).toBeDefined();

    const outcomes = request.market.outcomes.map((outcome, index) => ({
      id: `outcome-local-${index + 1}`,
      name: outcome.name,
      displayOrder: index,
      createdAt: new Date("2026-06-28T00:00:00.000Z"),
      isActive: true,
      referenceTokenId: outcome.referenceTokenId ?? null,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
    }));
    const snapshotInputs = buildReferenceSnapshotInputsForMarket(
      {
        id: "market-local-1",
        title: request.market.title,
        externalSlug: request.market.externalSlug ?? null,
        externalMarketId: request.market.externalMarketId ?? null,
        conditionId: request.market.conditionId ?? null,
        referenceMetadata: request.market.referenceMetadata,
        outcomes,
      },
      gamma!,
      new Date().toISOString(),
    );

    mockPrisma.market.findUnique.mockResolvedValue({
      id: "market-local-1",
      referenceMetadata: {
        importStatus: "approved",
        referenceOnly: true,
        tradable: false,
        mmEnabled: true,
      },
      outcomes,
      referenceQuoteSnapshots: snapshotInputs.map((input) => ({
        ...input,
        fetchedAt: new Date(input.fetchedAt),
      })),
    });

    const plans = await getLatestReferenceQuotePlansForMarket("market-local-1");

    expect(plans[0]).toMatchObject({
      referenceBid: 0.3,
      referenceAsk: 0.32,
      plannedBotBid: 0.28,
      plannedBotAsk: 0.34,
      tickSize: "0.01",
      quoteOffsetTicks: 2,
      quotePreviewAvailable: true,
      quotePlanEnabled: true,
    });
  });
});
