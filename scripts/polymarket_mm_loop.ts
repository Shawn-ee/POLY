import { setTimeout as delay } from "node:timers/promises";
import { runPolymarketMmLoopOnce } from "@/server/services/polymarketMmOpsLoop";

const liveLocal = process.env.POLYMARKET_MM_LIVE_LOCAL === "true";
const skipDiscovery = process.env.POLYMARKET_MM_SKIP_DISCOVERY === "true";
const forever = process.env.POLYMARKET_MM_LOOP_FOREVER === "true";
const pollMs = Math.max(1000, Number(process.env.POLYMARKET_MM_LOOP_MS ?? 30000));

async function tick() {
  const result = await runPolymarketMmLoopOnce({ liveLocal, skipDiscovery });
  console.log(JSON.stringify({
    generatedAt: result.generatedAt,
    reportPath: result.reportPath,
    status: result.status,
  }, null, 2));
}

async function main() {
  do {
    await tick();
    if (forever) await delay(pollMs);
  } while (forever);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
