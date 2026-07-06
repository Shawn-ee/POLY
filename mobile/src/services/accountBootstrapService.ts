import type { AccountBalanceResult } from "./accountBalanceService";
import type { AccountNavigationResult } from "./accountNavigationService";
import type { AccountProfileResult } from "./accountProfileService";

export type AccountBootstrapStatus = "hidden" | "syncing" | "synced" | "error";

export type AccountBootstrapResult = {
  status: Extract<AccountBootstrapStatus, "synced" | "error">;
  balanceStatus: Extract<AccountBootstrapStatus, "synced" | "error">;
  profileStatus: Extract<AccountBootstrapStatus, "synced" | "error">;
  navigationStatus: Extract<AccountBootstrapStatus, "synced" | "error">;
  balance?: AccountBalanceResult;
  profile?: AccountProfileResult;
  navigation?: AccountNavigationResult;
};

const statusFor = <T,>(result: PromiseSettledResult<T>): Extract<AccountBootstrapStatus, "synced" | "error"> =>
  result.status === "fulfilled" ? "synced" : "error";

const valueFor = <T,>(result: PromiseSettledResult<T>): T | undefined =>
  result.status === "fulfilled" ? result.value : undefined;

export const resolveAccountBootstrapResults = (
  balance: PromiseSettledResult<AccountBalanceResult>,
  profile: PromiseSettledResult<AccountProfileResult>,
  navigation: PromiseSettledResult<AccountNavigationResult>,
): AccountBootstrapResult => {
  const balanceStatus = statusFor(balance);
  const profileStatus = statusFor(profile);
  const navigationStatus = statusFor(navigation);
  const status = balanceStatus === "synced" && profileStatus === "synced" && navigationStatus === "synced"
    ? "synced"
    : "error";

  return {
    status,
    balanceStatus,
    profileStatus,
    navigationStatus,
    balance: valueFor(balance),
    profile: valueFor(profile),
    navigation: valueFor(navigation),
  };
};
