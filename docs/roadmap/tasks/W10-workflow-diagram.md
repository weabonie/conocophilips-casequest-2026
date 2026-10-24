# W10: Workflow and architecture diagram

**Wave:** 1
**Priority:** P1
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Build the interactive workflow visual required by the findings, showing how data, advisory logic, human decisions, HSE authorization, and measurement fit together.

## Read first

1. `docs/roadmap/README.md`, sections 3, 6 through 8.
2. Findings 3.5 and 3.8 item 6.
3. Product guide 3, 4, 7, 8 and 10.

## You own

- `src/features/how-it-works/**`

## You call (do not edit)

The router, UI kit, and route URLs in README 7.4.

## Build

1. Draw a responsive inline-SVG or semantic HTML flow: workbook and sensor readings -> parser and quality checks -> early warning and reorder recommendation -> human planner decision -> pre-dispatch check -> HSE verification and release -> receipt and KPI measurement.
2. Distinguish advisory automation, required human decisions, and safety gate with accessible labels and a legend.
3. Make nodes keyboard reachable, expose descriptions, and link nodes to the corresponding screens.
4. Include persistence and boundaries: local prototype state, sample inventory values, optional Copilot worker, and no client-side API key.
5. Add a concise limitations panel: sample stock, replayed readings, mocked notifications, and no real purchasing or HSE integration.

## Acceptance criteria

- The diagram clearly shows that no automated step can approve a reorder or release an HSE gate.
- HSE release and LOTO/isolation protections are explicit.
- Every feature route in the flow is correct and can be opened from its node.
- The visual remains understandable at 375 px without requiring horizontal scrolling.

## Verify in the app

Open `#/how-it-works` at 1440 px and 375 px, navigate from each node, and save screenshots.

## Out of scope

Editing system architecture, building integrations, or duplicating feature-screen logic.
