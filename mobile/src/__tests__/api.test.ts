import { afterEach, describe, expect, test, vi } from "vitest";
import { PolyApi } from "../api";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });

describe("Holiwyn mobile API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("sends Bearer auth from the configured API key", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ walletBalance: 10000, positions: [], openOrders: [], comboOrders: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test/", "pk_live_test.secret").getPortfolio();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/portfolio");
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
    expect(headers.get("Accept")).toBe("application/json");
  });

  test("places canonical limit orders with idempotency and auth headers", async () => {
    vi.spyOn(Date, "now").mockReturnValue(12345);
    const fetchImpl = vi.fn(async () => jsonResponse({ order: { id: "order-1" } }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "pk_live_test.secret").placeLimitOrder({
      marketId: "market-1",
      outcomeId: "yes",
      side: "BUY",
      price: "0.45",
      size: "10.00",
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/orders");
    expect(init.method).toBe("POST");
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
    expect(headers.get("Idempotency-Key")).toBe("mobile-12345");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({
      marketId: "market-1",
      outcomeId: "yes",
      side: "BUY",
      price: "0.45",
      size: "10.00",
      type: "LIMIT",
      clientOrderId: "mobile-12345",
    });
  });

  test("cancels orders through the canonical order endpoint", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ order: { id: "order/1", status: "CANCELED" } }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "pk_live_test.secret").cancelOrder("order/1");

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/orders/order%2F1");
    expect(init.method).toBe("DELETE");
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
  });

  test("loads range-aware market chart history", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        marketId: "market-1",
        range: "1D",
        ranges: ["1D", "1W", "1M", "MAX"],
        generatedAt: "2026-06-15T12:00:00.000Z",
        lastUpdated: "2026-06-15T11:59:00.000Z",
        emptyState: null,
        outcomes: [{ id: "yes", name: "Yes" }],
        history: [{ outcomeId: "yes", timestamp: "2026-06-15T11:59:00.000Z", price: 0.57, probability: 57 }],
        series: { yes: [{ ts: "2026-06-15T11:59:00.000Z", price: 0.57 }] },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const chart = await new PolyApi("https://api.example.test", "pk_live_test.secret").getMarketChart("market/1", "1D");

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/markets/market%2F1/chart?range=1D");
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
    expect(chart.history[0]).toEqual({
      outcomeId: "yes",
      timestamp: "2026-06-15T11:59:00.000Z",
      price: 0.57,
      probability: 57,
    });
  });

  test("lists World Cup events with structured filters and mobile compact markets", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ events: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "pk_live_test.secret").listWorldCupEvents();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(`${parsedUrl.origin}${parsedUrl.pathname}`).toBe("https://api.example.test/api/events");
    expect(parsedUrl.searchParams.has("category")).toBe(false);
    expect(parsedUrl.searchParams.get("sportKey")).toBe("soccer");
    expect(parsedUrl.searchParams.get("leagueKey")).toBe("world_cup");
    expect(parsedUrl.searchParams.get("includeMobileMarkets")).toBe("1");
    expect(parsedUrl.searchParams.has("search")).toBe(false);
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer pk_live_test.secret");
  });

  test("lists World Cup events with backend pagination parameters", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ events: [], nextCursor: "event-2", page: { limit: 10, nextCursor: "event-2", hasMore: true } }));
    vi.stubGlobal("fetch", fetchImpl);

    const payload = await new PolyApi("https://api.example.test", "pk_live_test.secret").listWorldCupEvents({
      limit: 10,
      cursor: "event-1",
      search: "mexico",
    });

    const [url] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("limit")).toBe("10");
    expect(parsedUrl.searchParams.get("cursor")).toBe("event-1");
    expect(parsedUrl.searchParams.get("search")).toBe("mexico");
    expect(parsedUrl.searchParams.get("includeMobileMarkets")).toBe("1");
    expect(payload.nextCursor).toBe("event-2");
  });

  test("loads mobile orderbook depth contract", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        marketId: "market-1",
        outcomeId: null,
        generatedAt: "2026-06-15T12:00:00.000Z",
        emptyState: null,
        levels: [{ outcomeId: "yes", side: "bid", price: 0.57, shares: 120, total: 68.4 }],
        bids: [{ outcomeId: "yes", price: 0.57, size: 120 }],
        asks: [],
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const book = await new PolyApi("https://api.example.test", "pk_live_test.secret").getOrderbook("market/1", { maxLevels: 12 });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    const parsedUrl = new URL(url);
    expect(`${parsedUrl.origin}${parsedUrl.pathname}`).toBe("https://api.example.test/api/orderbook/market%2F1/book");
    expect(parsedUrl.searchParams.get("maxLevels")).toBe("12");
    expect(parsedUrl.searchParams.get("_ts")).toEqual(expect.any(String));
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
    expect(book.levels[0]).toEqual({ outcomeId: "yes", side: "bid", price: 0.57, shares: 120, total: 68.4 });
  });

  test("prefers compact mobile event detail and falls back to legacy event route", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "not found" }), { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ event: { slug: "match-1" }, markets: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    const event = await new PolyApi("https://api.example.test", "pk_live_test.secret").getEvent("match/1");

    expect(event).toEqual({ event: { slug: "match-1" }, markets: [] });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://api.example.test/api/mobile/events/match%2F1/live-detail");
    expect(fetchImpl.mock.calls[1]?.[0]).toBe("https://api.example.test/api/events/match%2F1");
  });

  test("saves authenticated profile preferences with canonical local settings", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        preferences: {
          locale: "en",
          ticketDefaultAmount: "500",
          ticketDefaultSide: "SELL",
          ticketDefaultSlippage: "2%",
          savedEventIds: ["mexico-ecuador"],
        },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "pk_live_test.secret").saveProfilePreferences({
      locale: "en",
      ticketDefaultAmount: "500",
      ticketDefaultSide: "SELL",
      ticketDefaultSlippage: "2%",
      savedEventIds: ["mexico-ecuador"],
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/profile/preferences");
    expect(init.method).toBe("PUT");
    expect(headers.get("Authorization")).toBe("Bearer pk_live_test.secret");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({
      locale: "en",
      ticketDefaultAmount: "500",
      ticketDefaultSide: "SELL",
      ticketDefaultSlippage: "2%",
      savedEventIds: ["mexico-ecuador"],
    });
  });
});
