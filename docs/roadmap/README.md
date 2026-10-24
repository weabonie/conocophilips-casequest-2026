# Critical Spares Control Tower: Build Roadmap

This roadmap turns `docs/CaseQuest_2026_Product_Guide.md` into work that many subagents can build at the same time without stepping on each other.
It is the guiding context for the whole project.
Every subagent reads this file first, then its own brief in `docs/roadmap/tasks/`.

## 0. How to use this roadmap

1. The orchestrator (the main session) dispatches tasks wave by wave, in the order in section 4.
2. Every task in a wave runs in parallel, each in its own git worktree and branch (`feat/<task-id>`).
3. A subagent reads, in this order: this README, its task brief, the product guide sections the brief names, then the code it owns.
4. A subagent edits only the files its brief owns (section 6).
   If it needs a change in a file it does not own, it writes the request in its handoff note and works around it with the frozen contract.
5. When done, the subagent writes `docs/roadmap/handoffs/<task-id>.md` (template in section 10) and stops.
6. The orchestrator merges every branch of the wave, runs the gate checks (section 9), and only then starts the next wave.

Prompt template the orchestrator uses for each subagent:

```text
You are building task <TASK-ID> of the Critical Spares Control Tower.
Read docs/roadmap/README.md, then docs/roadmap/tasks/<TASK-ID>.md, then the product guide sections it lists.
Only edit files your brief owns. Contracts in README section 7 are frozen: do not change their signatures.
When finished, run the Definition of Done checks (README section 8) and write docs/roadmap/handoffs/<TASK-ID>.md.
Do not merge, push or open a PR. Commit on your branch only.
```

## 1. Source documents (read-only)

| File | What it is | Use it for |
|---|---|---|
| `docs/CaseQuest_2026_Product_Guide.md` | What the product does, screen by screen | Behaviour, copy, permissions, scope |
| `docs/CaseQuest_2026_Findings.md` | Every number and calculation rule | Expected values in tests, constants, formulas |
| `docs/CaseQuest_2026_Deck_Plan.md` | The presentation and the 90-second demo click path | Demo order, the numbers presenters say |
| `CaseQuest2026Dataset.xlsx` | The FINAL cleaned workbook (Revision 5) | The only data source |

If the guide and the findings disagree on a number, the findings win, and the subagent notes it in its handoff.

## 2. Where the app is today

Built and working:
- Operations overview: KPI tiles, site map filter, downtime by stage and cause, asset table ranked by parts-wait hours (`src/App.jsx`).
- Equipment and Health hub: asset cards with vibration and temperature against baseline, maintenance scheduling, a parts availability modal with sample stock, reservations and transfers, and a parts request queue with approve and reject (`src/components/`).
- Excel parsing and cleaning with a data-quality report (`src/utils/excelParser.js`), live sync from SharePoint or a local upload, and Cloudflare Workers deployment.

Not built (this roadmap):
- HSE gate, Pre-dispatch check, Copilot, Impact simulator, Data quality screen, Activity log, Notifications, roles and permissions, role-based home screens, workflow diagram.
- Upgrades to existing screens: Overview site cards and charts, Early warning rule and actions, Reorder queue ranking, reasons and min/max.

Constraints that shape the plan:
- `src/App.jsx` holds the whole shell and the Overview, and `src/App.css` is one 2,500-line file.
  Parallel edits to either would conflict, so wave 0 splits them before anyone else starts.
- The login accepts any email and always assigns "Operations Analyst".
  Permissions need real roles first.
- The data snapshot (`src/data/operations.json`) has only site and asset aggregates.
  Several features need events, readings, HSE rows and solutions, so wave 0 extends the data contract.
- All prototype state lives in `localStorage`.
  That stays true for the prototype (decision D5), behind one store interface.

## 3. Decisions

These are settled so subagents do not re-open them.
The product owner has selected the values below for this prototype.

