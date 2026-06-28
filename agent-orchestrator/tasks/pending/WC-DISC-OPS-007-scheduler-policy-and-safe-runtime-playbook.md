# WC-DISC-OPS-007 Scheduler Policy And Safe Runtime Playbook

Objective: Document and/or implement safe scheduler commands for server internal beta.

Requirements:

- Define recommended frequencies:
  - discovery every 5-15 minutes
  - import only manual/admin gated
  - validation after import
  - promotion only after validation
  - reference sync every 5-15 seconds for active markets
  - MM dry-run/live-local every 5-30 seconds depending on mode
- Define env flags for each mode.
- Define pause commands.
- Define rollback commands.
- Define service names if systemd is used.
- No production deployment yet.

