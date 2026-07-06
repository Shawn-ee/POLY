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

const requireBoolean = (value: unknown, field: string) => {
  if (typeof value !== "boolean") {
    throw new Error(`Account profile response was missing ${field}.`);
  }
  return value;
};

export const loadAccountProfile = async (api: Pick<PolyApi, "getAccountProfile">): Promise<AccountProfileResult> => {
  const profile = await api.getAccountProfile();
  const id = requireString(profile.id, "id");
  const username = requireString(profile.username, "username");
  const displayName = requireString(profile.displayName, "displayName");
  const email = optionalString(profile.email);
  const image = optionalString(profile.image);
  const walletAddress = optionalString(profile.walletAddress);
  const hasWalletLinked = requireBoolean(profile.hasWalletLinked, "hasWalletLinked");
  const hasGoogleLinked = requireBoolean(profile.hasGoogleLinked, "hasGoogleLinked");
  if (hasWalletLinked && !walletAddress) {
    throw new Error("Account profile response had inconsistent wallet link.");
  }
  if (hasGoogleLinked && !email) {
    throw new Error("Account profile response had inconsistent Google link.");
  }
  return {
    id,
    username,
    displayName,
    email,
    image,
    walletAddress,
    hasWalletLinked,
    hasGoogleLinked,
  };
};
