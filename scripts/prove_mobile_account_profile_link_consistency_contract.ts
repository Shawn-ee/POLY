import fs from "node:fs";
import path from "node:path";
import { loadAccountProfile } from "../mobile/src/services/accountProfileService";

const CYCLE = "cycle-NF-account-profile-link-consistency-contract";
const outputDir = path.join(process.cwd(), "docs", "mobile", "harness", CYCLE);
const outputPath = path.join(outputDir, `${CYCLE}.json`);

const profilePayload = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  username: "grouchypike7067",
  displayName: "grouchypike7067",
  email: "grouchy@example.test",
  image: null,
  walletAddress: "0x1234",
  hasWalletLinked: true,
  hasGoogleLinked: true,
  ...overrides,
});

const apiForPayload = (payload: unknown) => ({
  getAccountProfile: async () => payload,
});

const rejectedWith = async (payload: unknown, message: string) => {
  const result = await Promise.allSettled([
    loadAccountProfile(apiForPayload(payload)),
  ]);
  return result[0].status === "rejected" &&
    String(result[0].reason?.message ?? result[0].reason).includes(message);
};

const main = async () => {
  const linked = await loadAccountProfile(apiForPayload(profilePayload()));
  const unlinked = await loadAccountProfile(apiForPayload(profilePayload({
    email: null,
    walletAddress: null,
    hasWalletLinked: false,
    hasGoogleLinked: false,
  })));

  const assertions = {
    linkedProfileAccepted:
      linked.hasWalletLinked === true &&
      linked.walletAddress === "0x1234" &&
      linked.hasGoogleLinked === true &&
      linked.email === "grouchy@example.test",
    unlinkedProfileAccepted:
      unlinked.hasWalletLinked === false &&
      unlinked.walletAddress === null &&
      unlinked.hasGoogleLinked === false &&
      unlinked.email === null,
    walletLinkedWithoutAddressRejects: await rejectedWith(
      profilePayload({ walletAddress: null, hasWalletLinked: true }),
      "inconsistent wallet link",
    ),
    googleLinkedWithoutEmailRejects: await rejectedWith(
      profilePayload({ email: null, hasGoogleLinked: true }),
      "inconsistent Google link",
    ),
    malformedBooleanStillRejects: await rejectedWith(
      profilePayload({ hasWalletLinked: "false" }),
      "hasWalletLinked",
    ),
  };

  const proof = {
    cycle: "Cycle NF",
    feature: "Account profile link consistency contract",
    generatedAt: new Date().toISOString(),
    route: "/api/account/profile",
    contract: {
      validPayload: "Linked wallet/profile booleans must agree with walletAddress/email identity fields.",
      unlinkedPayload: "Unlinked wallet and Google account may omit walletAddress/email.",
      malformedPayload: "contradictory link metadata rejects before visible Account profile state applies.",
    },
    assertions,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(proof, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failed.length) {
    console.error(`Cycle NF proof failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ outputPath, assertions }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
