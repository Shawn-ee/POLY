# World Cup Polymarket Continuous Loop Cycle Template

## Cycle N

### 1. Sync / Branch State

- branch:
- commit:
- PR:
- mergeability:
- dirty status:

### 2. Builder Summary

- work attempted:
- files changed:
- safety boundary:

### 3. Reviewer Audit

Reviewer must answer:

- Is this real implementation or scaffold?
- Does the UI actually change?
- Are line selectors functional?
- Are price sources real?
- Is there hardcoded/fake data?
- Does safe-basket MM produce useful local liquidity or explain why not?
- Are tests meaningful?
- Can owner test this in browser?
- Is this safe for closed beta?

Verdict: `MERGE READY` / `FIX REQUIRED` / `OWNER DECISION REQUIRED`

### 4. Auditor Audit

Auditor must compare against the product goal and classify each gap:

- `BLOCKER_BEFORE_MERGE`
- `BLOCKER_BEFORE_SERVER_DEPLOY`
- `FOLLOW_UP_AFTER_1_USER_BETA`
- `ACCEPTABLE_LIMITATION`

Verdict: `MERGE READY` / `FIX REQUIRED` / `OWNER DECISION REQUIRED`

### 5. Validation

Commands:

```sh
git diff --check
npm run build
npx jest --runInBand --detectOpenHandles <focused tests>
```

Optional:

```sh
npm run test:jest
npm run runtime:closed-beta:status
npx playwright test tests/e2e/world-cup-ui-ticket-smoke.spec.ts --project=smoke
```

### 6. Decision

- continue:
- blocked:
- ready for merge/deploy handoff:
- next cycle plan:
