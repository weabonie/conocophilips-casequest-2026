# W1: HSE gate

**Wave:** 1
**Priority:** P0 (demo step at 1:00)
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Build the screen that answers "Which sites are locked, and what will unlock them?" (guide 5.5).
Safety is never automated: only the site HSE supervisor can verify an action and release a site.
This is the screen that proves the product's safety principle on stage.

## Read first

1. `docs/roadmap/README.md`, sections 3 (D6), 6, 7 and 8.
2. Product guide 3 (principle 3), 5.5, 6 (story 3), 7, 9, 12 (the 1:00 step).
3. Findings 1.8 (HSE status) and 3.5.
4. `src/domain/hseGate.js` as F2 left it.

## You own

- `src/features/hse-gate/**`
- `src/domain/hseGate.js` and `src/domain/hseGate.test.js`

## You call (do not edit)

`useData`, `useCurrentUser`, `can`, `assertCan`, `logActivity`, `subscribeActivity`, `createPersistentStore`, `useAsOf`, the UI kit (`StatusBadge`, `ConfirmByNameDialog`, `ReasonDialog`, `Sourced`, `PermissionNote`, `Banner`).

## Build

1. **Write side of `hseGate.js`** (keep the read-side signatures from README 7.3):
   - `verifyAction(user, actionId, { note, evidence })` where evidence is a list of `{ name, type, dataUrl }` (photo or document, kept in the store, max 2 MB each).
   - `unverifyAction(user, actionId, reason)` so a mistaken verification can be undone, logged.
   - `releaseSite(user, siteId, { confirmName })`: allowed only when every blocking action is verified and `confirmName` matches the user's name, case-insensitive.
   - `relockSite(user, siteId, reason)`: supervisor only, any time.
   - Live trigger: subscribe to `reorder.received`; the first receipt at a `ready` or `clear` site moves it to `live` and logs `site.live` with the system as actor and the receipt as the reason.
   - Every write calls `assertCan` and logs the matching activity event.
2. **Screen** (`index.jsx`):
   - One row per site, worst first, with a large status (LOCKED, Clear, Ready, Live).
   - For a locked site, its severity-5 actions: hazard, asset, owner, due date, days overdue, setup cost, person-hours, each wrapped in `Sourced` pointing at the HSE record.
   - A separate list "Tracked, does not block go-live" for the other open actions (containment at Cedar and Canyon, and the non-severity-5 actions at the locked sites).
   - Action detail: Verified closed with a required note and an evidence upload, then a visible "Verified by <name>, <time>" stamp.
   - Release site appears only for the HSE supervisor of that site, only when all blockers are verified, and opens `ConfirmByNameDialog`.
   - Other roles see the same screen read-only with a `PermissionNote` ("Only the site HSE supervisor can release this site").
   - A fixed safety line: "Parts readiness never replaces LOTO and isolation steps."
3. **Widget** (`widgets.jsx`): `HseGateSummary`, a compact count of locked, ready and live sites with a link to `#/hse`.

## Acceptance criteria

- At first load Mesa, Arroyo and Prairie show LOCKED with two severity-5 actions each (A004, A010, A016), and Cedar, Canyon and Juniper show Clear.
- Days overdue match the findings (540 to 600 days at 2026-10-01).
- Story 3 works end to end as the Arroyo HSE supervisor: verify both A010 actions with a note and a photo, release by typing your name, Arroyo shows Ready, the activity log shows three entries with name and time.
- Marking a parts request at Arroyo as received (through `markReceived`) flips Arroyo to Live.
- The planner, the ops manager and the site lead cannot see Verify or Release, and calling `releaseSite` as them throws.
- The Mesa supervisor scope check: a supervisor scoped only to Arroyo cannot release Mesa.
- Re-lock returns the site to LOCKED with the reason in the log.
- Tests cover every state transition, including the refusals.

## Verify in the app

Walk story 3 as the HSE supervisor, then check the same screen as the planner.
Screenshots of LOCKED, verifying, the confirm dialog and Ready, at 1440 px and 375 px.

## Out of scope

Linking to a real HSE system.
Changing which HSE rows exist (F1 owns the data).
