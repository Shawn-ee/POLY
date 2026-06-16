# Ledger Phase 3 Vitest Fix

Branch: `agent/ledger-phase3-vitest-fix`

Base: `origin/dev`

## Scope

Fix the Phase 3 ledger test runner mismatch where a Vitest suite called the Jest global `jest.resetModules()`.

## Changes

- Import `vi` from `vitest`.
- Replace `jest.resetModules()` with `vi.resetModules()`.

## Restricted Areas

No production ledger implementation, settlement, wallet, deposit, withdrawal, custody, payment, or admin permission code was modified.

## Validation

Run before PR:

- `git diff --check`
- `npm exec -- prisma generate --schema=prisma/schema.prisma`
- `npm exec -- prisma validate --schema=prisma/schema.prisma`
- `npm run test:phase3` against an isolated migrated PostgreSQL test database
- changed-file secret scan
