# WC-DISC-OPS-008 End-To-End DB Candidate Queue Harness

Objective: Create or update an E2E harness for fixture candidate to persisted candidate to admin mark import-ready to draft import to mapping validation to promotion eligible to rollback dry-run.

Harness:

`agent-orchestrator/harnesses/world_cup_discovery_candidate_queue_e2e_check.sh`

Requirements:

- Deterministic fixture mode.
- Local/test DB only.
- No production DB.
- No real-money.
- No external orders.
- Verifies public no-leak.
- Verifies rollback dry-run.

