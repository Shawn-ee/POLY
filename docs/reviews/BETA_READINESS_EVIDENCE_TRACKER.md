# Beta Readiness Evidence Tracker

Task id: DOC-004
Assigned subagents: DocsAgent, TestingAgent, SecurityAgent
Risk level: Low
Status: Evidence tracker, docs-only

## Purpose

This tracker maps POLY public-beta readiness claims to the evidence needed before a human can decide whether the product is ready for broader use.

It does not approve launch, deploy production, enable funding, change code, alter wallet or ledger behavior, change bot behavior, modify auth, or replace `docs/reviews/PUBLIC_BETA_READINESS_CHECKLIST.md`.

## Evidence Status Legend

- Missing: No committed evidence yet.
- Draft: Planning or inventory exists, but no validating test/runbook/sign-off exists.
- Partial: Some validation exists, but the claim is not complete.
- Ready for human review: Evidence exists and needs owner sign-off.
- Approved: Human-approved evidence exists.

## Evidence Rules

- Evidence must be committed to the repo or linked from a durable project record.
- Test evidence must name the exact command, date, branch, and result.
- Security, wallet, ledger, deposit, withdrawal, trading, bot, and deployment evidence requires human review before it can be marked Approved.
- Secret values, private keys, wallet seeds, credentials, and production environment contents must never be pasted into evidence.
- Public-beta readiness cannot be marked Approved by an autonomous agent.

## Product And UX Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Sports-first MVP information architecture is defined. | `docs/reviews/MVP_INFORMATION_ARCHITECTURE.md` and route priority decisions. | Partial | PlannerAgent | No |
| Public sports homepage is implementation-ready. | `docs/reviews/SPORTS_HOMEPAGE_READINESS_CHECKLIST.md` plus future screenshots/tests. | Draft | FrontendAgent, TestingAgent | No |
| Market/event discovery is understandable. | Page review, copy glossary, public smoke tests, and mobile screenshots. | Draft | FrontendAgent, TestingAgent | No |
| Trade ticket states are specified. | `docs/reviews/ORDER_TICKET_ERROR_EMPTY_STATE_SPEC.md` and future UI/test evidence. | Draft | PlannerAgent, TestingAgent | No |
| Portfolio/account empty states are specified. | `docs/reviews/PORTFOLIO_EMPTY_STATE_TEST_PLAN.md` and future UI/test evidence. | Draft | TestingAgent | No |

## Public API And No-Leak Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Public taxonomy routes avoid sensitive fields. | `src/__tests__/public.taxonomy.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial, expanded mocked coverage | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public event routes avoid sensitive fields. | `src/__tests__/public.events.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial, expanded mocked coverage | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public sports routes avoid sensitive fields. | `src/__tests__/public.sports.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial, expanded mocked coverage | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public event market routes avoid sensitive fields. | `src/__tests__/public.event-markets.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial, expanded mocked coverage | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public market list routes avoid sensitive fields. | `src/__tests__/public.market-list.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial, expanded mocked coverage | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public market chart routes avoid sensitive fields. | `src/__tests__/public.market-chart.no-leak.test.ts` targeted result and future CI inclusion decision. | Partial, expanded mocked coverage | TestingAgent, SecurityAgent | Yes, for low-risk test-only PRs |
| Public market detail contract is defined. | `docs/reviews/MARKET_DETAIL_PUBLIC_CONTRACT_DECISION.md` and `docs/reviews/MARKET_DETAIL_CLEANUP_IMPLEMENTATION_PLAN.md`. | Draft | BackendAgent, SecurityAgent | No |
| Public market detail implementation has a review gate. | `docs/reviews/MARKET_DETAIL_TARGET_CONTRACT_CHECKLIST.md`, `docs/reviews/MARKET_DETAIL_CURRENT_GAP_TEST_REVIEW_PACKET.md`, and PR #134 review status. | Draft/open review | BackendAgent, TestingAgent, SecurityAgent | No |
| Public route cleanup gaps are mapped. | `docs/reviews/PUBLIC_ROUTE_CLEANUP_GAP_ANALYSIS.md` and route status rollups. | Draft | PlannerAgent, SecurityAgent | No |
| Public API no-leak CI promotion is gated. | `docs/reviews/PUBLIC_NO_LEAK_CI_PROMOTION_READINESS.md`, `docs/reviews/PUBLIC_API_TEST_LANE_DECISION.md`, and `docs/reviews/PUBLIC_API_TEST_LANE_IMPLEMENTATION_SCOPE.md`. | Draft/human-reviewed before implementation | TestingAgent, SecurityAgent, DeploymentAgent | No |
| Public quote/orderbook/trade-tape routes avoid sensitive fields. | Mocked read-only no-leak tests with no money movement. | Missing | TestingAgent, SecurityAgent | Maybe, only if low-risk and mocked |
| Public route/page smoke evidence is scoped. | `docs/reviews/PUBLIC_ROUTE_PAGE_SMOKE_EVIDENCE_PLAN.md`, `docs/reviews/PUBLIC_ROUTE_SMOKE_COMMAND_SCOPE.md`, `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_TEMPLATE.md`, and `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_STATUS.md`. | Draft/not run | TestingAgent, FrontendAgent, SecurityAgent | No |

