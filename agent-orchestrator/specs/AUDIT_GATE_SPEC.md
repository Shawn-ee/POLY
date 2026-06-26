# Audit Gate Spec

Independent audit is a required gate after Lead Agent completion claims. The Lead Agent can propose completion, but the Independent Audit Agent decides whether the claim is acceptable.

## Gate A: Task-Level Audit

Used after each task or PR.

### Required Inputs

- task assignment;
- branch, commit, and PR if present;
- git diff/stat;
- files changed;
- validation evidence;
- Reviewer Agent output;
- task result report;
- safety notes.

### Required Checks

- Changed files match assigned task scope.
- Validation commands are exact and relevant.
- Tests/harnesses cover the claimed behavior.
- Docs match runtime behavior.
- No secrets or env values were committed.
- No forbidden safety boundary was crossed.
- No generic recursive fix task was created.

### Pass Criteria

- Diff is scoped.
- Evidence proves task done.
- Internal review passed.
- Safety checks pass.
- No blocking findings remain.

### Fail Criteria

- Missing or failed validation.
- Out-of-scope runtime changes.
- Unsupported readiness claim.
- Stale or contradictory report.
- Any critical safety issue.

### Blocked Criteria

- Required evidence depends on missing credential, unavailable service, owner decision, destructive action, or forbidden real-money/live-fund step.

### Output Format

Use `agent-orchestrator/specs/AUDIT_RESULT_CONVENTION.md`.

## Gate B: Tranche-Level Audit

Used after a group of PRs or a phase.

### Required Inputs

- tranche goal;
- list of PRs/commits included;
- cumulative report;
- scorecard before/after;
- validation summaries;
- unresolved warnings and blockers;
- task-level audit reports if available.

### Required Checks

- Score movement is supported by evidence.
- Each PR maps to the tranche goal.
- Cumulative reports do not hide unresolved task failures.
- Validation coverage matches tranche risk.
- Warnings are documented and safe.
- Safety boundaries remain intact.

### Pass Criteria

- Tranche objective is met.
- Scorecard movement is justified.
- Required evidence is sufficient.
- No critical or high blocking findings remain.

### Fail Criteria

- Score increase is unsupported.
- Key runtime behavior is docs-only.
- Validation does not cover high-risk areas.
- Important warnings are omitted or minimized.

### Blocked Criteria

- Tranche cannot be verified without missing external credential, owner-only action, or forbidden step.

### Output Format

Use `agent-orchestrator/specs/AUDIT_RESULT_CONVENTION.md`.

## Gate C: Final-Goal Audit

Used before a goal is marked complete.

### Required Inputs

- final owner goal and Definition of Done;
- latest scorecard;
- final readiness report;
- go/no-go checklist;
- run reports;
- validation evidence;
- PR/commit list;
- bot repo evidence if bots are in scope;
- route/security no-leak evidence;
- environment and rollback docs;
- blocked areas and warnings.

### Required Checks

- Every Definition of Done item is verified, partially verified, not verified, or blocked.
- Final score is supported by evidence.
- Runtime readiness claims have runtime evidence.
- Required validations ran or blockers are documented.
- Public beta and real-money boundaries remain blocked.
- No secrets, env files, private keys, real external funds, destructive migrations, or production live bots were enabled.
- Remaining warnings are compatible with controlled internal beta.

### Pass Criteria

- Definition of Done is met.
- Safety boundaries pass.
- Evidence supports final readiness.
- No critical or high findings remain.

### Fail Criteria

- Final score or readiness label is unsupported.
- Required evidence is missing.
- Docs-only evidence is used to claim runtime readiness.
- Safety or route/no-leak issues remain unresolved.

### Blocked Criteria

- Final goal depends on a missing credential, owner-only admin session, external provider access, legal/compliance decision, destructive migration, or forbidden real-fund action.

### Output Format

Use `agent-orchestrator/specs/AUDIT_RESULT_CONVENTION.md`.
