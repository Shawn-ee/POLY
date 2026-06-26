# Audit Result Convention

Every Independent Audit Agent report must include the fields below.

## Required Fields

- `audit id`
- `audited goal/task/tranche`
- `audited commit/branch/PR`
- `audit gate level`: `task`, `tranche`, or `final`
- `audit status`:
  - `AUDIT_PASS`
  - `AUDIT_PASS_WITH_WARNINGS`
  - `AUDIT_FAIL`
  - `AUDIT_BLOCKED`
- `evidence inspected`
- `commands rerun or reviewed`
- `claims verified`
- `claims not verified`
- `safety checks`
- `secret/env checks`
- `scorecard check`
- `blocked items`
- `findings`
- `required fixes`
- `next instruction to Lead Agent`

## Claim Verification Labels

Use these labels when reviewing claims:

- `verified`
- `partially_verified`
- `not_verified`
- `contradicted`
- `blocked`

## Status Rules

`AUDIT_PASS` means completion is acceptable with no material warnings.

`AUDIT_PASS_WITH_WARNINGS` means completion is acceptable for the stated mode, but warnings must remain visible in reports and scorecards.

`AUDIT_FAIL` means Lead Agent must fix findings and request re-audit before claiming completion.

`AUDIT_BLOCKED` means audit cannot be completed or completion cannot be accepted because a required dependency, credential, owner action, or forbidden step is blocking verification.

## Finding Severity

Every finding must use one severity:

- `critical`
- `high`
- `medium`
- `low`
- `info`

Any critical finding forces `AUDIT_FAIL` or `AUDIT_BLOCKED`.

## Minimal Markdown Structure

```markdown
# Audit Report: <audit id>

## Summary
- Audited item:
- Gate level:
- Audit status:
- Audited commit/branch/PR:
- Date:

## Evidence Inspected

## Commands Rerun Or Reviewed

## Claims Verified

## Claims Not Verified

## Safety Checks

## Secret / Env Checks

## Scorecard Check

## Blocked Items

## Findings

## Required Fixes

## Next Instruction To Lead Agent
```
