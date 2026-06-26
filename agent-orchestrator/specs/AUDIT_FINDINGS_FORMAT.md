# Audit Findings Format

Independent audit findings must be specific, actionable, and tied to evidence.

## Required Finding Fields

- `finding id`
- `severity`
- `category`
- `evidence`
- `why it matters`
- `required fix`
- `suggested subagent`
- `validation required after fix`
- `blocks completion`: `yes` or `no`

## Severity Values

- `critical`: safety boundary, secret leak, real-money/live-fund risk, destructive action, or completion claim invalidated.
- `high`: major missing evidence or unverified runtime readiness claim.
- `medium`: incomplete coverage, stale report, or warning that must be fixed before higher readiness.
- `low`: minor documentation or evidence clarity issue.
- `info`: non-blocking observation.

## Categories

- `missing evidence`
- `insufficient harness coverage`
- `failed test`
- `stale report`
- `scorecard inconsistency`
- `docs-only claim`
- `unsafe config`
- `secret/env hygiene`
- `real-money safety`
- `route security`
- `bot safety`
- `trading logic`
- `settlement logic`
- `combo logic`
- `cash-out logic`
- `deployment/ops`
- `unclear blocker`
- `duplicate/recursive task behavior`
- `unknown`

## Markdown Format

```markdown
### <finding id>: <short title>

- Severity:
- Category:
- Evidence:
- Why it matters:
- Required fix:
- Suggested subagent:
- Validation required after fix:
- Blocks completion:
```

## Anti-Recursion Rule

Do not create generic findings such as "fix failed validation" or "FIX-FIX readiness." Identify the concrete root cause, missing evidence, unsafe change, or contradiction.
