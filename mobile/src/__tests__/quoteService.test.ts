import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import {
  applyTicketQuoteToOutcome,
  applyTicketQuotesToEvent,
  applyTicketQuotesToMarket,
  applyTicketQuotesToMarkets,
  applyMarketQuoteStateToEvent,
  applyMarketQuoteStateToMarkets,
  loadMarketQuoteStateById,
  loadMarketQuotesById,
  loadTicketQuotes,
  quoteToTicketQuote,
} from "../services/quoteService";
import type { Quote } from "../types";

describe("quote service", () => {
  test("maps decimal and string quote values into ticket percentages", () => {
    const quote: Quote = {
      outcomeId: "france",
      outcomeName: "France",
      bestBid: "0.41",
      bestAsk: 0.43,
      midPrice: "0.42",
      lastPrice: null,
    };

    expect(quoteToTicketQuote(quote)).toEqual({
      outcomeId: "france",
      outcomeName: "France",
      probability: 42,
      bestBid: 41,
      bestAsk: 43,
      midPrice: 42,
      lastPrice: null,
    });
  });

  test("preserves a minimum one percent ticket probability for positive tiny quotes", () => {
    const quote: Quote = {
      outcomeId: "yes",
      outcomeName: "YES",
      bestBid: "0.001",
      bestAsk: "0.004",
      midPrice: null,
      lastPrice: null,
    };

    expect(quoteToTicketQuote(quote)).toMatchObject({
      probability: 1,
      bestBid: 1,
      bestAsk: 1,
    });
  });

  test("maps best level sizes into ticket quotes", () => {
    const quote: Quote = {
      outcomeId: "yes",
      outcomeName: "Yes",
      bestBid: "0.50",
      bestAsk: "0.54",
      bestBidSize: "500.25",
      bestAskSize: 120,
      midPrice: "0.52",
      lastPrice: null,
    };

    expect(quoteToTicketQuote(quote)).toMatchObject({
      outcomeId: "yes",
      bestBid: 50,
      bestAsk: 54,
      bestBidSize: 500.25,
      bestAskSize: 120,
    });
  });

  test("falls back to positive bid ask midpoint when mid price is zero", () => {
    const quote: Quote = {
      outcomeId: "yes",
      outcomeName: "YES",
      bestBid: "0.01",
      bestAsk: "0.04",
      midPrice: "0",
      lastPrice: null,
    };

    expect(quoteToTicketQuote(quote)).toMatchObject({
      probability: 3,
      bestBid: 1,
      bestAsk: 4,
      midPrice: 0,
    });
  });

  test("falls back to last price when mid price is unavailable", () => {
    const quote: Quote = {
      outcomeId: "brazil",
      outcomeName: "Brazil",
      bestBid: null,
      bestAsk: null,
      midPrice: null,
      lastPrice: "52",
    };

    expect(quoteToTicketQuote(quote).probability).toBe(52);
  });

  test("falls back to bid and ask midpoint before one-sided quotes", () => {
    expect(
      quoteToTicketQuote({
        outcomeId: "argentina",
        outcomeName: "Argentina",
        bestBid: 0.31,
        bestAsk: 0.35,
        midPrice: null,
        lastPrice: null,
      }).probability,
    ).toBe(33);

    expect(
      quoteToTicketQuote({
        outcomeId: "england",
        outcomeName: "England",
        bestBid: null,
        bestAsk: 0.28,
        midPrice: null,
        lastPrice: null,
      }).probability,
    ).toBe(28);
  });

  test("ignores invalid and negative quote values", () => {
    expect(
      quoteToTicketQuote({
        outcomeId: "spain",
        outcomeName: "Spain",
        bestBid: -1,
        bestAsk: "bad",
        midPrice: null,
        lastPrice: null,
      }),
    ).toEqual({
      outcomeId: "spain",
      outcomeName: "Spain",
      probability: 0,
      bestBid: null,
      bestAsk: null,
      midPrice: null,
      lastPrice: null,
    });
  });

  test("loads and normalizes market quotes from the API", async () => {
    const getMarketQuote = vi.fn(async () => ({
      marketId: "winner",
      quotes: [
        {
          outcomeId: "usa",
          outcomeName: "USA",
          bestBid: 0.18,
          bestAsk: 0.2,
          midPrice: 0.19,
          lastPrice: null,
        },
      ],
    }));
    const api = { getMarketQuote } as unknown as PolyApi;

    await expect(loadTicketQuotes(api, "winner", "usa")).resolves.toEqual([
      {
        outcomeId: "usa",
        outcomeName: "USA",
        probability: 19,
        bestBid: 18,
        bestAsk: 20,
        midPrice: 19,
        lastPrice: null,
      },
    ]);
    expect(getMarketQuote).toHaveBeenCalledWith("winner", "usa");
  });

  test("loads market quotes by id while deduplicating market ids", async () => {
    const getMarketQuote = vi.fn(async () => ({
      marketId: "winner",
      quotes: [
        {
          outcomeId: "france",
          outcomeName: "France",
          bestBid: 0.41,
          bestAsk: 0.43,
          midPrice: 0.42,
          lastPrice: null,
        },
      ],
    }));
    const api = { getMarketQuote } as unknown as PolyApi;

    const quotesByMarketId = await loadMarketQuotesById(api, ["winner", "winner"]);

    expect(getMarketQuote).toHaveBeenCalledTimes(1);
    expect(quotesByMarketId.get("winner")?.[0].probability).toBe(42);
  });

  test("loads market quotes by id while skipping failed market quote calls", async () => {
    const getMarketQuote = vi.fn(async (marketId: string) => {
      if (marketId === "broken") throw new Error("offline");
      return {
        marketId,
        quotes: [
          {
            outcomeId: "france",
            outcomeName: "France",
            bestBid: 0.41,
            bestAsk: 0.43,
            midPrice: 0.42,
            lastPrice: null,
          },
        ],
      };
    });
    const api = { getMarketQuote } as unknown as PolyApi;

    const quotesByMarketId = await loadMarketQuotesById(api, ["winner", "broken"]);

    expect([...quotesByMarketId.keys()]).toEqual(["winner"]);
    expect(quotesByMarketId.has("broken")).toBe(false);
  });

  test("reports failed market quote calls separately from successful quote maps", async () => {
    const getMarketQuote = vi.fn(async (marketId: string) => {
      if (marketId === "broken") throw new Error("quote route down");
      return {
        marketId,
        quotes: [
          {
            outcomeId: "france",
            outcomeName: "France",
            bestBid: 0.41,
            bestAsk: 0.43,
            bestBidSize: null,
            bestAskSize: null,
            midPrice: 0.42,
            lastPrice: null,
          },
        ],
      };
    });
    const api = { getMarketQuote } as unknown as PolyApi;

    const state = await loadMarketQuoteStateById(api, ["winner", "broken", "winner"]);

    expect([...state.quotesByMarketId.keys()]).toEqual(["winner"]);
    expect([...state.failedMarketIds]).toEqual(["broken"]);
    expect(getMarketQuote).toHaveBeenCalledTimes(2);
  });

  test("applies a matching ticket quote to an outcome by id", () => {
    const outcome = { id: "france", label: "France", zhLabel: "France", probability: 34, color: "#2563eb" };

    expect(
      applyTicketQuoteToOutcome(outcome, [
        {
          outcomeId: "france",
          outcomeName: "France",
          probability: 42,
          bestBid: 41,
          bestAsk: 43,
          midPrice: 42,
          lastPrice: null,
        },
      ]),
    ).toEqual({ ...outcome, probability: 42, bestBid: 41, bestAsk: 43, bestBidSize: null, bestAskSize: null });
  });

  test("applies matching quote sizes to an outcome", () => {
    const outcome = { id: "yes", label: "Yes", zhLabel: "Yes", probability: 49, color: "#2563eb" };

    expect(
      applyTicketQuoteToOutcome(outcome, [
        {
          outcomeId: "yes",
          outcomeName: "Yes",
          probability: 52,
          bestBid: 50,
          bestAsk: 54,
          bestBidSize: 500,
          bestAskSize: 120,
          midPrice: 52,
          lastPrice: null,
        },
      ]),
    ).toMatchObject({
      probability: 52,
      bestBid: 50,
      bestAsk: 54,
      bestBidSize: 500,
      bestAskSize: 120,
    });
  });

  test("applies a matching ticket quote to an outcome by label fallback", () => {
    const outcome = { id: "local-france", label: "France", zhLabel: "France", probability: 34, color: "#2563eb" };

    expect(
      applyTicketQuoteToOutcome(outcome, [
        {
          outcomeId: "server-france",
          outcomeName: " france ",
          probability: 47,
          bestBid: 46,
          bestAsk: 48,
          midPrice: 47,
          lastPrice: null,
        },
      ]).probability,
    ).toBe(47);
  });

  test("keeps the original outcome when no matching quote is available", () => {
    const outcome = { id: "spain", label: "Spain", zhLabel: "Spain", probability: 11, color: "#ef4444" };

    expect(
      applyTicketQuoteToOutcome(outcome, [
        {
          outcomeId: "france",
          outcomeName: "France",
          probability: 42,
          bestBid: 41,
          bestAsk: 43,
          midPrice: 42,
          lastPrice: null,
        },
      ]),
    ).toBe(outcome);
  });

  test("keeps the original outcome when the matching server quote has no prices", () => {
    const outcome = { id: "yes", label: "YES", zhLabel: "YES", probability: 50, color: "#2563eb" };

    expect(
      applyTicketQuoteToOutcome(outcome, [
        {
          outcomeId: "yes",
          outcomeName: "YES",
          probability: 0,
          bestBid: null,
          bestAsk: null,
          midPrice: null,
          lastPrice: null,
        },
      ]),
    ).toBe(outcome);
  });

  test("applies ticket quotes across matching market outcomes", () => {
    const market = {
      id: "winner",
      title: "World Cup winner",
      outcomes: [
        { id: "france", label: "France", probability: 34 },
        { id: "argentina", label: "Argentina", probability: 19 },
      ],
    };

    expect(
      applyTicketQuotesToMarket(market, [
        {
          outcomeId: "france",
          outcomeName: "France",
          probability: 42,
          bestBid: 41,
          bestAsk: 43,
          midPrice: 42,
          lastPrice: null,
        },
        {
          outcomeId: "argentina",
          outcomeName: "Argentina",
          probability: 21,
          bestBid: 20,
          bestAsk: 22,
          midPrice: 21,
          lastPrice: null,
        },
      ]).outcomes.map((outcome) => outcome.probability),
    ).toEqual([42, 21]);
  });

  test("keeps the original market when no outcome quotes match", () => {
    const market = {
      id: "winner",
      title: "World Cup winner",
      outcomes: [{ id: "spain", label: "Spain", probability: 11 }],
    };

    expect(
      applyTicketQuotesToMarket(market, [
        {
          outcomeId: "france",
          outcomeName: "France",
          probability: 42,
          bestBid: 41,
          bestAsk: 43,
          midPrice: 42,
          lastPrice: null,
        },
      ]),
    ).toBe(market);
  });

  test("applies ticket quotes across event markets", () => {
    const event = {
      id: "mexico-ecuador",
      markets: [
        {
          id: "match-winner",
          outcomes: [
            { id: "mexico", label: "Mexico", probability: 64 },
            { id: "ecuador", label: "Ecuador", probability: 36 },
          ],
        },
        {
          id: "total-goals",
          outcomes: [
            { id: "over", label: "Over", probability: 47 },
            { id: "under", label: "Under", probability: 53 },
          ],
        },
      ],
    };

    const quotedEvent = applyTicketQuotesToEvent(
      event,
      new Map([
        [
          "match-winner",
          [
            {
              outcomeId: "mexico",
              outcomeName: "Mexico",
              probability: 66,
              bestBid: 65,
              bestAsk: 67,
              midPrice: 66,
              lastPrice: null,
            },
          ],
        ],
        [
          "total-goals",
          [
            {
              outcomeId: "under",
              outcomeName: "Under",
              probability: 55,
              bestBid: 54,
              bestAsk: 56,
              midPrice: 55,
              lastPrice: null,
            },
          ],
        ],
      ]),
    );

    expect(quotedEvent.markets[0].outcomes.map((outcome) => outcome.probability)).toEqual([66, 36]);
    expect(quotedEvent.markets[1].outcomes.map((outcome) => outcome.probability)).toEqual([47, 55]);
  });

  test("marks event markets unavailable when their quote route fails", () => {
    const event = {
      id: "mexico-ecuador",
      markets: [
        {
          id: "match-winner",
          availability: {
            source: "live-detail",
            status: "ready" as const,
            marketStatus: "LIVE",
            lastUpdated: null,
            stalenessSeconds: null,
            staleAfterSeconds: 60,
            isStale: false,
            isSuspended: false,
            isDelayed: false,
            reason: "Market accepts orders.",
          },
          outcomes: [{ id: "mexico", label: "Mexico", probability: 64 }],
        },
      ],
    };

    const quotedEvent = applyMarketQuoteStateToEvent(event, {
      quotesByMarketId: new Map(),
      failedMarketIds: new Set(["match-winner"]),
    });

    expect(quotedEvent.markets[0].availability).toMatchObject({
      source: "market-quote-route",
      status: "unavailable",
      marketStatus: "LIVE",
      reason: "Market quote route failed.",
    });
  });

  test("keeps the original event when no market quotes match", () => {
    const event = {
      id: "mexico-ecuador",
      markets: [
        {
          id: "match-winner",
          outcomes: [{ id: "mexico", label: "Mexico", probability: 64 }],
        },
      ],
    };

    expect(applyTicketQuotesToEvent(event, new Map())).toBe(event);
  });

  test("applies ticket quotes across a market list", () => {
    const markets = [
      {
        id: "world-cup-winner",
        outcomes: [{ id: "france", label: "France", probability: 34 }],
      },
      {
        id: "golden-boot",
        outcomes: [{ id: "mbappe", label: "Mbappe", probability: 22 }],
      },
    ];

    const quotedMarkets = applyTicketQuotesToMarkets(
      markets,
      new Map([
        [
          "world-cup-winner",
          [
            {
              outcomeId: "france",
              outcomeName: "France",
              probability: 39,
              bestBid: 38,
              bestAsk: 40,
              midPrice: 39,
              lastPrice: null,
            },
          ],
        ],
      ]),
    );

    expect(quotedMarkets[0].outcomes[0].probability).toBe(39);
    expect(quotedMarkets[1]).toBe(markets[1]);
  });

  test("marks market lists unavailable when their quote route fails", () => {
    const markets = [
      {
        id: "world-cup-winner",
        availability: {
          source: "events-route",
          status: "ready" as const,
          marketStatus: "LIVE",
          lastUpdated: null,
          stalenessSeconds: null,
          staleAfterSeconds: 60,
          isStale: false,
          isSuspended: false,
          isDelayed: false,
          reason: "Market accepts orders.",
        },
        outcomes: [{ id: "france", label: "France", probability: 34 }],
      },
    ];

    const quotedMarkets = applyMarketQuoteStateToMarkets(markets, {
      quotesByMarketId: new Map(),
      failedMarketIds: new Set(["world-cup-winner"]),
    });

    expect(quotedMarkets[0].availability).toMatchObject({
      source: "market-quote-route",
      status: "unavailable",
      marketStatus: "LIVE",
      reason: "Market quote route failed.",
    });
  });

  test("keeps the original market list when no market quotes match", () => {
    const markets = [
      {
        id: "world-cup-winner",
        outcomes: [{ id: "france", label: "France", probability: 34 }],
      },
    ];

    expect(applyTicketQuotesToMarkets(markets, new Map())).toBe(markets);
  });
});
