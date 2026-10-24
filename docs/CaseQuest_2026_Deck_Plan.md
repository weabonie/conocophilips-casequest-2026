# CaseQuest 2026: Lone Mesa Energy, Presentation Deck Plan

**Companion file:** `CaseQuest_2026_Findings.md` holds all data, cleaning, calculations and analysis. Every number below comes from it (recomputed from the cleaned workbook, Revision 5). If a number here and there ever disagree, the Findings file wins.

**Primary recommendation:** **O4 Critical Spare Parts Program at all 6 sites, Arroyo first, with all 11 open HSE actions closed in scope.**

**Structure (judge/mentor-recommended, 7 sections, 10 slides):** Problem & priority → Recommendation → Data & findings → Prototype & architecture → Business case & execution → Risks & success measures → Closing.

**Time limit:** the packet says **7 minutes maximum**. The mentor's sample ran 7–10 minutes (9:00 as shown). **Confirm on Discord.** Timings below are for 7:00. If 9:00 is confirmed, scale each section by about 1.28× and spend the extra time on the demo and the data slides.

**Case requirements checklist** (from the mentor slide): 1 practical recommendation (S2) · working prototype (S5–S6) · data validation and reliability (S4) · downtime-reduction estimate (S2, S7) · HSE considerations (S9, plus the HSE gate in the demo) · 12-month roadmap (S8).

**Mentor's guidance:** show only the evidence most important to the recommendation. The 100% early-warning result supports O1, not O4, so it gets one line in the closing and is held for Q&A.

| # | Section | Time | Slide | Rubric criteria it scores | Presenter |
|---|---|---|---|---|---|
| 1 | Problem & priority | 0:00–0:35 | S1 | Business problem (15) | ___ |
| 2 | Recommendation | 0:35–1:10 | S2 | Recommendation & costs (10) | ___ |
| 3 | Data & findings | 1:10–2:20 | S3, S4 | Data & evidence (20), storytelling bonus (5) | ___ |
| 4 | Prototype & architecture | 2:20–4:20 | S5, S6 | Technology (20), HSE (15) | ___ |
| 5 | Business case & execution | 4:20–5:40 | S7, S8 | Recommendation & costs (10), implementation (10) | ___ |
| 6 | Risks & success measures | 5:40–6:25 | S9 | HSE, security & responsible use (15), implementation (10) | ___ |
| 7 | Closing | 6:25–7:00 | S10 | Presentation & clarity (10) | ___ |

Every team member must present at least one section and be able to defend the numbers in the Q&A prep section at the bottom.

---

## S1, Problem & priority (0:00–0:35)

**Headline:** *Unplanned downtime cost Lone Mesa about $7.7M in 2025, and one site carries more than a third of it.*

