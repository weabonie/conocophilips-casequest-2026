# W5: Overview and site page

**Wave:** 1
**Priority:** P0
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Replace the foundation Overview placeholder with the decision screen for program health and exposure.
It must make the six-site comparison, A010 exposure, HSE state, and KPI targets legible without hiding source data.

## Read first

1. `docs/roadmap/README.md`, sections 3, 6, 7 and 8.
2. Product guide 5.1, 6 story 4, 9, 11 and 12.
3. Findings 1.1, 1.3 through 1.5, 2.3 and 3.7.
4. `src/domain/metrics.js`, `src/domain/hseGate.js`, and the Overview placeholder from F2.

## You own

- `src/features/overview/**`
- `src/features/site/**`

## You call (do not edit)

`useData`, `siteKpis`, `programKpis`, `assetExposure`, `useSiteGateStatus`, `resolveSource`, and the UI kit (`PageHeader`, `KpiTile`, `StatusBadge`, `Sourced`, `ConfidenceBadge`, `Unknown`, `SampleDataTag`).

## Build

1. Put program KPIs first: parts-wait hours, share of outages waiting for parts, spare fill against 90%, overdue severity-5 actions, unplanned downtime hours, and lost margin.
2. Render one exposure-ordered site card per site with spare-fill gauge, parts-wait share, gate status, dollars at risk, and a link to `#/sites/:siteId`.
3. Add an accessible inline-SVG scatter plot for spare fill versus parts-wait share, with a 90% target reference and labelled points.
4. Add an asset leaderboard ordered by `partsWaitUsd`; show A010, A012 and A011 prominently and wrap every numeric claim with `Sourced`.
5. Build the site route as a focused drill-down: headline KPIs, asset exposure, event history, HSE status, and a link to the relevant feature screens.
6. Export `KpiStrip` and `SiteStatusCards` from `widgets.jsx` for I1.

## Acceptance criteria

- Baseline values reconcile to the findings: 1,613 parts-wait hours, 6,599 unplanned hours, $5.61M lost margin, six overdue severity-5 actions, and $842k full-year avoided margin.
- Arroyo is first and shows 42% spare fill, 56% of outages waiting, and 36% of loss.
- A010 is first in the asset leaderboard and every source drawer opens filtered records.
- The site route works for every site and shows HSE state without duplicating HSE write actions.
- At 375 px cards stack, chart labels remain readable, and no horizontal scrolling occurs.

## Verify in the app

Open Overview as the ops manager, then Arroyo and Mesa site pages at 1440 px and 375 px.
Save screenshots for Overview, the chart, the A010 leaderboard row, and the Arroyo drill-down.

## Out of scope

Changing KPI formulas, the HSE state machine, or existing Equipment and Health behavior.
