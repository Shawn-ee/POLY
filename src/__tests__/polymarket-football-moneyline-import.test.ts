import { importPolymarketGroupedEvent } from "@/server/services/polymarketEventImport";

const market = (selection: string, selectionLine: string, price: string, slugSuffix: string) => ({
  id: `pm-${slugSuffix}`,
  question:
    selection === "Draw"
      ? "Will Brazil vs. Japan end in a draw?"
      : `Will ${selection} win on 2026-06-29?`,
  conditionId: `condition-${slugSuffix}`,
  slug: `fifwc-bra-jpn-2026-06-29-${slugSuffix}`,
  groupItemTitle: selection === "Draw" ? "Draw (Brazil vs. Japan)" : selection,
  outcomes: '["Yes","No"]',
  outcomePrices: `[${JSON.stringify(price)},"${(1 - Number(price)).toFixed(3)}"]`,
  clobTokenIds: `["yes-${slugSuffix}","no-${slugSuffix}"]`,
  bestBid: Number(price) - 0.005,
  bestAsk: Number(price) + 0.005,
  spread: 0.01,
  lastTradePrice: Number(price),
  volume: 100,
  volume24hr: 50,
  liquidity: 1000,
  liquidityClob: 1000,
  acceptingOrders: true,
  active: true,
  closed: false,
  archived: false,
  sportsMarketType: "moneyline",
  marketMetadata: {
    opticOddsMarketId: "moneyline_3-way",
    opticOddsMarketName: "Moneyline 3-Way",
    opticOddsSelection: selection,
    opticOddsSelectionLine: selectionLine,
  },
});

describe("Polymarket football moneyline import", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("dry-run projects moneyline_3-way child markets into one Match Winner 1X2 import", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "636318",
          slug: "fifwc-bra-jpn-2026-06-29",
          title: "Brazil vs. Japan",
          description: "World Cup match",
          active: true,
          closed: false,
          archived: false,
          startTime: "2026-06-29T17:00:00Z",
          endDate: "2026-06-29T17:00:00Z",
          liquidity: 1_000_000,
          volume: 2_000_000,
          negRisk: true,
          negRiskMarketID: "neg-risk-id",
          tags: [{ label: "Soccer" }, { label: "FIFA World Cup" }],
          markets: [
            market("Brazil", "home", "0.575", "bra"),
            market("Draw", "draw", "0.255", "draw"),
            market("Japan", "away", "0.175", "jpn"),
          ],
        },
      ],
    } as Response);

    const result = await importPolymarketGroupedEvent("fifwc-bra-jpn-2026-06-29", {
      dryRun: true,
      confirmImport: false,
      actorUserId: "admin-1",
    });

    expect(result.dryRun).toBe(true);
    expect(result.localEventSlug).toBe("brazil-vs-japan");
    expect(result.groupedMarketCount).toBe(1);
    expect(result.imported).toEqual([
      expect.objectContaining({
        team: "Match Winner",
        slug: "fifwc-bra-jpn-2026-06-29-moneyline-3-way",
        marketId: "636318:moneyline_3-way",
        importStatus: "approved",
      }),
    ]);
  });
});
