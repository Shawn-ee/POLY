# Autonomous Decision Log

Last updated: 2026-06-19

## Decision Policy

Autonomous LeadAgent may merge docs-only PRs and low-risk mocked public/read-only test PRs when validation passes and internal ReviewerAgent/SecurityAgent review passes.

Autonomous LeadAgent must not auto-merge backend implementation, UI product-code, package/workflow/script, Prisma/migration, wallet, ledger, trading, admin-auth, bot-runtime, deployment, or secret changes.

## Recent Auto-Merge Decisions

| PR | Decision | Reason |
| --- | --- | --- |
| #100 | Auto-merged | Docs-only public API test queue. |
| #101 | Auto-merged | Low-risk mocked taxonomy response-shape test. |
| #102 | Auto-merged | Low-risk mocked event response-shape test. |
| #103 | Auto-merged | Low-risk mocked sports response-shape test. |
| #104 | Auto-merged | Low-risk mocked event-market response-shape test. |
| #105 | Auto-merged | Low-risk mocked market chart empty-state test. |
| #106 | Auto-merged | Low-risk mocked market list response-shape test. |
| #107 | Auto-merged | Docs-only PR #25 UI review checklist. |
| #108 | Auto-merged | Docs-only public route status rollup. |
| #109 | Auto-merged | Docs-only autonomous state foundation. |
| #110 | Auto-merged | Docs-only public no-leak CI promotion readiness. |
| #111 | Auto-merged | Docs-only market detail target-contract checklist. |
| #112 | Auto-merged | Docs-only PR #25 split/merge decision. |
| #113 | Auto-merged | Docs-only beta readiness evidence update. |
| #114 | Auto-merged | Docs-only autonomous checkpoint update. |
| #115 | Auto-merged | Low-risk mocked public event error response tests. |
| #116 | Auto-merged | Low-risk mocked public market error/empty tests. |
| #117 | Auto-merged | Docs-only public API stabilization criteria. |
| #118 | Auto-merged | Low-risk mocked taxonomy/sports empty-state tests. |
| #119 | Auto-merged | Docs-only autonomous public API checkpoint. |
| #120 | Auto-merged | Docs-only public API test lane implementation scope; package-script implementation remains human-reviewed. |
| #121 | Auto-merged | Docs-only PR #25 admin/funding UI review packet; PR #25 itself remains blocked. |
| #122 | Auto-merged | Docs-only public API coverage map and route status update. |
| #123 | Auto-merged | Docs-only beta and launch evidence update for public tests. |
| #124 | Auto-merged | Docs-only autonomous checkpoint update. |
| #125 | Auto-merged | Docs-only public API safe-test queue refresh. |
| #126 | Auto-merged | Docs-only market detail current-gap test review packet; future test remains non-auto-merge by default. |
| #127 | Auto-merged | Docs-only private pool list UI replacement scope. |
| #128 | Auto-merged | Docs-only public route page smoke evidence plan. |
| #129 | Auto-merged | Docs-only admin/funding UI screenshot evidence requirements. |
| #130 | Auto-merged | Docs-only autonomous UI evidence checkpoint. |
| #131 | Auto-merged | Docs-only UI replacement readiness rollup. |
| #132 | Auto-merged | Docs-only public beta evidence gap rollup. |
| #133 | Auto-merged | Docs-only public route smoke evidence template. |
| #136 | Auto-merged | Docs-only checkpoint for open autonomous review PRs. |
| #137 | Auto-merged | Docs-only open PR review lane checklist. |
| #138 | Auto-merged | Docs-only public route smoke command scope. |
| #139 | Auto-merged | Docs-only admin auth test implementation scope; admin auth test implementation remains human-reviewed. |
| #140 | Auto-merged | Docs-only bot dry-run test implementation scope refresh; bot runtime/test implementation remains human-reviewed by default. |
| #141 | Auto-merged | Docs-only autonomous checkpoint and progress report. |
| #142 | Auto-merged | Docs-only public route smoke evidence status; smoke implementation and package/workflow changes remain human-reviewed. |
| #143 | Auto-merged | Docs-only human review queue rollup for non-auto-merge PRs #25, #134, and #135. |
| #144 | Auto-merged | Docs-only public beta evidence tracker refresh. |
| #145 | Auto-merged | Low-risk mocked public/read-only test for `/api/markets` grouped reference filtering; full validation passed. |
| #146 | Auto-merged | Docs-only checkpoint after public beta evidence and test progress. |
| #147 | Auto-merged | Docs-only public API coverage map refresh after PR #145. |
| #148 | Auto-merged | Docs-only public route smoke manual-run prerequisites. |
| #149 | Auto-merged | Docs-only route smoke evidence placeholder marked not run. |
| #150 | Auto-merged | Docs-only route-smoke and autonomous-state docs index update. |
| #151 | Auto-merged | Docs-only public beta launch blocker summary. |
| #152 | Auto-merged | Docs-only final autonomous continuation state. |
| #134 | Auto-merged | Test-only mocked/local market-detail current-gap checks; branch updated from `dev`, full validation passed, no runtime behavior changed. |
| #153 | Auto-merged | Docs-only open PR review queue and state update after PR #25, #134, and #135 review. |
| #154 | Auto-merged | Focused lint-clean replacement for PR #135; changed only `src/app/my-pools/page.tsx`, full validation and focused lint passed, and no backend/API, wallet/funding, auth/admin, trading, bot, deployment, Prisma, package, workflow, or script behavior changed. |
| #157 | Auto-merged | Docs-only UI standardization master plan and progress tracker; validation diff checks passed. |
| #158 | Auto-merged | Small display-only homepage copy/CTA simplification; changed only `src/app/page.tsx`, full validation and focused lint passed, and no data fetching, API, wallet, admin, trading, bot, deployment, Prisma, package, workflow, or script behavior changed. |
| #160 | Auto-merged | Small display-only sports discovery copy polish; changed only sports display pages/component, full validation and focused lint passed, and no route behavior, fetching, filters, wallet, auth, admin, trading, bot, deployment, Prisma, package, workflow, or script behavior changed. |
| #162 | Auto-merged | Docs-only Phase 0 UI style foundation trackers; validation diff checks passed. |
| #163 | Auto-merged | Small display-only events list state polish; changed only `src/app/events/page.tsx`, full validation and focused lint passed, and no fetching, event card, API, wallet, auth, admin, trading, bot, deployment, Prisma, package, workflow, or script behavior changed. |
| #164 | Auto-merged | Small display-only login page polish; changed only `src/app/login/page.tsx`, full validation and focused lint passed, and no OAuth, wallet auth, session, cookie, admin auth, API, deployment, Prisma, package, workflow, or script behavior changed. |
| #166 | Auto-merged | Small display-only markets discovery polish; changed only `src/app/markets/page.tsx`, full validation and focused lint passed, and no filtering behavior, API behavior, wallet, auth, admin, trading, bot, deployment, Prisma, package, workflow, or script behavior changed. |
| #168 | Auto-merged | Docs-only event-detail display shell plan; grouped trade and order behavior remain review-gated. |
| #169 | Auto-merged | Docs-only market-detail display shell plan; orderbook, order ticket, pool actions, positions, and bot/reference behavior remain review-gated. |
| #170 | Auto-merged | Docs-only wallet funding-claim review; deposit, withdrawal, linked-wallet, balance, and ledger behavior remain review-gated. |
| #171 | Auto-merged | Docs-only portfolio display scope; balance, locked-fund, PnL, position, order, and history semantics remain review-gated. |
| #173 | Auto-merged | Docs-only admin display scope; admin auth, finance mutations, market resolution, bot/reference actions, system readiness, deployment, and agent operations remain review-gated. |
| #179 | Auto-merged | Docs-only UI state terminology map; no runtime code, tests, package/workflow changes, browser run, screenshots, or production data. |
| #180 | Auto-merged | Docs-only homepage wallet/admin surface decision; no runtime code, wallet/funding behavior, admin auth, package/workflow changes, browser run, screenshots, or production data. |
| #181 | Auto-merged | Docs-only market-detail screenshot/smoke checklist; no runtime code, browser run, screenshots, fixtures, order behavior, wallet behavior, bot/reference behavior, or production data. |
| #182 | Auto-merged | Docs-only current-dev autonomous state refresh after UI follow-ups; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #183 | Auto-merged | Docs-only autonomous checkpoint refresh after PR #182; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #184 | Auto-merged | Docs-only checkpoint refresh after PR #183; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #185 | Auto-merged | Docs-only checkpoint refresh after PR #184; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #186 | Auto-merged | Docs-only checkpoint refresh after PR #185; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #188 | Auto-merged | Docs-only checkpoint refresh after PR #186; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #190 | Auto-merged | Docs-only checkpoint refresh after PR #188; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #191 | Auto-merged | Docs-only anonymous route smoke checklist; no server, browser run, screenshots, package/workflow changes, fixtures, auth, wallet, funding, trading, admin, bot, or production data. |
| #193 | Auto-merged | Docs-only checkpoint refresh after PR #191; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #194 | Auto-merged | Docs-only open PR review queue refresh after PR #193; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #196 | Auto-merged | Docs-only checkpoint refresh after PR #194; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #199 | Auto-merged | Docs-only checkpoint refresh after PR #196; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #200 | Auto-merged | Docs-only checkpoint refresh after PR #199; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #197 | Auto-merged | Docs-only mobile viewport route-smoke checklist; no server, browser run, screenshots, package/workflow changes, fixtures, auth, wallet, funding, trading, admin, bot, or production data. |
| #201 | Auto-merged | Docs-only open PR queue refresh after PR #197; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #202 | Auto-merged | Docs-only checkpoint refresh after PR #201; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |
| #204 | Auto-merged | Docs-only checkpoint refresh after PR #202; no runtime code, browser run, screenshots, package/workflow changes, fixtures, wallet, order, bot/reference, or production data. |