| ID | Decision | Default used | Where it lives |
|---|---|---|---|
| D1 | Year-one benefit figure (guide 13.1) | **$721k** staggered rollout (Arroyo month 1, Mesa and Prairie month 2, rest month 3), always shown next to $842k full year | `src/domain/constants.js` `YEAR_ONE_BENEFIT_USD` |
| D2 | Early warning rule | Vibration ≥ 1.4 × normal OR temperature ≥ normal + 8 °C, on valid readings only, 3-day lookback. Replaces the old 1.15 × vibration rule everywhere | `src/domain/earlyWarning.js` |
| D3 | Inter-site transfers (guide 13.2) | Core, not an add-on: Pre-dispatch Amber and Early warning staging both offer a transfer when another site has stock | Domain facade `partsRequests.js` |
| D4 | Copilot on stage (guide 13.4) | Live answers when an API key is set, plus a deterministic answer set for the rehearsed questions that works with no key and no network | `src/features/copilot/` |
| D5 | Persistence | Browser `localStorage` behind `createPersistentStore`, with a "Reset demo data" action. No backend for prototype state | `src/domain/store.js` |
| D6 | Go-live state machine | `locked` (open severity-5) → `ready` (supervisor released) → `live` (first parts receipt at that site after release). Sites with no severity-5 start `clear` → `live` on the same receipt trigger | `src/domain/hseGate.js` |
| D7 | Product name (guide 13.3) | **Critical Spares Control Tower** | `src/domain/constants.js` `PRODUCT_NAME` |
| D8 | Sample stock | Stock levels are sample values matching each site's spare fill and are labeled "Sample stock levels" wherever shown | `src/utils/inventoryStorage.js` |
| D9 | Copilot model | `claude-opus-5-5` by default, overridable with `COPILOT_MODEL`. Key comes from the Cloudflare secret `ANTHROPIC_API_KEY`, never the client | `cloudflare-worker.js` |
| D10 | No new runtime dependencies | Charts are inline SVG. Routing is hash-based. Only W9 may add the Anthropic SDK if it chooses not to use `fetch` | `package.json` |

### Source reconciliation

The Product Guide and this roadmap use $721k for the staggered year-one rollout.
`docs/CaseQuest_2026_Findings.md` and `docs/CaseQuest_2026_Deck_Plan.md` still state approximately $770k for a different assumption: roughly 11 months of benefit with all sites live from month 1.
Do not use the $770k figure in the prototype, tests, UI copy, or demo script until those source documents are deliberately updated together.

## 4. Waves and dependency graph

```text
Wave 0 (2 in parallel)      F1 data foundation        F2 app shell foundation
                                     \                     /
Gate G0 (orchestrator)            merge, glue, all checks green
                                           |
Wave 1 (10 in parallel)   W1 HSE gate      W2 Early warning   W3 Reorder queue
                          W4 Pre-dispatch  W5 Overview        W6 Data quality
                          W7 Activity log  W8 Simulator       W9 Copilot
                          and notifications                   W10 Workflow diagram
                                           |
Gate G1 (orchestrator)            merge all 10, all checks green
                                           |
Wave 2 (serial)             I1 role homes and integration  ->  I2 end-to-end QA and demo
```

Wave 1 tasks depend only on wave 0 contracts, never on each other.
Where one feature triggers another (Early warning "Stage part" creates a reorder), it goes through a wave 0 domain function, so both sides can be built at once.

Priority if time runs short: the 90-second demo path (guide section 12) first.

### Judging-day execution scope

The judging date in the guide is October 24, 2026, which is today.
For today, run only F1 and F2, then W1 through W4 after G0.
They complete the foundation plus the HSE, early-warning, reorder, and pre-dispatch interactions needed for the working demo path.
W5 through W10 and I1 through I2 remain fully specified follow-on work and must not be dispatched until the judging-day scope is stable.

| Priority | Tasks |
|---|---|
| P0, on the demo path | F1, F2, W5, W2, W3, W4, W1, W9, W8 |
| P1, credibility and audit | W6, W7, W10, I1 |
| P2, polish | Notifications part of W7, I2 polish beyond the demo path |

## 5. Task index

