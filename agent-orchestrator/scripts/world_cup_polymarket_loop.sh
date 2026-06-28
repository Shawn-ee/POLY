#!/usr/bin/env bash
set -euo pipefail

MAX_CYCLES="${MAX_CYCLES:-20}"
START_CYCLE="${START_CYCLE:-1}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/agent-orchestrator/runs/world-cup-polymarket-continuous-loop"
BRANCH="agent/world-cup-polymarket-structure-refactor"

cd "$ROOT_DIR"

mkdir -p "$RUN_DIR"

echo "World Cup Polymarket continuous loop"
echo "branch=$BRANCH"
echo "max_cycles=$MAX_CYCLES"
echo "start_cycle=$START_CYCLE"

for ((cycle=START_CYCLE; cycle<=MAX_CYCLES; cycle++)); do
  cycle_dir="$RUN_DIR/cycle-$cycle"
  mkdir -p "$cycle_dir"

  {
    echo "# Cycle $cycle Review Prompt"
    echo
    echo "Inspect PR #267 and current branch. Produce REVIEW_REPORT.md."
    echo "Be skeptical. Do not accept PR existence or passing build as completion."
  } > "$cycle_dir/BUILDER_REVIEW_PROMPT.md"

  {
    echo "# Cycle $cycle Audit Prompt"
    echo
    echo "Compare implementation to ACCEPTANCE_CRITERIA.md. Produce AUDIT_REPORT.md."
    echo "Classify each gap as BLOCKER_BEFORE_MERGE, BLOCKER_BEFORE_SERVER_DEPLOY, FOLLOW_UP_AFTER_1_USER_BETA, or ACCEPTABLE_LIMITATION."
  } > "$cycle_dir/AUDITOR_PROMPT.md"

  {
    echo "# Cycle $cycle Validation Plan"
    echo
    echo "Required safe commands:"
    echo
    echo '```sh'
    echo "git diff --check"
    echo "npx jest --runInBand --detectOpenHandles src/__tests__/world-cup-event-page-model.test.ts src/__tests__/world-cup-market-structure.test.ts src/__tests__/polymarket-mm-safe-basket.test.ts src/__tests__/admin-runtime-safety.test.ts"
    echo "npx tsc --noEmit --pretty false --incremental false"
    echo "npm run build"
    echo '```'
  } > "$cycle_dir/VALIDATION_PLAN.md"

  echo "- prepared cycle $cycle prompts and validation plan"
done

cat <<'MSG'
Loop scaffolding complete.
Run each cycle with Codex/agent execution:
1. read LOOP_STATE.md and ACCEPTANCE_CRITERIA.md
2. write cycle-N REVIEW_REPORT.md
3. write cycle-N AUDIT_REPORT.md
4. implement fixes
5. write cycle-N VALIDATION_REPORT.md
6. update LOOP_STATE.md
Stop only at MERGE READY, OWNER DECISION REQUIRED, critical safety issue, or max cycles.
MSG
