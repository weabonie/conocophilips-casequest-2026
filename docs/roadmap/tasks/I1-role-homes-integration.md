# I1: Role homes and integration

**Wave:** 2, serial after G1
**Priority:** P1
**Suggested agent:** `frontend-builder`
**Depends on:** G1

## Goal

Compose the completed feature widgets into useful, role-specific home screens and resolve the cross-feature requests collected at G1.
This is integration work, not a chance to redesign domain contracts.

## Read first

1. `docs/roadmap/README.md`, especially sections 4, 6 through 10.
2. Product guide sections 2, 4, 6, 7, 8, 9 and 11.
3. Every G1 handoff note and its "Requests for other owners" section.
4. All feature `widgets.jsx` exports and `src/app/routes.js`.

## You own

- `src/features/home/**`
- `src/app/**`
- `src/ui/**`
- Any `widgets.jsx` needed to make the agreed G1 integration changes

## Build

1. Create home layouts that lead each role to their next safe action: technician to Pre-dispatch and active warnings; planner to warnings, reorder queue, and stock exceptions; HSE supervisor to blockers; site lead to site status and releases; ops manager to KPIs, HSE status, and simulator.
2. Compose existing widgets only. Do not reimplement feature calculations.
3. Apply site scope consistently to every widget and link.
4. Add concise empty, loading, denied, and no-action-needed states.
5. Resolve only G1 handoff requests that preserve frozen contracts. Put anything else in the I1 handoff note for a later task.

## Acceptance criteria

- Each of the five demo roles sees a different useful home with only authorized actions.
- Every widget link routes correctly and retains appropriate site context where possible.
- Site-scoped HSE supervisors and site leads cannot discover other sites through home-screen data or links.
- Home screens work at 1440 px and 375 px without horizontal scrolling.

## Verify in the app

Sign in as all five roles, exercise every widget link, and save one desktop and one mobile screenshot per role.

## Out of scope

New feature behavior, data-contract changes, or cleanup unrelated to G1 handoff requests.
