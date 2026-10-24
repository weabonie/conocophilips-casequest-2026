# F2: App shell foundation

**Wave:** 0 (runs in parallel with F1)
**Priority:** P0
**Suggested agent:** `frontend-builder`
**Depends on:** nothing

## Goal

Make it possible for ten agents to build ten screens at once.
That means: a router with a slot per feature, real roles and permissions, one persistent store pattern, an activity log every feature can write to, a shared UI kit, and the cross-feature domain functions in README section 7.3.
When F2 is done, each wave 1 agent only fills in its own folder.

## Read first

1. `docs/roadmap/README.md`, all of it, with extra care on sections 6 and 7.3 to 7.5.
2. Product guide sections 2, 3, 4, 7 and 9.
3. `src/App.jsx`, `src/LoginScreen.jsx`, `src/hooks/useLiveOperations.js`, `src/utils/inventoryStorage.js`, `src/App.css`.

## You own

- `src/App.jsx`, `src/main.jsx`, `src/LoginScreen.jsx`, `src/LoginScreen.css`, `src/hooks/useLiveOperations.js` (wrap, do not change behaviour)
- `src/app/**` (new), `src/ui/**` (new), `src/styles/tokens.css` (new)
- `src/App.css`, only to move rules into `tokens.css`, `src/features/overview/overview.css` and shell styles
- `src/domain/store.js`, `auth.js`, `permissions.js`, `activityLog.js`, `partsRequests.js`, `hseGate.js`, `demoReset.js` and a `*.test.js` for each (new)
- `src/features/**` placeholders (new)

Do not edit the parser or `operations.json` (F1).
Do not import F1's new modules: code against README 7.1 with a small fixture in `src/app/__fixtures__/data.js`.

## Build

1. **Shell and routing** (`src/app/AppShell.jsx`, `src/app/routes.js`).
   Hash routes from README 7.4, a sidebar built from the route registry and filtered by the user's role, a topbar with the existing sync badge, the user pill, a role switcher for demos, the `NotificationBell` slot, and the `CopilotPanel` slot.
   Each route lazy-loads its feature's `index.jsx`.
   At 375 px the sidebar becomes a bottom bar or menu; `#/dispatch` must work full screen on a phone.
2. **Move existing screens without changing them.**
   Move the current Overview JSX from `App.jsx` into `src/features/overview/index.jsx`, and route `#/equipment` to the existing `EquipmentHealthView`.
   The app must look identical after the move; compare screenshots before and after.
3. **Placeholders.**
   Every other feature folder gets `index.jsx` (an `EmptyState` naming the screen and its guide section), `widgets.jsx` (the named exports in 7.4 returning `null`), and an empty `<feature>.css`.
   Create `src/features/copilot/Panel.jsx` and `src/features/activity/NotificationBell.jsx` as no-op slots.
4. **Data context** (`src/app/DataContext.jsx`): `DataProvider` wraps `useLiveOperations`, and `useData()` returns `data` plus the sync controls.
5. **Auth and roles** (`auth.js`, `LoginScreen.jsx`).
   Five demo users, one per role, with fictional names and site scopes: the HSE supervisor and site lead are scoped to Arroyo, Mesa and Prairie for the demo; planner, technician and ops manager see all sites.
   The login screen lets you pick a demo user (keep the email form as a secondary path that maps to a role).
   No passwords are checked; label it "Prototype sign-in".
   Persist the session in a store so a refresh keeps the user.
6. **Permissions** (`permissions.js`): the guide section 7 matrix exactly, plus Acknowledge and False alarm for the planner.
   `assertCan` throws a `PermissionError` with a readable message.
7. **Store** (`store.js`): `createPersistentStore` with versioned keys, `try/catch` around every storage access, a registry for reset, and a `storage` event listener so two tabs stay in sync during a demo.
8. **Activity log** (`activityLog.js`): append-only, newest first, capped at 2,000 entries, logs `auth.signIn` on login.
9. **Domain facades** (`partsRequests.js`, `hseGate.js`) exactly as in README 7.3.
   `partsRequests.js` wraps `inventoryStorage.js` without changing it, logs `reorder.created`, `transfer.requested` and `reorder.received`, and calls `assertCan`.
   `hseGate.js` implements only the read side: `locked` when `blockingActions` is non-empty, `clear` otherwise, and reads `ready` or `live` from a store that W1 will write to.
10. **Demo reset** (`demoReset.js`) plus a "Reset demo data" item in the user menu, with a confirm step.
11. **UI kit** (`src/ui/`): every component in README 7.5, styled from `tokens.css`, keyboard accessible, with visible focus.
    `Sourced` takes a `source` prop and an optional `resolve` function; G0 will plug in F1's `resolveSource`.
12. **Copy guard test** (`src/domain/language.test.js`): fails if any file under `src/` contains "will fail", "prevented failure", "injur", "maintenance savings" or an em dash.

## Acceptance criteria

- Signing in as each of the five roles shows the right sidebar entries.
- Every route in README 7.4 renders: the Overview and Equipment hub as before, the rest as placeholders.
- `can()` has a test per row of guide section 7, including site scope (the Arroyo supervisor cannot release Cedar).
- Stores survive a refresh, sync across two tabs, and are wiped by "Reset demo data" while sync settings are kept.
- `createRushReorder` called by a technician throws; called by a planner it creates a request and an activity entry.
- `getSiteGateStatus` returns `locked` for Mesa, Arroyo and Prairie and `clear` for Cedar, Canyon and Juniper on the fixture.
- No visual regression on the Overview and Equipment hub at 1440 px and 375 px.

## Verify in the app

Sign in as each role, visit every route, switch roles from the topbar, reset demo data.
Screenshots of the shell at both widths go in `docs/roadmap/handoffs/F2/`.

## Out of scope

Feature screens themselves.
Notification logic (W7).
The HSE write side (W1).
