# F1: Data foundation

**Wave:** 0 (runs in parallel with F2)
**Priority:** P0
**Suggested agent:** `backend-builder`
**Depends on:** nothing

## Goal

Every wave 1 feature reads its numbers from one parsed data object.
Today that object only has site and asset totals.
Extend it to the data contract in README section 7.1, build the pure helpers in section 7.2, and prove every headline number in the findings doc with tests.
When F1 is done, no feature should need to touch the parser.

## Read first

1. `docs/roadmap/README.md`, sections 3, 6 and 7.1 to 7.2.
2. `docs/CaseQuest_2026_Findings.md` sections 0 and 1 (all of it: these are your expected values).
3. Product guide sections 5.2, 5.8, 9 and 11.
4. `src/utils/excelParser.js` and `src/utils/excelParser.test.js`.

## You own

- `src/utils/excelParser.js`, `src/utils/excelParser.test.js`
- `src/data/operations.json` (regenerate it, never hand-edit it)
- `scripts/build-snapshot.mjs` (new)
- `src/domain/metrics.js`, `src/domain/earlyWarning.js`, `src/domain/sources.js`, `src/domain/clock.js`, `src/domain/constants.js` and a `*.test.js` for each (new)
- The `scripts` block of `package.json`: add `"test": "node --test"` and `"snapshot": "node scripts/build-snapshot.mjs"`

Do not import anything from `src/app/`, `src/ui/` or F2's domain modules.

## Build

1. **Parser output.**
   Add the fields in README 7.1 (`events`, `readings`, `hseActions`, `solutions`, `cleaningLog`, site and asset additions, `dataQuality.bySite`, `earlyWarning`).
   Keep every existing field and its meaning, so the current Overview and Equipment hub keep working.
   Bump `PARSER_VERSION` so stale browser caches are dropped.
   Ignore the workbook's helper columns (`Site`, `Unrecovered bbl`, `Month`, `Margin`, `Loss` on Events) and the `Slide1` and `Downtime Analysis` sheets: compute from the raw columns.
   Treat `Cleaning_Log` as optional (older workbooks lack it).
   Pending invoices stay `null`, never 0.
2. **Early warning engine** (`earlyWarning.js`).
   Rule D2: vibration ≥ 1.4 × normal OR temperature ≥ normal + 8 °C, valid readings only.
   Each alert records which event it preceded within the 3-day lookback and the lead time in days.
   `likelyIssueFor` returns Bearing or Seal from that asset's own 2025 history: the mechanical cause it failed with most often (ties go to Bearing).
   It never uses the event the alert preceded, so a replayed warning cannot peek at the answer.
   Document the heuristic in a comment and note it as an assumption in the handoff.
   Switch the parser's Equipment status rule from 1.15 × vibration to this rule so every screen agrees.
3. **Metrics** (`metrics.js`): `siteKpis`, `programKpis`, `assetExposure` as specified.
   `hourlyMarginUsd` per asset is loss divided by stopped hours, used in reorder reasons ("each hour A010 is down costs about $1,200").
4. **Sources** (`sources.js`): `resolveSource` returns ready-to-render rows for any table and filter, used by the "tap any number" drawer.
5. **Clock** (`clock.js`): as-of date defaulting to `data.hseAsOf`, with a replay override and a React hook built on a tiny subscribe pattern (no F2 import).
6. **Constants** (`constants.js`): the values in README 7.2, with the D1 and D7 defaults and a comment pointing at the decision.
7. **Snapshot script**: `pnpm snapshot` reads `CaseQuest2026Dataset.xlsx`, writes `src/data/operations.json`, prints its size, and fails above 1.5 MB.
   Keep readings compact (short keys, rounded to 2 decimals) to stay inside the budget.

## Acceptance criteria

Tests prove these against the real workbook (findings section in brackets):
- 313 unplanned events, 6,598.55 h, $5,608,389.61 lost margin (1.1).
- Parts-wait stage 1,613.32 h; 95 of 313 outages waited; 34.1 h average vs 15.4 h (1.3).
- Spare fill and share of outages waiting by site: Arroyo 42% and 56%, Mesa 65% and 38%, Prairie 70% and 29%, Juniper 92% and 10% (1.4).
- A010 $727k, A012 $684k, A011 $607k are the top three assets by lost margin (1.5).
- Missing, suspect and late shares by site, with Arroyo 12.3% missing and 9.3% late, 102 late readings all at Arroyo (1.6).
- Early warning: 479 alerts, 0 false alarms, 115 of 115 bearing and 57 of 57 seal events flagged, 0 for other causes, median lead about 2 days (1.7).
- HSE: 36 records, 11 open, 6 severity-5 (2 each on A004, A010, A016), all open actions overdue, severity-5 actions 540 to 600 days overdue at 2026-10-01 (1.8).
- Solutions: O4 parts-wait base fraction 0.6, O1 detect 0.6 and repair 0.25, O3 detect 0.2 and dispatch 0.3, O5 repair 0.5 (2.1).
- 14 pending invoices remain `null` (0.4).
- Cleaning log rows are parsed from the FINAL workbook.
- `operations.json` is regenerated, under 1.5 MB, and the existing Overview renders the same totals as before.

If a test cannot reach a findings number, do not fudge it: record the gap and your evidence in the handoff.

## Verify in the app

Run `pnpm dev`, sign in, and confirm the Overview totals and the Equipment hub still render.
Count how many assets now show a warning under the new rule and note it in the handoff.

## Out of scope

Any UI.
Impact model maths (W8 owns `impactModel.js`).
Copilot retrieval (W9).
