import fs from "node:fs";
import path from "node:path";
import { loadAccountBalance } from "../mobile/src/services/accountBalanceService";

const CYCLE = "cycle-MD-account-balance-shape-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const balancePayload = () => ({
  availableUSDC: "140.86",
  lockedUSDC: "12.00",
  totalUSDC: "152.86",
  updatedAt: "2026-07-06T08:00:00.000Z",
});

const apiForPayload = (payload: unknown) => ({
  getAccountBalance: async () => payload,
});

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadAccountBalance(apiForPayload(payload) as Parameters<typeof loadAccountBalance>[0]),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const validBalance = await loadAccountBalance(apiForPayload(balancePayload()));

  const assertions = {
    validNonNegativeBalanceApplies:
      validBalance.availableUSDC === 140.86 &&
      validBalance.lockedUSDC === 12 &&
      validBalance.totalUSDC === 152.86 &&
      validBalance.updatedAt === "2026-07-06T08:00:00.000Z",
    negativeAvailableRejects: await rejectedWith(
      { ...balancePayload(), availableUSDC: "-0.01", totalUSDC: "11.99" },
      "invalid availableUSDC",
    ),
    negativeLockedRejects: await rejectedWith(
      { ...balancePayload(), lockedUSDC: "-0.01", totalUSDC: "140.85" },
      "invalid lockedUSDC",
    ),
    inconsistentTotalRejects: await rejectedWith(
      { ...balancePayload(), totalUSDC: "140.86" },
      "inconsistent totalUSDC",
    ),
    invalidUpdatedAtRejects: await rejectedWith(
      { ...balancePayload(), updatedAt: 123 },
      "invalid updatedAt",
    ),
  };

  const proof = {
    cycle: "Cycle MD",
    feature: "Account balance shape contract",
    generatedAt: new Date().toISOString(),
    route: "/api/account/balance",
    contract: {
      validPayload: "visible Account balance fields must be finite, non-negative, and internally consistent before account state applies",
      malformedPayload: "negative values, inconsistent totalUSDC, or malformed updatedAt reject before visible Account state applies",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle MD proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
