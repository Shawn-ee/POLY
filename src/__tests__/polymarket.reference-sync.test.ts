import { isReferencePriceStale, PolymarketClobClient } from "@/server/services/polymarket";

describe("Polymarket reference price sync foundation", () => {
  test("parses CLOB book bid ask mid and liquidity", async () => {
    const client = new PolymarketClobClient("https://clob.test", async (input) => {
      const url = String(input);
      if (url.includes("/book")) {
        return Response.json({
          bids: [{ price: "0.42", size: "10" }],
          asks: [{ price: "0.46", size: "12.5" }],
        });
      }
      if (url.includes("/midpoint")) return Response.json({ mid_price: "0.44" });
      return Response.json({ price: "0.44" });
    });

    await expect(client.getReferencePrice("tok-1")).resolves.toMatchObject({
      tokenId: "tok-1",
      bid: 0.42,
      ask: 0.46,
      mid: 0.44,
      liquidity: 22.5,
      confidence: "high",
      staleAfterSeconds: 15,
    });
  });

  test("falls back to side prices and calculated midpoint", async () => {
    const client = new PolymarketClobClient("https://clob.test", async (input) => {
      const url = String(input);
      if (url.includes("/book") || url.includes("/midpoint")) return Response.json({});
      if (url.includes("side=BUY")) return Response.json({ price: "0.31" });
      return Response.json({ price: "0.35" });
    });

    const price = await client.getReferencePrice("tok-2");
    expect(price).toMatchObject({ bid: 0.31, ask: 0.35, mid: 0.33, confidence: "high" });
  });

  test("handles missing book without throwing", async () => {
    const client = new PolymarketClobClient("https://clob.test", async () => Response.json({}));
    await expect(client.getReferencePrice("missing")).resolves.toMatchObject({
      bid: null,
      ask: null,
      mid: null,
      confidence: "unavailable",
    });
  });

  test("detects stale reference prices", () => {
    expect(
      isReferencePriceStale({
        updatedAt: "2026-06-28T00:00:00.000Z",
        staleAfterSeconds: 15,
        now: Date.parse("2026-06-28T00:00:16.000Z"),
      }),
    ).toBe(true);
    expect(
      isReferencePriceStale({
        updatedAt: "2026-06-28T00:00:00.000Z",
        staleAfterSeconds: 15,
        now: Date.parse("2026-06-28T00:00:10.000Z"),
      }),
    ).toBe(false);
  });
});
