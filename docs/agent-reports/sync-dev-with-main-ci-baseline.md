# Sync Dev With Main CI Baseline

Branch: `agent/sync-dev-with-main-ci-baseline`

Base: `origin/dev`

Goal: bring `dev` up to date with the current `main` CI and agent branch workflow baseline through a reviewed PR.

## Summary Of Changes

- Merged `origin/main` into the branch.
- Brought in `.github/workflows/ci.yml`.
- Brought in `docs/AGENT_BRANCH_WORKFLOW.md`.
- Added this branch report.

## Files Changed

- `.github/workflows/ci.yml`
- `docs/AGENT_BRANCH_WORKFLOW.md`
- `docs/agent-reports/sync-dev-with-main-ci-baseline.md`

## Validation

Run before PR:

- PASS: `git diff --check`
- PASS: `npm ci`
- PASS: `npm exec -- prisma generate --schema=prisma/schema.prisma`
- PASS: `npm exec -- prisma validate --schema=prisma/schema.prisma`
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: focused CI Jest smoke command from `.github/workflows/ci.yml`
- PASS: changed-file secret scan
- SKIPPED: focused ESLint because this branch only changes workflow and Markdown files.
- SKIPPED: Markdown lint because no local markdownlint command is installed.

Warnings observed:

- `npm ci` reported existing dependency audit and deprecation warnings.
- Prisma reported the existing `package.json#prisma` deprecation warning.
- The health route smoke test logs an expected `db down` console error while testing failure handling.
- The changed-file secret scan matched safe CI placeholder values and documentation references, not real secrets.

## Known Risks

- PRs targeting `dev` currently do not trigger the new CI workflow because the workflow only runs on PRs targeting `main` and pushes to `main`.
- `dev` may still need PR #11 and PR #12 after this sync PR.

## Next Recommended Task

After this sync PR is reviewed, merge it to `dev`, then rebase or refresh active PRs as needed and continue with the Playwright/admin login and sports UI work.

## Intentionally Not Touched

- Application source code
- Wallet, deposit, withdrawal, custody, payment, trading ledger, settlement, and admin permission implementation code
- Production deployment configuration
