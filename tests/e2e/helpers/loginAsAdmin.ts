import { expect, type APIRequestContext } from "@playwright/test";

export const adminStorageStatePath = "state/playwright-admin-auth.json";

export function getPlaywrightAdminCredentials() {
  return {
    email: process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "admin.test@poly.local",
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "local-admin-password",
  };
}

export async function loginAsAdmin(request: APIRequestContext) {
  const credentials = getPlaywrightAdminCredentials();
  const loginResponse = await request.post("/api/dev/login-as-admin", {
    data: credentials,
  });

  expect(
    loginResponse.ok(),
    "Dev admin login failed. Start the app with ALLOW_DEV_LOGIN=true for local e2e only.",
  ).toBe(true);

  const meResponse = await request.get("/api/auth/me");
  expect(meResponse.ok()).toBe(true);
  const me = await meResponse.json();
  expect(me.user?.email).toBe(credentials.email);
  expect(me.user?.isAdmin).toBe(true);

  return me.user as {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    uBalance?: string | number | null;
  };
}
