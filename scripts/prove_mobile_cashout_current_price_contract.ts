import fs from "node:fs";
import path from "node:path";
import { canCashOutPosition, closePositionOnServer } from "../mobile/src/services/positionCloseService";

const CYCLE = "cycle-ML-cashout-current-price-contract";
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

const rejectsWith = async (inputPosition: typeof position, message: string) => {
  const api = {
    placeLimitOrder: async () => {
      throw new Error("placeLimitOrder should not be called");
    },
  } as any;
  try {
    await closePositionOnServer({ mode: "server", api, position: inputPosition });
    return false;
  } catch (error) {
    return String((error as Error).message ?? error).includes(message);
  }
};

const main = async () => {
  const submittedOrders: unknown[] = [];
  const api = {
    placeLimitOrder: async (order: unknown) => {
      submittedOrders.push(order);
      return { order: { id: "close-order-current-price", size: "500.00" } };
    },
  } as any;

  await closePositionOnServer({ mode: "server", api, position });

  const assertions = {
    currentPricePositionAvailable: canCashOutPosition(position),
    missingCurrentPriceUnavailable: !canCashOutPosition({ ...position, currentPrice: undefined }),
    zeroCurrentPriceUnavailable: !canCashOutPosition({ ...position, currentPrice: 0 }),
    validCashoutUsesCurrentPrice: JSON.stringify(submittedOrders[0]).includes('"price":"0.51"'),
    missingCurrentPriceRejectsBeforeSubmit: await rejectsWith({ ...position, currentPrice: undefined }, "Cash out requires a current market price."),
    zeroCurrentPriceRejectsBeforeSubmit: await rejectsWith({ ...position, currentPrice: 0 }, "Cash out requires a current market price."),
  };

  const proof = {
    cycle: "Cycle ML",
    feature: "Cashout current price contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders via server-mode cashout",
    contract: {
      validPayload: "Server-mode cashout uses finite positive position.currentPrice as the sell-all limit price",
      malformedPayload: "missing, zero, or invalid current price blocks cashout before submit instead of falling back to entry probability",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle ML proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main();
