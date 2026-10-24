# Critical Spares Control Tower: Product Guide

**What this is:** a description of what the product looks like and how people use it, written to guide whoever builds it. It does not cover technology choices. All numbers come from `CaseQuest_2026_Findings.md` (cleaned dataset, Revision 5).

**One-line pitch:** *The Control Tower makes sure the right part is on the shelf before the crew needs it, and stops any site from going live until its safety actions are verified closed.*

---

## 1. The problem the product solves

Waiting for parts is the biggest delay Lone Mesa can cut across every failure cause: **1,613 hours and $1.40M in 2025**. Outages that waited for parts averaged **34.1 hours**, against 15.4 hours for the rest. At Arroyo, crews waited for parts in **56%** of outages, and the site's spare stock was only **42%** filled.

The product supports the O4 Critical Spare Parts Program. It helps people:
1. Keep the right spares stocked at every site.
2. See a mechanical failure coming and get the part ready in advance.
3. Check for the part before a crew rolls, not after it arrives.
4. Keep gated sites locked until their severity-5 HSE actions are verified closed.
5. Prove the program is working.

---

## 2. Who uses it

| Role | What they decide | Where they spend their time |
|---|---|---|
| **Maintenance planner** | Which reorders to approve, edit or reject. Min/max levels per asset | Reorder queue, Early warning |
| **Technician / dispatcher** | Whether the crew can roll now or needs a part first | Pre-dispatch check (on a phone in the field) |
| **Site HSE supervisor** | Whether a site's safety actions are truly closed, which unlocks go-live | HSE gate |
| **Site lead** | Whether the site is ready and on track | Site page, Overview |
| **Operations manager / leadership** | Whether the program is paying off and where to expand next | Overview, Impact simulator, KPI page |

Each role has its own home screen showing only what that person needs to act on today.

---

## 3. Product principles

These rules shape every screen. If a design choice breaks one, change the design.

1. **The AI recommends, a person decides.** No purchase order is placed, no site goes live and no alert is dismissed without a named person approving it.
2. **Every number shows where it came from.** Tap any figure to see the events or readings behind it.
3. **Safety is never automated.** Only the site HSE supervisor can release the HSE gate. The AI cannot, the manager cannot, and "parts ready" never implies isolation steps can be skipped.
4. **Show the gaps, don't hide them.** Missing sensor readings, late data and pending invoices are visible wherever they affect a number.
5. **Honest numbers.** Year one is shown separately from full-year benefit. No maintenance savings or injury reductions are claimed.
6. **One decision per screen.** Each view answers one question for one role.

---

## 4. Product map

```
Home (role-based)
├── Overview ................. Is the program working? Where are we exposed?
├── Early warning ............ Which failures are coming, and is the part ready?   [AI]
├── Reorder queue ............ What should we buy, and why?                        [AI]
├── Pre-dispatch check ....... Can the crew roll now?
├── HSE gate ................. Which sites are locked, and what unlocks them?
├── Copilot .................. Ask a question in plain language                    [AI]
├── Impact simulator ......... What if we add O3, O1 or more sites?
├── Data quality ............. How much can we trust each site's data?
└── Activity log ............. Who approved what, and when
```

---

## 5. Screens

### 5.1 Overview
**Question it answers:** *Is the program working, and where are we most exposed?*

**What's on it:**
- **KPI tiles across the top:** parts-wait hours (baseline 1,613 h), share of outages waiting for parts, spare fill % against the 90% target, overdue severity-5 HSE actions (6 → 0), unplanned downtime hours, lost margin.
- **Site cards**, one per site, ordered by exposure. Each card shows spare fill as a gauge, share of outages waiting for parts, go-live status (Locked / Ready / Live) and dollars at risk. Arroyo appears first with 42% fill, 56% waiting and 36% of loss.
- **Spare fill vs parts-wait chart:** the six sites as dots. It shows the core finding at a glance: the less stock a site holds, the more often its crews wait.
- **Asset leaderboard:** the assets with the most parts-wait dollars at risk (A010, A012 and A011 at the top).

