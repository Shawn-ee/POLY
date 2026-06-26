# Independent Audit Agent System Refactor Report

## Summary

This refactor adds an independent audit layer to the prompt-driven POLY engineering system.

The previous system allowed the Lead Agent, Validation Agent, and internal Reviewer Agent to produce and approve completion evidence within the same workflow. The new architecture adds a separate Independent Audit Agent that audits completion claims before tranche or final goals can be accepted.

No product runtime behavior was changed.

## Files Created

- `agent-orchestrator/prompts/subagents/INDEPENDENT_AUDIT_AGENT.md`
- `agent-orchestrator/prompts/AUDIT_AGENT_OPERATING_PROMPT.md`
- `agent-orchestrator/specs/AUDIT_GATE_SPEC.md`
- `agent-orchestrator/specs/AUDIT_RESULT_CONVENTION.md`
- `agent-orchestrator/specs/AUDIT_FINDINGS_FORMAT.md`
- `agent-orchestrator/specs/AUDIT_LOOP_PROTOCOL.md`
- `agent-orchestrator/templates/AUDIT_REPORT_TEMPLATE.md`
- `agent-orchestrator/memory/AUDIT_FINDINGS.md`
- `agent-orchestrator/scripts/start_audit_agent.sh`
- `agent-orchestrator/runs/20260626T173000Z-independent-audit-agent-system/AUDIT_TARGET_FINAL_WORLD_CUP_READINESS.md`
- `agent-orchestrator/runs/20260626T173000Z-independent-audit-agent-system/REPORT.md`

## Files Updated

- `agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md`
- `agent-orchestrator/prompts/subagents/REVIEWER_AGENT.md`
- `agent-orchestrator/prompts/subagents/VALIDATION_AGENT.md`
- `agent-orchestrator/README_LOOP_ENGINEERING.md`

## New Audit Workflow

The corrected loop is:

```text
Owner goal
  -> Lead Agent plans and assigns work
  -> Subagents implement scoped changes
  -> Validation Agent produces exact evidence
  -> Reviewer Agent performs internal review
  -> Independent Audit Agent audits completion claim
  -> Lead Agent fixes audit findings
  -> Validation/review/re-audit repeat until pass or blocked
```

Lead Agent may propose completion. Independent Audit Agent decides whether that claim is acceptable.

## How Audit Agent Interacts With Lead Agent

The Lead Agent must request independent audit before tranche or final completion. The Audit Agent reads the completion report, scorecards, validation evidence, diffs, safety boundaries, and blocked risks.

Audit Agent returns one of:

- `AUDIT_PASS`
- `AUDIT_PASS_WITH_WARNINGS`
- `AUDIT_FAIL`
- `AUDIT_BLOCKED`

If the audit fails, Lead Agent must read the findings, assign fixes to subagents, rerun validation, rerun internal review, and request re-audit.

## How Audit Findings Are Tracked

Open and closed findings are tracked in:

```text
agent-orchestrator/memory/AUDIT_FINDINGS.md
```

The tracker records finding id, date, status, severity, category, source audit report, fixing PR/report, and closure evidence.

An initial info-level open item was added to prepare the Gate C audit for the latest World Cup final readiness claim. This is a target, not an audit result.

## Audit Gate Levels

Gate A: task-level audit after a task or PR.

Gate B: tranche-level audit after a group of PRs or a phase.

Gate C: final-goal audit before marking a goal complete.

Gate definitions are in:

```text
agent-orchestrator/specs/AUDIT_GATE_SPEC.md
```

## How To Start Audit

PowerShell:

```powershell
codex exec --full-auto (Get-Content agent-orchestrator/prompts/AUDIT_AGENT_OPERATING_PROMPT.md -Raw)
```

Git Bash:

```bash
codex exec --full-auto "$(cat agent-orchestrator/prompts/AUDIT_AGENT_OPERATING_PROMPT.md)"
```

Helper launcher:

```bash
bash agent-orchestrator/scripts/start_audit_agent.sh
```

With an explicit report:

```bash
bash agent-orchestrator/scripts/start_audit_agent.sh agent-orchestrator/runs/20260626T170000Z-final-world-cup-internal-beta-readiness/REPORT.md
```

The launcher is only a helper. It does not decide audit status.

## How To Re-Run Audit After Fixes

1. Lead Agent fixes audit findings.
2. Validation Agent reruns required evidence.
3. Reviewer Agent checks the fix diff and evidence.
4. Lead Agent writes a fix report.
5. Audit Agent reruns the relevant gate and updates `AUDIT_FINDINGS.md`.

## Immediate Audit Target Prepared

Created:

```text
agent-orchestrator/runs/20260626T173000Z-independent-audit-agent-system/AUDIT_TARGET_FINAL_WORLD_CUP_READINESS.md
```

The target tells Audit Agent to verify the latest claim:

- Controlled internal World Cup beta ready with warnings.
- Scorecard 95/100.
- Main app PR #264.
- Bot repo PR #3.
- Authenticated reference-liquidity dry-run blocked by missing `POLY_SIM_SESSION_COOKIE`.

This refactor does not mark that claim audited. A real audit report must be produced separately.

## What Was Not Changed

- No product runtime code was changed.
- No trading, ledger, settlement, funding, wallet, withdrawal, private-key, bot runtime, or deployment behavior was changed.
- No production service was started.
- No product loop was restarted.
- No final readiness claim was accepted by audit.

## Risks

- The audit system is prompt/spec driven. It depends on the next Codex session actually using the Audit Agent prompt and writing a real audit report.
- Existing reports may still predate the independent audit gate. They should be audited before being treated as final.
- The first audit may find gaps in validation evidence even if earlier Lead Agent reports claimed readiness.

## Next Recommended Command

Run the Independent Audit Agent against the latest final readiness report:

```powershell
codex exec --full-auto (Get-Content agent-orchestrator/prompts/AUDIT_AGENT_OPERATING_PROMPT.md -Raw)
```

Or:

```bash
bash agent-orchestrator/scripts/start_audit_agent.sh agent-orchestrator/runs/20260626T170000Z-final-world-cup-internal-beta-readiness/REPORT.md
```
