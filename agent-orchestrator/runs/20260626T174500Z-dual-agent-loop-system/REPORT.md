# Dual-Agent Loop System Refactor Report

## Summary

This refactor adds a one-terminal, prompt-driven dual-agent loop for POLY.

The loop runs inside one Codex session, but preserves two separate roles:

- Lead Agent: implementation, validation coordination, internal review, reports, fixes.
- Independent Audit Agent: skeptical audit, findings, and final pass/fail decision.

No product runtime work was performed.

## Files Created

- `agent-orchestrator/prompts/DUAL_AGENT_LOOP_OPERATING_PROMPT.md`
- `agent-orchestrator/scripts/start_dual_agent_loop.sh`
- `agent-orchestrator/runs/20260626T174500Z-dual-agent-loop-system/REPORT.md`

## Files Updated

- `agent-orchestrator/README_LOOP_ENGINEERING.md`

## How The Loop Works

The dual-agent entry point is:

```text
agent-orchestrator/prompts/DUAL_AGENT_LOOP_OPERATING_PROMPT.md
```

It defines a Meta-Orchestrator that enforces this loop:

```text
Owner goal
  -> Lead Agent reads goal, scorecard, memory, reports, findings
  -> Lead Agent chooses highest-value safe task
  -> Lead Agent assigns subagents and implements work
  -> Validation evidence is produced
  -> Reviewer Agent performs internal review
  -> Lead Agent writes completion or fix report
  -> Independent Audit Agent audits evidence
  -> Audit findings return to Lead Agent if needed
  -> Revalidation and re-audit repeat
  -> Final report is written only after audit pass or blocker
```

## How Lead Agent And Audit Agent Remain Separate

The prompt requires each cycle to name the active role:

- Meta-Orchestrator
- Lead Agent
- Independent Audit Agent

Lead Agent may edit files and implement scoped fixes.

Independent Audit Agent may inspect files, diffs, scorecards, validation logs, reports, and safety boundaries. It must not implement fixes, weaken tests, or accept Lead Agent claims without evidence.

Lead Agent cannot mark completion unless Independent Audit Agent returns:

- `AUDIT_PASS`
- `AUDIT_PASS_WITH_WARNINGS`

## How Audit Findings Return To Lead Agent

Audit findings must include:

- finding id;
- severity;
- category;
- evidence;
- why it matters;
- required fix;
- suggested subagent;
- validation required;
- blocks completion;
- status.

Findings are tracked through:

```text
agent-orchestrator/memory/AUDIT_FINDINGS.md
```

Lead Agent reads findings, assigns the fix to the correct subagent, reruns validation, writes a fix report, and requests re-audit.

## Stop Conditions

The loop stops only when:

1. Independent Audit Agent returns `AUDIT_PASS`.
2. Independent Audit Agent returns `AUDIT_PASS_WITH_WARNINGS` and warnings are safe for controlled internal beta.
3. Same critical blocker or finding repeats three consecutive rounds.
4. Required external secret, session, or credential is missing and no safe mock or documented fallback exists.
5. A blocked area would be required to continue.

The loop does not stop merely because:

- one PR merged;
- one scorecard changed;
- one subgoal completed;
- Lead Agent says done;
- tests pass without audit.

## Three-Strike Blocker Rule

If the same blocker appears three consecutive times:

- stop the loop;
- mark status `AUDIT_BLOCKED`;
- write the exact blocker;
- write what human/user must provide;
- do not generate recursive fixes.

## How To Start The Loop

PowerShell:

```powershell
codex exec --full-auto (Get-Content agent-orchestrator/prompts/DUAL_AGENT_LOOP_OPERATING_PROMPT.md -Raw)
```

Git Bash:

```bash
codex exec --full-auto "$(cat agent-orchestrator/prompts/DUAL_AGENT_LOOP_OPERATING_PROMPT.md)"
```

Helper launcher:

```bash
bash agent-orchestrator/scripts/start_dual_agent_loop.sh
```

With an explicit goal:

```bash
bash agent-orchestrator/scripts/start_dual_agent_loop.sh agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md
```

The helper script only starts Codex with the dual-agent prompt and logs output. It does not choose tasks, perform audit, or decide completion.

## What Was Not Changed

- No product runtime code changed.
- No product work was continued.
- No trading, ledger, settlement, funding, wallet, withdrawal, private-key, bot runtime, deployment, or external fund behavior changed.
- No readiness claim was marked complete.
- No audit was run by this refactor.

## Validation Results

- Required files exist.
- `bash -n agent-orchestrator/scripts/start_dual_agent_loop.sh` passed.
- `git diff --check` passed.
- Changed-file secret-pattern scan passed.

## Next Recommended Command

Start the dual-agent loop only when ready to resume goal execution:

```powershell
codex exec --full-auto (Get-Content agent-orchestrator/prompts/DUAL_AGENT_LOOP_OPERATING_PROMPT.md -Raw)
```
