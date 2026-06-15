# Authenticated Agent Testing

This repo supports a local-only Playwright admin login for testing admin and trading flows without using a real personal account.

## Test Admin User

Default local test user:

```text
admin.test@poly.local
```

The seed and dev login route mark this user as `isAdmin=true` and provision demo test credits in `UserBalance`.

Override locally with:

```powershell
$env:PLAYWRIGHT_ADMIN_EMAIL = "admin.test@poly.local"
$env:PLAYWRIGHT_ADMIN_PASSWORD = "local-admin-password"
```

Do not use a real Google account or production credentials.

## Dev Login Guard

The dev login endpoint is:

```text
POST /api/dev/login-as-admin
```

It only works when both conditions are true:

- `NODE_ENV !== "production"`
- `ALLOW_DEV_LOGIN=true`

It returns 404 unless explicitly enabled. Never enable this in production.

## Start Local App For Auth E2E

Start the dev server from a local terminal with:

```powershell
$env:ALLOW_DEV_LOGIN = "true"
$env:PLAYWRIGHT_ADMIN_EMAIL = "admin.test@poly.local"
$env:PLAYWRIGHT_ADMIN_PASSWORD = "local-admin-password"
npm run dev
```

Also make sure your normal local database env vars are set and seeded.

## Seed Local Admin

Run the normal seed command against your local database:

```powershell
npm exec -- prisma migrate deploy --schema=prisma/schema.prisma
npm exec -- prisma db seed --schema=prisma/schema.prisma
```

The seed creates or updates the Playwright admin user and gives it local test credits.

## Auth Setup

Create authenticated Playwright storage state:

```powershell
npm run e2e:auth:setup
```

Storage is saved to:

```text
state/playwright-admin-auth.json
```

The `state/` directory is ignored by git. Do not commit it because it can contain local cookies/session state.

## Admin Smoke Test

```powershell
npm run e2e:admin
```

This opens `/admin` with the saved admin session and verifies the admin page is accessible.

## Authenticated Sports Test

```powershell
npm run e2e:sports:auth
```

This opens a World Cup sports event, clicks into a market, and verifies the trading UI appears. It only submits a small order if the visible form is enabled; otherwise it records that order submission was blocked by the current local market/liquidity state.

## Browser Profile

Continue using the isolated Playwright/Chrome profile:

```text
state/job-chrome-profile
```

Do not use your real personal Chrome profile for agent tests.

## Reports And Artifacts

Playwright writes screenshots, traces, and reports to:

```text
test-results/
playwright-report/
```
