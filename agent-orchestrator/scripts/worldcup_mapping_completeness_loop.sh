#!/usr/bin/env bash
set -euo pipefail

MAX_CYCLES=20
START_CYCLE=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-cycles)
      MAX_CYCLES="$2"
      shift 2
      ;;
    --start-cycle)
      START_CYCLE="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT_DIR/agent-orchestrator/runs/worldcup-mapping-completeness-loop"

cd "$ROOT_DIR"
mkdir -p "$RUN_DIR"

for ((cycle=START_CYCLE; cycle<=MAX_CYCLES; cycle++)); do
  cycle_id="$(printf "%03d" "$cycle")"
  cycle_dir="$RUN_DIR/cycle-$cycle_id"
  mkdir -p "$cycle_dir"

  for report in BUILDER_REPORT REVIEW_REPORT AUDIT_REPORT VALIDATION_REPORT NEXT_ACTIONS; do
    file="$cycle_dir/${report}.md"
    if [[ ! -f "$file" ]]; then
      {
        echo "# Cycle $cycle_id ${report//_/ }"
        echo
        echo "Status: PENDING"
      } > "$file"
    fi
  done

  echo "prepared $cycle_dir"
done