| ID | Task | Guide sections | Suggested agent | Brief |
|---|---|---|---|---|
| F1 | Data foundation: parser contract, snapshot, metrics, early-warning engine | 4, 5.2, 5.8, 9, 11 | `backend-builder` | [tasks/F1-data-foundation.md](tasks/F1-data-foundation.md) |
| F2 | App shell foundation: routing, roles, permissions, stores, activity log, UI kit | 2, 3, 7 | `frontend-builder` | [tasks/F2-app-shell.md](tasks/F2-app-shell.md) |
| G0 | Gate: merge wave 0, glue, checks | | orchestrator | section 9 |
| W1 | HSE gate | 5.5, story 3 | `frontend-builder` | [tasks/W1-hse-gate.md](tasks/W1-hse-gate.md) |
| W2 | Early warning and parts staging | 5.2, story 1 | `frontend-builder` | [tasks/W2-early-warning.md](tasks/W2-early-warning.md) |
| W3 | Reorder queue | 5.3, story 2 | `frontend-builder` | [tasks/W3-reorder-queue.md](tasks/W3-reorder-queue.md) |
| W4 | Pre-dispatch check | 5.4, stories 1 and 2 | `frontend-builder` | [tasks/W4-pre-dispatch.md](tasks/W4-pre-dispatch.md) |
| W5 | Overview and site page | 5.1, 11, story 4 | `frontend-builder` | [tasks/W5-overview.md](tasks/W5-overview.md) |
| W6 | Data quality | 5.8 | `frontend-builder` | [tasks/W6-data-quality.md](tasks/W6-data-quality.md) |
| W7 | Activity log and notifications | 5.9, 8 | `frontend-builder` | [tasks/W7-activity-notifications.md](tasks/W7-activity-notifications.md) |
| W8 | Impact simulator | 5.7 | `frontend-builder` | [tasks/W8-impact-simulator.md](tasks/W8-impact-simulator.md) |
| W9 | Copilot | 5.6 | `general-purpose` (full stack) | [tasks/W9-copilot.md](tasks/W9-copilot.md) |
| W10 | Workflow and architecture diagram | Findings 3.8 item 6 | `frontend-builder` | [tasks/W10-workflow-diagram.md](tasks/W10-workflow-diagram.md) |
| G1 | Gate: merge wave 1, checks | | orchestrator | section 9 |
| I1 | Role-based home screens and integration | 2, 6 | `frontend-builder` | [tasks/I1-role-homes-integration.md](tasks/I1-role-homes-integration.md) |
| I2 | End-to-end QA, demo rehearsal, screenshots | 6, 12 | `tester`, then `design-ui-reviewer` | [tasks/I2-e2e-demo-qa.md](tasks/I2-e2e-demo-qa.md) |

## 6. File ownership

One owner per file per wave.
"Frozen" means nobody edits it in that wave.
Anything not listed is frozen in wave 1 unless a brief claims it.

### Wave 0

| Path | Owner |
|---|---|
| `src/utils/excelParser.js`, `src/utils/excelParser.test.js`, `src/data/operations.json` | F1 |
| `scripts/build-snapshot.mjs` (new) | F1 |
| `src/domain/metrics.js`, `earlyWarning.js`, `sources.js`, `clock.js`, `constants.js` and their tests (new) | F1 |
| `package.json` `scripts` block (`test`, `snapshot`) | F1 |
| `src/App.jsx`, `src/main.jsx`, `src/LoginScreen.jsx`, `src/LoginScreen.css` | F2 |
| `src/app/**` (new: shell, routes, contexts) | F2 |
| `src/domain/store.js`, `auth.js`, `permissions.js`, `activityLog.js`, `partsRequests.js`, `hseGate.js`, `demoReset.js` and their tests (new) | F2 |
| `src/ui/**` (new: shared components) | F2 |
| `src/styles/tokens.css` (new), `src/App.css` (only to move shell and overview rules out) | F2 |
| `src/features/**` placeholders (new) | F2 |
| `src/hooks/useLiveOperations.js` | F2 (wrap only, keep behaviour) |

F1 and F2 must not import each other's new modules during wave 0.
F2 codes against the F1 data contract (section 7.1) using a small fixture, and G0 wires the two together.

### Wave 1