## Open PR Decisions

| PR | Decision | Reason |
| --- | --- | --- |
| #25 | Do not auto-merge | Draft UI/product-code PR touching wallet/admin/private-pool surfaces. Requires human review or split PRs. |
| #177 | Do not merge as-is | Docs-only post-merge state hygiene PR targets older checkpoint `8db1fd7`; later `dev` commits already supersede the same state area. Close or update after maintainer review. |
| #192 | Do not merge as-is | Draft docs-only checkpoint after PR #191 is superseded by merged PR #193. Close or update after maintainer review. |
| #198 | Do not merge as-is | Draft docs-only checkpoint after PR #196 is superseded by merged PR #199, PR #200, PR #197, PR #201, PR #202, and PR #204. Close or update after maintainer review. |
| #203 | Do not auto-merge yet | Draft event-detail UI product-code PR; requires focused validation and confirmation that grouped trade state, order callbacks, polling, fetch behavior, wallet, ledger, trading, admin, bot, package/workflow, Prisma, deployment, and secrets are untouched. |
| #205/#206/#207 | Do not merge as-is | Duplicate draft checkpoint refresh PRs after PR #204; close or reconcile with the latest checkpoint refresh to avoid stale/overlapping state docs. |
| #135 | Closed as superseded | Replaced by PR #154, which carried the same focused display intent with a lint-safe initial load path and full validation. |
| #175 | Merged after self-review | User requested self-review and merge if safe. The PR was display-only, avoided forbidden files/logic, passed focused validation/build, and full-lint failures were documented as pre-existing/unrelated. |
| #176 | Auto-merged | Docs-only post-merge state refresh after PR #175; no runtime behavior changed. |

