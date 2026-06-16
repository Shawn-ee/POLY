# Playwright Dev Admin Login

Branch: `agent/playwright-dev-admin-login`

Base: `origin/dev`

Goal: add a local-only Playwright admin login flow so authenticated browser tests can run without using real accounts or production credentials.

## Summary Of Changes

- Added local Playwright configuration and authenticated e2e scripts.
- Added a development-only admin login API route guarded by `ALLOW_DEV_LOGIN=true` and `NODE_ENV !== "production"`.
- Added helper code to create a disposable local admin user and balance for e2e runs.
- Added admin and sports authenticated Playwright smoke tests.
- Added docs for authenticated and visible browser agent testing.
- Updated `.gitignore` to exclude Playwright reports, storage state, logs, generated state, secrets, and local artifacts.

## Files Changed

- `.env.example`
- `.gitignore`
- `docs/AUTHENTICATED_AGENT_TESTING.md`
- `docs/VISIBLE_BROWSER_AGENT_TESTING.md`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `prisma/seed.ts`
- `scripts/e2e/run-visible-sports-smoke.ps1`
- `scripts/e2e/watch-visible-sports-smoke.ps1`
- `src/__tests__/dev-login-guard.test.ts`
- `src/app/api/dev/login-as-admin/route.ts`
- `src/lib/devLogin.ts`
- `tests/e2e/admin-smoke.spec.ts`
- `tests/e2e/auth.setup.ts`
- `tests/e2e/helpers/loginAsAdmin.ts`
- `tests/e2e/sports-authenticated-order.spec.ts`
- `docs/agent-reports/playwright-dev-admin-login.md`

## Validation

- PASS: `git diff --check`
- PASS: `npm ci`
- PASS: `npm exec -- prisma generate --schema=prisma/schema.prisma`
- PASS: `npm exec -- prisma validate --schema=prisma/schema.prisma`
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: `npx jest --runInBand --detectOpenHandles src/__tests__/dev-login-guard.test.ts`
- PASS: `npx eslint playwright.config.ts prisma/seed.ts src/__tests__/dev-login-guard.test.ts src/app/api/dev/login-as-admin/route.ts src/lib/devLogin.ts tests/e2e/admin-smoke.spec.ts tests/e2e/auth.setup.ts tests/e2e/helpers/loginAsAdmin.ts tests/e2e/sports-authenticated-order.spec.ts`
- PASS: `npm run e2e:auth:setup`
- PASS: `npm run e2e:admin`
- PASS: changed-file secret scan

Playwright validation used a disposable local Postgres container on port `55432` and a local app server on `127.0.0.1:3010` with safe test values only.

## Security Review

- The dev login route returns `404` unless `ALLOW_DEV_LOGIN=true`.
- The dev login guard returns false when `NODE_ENV=production`, even if `ALLOW_DEV_LOGIN=true`.
- The generated Playwright auth state path is under `state/`, which is gitignored.
- No real credentials were used or committed.
- No deposit, withdrawal, wallet custody, payment, trading ledger, settlement, or production deployment code was intentionally modified.

## Known Risks

- The branch is based on `origin/dev`, while `dev` is behind `main` until PR #13 is merged.
- PRs targeting `dev` currently have no automatic GitHub Actions checks until the CI workflow is expanded beyond `main`.
- The local dev login creates an admin user when explicitly enabled; keep it disabled by default and never enable it in production.
- Existing npm audit warnings remain unresolved.

## Next Recommended Task

Merge the dev/main CI sync PR first, then review this PR with attention to the local-only auth guard before merging to `dev`.

## Intentionally Not Touched

- Real-money deposit, withdrawal, wallet custody, and payment behavior
- Trading ledger and settlement logic
- Production deployment configuration
- Main branch
