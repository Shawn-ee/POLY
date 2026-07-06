import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import type { Position } from "../mobile/src/components/Portfolio";
import { canCashOutPosition, closePositionOnServer } from "../mobile/src/services/positionCloseService";

const CYCLE = "cycle-NX-cashout-finite-shares-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const position = (shares: number): Position => ({
  id: "server-world-cup-winner-France",
  mode: "server",
  marketId: "world-cup-winner",
  outcomeId: "france",
  title: "World Cup winner",
  outcome: "France",
  side: "buy",
  amount: 210,
  probability: 42,
  shares,
  currentPrice: 0.51,
  currentValue: 255,
  pnl: 45,
});

const close = async (shares: number, calls: { count: number }) =>
  closePositionOnServer({
    mode: "server",
    api: {
      placeLimitOrder: async () => {
        calls.count += 1;
        return { order: { id: "close-order-1", size: "500.00", remaining: "500.00" } };
      },
    } as unknown as PolyApi,
    position: position(shares),
  });

const rejectsShares = async (shares: number) => {
  const calls = { count: 0 };
  try {
    await close(shares, calls);
    return false;
  } catch (error) {
    return (
      calls.count === 0 &&
      error instanceof Error &&
      error.message.includes("Cash out requires an open position with available shares.")
    );
  }
};

const main = async () => {
  const calls = { count: 0 };
  await close(500, calls);

  const assertions = {
    acceptsFinitePositiveShares:
      canCashOutPosition(position(500)) &&
      calls.count === 1,
    rejectsZeroShares:
      !canCashOutPosition(position(0)) &&
      await rejectsShares(0),
    rejectsNaNShares:
      !canCashOutPosition(position(Number.NaN)) &&
      await rejectsShares(Number.NaN),
    rejectsInfiniteShares:
      !canCashOutPosition(position(Number.POSITIVE_INFINITY)) &&
      await rejectsShares(Number.POSITIVE_INFINITY),
  };

  const proof = {
    cycle: "Cycle NX",
    feature: "Cashout finite shares contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders",
    contract: {
      validPayload: "server-mode cashout requires finite positive full-position shares before deriving SELL order size.",
      malformedPayload: "zero, NaN, or infinite shares reject before /api/orders is called.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NX proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
