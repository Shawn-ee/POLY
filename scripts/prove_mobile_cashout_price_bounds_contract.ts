import fs from "node:fs";
import path from "node:path";
import { canCashOutPosition, closePositionOnServer } from "../mobile/src/services/positionCloseService";

const CYCLE = "cycle-MM-cashout-price-bounds-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const position = {
  id: "server-world-cup-winner-France",
  mode: "server" as const,
  marketId: "world-cup-winner",
  outcomeId: "france",
  title: "World Cup winner",
  outcome: "France",
  side: "buy" as const,
  amount: 210,
  probability: 42,
  shares: 500,
  currentPrice: 0.51,
  currentValue: 255,
  pnl: 45,
};

const rejectsBeforeSubmit = async (currentPrice: number | undefined) => {
  let called = false;
  const api = {
    placeLimitOrder: async () => {
      called = true;
      return { order: { id: "unexpected" } };
    },
  } as any;
  try {
    await closePositionOnServer({ mode: "server", api, position: { ...position, currentPrice } });
    return false;
  } catch (error) {
    return !called && String((error as Error).message ?? error).includes("valid current market price");
  }
};

const main = async () => {
  const submittedOrders: unknown[] = [];
  const api = {
    placeLimitOrder: async (order: unknown) => {
      submittedOrders.push(order);
      return { order: { id: "close-order-one-dollar", size: "500.00" } };
    },
  } as any;

  await closePositionOnServer({ mode: "server", api, position: { ...position, currentPrice: 1 } });

  const assertions = {
    oneDollarPriceAvailable: canCashOutPosition({ ...position, currentPrice: 1 }),
    aboveOneDollarPriceUnavailable: !canCashOutPosition({ ...position, currentPrice: 1.01 }),
    zeroPriceUnavailable: !canCashOutPosition({ ...position, currentPrice: 0 }),
    oneDollarCashoutSubmitsPriceOne: JSON.stringify(submittedOrders[0]).includes('"price":"1.00"'),
    aboveOneDollarRejectsBeforeSubmit: await rejectsBeforeSubmit(1.01),
    missingPriceRejectsBeforeSubmit: await rejectsBeforeSubmit(undefined),
  };

  const proof = {
    cycle: "Cycle MM",
    feature: "Cashout current price bounds contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders via server-mode cashout",
    contract: {
      validPayload: "Server-mode cashout current price must be finite and within the binary contract price range (0, 1]",
      malformedPayload: "missing, zero, or above-one current price blocks cashout before submit",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MM proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
