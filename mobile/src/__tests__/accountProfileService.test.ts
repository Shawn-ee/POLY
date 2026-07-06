import { describe, expect, test } from "vitest";
import { loadAccountProfile } from "../services/accountProfileService";

describe("Holiwyn account profile service", () => {
  test("normalizes canonical account profile into mobile Account state", async () => {
    const api = {
      getAccountProfile: async () => ({
        id: "user-1",
        username: "grouchypike7067",
        displayName: "grouchypike7067",
        email: "grouchy@example.test",
        image: null,
        walletAddress: "0x1234",
        hasWalletLinked: true,
        hasGoogleLinked: false,
      }),
    };

    await expect(loadAccountProfile(api)).resolves.toEqual({
      id: "user-1",
      username: "grouchypike7067",
      displayName: "grouchypike7067",
      email: "grouchy@example.test",
      image: null,
      walletAddress: "0x1234",
      hasWalletLinked: true,
      hasGoogleLinked: false,
    });
  });

  test("rejects malformed account profile responses clearly", async () => {
    const api = {
      getAccountProfile: async () => ({
        id: "user-1",
        username: "grouchypike7067",
        displayName: "",
      }),
    };

    await expect(loadAccountProfile(api)).rejects.toThrow(
      "Account profile response was missing displayName.",
    );
  });
});
