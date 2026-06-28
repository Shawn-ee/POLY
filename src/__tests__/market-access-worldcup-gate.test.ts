import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { MarketGuardError } from "@/lib/marketGuards";

jest.mock("@/server/services/referenceQuoteSnapshots", () => ({
  referenceSnapshotConfig: { staleMs: 30_000 },
}));

const publicMarket = { id: "market-1", visibility: "PUBLIC", ownerId: null, mechanism: "ORDERBOOK" } as const;

describe("market access World Cup mapping gate", () => {
  test("allows non-World-Cup public markets without requiring mapping", async () => {
    const db = {
      market: {
        findFirst: jest.fn().mockResolvedValueOnce(null),
      },
      marketMember: { findUnique: jest.fn() },
    };

    await expect(assertMarketVisibleToUser({ market: publicMarket, userId: null, db: db as never })).resolves.toBeUndefined();
    expect(db.market.findFirst).toHaveBeenCalledTimes(1);
  });

  test("blocks public World Cup markets that are not eligible", async () => {
    const db = {
      market: {
        findFirst: jest.fn().mockResolvedValueOnce({ id: "market-1" }).mockResolvedValueOnce(null),
      },
      marketMember: { findUnique: jest.fn() },
    };

    await expect(assertMarketVisibleToUser({ market: publicMarket, userId: null, db: db as never })).rejects.toBeInstanceOf(MarketGuardError);
    expect(db.market.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "market-1",
          referenceSource: "polymarket",
          referenceMetadata: { path: ["importStatus"], equals: "approved" },
        }),
      }),
    );
  });

  test("allows public World Cup markets with approved fresh Polymarket mapping", async () => {
    const db = {
      market: {
        findFirst: jest.fn().mockResolvedValueOnce({ id: "market-1" }).mockResolvedValueOnce({ id: "market-1" }),
      },
      marketMember: { findUnique: jest.fn() },
    };

    await expect(assertMarketVisibleToUser({ market: publicMarket, userId: null, db: db as never })).resolves.toBeUndefined();
    expect(db.market.findFirst).toHaveBeenCalledTimes(2);
  });
});
