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
});
