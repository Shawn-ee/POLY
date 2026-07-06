import type { PolyApi } from "../api";

export type AccountProfileResult = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  image: string | null;
  walletAddress: string | null;
  hasWalletLinked: boolean;
  hasGoogleLinked: boolean;
};

const requireString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Account profile response was missing ${field}.`);
  }
  return value.trim();
};

const optionalString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

export const loadAccountProfile = async (api: Pick<PolyApi, "getAccountProfile">): Promise<AccountProfileResult> => {
  const profile = await api.getAccountProfile();
  return {
    id: requireString(profile.id, "id"),
    username: requireString(profile.username, "username"),
    displayName: requireString(profile.displayName, "displayName"),
    email: optionalString(profile.email),
    image: optionalString(profile.image),
    walletAddress: optionalString(profile.walletAddress),
    hasWalletLinked: Boolean(profile.hasWalletLinked),
    hasGoogleLinked: Boolean(profile.hasGoogleLinked),
  };
};
