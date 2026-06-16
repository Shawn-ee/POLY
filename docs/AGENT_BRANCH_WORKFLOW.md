# Autonomous Agent Branch Workflow

This workflow governs autonomous agent work in this repository. The default path is issue first, branch scoped, locally validated, pushed to a feature branch, reviewed through a pull request, and merged into `main` only after validation passes.

## Issue-First Workflow

Every autonomous task should start from a GitHub Issue or create one before code or documentation changes begin.

The issue should define:

- the requested outcome
- the allowed scope
- any restricted areas
- validation requirements
- expected branch name when known
- whether deployment is allowed

If the work uncovers new follow-up tasks, create or propose additional issues instead of expanding the active branch beyond its issue scope.

## Branch Naming

Use one isolated branch per task:

```sh
agent/<short-task-name>
```

Branch names should be short, lowercase, and descriptive. Examples:

```text
agent/agent-branch-workflow
agent/playwright-dev-admin-login
agent/sports-event-market-model
```

Before making changes, confirm the working tree is clean and create the branch from the intended base:

```sh
git status --short
git fetch origin
git switch -c agent/<short-task-name> origin/main
```

Do not work directly on `main`.

## Local Validation

Run validation before committing. Use the smallest set that proves the changed scope, plus required repository checks.

Default validation:

```sh
npx tsc --noEmit --pretty false --incremental false
```

Run `npm install` only when dependencies changed or `node_modules` is missing.

Run Prisma validation and generation only when Prisma schema or migration files changed:

```sh
npm exec prisma validate
npm exec prisma generate
```

Run relevant Jest tests for changed behavior:

```sh
npm test -- <focused-test-pattern>
```

Run relevant Playwright tests when UI, auth, trading, or admin behavior changed:

```sh
npx playwright test <focused-test-pattern>
```

Run focused ESLint on changed source files when lint tooling is available:

```sh
npx eslint <changed-files>
```

For documentation-only changes, run focused markdown lint when available. If the repository has no markdown lint tool installed, record that it was skipped.

Always run a changed-file secret scan before committing. At minimum, inspect changed files for common secret material such as API keys, tokens, private keys, mnemonics, passwords, cookies, `.env` contents, Playwright storage state, database files, screenshots, and reports.

## Push Feature Branch

Commit only intentional files:

```sh
git status --short
git diff --stat
git add <files>
git commit -m "<type>: <summary>"
```

Push only the current feature branch:

```sh
git push -u origin agent/<short-task-name>
```

Do not push directly to `main`.

## Pull Request To Main

Open a pull request targeting `main`:

```sh
gh pr create --base main --head agent/<short-task-name> --title "<title>" --body "<body>"
```

The PR body should summarize:

- linked issue
- changed scope
- validation performed
- skipped checks and why
- risks
- deployment notes, if deployment is explicitly allowed

Link the PR to its issue with `Closes #<number>` in the PR body. Example:

```text
Closes #8
```

## Auto-Merge Rules

Auto-merge may be enabled only after validation passes.

Before enabling or performing a merge, confirm:

- local validation passed
- required GitHub checks passed
- the PR targets `main`
- the branch scope matches the issue
- no secrets or forbidden artifacts are included
- restricted areas were not touched without explicit approval

Do not merge a PR with failing, skipped-required, missing, or uncertain validation.

## No Direct Push To Main

`main` must only be updated by merging a validated PR.

Never:

- commit directly on `main`
- push directly to `main`
- force push `main`
- bypass a failing PR check
- merge by hand to avoid review or validation

After a successful merge, sync local `main`:

```sh
git switch main
git pull origin main
```

If `main` is checked out in another worktree, sync it there instead of disrupting active branches.

## Restricted Areas

The following areas require explicit approval before any edits:

- wallet code
- withdrawal code
- deposit code
- payment code
- custody code
- trading ledger code
- orderbook settlement code
- admin permission code
- production deployment configuration
- production secrets or environment handling

When a task explicitly authorizes changes in one of these areas, perform an extra security review before merge. Confirm production guards, authentication checks, authorization checks, balance checks, and secret handling remain intact.

If security validation is uncertain, do not merge.

## Validation Failures

If validation fails:

1. Do not merge.
2. Record the failed command and relevant output.
3. Fix the issue within the branch scope when possible.
4. Rerun the failing validation and any related checks.
5. If the failure cannot be fixed safely in scope, stop and summarize the blocker.

Do not hide, ignore, or bypass failed checks.

## Missing GitHub CLI

Check GitHub CLI availability when the workflow asks for it:

```sh
gh auth status
```

If `gh` is missing or unauthenticated:

- use the GitHub connector when available
- otherwise push the branch and provide the exact PR creation command or URL
- do not merge manually without PR validation

Manual PR URL format:

```text
https://github.com/<owner>/<repo>/compare/main...agent/<short-task-name>?expand=1
```

## Final Report Format

Every completed task should end with a concise report containing:

- branch name
- commit hash
- PR URL
- validation summary
- merge result
- final `main` commit hash, if merged
- known risks
- anything blocked

If no commit, PR, or merge was created, report `N/A` for that field and explain why.
