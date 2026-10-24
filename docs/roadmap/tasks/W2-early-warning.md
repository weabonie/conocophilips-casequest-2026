# W2: Early warning and parts staging

**Wave:** 1
**Priority:** P0 (demo step at 0:15)
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Build the screen that answers "Which mechanical failures are likely in the next few days, and do we have the part?" (guide 5.2).
The demo moment is the replay: the A010 warning fires about two days before a real 2025 bearing failure, with the part not on hand, and the planner stages it.

## Read first

1. `docs/roadmap/README.md`, sections 3 (D2, D3), 6, 7 and 8.
2. Product guide 5.2, 6 (story 1), 8, 9, 10 (prototype replays 2025 readings), 12 (0:15 step).
3. Findings 1.6 and 1.7.
4. `src/domain/earlyWarning.js` and `data.earlyWarning` from F1.

## You own

- `src/features/early-warning/**`
- `src/domain/warnings.js` and `src/domain/warnings.test.js` (new)

## You call (do not edit)

`useData`, `useCurrentUser`, `can`, `assertCan`, `logActivity`, `createPersistentStore`, `activeWarnings`, `likelyIssueFor`, `useAsOf`, `setReplayDate`, `likelyPartFor`, `stockAt`, `stockElsewhere`, `createRushReorder`, `createTransfer`, the UI kit (`ConfidenceBadge`, `ReasonDialog`, `Sourced`, `SampleDataTag`, `StatusBadge`).

## Build

1. **Warning state** (`warnings.js`): per alert `{ status: 'new' | 'acknowledged' | 'staged' | 'falseAlarm', by, at, reason, requestId }`.
   - `acknowledge(user, alertId)`, `flagFalseAlarm(user, alertId, reason)` (reason required), `stagePart(user, alert)` which calls `createRushReorder` with `source: 'early-warning'` and the alert id, or `createTransfer` when another site has stock and the user picks it.
   - Warnings are never silently dismissed: a false alarm stays visible in a "Reviewed" list.
   - Each write calls `assertCan` and logs its event; a new warning inside the window logs `warning.raised` once.
2. **Replay control.**
   A date scrubber and play button over 2025 that call `setReplayDate`; presets for the demo, starting with "A010 bearing, two days before the stop".
   A clear banner says "Replaying 2025 readings" whenever replay is on.
3. **Warning cards**, one per asset at risk: asset and site names, "Likely bearing issue" or "Likely seal issue", the trigger reading against normal (for example "Temperature 11 °C above normal"), how long ago, a small inline SVG chart of the last 14 days against the normal line and the threshold line.
   Part status: "Bearing kit on hand (2)" in green, or "Bearing kit not on hand" in red with **Stage part**, plus "Available at Mesa (1)" when `stockElsewhere` finds some.
   Data confidence badge from `data.dataQuality.bySite` (for Arroyo: "12% of readings missing, some arrive about 30 h late. A warning may be delayed.").
   Sample stock levels are tagged with `SampleDataTag`.
4. **Evidence strip**: "In 2025 this pattern preceded all 172 bearing and seal failures, about 2 days ahead, with no false alarms", each figure wrapped in `Sourced`, plus the honest line that it does not cover electrical trips, process upsets or unknown causes.
5. **Widget** (`widgets.jsx`): `EarlyWarningSummary`, active warnings count and how many lack the part.

## Acceptance criteria

- With replay set to two days before A010's first 2025 bearing failure, an A010 card shows "Likely bearing issue", the trigger, and "not on hand" against the Arroyo sample stock.
- Stage part as the planner creates a rush reorder that W3's queue will show at the top with a Warning tag (verify through `usePartsRequests`), and the card moves to "Part staged".
- Acknowledge and False alarm are planner-only; False alarm without a reason is impossible; technician and ops manager see read-only cards.
- Copy never says "will fail" or presents a warning as certain.
- The confidence badge appears on Arroyo cards and not on Juniper cards.
- Tests cover the state machine and the refusals.

## Verify in the app

Replay story 1 steps 1 and 2 as the planner, then view the screen as the technician.
Screenshots at 1440 px and 375 px.

## Out of scope

The reorder queue screen (W3).
Changing the detection rule (F1, decision D2).
Notifications (W7 derives them from your activity events).
