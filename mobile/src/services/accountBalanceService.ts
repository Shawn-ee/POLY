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

export const loadAccountBalance = async (api: Pick<PolyApi, "getAccountBalance">): Promise<AccountBalanceResult> => {
  const balance = await api.getAccountBalance();
  return {
    availableUSDC: toNumber(balance.availableUSDC, "availableUSDC"),
    lockedUSDC: toNumber(balance.lockedUSDC, "lockedUSDC"),
    totalUSDC: toNumber(balance.totalUSDC, "totalUSDC"),
    updatedAt: typeof balance.updatedAt === "string" ? balance.updatedAt : null,
  };
};