## Admin And Security Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Admin route ownership is known. | `docs/reviews/API_ROUTE_OWNERSHIP_INVENTORY.md`. | Draft | SecurityAgent | No |
| Admin auth tests are scoped. | `docs/reviews/ADMIN_AUTH_TEST_MATRIX.md`. | Draft | SecurityAgent, TestingAgent | No |
| Admin auth behavior is tested. | Focused 401/403/admin-positive tests. | Missing | SecurityAgent, TestingAgent | No |
| Secret artifact risks are documented. | `docs/SECRET_ARTIFACT_AUDIT.md` and any follow-up audit notes. | Draft | SecurityAgent | No |
| Public responses avoid secrets. | No-leak tests for taxonomy, event, sports, market list, event markets, and chart routes; quote/orderbook/trade-tape still pending. | Partial | SecurityAgent, TestingAgent | No |

## Wallet, Ledger, Deposit, And Withdrawal Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Canonical deposit architecture is decided. | Human-approved architecture decision. | Missing | LedgerWalletReviewerAgent, SecurityAgent | No |
| Funding gates are safe for beta. | Human-reviewed tests and runbook proving disabled/default-safe behavior. | Missing | LedgerWalletReviewerAgent, SecurityAgent | No |
| Balance changes are auditable. | Ledger invariant tests and reconciliation evidence. | Missing | LedgerWalletReviewerAgent, TestingAgent | No |
| Withdrawal states are safe. | Request, approval/rejection, lock/unlock, completion, and tx-hash evidence. | Missing | LedgerWalletReviewerAgent, SecurityAgent | No |
| Production private keys are protected. | Human-reviewed custody runbook and secret-handling evidence. | Missing | SecurityAgent, LedgerWalletReviewerAgent | No |

## Bot And Liquidity Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Bot dry-run/live separation is clear. | `docs/reviews/BOT_DRY_RUN_SAFETY_TEST_PLAN.md`, `docs/reviews/BOT_DRY_RUN_TEST_IMPLEMENTATION_SCOPE.md`, and future human-reviewed tests. | Draft/review-gated | BotAgent, SecurityAgent | No |
| Bot credentials are handled safely. | `docs/reviews/BOT_CREDENTIAL_HANDLING_REVIEW.md` and human-reviewed remediation evidence. | Draft | BotAgent, SecurityAgent | No |
| Bot operations have a runbook. | `docs/reviews/BOT_OPERATIONS_RUNBOOK_OUTLINE.md` and future completed runbook. | Draft | BotAgent, DeploymentAgent | No |
| Reference liquidity public/admin split is planned. | `docs/reviews/REFERENCE_LIQUIDITY_PUBLIC_ADMIN_SPLIT_DECISION.md` and `docs/reviews/REFERENCE_LIQUIDITY_SPLIT_IMPLEMENTATION_PLAN.md`. | Draft | SecurityAgent, BotAgent, LedgerWalletReviewerAgent | No |
| Live bot launch controls are tested. | Kill switch, caps, allowlists, and dry-run tests. | Missing | BotAgent, TestingAgent | No |

