# Open PR Review Queue

Last updated: 2026-06-19

Task id: DOC-065

Mode: AUTONOMOUS_REVIEW_RESOLVER

## Purpose

This document records the current open PR review queue after autonomous review of PR #25, PR #134, PR #135, PR #154, stale docs-only PR #177, superseded draft docs-only PR #192, stale draft docs-only PR #198, duplicate draft checkpoint PRs #205-#207, merged checkpoint refreshes through PR #208, merged event-detail state-copy PR #203, merged route-smoke preparation PR #197, and merged open PR queue refresh PR #201 on `dev`.

It does not change product code, UI code, backend logic, wallet, deposit, withdrawal, ledger, matching, settlement, admin auth behavior, bot live trading, deployment, Prisma, migrations, secrets, or production behavior.

## Review Outcome Summary

| PR | Title | Classification | Risk | Decision | Reason |
|---|---|---|---|---|---|
| #25 | `feat: polish admin wallet and pool UI` | Broad draft UI/product-code PR | High by touched surfaces | Leave open as draft | Touches wallet, admin deposit/withdrawal, private pool, and pool detail UI surfaces; too broad for autonomous merge. |
| #177 | `docs: refresh UI post-merge state` | Docs-only state refresh | Low by file type, stale by content | Close or update, do not merge as-is | Targets older checkpoint `8db1fd7`; current `dev` is `c399472` and includes later state-refresh docs through PR #208 and PR #203. |
| #192 | `docs: refresh autonomous checkpoint after pr191` | Draft docs-only checkpoint | Low by file type, stale by content | Close or update, do not merge as-is | Superseded by merged PR #193 and reflected in later queue/checkpoint refreshes through PR #208 and PR #203 on current `dev` checkpoint `c399472`. |
| #198 | `docs: refresh checkpoint after pr196` | Draft docs-only checkpoint | Low by file type, stale by content | Close or update, do not merge as-is | Superseded by merged PR #199, PR #200, PR #197, PR #201, PR #202, PR #204, PR #208, and PR #203 on current `dev` checkpoint `c399472`. |
| #205 | `docs: refresh checkpoint after pr204` | Draft docs-only checkpoint/evidence refresh | Low by file type, overlapping by content | Close or reconcile, do not merge as-is | Overlaps the checkpoint lane now covered by PR #208 and the post-PR #203 checkpoint; also adds a not-run route-smoke evidence placeholder that should be reconciled before merge. |
| #206 | `docs: refresh checkpoint after pr204` | Draft docs-only checkpoint refresh | Low by file type, overlapping by content | Close or reconcile, do not merge as-is | Duplicates the post-PR #204 checkpoint refresh intent now covered by PR #208 and the post-PR #203 checkpoint; reconcile before merge. |
| #207 | `docs: refresh checkpoint after pr204` | Draft docs-only checkpoint refresh | Low by file type, overlapping by content | Close or reconcile, do not merge as-is | Duplicates the post-PR #204 checkpoint refresh intent now covered by PR #208 and the post-PR #203 checkpoint; reconcile before merge. |
| #134 | `test: add public market detail current-gap checks` | Test-only mocked public route current-gap PR | Medium by public API contract topic | Merged | Changed only `src/__tests__/public.market-detail.current-gap.test.ts`; full validation passed; no runtime behavior changed. |
| #135 | `feat: polish private pool list display` | UI product-code PR on action-bearing page | Medium | Closed as superseded | Replaced by lint-clean PR #154. |
| #154 | `fix: make private pool list load lint-safe` | Focused UI display replacement for PR #135 | Medium | Merged | Changed only `src/app/my-pools/page.tsx`; full validation and focused lint passed; no product/runtime behavior outside the page changed. |
| #200 | `docs: refresh checkpoint after pr199` | Docs-only checkpoint refresh | Low | Merged | Refreshed checkpoint docs after PR #199; no runtime behavior changed. |
| #197 | `docs: add public route viewport smoke checklist` | Docs-only route-smoke preparation | Low | Merged | Added mobile viewport smoke checklist and status links; no server, browser, screenshots, package/workflow, source, fixture, or production data changes. |

## PR #25 Details

Changed files:

- `docs/CURRENT_STATE.md`
- `docs/agent-reports/2026-06-18-ui-admin-subpages-wallet-pools-light.md`
- `src/app/admin/deposits/page.tsx`
- `src/app/admin/withdrawals/page.tsx`
- `src/app/my-pools/page.tsx`
- `src/app/wallet/page.tsx`
- `src/components/PoolMarketDetail.tsx`

Review classification:

- Draft PR.
- Broad UI/product-code PR.
- Wallet/funding-adjacent.
- Admin deposit/withdrawal operation-screen adjacent.
- Private-pool and pool-detail action-surface adjacent.

Decision:

- Do not merge autonomously.
- Leave open as draft.
- Prefer split/replacement PRs.

Comment added:

