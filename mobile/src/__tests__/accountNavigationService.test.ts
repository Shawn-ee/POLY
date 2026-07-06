import { describe, expect, test } from "vitest";
import { loadAccountNavigation } from "../services/accountNavigationService";

describe("Holiwyn account navigation service", () => {
  test("normalizes backend account navigation placeholders", async () => {
    const api = {
      getAccountNavigation: async () => ({
        source: "account-navigation-route",
        generatedAt: "2026-07-06T08:00:00.000Z",
        items: [
          {
            id: "leaderboard",
            label: "Leaderboard",
            icon: "trophy-outline",
            kind: "placeholder" as const,
            enabled: false,
            status: "unavailable" as const,
            destination: null,
            reason: "Leaderboard is not enabled.",
          },
        ],
      }),
    };

    await expect(loadAccountNavigation(api)).resolves.toEqual({
      source: "account-navigation-route",
      generatedAt: "2026-07-06T08:00:00.000Z",
      items: [
        {
          id: "leaderboard",
          label: "Leaderboard",
          icon: "trophy-outline",
          kind: "placeholder",
          enabled: false,
          status: "unavailable",
          destination: null,
          reason: "Leaderboard is not enabled.",
        },
      ],
    });
  });

  test("normalizes available internal navigation only when enabled with a destination", async () => {
    const api = {
      getAccountNavigation: async () => ({
        source: "account-navigation-route",
        generatedAt: "2026-07-06T08:00:00.000Z",
        items: [
          {
            id: "settings",
            label: "Settings",
            icon: "settings-outline",
            kind: "internal" as const,
            enabled: true,
            status: "available" as const,
            destination: "AccountSettings",
            reason: null,
          },
        ],
      }),
    };

    await expect(loadAccountNavigation(api)).resolves.toMatchObject({
      items: [
        {
          id: "settings",
          enabled: true,
          status: "available",
          destination: "AccountSettings",
        },
      ],
    });
  });

  test("rejects malformed account navigation responses clearly", async () => {
    const api = {
      getAccountNavigation: async () => ({
        source: "account-navigation-route",
        generatedAt: "2026-07-06T08:00:00.000Z",
        items: [{ id: "leaderboard", label: "", icon: "trophy-outline", kind: "placeholder" as const, enabled: false, status: "unavailable" as const, destination: null }],
      }),
    };

    await expect(loadAccountNavigation(api)).rejects.toThrow(
      "Account navigation response was missing items[0].label.",
    );
  });

  test("rejects malformed enabled state instead of coercing visible navigation", async () => {
    const api = {
      getAccountNavigation: async () => ({
        source: "account-navigation-route",
        generatedAt: "2026-07-06T08:00:00.000Z",
        items: [{
          id: "leaderboard",
          label: "Leaderboard",
          icon: "trophy-outline",
          kind: "placeholder" as const,
          enabled: "false",
          status: "unavailable" as const,
          destination: null,
          reason: "Leaderboard is not enabled.",
        }],
      }),
    };

    await expect(loadAccountNavigation(api as unknown as Parameters<typeof loadAccountNavigation>[0])).rejects.toThrow(
      "Account navigation response was missing items[0].enabled.",
    );
  });

  test("rejects contradictory navigation enabled status before applying account menu state", async () => {
    const api = {
      getAccountNavigation: async () => ({
        source: "account-navigation-route",
        generatedAt: "2026-07-06T08:00:00.000Z",
        items: [{
          id: "leaderboard",
          label: "Leaderboard",
          icon: "trophy-outline",
          kind: "internal" as const,
          enabled: true,
          status: "unavailable" as const,
          destination: "Leaderboard",
          reason: "Leaderboard is not enabled.",
        }],
      }),
    };

    await expect(loadAccountNavigation(api)).rejects.toThrow(
      "Account navigation response had inconsistent items[0].",
    );
  });

  test("rejects available navigation without a destination before applying account menu state", async () => {
    const api = {
      getAccountNavigation: async () => ({
        source: "account-navigation-route",
        generatedAt: "2026-07-06T08:00:00.000Z",
        items: [{
          id: "settings",
          label: "Settings",
          icon: "settings-outline",
          kind: "internal" as const,
          enabled: true,
          status: "available" as const,
          destination: null,
          reason: null,
        }],
      }),
    };

    await expect(loadAccountNavigation(api)).rejects.toThrow(
      "Account navigation response had inconsistent items[0].",
    );
  });

  test("rejects enabled placeholder navigation before applying account menu state", async () => {
    const api = {
      getAccountNavigation: async () => ({
        source: "account-navigation-route",
        generatedAt: "2026-07-06T08:00:00.000Z",
        items: [{
          id: "leaderboard",
          label: "Leaderboard",
          icon: "trophy-outline",
          kind: "placeholder" as const,
          enabled: true,
          status: "available" as const,
          destination: "Leaderboard",
          reason: null,
        }],
      }),
    };

    await expect(loadAccountNavigation(api)).rejects.toThrow(
      "Account navigation response had inconsistent items[0].",
    );
  });
});
