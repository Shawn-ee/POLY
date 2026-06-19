# Autonomous Decision Log

Last updated: 2026-06-18

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

## Open PR Decisions

| PR | Decision | Reason |
| --- | --- | --- |
| #25 | Do not auto-merge | Draft UI/product-code PR touching wallet/admin/private-pool surfaces. Requires human review or split PRs. |
| #135 | Do not auto-merge | UI product-code PR touches private pool action page and focused lint reports an existing hook-rule issue. |

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
- PR #135 was re-reviewed and updated from current `dev`, but left open because focused lint failed on the existing `useEffect(() => { load(); }, [])` hook pattern in an action-bearing UI page.
- PR #25 was re-reviewed and left open as draft because it is broad and touches wallet/admin/private-pool/pool-detail UI surfaces.

## Skipped Or Downgraded Tasks

- Public no-leak CI promotion was downgraded to a future docs-only readiness note because package/workflow changes are not auto-mergeable.
- Public API lane implementation is limited to docs-only scope until a human-reviewed package-script PR is opened.
- Market detail cleanup is limited to docs/checklists until a target contract and human-reviewed implementation path exist.
- Market detail tests remain non-auto-merge by default if they document current contract gaps.
- UI replacement work remains scoped through docs first; PR #25 itself is still not auto-mergeable.
- Admin/funding UI evidence can be prepared autonomously, but implementation and screenshots using sensitive data remain human-reviewed.
- PR #135 was left open instead of auto-merged under the autonomous policy.
- Reference/liquidity public/admin split remains docs-only because implementation is high-risk by topic.
- PR #25 direct merge remains blocked; replacement PRs should be smaller and reviewed independently.
- Admin auth and bot dry-run implementation tests remain review-only by default; autonomous work may refine scope docs but must not implement or auto-merge those tests without later explicit approval.
- Quote, orderbook, trade-tape, market detail current-gap, reference/liquidity, wallet, ledger, admin auth, and bot runtime tests remain non-auto-merge or docs-only unless a later human-reviewed scope permits implementation.

## Self-Review Notes

- ReviewerAgent passes docs-only changes when they are clear, bounded, and consistent with the agent operating docs.
- SecurityAgent passes public mocked tests when they do not use real DB, secrets, credentials, production data, chain RPC, external services, auth credentials, or money movement.
- Specialist reviewers are required for wallet/ledger/trading, bot, deployment, or UI implementation topics.