## Task Selection Decisions

- Public API tests were selected because they are local, mocked, public/read-only, and improve no-leak confidence without changing product behavior.
- PR #25 was reviewed through a separate docs-only checklist because direct merge is too broad and touches sensitive UI surfaces.
- Public route status rollup was selected to keep state current before test lane/package/workflow decisions.
- Autonomous state files were selected to make longer-running LeadAgent work resumable and auditable.
- Public no-leak CI readiness was selected before any package/workflow changes so future CI work remains human-reviewed.
- Market detail target-contract checklist was selected because market detail implementation is not safe to auto-merge without explicit contract gates.
- PR #25 split decision was selected because the broad draft UI PR is not safe to merge directly.
- Beta readiness evidence was updated after public API and autonomous-state docs changed.
- Public event/market/taxonomy/sports error and empty-state tests were selected because they stayed mocked, local, public/read-only, and did not alter route behavior.
- Public API stabilization criteria were selected to define a clear stopping gate for public contract work before UI or package/workflow changes.
- Public API test lane implementation scope was selected to make any future `package.json` test-lane PR reviewable and non-auto-mergeable.
- PR #25 admin/funding review packet was selected because the draft PR remains broad, stale, and UI/product-code-touching.
- Public API coverage-map and beta evidence updates were selected to prevent stale route/test status from driving duplicate work.
- Public API safe-test queue refresh was selected to remove completed low-risk test tasks from the next queue.
- Market detail current-gap review packet was selected to keep any future market-detail test non-auto-merge by default.
- Private pool list UI replacement scope was selected before any PR #25 replacement UI code.
- Public route page smoke evidence plan was selected before browser/test implementation.
- Admin/funding UI screenshot requirements were selected to keep high-risk UI evidence human-reviewed.
- UI replacement readiness rollup and public beta evidence gap rollup were selected before opening implementation review PRs.
- Public route smoke evidence template was selected so future smoke runs can be recorded without exposing secrets or production data.
- Market detail current-gap test was opened but left unmerged because it is useful evidence and not a low-risk auto-merge lane.
- Private pool list display polish was opened but left unmerged because it changes UI product code on an action-bearing page.
- Admin auth implementation test scope was selected as docs-only because auth behavior and auth tests are not auto-mergeable in the current policy.
- Bot dry-run test implementation scope refresh was selected as docs-only because bot runtime behavior, credentials, and live trading are high-risk and future implementation must remain human-reviewed.
- Autonomous progress reporting was selected after the PR #136-#140 checkpoint window to preserve resumable state without changing runtime behavior.
- Public route smoke evidence status was selected because plans/templates/command scope exist, but no safe manual/browser evidence has been recorded and package/workflow changes remain human-reviewed.
- Human review queue rollup was selected to preserve the autonomous decision not to merge PR #25, #134, or #135 while continuing other safe work.
- Public beta evidence tracker refresh was selected after route smoke and human review queue docs changed, so beta evidence does not lag the autonomous state.
- Public market-list grouped reference filter test was selected because it used existing mocks, avoided market-detail current-gap ambiguity, changed only `src/__tests__/`, and covered public/read-only response behavior.
- Public API coverage map refresh was selected because PR #145 changed test coverage and the docs should remain the source of truth for future task selection.
- Public route smoke manual-run prerequisites were selected before any browser/server evidence run so future route smoke work remains local-only, anonymous-first, and human-reviewed for package/workflow changes.
- Route smoke evidence placeholder was selected to make the current not-run status explicit without starting a server, opening a browser, or capturing screenshots.
- Route smoke docs index update was selected so future agents can find the route-smoke and autonomous state docs without scanning the full review folder.
- Public beta launch blocker summary was selected because the evidence set is now broad enough to need a concise no-go summary, while all launch decisions remain human-owned.
- Final continuation prompt and state checkpoint were selected because remaining obvious work is either human/specialist review, local environment evidence, package/workflow promotion, or UI/source-code review work.
- PR #134 was re-reviewed, updated from current `dev`, validated, and merged because it satisfied the explicit test-only auto-merge criteria.
- PR #135 was re-reviewed and updated from current `dev`, but was not merged because focused lint failed on the existing `useEffect(() => { load(); }, [])` hook pattern in an action-bearing UI page.
- PR #25 was re-reviewed and left open as draft because it is broad and touches wallet/admin/private-pool/pool-detail UI surfaces.
- PR #154 was selected as a focused replacement for PR #135 because it preserved the private pool list display intent while fixing the focused hook lint failure.
- UI-000 was selected first in the UI standardization program because broad UI work needed an explicit master plan, route classification, merge policy, and progress tracker.
- UI-001 was selected because homepage simplification is Phase 1, low-risk, public-facing, and could be limited to copy/CTA/empty-state display without changing behavior.
- UI-002 was selected because sports discovery is the primary MVP path and the improvement could be limited to copy, labels, and empty-state text without changing behavior.
- UI-013 through UI-017 were selected to complete Phase 0 style and status foundations before broad UI changes.
- UI-003 was selected because `/events` is a public discovery page and could be aligned with shared state components without changing fetch or card behavior.
- UI-005 was selected because `/login` is a low-risk onboarding surface and the lint-safe derived error cleanup did not change auth mechanics.
- UI-004 was selected because `/markets` is a public discovery page and the polish could be limited to existing filter presentation, beta-safe copy, empty state text, and no-price fallback display without changing fetch, routing, or API behavior.
- UI-018 was selected as docs-only because `/events/[slug]` imports `GroupedTradeTicket` and supports grouped trade selection/order callbacks.
- UI-019 was selected as docs-only because `/markets/[id]` routes into orderbook, order ticket, pool action, position, and bot/reference surfaces.
- UI-007 was selected as docs-only because `/wallet` owns deposit, withdrawal, linked-wallet, external balance, and transaction surfaces.
- UI-009 was selected as docs-only because `/portfolio` displays balances, locked funds, PnL, positions, and account history.
- UI-025 was selected as docs-only because admin surfaces include auth, finance operations, market resolution, bot/reference controls, system readiness, and agent monitoring.
- `agent/big-ui-overhaul` was selected because the user explicitly requested a single large cohesive UI overhaul instead of many tiny PRs. The plan was self-reviewed as display-only and review-gated, with no auto-merge.
- `agent/ui-overhaul-post-merge-state` was selected to record PR #175's merge outcome and keep autonomous state docs resumable before any further UI or smoke-evidence work.
- `agent/ui-state-terminology-map` was selected because UI-010 remained a safe docs-only follow-up after the big UI milestone and prevents future copy PRs from guessing about loading, empty, error, signed-out, unavailable, and beta-gated state wording.
- `agent/homepage-surface-decision` was selected because UI-011 remained a safe docs-only follow-up and future homepage account/admin cleanup needs an explicit boundary before any source-code changes.
- `agent/market-detail-smoke-checklist` was selected because UI-019A/UI-022 remained a safe docs-only prerequisite before any market-detail screenshot, smoke evidence, or source-code work.
- `agent/post-ui-state-current-dev-refresh` was selected because current `dev` contained merged docs-only PRs #179-#181 and open stale PR #177 was not reflected in the state docs; it merged as PR #182.
- `agent/current-dev-checkpoint-pr183` was selected because current `dev` contains merged PR #183 and several review trackers still pointed at the earlier `f91470f` checkpoint.
- `agent/current-dev-checkpoint-pr184` was selected because current `dev` contains merged PR #184 and several review trackers still pointed at the earlier `45abc57` checkpoint.
- `agent/current-dev-checkpoint-pr185` was selected because current `dev` contains merged PR #185 and several review trackers still pointed at the earlier `b59eb3d` checkpoint.
- `agent/current-dev-checkpoint-pr186` was selected because current `dev` contains merged PR #186 and several review trackers still pointed at the earlier `0d13a84` checkpoint.
- `agent/current-dev-checkpoint-pr188` was selected because current `dev` contains merged PR #188 and several review trackers still pointed at the earlier `4a7e0a9` checkpoint.
- `agent/current-dev-checkpoint-pr190` was selected because current `dev` contains merged PR #190 and several review trackers still pointed at the earlier `c8f8064` checkpoint.
- `agent/public-route-smoke-anonymous-checklist` was selected because public route smoke evidence still needed an anonymous-only observation checklist before any local server, browser, screenshots, fixtures, or package/workflow changes.
- `agent/current-dev-checkpoint-pr191-refresh` was selected because current `dev` contains merged PR #191 and several review trackers still pointed at the earlier `fac8139` checkpoint; it merged as PR #193.
- `agent/current-open-pr-queue-refresh` was selected because open draft PR #192 is now superseded by merged PR #193 and should not be merged as-is.
- `agent/current-dev-checkpoint-pr194` was selected because current `dev` contains merged PR #194 and several checkpoint trackers still pointed at the earlier `b697302` checkpoint.
- `agent/current-dev-checkpoint-pr196` was selected because current `dev` contains merged PR #196 and several checkpoint trackers still pointed at the earlier `2740a69` checkpoint.
- `agent/current-dev-checkpoint-pr199` was selected because current `dev` contains merged PR #199 and several checkpoint trackers still pointed at the earlier `021c905` checkpoint.
- `agent/public-route-smoke-mobile-checklist` was selected because the first anonymous route-smoke run still needed desktop, tablet/narrow desktop, and mobile viewport observation prompts before any local server, browser, screenshots, fixtures, or package/workflow changes.
- `agent/open-pr-queue-after-pr197` was selected because PR #198 is now stale after merged PR #199, PR #200, and PR #197 and should not be merged as-is.
- `agent/current-dev-checkpoint-pr201` was selected because current `dev` contains merged PR #201 and several checkpoint trackers still pointed at the earlier `5d19f3d` checkpoint.
- `agent/current-dev-checkpoint-pr202` was selected because current `dev` contains merged PR #202 and several checkpoint trackers still pointed at the earlier `d08f95c` checkpoint.
- `agent/current-dev-checkpoint-after-pr204` was selected because current `dev` contains merged PR #204 and several checkpoint trackers still pointed at the earlier `6e618e7` checkpoint.

