# Audit Loop Protocol

The audit loop makes completion claims gated by an independent audit.

## Lead Agent Cycle

1. Implement or fix a scoped task.
2. Ask Validation Agent to select and run required evidence.
3. Ask Reviewer Agent to perform internal diff and safety review.
4. Write a completion report with exact evidence.
5. Request independent audit at the correct gate level.

## Audit Agent Cycle

1. Read the completion report.
2. Read active goal, scorecard, run reports, PRs/commits, and relevant evidence.
3. Inspect actual files and diffs when available.
4. Rerun lightweight safe commands when useful.
5. Write audit report using `AUDIT_RESULT_CONVENTION.md`.
6. If audit fails or blocks, write findings using `AUDIT_FINDINGS_FORMAT.md`.

## Lead Agent Response

1. Read audit findings.
2. Assign exact fixes to the correct subagents.
3. Rerun Validation Agent evidence.
4. Ask Reviewer Agent to review the fix diff.
5. Write a fix report.
6. Request re-audit.

## Re-Audit

1. Audit Agent verifies each open finding.
2. Mark findings fixed, accepted warning, or still open.
3. Only allow completion when the relevant audit gate is `AUDIT_PASS` or `AUDIT_PASS_WITH_WARNINGS`.

## Completion Rules

- Lead Agent cannot mark a final goal complete unless final audit is `AUDIT_PASS` or `AUDIT_PASS_WITH_WARNINGS`.
- Any critical finding means `AUDIT_FAIL` unless the correct status is `AUDIT_BLOCKED`.
- Any unresolved real-money, wallet, private-key, destructive migration, or live-fund issue means `AUDIT_FAIL` or `AUDIT_BLOCKED`.
- Warnings are allowed only if documented and safe for controlled internal beta.
- Audit must not create generic `FIX-FIX` tasks.
- Audit findings must be specific and actionable.

## Retry Limits

- Retry a finding at most three times for the same root cause.
- If the same finding remains after three attempts, mark it `blocked` or `failed` with root cause and move to the next useful safe work.

## Storage

- Audit reports belong under `agent-orchestrator/runs/<timestamp>-<audit-name>/`.
- Open and closed findings are tracked in `agent-orchestrator/memory/AUDIT_FINDINGS.md`.
- Lead Agent reports should link the audit report that allowed completion.
