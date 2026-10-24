# W9: Copilot

**Wave:** 1
**Priority:** P0
**Suggested agent:** `backend-builder`
**Depends on:** G0

## Goal

Fill the global Copilot panel with a permission-aware assistant that is reliable on stage without a network and always identifies its sources.
The Copilot explains, drafts, compares, and navigates. It never performs controlled actions.

## Read first

1. `docs/roadmap/README.md`, sections 3, 6 through 8.
2. Product guide 5.6, 7, 9, 10, 12 and 13 question 4.
3. Findings 1.3 through 1.8 and 2.3 through 2.5.
4. `cloudflare-worker.js`, `cloudflare-worker.test.js`, and F1 domain helpers.

## You own

- `src/features/copilot/**`
- `src/domain/copilotTools.js`
- `cloudflare-worker.js`
- `cloudflare-worker.test.js`
- `vite.config.js`
- `wrangler.jsonc`

## You call (do not edit)

`useData`, `useCurrentUser`, `can`, `resolveSource`, `assetExposure`, `blockingActions`, `stockAt`, and the UI kit (`Sourced`, `PermissionNote`, `Banner`).

## Build

1. Implement deterministic offline answers for the rehearsed questions: Arroyo exposure, why A010 is first, Mesa blockers, an Arroyo bearing-kit justification, avoided downtime since go-live, and data-not-available responses.
2. Route every answer through permission-scoped retrieval. A response may only include sites and records the current user may view.
3. Give every answer a concise direct response, supporting values, source chips that resolve to records, and optional navigation links.
4. Refuse approve/order/release/min-max/warning-dismissal requests politely, link to the appropriate screen, and log `copilot.refused`.
5. If `ANTHROPIC_API_KEY` is configured on the worker, offer an opt-in live-answer path using `COPILOT_MODEL` or the D9 default. Send only structured, permission-scoped data and never expose keys to the browser.
6. If no key, network, or model response is available, preserve deterministic answers and say that open-ended live answers are unavailable.
7. Test worker validation, key non-exposure, refusal paths, deterministic responses, and source attribution.

## Acceptance criteria

- "What's blocking Mesa from going live?" returns the open severity-5 actions with source records.
- "Why is A010 at the top of the reorder queue?" cites its event exposure and sample stock without inventing facts.
- A question the dataset cannot answer says so plainly.
- Controlled-action requests are refused and do not mutate state.
- The panel works with no API key or network and is usable by every role.

## Verify in the app

Ask each rehearsed question as the planner, then test a restricted request as a technician at 1440 px and 375 px.
Save screenshots of a sourced answer, refusal, and offline fallback.

## Out of scope

Autonomous actions, unrestricted external web search, or a client-side API key.