## Deployment And Operations Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Required CI passes for dev/main. | Latest CI run and local validation command record. | Partial | TestingAgent | No |
| Deployment runbook is complete. | Human-reviewed production checklist and rollback plan. | Missing | DeploymentAgent | No |
| Production deployment remains human-only. | Agent operating rules and deployment docs. | Partial | LeadAgent, DeploymentAgent | No |
| Incident response is defined. | Funding, trading, admin, bot, and deployment incident runbooks. | Missing | SecurityAgent, DeploymentAgent | No |

## Autonomous Execution Evidence

| Claim | Required evidence | Current status | Owner | Auto-approvable |
|---|---|---|---|---|
| Autonomous state is tracked. | `docs/reviews/AUTONOMOUS_EXECUTION_STATE.md`. | Partial | LeadAgent | Yes, docs-only updates |
| Autonomous merge decisions are recorded. | `docs/reviews/AUTONOMOUS_DECISION_LOG.md`. | Partial | LeadAgent, SecurityAgent | Yes, docs-only updates |
| Human-only decisions are separated from autonomous work. | `docs/reviews/HUMAN_DECISION_REQUIRED.md`. | Partial | LeadAgent, SecurityAgent | Yes, docs-only updates |
| Autonomous continuation is documented. | `docs/reviews/AUTONOMOUS_CONTINUATION_PROMPT.md`. | Partial | LeadAgent | Yes, docs-only updates |
| PR #25 has a non-auto-merge review path. | `docs/reviews/PR25_UI_REVIEW_CHECKLIST.md`, `docs/reviews/PR25_SPLIT_MERGE_DECISION.md`, and `docs/reviews/PR25_ADMIN_FUNDING_UI_REVIEW_PACKET.md`. | Draft | FrontendAgent, SecurityAgent | No |
| Open non-auto-merge PRs are tracked. | `docs/reviews/HUMAN_REVIEW_QUEUE_ROLLUP.md`. | Partial/current for PR #25, #134, and #135 | LeadAgent, SecurityAgent | Yes, docs-only updates |
| Autonomous progress has a compact checkpoint. | `docs/reviews/AUTONOMOUS_PROGRESS_REPORT.md`. | Partial | LeadAgent | Yes, docs-only updates |

## Recommended Evidence Collection Sequence

1. Keep current public no-leak tests as targeted evidence until the public API test lane readiness gate is satisfied.
2. Treat the optional `test:public-api` package-script implementation as human-reviewed because it changes `package.json`.
3. Add remaining low-risk public read no-leak tests only when mocks and route boundaries are clear.
4. Add public route/page smoke evidence for sports-first browsing using `docs/reviews/PUBLIC_ROUTE_SMOKE_EVIDENCE_STATUS.md` and the evidence template.
5. Complete market detail cleanup and reference-liquidity split plans before implementation.
6. Keep PR #25 split or human-reviewed before any merge decision.
7. Complete admin auth implementation scope before adding admin auth tests.
8. Complete bot dry-run implementation scope before adding bot behavior tests; keep future bot tests human-reviewed by default.
9. Keep wallet, ledger, deposit, withdrawal, matching, settlement, custody, and production deployment evidence human-reviewed.

## Non-Goals

This tracker does not:

- Implement tests or product features.
- Modify API contracts.
- Change UI.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, bot, Prisma, migration, deployment, or production behavior.
- Authorize public beta.

## Validation For This Tracker

This tracker is docs-only. Validation for this PR should be:

```bash
git diff --check
```
