# W3: Reorder queue

**Wave:** 1
**Priority:** P0 (demo step at 0:30)
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Build the screen that answers "What should we buy, and why?" (guide 5.3).
The AI recommends, the planner decides: nothing becomes a purchase order until a named planner approves it.

## Read first

1. `docs/roadmap/README.md`, sections 3 (D3, D8), 6, 7 and 8.
2. Product guide 3, 5.3, 6 (story 2), 7, 9, 12 (0:30 step).
3. Findings 1.3, 1.4, 1.5 and 2.3.
4. `src/utils/inventoryStorage.js`, `src/components/PartsRequestsTable.jsx`, `src/components/PartsAvailabilityModal.jsx`, `src/domain/partsRequests.js`.

## You own

- `src/features/reorders/**`
- `src/domain/partsRequests.js`, `src/domain/minMax.js` (new) and their tests
- `src/utils/inventoryStorage.js`, `src/components/PartsRequestsTable.jsx`, `src/components/PartsAvailabilityModal.jsx`

The frozen Equipment hub imports the two components: keep their props working.

## Build

1. **Ranked queue**: highest parts-wait dollars at risk first (from `assetExposure`), with rush reorders from Early warning or Pre-dispatch pinned on top with a **Warning** tag.
   Each row: site, asset, part, on hand vs min and max, recommended quantity, reason.
2. **Plain-language reason on every row**, generated deterministically from the data (no LLM needed), for example "A010 lost $727k of margin across 23 unplanned outages last year, the most of any asset. Bearing kit stock is 0, below the minimum of 2. Each hour A010 is down costs about $1,200 in margin."
   Figures wrapped in `Sourced`; stock values tagged as sample values.
3. **Decisions**: Approve, Edit quantity, Reject with a required reason, Mark received.
   Planner only (`DECIDE_REORDER`); everyone else sees read-only rows with a `PermissionNote`.
   Every decision logs its activity event.
4. **Min/max settings** (`minMax.js`, planner only): edit per asset and part, plus suggestions such as "A011 hit zero stock twice this month, raise the minimum to 3?" that the planner accepts or declines, each logged.
   Stock below minimum adds a replenishment request with `source: 'min-breach'` (story 2 step 3).
5. **Widget** (`widgets.jsx`): `ReorderQueueSummary`, pending count, oldest rush age, and how many are over 4 hours.

## Acceptance criteria

- First load shows Arroyo assets at the top, A010 first, with the reason text.
- A rush reorder staged by W2's `stagePart` appears at the top with the Warning tag.
- Approve, edit and reject work for the planner, are refused for other roles in the UI and in the domain, and each appears in the activity log.
- Mark received logs `reorder.received` (W1 uses it for the Live trigger).
- The Equipment hub's parts modal and table still work.
- Tests cover ranking, reason text, min/max suggestions and the refusals.

## Verify in the app

Approve the staged A010 reorder as the planner, then view the queue as the technician.
Screenshots at 1440 px and 375 px.

## Out of scope

A real purchasing system.
Copilot-written justifications (W9 can draft them from the same data).
