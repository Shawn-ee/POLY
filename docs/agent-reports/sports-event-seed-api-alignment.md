# Sports Event Seed API Alignment

Branch: `agent/sports-event-seed-api-alignment`

Base: `origin/dev`

Goal: align the NBA seed path with the sports event APIs by creating sports `Event` rows and linking seeded NBA markets to them.

## Summary Of Changes

- Updated `prisma/seed_nba.ts` to upsert NBA event rows with `category = "sports"`, `sportKey = "basketball"`, and `leagueKey = "nba"`.
- Linked new and existing NBA markets to their seeded NBA events.
- Replaced randomized NBA game slugs with deterministic matchups so repeat seed runs are idempotent.
- Added `scripts/check_nba_seed_events.ts`.
- Added `npm run check:nba-seed-events`.

## Files Changed

- `package.json`
- `prisma/seed_nba.ts`
- `scripts/check_nba_seed_events.ts`
- `docs/agent-reports/sports-event-seed-api-alignment.md`

## Validation

- PASS: `npm ci`
- PASS: `git diff --check`
- PASS: `npm exec -- prisma generate --schema=prisma/schema.prisma`
- PASS: `npm exec -- prisma validate --schema=prisma/schema.prisma`
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: `npx eslint prisma/seed_nba.ts scripts/check_nba_seed_events.ts`
- PASS: `npx jest --runInBand --detectOpenHandles src/__tests__/sports.event-market-model.test.ts`
- PASS: disposable Postgres migration deploy on port `55435`
- PASS: first `npm run seed:nba`
- PASS: first `npm run check:nba-seed-events`
- PASS: second `npm run seed:nba`
- PASS: second `npm run check:nba-seed-events`

Seed verification results:

- First run: `created: 22`, `linked: 0`, `markets: 22`, `events: 21`
- Second run: `created: 0`, `linked: 22`, `markets: 22`, `events: 21`
- Alignment check: `unlinkedMarketCount: 0`

## Known Risks

- This branch adds NBA event data with `sportKey = "basketball"` and `leagueKey = "nba"`; UI pages for basketball/NBA discovery may still need separate routing work.
- Existing databases that already contain duplicate randomized NBA markets from prior local seed runs may require a deliberate dev-only reset using `npm run seed:nba:reset`.
- `dev` is still behind `main` until PR #13 is merged.

## Next Recommended Task

Review this branch after the dev/main CI sync PR. Then add or verify NBA/basketball sports UI discovery if required by the product route map.

## Intentionally Not Touched

- Deposit, withdrawal, wallet custody, payment, trading ledger, settlement, and admin permission logic
- Production deployment configuration
- Main branch
