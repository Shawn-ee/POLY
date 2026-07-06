import fs from "node:fs";
import path from "node:path";
import {
  eventStatusGroupFilter,
  LIVE_EVENT_LIVE_STATUSES,
  LIVE_EVENT_STATUSES,
  TERMINAL_EVENT_STATUSES,
  UPCOMING_EVENT_STATUSES,
} from "../src/server/services/mobileEventStatusFilters";

const CYCLE = "cycle-LM-mobile-event-status-group-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);
const now = new Date("2026-07-06T12:00:00.000Z");

const liveFilter = eventStatusGroupFilter("live", now);
const todayFilter = eventStatusGroupFilter("today", now);
const upcomingFilter = eventStatusGroupFilter("upcoming", now);

const serializedLive = JSON.stringify(liveFilter);
const serializedToday = JSON.stringify(todayFilter);
const serializedUpcoming = JSON.stringify(upcomingFilter);

const assertions = {
  liveGroupIncludesStatusAndLiveStatus:
    LIVE_EVENT_STATUSES.includes("live") &&
    LIVE_EVENT_LIVE_STATUSES.includes("in_progress") &&
    serializedLive.includes("liveStatus") &&
    serializedLive.includes("in_progress"),
  todayGroupUsesUtcDayWindow:
    serializedToday.includes("2026-07-06T00:00:00.000Z") &&
    serializedToday.includes("2026-07-07T00:00:00.000Z"),
  upcomingGroupIncludesScheduledOrFuture:
    UPCOMING_EVENT_STATUSES.includes("scheduled") &&
    serializedUpcoming.includes("scheduled") &&
    serializedUpcoming.includes("gt"),
  upcomingGroupExcludesLiveTodayAndTerminal:
    serializedUpcoming.includes("NOT") &&
    serializedUpcoming.includes("today") &&
    serializedUpcoming.includes("liveStatus") &&
    TERMINAL_EVENT_STATUSES.includes("closed") &&
    TERMINAL_EVENT_STATUSES.includes("resolved") &&
    TERMINAL_EVENT_STATUSES.includes("canceled") &&
    serializedUpcoming.includes("closed") &&
    serializedUpcoming.includes("resolved") &&
    serializedUpcoming.includes("canceled"),
};

const failed = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const proof = {
  cycle: "Cycle LM",
  feature: "Mobile event status group contract",
  generatedAt: new Date().toISOString(),
  route: "/api/events?statusGroup=live|today|upcoming",
  contract: {
    live: "status=live or liveStatus=live/in_progress",
    today: "status=today or startTime inside current UTC day",
    upcoming: "scheduled/upcoming or future startTime, excluding live/today/terminal events",
  },
  samples: {
    now: now.toISOString(),
    liveFilter,
    todayFilter,
    upcomingFilter,
  },
  assertions,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

if (failed.length) {
  console.error(`Cycle LM proof failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({ outputPath, assertions }, null, 2));
