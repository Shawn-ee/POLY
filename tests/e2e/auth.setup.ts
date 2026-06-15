import { test } from "@playwright/test";
import { adminStorageStatePath, loginAsAdmin } from "./helpers/loginAsAdmin";

test("authenticate local Playwright admin", async ({ request }) => {
  await loginAsAdmin(request);
  await request.storageState({ path: adminStorageStatePath });
});