**Actions:** tap a site to open its site page. Tap any number to see its source.

### 5.2 Early warning and parts staging (AI)
**Question it answers:** *Which mechanical failures are likely in the next few days, and do we have the part?*

**How it behaves:** the system watches daily vibration and temperature for each asset. When vibration climbs to 1.4× normal or more, or temperature runs 8 °C or more above normal, it raises a warning. In 2025 this pattern preceded **all 172 bearing and seal failures**, about **2 days ahead**, with **no false alarms**.

**What's on it:**
- **Warning cards**, one per asset at risk: asset, site, likely issue (bearing or seal), the reading that triggered it, how long ago, and a small chart of recent readings against normal.
- **Part status on each card:** "Bearing kit on hand (2)" in green, or "Bearing kit not on hand" in red with a **Stage part** button.
- **Data confidence badge:** for example "Arroyo: 12% of readings missing, some arrive ~30 h late. A warning may be delayed."

**Actions:**
- **Stage part:** sends a rush reorder to the planner's queue, already filled in.
- **Acknowledge:** the planner confirms they've seen it. Warnings can't be silently dismissed.
- **Mark as false alarm:** requires a short reason, which is kept for review.

**What it does not do:** it does not predict electrical trips, process upsets or unknown-cause failures (the pattern doesn't apply to them). It does not order parts by itself. It never presents a warning as certain.

### 5.3 Reorder queue (AI-assisted)
**Question it answers:** *What should we buy, and why?*

**What's on it:**
- A ranked list of recommended reorders, highest **parts-wait dollars at risk** first. Each row shows site, asset, part type, quantity on hand vs min/max, recommended quantity, and reason.
- **Plain-language reason on every row**, written by the AI from the data. For example: *"A010 lost $727k of margin across 23 unplanned outages last year, the most of any asset. Bearing kit stock is 0, below the minimum of 2. Each hour A010 is down costs about $1,200 in margin."* (Stock and minimum are sample values in the prototype.)
- Rush reorders from Early warning appear at the top with a **Warning** tag.

**Actions:** **Approve**, **Edit quantity**, or **Reject with reason**. Nothing becomes a purchase order until the planner approves. Every decision goes into the Activity log.

**Settings (planner only):** min/max per asset and part, reviewed monthly. The screen suggests changes ("A011 hit zero stock twice this month, raise the minimum to 3?"), and the planner accepts or declines each one.

### 5.4 Pre-dispatch check
**Question it answers:** *Can the crew roll now?*

Designed for a phone, used in the field, readable at a glance.

**Flow:**
1. The dispatcher picks the asset (or scans a tag) and the reported symptom or cause.
2. The screen shows the **likely part** for that asset and cause, and whether it is **on hand, at another site, or not available**.
3. The result is one of three large banners:
   - **Green: Ready to dispatch.** Part on hand at [location].
   - **Amber: Part at another site.** Transfer from Mesa, estimated arrival shown. Dispatch and transfer run in parallel.
   - **Red: Part not available.** A rush reorder is created for the planner automatically. Dispatch only for diagnosis.
4. **Safety line, always shown:** *"Confirm LOTO and isolation before work begins."* It doesn't change based on parts status.

**Why it matters:** today crews often discover the missing part on site. This check moves that discovery to before the truck leaves.

### 5.5 HSE gate
**Question it answers:** *Which sites are locked, and what will unlock them?*

**What's on it:**
- One row per site with a large status: **LOCKED** (Mesa, Arroyo, Prairie until closure), **Clear** (Cedar, Canyon, Juniper), or **Live**.
- For a locked site, the open actions behind the lock. For example, Arroyo: *H2S monitoring readiness (A010), severity 5, 540+ days overdue* and *LOTO / stored-energy isolation (A010), severity 5*. Each shows owner, due date and days overdue.
- The other open actions (containment at Cedar and Canyon) appear in a separate list. They are tracked but don't block go-live.

**Unlocking a site:**
1. The site HSE supervisor opens each action and marks it **Verified closed**, adding a note and evidence (photo or document).
2. When every severity-5 action at the site is verified, the supervisor presses **Release site**. The product asks them to confirm by name.
3. The site flips to **Ready**, and the release is recorded in the Activity log with name and time.

**Rules the product enforces:** only the site HSE supervisor sees the Release button. The Copilot can explain the gate but cannot release it. A released site can be re-locked by the supervisor at any time.

### 5.6 Copilot (AI assistant)
**Question it answers:** whatever the user asks, in plain language.

A chat panel available from every screen. It answers questions using the product's own data and always shows where the answer came from.

**Good questions for it:**
- "Which Arroyo assets have the most parts-wait exposure?"
- "Why is A010 at the top of the reorder queue?"
- "What's blocking Mesa from going live?"
- "Draft a justification for the Arroyo bearing kit order."
- "How much downtime have we saved since go-live?"

**How answers look:**
- A short direct answer first, then the supporting numbers.
- A **Sources** line under every answer, such as "Events tab, 2025 unplanned, A010" or "HSE records H014, H015". Tapping it opens the underlying records.
- When the data can't answer the question, the Copilot says so. For example: "The dataset doesn't record which specific part each outage waited for, so I can't tell you that."

**What it can do:** explain, summarize, compare, draft text (reorder justifications, a weekly site summary, a note to a supplier), and take the user to the right screen.

**What it cannot do:** approve or place orders, release an HSE gate, change min/max levels, dismiss a warning, or estimate numbers that aren't in the data. Requests like these get a polite refusal and a link to the screen where the right person can act.

**Example exchange:**
> **Planner:** Why is A010 first on the list?
> **Copilot:** A010 has the highest parts-wait cost of any asset. It's Arroyo's transfer pump, 15 years old, and lost $727k of margin in 2025, the most in the company. It currently has no bearing kits on hand against a minimum of 2.
> *Sources: Events 2025 (A010, 23 unplanned outages) · current stock levels*

### 5.7 Impact simulator
**Question it answers:** *What happens if we expand the program?*

**What's on it:**
- Toggles for each site and each option: O4 spares, O3 work-order workflow, O1 condition monitoring, O5 refurbishment.
- Results that update immediately: hours avoided, margin avoided, year-one cost, year-one return, and resource hours vs available project hours per site.
- A results bar that stacks the options, so the user sees that O3 adds fully on top of O4, while O1 and O5 overlap and are never double-counted.

**Preset scenarios:**
| Scenario | Hours avoided / yr | Margin avoided / yr | Year-one cost |
|---|---|---|---|
| O4 at all 6 sites (recommended) | 968 | $842k | $186k (+$61k HSE) |
| O4 core: Arroyo, Mesa, Prairie | 732 | $668k | $93k |
| O3 + O4 | 1,527 | $1.32M | $468k |
| O1 + O3 + O4 | 2,150 | $1.84M | $862k |

**Always visible:** a note that full-year and year-one figures differ, and that no option prevents failures; they shorten outages.

### 5.8 Data quality
**Question it answers:** *How much can we trust each site's numbers?*

**What's on it:**
- Valid-reading share by site, with missing, suspect and late readings shown separately. Arroyo stands out: 12.3% missing and 9.3% late.
- The cleaning log: each fix made to the data, what it was before and after, and its effect (for example, four events re-tagged to A010, which raised Arroyo to 36% of loss).
- Pending invoices: 14, shown as **unknown**, never as zero.

**Where it shows up elsewhere:** a small confidence badge appears on any screen whose numbers depend on weak data, such as Early warning cards for Arroyo.

### 5.9 Activity log
**Question it answers:** *Who did what, and when?*

A searchable timeline of every approval, rejection, gate release, false-alarm flag and min/max change, with the person's name, role, time and stated reason. Read-only for everyone. Managers can export it for audits.

---

## 6. End-to-end stories

### Story 1: A bearing starts to fail at Arroyo
1. **Monday 6:00.** A010's temperature reads 11 °C above normal. Early warning raises a card: *likely bearing issue, about 2 days ahead*. The bearing kit is **not on hand**.
2. **Monday 7:15.** The planner opens the card, presses **Stage part**, and approves the rush reorder in the queue. The Copilot's drafted justification is attached.
3. **Tuesday afternoon.** The kit arrives at Arroyo. The card updates to *part on hand*.
4. **Wednesday.** A010 stops. The dispatcher runs the pre-dispatch check: **Green, ready to dispatch.** The crew confirms LOTO and isolation and starts the repair with no parts wait.

### Story 2: An electrical trip at Mesa, no warning
1. A005 trips. No early warning applies to electrical trips.
2. The dispatcher runs the pre-dispatch check: **Amber, part at Prairie.** A transfer starts while the crew heads out to diagnose.
3. The reorder engine notes Mesa fell below its minimum and adds a replenishment to the planner's queue.

### Story 3: Unlocking Arroyo for go-live
1. Month 0. Arroyo shows **LOCKED** with two severity-5 actions on A010.
2. The HSE supervisor completes the H2S readiness and LOTO work, uploads evidence, and marks each **Verified closed**.
3. The supervisor presses **Release site** and confirms by name. Arroyo flips to **Ready**, then **Live** once the first stock delivery lands.
4. The manager sees the change on Overview. The release appears in the Activity log.

### Story 4: Monthly review
1. The operations manager opens Overview: parts-wait hours are trending down, and Arroyo's fill has risen from 42% to 81%.
2. They ask the Copilot: "Which sites are still below 90% fill and why?"
3. They open the Impact simulator, toggle on O3 for Arroyo, and export the result for the month-6 business case.

---

## 7. Permissions

| Action | Technician / dispatcher | Planner | HSE supervisor | Site lead | Ops manager |
|---|---|---|---|---|---|
| View Overview, Data quality | ✓ | ✓ | ✓ | ✓ | ✓ |
| Run pre-dispatch check | ✓ | ✓ | | ✓ | |
| Stage a part from a warning | | ✓ | | ✓ | |
| Approve / reject reorders | | ✓ | | | |
| Change min/max levels | | ✓ | | | |
| Mark an HSE action verified closed | | | ✓ | | |
| Release or re-lock a site | | | ✓ | | |
| Use the Impact simulator | | ✓ | | ✓ | ✓ |
| Use the Copilot | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export the Activity log | | | ✓ | | ✓ |

The Copilot only answers within the asking person's permissions.

---

## 8. Notifications

| Trigger | Who is notified | How |
|---|---|---|
| Early warning raised and part not on hand | Planner, site lead | Push and on-screen |
| Rush reorder waiting more than 4 hours | Planner | Push reminder |
| Pre-dispatch result is Red | Planner, dispatcher | Push |
| Stock falls below minimum | Planner | Daily digest |
| Site released by HSE supervisor | Site lead, ops manager | On-screen and email |
| Severity-5 action newly overdue | HSE supervisor, site lead | Push and email |
| Monthly KPI summary | Ops manager, leadership | Email (Copilot-written, with sources) |

Notifications are kept few. A warning that has already been acknowledged doesn't notify again.

---

## 9. Language rules for the product

- Say "likely bearing issue," never "bearing will fail."
- Say "avoided downtime hours," never "prevented failures." No option prevents failures.
- Never show injury rates or claim incidents were prevented.
- Never claim maintenance cost savings.
- Always label year-one and full-year figures. The full-year figure is $842k. Year-one is lower because sites go live in stages: about $721k under the staggered rollout (Arroyo month 1, Mesa and Prairie month 2, the rest month 3).
- Show unknown values as "unknown," never as 0.
- Use site and asset names people already use (Arroyo, A010), not internal IDs alone.

---

## 10. Scope: prototype vs full product

| Capability | Prototype (judging, Oct 24) | Full product |
|---|---|---|
| Overview, site cards, KPIs | ✓ Built on 2025 data | Live data |
| Early warning | ✓ Replays 2025 readings to show warnings firing before real failures | Live readings, with Arroyo edge buffering |
| Reorder queue with reasons | ✓ Approve / edit / reject works | Connected to purchasing |
| Pre-dispatch check | ✓ With **sample stock levels**, labeled as such | Live inventory |
| HSE gate | ✓ Lock, verify, release flow works | Linked to the HSE system |
| Copilot | ✓ Answers from the 2025 dataset | Live data, more drafting tasks |
| Impact simulator | ✓ | ✓ |
| Data quality, Activity log | ✓ | ✓ |
| Inventory transfers between sites | Shown in the flow only | ✓ |
| Notifications | Mocked | ✓ |

**Say it plainly in the demo:** the dataset has no inventory or part-number tab. Stock levels in the prototype are sample values, set to match each site's reported spare fill (Arroyo 42%, Juniper 92%), and part types are defined per asset and cause ("bearing kit, A010").

---

## 11. How we'll know it works

| KPI | Baseline | Target | Where it appears |
|---|---|---|---|
| Parts-wait hours | 1,613 h/yr | −968 h (≈ 645 h remaining) | Overview |
| Share of outages waiting for parts | Arroyo 56%, Mesa 38%, Prairie 29% | Every site ≤ 10% (Juniper's level) | Overview, site cards |
| Spare fill | Arroyo 42%, Mesa 65%, Prairie 70% | ≥ 90% at every site | Overview gauges |
| Overdue severity-5 HSE actions | 6 | 0, verified | HSE gate |
| Unplanned downtime | 6,599 h | −968 h/yr | Overview |
| Lost margin | $5.61M | −$842k/yr at full run | Overview |
| Warnings with part ready in time | n/a (new) | Tracked from go-live | Early warning |
| Reorders approved within 4 h | n/a (new) | Tracked from go-live | Reorder queue |

---

## 12. 90-second demo path

| Time | Screen | Show | Say |
|---|---|---|---|
| 0:00 | Overview | Arroyo at 42% fill, 56% of outages waiting | "Less stock, more waiting. Arroyo is the worst on both." |
| 0:15 | Early warning | Replay A010: the warning fires 2 days before a real 2025 bearing failure. Part not on hand | "Every bearing and seal failure last year gave this signal first." |
| 0:30 | Reorder queue | Planner approves the staged reorder; the AI reason is visible | "The AI recommends, the planner decides." |
| 0:45 | Pre-dispatch | Asset A010 → Green banner, with the LOTO line | "The crew knows before the truck leaves." |
| 1:00 | HSE gate | Arroyo LOCKED → supervisor verifies → Release | "Faster parts never means skipping isolation." |
| 1:15 | Copilot | "What's blocking Mesa?" Answer with sources | "Every answer shows where it came from." |
| 1:25 | Impact simulator | O4 → add O3 | "968 hours and $842k, then 1,527 hours with O3." |

Keep a screenshot of every step in case the live demo fails.

---

## 13. Open questions for the team

1. **Year-one figure:** the deck uses ≈ $770k, which assumes all sites are live from month 1. This guide uses ≈ $721k to match the staggered roadmap. Pick one and use it everywhere.
2. **Lead time vs warning time:** warnings come about 2 days ahead. Can a rush part reach Arroyo in under 2 days? If not, staging works only when a nearby site has stock, which makes inter-site transfers part of the core product, not a later add-on.
3. **Product name:** keep "Critical Spares Control Tower," or shorten it for the slides?
4. **Copilot scope in the demo:** live questions are a risk on stage. Consider two or three rehearsed questions.
