# W4: Pre-dispatch check

**Wave:** 1
**Priority:** P0 (demo step at 0:45)
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Build the phone-first screen that answers "Can the crew roll now?" (guide 5.4).
It moves the "missing part" discovery to before the truck leaves.

## Read first

1. `docs/roadmap/README.md`, sections 3 (D3, D8), 6, 7 and 8.
2. Product guide 5.4, 6 (stories 1 and 2), 7, 8, 9, 12 (0:45 step).
3. Findings 1.3 (34.1 h vs 15.4 h).

## You own

- `src/features/dispatch/**`

## You call (do not edit)

`useData`, `useCurrentUser`, `can`, `logActivity`, `likelyPartFor`, `stockAt`, `stockElsewhere`, `createRushReorder`, `createTransfer`, the UI kit.

## Build

1. **Flow**: pick the asset (search by name or id; a "scan tag" button can be a stub), pick the symptom or cause, see the likely part.
2. **One large banner**:
   - Green, "Ready to dispatch. Part on hand at <site>."
   - Amber, "Part at another site. Transfer from <site>, estimated arrival <time>." Starts a transfer request, and dispatch runs in parallel.
   - Red, "Part not available." Creates a rush reorder for the planner automatically, and says "Dispatch only for diagnosis."
3. **Safety line, always shown, never changes**: "Confirm LOTO and isolation before work begins."
4. Logs `dispatch.checked` with the result; allowed for technician, planner and site lead (`RUN_DISPATCH_CHECK`).
5. Readable at a glance at 375 px: big touch targets, high contrast, no horizontal scroll.
6. **Widget** (`widgets.jsx`): `DispatchLauncher`, a big "Run pre-dispatch check" button.

## Acceptance criteria

- A010 with sample stock on hand shows Green; a Mesa asset with stock only at Prairie shows Amber (story 2); a part with no stock anywhere shows Red and creates exactly one rush reorder.
- The LOTO line shows on all three results.
- The ops manager and HSE supervisor cannot run the check.
- Sample stock is labeled as sample values.

## Verify in the app

Run story 1 step 4 and story 2 as the technician at 375 px.
Screenshots of all three banners.

## Out of scope

Real inventory or tag scanning.
