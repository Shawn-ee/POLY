#!/usr/bin/env bash
set -euo pipefail

MAX_CYCLES=20
while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-cycles)
      MAX_CYCLES="${2:-20}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

ROOT="agent-orchestrator/runs/polymarket-football-trading-page-loop"
mkdir -p "$ROOT"

for i in $(seq 1 "$MAX_CYCLES"); do
  cycle=$(printf "cycle-%03d" "$i")
  dir="$ROOT/$cycle"
  mkdir -p "$dir"
  for report in BUILDER_REPORT REVIEW_REPORT AUDIT_REPORT UI_VERIFICATION_REPORT VALIDATION_REPORT NEXT_ACTIONS; do
    file="$dir/${report}.md"
    if [[ ! -f "$file" ]]; then
      printf "# %s - %s\n\nStatus: PENDING\n" "$cycle" "$report" > "$file"
    fi
  done
done

echo "Prepared $MAX_CYCLES loop cycle folders under $ROOT"
