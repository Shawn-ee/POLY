import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getAccountProfile } from "@/app/api/account/profile/route";
import { loadAccountProfile } from "../mobile/src/services/accountProfileService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KI-account-profile-contract/cycle-KI-account-profile-contract.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_ki_profile_${suffix}`,
      email: `mobile-ki-profile-${suffix}@example.test`,
      displayName: `KI Profile ${suffix}`,
      image: `https://example.test/avatar-${suffix}.png`,
      hasCustomAvatar: true,
      isAdmin: true,
    },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-ki-profile-${suffix}`,
    scopes: ["account:read"],
  });

  const response = await getAccountProfile(
    new NextRequest("http://localhost/api/account/profile", {
      headers: { Authorization: `Bearer ${credential.token}` },
    }),
  );
  assert(response.status === 200, `Expected account profile status 200, received ${response.status}.`);
  const routeProfile = await response.json();
  assert(routeProfile.id === user.id, "Expected route profile to return canonical user id.");
  assert(routeProfile.username === user.username, "Expected route profile to return canonical username.");
  assert(routeProfile.displayName === user.displayName, "Expected route profile to return backend displayName.");
  assert(routeProfile.email === user.email, "Expected route profile to return backend email.");
  assert(routeProfile.image === user.image, "Expected route profile to return backend image.");
  assert(routeProfile.hasCustomAvatar === true, "Expected route profile to return custom avatar flag.");

  const mobileProfile = await loadAccountProfile({
    getAccountProfile: async () => routeProfile,
  });
  assert(mobileProfile.id === user.id, "Expected mobile profile id to match route profile.");
  assert(mobileProfile.username === user.username, "Expected mobile username to match route profile.");
  assert(mobileProfile.displayName === user.displayName, "Expected mobile displayName to match route profile.");
  assert(mobileProfile.email === user.email, "Expected mobile email to match route profile.");
  assert(mobileProfile.image === user.image, "Expected mobile image to match route profile.");

  const summary = {
    pass: true,
    cycle: "Cycle KI",
    createdAt: new Date().toISOString(),
    routes: {
      accountProfile: "/api/account/profile",
    },
    account: {
      auth: "canonical API key with account:read",
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      image: user.image,
      hasCustomAvatar: user.hasCustomAvatar,
    },
    routeProfile: {
      id: routeProfile.id,
      username: routeProfile.username,
      displayName: routeProfile.displayName,
      email: routeProfile.email,
      image: routeProfile.image,
      walletAddress: routeProfile.walletAddress,
      hasWalletLinked: routeProfile.hasWalletLinked,
      hasGoogleLinked: routeProfile.hasGoogleLinked,
    },
    mobileProfile: {
      id: mobileProfile.id,
      username: mobileProfile.username,
      displayName: mobileProfile.displayName,
      email: mobileProfile.email,
      image: mobileProfile.image,
      walletAddress: mobileProfile.walletAddress,
      hasWalletLinked: mobileProfile.hasWalletLinked,
      hasGoogleLinked: mobileProfile.hasGoogleLinked,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
