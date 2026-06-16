# Sports UI Event Pages

Branch: `agent/sports-ui-event-pages-clean`

Base: `origin/dev`

Goal: add sports discovery and event pages for the existing sports event market model.

## Summary Of Changes

- Added sports route pages for `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup`.
- Expanded event detail rendering in `src/app/events/[slug]/page.tsx`.
- Added sports event card and sports events page components.
- Added a sports navigation link to `TopNav`.

## Files Changed

- `src/app/events/[slug]/page.tsx`
- `src/app/sports/page.tsx`
- `src/app/sports/soccer/page.tsx`
- `src/app/sports/soccer/world-cup/page.tsx`
- `src/components/TopNav.tsx`
- `src/components/sports/SportsEventCard.tsx`
- `src/components/sports/SportsEventsPage.tsx`
- `docs/agent-reports/sports-ui-event-pages.md`

## Validation

- PASS: generated `test-results/` artifacts were removed and were not committed.
- PASS: `npm ci` in a fresh detached validation worktree.
- PASS: `git diff --check`
- PASS: `npm exec -- prisma generate --schema=prisma/schema.prisma`
- PASS: `npm exec -- prisma validate --schema=prisma/schema.prisma`
- PASS: `npx tsc --noEmit --pretty false --incremental false`
- PASS: focused ESLint on changed UI files, with one warning for an existing `TopNav` `<img>` usage.
- PASS: disposable Postgres migration deploy on port `55433`.
- PASS: `npm run seed:nba`
- PASS: HTTP route smoke against local Next dev server on `127.0.0.1:3011`:
  - `/sports` returned `200`
  - `/sports/soccer` returned `200`
  - `/sports/soccer/world-cup` returned `200`
  - `/events/general-prediction-markets` returned `200`
- PASS: changed-file secret scan

Notes:

- `npm ci` failed in the original worktree with a Windows file lock on `node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node`; the same command passed in a fresh validation worktree, so this was treated as a local artifact lock rather than an application failure.
- `seed:nba` created markets, but no sports-classified events were returned by an `Event` query for `sportKey` or `category = "Sports"`. Sports seed/API alignment should be handled in a follow-up branch.
- Full Chrome/Playwright sports smoke is deferred until the Playwright admin-login branch is merged.

## Known Risks

- The branch depends on sports event/API data existing in the target environment.
- `dev` is still behind `main` until PR #13 is merged.
- Sports pages render, but seeded sports event data alignment remains unverified and should be fixed separately.

## Next Recommended Task

Merge the dev/main CI sync PR first, then review this sports UI PR after confirming the sports seed/API alignment follow-up is scheduled.

## Intentionally Not Touched

- Deposit, withdrawal, wallet custody, payment, trading ledger, settlement, and admin permission logic
- Production deployment configuration
- Main branch
