import fs from "node:fs";
import path from "node:path";
import { submitTicketOrder } from "../mobile/src/services/orderService";
import type { PolyApi } from "../mobile/src/api";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const outputPath = argValue("output") ?? "docs/mobile/harness/cycle-KB-order-submit-selection-echo/cycle-KB-order-submit-selection-echo.json";

const market = {
  id: "cycle-kb-total-25-1h",
  title: "Totals first-half 2.5",
  zhTitle: "Totals first-half 2.5",
  type: "game-line" as const,
  outcomes: [],
};

const outcome = {
  id: "cycle-kb-total-over",
  label: "Over 2.5 1H",
  zhLabel: "Over 2.5 1H",
  probability: 52,
  color: "#0a8f61",
};

const selection = {
  marketType: "totals" as const,
  marketId: market.id,
  outcomeId: outcome.id,
  marketGroupId: "totals",
  line: "2.5",
  period: "first-half",
  side: "over",
  displayLabel: "Over 2.5 1H",
  contractSide: "yes" as const,
  referenceSource: "polymarket",
  externalSlug: "cycle-kb-total-25-1h",
  externalMarketId: "gamma-cycle-kb-total-25-1h",
  conditionId: "condition-cycle-kb-total-25-1h",
  referenceTokenId: "token-cycle-kb-total-over",
  referenceOutcomeLabel: "Over 2.5 first half",
};

const submitWithResponse = (response: unknown) =>
  submitTicketOrder({
    mode: "server",
    api: { placeLimitOrder: async () => response } as unknown as PolyApi,
    market,
    outcome,
    selection,
    side: "buy",
    amount: 25,
  });

const expectReject = async (response: unknown, message: string) => {
  try {
    await submitWithResponse(response);
  } catch (error) {
    const actual = error instanceof Error ? error.message : String(error);
    if (actual !== message) throw new Error(`Expected "${message}" but received "${actual}".`);
    return actual;
  }
  throw new Error(`Expected rejection "${message}" but submit succeeded.`);
};

const main = async () => {
  const accepted = await submitWithResponse({
    order: {
      id: "cycle-kb-order-ok",
      status: "OPEN",
      selection,
    },
  });

  if (accepted.selection?.referenceTokenId !== selection.referenceTokenId) {
    throw new Error("Accepted order did not preserve provider token.");
  }

  const missingSelectionError = await expectReject(
    { order: { id: "cycle-kb-order-missing-selection", status: "OPEN" } },
    "Order submit did not confirm the selected market line.",
  );

  const changedTokenError = await expectReject(
    {
      order: {
        id: "cycle-kb-order-token-mismatch",
        status: "OPEN",
        selection: {
          ...selection,
          referenceTokenId: "wrong-token",
        },
      },
    },
    "Order submit changed selected market line (referenceTokenId).",
  );

  const summary = {
    cycle: "Cycle KB",
    generatedAt: new Date().toISOString(),
    status: "pass",
    checks: {
      matchingSelectionEchoAccepted: accepted.id === "cycle-kb-order-ok",
      returnedSelectionPreservedProviderToken: accepted.selection?.referenceTokenId,
      missingSelectionEchoBlocked: missingSelectionError,
      changedProviderTokenBlocked: changedTokenError,
    },
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
