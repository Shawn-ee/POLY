import { isDevLoginAllowed } from "@/lib/devLogin";

describe("dev login guard", () => {
  it("is disabled in production even when explicitly allowed", () => {
    expect(isDevLoginAllowed({ NODE_ENV: "production", ALLOW_DEV_LOGIN: "true" })).toBe(false);
  });

  it("requires explicit local opt in outside production", () => {
    expect(isDevLoginAllowed({ NODE_ENV: "development", ALLOW_DEV_LOGIN: "true" })).toBe(true);
    expect(isDevLoginAllowed({ NODE_ENV: "development", ALLOW_DEV_LOGIN: "false" })).toBe(false);
    expect(isDevLoginAllowed({ NODE_ENV: "test" })).toBe(false);
  });
});