| Path | Owner |
|---|---|
| `src/features/hse-gate/**`, `src/domain/hseGate.js` (+ test) | W1 |
| `src/features/early-warning/**`, `src/domain/warnings.js` (+ test, new) | W2 |
| `src/features/reorders/**`, `src/domain/partsRequests.js`, `src/domain/minMax.js` (new), `src/utils/inventoryStorage.js`, `src/components/PartsRequestsTable.jsx`, `src/components/PartsAvailabilityModal.jsx` | W3 |
| `src/features/dispatch/**` | W4 |
| `src/features/overview/**`, `src/features/site/**` | W5 |
| `src/features/data-quality/**` | W6 |
| `src/features/activity/**`, `src/domain/notifications.js` (+ test, new) | W7 |
| `src/features/simulator/**`, `src/domain/impactModel.js` (+ test, new) | W8 |
| `src/features/copilot/**`, `cloudflare-worker.js`, `cloudflare-worker.test.js`, `vite.config.js`, `wrangler.jsonc`, `src/domain/copilotTools.js` (new) | W9 |
| `src/features/how-it-works/**` | W10 |
| `src/app/**`, `src/ui/**`, `src/styles/tokens.css`, `src/App.css`, `src/domain/store.js`, `auth.js`, `permissions.js`, `activityLog.js`, `metrics.js`, `earlyWarning.js`, `sources.js`, `clock.js`, `constants.js`, `excelParser.js`, `operations.json`, `package.json` | **Frozen** |
| `src/components/EquipmentHealthView.jsx`, `MaintenanceQueueTable.jsx`, `MaintenanceScheduleModal.jsx`, `src/utils/maintenanceStorage.js` | **Frozen** (existing Equipment hub stays as is) |

### Wave 2

| Path | Owner |
|---|---|
| `src/features/home/**`, `src/app/**`, `src/ui/**`, any `widgets.jsx` | I1 |
| Anything, for bug fixes found in QA, one fix at a time | I2 |

## 7. Frozen contracts

These signatures are the agreement between parallel tasks.
Wave 0 implements them.
Wave 1 may add new exports to modules it owns, but must not change or remove these.

### 7.1 Data contract (F1 produces, everyone reads)

`useData()` (from `src/app/DataContext.jsx`) returns the parsed workbook.
Existing fields stay as they are (`sites`, `equipment`, `dataQuality`, `hseAsOf`, `sensorAsOf`, `parserVersion`, `source`, `period`, `lastSyncTime`).
F1 adds these fields and bumps `PARSER_VERSION`:

```js
data.events = [{
  id: 'E0001', assetId: 'A010', siteId: 'S04', type: 'Unplanned' | 'Planned',
  cause: 'Bearing wear' | 'Seal leak' | 'Electrical trip' | 'Process upset' | 'Unknown',
  startUtc: ISOString, endUtc: ISOString,
  stages: { detect, dispatch, partsWait, repair, restart },   // hours
  stoppedHours, protectedRepairHours, lostOilBbl, unrecoveredBbl,
  lossUsd,                // lost margin, Findings 0.5 rule
  partsWaitUsd,           // lossUsd × partsWait / stoppedHours
  partsUsd: number | null,  // null = pending invoice, never 0
  costStatus, workOrderId,
}]

data.readings = {         // keyed by assetId, sorted by observedUtc, one row per daily reading
  A010: [{ date: 'YYYY-MM-DD', observedUtc, receivedUtc, lagHours,
           vib: number | null, temp: number | null,   // null when missing or suspect
           state: 'Running' | 'Stopped' | ..., quality: 'Valid' | 'Missing' | 'Suspect', note }],
}

data.hseActions = [{
  id: 'H014', siteId, assetId, eventId, hazard, severity /* 1-5 */,
  status: 'Open' | 'Closed', owner, dueDate, closedDate: string | null,
  daysOverdue: number | null,   // against statusAsOf, null when closed
  setupUsd, annualUsd, personHours, statusAsOf,
}]

data.solutions = [{
  id: 'O4', name, unit: 'Site' | 'Asset' | 'Organization', setupUsd, annualUsd,
  leadMonths, installHours, applicableTypes: string[], prerequisites: string[],
  eligibleCauses: string[] | 'all',
  fractions: { detect: { low, base, high }, dispatch: {...}, partsWait: {...}, repair: {...}, restart: {...} },
}]

data.cleaningLog = [{ date, sheet, cells, issue, raw, fixed }]   // from the Cleaning_Log sheet, [] if absent

// added to every data.sites[i]
{ availableProjectHours, trainingHoursPerPerson, edgeSetupUsd, edgeAnnualUsd, cleanupSetupUsd }

// added to every data.equipment[i] and data.sites[i].assets[j]
{ capacityBblHr, replacementUsd, partsWaitUsd }

data.dataQuality.bySite = { S04: { readings, valid, missing, suspect, late, missingPct, suspectPct, latePct, avgLateHours } }

data.earlyWarning = {
  rule: { vibMultiplier: 1.4, tempDeltaC: 8, lookbackDays: 3 },
  alerts: [{ id, assetId, siteId, date, trigger: 'vibration' | 'temperature' | 'both',
             vib, temp, vibRatio, tempDeltaC, likelyIssue: 'Bearing' | 'Seal' | null,
             precededEventId: string | null, leadDays: number | null }],
  summary: { alerts, falseAlarms, flaggedByCause: { 'Bearing wear': { flagged, total }, ... } },
}
```

