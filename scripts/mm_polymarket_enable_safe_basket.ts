import { enableSafeBasketDryRunConfigs, loadWorldCupSafeBasketCandidates, planSafeBasket } from "@/server/services/polymarketMmSafeBasket";

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
  const confirm = flag("confirm");
  const candidates = await loadWorldCupSafeBasketCandidates();
  const plan = planSafeBasket(candidates, Number.isFinite(maxMarkets) ? maxMarkets : 5);
  const result = {
    generatedAt: new Date().toISOString(),
    dryRun: !confirm,
    maxMarkets,
    selected: plan.selected,
    skipped: plan.skipped,
  };

  if (confirm && plan.selected.length > 0) {
    await enableSafeBasketDryRunConfigs(plan.selected);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