**Opening hook (say it, don't put it on the slide):** "Across Lone Mesa, when a crew has to wait for a part, the outage runs 34 hours instead of 15. At Arroyo, that happens in more than half of all breakdowns."

**Stats on the slide**

| Tile | Value |
|---|---|
| Unplanned events | 313 |
| Unplanned downtime | 6,599 h |
| Lost oil | 165,679 bbl |
| Lost contribution margin | $5.61M |
| Known maintenance spend | $2.09M (+12 invoices pending, value unknown) |
| **Total unplanned impact** | **≈ $7.7M** |

**Priority callout: Arroyo (S04)**
- 3 of 18 assets (17%), but **30% of unplanned hours, 36% of lost margin ($2.02M), 40% of bearing-wear loss**
- Weakest site on every capacity measure: 42% spare fill, 92.8% network uptime, 2 technicians, 120 available project hours
- Its 3 assets (A010, A012, A011) are the 3 highest-loss assets in the company: $727k, $684k, $607k

**Visual:** a horizontal bar chart of lost margin by site (Arroyo $2.02M, Mesa $1.03M, Prairie $0.84M, Cedar $0.62M, Canyon $0.59M, Juniper $0.51M), with Arroyo in the accent color and the KPI tiles above it.

**Footer (data credibility):** *Unplanned events only. Lost margin = lost oil × (1 − recoverable fraction) × (price − variable cost), per asset-month. Recomputed from the cleaned dataset (Rev 5). Pending invoices are kept as unknown, not zero.*

---

## S2, Recommendation (0:35–1:10)

**Headline:** *Stock the right spares at all 6 sites, Arroyo first: $842k a year back for $247k.*

**What we propose:** O4 Critical Spare Parts Program at all 6 sites, Arroyo first. All 11 open HSE actions are closed in scope, and the 6 severity-5 actions are closed before go-live at Mesa, Arroyo and Prairie.

**Stats on the slide**

| Item | Value |
|---|---|
| Downtime avoided | **968 h a year** (15% of unplanned hours) |
| Margin avoided | **$842k a year** at full implementation, **≈ $770k in year one** (1-month lead time) |
| Year-1 cost | **$247k** (O4 $186k + HSE closure $61k) |
| Year-1 net | **+$523k to +$595k** |
| O4 year-1 return | **4.5×** (Arroyo alone 12.4×) |
| Lead time / prerequisites / training | 1 month / none / none |

**Visual:** a single "equation" graphic, **$247k → 968 h + $842k a year**, with three icons underneath: *Stock* (min/max spares), *Check* (pre-dispatch parts check), *Gate* (HSE hold until severity-5 actions are closed).

**Say:** "It's the fastest, cheapest lever that cuts downtime for every failure cause, not just one."

---

## S3, Data & findings: the pivot (1:10–1:45)

**Headline:** *Bearing wear is the biggest cause. Waiting for parts is the biggest delay we can cut across every cause.*

**Left panel, loss by cause**

| Cause | Hours | Lost margin | % |
|---|---|---|---|
| Bearing wear | 2,705 | $2.30M | 41% |
| Seal leak | 1,096 | $0.92M | 16% |
| Electrical trip | 1,012 | $0.90M | 16% |
| Process upset | 1,010 | $0.83M | 15% |
| Unknown | 775 | $0.66M | 12% |

**Right panel, loss by stage (with which options can cut it)**

| Stage | Hours | Lost margin | % | Cut by |
|---|---|---|---|---|
| Detect | 991 | $0.85M | 15% | O1 (mechanical only), O3 |
| Dispatch | 1,202 | $1.03M | 18% | O3 |
| **Parts wait** | **1,613** | **$1.40M** | **25%** | **O4, all causes** |
| Repair | 2,331 | $1.93M | 34% | O1, O5 (mechanical only) |
| Restart | 461 | $0.39M | 7% | none |

**Supporting stats**
- 95 of 313 outages (30%) waited for parts. They averaged **34.1 h vs 15.4 h** for the rest.
- Repair is the larger stage, but only bearing and seal repair can be cut, and no option cuts protected repair time.
- Spare fill and parts-wait rate move together. The 3 worst-stocked sites are the 3 highest-loss sites.

**Visuals**
1. Two side-by-side bar charts (cause | stage), with the parts-wait bar highlighted and labeled "cuttable across all causes."
2. *(Optional, small)* A scatter of spare fill % vs % of outages waiting for parts, 6 points: Arroyo 42/56, Mesa 65/38, Prairie 70/29, Canyon 78/22, Cedar 86/13, Juniper 92/10.

**Say:** "If you only look by cause, you'd fix bearings. Look at *where the hours go* inside each outage, and parts-wait is the biggest bucket any option can cut for every cause."

---

## S4, Data & findings: options tested + data reliability (1:45–2:20)

**Headline:** *We tested every option against the same 2025 events. O4 returns the most per dollar.*

**Main panel, options compared (annual avoided at full implementation, year-1 cost)**

| Option | Scope | Avoided hours | Avoided margin | Year-1 cost | Year-1 return |
|---|---|---|---|---|---|
| **O4 Critical spares** | 6 sites | **968** | **$842k** | **$186k** | **4.5×** |
| O3 Work-order workflow | 6 sites | 559 | $480k | $282k | 1.7× |
| O1 Condition monitoring | 18 assets | 689 | $574k | $505k | 1.1× |
| O5 Refurbishment | 12 pumps | 488 | $391k | $522k | 0.75× (+72 planned outage h) |

Notes for the slide (one line each):
- O3 and O4 are fully additive (different stages). O1 and O5 overlap (both cut bearing and seal repair), so they are never counted twice.
- No option prevents failures. Every option shortens outages.
- Stage reductions combine multiplicatively per the ReadMe overlap rule. Protected repair hours are never reduced.

**Data reliability strip (bottom of the slide)**

| Check | Result |
|---|---|
| Stage arithmetic | detect + dispatch + parts wait + repair + restart = stopped hours for **385 / 385** events |
| Capacity check | lost oil ÷ stopped hours = asset capacity for every event |
| Asset tags fixed | E0182–E0185 re-tagged to A010 (capacity and Production reconcile only with A010) |
| HSE duplicates | 72 rows → **36** unique (without this fix, open actions and costs double) |
| Broken formula | old "Total Estimated Financial Impact" $5.94M → **$5.61M** unplanned |
| Sensor readings | 6,173 valid used. 339 missing and 58 suspect excluded. 102 late readings, all at Arroyo |
| Legacy tags | 161 readings, 36 legacy tags mapped to 18 assets |
| Pending invoices | 14, kept **unknown, not zero** |

**Visual:** a horizontal bar chart of year-1 return (O4 4.5×, O3 1.7×, O1 1.1×, O5 0.75×) with a 1.0× break-even line. Show the reliability strip as small checkmark badges.

**Say:** "Before modelling anything, we validated the data. Every event's stages add up, and we fixed four mis-tagged events, duplicated HSE rows and a broken formula that overstated the loss."

---

## S5, Prototype & architecture (2:20–2:50)

**Headline:** *Critical Spares Control Tower: from event history to a reorder decision and a go/no-go.*

**Architecture (left to right)**

| Layer | Contents |
|---|---|
| Data sources | Assets, Events, Production, Readings, Solutions, HSE tabs |
| Cleaning layer | Trim and uppercase IDs, map legacy tags, °F → °C, exclude missing and suspect readings, pending invoices = unknown |
| Calculation engine | Lost-margin rule per asset-month, parts-wait $ at risk per asset, ReadMe overlap formula for options |
| Views | Overview · Reorder engine · Pre-dispatch check · HSE hold gate · Impact simulator · Data quality panel |
| Users and decisions | Maintenance planner approves reorders (**employee review step**). Technician checks parts before dispatch. **Site HSE supervisor authorizes go-live** (**HSE authorization step**). Manager tracks KPIs |

**Visual:** a swimlane workflow diagram with 4 lanes (Planner, Technician, HSE supervisor, Manager). Flow: *failure logged → parts check → if missing, reorder recommendation → planner approves → HSE gate check → dispatch*. Mark the two required steps (employee review, HSE authorization) with a distinct icon.

**Security and responsible use (small callout):** role-based access, so only the site HSE supervisor can clear the HSE hold. Every approval is logged with name and time. Recommendations are advisory, and a person always approves.

---

## S6, Prototype live demo (2:50–4:20, 90 seconds)

**Slide content:** a full-screen screenshot of the Overview view plus a link or QR code to the prototype. **Keep a backup screenshot for every demo step in case the Wi-Fi or the app fails.**

**Click path**

| Step | View | What to show | Number to say |
|---|---|---|---|
| a | Overview | Spare fill vs the 90% target by site | Arroyo 42%, Juniper 92% |
| b | Reorder engine | Arroyo assets ranked by parts-wait $ at risk. The planner reviews and **approves** a reorder | Arroyo O4 benefit $385k a year |
| c | Pre-dispatch check | Pick an Arroyo asset to see whether parts are on hand before the crew rolls | Outages that wait average 34.1 h vs 15.4 h |
| d | HSE hold gate | Arroyo shows **LOCKED**: 2 severity-5 actions on A010 (H2S, LOTO). The supervisor verifies closure, and the gate **UNLOCKS** | 6 severity-5 actions, 540–600 days overdue |
| e | Impact simulator | Select O4 at all sites, then add O3 | 968 h / $842k, then 1,527 h / $1.32M |
| f | Data quality panel (2-second glance) | Valid-reading share by site, cleaning log, pending invoices shown as unknown | Arroyo 12.3% missing, 9.3% late |

**Say at the gate step:** "Faster parts never means skipping isolation. Until the supervisor signs off, the site stays locked."

---

## S7, Business case & execution: costs, benefit, resources (4:20–5:00)

**Headline:** *Every site pays back in year one, and Arroyo alone delivers 46% of the benefit.*

**O4 by site**

| Site | Avoided hours | Avoided margin | Year-1 cost | Year-1 return |
|---|---|---|---|---|
| Arroyo | 387 | $385k | $31k | 12.4× |
| Mesa | 196 | $160k | $31k | 5.2× |
| Prairie | 149 | $123k | $31k | 4.0× |
| Canyon | 117 | $83k | $31k | 2.7× |
| Cedar | 66 | $54k | $31k | 1.7× |
| Juniper | 53 | $39k | $31k | 1.2× |
| **Total** | **968** | **$842k** | **$186k** | **4.5×** |

**Cost**

| Item | Setup | Annual | Year 1 |
|---|---|---|---|
| O4 × 6 sites (inventory audit and replenishment included) | $168,000 | $18,000 | $186,000 |
| HSE closure, all 11 actions | $59,500 | $1,500 | $61,000 |
| **Total** | **$227,500** | **$19,500** | **$247,000** |

**Resources:** 208 project hours needed (120 O4 install + 88 HSE) against 1,065 available. Arroyo, the tightest site, uses 44 of 120 h (37%). No new technician training is needed.

**Not claimed:** maintenance savings (per the ReadMe) and injury reductions.

**Visual:** a bar chart of avoided margin by site with a horizontal $31k cost line, so every bar clears the line. Put the cost table beside it.

---

## S8, Business case & execution: 12-month roadmap (5:00–5:40)

**Headline:** *Live at Arroyo in month 1, all 6 sites by month 3, then tune and scale.*

| Month | Action | Owner |
|---|---|---|
| 0–1 | Close the 6 severity-5 actions (Mesa, Arroyo, Prairie). Inventory audit at Arroyo. Set critical-spares min/max per asset | Site HSE supervisors, maintenance planner |
| 1 | **Arroyo go-live** after HSE closure is verified | Arroyo site lead, HSE supervisor |
| 1–2 | Mesa and Prairie go-live. Close the remaining containment actions (Cedar, Canyon) | Site leads, HSE supervisors |
| 2–3 | Canyon, Cedar and Juniper go-live. **All 6 sites live** | Site leads |
| 3–6 | Monthly KPI review, min/max tuning by asset | Maintenance planner, operations manager |
| 6 | First full-quarter review against KPI targets. Build the O3 business case *(proposed, confirm with team)* | Operations manager |
| 6–9 | O3 work-order workflow pilot at Arroyo, with O6 training and site cleanup *(proposed)* | Arroyo site lead |
| 9 | Go/no-go on an O1 condition-monitoring pilot at Arroyo (needs O2, O6 and edge buffering) *(proposed)* | Operations manager |
| 12 | Annual review: parts-wait hours vs the −645 h target, spare fill ≥ 90% at every site | Leadership |

**Visual:** a Gantt bar chart with 12 monthly columns. Color the go-live bars by site and the HSE closure bars in a separate color, and mark the month-1 Arroyo go-live milestone with a diamond.

---

## S9, Risks & success measures (5:40–6:25)

**Headline:** *Safety gates the rollout, and six KPIs prove it worked.*

**HSE (left half, the biggest block on the slide)**
- **6 severity-5 actions** (H2S monitoring readiness, LOTO / stored-energy isolation) at Mesa (A004), Arroyo (A010) and Prairie (A016). They were due Jan–Feb 2025 and are **540–600 days overdue**.
- **ReadMe gate:** an open severity-5 action blocks any pilot at that site. Our rollout locks those 3 sites until the site HSE supervisor verifies closure.
- The same 3 hazards repeat at Mesa, Arroyo and Prairie. That is a **systemic pattern**, so we close all 11 open actions, not just the 6 severity-5 ones ($59.5k setup, $1.5k a year, 88 h).
- Historical closures took 15 days, which fits inside O4's 1-month lead time.
- Faster parts **never shortcut LOTO or isolation**. Protected repair time is untouched.
- **No injury-rate claims**, because there is no exposure denominator. HSE benefits stay qualitative.

**Risks and safeguards (right half)**

| Risk | Safeguard |
|---|---|
| HSE closure slips at one site | The gate holds that site only. The other sites proceed on schedule |
| Too much inventory capital tied up | Min/max set per asset from parts-wait $ at risk, tuned monthly |
| Benefit overstated | Year one shown at ≈ $770k, not $842k. Pending invoices unknown. No maintenance savings claimed |
| Sensor data gaps at Arroyo (12.3% missing, 9.3% late) | O4 runs on event history and stock levels, not live sensors |
| Unauthorized override of the gate | Role-based access. Only the HSE supervisor can clear it, and every approval is logged |

**KPIs (bottom band)**

| KPI | Baseline | Target |
|---|---|---|
| Parts-wait hours | 1,613 h a year | −60% (≈ −645 h a year) |
| % of outages waiting for parts | Arroyo 56%, Mesa 38%, Prairie 29%, Juniper 10% | Every site ≤ Juniper's 10% |
| Spare fill % | Arroyo 42%, Mesa 65%, Prairie 70% | ≥ 90% at every site |
| Overdue severity-5 HSE actions | 6 | 0, verified closed |
| Unplanned downtime hours | 6,599 h | −968 h a year |
| Lost margin | $5.61M | −$842k a year |

---

## S10, Closing (6:25–7:00)

**Headline:** *Approve $247k to recover $842k a year, starting at Arroyo next month.*

**Three numbers on the slide:** **$247k** year-1 cost · **968 h / $842k** avoided a year · **6 → 0** overdue severity-5 actions.

**Requested decision:** approve the O4 program and HSE closure budget ($247k) and authorize the Arroyo go-live in month 1.

**What's next (one line plus a small visual):** O3 adds +559 h / +$480k (fully additive). Then O1 condition monitoring, backed by **100% early warning on 172 bearing and seal failures with zero false alarms**. End state with O1 + O3 + O4: **2,150 h and $1.84M a year**.

**Visual:** a staircase of 3 steps: O4 $842k → O3 + O4 $1.32M → O1 + O3 + O4 $1.84M.

---

## Q&A prep

**Numbers every member must defend:** $5.61M unplanned loss · ≈ $7.7M total impact · 968 h · $842k (≈ $770k year one) · $247k · 4.5× · Arroyo 36% / $2.02M / 1,986 h · 34.1 h vs 15.4 h · 6 severity-5 actions · 100% early warning, zero false alarms.

| Likely question | Answer |
|---|---|
| Why not fix bearings first? | O1 captures only about 25% of bearing loss (detection plus part of repair), costs about 2.7× O4 in year one ($505k), needs 4 prerequisites and a 3-month lead, and is blocked at Arroyo by HSE and the network. It is our next phase. |
| Where does the 60% parts-wait cut come from? | The base reduction fraction in the Solutions tab, applied to 2025 unplanned events. |
| Why is year one lower than $842k? | The 1-month lead time leaves about 11 months of benefit, ≈ $770k. |
| What about inventory carrying cost? | The Solutions tab's $3k a year per site is the only ongoing O4 cost in the dataset. We don't add costs that aren't in the data. |
| Will O4 reduce failures? | No. No option in the dataset prevents failures. O4 shortens outages by cutting parts-wait time. |
| What about electrical trips and process upsets ($1.73M)? | O4 and O3 reach them through parts-wait, detection and dispatch. No option targets their root cause, and that gap remains even at the end state. |
| Why is Arroyo 36% of loss but 30% of hours? | Each lost hour costs more there: about $1,017 of margin per hour at Arroyo ($2.02M ÷ 1,986 h) vs about $850 company-wide ($5.61M ÷ 6,599 h). Not yet verified whether capacity or price and cost drives it. Check the Assets and Production tabs before giving a reason. |
| How do you know the data is right? | Stage arithmetic reconciles for 385 / 385 events, the capacity check holds for every event, and the 6 fixes are logged in `Cleaning_Log` with raw values retained. |
| Is the 100% early warning overfitted? | It's a simple fixed rule (vibration ≥ 1.4× normal OR temperature ≥ normal + 8 °C, within 3 days). It flagged 0 of 141 non-mechanical events. It still needs validation on new data before an O1 rollout. |
