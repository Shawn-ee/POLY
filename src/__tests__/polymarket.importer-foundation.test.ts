import {
  buildDisabledPolymarketMappingMetadata,
  buildPolymarketImportCandidates,
  buildVerifiedPolymarketMappingMetadata,
  classifyPolymarketMarketType,
  isPolymarketMappingEnabled,
  isWorldCupSoccerCandidate,
  parsePolymarketMarketCandidate,
} from "@/server/services/polymarket";

describe("Polymarket importer foundation", () => {
  test("parses Gamma market fields and token mappings", () => {
    const candidate = parsePolymarketMarketCandidate({
      id: "pm-1",
      conditionId: "cond-1",
      slug: "will-france-win-the-2026-fifa-world-cup",
      question: "Will France win the 2026 FIFA World Cup?",
      outcomes: "[\"Yes\",\"No\"]",
      clobTokenIds: "[\"tok-yes\",\"tok-no\"]",
      outcomePrices: "[\"0.25\",\"0.75\"]",
      active: true,
      closed: false,
      archived: false,
      acceptingOrders: true,
      bestBid: "0.24",
      bestAsk: "0.26",
      tags: [{ label: "Soccer" }],
    });

    expect(candidate).toMatchObject({
      externalMarketId: "pm-1",
      conditionId: "cond-1",
      marketType: "yes_no",
      mid: 0.25,
      outcomes: [
        { name: "Yes", tokenId: "tok-yes", price: 0.25 },
        { name: "No", tokenId: "tok-no", price: 0.75 },
      ],
    });
    expect(candidate && isWorldCupSoccerCandidate(candidate)).toBe(true);
  });

  test("classifies first-version market types", () => {
    expect(classifyPolymarketMarketType({ title: "Both teams to score?", outcomes: ["Yes", "No"] })).toBe("both_teams_to_score");
    expect(classifyPolymarketMarketType({ title: "France vs Germany", outcomes: ["France", "Draw", "Germany"] })).toBe("match_winner_1x2");
    expect(classifyPolymarketMarketType({ title: "Total goals over 2.5", outcomes: ["Over", "Under"] })).toBe("total_goals");
    expect(classifyPolymarketMarketType({ title: "Correct score France 2-1", outcomes: ["Yes", "No"] })).toBe("correct_score_unsupported");
  });

  test("dedupes import candidates and starts low-confidence items as needs_review", () => {
    const first = parsePolymarketMarketCandidate({
      id: "pm-1",
      question: "Will France win the 2026 FIFA World Cup?",
      outcomes: ["Yes", "No"],
      clobTokenIds: ["tok-yes", "tok-no"],
      active: true,
      acceptingOrders: true,
      bestBid: 0.2,
      bestAsk: 0.22,
      tags: ["Soccer"],
    });
    const duplicate = first ? { ...first } : null;
    const unrelated = parsePolymarketMarketCandidate({
      id: "pm-2",
      question: "Will a cricket World Cup final go to overtime?",
      outcomes: ["Yes", "No"],
      clobTokenIds: ["tok-1", "tok-2"],
      active: true,
      acceptingOrders: true,
    });

    const candidates = buildPolymarketImportCandidates({
      event: null,
      markets: [first, duplicate, unrelated].filter((item): item is NonNullable<typeof item> => item != null),
    });

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({ confidence: "high", status: "draft" });
    expect(candidates[1]).toMatchObject({ confidence: "low", status: "needs_review" });
    expect(candidates[1].reasons).toContain("not_world_cup_soccer");
  });

  test("mapping verify and disable metadata transitions are explicit", () => {
    const verified = buildVerifiedPolymarketMappingMetadata({
      current: null,
      actorUserId: "admin-1",
      reviewNotes: "checked token ids",
    });
    expect(isPolymarketMappingEnabled(verified)).toBe(true);

    const disabled = buildDisabledPolymarketMappingMetadata({
      current: verified,
      actorUserId: "admin-1",
    });
    expect(isPolymarketMappingEnabled(disabled)).toBe(false);
    expect(disabled).toMatchObject({
      importStatus: "rejected",
      mappingDisabled: true,
      tradable: false,
      mmEnabled: false,
    });
  });
});
