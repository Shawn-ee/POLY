# WC-DISC-OPS-004 Draft Import From Candidate Queue

Objective: Update draft import so it can import approved/import-ready DB candidates, not only report/fixture candidates.

Requirements:

- Candidate status moves to imported_draft.
- Store imported Event/Market/Outcome IDs.
- Avoid duplicates.
- Keep imported market hidden/disabled/unlisted.
- Add tests.

