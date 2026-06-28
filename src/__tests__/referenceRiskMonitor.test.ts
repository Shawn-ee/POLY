import { evaluateReferenceRiskState, ReferenceRiskMonitorConfig, ReferenceRiskSnapshot } from "@/server/services/referenceRiskMonitor";

const now = new Date("2026-06-27T12:00:00.000Z");

function config(overrides: Partial<ReferenceRiskMonitorConfig> = {}): ReferenceRiskMonitorConfig {
  return {
    id: "config-1",
    marketId: "market-1",
    marketTitle: "World Cup Winner",
    outcomeId: null,
    outcomeName: null,
    enabled: true,
    source: "polymarket",
    marketType: "yes_no",
    mappingEnabled: true,
    staleAfterSeconds: 30,
    tickSize: 0.01,
    maxOutcomeExposure: 5,
    maxMarketExposure: 8,
    ...overrides,
  };
}

function snapshot(overrides: Partial<ReferenceRiskSnapshot> = {}): ReferenceRiskSnapshot {
  return {
    marketId: "market-1",
    outcomeId: "outcome-1",
    outcomeName: "Yes",
    fetchedAt: new Date("2026-06-27T11:59:50.000Z"),
    bestBid: 0.48,
    bestAsk: 0.52,
    outcomePrice: 0.5,
    lastTradePrice: 0.5,
    acceptingOrders: true,
    mmEligible: true,
    qualityStatus: "ok",
    reason: null,
    ...overrides,
  };
}

describe("evaluateReferenceRiskState", () => {
  it("pauses stale reference prices", () => {
    const alerts = evaluateReferenceRiskState({
      now,
      configs: [config()],
      snapshots: [snapshot({ fetchedAt: new Date("2026-06-27T11:58:00.000Z") })],
      openOrders: [],
    });

    expect(alerts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "stale_reference", action: "pause" })]));
  });

  it("pauses disabled mappings", () => {
    const alerts = evaluateReferenceRiskState({
      now,
      configs: [config({ mappingEnabled: false })],
      snapshots: [snapshot()],
      openOrders: [],
    });

    expect(alerts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "disabled_mapping", action: "pause" })]));
  });

  it("skips unsupported market types without forcing cancellation by itself", () => {
    const alerts = evaluateReferenceRiskState({
      now,
      configs: [config({ marketType: "correct_score" })],
      snapshots: [snapshot()],
      openOrders: [],
    });

    expect(alerts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "unsupported_market_type", action: "skip" })]));
  });

  it("pauses near kickoff and live markets", () => {
    const alerts = evaluateReferenceRiskState({
      now,
      configs: [
        config({ id: "near-kickoff", eventStartTime: new Date("2026-06-27T12:30:00.000Z") }),
        config({ id: "live", marketId: "market-2", eventLiveStatus: "live" }),
      ],
      snapshots: [snapshot(), snapshot({ marketId: "market-2" })],
      openOrders: [],
    });

    expect(alerts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "kickoff_proximity", action: "pause" })]));
    expect(alerts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "live_market", action: "pause" })]));
  });

  it("pauses when open bot exposure exceeds limits", () => {
    const alerts = evaluateReferenceRiskState({
      now,
      configs: [config({ maxMarketExposure: 1, maxOutcomeExposure: 1 })],
      snapshots: [snapshot()],
      openOrders: [{ marketId: "market-1", outcomeId: "outcome-1", side: "BUY", price: 0.6, remaining: 3 }],
    });

    expect(alerts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "exposure_exceeded", action: "pause" })]));
  });

  it("pauses on rapid reference movement and repeated reference errors", () => {
    const alerts = evaluateReferenceRiskState({
      now,
      configs: [config()],
      snapshots: [
        snapshot({ outcomeId: "outcome-1", bestBid: 0.7, bestAsk: 0.72, lastTradePrice: 0.5, acceptingOrders: false, reason: "missing_book" }),
        snapshot({ outcomeId: "outcome-2", bestBid: 0.2, bestAsk: 0.22, acceptingOrders: false, reason: "api_error" }),
      ],
      openOrders: [],
    });

    expect(alerts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "rapid_reference_move", action: "pause" })]));
    expect(alerts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "repeated_reference_error", action: "pause" })]));
  });
});
