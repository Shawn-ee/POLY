import type { PolyApi } from "../api";

export type AccountBalanceResult = {
  availableUSDC: number;
  lockedUSDC: number;
  totalUSDC: number;
  updatedAt: string | null;
};

const toNumber = (value: unknown, field: string) => {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(numeric)) {
    throw new Error(`Account balance response was missing ${field}.`);
  }
  return numeric;
};

const toNonNegativeNumber = (value: unknown, field: string) => {
  const numeric = toNumber(value, field);
  if (numeric < 0) {
    throw new Error(`Account balance response had invalid ${field}.`);
  }
  return numeric;
};

const assertTotalMatches = (availableUSDC: number, lockedUSDC: number, totalUSDC: number) => {
  if (Math.abs(availableUSDC + lockedUSDC - totalUSDC) > 0.01) {
    throw new Error("Account balance response had inconsistent totalUSDC.");
  }
};

const normalizeUpdatedAt = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error("Account balance response had invalid updatedAt.");
  }
  return value;
};

export const loadAccountBalance = async (api: Pick<PolyApi, "getAccountBalance">): Promise<AccountBalanceResult> => {
  const balance = await api.getAccountBalance();
  const availableUSDC = toNonNegativeNumber(balance.availableUSDC, "availableUSDC");
  const lockedUSDC = toNonNegativeNumber(balance.lockedUSDC, "lockedUSDC");
  const totalUSDC = toNonNegativeNumber(balance.totalUSDC, "totalUSDC");
  assertTotalMatches(availableUSDC, lockedUSDC, totalUSDC);
  return {
    availableUSDC,
    lockedUSDC,
    totalUSDC,
    updatedAt: normalizeUpdatedAt(balance.updatedAt),
  };
};