- Yes. The PR now has a comment explaining classification, why it was not auto-merged, and recommended split/replacement path.

## PR #134 Details

Changed files:

- `src/__tests__/public.market-detail.current-gap.test.ts`

Review classification:

- Test-only.
- Mocked/local/read-only.
- No route implementation changes.
- Medium by public API contract topic because it documents current extra market-detail fields.

Validation after updating from current `dev`:

```bash
git diff --check dev...HEAD
npx jest --runInBand --detectOpenHandles src/__tests__/public.market-detail.current-gap.test.ts
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Result:

- Passed.
- Prisma emitted existing package config deprecation and `.env` load notices.
- `npm run test:ci` emitted the existing health-route failure-path `console.error`.

Decision:

- Merged as PR #134.
- Merge commit: `2d5dfd767dc148bad5a18259eab4fec65e65e42f`.

## PR #135 Details

Changed files:

- `src/app/my-pools/page.tsx`

Review classification:

- UI product-code.
- Display-intent.
- Action-bearing private-pool page.
- No backend/API implementation changes in the PR diff.

Validation after updating from current `dev`:

```bash
git diff --check dev...HEAD
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- src/app/my-pools/page.tsx
```

Result:

- `git diff --check dev...HEAD`: passed.
- Prisma generate: passed with existing Prisma deprecation and `.env` load notices.
- Prisma validate: passed with existing Prisma deprecation and `.env` load notices.
- TypeScript: passed.
- `npm run test:ci`: passed with existing health-route failure-path `console.error`.
- Focused lint: failed on `react-hooks/set-state-in-effect` for the existing `useEffect(() => { load(); }, [])` pattern.

Decision:

- Superseded by PR #154.
- Closed after PR #154 merged.

Comments added:

- Yes. The PR first received a comment explaining validation results, classification, why it was not auto-merged, and recommended next action.
- A second comment records that PR #154 superseded it after full validation.

## PR #154 Details

Changed files:

- `src/app/my-pools/page.tsx`

Review classification:

- Focused replacement for PR #135.
- UI product-code.
- Display-intent on an action-bearing private-pool page.
- No backend/API, wallet/funding, auth/admin, trading, bot, deployment, Prisma, package, workflow, script, or secret changes.

Validation:

```bash
git diff --check
git diff --cached --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run lint -- src/app/my-pools/page.tsx
```

Result:

- Passed.
- Prisma emitted existing package config deprecation and `.env` load notices.
- `npm run test:ci` emitted the existing health-route failure-path `console.error`.

Decision:

- Merged as PR #154.
- Merge commit: `9f369147558e4be0442245d97d0af0c9875b706a`.

## Current Queue

Open and unresolved:

1. PR #25: draft/broad/split required.
2. PR #177: stale docs-only state refresh from an older checkpoint; close as superseded or update from current `dev`.
3. PR #192: stale draft docs-only checkpoint superseded by PR #193; close as superseded or update from current `dev`.
4. PR #198: stale draft docs-only checkpoint superseded by PR #199, PR #200, PR #197, PR #201, PR #202, and PR #204; close as superseded or update from current `dev`.
5. PR #205: draft checkpoint/evidence refresh after PR #204; reconcile or close because it overlaps PR #208 and the post-PR #203 checkpoint.
6. PR #206: draft checkpoint refresh after PR #204; reconcile or close because it overlaps PR #208 and the post-PR #203 checkpoint.
7. PR #207: draft checkpoint refresh after PR #204; reconcile or close because it overlaps PR #208 and the post-PR #203 checkpoint.

Resolved:

1. PR #134: merged after validation.
2. PR #135: closed as superseded by PR #154.
3. PR #154: merged after validation.
4. PR #200: merged as docs-only checkpoint refresh after PR #199.
5. PR #197: merged as docs-only public route viewport smoke checklist.
6. PR #201: merged as docs-only open PR queue refresh after PR #197.
7. PR #202: merged as docs-only checkpoint refresh after PR #201.
8. PR #204: merged as docs-only checkpoint refresh after PR #202.
9. PR #208: merged as docs-only checkpoint refresh after PR #204 and current open queue update.
10. PR #203: merged as focused event-detail loading/error/empty state copy polish after validation.

## Next Recommended Actions

1. Decide whether to close PR #25 as superseded or split it into smaller route-specific PRs.
2. Close or update PR #177 so stale state-refresh wording does not merge over newer docs.
3. Close or update PR #192 so its superseded checkpoint wording does not merge over PR #193-era docs.
4. Close or update PR #198 so its superseded checkpoint wording does not merge over PR #199/#200/#197/#201/#202/#204-era docs.
5. Close or reconcile duplicate checkpoint drafts #205, #206, and #207 before any further state-refresh merge.
6. Keep wallet/admin funding UI, pool detail action UI, and package/workflow changes human-reviewed.
7. Use PR #154 as the accepted replacement for the private pool list display polish.
