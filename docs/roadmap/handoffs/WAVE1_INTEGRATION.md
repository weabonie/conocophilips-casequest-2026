# Wave 1 integration

Implemented W1–W10 in the shared checkout using separate feature owners, in batches within the available concurrency limit. Existing uncommitted work was preserved. No commits, pushes, dependency additions or deployments were made.

## Delivered

- Source-backed overview with preserved interactive map, six site cards, scatter plot, metric-selectable asset exposure, and all six site drilldowns.
- Receipt-aware warning replay, threshold charts, acknowledgement, justified false-alarm review, reorder and inter-site transfer proposals.
- Planner review, quantity changes, rejection, reservations, min/max decisions, transfer conservation and idempotent receipts.
- HSE evidence verification, named supervisor release, ready/live state transitions and relocking.
- Three-check dispatch planning, sample certification input and stock readiness; supervisor/field authorization remains separate.
- Source cleaning log, telemetry coverage/lag, unknown invoices and reconciliation evidence.
- Role-scoped activity filters, formula-safe filtered CSV export, persistent notification reads and in-app reminders.
- Overlap-safe impact model with four presets, explicit sensitivity assumptions, capacity, prerequisite costs and net ROI.
- Deterministic offline Copilot with permission-scoped record drawers and logged controlled-action refusals.
- Interactive architecture diagram, role landing page and global demo reset.

## Verification

- 100 tests pass under `node --test`; full lint and production build pass.
- Cloudflare deployment dry-run passes for Worker `casequest2026`; no deployment performed.
- Browser checks at 1440px and 375px: overview, Arroyo/Mesa site details, quality, activity, simulator and architecture; mobile HSE, warnings, reorders, dispatch and Copilot also checked. Page widths reconcile to viewport widths. Simulator intrinsic grid overflow fixed.
- Browser verified H007/H008 sample evidence → Mesa remains locked → named release → ready → planner-approved first receipt → live; live survives refresh. Reset then cleared the QA decisions.
- Verified warning-to-reorder staging, local-stock dispatch readiness, HSE blocking, Copilot source records and refusal, and manager CSV with precisely six filtered rows.
- Screenshot evidence generated under `/tmp/casequest-wave1-qa/`.

## Data and interpretation

- Controls: 313 unplanned events, 6,598.55 unplanned hours, $5,608,389.61 lost contribution margin, 6,570 readings, 12 actual source cleaning-log entries and 14 unknown pending invoice amounts.
- Named program estimates remain $721,000 staggered year one and $842,000 full year, separately from calculated sensitivity results.
- A011 leads historical parts-wait loss. A010 leads total historical loss and the explicitly conditional continuous-stop lead-time scenario. Sample lead days are editable, not a measured procurement forecast.
- Exact O4 core benefit is $667,402.03; the guide's $668k sums rounded site subtotals.
- Warning evidence is retrospective synthetic data. Two alert records were late or unmatched; no claim of validated zero false alarms.

## Prototype boundaries

- User resolved the master/guide approval conflict during integration: keep planner approval → receipt. Approval rights follow the source guide's planner-only decision matrix; no extra financial tiers are required.
- Live LLM streaming remains disabled. Client-switchable demo roles are not server authentication. `/api/copilot` validates inputs and returns an explicit offline response even if a secret exists; no external model calls or client keys.
- Stock, specifications, certification confirmation and named users are illustrative. No actual ordering, work permit, field dispatch, push or email delivery occurs.
- Browser activity is capped at 2,000 entries and editable through browser storage; it is not a regulated immutable archive.
- Production build retains a large main-chunk warning from bundled workbook data and spreadsheet parsing. Feature routes are lazy loaded.

Individual feature handoffs are alongside this file. The optional live gateway remains disabled; the approval workflow was explicitly resolved by the user as planner approval → receipt.
