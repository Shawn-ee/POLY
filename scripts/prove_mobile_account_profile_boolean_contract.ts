import fs from "node:fs";
import path from "node:path";
import { loadAccountProfile } from "../mobile/src/services/accountProfileService";

const CYCLE = "cycle-LY-account-profile-boolean-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const profilePayload = () => ({
  id: "user-1",
  username: "grouchypike7067",
  displayName: "grouchypike7067",
  email: null,
  image: null,
  walletAddress: null,
  hasWalletLinked: true,
  hasGoogleLinked: false,
});

const apiForPayload = (payload: unknown) => ({
  getAccountProfile: async () => payload,
});

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadAccountProfile(apiForPayload(payload) as Parameters<typeof loadAccountProfile>[0]),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const validProfile = await loadAccountProfile(apiForPayload(profilePayload()));

  const badWallet = {
    ...profilePayload(),
    hasWalletLinked: "false",
  };
  const badGoogle = {
    ...profilePayload(),
    hasGoogleLinked: 1,
  };

  const assertions = {
    validBooleanProfileApplies:
      validProfile.hasWalletLinked === true &&
      validProfile.hasGoogleLinked === false &&
      validProfile.displayName === "grouchypike7067",
    stringWalletLinkedRejects: await rejectedWith(
      badWallet,
      "Account profile response was missing hasWalletLinked.",
    ),
    numericGoogleLinkedRejects: await rejectedWith(
      badGoogle,
      "Account profile response was missing hasGoogleLinked.",
    ),
  };

  const proof = {
    cycle: "Cycle LY",
    feature: "Account profile boolean contract",
    generatedAt: new Date().toISOString(),
    route: "/api/account/profile",
    contract: {
      validPayload: "linked-account fields must be real booleans before visible Account state applies",
      malformedPayload: "string/number linked-account fields reject instead of being coerced into true/false UI state",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle LY proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
