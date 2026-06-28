import { buildResolutionProposal, ResolutionProposalMarket } from "@/server/services/resolutionProposalBot";

function market(overrides: Partial<ResolutionProposalMarket> = {}): ResolutionProposalMarket {
  return {
    id: "market-1",
    title: "USA vs Mexico",
    marketType: "match_winner_1x2",
    line: null,
    resolvedOutcomeId: null,
    settlementStatus: null,
    outcomes: [
      { id: "home", name: "USA", code: "home_win", side: "home_win" },
      { id: "draw", name: "Draw", code: "draw", side: "draw" },
      { id: "away", name: "Mexico", code: "away_win", side: "away_win" },
    ],
    event: {
      id: "event-1",
      title: "USA vs Mexico",
      homeTeamName: "USA",
      awayTeamName: "Mexico",
      homeScore: 2,
      awayScore: 1,
      status: "final",
      liveStatus: null,
      source: "fixture",
      sourceUpdatedAt: "2026-06-27T12:00:00.000Z",
    },
    ...overrides,
  };
}

describe("buildResolutionProposal", () => {
  it("suggests a low-risk match winner result", () => {
    const proposal = buildResolutionProposal(market());

    expect(proposal).toEqual(expect.objectContaining({
      action: "resolve",
      risk: "low_risk",
      resultCode: "home_win",
      proposedOutcomeId: "home",
    }));
  });

  it("suggests total goals over, under, and push outcomes", () => {
    expect(buildResolutionProposal(market({
      marketType: "total_goals",
      line: 2.5,
      outcomes: [
        { id: "over", name: "Over 2.5", code: "over" },
        { id: "under", name: "Under 2.5", code: "under" },
      ],
    }))).toEqual(expect.objectContaining({ action: "resolve", resultCode: "over", proposedOutcomeId: "over" }));

    expect(buildResolutionProposal(market({
      marketType: "total_goals",
      line: 4.5,
      outcomes: [
        { id: "over", name: "Over 4.5", code: "over" },
        { id: "under", name: "Under 4.5", code: "under" },
      ],
    }))).toEqual(expect.objectContaining({ action: "resolve", resultCode: "under", proposedOutcomeId: "under" }));

    expect(buildResolutionProposal(market({
      marketType: "total_goals",
      line: 3,
      outcomes: [
        { id: "over", name: "Over 3", code: "over" },
        { id: "under", name: "Under 3", code: "under" },
      ],
    }))).toEqual(expect.objectContaining({ action: "push", resultCode: "push", proposedOutcomeId: null }));
  });

  it("suggests both-teams-to-score yes/no results", () => {
    expect(buildResolutionProposal(market({
      marketType: "both_teams_to_score",
      outcomes: [
        { id: "yes", name: "Yes", code: "yes" },
        { id: "no", name: "No", code: "no" },
      ],
    }))).toEqual(expect.objectContaining({ action: "resolve", resultCode: "yes", proposedOutcomeId: "yes" }));

    expect(buildResolutionProposal(market({
      marketType: "both_teams_to_score",
      outcomes: [
        { id: "yes", name: "Yes", code: "yes" },
        { id: "no", name: "No", code: "no" },
      ],
      event: { ...market().event!, homeScore: 2, awayScore: 0 },
    }))).toEqual(expect.objectContaining({ action: "resolve", resultCode: "no", proposedOutcomeId: "no" }));
  });

  it("routes unfinished, unsupported, and conflicting proposals to review", () => {
    expect(buildResolutionProposal(market({ event: { ...market().event!, status: "scheduled" } }))).toEqual(
      expect.objectContaining({ risk: "needs_review", reasons: expect.arrayContaining(["event_not_marked_final"]) }),
    );

    expect(buildResolutionProposal(market({ marketType: "correct_score" }))).toEqual(
      expect.objectContaining({ action: "unsupported", risk: "needs_review" }),
    );

    expect(buildResolutionProposal(market({ outcomes: [{ id: "other", name: "Other", code: "other" }] }))).toEqual(
      expect.objectContaining({ action: "needs_review", risk: "conflict", reasons: expect.arrayContaining(["no_matching_outcome"]) }),
    );
  });
});
