import { describe, expect, test } from "vitest";
import { loadAccountBalance } from "../services/accountBalanceService";

describe("Holiwyn account balance service", () => {
  test("normalizes canonical account balance into numeric mobile state", async () => {
    const api = {
      getAccountBalance: async () => ({
        availableUSDC: "140.86",
        lockedUSDC: "12.00",
        totalUSDC: "152.86",
        updatedAt: "2026-07-06T07:30:00.000Z",
      }),
    };

    await expect(loadAccountBalance(api)).resolves.toEqual({
      availableUSDC: 140.86,
      lockedUSDC: 12,
      totalUSDC: 152.86,
      updatedAt: "2026-07-06T07:30:00.000Z",
    });
  });

  test("rejects malformed account balance responses clearly", async () => {
    const api = {
      getAccountBalance: async () => ({
        availableUSDC: "not-a-number",
        lockedUSDC: "0",
        totalUSDC: "0",
      }),
    };

    await expect(loadAccountBalance(api)).rejects.toThrow(
      "Account balance response was missing availableUSDC.",
    );
  });
});
