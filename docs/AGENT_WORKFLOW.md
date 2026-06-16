# Agent Workflow

Autonomous agent work follows the branch and PR rules in `docs/AGENT_BRANCH_WORKFLOW.md`.

## Required Defaults

- Start from a GitHub Issue or create one for new work.
- Use scoped `agent/<short-task-name>` branches for fixes and features.
- Use scoped `audit/<short-task-name>` branches for verification-only work.
- Target `dev` for integration branches unless the task explicitly targets `main`.
- Do not push directly to `main`.
- Do not deploy production unless explicitly approved.
- Do not modify wallet, deposit, withdrawal, payment, custody, trading ledger, settlement, or admin permission code unless explicitly approved.

## Documentation Requirements

Every branch must update or create a relevant report under `docs/agent-reports/`.

Use:

- `docs/agent-proposals/` for new ideas that are not approved roadmap changes.
- `docs/decisions/` for architecture or workflow decisions.
- `docs/CURRENT_STATE.md` for current product status.
- `docs/TESTING.md` for validation commands and known test gaps.

## Verification Branches

Audit branches should document:

- what was inspected
- what passed
- what failed
- what remains unverified
- blocking issues
- recommended follow-up branches

Audit branches should not mix product fixes with verification documentation.
