# I2: End-to-end QA, demo rehearsal, and screenshots

**Wave:** 2, serial after I1
**Priority:** P2
**Suggested agent:** `tester`
**Depends on:** I1

## Goal

Prove that the completed prototype supports the product stories and 90-second demo path with accurate numbers, permissions, source traceability, responsive behavior, and fallback screenshots.

## Read first

1. `docs/roadmap/README.md`, all sections.
2. Product guide sections 6, 7, 9, 11 and 12.
3. Findings sections 0.5, 1, 2.3 through 2.5, and 3.5 through 3.8.
4. All handoff notes from F1, F2, W1 through W10, and I1.

## You own

- No production file by default.
- `docs/roadmap/handoffs/I2/` screenshots and test evidence.
- If a defect needs a production change, make one isolated fix at a time only after documenting reproduction and affected owner in the handoff.

## Test matrix

| Area | Role | Required check |
|---|---|---|
| Story 1 | Planner, technician | A010 warning, stage part, approve reorder, receipt, green dispatch |
| Story 2 | Technician, planner | Mesa electrical-trip dispatch, Prairie transfer, min-breach replenishment |
| Story 3 | Arroyo HSE supervisor | Verify both blockers, release by name, receipt changes Ready to Live |
| Story 4 | Ops manager | Overview, Copilot source answer, O3 added to O4 simulator |
| Permissions | Every role | Restricted actions hidden and domain refusal verified |
| Data integrity | Ops manager | Findings numbers, source drawers, unknown invoices, sample-stock labels |
| Responsive | Relevant roles | All demo screens at 1440 px and 375 px |

## Build and verify

1. Run `pnpm lint`, `pnpm test`, and `pnpm build` on the final merged state.
2. Execute the test matrix through the app, resetting demo state between independent stories.
3. Rehearse the 90-second path twice: once with live state and once using only screenshots as a fallback.
4. Save labelled screenshots for every timed demo step and document exact fallback order.
5. Inspect visual defects at both target widths, including focus visibility, clipped labels, contrast, touch targets, and horizontal overflow.
6. Record defects with reproduction steps, expected versus actual behavior, severity, and whether a fix was made.

## Acceptance criteria

- All checks in README section 8 pass on the merged result.
- Every demo step is reproducible from a reset state in the documented order.
- No role can bypass a permission through the UI or direct domain call.
- Every claim displayed in the demo has a source or an explicit unknown label.
- The fallback screenshot set covers 0:00 through 1:25 of the demo path.

## Handoff requirements

Include the exact commands and results, completed matrix, screenshot inventory, defects found and fixed, remaining risks, and the recommended on-stage reset sequence.

## Out of scope

Feature expansion, data-model redesign, real integration testing against external systems, or untracked bulk cleanup.