## Skipped Or Downgraded Tasks

- Public no-leak CI promotion was downgraded to a future docs-only readiness note because package/workflow changes are not auto-mergeable.
- Public API lane implementation is limited to docs-only scope until a human-reviewed package-script PR is opened.
- Market detail cleanup is limited to docs/checklists until a target contract and human-reviewed implementation path exist.
- Market detail tests remain non-auto-merge by default if they document current contract gaps.
- UI replacement work remains scoped through docs first; PR #25 itself is still not auto-mergeable.
- Admin/funding UI evidence can be prepared autonomously, but implementation and screenshots using sensitive data remain human-reviewed.
- PR #135 was closed as superseded after PR #154 merged.
- Reference/liquidity public/admin split remains docs-only because implementation is high-risk by topic.
- PR #25 direct merge remains blocked; replacement PRs should be smaller and reviewed independently.
- Admin auth and bot dry-run implementation tests remain review-only by default; autonomous work may refine scope docs but must not implement or auto-merge those tests without later explicit approval.
- Quote, orderbook, trade-tape, market detail current-gap, reference/liquidity, wallet, ledger, admin auth, and bot runtime tests remain non-auto-merge or docs-only unless a later human-reviewed scope permits implementation.

## Self-Review Notes

- ReviewerAgent passes docs-only changes when they are clear, bounded, and consistent with the agent operating docs.
- SecurityAgent passes public mocked tests when they do not use real DB, secrets, credentials, production data, chain RPC, external services, auth credentials, or money movement.
- Specialist reviewers are required for wallet/ledger/trading, bot, deployment, or UI implementation topics.
