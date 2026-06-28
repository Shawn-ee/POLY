import {
  enableSafeBasketDryRunConfigs,
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
  if (process.env.REAL_MONEY_MODE === "true") {
    throw new Error("Safe basket setup refuses REAL_MONEY_MODE=true.");
  }
  if (process.env.LOCAL_BOT_TRADING_ONLY !== "true") {
    throw new Error("Safe basket setup requires LOCAL_BOT_TRADING_ONLY=true.");
  }

  const maxMarkets = Number.parseInt(option("maxMarkets", "5"), 10);
  const safeMaxMarkets = Number.isFinite(maxMarkets) ? maxMarkets : 5;
  const confirm = flag("confirm");
  const candidates = await loadWorldCupSafeBasketCandidates();
  const plan = planSafeBasket(candidates, safeMaxMarkets);
  const blockers = getSafeBasketBlockers({
    candidateCount: candidates.length,
    selectedCount: plan.selected.length,
    maxMarkets: safeMaxMarkets,
  });
  const result = {
    generatedAt: new Date().toISOString(),
    dryRun: !confirm,
    maxMarkets: safeMaxMarkets,
    candidateCount: candidates.length,
    selected: plan.selected,
    skipped: plan.skipped,
    blockers,
  };

  if (confirm && blockers.length > 0) {
    console.log(JSON.stringify(result, null, 2));
    throw new Error("Safe basket confirm refused because the selected basket does not meet minimum coverage.");
  }

  if (confirm && plan.selected.length > 0) {
    await enableSafeBasketDryRunConfigs(plan.selected);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
