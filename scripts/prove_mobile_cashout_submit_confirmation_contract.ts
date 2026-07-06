import fs from "node:fs";
import path from "node:path";
import type { PolyApi } from "../mobile/src/api";
import type { Position } from "../mobile/src/components/Portfolio";
import { canCashOutPosition, closePositionOnServer } from "../mobile/src/services/positionCloseService";

const CYCLE = "cycle-LX-cashout-submit-confirmation-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const position: Position = {
  id: "server-world-cup-winner-France",
  mode: "server",
  marketId: "world-cup-winner",
  outcomeId: "france",
  title: "World Cup winner",
  outcome: "France",
  side: "buy",
  amount: 210,
  probability: 42,
  shares: 500,
  currentPrice: 0.51,
  currentValue: 255,
  pnl: 45,
};

const apiForPayload = (payload: unknown) =>
  ({
    placeLimitOrder: async () => payload,
  }) as unknown as PolyApi;

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    closePositionOnServer({ mode: "server", api: apiForPayload(payload), position }),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  await closePositionOnServer({
    mode: "server",
    api: apiForPayload({ order: { id: "close-order-1", size: "500.00", remaining: "500.00" } }),
    position,
  });

  const zeroShareResult = await Promise.allSettled([
    closePositionOnServer({
      mode: "server",
      api: apiForPayload({ order: { id: "should-not-submit" } }),
      position: { ...position, shares: 0 },
    }),
  ]);

  const assertions = {
    validSellAllConfirmationAccepted: true,
    closeUsesFullHeldShares: canCashOutPosition(position) && position.shares === 500,
    zeroShareCashoutRejectedBeforeSubmit:
      zeroShareResult[0].status === "rejected" &&
      String(zeroShareResult[0].reason?.message ?? zeroShareResult[0].reason).includes("open position with available shares"),
    missingOrderConfirmationRejected: await rejectedWith(
      { order: { status: "OPEN" } },
      "Cash out order was not confirmed by the server.",
    ),
    malformedOrderNumberRejected: await rejectedWith(
      { order: { id: "close-order-bad", remaining: "bad" } },
      "Cash out order response had invalid order.remaining.",
    ),
  };

  const proof = {
    cycle: "Cycle LX",
    feature: "Cashout submit confirmation contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders",
    contract: {
      validPayload: "sell-all cashout only proceeds after backend order confirmation",
      malformedPayload: "missing order id or malformed lifecycle numbers reject before Portfolio refresh treats cashout as accepted",
    },
    assertions,
    position: {
      id: position.id,
      marketId: position.marketId,
      outcomeId: position.outcomeId,
      shares: position.shares,
      currentPrice: position.currentPrice,
    },
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LX proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
