import fs from "node:fs";
import path from "node:path";
import { assertEventListRoutePayloadShape } from "../mobile/src/services/eventListRouteShapeService";

const CYCLE = "cycle-NS-event-list-pagination-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const payload = (pageOverrides: Record<string, unknown> = {}) => ({
  events: [
    {
      id: "event-id",
      slug: "mexico-vs-ecuador",
      title: "Mexico vs Ecuador",
      status: "scheduled",
      startTime: "2026-06-12T18:05:00.000Z",
      liveStatus: null,
      markets: [
        {
          id: "winner-market",
          title: "Regulation Time Winner",
          status: "OPEN",
          outcomes: [
            {
              id: "home",
              name: "Mexico",
              label: "Mexico",
              price: "0.42",
              bestBid: "0.41",
              bestAsk: "0.43",
              isTradable: true,
            },
          ],
        },
      ],
    },
  ],
  nextCursor: "event-id",
  page: {
    limit: 10,
    nextCursor: "event-id",
    hasMore: true,
    ...pageOverrides,
  },
});

const accepts = (value: unknown) => {
  try {
    assertEventListRoutePayloadShape(value);
    return true;
  } catch {
    return false;
  }
};

const rejectsWith = (value: unknown, text: string) => {
  try {
    assertEventListRoutePayloadShape(value);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const assertions = {
  acceptsUsablePagination: accepts(payload()),
  acceptsFinalPageWithoutCursor: accepts(payload({ nextCursor: null, hasMore: false })),
  rejectsZeroLimit: rejectsWith(payload({ limit: 0 }), "malformed page limit"),
  rejectsNegativeLimit: rejectsWith(payload({ limit: -1 }), "malformed page limit"),
  rejectsFractionalLimit: rejectsWith(payload({ limit: 10.5 }), "malformed page limit"),
  rejectsHasMoreWithoutCursor: rejectsWith(
    payload({ nextCursor: null, hasMore: true }),
    "hasMore without page nextCursor",
  ),
};

const proof = {
  cycle: "Cycle NS",
  feature: "Event list pagination contract",
  generatedAt: new Date().toISOString(),
  route: "/api/events",
  surfaces: ["Home", "Search", "Live", "Futures"],
  contract: {
    validPayload: "event-list page metadata must use a positive integer limit and provide a page nextCursor when hasMore is true.",
    malformedPayload: "impossible page limits or hasMore without a cursor reject before visible pagination state applies.",
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

if (failed.length) {
  console.error(`Cycle NS proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
