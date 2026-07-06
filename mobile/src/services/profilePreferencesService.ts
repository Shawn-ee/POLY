import type { PolyApi } from "../api";
import type { Locale } from "../mocks/worldCup";
import type { ProfilePreferences } from "../types";

export type LocalProfilePreferences = {
  locale: Locale;
  ticketDefaultAmount: string;
  ticketDefaultSide: "buy" | "sell";
  ticketDefaultSlippage: string;
  savedEventIds: string[];
};

export const toProfilePreferencesPayload = (preferences: LocalProfilePreferences): ProfilePreferences => ({
  locale: preferences.locale,
  ticketDefaultAmount: preferences.ticketDefaultAmount,
  ticketDefaultSide: preferences.ticketDefaultSide === "sell" ? "SELL" : "BUY",
  ticketDefaultSlippage: preferences.ticketDefaultSlippage,
  savedEventIds: [...preferences.savedEventIds],
});

const requirePreferenceString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Profile preferences response was missing ${field}.`);
  }
  return value.trim();
};

const requirePositiveAmountString = (value: unknown) => {
  const amount = requirePreferenceString(value, "ticketDefaultAmount");
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Profile preferences response had invalid ticketDefaultAmount.");
  }
  return amount;
};

const requireSlippageString = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "1%";
  const slippage = requirePreferenceString(value, "ticketDefaultSlippage");
  if (!slippage.endsWith("%")) {
    throw new Error("Profile preferences response had invalid ticketDefaultSlippage.");
  }
  const parsed = Number(slippage.slice(0, -1));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error("Profile preferences response had invalid ticketDefaultSlippage.");
  }
  return slippage;
};

const requireLocale = (value: unknown): Locale => {
  if (value !== "en" && value !== "zh") {
    throw new Error("Profile preferences response had invalid locale.");
  }
  return value;
};

const requireTicketSide = (value: unknown): "buy" | "sell" => {
  if (value === "BUY") return "buy";
  if (value === "SELL") return "sell";
  throw new Error("Profile preferences response had invalid ticketDefaultSide.");
};

const requireSavedEventIds = (value: unknown) => {
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string")) {
    throw new Error("Profile preferences response had invalid savedEventIds.");
  }
  return [...value];
};

export const fromProfilePreferencesPayload = (preferences: ProfilePreferences): LocalProfilePreferences => ({
  locale: requireLocale(preferences.locale),
  ticketDefaultAmount: requirePositiveAmountString(preferences.ticketDefaultAmount),
  ticketDefaultSide: requireTicketSide(preferences.ticketDefaultSide),
  ticketDefaultSlippage: requireSlippageString(preferences.ticketDefaultSlippage),
  savedEventIds: requireSavedEventIds(preferences.savedEventIds),
});

const requirePreferences = (response: { preferences?: ProfilePreferences }) => {
  if (!response.preferences) {
    throw new Error("Profile preferences response was missing preferences.");
  }
  return response.preferences;
};

export const loadProfilePreferences = async (api: PolyApi): Promise<LocalProfilePreferences> => {
  const response = await api.getProfilePreferences();
  return fromProfilePreferencesPayload(requirePreferences(response));
};

export const saveProfilePreferences = async (
  api: PolyApi,
  preferences: LocalProfilePreferences,
): Promise<LocalProfilePreferences> => {
  const response = await api.saveProfilePreferences(toProfilePreferencesPayload(preferences));
  return fromProfilePreferencesPayload(requirePreferences(response));
};
