import fs from "node:fs";
import path from "node:path";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";

const CYCLE = "cycle-NT-event-detail-profile-outcome-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const payload = (overrides: { profile?: string; resultMode?: string; allowDraw?: boolean; marketType?: string; outcomes?: unknown[] } = {}) => {
  const profile = overrides.profile ?? "regulation_90";
  return {
    event: {
      id: "db-event-id",
      slug: "backend-event-slug",
      title: "Mexico vs Ecuador",
      startTime: "2026-07-10T20:00:00.000Z",
      status: "live",
      liveStatus: "in_progress",
      homeScore: 1,
      awayScore: 1,
      marketCount: 1,
      activeMarketCount: 1,
      marketProfile: profile,
      resultMode: overrides.resultMode ?? "can_draw",
      gameRules: {
        allowDraw: overrides.allowDraw ?? true,
        includesOvertime: false,
        description: "Backend-owned game rules.",
      },
      supportedMarketTypes: [profile],
    },
    markets: [
      {
        id: "profile-market",
        title: "Profile Market",
        status: "LIVE",
        marketGroupTitle: "Profile Market",
        marketType: overrides.marketType ?? profile,
        period: "regulation",
        line: null,
        liquidity: "1000.50",
        outcomes: overrides.outcomes ?? [
          { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.42, bestBid: null, bestAsk: null, isTradable: true },
          { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.31, bestBid: null, bestAsk: null, isTradable: true },
          { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.27, bestBid: null, bestAsk: null, isTradable: true },
        ],
      },
    ],
  };
};

const accepts = (value: unknown) => {
  try {
    assertEventDetailRoutePayloadShape(value);
    return true;
  } catch {
    return false;
  }
};

const rejectsWith = (value: unknown, text: string) => {
  try {
    assertEventDetailRoutePayloadShape(value);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const twoTeamOutcomes = [
  { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.52, bestBid: null, bestAsk: null, isTradable: true },
  { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.48, bestBid: null, bestAsk: null, isTradable: true },
];

const assertions = {
  acceptsRegulationWithDraw: accepts(payload()),
  rejectsRegulationWithoutDraw: rejectsWith(
    payload({ outcomes: twoTeamOutcomes }),
    "without draw outcome",
  ),
  acceptsAdvanceNoDraw: accepts(payload({
    profile: "to_advance",
    resultMode: "no_draw",
    allowDraw: false,
    outcomes: twoTeamOutcomes,
  })),
  rejectsAdvanceWithDraw: rejectsWith(
    payload({
      profile: "to_advance",
      resultMode: "no_draw",
      allowDraw: false,
      outcomes: [
        ...twoTeamOutcomes,
        { id: "draw", name: "Tie", label: "Tie", side: "draw", price: 0.01, bestBid: null, bestAsk: null, isTradable: true },
      ],
    }),
    "with draw outcome",
  ),
};

const proof = {
  cycle: "Cycle NT",
  feature: "Event Detail profile outcome contract",
  generatedAt: new Date().toISOString(),
  route: "/api/mobile/events/:slug/live-detail",
  contract: {
    validPayload: "regulation_90 markets must provide a draw outcome, while no-draw advance/full-match markets must provide only two team outcomes.",
    malformedPayload: "profile markets with missing or unsupported draw outcome structure reject before visible Event Detail markets apply.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NT proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
