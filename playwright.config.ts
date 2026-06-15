import { defineConfig } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
const adminStorageState = path.join("state", "playwright-admin-auth.json");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "smoke",
      testIgnore: [/auth\.setup\.ts/, /admin-smoke\.spec\.ts/, /sports-authenticated-order\.spec\.ts/],
    },
    {
      name: "authenticated",
      testMatch: /admin-smoke\.spec\.ts|sports-authenticated-order\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        storageState: adminStorageState,
      },
    },
  ],
});
