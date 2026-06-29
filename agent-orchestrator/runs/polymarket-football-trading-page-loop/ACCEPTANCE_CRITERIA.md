# Polymarket Football Trading Page Acceptance Criteria

The loop is complete only when all criteria pass:

1. Brazil vs Japan is imported or safely importable.
2. `moneyline_3-way` maps to `match_winner_1x2`.
3. User-facing page shows Brazil / Draw / Japan.
4. Each visible outcome has valid Polymarket mapping.
5. Prices are real/reference-derived.
6. No fake 50.
7. No unexplained `-- / --`.
8. No user-facing unmapped markets.
9. Local-only bot liquidity exists for Brazil/Draw/Japan or a clearly equivalent internal book.
10. User can click an outcome and open/update trade ticket.
11. User can submit a tiny internal test trade from the event flow.
12. Balance updates.
13. Position/P&L updates.
14. Admin can see order/trade/bot activity.
15. Probability chart exists.
16. Chart uses real stored price/history data.
17. User page is clean, not diagnostics-first.
18. Admin page has diagnostics.
19. Stale/empty/unmapped events hidden from user browsing.
20. Build passes.
21. Relevant tests pass.
22. Browser/Playwright visual verification exists.
23. Reviewer verdict is MERGE READY.
24. Auditor verdict is MERGE READY.
25. Server deployment prompt exists.
26. Safety rules remain intact.
