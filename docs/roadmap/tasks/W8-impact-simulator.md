# W8: Impact simulator

**Wave:** 1
**Priority:** P0
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Build a transparent what-if tool for selecting sites and O1, O3, O4, and O5.
It must apply the findings formulas faithfully and never double-count O1 and O5.

## Read first

1. `docs/roadmap/README.md`, sections 3, 6 through 8.
2. Product guide 5.7, 7, 9 and 12.
3. Findings 2.1 through 2.5, 3.2 through 3.4, and 4.

## You own

- `src/features/simulator/**`
- `src/domain/impactModel.js`
- `src/domain/impactModel.test.js`

## You call (do not edit)

`useData`, `useCurrentUser`, `can`, `assertCan`, `resolveSource`, and the UI kit (`PageHeader`, `KpiTile`, `Sourced`, `Banner`, `PermissionNote`).

## Build

1. Implement a pure model that accepts selected sites and options, returning avoided hours, avoided margin, setup, annual, year-one cost, year-one return, resource hours, and per-site results.
2. O3 and O4 add fully. O1 and O5 overlap: use the findings overlap result, never the sum of their separate avoided-hour claims.
3. Provide the four guide presets and editable site and option toggles.
4. Show resource hours against `availableProjectHours` per site and flag selections that exceed capacity.
5. Keep an always-visible explanation that figures are avoided downtime, not prevented failures; label full-year $842k and year-one $721k separately.
6. Export `ImpactSummary` from `widgets.jsx`.

## Acceptance criteria

- Presets reconcile: O4 all sites = 968 h, $842k, $186k year-one cost; O4 core = 732 h, $668k, $93k; O3 + O4 = 1,527 h, $1.32M; O1 + O3 + O4 = 2,150 h, $1.84M, $862k year-one cost.
- O1 + O5 cannot double-count overlap.
- Only planner, site lead, and ops manager may use or change scenarios; domain checks refuse other roles.
- Every model result exposes its solution and source rows.
- Tests cover totals, overlap, per-site aggregation, capacity, and permission refusals.

## Verify in the app

Run O4, then add O3 as the ops manager at 1440 px and 375 px.
Save screenshots of the recommended preset, O3 + O4, and a capacity comparison.

## Out of scope

Persisting scenarios, real financial approval, or changing the source solution data.
