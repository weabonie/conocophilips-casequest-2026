# W6: Data quality

**Wave:** 1
**Priority:** P1
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Build the evidence screen that explains how much the prototype data can be trusted and where it is limited.
It must show limitations honestly: pending invoices are unknown, not zero.

## Read first

1. `docs/roadmap/README.md`, sections 6 through 8.
2. Product guide 5.8, 9 and 10.
3. Findings 0.1 through 0.5 and 1.6.
4. `data.dataQuality`, `data.cleaningLog`, and `resolveSource` from F1.

## You own

- `src/features/data-quality/**`

## You call (do not edit)

`useData`, `resolveSource`, and the UI kit (`PageHeader`, `ConfidenceBadge`, `Sourced`, `Unknown`, `EmptyState`).

## Build

1. Show valid, missing, suspect, and late reading share per site with counts and average late hours.
2. Make Arroyo's 12.3% missing and 9.3% late readings visually clear without treating its warning data as unusable.
3. Render the cleaning log with sheet, cells, issue, raw value, corrected value, and the stated effect when available.
4. Show the 14 pending invoices as `unknown`, including an explanation that they are not treated as zero in financial totals.
5. Provide `SiteConfidenceList` from `widgets.jsx`, ordered by the weakest confidence first.
6. Every data-derived value opens a filtered `Sourced` drawer.

## Acceptance criteria

- Site values match `data.dataQuality.bySite`; Arroyo is recognizably weakest for missing and late readings.
- Cleaning-log rows are shown when present and an honest empty state appears when absent.
- Pending invoices always render as unknown, never `$0` or zero invoices.
- The page remains readable at 375 px and large tables have an accessible compact-card form.

## Verify in the app

Open Data quality as the ops manager at 1440 px and 375 px.
Save screenshots of the by-site view, cleaning log, and pending-invoice treatment.

## Out of scope

Changing parsing, cleaning, or the confidence badge shared by other features.
