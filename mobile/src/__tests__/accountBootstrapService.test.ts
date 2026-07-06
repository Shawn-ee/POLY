import { describe, expect, test } from "vitest";
import { resolveAccountBootstrapResults } from "../services/accountBootstrapService";
import type { AccountBalanceResult } from "../services/accountBalanceService";
import type { AccountNavigationResult } from "../services/accountNavigationService";
import type { AccountProfileResult } from "../services/accountProfileService";

const balance: AccountBalanceResult = {
  availableUSDC: 140.86,
  lockedUSDC: 10,
  totalUSDC: 150.86,
  updatedAt: "2026-07-06T08:00:00.000Z",
};

const profile: AccountProfileResult = {
  id: "user-1",
  username: "grouchypike7067",
  displayName: "grouchypike7067",
  email: null,
  image: null,
  walletAddress: null,
  hasWalletLinked: false,
  hasGoogleLinked: false,
};

const navigation: AccountNavigationResult = {
  source: "account-navigation-route",
  generatedAt: "2026-07-06T08:00:00.000Z",
  items: [],
};

const fulfilled = <T,>(value: T): PromiseFulfilledResult<T> => ({ status: "fulfilled", value });
const rejected = <T,>(): PromiseRejectedResult => ({ status: "rejected", reason: new Error("route failed") });

describe("account bootstrap service", () => {
  test("reports synced when balance, profile, and navigation all load", () => {
    expect(resolveAccountBootstrapResults(fulfilled(balance), fulfilled(profile), fulfilled(navigation))).toMatchObject({
      status: "synced",
      balanceStatus: "synced",
      profileStatus: "synced",
      navigationStatus: "synced",
      balance,
      profile,
      navigation,
    });
  });

  test("reports visible error while preserving successful partial account data", () => {
    expect(resolveAccountBootstrapResults(fulfilled(balance), rejected(), fulfilled(navigation))).toMatchObject({
      status: "error",
      balanceStatus: "synced",
      profileStatus: "error",
      navigationStatus: "synced",
      balance,
      navigation,
    });
  });

  test("does not invent account data for failed routes", () => {
    const result = resolveAccountBootstrapResults(rejected(), rejected(), rejected());

    expect(result).toMatchObject({
      status: "error",
      balanceStatus: "error",
      profileStatus: "error",
      navigationStatus: "error",
    });
    expect(result.balance).toBeUndefined();
    expect(result.profile).toBeUndefined();
    expect(result.navigation).toBeUndefined();
  });
});
