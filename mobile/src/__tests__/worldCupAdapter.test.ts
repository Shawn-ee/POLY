import { describe, expect, test } from "vitest";
import { normalizeEventDetail, normalizeEventSummary, normalizeMarket } from "../adapters/worldCupAdapter";
import type { EventDetail, EventSummary, Market } from "../types";

const baseMarket: Market = {
  id: "world-cup-futures",
  title: "Fixture World Cup futures",
  description: null,
  status: "OPEN",
  event: null,
  rulesText: null,
  marketGroupTitle: "World Cup futures",
  marketGroupKey: null,
  marketGroupId: null,
  marketType: null,
  period: null,
  line: null,
  liquidity: null,
  orderbookDepth: [],
  propCategory: "future",
  outcomes: [],
};

describe("world cup adapter", () => {
  test("preserves backend event row metrics without synthetic fallbacks", () => {
    const event: EventSummary = {
      id: "event-search-metrics",
      slug: "event-search-metrics",
      title: "Search Metrics Home vs Search Metrics Away",
      description: null,
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      homeTeamName: "Search Metrics Home",
      awayTeamName: "Search Metrics Away",
      startTime: "2026-07-10T20:00:00.000Z",
      status: "scheduled",
      liveStatus: null,
      period: null,
      clock: null,
      homeScore: null,
      awayScore: null,
      imageUrl: null,
      marketCount: 2,
      activeMarketCount: 1,
      metrics: {
        source: "event-route-mobile-markets",
        marketCount: 2,
        activeMarketCount: 1,
        liquidity: "123.45",
        volume24h: null,
        commentCount: null,
      },
    };

    expect(normalizeEventSummary(event, [])?.metrics).toEqual({
      source: "event-route-mobile-markets",
      marketCount: 2,
      activeMarketCount: 1,
      liquidity: 123.45,
      volume24h: null,
      commentCount: null,
    });
  });

  test("uses positive bid ask midpoint when backend outcome price is zero", () => {
    const normalized = normalizeMarket({
      ...baseMarket,
      outcomes: [
        {
          id: "yes",
          name: "YES",
          label: "YES",
          side: "yes",
          price: 0,
          bestBid: "0.01",
          bestAsk: "0.04",
          bestBidSize: "120",
          bestAskSize: "90",
          isTradable: true,
        },
      ],
    });

    expect(normalized.outcomes[0]).toMatchObject({
      id: "yes",
      label: "YES",
      probability: 3,
      side: "yes",
      bestBid: 0.01,
      bestAsk: 0.04,
      bestBidSize: 120,
      bestAskSize: 90,
    });
  });

  test("preserves backend-shaped live market contract fields", () => {
    const normalized = normalizeMarket({
      ...baseMarket,
      title: "Australia +0.5",
      marketGroupKey: "aus-egy-live-game-lines",
      marketGroupId: "aus-egy-live-game-lines",
      marketGroupTitle: "Game Lines",
      marketType: "spread",
      period: "regulation",
      line: "+0.5",
      referenceSource: "polymarket",
      externalSlug: "australia-egypt-spread",
      externalMarketId: "gamma-spread-1",
      conditionId: "condition-spread-1",
      selection: {
        selectorKey: "spread:regulation:+0.5",
        marketId: "aus-egy-live-spread",
        marketGroupKey: "aus-egy-live-game-lines",
        marketGroupId: "aus-egy-live-game-lines",
        marketGroupTitle: "Game Lines",
        marketType: "spread",
        marketFamily: "spread",
        displayLabel: "Spread regulation +0.5",
        period: "regulation",
        line: "+0.5",
        lineValue: 0.5,
        unit: "goals",
        chart: {
          targetMarketId: "aus-egy-live-spread",
          status: "ready",
          source: "market-outcome-snapshot",
          pointCount: 3,
          outcomeCount: 1,
          range: "1D",
          ranges: ["1D"],
          emptyState: null,
        },
        outcomes: [{
          id: "aus",
          outcomeId: "aus",
          side: "home",
          label: "Australia +0.5",
          tokenId: "token-aus-spread",
          referenceTokenId: "token-aus-spread",
          referenceOutcomeLabel: "Australia +0.5",
          isTradable: true,
        }],
      },
      liquidity: "4500",
      orderbookDepth: [{ outcomeId: "aus", side: "bid", price: 0.58, shares: 100, total: 58 }],
      availability: {
        source: "market-source-updated-at",
        status: "stale",
        marketStatus: "LIVE",
        lastUpdated: "2026-07-03T22:00:10.000Z",
        stalenessSeconds: 121,
        staleAfterSeconds: 90,
        isStale: true,
        isSuspended: false,
        isDelayed: false,
        reason: "Latest market update is older than 90 seconds.",
      },
      outcomes: [
        {
          id: "aus",
          name: "Australia +0.5",
          label: "Australia +0.5",
          side: "home",
          referenceTokenId: "token-aus-spread",
          referenceOutcomeLabel: "Australia +0.5",
          price: 0.6,
          bestBid: 0.58,
          bestAsk: 0.62,
          isTradable: true,
        },
      ],
    });

    expect(normalized).toMatchObject({
      marketGroupId: "aus-egy-live-game-lines",
      marketType: "spread",
      period: "regulation",
      line: "+0.5",
      referenceSource: "polymarket",
      externalSlug: "australia-egypt-spread",
      externalMarketId: "gamma-spread-1",
      conditionId: "condition-spread-1",
      selection: {
        selectorKey: "spread:regulation:+0.5",
        marketId: "aus-egy-live-spread",
        marketGroupId: "aus-egy-live-game-lines",
        marketGroupTitle: "Game Lines",
        marketType: "spread",
        marketFamily: "spread",
        displayLabel: "Spread regulation +0.5",
        period: "regulation",
        line: "+0.5",
        lineValue: 0.5,
        unit: "goals",
        chart: {
          targetMarketId: "aus-egy-live-spread",
          status: "ready",
          source: "market-outcome-snapshot",
          pointCount: 3,
          outcomeCount: 1,
          range: "1D",
          ranges: ["1D"],
          emptyState: null,
        },
        outcomes: [{
          id: "aus",
          outcomeId: "aus",
          side: "home",
          tokenId: "token-aus-spread",
          referenceTokenId: "token-aus-spread",
          referenceOutcomeLabel: "Australia +0.5",
          isTradable: true,
        }],
      },
      liquidity: 4500,
      orderbookDepth: [{ outcomeId: "aus", side: "bid", price: 0.58, shares: 100, total: 58 }],
      availability: {
        source: "market-source-updated-at",
        status: "stale",
        marketStatus: "LIVE",
        stalenessSeconds: 121,
        staleAfterSeconds: 90,
        isStale: true,
      },
      outcomes: [{
        id: "aus",
        side: "home",
        referenceTokenId: "token-aus-spread",
        referenceOutcomeLabel: "Australia +0.5",
        bestBid: 0.58,
        bestAsk: 0.62,
      }],
    });
  });

  test("maps backend team total goals market type to the mobile team-total contract", () => {
    const normalized = normalizeMarket({
      ...baseMarket,
      title: "Curacao goals 1.5",
      marketGroupKey: "team-totals",
      marketGroupTitle: "Team totals",
      marketType: "team_total_goals",
      line: "1.5",
      outcomes: [
        {
          id: "over",
          name: "Over 1.5",
          label: "Over 1.5",
          side: "over",
          price: 0.59,
          bestBid: 0.57,
          bestAsk: 0.65,
          isTradable: true,
        },
      ],
    });

    expect(normalized).toMatchObject({
      marketType: "team-total",
      line: "1.5",
      outcomes: [{ id: "over", side: "over", bestBid: 0.57, bestAsk: 0.65 }],
    });
  });

  test("preserves live data freshness contract from backend event detail", () => {
    const detail: EventDetail = {
      event: {
        id: "event-1",
        slug: "world-cup-live",
        title: "Curacao vs Cote d'Ivoire",
        description: null,
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        homeTeamName: "Curacao",
        awayTeamName: "Cote d'Ivoire",
        startTime: "2026-06-25T20:00:00.000Z",
        status: "LIVE",
        liveStatus: "in_progress",
        period: "2H",
        clock: "67'",
        homeScore: 0,
        awayScore: 1,
        imageUrl: null,
        marketCount: 1,
        activeMarketCount: 1,
        liveDataStatus: {
          source: "provider-feed",
          status: "stale",
          lastUpdated: "2026-07-03T22:00:10.000Z",
          stalenessSeconds: 121,
          staleAfterSeconds: 90,
          isStale: true,
          isSuspended: false,
          isDelayed: false,
          reason: "Latest provider update is older than 90 seconds.",
        },
      },
      markets: [{
        ...baseMarket,
        id: "market-main",
        marketGroupTitle: "Match Winner",
        outcomes: [{
          id: "home",
          name: "Curacao",
          label: "Curacao",
          side: "home",
          price: 0.58,
          bestBid: 0.57,
          bestAsk: 0.61,
          isTradable: true,
        }],
      }],
    };

    expect(normalizeEventDetail(detail)?.liveDataStatus).toMatchObject({
      source: "provider-feed",
      status: "stale",
      stalenessSeconds: 121,
      staleAfterSeconds: 90,
      isStale: true,
    });
  });

  test("keeps backend live-detail page live when provider status is ended or stale", () => {
    const detail: EventDetail = {
      event: {
        id: "event-1",
        slug: "world-cup-provider-ended",
        title: "Colombia vs. Ghana",
        description: null,
        category: "Sports / Soccer",
        sportKey: "soccer",
        leagueKey: "world_cup",
        homeTeamName: "Colombia",
        awayTeamName: "Ghana",
        startTime: null,
        status: "live",
        liveStatus: "ENDED",
        period: "Final",
        clock: "FT",
        homeScore: 1,
        awayScore: 0,
        imageUrl: null,
        marketCount: 1,
        activeMarketCount: 1,
        liveDataStatus: {
          source: "polymarket-gamma",
          status: "stale",
          lastUpdated: "2026-07-04T03:50:04.000Z",
          stalenessSeconds: 900,
          staleAfterSeconds: 90,
          isStale: true,
          isSuspended: false,
          isDelayed: false,
          reason: "Provider event is closed/resolved.",
        },
      },
      markets: [{
        ...baseMarket,
        id: "market-main",
        marketGroupTitle: "Match Winner",
        outcomes: [{
          id: "home",
          name: "Colombia",
          label: "Colombia",
          side: "home",
          price: 0.99,
          bestBid: 0.99,
          bestAsk: 1,
          isTradable: true,
        }],
      }],
    };

    const normalized = normalizeEventDetail(detail);

    expect(normalized?.status).toBe("live");
    expect(normalized?.liveDataStatus?.status).toBe("stale");
  });

  test("preserves backend event market rules instead of deriving from local market heuristics", () => {
    const detail: EventDetail = {
      event: {
        id: "event-rules-1",
        slug: "backend-rule-owned",
        title: "Backend Rules Home vs Backend Rules Away",
        description: "Backend-provided market rules should win.",
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        homeTeamName: "Backend Rules Home",
        awayTeamName: "Backend Rules Away",
        startTime: "2026-07-10T20:00:00.000Z",
        status: "upcoming",
        liveStatus: null,
        period: null,
        clock: null,
        homeScore: null,
        awayScore: null,
        imageUrl: null,
        marketCount: 1,
        activeMarketCount: 1,
        marketProfile: "full_match_with_overtime",
        resultMode: "no_draw",
        gameRules: {
          allowDraw: false,
          includesOvertime: true,
          description: "Full match including overtime has no draw outcome.",
        },
        supportedMarketTypes: ["full_match_with_overtime", "to_advance"],
      },
      markets: [{
        ...baseMarket,
        id: "misleading-regulation-market",
        title: "Misleading 90 Minute Winner",
        marketGroupTitle: "Regulation Time Winner",
        marketType: "moneyline",
        period: "regulation",
        outcomes: [
          { id: "home", name: "Home", label: "Home", side: "home", price: 0.4, bestBid: 0.39, bestAsk: 0.41, isTradable: true },
          { id: "tie", name: "Tie", label: "Tie", side: "draw", price: 0.3, bestBid: 0.29, bestAsk: 0.31, isTradable: true },
          { id: "away", name: "Away", label: "Away", side: "away", price: 0.3, bestBid: 0.29, bestAsk: 0.31, isTradable: true },
        ],
      }],
    };

    const normalized = normalizeEventDetail(detail);

    expect(normalized?.marketProfile).toBe("full_match_with_overtime");
    expect(normalized?.resultMode).toBe("no_draw");
    expect(normalized?.gameRules).toMatchObject({
      allowDraw: false,
      includesOvertime: true,
      description: "Full match including overtime has no draw outcome.",
    });
    expect(normalized?.supportedMarketTypes).toEqual(["full_match_with_overtime", "to_advance"]);
  });
});
