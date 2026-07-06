import { describe, expect, test } from "vitest";
import {
  fromProfilePreferencesPayload,
  loadProfilePreferences,
  saveProfilePreferences,
  toProfilePreferencesPayload,
} from "../services/profilePreferencesService";

describe("Holiwyn profile preferences service", () => {
  test("maps local preferences to the canonical server payload", () => {
    expect(
      toProfilePreferencesPayload({
        locale: "zh",
        ticketDefaultAmount: "500",
        ticketDefaultSide: "sell",
        ticketDefaultSlippage: "2%",
        savedEventIds: ["mexico-ecuador"],
      }),
    ).toEqual({
      locale: "zh",
      ticketDefaultAmount: "500",
      ticketDefaultSide: "SELL",
      ticketDefaultSlippage: "2%",
      savedEventIds: ["mexico-ecuador"],
    });
  });

  test("maps server preferences back to local app state", () => {
    expect(
      fromProfilePreferencesPayload({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "0.5%",
        savedEventIds: ["world-cup-winner"],
      }),
    ).toEqual({
      locale: "en",
      ticketDefaultAmount: "100",
      ticketDefaultSide: "buy",
      ticketDefaultSlippage: "0.5%",
      savedEventIds: ["world-cup-winner"],
    });
  });

  test("defaults missing server slippage to 1 percent for older profile payloads", () => {
    expect(
      fromProfilePreferencesPayload({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        savedEventIds: [],
      }),
    ).toEqual({
      locale: "en",
      ticketDefaultAmount: "100",
      ticketDefaultSide: "buy",
      ticketDefaultSlippage: "1%",
      savedEventIds: [],
    });
  });

  test("loads server preferences through the API client and maps them locally", async () => {
    const api = {
      getProfilePreferences: async () => ({
        preferences: {
          locale: "zh" as const,
          ticketDefaultAmount: "250",
          ticketDefaultSide: "SELL" as const,
          ticketDefaultSlippage: "2%",
          savedEventIds: ["world-cup-winner"],
        },
      }),
    };

    await expect(loadProfilePreferences(api as unknown as Parameters<typeof loadProfilePreferences>[0])).resolves.toEqual({
      locale: "zh",
      ticketDefaultAmount: "250",
      ticketDefaultSide: "sell",
      ticketDefaultSlippage: "2%",
      savedEventIds: ["world-cup-winner"],
    });
  });

  test("saves local preferences through the API client and normalizes legacy response payloads", async () => {
    const savedPayloads: unknown[] = [];
    const api = {
      saveProfilePreferences: async (payload: unknown) => {
        savedPayloads.push(payload);
        return {
          preferences: {
            locale: "en" as const,
            ticketDefaultAmount: "500",
            ticketDefaultSide: "BUY" as const,
            savedEventIds: ["mexico-ecuador"],
          },
        };
      },
    };

    await expect(
      saveProfilePreferences(api as unknown as Parameters<typeof saveProfilePreferences>[0], {
        locale: "en",
        ticketDefaultAmount: "500",
        ticketDefaultSide: "buy",
        ticketDefaultSlippage: "0.5%",
        savedEventIds: ["mexico-ecuador"],
      }),
    ).resolves.toEqual({
      locale: "en",
      ticketDefaultAmount: "500",
      ticketDefaultSide: "buy",
      ticketDefaultSlippage: "1%",
      savedEventIds: ["mexico-ecuador"],
    });

    expect(savedPayloads).toEqual([
      {
        locale: "en",
        ticketDefaultAmount: "500",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "0.5%",
        savedEventIds: ["mexico-ecuador"],
      },
    ]);
  });

  test("rejects malformed server preference responses clearly", async () => {
    const api = {
      getProfilePreferences: async () => ({}),
    };

    await expect(loadProfilePreferences(api as unknown as Parameters<typeof loadProfilePreferences>[0])).rejects.toThrow(
      "Profile preferences response was missing preferences.",
    );
  });

  test("rejects invalid server preference fields before applying visible state", async () => {
    expect(() =>
      fromProfilePreferencesPayload({
        locale: "fr" as "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "1%",
        savedEventIds: [],
      }),
    ).toThrow("Profile preferences response had invalid locale.");

    expect(() =>
      fromProfilePreferencesPayload({
        locale: "en",
        ticketDefaultAmount: "",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "1%",
        savedEventIds: [],
      }),
    ).toThrow("Profile preferences response was missing ticketDefaultAmount.");

    expect(() =>
      fromProfilePreferencesPayload({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "MAYBE" as "BUY",
        ticketDefaultSlippage: "1%",
        savedEventIds: [],
      }),
    ).toThrow("Profile preferences response had invalid ticketDefaultSide.");

    expect(() =>
      fromProfilePreferencesPayload({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "1%",
        savedEventIds: ["mexico-ecuador", 42] as string[],
      }),
    ).toThrow("Profile preferences response had invalid savedEventIds.");
  });
});
