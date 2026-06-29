# Validation Report - Cycle 001

## Passed
- `git diff --check`
- `npm exec prisma generate --schema=prisma/schema.prisma`
- `npm exec prisma validate --schema=prisma/schema.prisma`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run build`
- Focused Jest/no-leak tests
- `npm run polymarket:import-event -- --eventSlug fifwc-bra-jpn-2026-06-29 --dryRun true`
- `npm run polymarket:import-event -- --eventSlug fifwc-bra-jpn-2026-06-29 --dryRun false --confirmImport true`
- `npm run reference:sync:once -- --eventSlug brazil-vs-japan`
- `npm run mm:polymarket:dry-run`
- `npm run mm:polymarket:live-local-once`
- `npm run test:football:e2e:internal-trade`
- `npm run runtime:closed-beta:status`
- `npm run worldcup:mapping:audit`
- Playwright browser verification
- Changed-file secret scan

## Known full-suite limitation
`npm run test:jest` without DB env fails on unrelated DB suites that require `DATABASE_URL`, and on existing Vitest suites being invoked through Jest. It was not rerun with the shared local DB because several suites reset the public schema.