Snapshot size budget: `operations.json` stays under 1.5 MB.

### 7.2 Domain helpers (F1)

```js
// src/domain/metrics.js  (pure, all take data)
siteKpis(data) -> [{ siteId, name, spareFill, fillTarget: 90, outages, outagesWaited,
                     partsWaitShare, avgHoursWaited, avgHoursNotWaited, partsWaitHours,
                     partsWaitUsd, lossUsd, lossShare, criticalActions, openActions }]
programKpis(data) -> { partsWaitHours, partsWaitShare, unplannedHours, lossUsd,
                       overdueSev5, sitesBelowFillTarget, avgHoursWaited, avgHoursNotWaited }
assetExposure(data) -> [{ assetId, siteId, type, ageYears, events, partsWaitHours, partsWaitUsd, lossUsd, hourlyMarginUsd }]  // sorted by partsWaitUsd desc

// src/domain/earlyWarning.js  (pure)
detectAlerts(readings, asset, rule = DEFAULT_RULE) -> alert[]
activeWarnings(data, asOfDate) -> alert[]      // alerts inside the lookback window at asOfDate
likelyIssueFor(asset, alert) -> 'Bearing' | 'Seal'

// src/domain/sources.js  (pure)
resolveSource(data, { table, filter, label }) -> { label, columns: [{ key, label }], rows: object[] }
// table: 'events' | 'readings' | 'hseActions' | 'cleaningLog' | 'sites' | 'solutions' | 'equipment'
// filter: { siteId?, assetId?, ids?, cause?, type?, quality? }

// src/domain/clock.js
getAsOf() -> ISODate            // defaults to data.hseAsOf ('2026-10-01')
setReplayDate(date | null)      // used by Early warning replay
useAsOf() -> ISODate            // React hook

// src/domain/constants.js
PRODUCT_NAME, FILL_TARGET_PCT = 90, FULL_YEAR_BENEFIT_USD = 842000, YEAR_ONE_BENEFIT_USD,
SITE_ROLLOUT_MONTH = { S04: 1, S02: 2, S06: 2, S01: 3, S03: 3, S05: 3 }, KPI_TARGETS
```

### 7.3 Shell, auth, permissions, state (F2)

