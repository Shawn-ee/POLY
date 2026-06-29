import { buildWorldCupEventPageModel, type WorldCupMarketInput } from "@/lib/sports/worldCupEventPageModel";

const event = {
  id: "event-1",
  slug: "usa-vs-mexico",
  title: "USA vs Mexico",
  description: "World Cup fixture",
  homeTeamName: "USA",
  awayTeamName: "Mexico",
  startTime: "2026-06-28T20:00:00.000Z",
  venue: "Dallas",
  status: "scheduled",
  source: "polymarket",
  externalSlug: "fifwc-usa-mex-2026-06-28",
};

const market = (overrides: Partial<WorldCupMarketInput>): WorldCupMarketInput => ({
  id: overrides.id ?? "market-1",
  title: overrides.title ?? "USA vs Mexico: Total goals 2.5",
  description: overrides.description ?? "Total goals",
  status: overrides.status ?? "LIVE",
  marketGroupKey: overrides.marketGroupKey ?? "totals",
  marketGroupTitle: overrides.marketGroupTitle ?? "Totals",
  displayOrder: overrides.displayOrder ?? 1,
  line: overrides.line ?? "2.5",
  unit: overrides.unit ?? "goals",
  period: overrides.period ?? null,
  participantName: overrides.participantName ?? null,
  propCategory: overrides.propCategory ?? "goals",
  marketType: overrides.marketType ?? "total_goals",
  referenceSource: "referenceSource" in overrides ? overrides.referenceSource : "polymarket",
  importStatus: "importStatus" in overrides ? overrides.importStatus : "approved",
  referenceOnly: "referenceOnly" in overrides ? overrides.referenceOnly : true,
  tradable: "tradable" in overrides ? overrides.tradable : false,
  mmEnabled: "mmEnabled" in overrides ? overrides.mmEnabled : false,
  visibility: "visibility" in overrides ? overrides.visibility : "PUBLIC",
  isListed: "isListed" in overrides ? overrides.isListed : true,
  externalMarketId: "externalMarketId" in overrides ? overrides.externalMarketId : `${overrides.id ?? "market-1"}-gamma`,
  externalSlug: "externalSlug" in overrides ? overrides.externalSlug : `${overrides.id ?? "market-1"}-external`,
  conditionId: "conditionId" in overrides ? overrides.conditionId : `${overrides.id ?? "market-1"}-condition`,
  referenceSummary: "referenceSummary" in overrides ? overrides.referenceSummary : {
    source: "polymarket",
    referenceBid: 0.48,
    referenceAsk: 0.52,
    plannedBotBid: 0.46,
    plannedBotAsk: 0.54,
    qualityStatus: "available",
    isFresh: true,
    mmEligible: false,
    hasSnapshot: true,
  },
  outcomes: overrides.outcomes ?? [
    { id: `${overrides.id ?? "market-1"}-over`, name: "Over 2.5", label: "Over", side: "over", code: "OVER", displayOrder: 0, price: null, bestBid: null, bestAsk: null, isTradable: true },
    { id: `${overrides.id ?? "market-1"}-under`, name: "Under 2.5", label: "Under", side: "under", code: "UNDER", displayOrder: 1, price: null, bestBid: null, bestAsk: null, isTradable: true },
  ],
});

