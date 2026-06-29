import {
  enableSafeBasketConfigs,
  getSafeBasketBlockers,
  loadWorldCupSafeBasketCandidates,
  planSafeBasket,
} from "@/server/services/polymarketMmSafeBasket";

function flag(name: string) {
  return process.argv.includes(`--${name}`);
}

function option(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function main() {
  const confirm = flag("confirm");
  const confirmDryRun = flag("confirmDryRun");
  const allowBelowTarget = flag("allowBelowTarget");
  const replaceExisting = flag("replaceExisting");
  if (process.env.REAL_MONEY_MODE === "true") {
    throw new Error("Safe basket setup refuses REAL_MONEY_MODE=true.");
  }
  if (process.env.LOCAL_BOT_TRADING_ONLY !== "true") {
    throw new Error("Safe basket setup requires LOCAL_BOT_TRADING_ONLY=true.");
  }
  if (confirm && process.env.ALLOW_BOT_TRADING !== "true") {
    throw new Error("Safe basket confirm requires ALLOW_BOT_TRADING=true.");
  }
  if (confirm && process.env.POLYMARKET_MM_LIVE_LOCAL !== "true") {
    throw new Error("Safe basket confirm requires POLYMARKET_MM_LIVE_LOCAL=true.");
  }

  const maxMarkets = Number.parseInt(option("maxMarkets", "5"), 10);
  const safeMaxMarkets = Number.isFinite(maxMarkets) ? maxMarkets : 5;
  const loadedCandidates = await loadWorldCupSafeBasketCandidates();
  const candidates = replaceExisting
    ? loadedCandidates.map((candidate) => ({ ...candidate, existingConfig: false }))
    : loadedCandidates;
  const plan = planSafeBasket(candidates, safeMaxMarkets);
  const rawBlockers = getSafeBasketBlockers({
    candidateCount: candidates.length,
    selectedCount: plan.selected.length,
    maxMarkets: safeMaxMarkets,
  });
  const blockers = allowBelowTarget
    ? rawBlockers.filter((blocker) => !blocker.includes("less_than_target_3"))
    : rawBlockers;
  const result = {
    generatedAt: new Date().toISOString(),
    dryRun: !confirm,
    maxMarkets: safeMaxMarkets,
    candidateCount: candidates.length,
    selected: plan.selected,
    skipped: plan.skipped,
    blockers,
    ignoredBlockers: rawBlockers.filter((blocker) => !blockers.includes(blocker)),
  };

  if ((confirm || confirmDryRun) && blockers.length > 0) {
    console.log(JSON.stringify(result, null, 2));
    throw new Error("Safe basket confirm refused because the selected basket does not meet minimum coverage.");
  }

  if ((confirm || confirmDryRun) && plan.selected.length > 0) {
    await enableSafeBasketConfigs(plan.selected, { dryRun: confirmDryRun });
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
