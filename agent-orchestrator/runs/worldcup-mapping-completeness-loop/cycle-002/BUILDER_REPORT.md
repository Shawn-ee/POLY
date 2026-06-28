# Cycle 002 Builder Report

Status: IMPLEMENTED

## Root Cause

Reviewer/auditor found that the cycle-1 gate covered the World Cup model and listing, but generic public routes could still expose public-listed World Cup markets:

- `/api/events`
- `/api/events/[slug]`
- `/api/events/[slug]/markets`
- `/api/markets`
- `/api/sports/soccer/events`
- `/api/events/[slug]/grouped-markets`

## Fix

Added `src/server/services/worldCupPublicEligibility.ts` with shared Prisma filters requiring:

- `visibility=PUBLIC`
- `isListed=true`
- `referenceSource=polymarket`
- `referenceMetadata.importStatus=approved`
- `status in LIVE/UPCOMING`
- at least one fresh `ReferenceQuoteSnapshot`

Applied the gate to all public event/list/market routes above and filtered grouped event rows to approved/fresh Polymarket rows only.
