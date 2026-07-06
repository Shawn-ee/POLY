import fs from "node:fs";
import path from "node:path";
import { assertEventDetailRoutePayloadShape } from "../mobile/src/services/eventDetailRouteShapeService";

const CYCLE = "cycle-NU-event-detail-profile-rules-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const payload = (overrides: {
  profile?: string;
  resultMode?: string;
  allowDraw?: boolean;
  includesOvertime?: boolean;
  outcomes?: unknown[];
} = {}) => {
  const profile = overrides.profile ?? "regulation_90";
  const allowDraw = overrides.allowDraw ?? profile === "regulation_90";
  const includesOvertime = overrides.includesOvertime ?? profile !== "regulation_90";
  const resultMode = overrides.resultMode ?? (allowDraw ? "can_draw" : "no_draw");
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
      resultMode,
      gameRules: {
        allowDraw,
        includesOvertime,
        description: "Backend-owned game profile rules.",
      },
      supportedMarketTypes: [profile],
    },
    markets: [
      {
        id: "profile-market",
        title: "Profile Market",
        status: "LIVE",
        marketGroupTitle: "Profile Market",
        marketType: profile,
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

const twoTeamOutcomes = [
  { id: "home", name: "Mexico", label: "Mexico", side: "home", price: 0.52, bestBid: null, bestAsk: null, isTradable: true },
  { id: "away", name: "Ecuador", label: "Ecuador", side: "away", price: 0.48, bestBid: null, bestAsk: null, isTradable: true },
];

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

const assertions = {
  acceptsRegulationDrawNoOvertime: accepts(payload()),
  rejectsRegulationWithOvertime: rejectsWith(
    payload({ includesOvertime: true }),
    "inconsistent regulation profile rules",
  ),
  acceptsAdvanceNoDrawOvertime: accepts(payload({
    profile: "to_advance",
    allowDraw: false,
    includesOvertime: true,
    resultMode: "no_draw",
    outcomes: twoTeamOutcomes,
  })),
  rejectsAdvanceCanDraw: rejectsWith(
    payload({
      profile: "to_advance",
      allowDraw: true,
      includesOvertime: true,
      resultMode: "can_draw",
      outcomes: twoTeamOutcomes,
    }),
    "inconsistent no-draw profile rules",
  ),
  rejectsFullMatchWithoutOvertime: rejectsWith(
    payload({
      profile: "full_match_with_overtime",
      allowDraw: false,
      includesOvertime: false,
      resultMode: "no_draw",
      outcomes: twoTeamOutcomes,
    }),
    "inconsistent no-draw profile rules",
  ),
};

const proof = {
  cycle: "Cycle NU",
  feature: "Event Detail profile rules contract",
  generatedAt: new Date().toISOString(),
  route: "/api/mobile/events/:slug/live-detail",
  contract: {
    validPayload: "regulation_90 profiles must be draw-capable regulation-only markets; advance/overtime profiles must be no-draw and include overtime/advancement semantics.",
    malformedPayload: "contradictory marketProfile, resultMode, and gameRules combinations reject before visible Event Detail state applies.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NU proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