describe("World Cup event page model", () => {
  test("groups match winner and total goals into Polymarket-style families", () => {
    const model = buildWorldCupEventPageModel({
      event,
      markets: [
        market({
          id: "winner",
          title: "USA vs Mexico: Match winner",
          marketType: "match_winner_1x2",
          line: null,
          outcomes: [
            { id: "home", name: "USA", code: "HOME", side: "home", displayOrder: 0, bestBid: 0.41, bestAsk: 0.44, price: 0.425, isTradable: true },
            { id: "draw", name: "Draw", code: "DRAW", side: "draw", displayOrder: 1, bestBid: 0.26, bestAsk: 0.29, price: 0.275, isTradable: true },
            { id: "away", name: "Mexico", code: "AWAY", side: "away", displayOrder: 2, bestBid: 0.31, bestAsk: 0.34, price: 0.325, isTradable: true },
          ],
        }),
        market({ id: "total-25", line: "2.5" }),
      ],
      internalTradingEnabled: true,
      tradingKillSwitch: false,
      realMoneyMode: false,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });

    expect(model.groups.map((group) => group.family)).toEqual(["match_winner", "total_goals"]);
    expect(model.groups[0].displayType).toBe("three_way");
    expect(model.groups[1].displayType).toBe("line_selector");
    expect(model.tabs.find((tab) => tab.id === "match")?.count).toBe(1);
    expect(model.tabs.find((tab) => tab.id === "goals")?.count).toBe(1);
  });

  test("uses local book before reference price and enables tradeability", () => {
    const model = buildWorldCupEventPageModel({
      event,
      markets: [
        market({
          outcomes: [
            { id: "over", name: "Over 2.5", side: "over", displayOrder: 0, bestBid: 0.62, bestAsk: 0.65, price: 0.635, isTradable: true },
            { id: "under", name: "Under 2.5", side: "under", displayOrder: 1, bestBid: null, bestAsk: null, price: null, isTradable: true },
          ],
        }),
      ],
      internalTradingEnabled: true,
      tradingKillSwitch: false,
      realMoneyMode: false,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });

    const over = model.groups[0].outcomes[0];
    expect(over.source).toBe("local_bot_book");
    expect(over.price).toBe(0.635);
    expect(over.tradeable).toBe(true);
  });

  test("shows reference-only reason when no local book exists", () => {
    const model = buildWorldCupEventPageModel({
      event,
      markets: [market({ id: "total-25" })],
      internalTradingEnabled: true,
      tradingKillSwitch: false,
      realMoneyMode: false,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });

    const outcome = model.groups[0].outcomes[0];
    expect(outcome.source).toBe("reference_price");
    expect(outcome.price).toBe(0.5);
    expect(outcome.tradeable).toBe(false);
    expect(outcome.reasonIfDisabled).toBe("Reference price only. No internal liquidity.");
  });

  test("line-selector outcome labels include the selected total line", () => {
    const model = buildWorldCupEventPageModel({
      event,
      markets: [market({ id: "total-15", line: "1.5" }), market({ id: "total-25", line: "2.5" })],
      internalTradingEnabled: true,
      tradingKillSwitch: false,
      realMoneyMode: false,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });

    const total = model.groups.find((group) => group.family === "total_goals");
    expect(total?.displayType).toBe("line_selector");
    expect(total?.lines.map((line) => line.outcomes[0].label)).toEqual(["Over 1.5", "Over 2.5"]);
  });

  test("hides stale, unmapped, and no-live-price states from user-facing groups without fake 50", () => {
    const stale = buildWorldCupEventPageModel({
      event,
      markets: [market({ referenceSummary: { source: "polymarket", referenceBid: 0.4, referenceAsk: 0.42, isFresh: false, hasSnapshot: true } })],
      internalTradingEnabled: true,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });
    expect(stale.groups).toEqual([]);
    expect(stale.diagnostics.hiddenNoReferenceCount).toBe(1);

    const unmapped = buildWorldCupEventPageModel({
      event,
      markets: [market({ importStatus: null, referenceOnly: null, referenceSummary: null, referenceSource: null, externalMarketId: null, externalSlug: null, conditionId: null })],
      internalTradingEnabled: true,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });
    expect(unmapped.groups).toEqual([]);
    expect(unmapped.diagnostics.hiddenUnmappedCount).toBe(1);
  });

  test("does not count FIFA schedule fixture markets as Polymarket mapped", () => {
    const model = buildWorldCupEventPageModel({
      event: {
        ...event,
        source: "fifa_schedule",
        externalSlug: "world-cup-2026-japan-vs-sweden-2026-06-25",
      },
      markets: [
        market({
          id: "japan-sweden-winner",
          title: "Japan vs Sweden: Match Winner",
          marketType: "match_winner_1x2",
          line: null,
          referenceOnly: null,
          referenceSummary: null,
          referenceSource: "fifa_schedule",
          externalMarketId: "M57-match-winner",
          externalSlug: "world-cup-2026-japan-vs-sweden-2026-06-25-match-winner",
          conditionId: null,
          outcomes: [
            { id: "japan", name: "Japan", code: "HOME", side: "home", displayOrder: 0, bestBid: null, bestAsk: null, price: null, isTradable: true },
            { id: "draw", name: "Draw", code: "DRAW", side: "draw", displayOrder: 1, bestBid: null, bestAsk: null, price: null, isTradable: true },
            { id: "sweden", name: "Sweden", code: "AWAY", side: "away", displayOrder: 2, bestBid: null, bestAsk: null, price: null, isTradable: true },
          ],
        }),
      ],
      internalTradingEnabled: true,
      tradingKillSwitch: false,
      realMoneyMode: false,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });

    expect(model.eventHeader.mappedEvent).toBe(false);
    expect(model.diagnostics.mappedMarketsCount).toBe(0);
    expect(model.diagnostics.unmappedMarketsCount).toBe(1);
    expect(model.groups).toEqual([]);
    expect(model.diagnostics.hiddenUnmappedCount).toBe(1);
  });

  test("hides closed markets on stale events and records diagnostics", () => {
    const model = buildWorldCupEventPageModel({
      event: { ...event, startTime: "2026-06-26T10:00:00.000Z", status: "scheduled" },
      markets: [market({ status: "CLOSED" }), market({ id: "live", status: "LIVE" })],
      internalTradingEnabled: true,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });

    expect(model.status).toBe("stale");
    expect(model.diagnostics.hiddenStaleMarkets).toBe(2);
    expect(model.groups).toEqual([]);
  });

  test("keeps draft/admin-review markets out of the user-facing model", () => {
    const model = buildWorldCupEventPageModel({
      event,
      markets: [market({ importStatus: "pending_review", visibility: "PRIVATE", isListed: false })],
      internalTradingEnabled: true,
      now: new Date("2026-06-27T20:00:00.000Z"),
    });

    expect(model.groups).toEqual([]);
    expect(model.diagnostics.hiddenDraftCount).toBe(1);
    expect(model.diagnostics.userFacingEligibleMarketCount).toBe(0);
  });
});
