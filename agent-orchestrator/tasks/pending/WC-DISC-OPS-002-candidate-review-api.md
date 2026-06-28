# WC-DISC-OPS-002 Candidate Review API

Objective: Add admin-only API to list, inspect, approve, ignore, reject, or mark candidates as import-ready.

Requirements:

- Admin-only.
- Public users cannot access.
- No private secrets in response.
- Supports filtering by status/source/batchId.
- Supports status transitions with reason.
- Adds tests.