```js
// src/domain/auth.js
ROLES = { TECHNICIAN: 'technician', PLANNER: 'planner', HSE_SUPERVISOR: 'hse_supervisor',
          SITE_LEAD: 'site_lead', OPS_MANAGER: 'ops_manager' }
DEMO_USERS = [{ id, name, role, siteIds: string[] | 'all', avatar }]   // one per role, fictional names
useCurrentUser() -> user | null

// src/domain/permissions.js
ACTIONS = {
  VIEW_OVERVIEW, VIEW_DATA_QUALITY, RUN_DISPATCH_CHECK, STAGE_PART, ACK_WARNING, FLAG_FALSE_ALARM,
  DECIDE_REORDER, EDIT_MIN_MAX, VERIFY_HSE_ACTION, RELEASE_SITE, USE_SIMULATOR, USE_COPILOT, EXPORT_ACTIVITY,
}
can(user, action, { siteId } = {}) -> boolean        // matrix from guide section 7, site-scoped roles checked
assertCan(user, action, ctx) -> void                 // throws PermissionError; every mutating domain function calls it

// src/domain/store.js
createPersistentStore({ key, version, initial }) -> { get, set(updater), subscribe(fn), reset() }
useStore(store, selector = s => s) -> selected value       // useSyncExternalStore
// keys are prefixed 'cq_'; every store registers itself so resetDemoState() can clear it

// src/domain/activityLog.js
EVENT_TYPES = {
  SIGN_IN: 'auth.signIn',
  REORDER_CREATED: 'reorder.created', REORDER_APPROVED: 'reorder.approved', REORDER_REJECTED: 'reorder.rejected',
  REORDER_QTY_EDITED: 'reorder.qtyEdited', REORDER_RECEIVED: 'reorder.received',
  WARNING_RAISED: 'warning.raised', WARNING_ACKNOWLEDGED: 'warning.acknowledged',
  WARNING_FALSE_ALARM: 'warning.falseAlarm', WARNING_STAGED: 'warning.staged',
  DISPATCH_CHECKED: 'dispatch.checked', TRANSFER_REQUESTED: 'transfer.requested',
  HSE_ACTION_VERIFIED: 'hse.actionVerified', SITE_RELEASED: 'hse.siteReleased',
  SITE_RELOCKED: 'hse.siteRelocked', SITE_LIVE: 'site.live',
  MINMAX_CHANGED: 'minmax.changed', MINMAX_SUGGESTION_DECIDED: 'minmax.suggestionDecided',
  COPILOT_REFUSED: 'copilot.refused',
}
logActivity(user, { type, siteId?, assetId?, entityId?, reason?, meta? }) -> entry
// entry = { id, at: ISOString, actor: { id, name, role }, type, siteId, assetId, entityId, reason, meta }
useActivity(filter?) -> entry[]          // newest first
subscribeActivity(fn) -> unsubscribe

// src/domain/partsRequests.js   (F2 wraps src/utils/inventoryStorage.js; W3 owns it in wave 1)
likelyPartFor(asset, cause?) -> { partId, partName }
stockAt(siteId, partId) -> { onHand, reserved, available, minStock, maxStock }
stockElsewhere(partId, excludeSiteId) -> [{ siteId, siteName, available, etaHours }]
createRushReorder(user, { siteId, assetId, partId, qty, source: 'early-warning' | 'pre-dispatch' | 'min-breach', warningId?, reason }) -> request
createTransfer(user, { fromSiteId, toSiteId, assetId, partId, qty, reason }) -> request
markReceived(user, requestId) -> request     // logs REORDER_RECEIVED, which W1 uses for the Live trigger
usePartsRequests(filter?) -> request[]

// src/domain/hseGate.js   (F2 implements the read side; W1 owns it in wave 1 and adds the write side)
GATE_STATUS = { LOCKED: 'locked', CLEAR: 'clear', READY: 'ready', LIVE: 'live' }
getSiteGateStatus(data, siteId) -> GATE_STATUS value
useSiteGateStatus(siteId) -> GATE_STATUS value
blockingActions(data, siteId) -> hseAction[]  // open severity-5 actions not yet verified

// src/domain/demoReset.js
resetDemoState() -> void   // clears every registered store, keeps sync settings
```

### 7.4 Feature module contract (every wave 1 task)

Each feature lives in `src/features/<feature>/` and exports:

```js
// index.jsx         default export: the screen component, rendered by the router
// widgets.jsx       named exports used by role homes in wave 2 (F2 creates them as `() => null`)
// <feature>.css     styles, every class prefixed with the feature name (for example .hse-gate-row)
```

Routes, created by F2 in `src/app/routes.js` and pointing at the placeholders:

