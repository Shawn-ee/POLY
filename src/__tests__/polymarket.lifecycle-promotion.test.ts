import fixture from "@/server/services/polymarket/__fixtures__/worldCupDiscovery.fixture.json";
import {
  applyDbBackedLifecyclePromotion,
  buildWorldCupDiscoveryReport,
  planDbBackedLifecyclePromotion,
} from "@/server/services/polymarket";
import { PolymarketGammaWire, PolymarketImportCandidate } from "@/server/services/polymarket/types";

describe("DB-backed lifecycle promotion", () => {
  const discovery = buildWorldCupDiscoveryReport({
    rawMarkets: fixture.markets as PolymarketGammaWire[],
    source: "fixture",
    fixtureMode: true,
    now: "2026-06-28T00:00:00.000Z",
  });

  function candidate(externalMarketId: string): PolymarketImportCandidate {
    const found = discovery.candidates.find((item) => item.market.externalMarketId === externalMarketId);
    if (!found) throw new Error(`Missing fixture candidate ${externalMarketId}`);
    return found;
  }

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("plans eligible fixture market for public enabled lifecycle without tradable outcomes", () => {
    const plan = planDbBackedLifecyclePromotion(candidate("pm-worldcup-france-win"), "admin-1");

    expect(plan).toMatchObject({
      eligible: true,
      dryRun: true,
      update: {
        visibility: "PUBLIC",
        isListed: true,
        status: "LIVE",
        outcomesTradable: false,
      },
    });
    expect(plan.update?.referenceMetadata).toMatchObject({
      importStatus: "approved",
      referenceOnly: true,
      tradable: false,
      mmEnabled: false,
      mappingDisabled: false,
      lifecycleState: "enabled",
      enabledBy: "admin-1",
    });
  });

  test("does not plan invalid fixture market for lifecycle mutation", () => {
    const missingToken = planDbBackedLifecyclePromotion(candidate("pm-worldcup-missing-token"), "admin-1");
    const closed = planDbBackedLifecyclePromotion(candidate("pm-worldcup-closed"), "admin-1");

    expect(missingToken).toMatchObject({
      eligible: false,
      update: null,
      reasonCodes: expect.arrayContaining(["missing_token_mapping"]),
    });
    expect(closed).toMatchObject({
      eligible: false,
      update: null,
      reasonCodes: expect.arrayContaining(["inactive_or_closed"]),
    });
  });

  test("applies only eligible market update when explicit local safety flags are set", async () => {
    process.env.NODE_ENV = "test";
    process.env.REAL_MONEY_MODE = "false";
    process.env.POLYMARKET_AUTO_PROMOTE_ENABLED = "true";
    process.env.POLYMARKET_LOCAL_DB_PROMOTION = "true";
    const db = {
      market: {
        findFirst: jest.fn().mockResolvedValue({ id: "market-1", referenceMetadata: { importStatus: "pending_review" } }),
        update: jest.fn().mockResolvedValue({ id: "market-1" }),
      },
      outcome: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    await expect(
      applyDbBackedLifecyclePromotion({
        candidate: candidate("pm-worldcup-france-win"),
        actorUserId: "admin-1",
        db,
      }),
    ).resolves.toMatchObject({
      applied: true,
      marketId: "market-1",
      update: {
        visibility: "PUBLIC",
        isListed: true,
        status: "LIVE",
        outcomesTradable: false,
      },
    });

    expect(db.market.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "market-1" },
        data: expect.objectContaining({
          visibility: "PUBLIC",
          isListed: true,
          status: "LIVE",
          referenceMetadata: expect.objectContaining({
            importStatus: "approved",
            lifecycleState: "enabled",
          }),
        }),
      }),
    );
    expect(db.outcome.updateMany).toHaveBeenCalledWith({
      where: { marketId: "market-1" },
      data: { isTradable: false },
    });
  });

  test("refuses DB mutation without explicit local promotion flags", async () => {
    process.env.NODE_ENV = "test";
    process.env.REAL_MONEY_MODE = "false";
    process.env.POLYMARKET_AUTO_PROMOTE_ENABLED = "false";
    process.env.POLYMARKET_LOCAL_DB_PROMOTION = "false";

    await expect(
      applyDbBackedLifecyclePromotion({
        candidate: candidate("pm-worldcup-france-win"),
        actorUserId: "admin-1",
        db: {
          market: { findFirst: jest.fn(), update: jest.fn() },
          outcome: { updateMany: jest.fn() },
        },
      }),
    ).rejects.toThrow("POLYMARKET_LOCAL_DB_PROMOTION=true");
  });
});