| Route | Feature folder | Screen | Visible to |
|---|---|---|---|
| `#/` | `home` | Role home | everyone |
| `#/overview` | `overview` | Overview | everyone |
| `#/sites/:siteId` | `site` | Site page | everyone |
| `#/early-warning` | `early-warning` | Early warning | planner, site lead, ops manager, technician |
| `#/reorders` | `reorders` | Reorder queue | planner, site lead, ops manager |
| `#/dispatch` | `dispatch` | Pre-dispatch check | technician, planner, site lead |
| `#/hse` | `hse-gate` | HSE gate | everyone (actions supervisor-only) |
| `#/simulator` | `simulator` | Impact simulator | planner, site lead, ops manager |
| `#/data-quality` | `data-quality` | Data quality | everyone |
| `#/activity` | `activity` | Activity log | everyone (export: HSE supervisor, ops manager) |
| `#/equipment` | existing `EquipmentHealthView` | Equipment and Health | everyone |
| `#/how-it-works` | `how-it-works` | Workflow diagram | everyone |

Global slots rendered by the shell on every screen:
- `src/features/copilot/Panel.jsx` default export `CopilotPanel` (W9 fills it).
- `src/features/activity/NotificationBell.jsx` default export `NotificationBell` (W7 fills it).

Widget names (wave 2 composes them into role homes):

| File | Exports |
|---|---|
| `early-warning/widgets.jsx` | `EarlyWarningSummary` |
| `reorders/widgets.jsx` | `ReorderQueueSummary` |
| `dispatch/widgets.jsx` | `DispatchLauncher` |
| `hse-gate/widgets.jsx` | `HseGateSummary` |
| `overview/widgets.jsx` | `KpiStrip`, `SiteStatusCards` |
| `simulator/widgets.jsx` | `ImpactSummary` |
| `activity/widgets.jsx` | `ActivityFeedMini` |
| `data-quality/widgets.jsx` | `SiteConfidenceList` |

### 7.5 Shared UI kit (F2, in `src/ui/`)

`PageHeader`, `KpiTile`, `StatusBadge` (locked, clear, ready, live, warning, ok, unknown), `Banner` (info, warn, danger, success), `ConfidenceBadge` (props: `siteId`, `missingPct`, `latePct`, `label`), `SourceDrawer` + `Sourced` (wrap any number to open its source records), `ReasonDialog` (required reason text), `ConfirmByNameDialog` (type your name to confirm), `EmptyState`, `PermissionNote` (explains why an action is hidden), `SampleDataTag`, `Unknown` (renders the word "unknown", never 0).

## 8. Definition of Done (every task)

A task is done only when all of these hold:
1. `pnpm lint`, `pnpm test` and `pnpm build` pass with no new warnings.
2. New pure logic has `node:test` tests next to it (`*.test.js`), and expected numbers come from the findings doc.
3. The feature was opened in the running app (`pnpm dev`) and checked at 1440 px and 375 px wide, with screenshots saved to `docs/roadmap/handoffs/<task-id>/`.
4. Every action the guide restricts is hidden or disabled for other roles, and the domain function also refuses it (`assertCan`).
5. Every decision a person makes writes an Activity log entry.
6. Copy follows guide section 9: "likely bearing issue", "avoided downtime hours", unknown shown as "unknown", year-one and full-year labeled, no injury or maintenance-savings claims, site and asset names used.
7. No em dash characters in code, copy or docs.
8. Only owned files changed (`git diff --name-only main...` checked against section 6).
9. Handoff note written.

## 9. Gates (orchestrator)

**G0, after wave 0:**
1. Merge `feat/F1` then `feat/F2` into `main`.
2. Glue: point `Sourced` at `resolveSource`, point `ConfidenceBadge` at `data.dataQuality.bySite`, delete F2's data fixture if the real snapshot covers it.
3. Run section 8 checks 1 and 3 on the merged result, and confirm every placeholder route renders.
4. Confirm the reconciliation numbers in the F1 tests still match the findings.

**G1, after wave 1:**
1. Merge the ten branches (they touch disjoint files, so order does not matter).
2. Run the full test suite and the build, then walk the 90-second demo path once by hand.
3. Collect every "requests for other owners" item from the handoffs and fold them into I1.

## 10. Handoff note template

`docs/roadmap/handoffs/<task-id>.md`:

```markdown
# <task-id> handoff

## Done
- What now works, in user terms.

## How to see it
- Route, role to sign in as, steps.

## Tests
- Commands run and results.

## Contract changes
- New exports added (never changed signatures).

## Requests for other owners
- File, what change, why.

## Known gaps
- Anything in the brief that is not done, and why.
```
