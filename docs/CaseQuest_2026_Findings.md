# CaseQuest 2026: Lone Mesa Energy, Project Findings & Direction

**Purpose:** the single source of truth for stats, assumptions and direction. Every figure is recomputed from the **cleaned** shared workbook `CaseQuest2026Dataset-FINAL_.xlsx` (Revision 5, all fixes in §0.2 applied, re-downloaded 2026-10-24 14:40 CT) using the ReadMe rules.

**Presentation structure (judge-recommended, 7 sections, 10 slides):** Problem & priority → Recommendation → Data & findings → Prototype & architecture → Business case & execution → Risks & success measures → Closing. The full slide plan (timings, slide content, visuals, demo script, Q&A prep) lives in **`CaseQuest_2026_Deck_Plan.md`**. This file holds the data and analysis behind it.

**Primary recommendation:** **O4 Critical Spare Parts Program at all 6 sites, Arroyo first, with all 11 open HSE actions closed in scope.**

---

## 0. Data scope, cleaning & method

### 0.1 Scope

| Item | Value |
|---|---|
| Period | 2025 full year, 6 sites, 18 assets (6 transfer pumps, 6 lift pumps, 6 compressors) |
| Events | 385 unique events (E0001–E0385), no duplicate IDs: **313 unplanned**, 72 planned |
| Stage check | stopped_hours = detect + dispatch + parts_wait + repair + restart for all 385 rows (0 mismatches) |
| Capacity check | lost_oil_bbl / stopped_hours = asset capacity for every event (after the E0182–E0185 fix) |
| Readings | 6,570 daily readings (~365 per asset): 6,173 Valid, 339 Missing, 58 Suspect |
| HSE | 36 unique records (25 closed, 11 open) as of the 2026-10-01 snapshot |
| Production | 216 asset-months (18 × 12) |

### 0.2 Data fixes applied (logged in the workbook's `Cleaning_Log` tab, raw values retained)

| # | Sheet | Problem | Raw | Fixed | Impact on results |
|---|---|---|---|---|---|
| 1 | Events B183:B186 | **E0182–E0185 tagged to the wrong assets.** Their lost_oil ÷ stopped_hours = 35 bbl/h, which is A010's capacity, and Production reconciles only with A010 | A011, A012, A013, A014 | **A010** | Arroyo rises to 1,986 h / $2.02M (36%). Canyon drops to 845 h / $594k. Total loss rises from $5,607,576 to **$5,608,390** (A010 margin applied) |
| 2 | Production D7 | A001 June potential ≠ 720 h × 22 bbl/h | 16,368 | **15,840** | Production tab only. Event losses unaffected |
| 3 | Production D157 | A013 December potential ≠ 744 h × 21 bbl/h | 15,120 | **15,624** | Production tab only |
| 4 | HSE | **Every row duplicated** in the raw export (72 rows, 36 unique). FINAL file was already deduplicated; one blank table row removed | 72 rows | **36 rows** (H001–H036) | Without the dedupe, open actions, costs and hours double (22 actions, $119k) |
| 5 | Events D83:D97, D191:D199 | 24 end_utc values displayed date-only. The underlying timestamps were correct; only the cell format hid the time | Date format | yyyy-mm-dd hh:mm | None (display only) |
| 6 | Solutions rows 3–7 | Overwritten by accident during cleanup | — | Restored from source, checked cell by cell | None |

Raw-quality items handled in the calculations, not edited in the file:
- IDs with whitespace or lowercase are normalized (trim + upper) before joins.
- Fahrenheit-suffixed temperatures in the raw readings are converted to °C. The FINAL workbook already stores them as numeric °C.
- Capacities with units are parsed to numbers.

### 0.3 Formula problems fixed in the `Downtime Analysis` tab

| Problem | Before | After |
|---|---|---|
| Formulas pointed to a file on a teammate's laptop (`C:\Users\freda\Downloads\[CaseQuest2026Dataset_FINAL.xlsx]`) and read columns (Events AB, Production J) that didn't exist in the shared file. They showed stale cached values and broke to #VALUE! on refresh | External links | All formulas read this workbook's Events tab (helper columns Z–AD: Site, Unrecovered bbl, Month, Margin, Loss). Workbook Links list is empty |
| Seal leak loss overstated by $1,758.82 | $919,690.56 | **$917,931.74** |
| Combined mechanical loss overstated | $3,216,535.04 | **$3,214,776.21** |
| "Total Estimated Financial Impact" matched no definition (unplanned = $5,608,390; all events = $5,906,031) and was compared against unplanned-only figures | $5,943,392.20 | **$5,608,389.61**, relabeled "Total Unplanned Estimated Financial Loss ($)" |
| Label typos | "Electrical Tritp", "Combined Mechnaical", "Type Combined Mechanical Financial Loss ($)" | "Electrical Trip", "Combined Mechanical", "Combined Mechanical Estimated Financial Loss ($)" |
| Unlabeled stray values in P1, R1, T1 | 879.31, 545.78, … | These are mechanical stage hours. Now re-pointed and labeled: parts wait 879.31, detection 545.78, repair 1,448.80, dispatch 678.38, restart 249.07, total 3,801.34 h |
| Two junk named ranges (B16B17, E3E4) from a Name Box slip | — | Harmless. Delete via Formulas → Name Manager |

Corrected Downtime Analysis figures (unplanned):

| Metric | Value |
|---|---|
| Mechanical (bearing + seal) downtime | 3,801 h of 6,599 h = **57.6%** |
| Mechanical lost oil | 94,979 bbl of 165,679 bbl = **57.3%** |
| Mechanical unrecovered oil | 76,886 bbl (bearing 55,024 + seal 21,862) |
| Mechanical lost margin | **$3,214,776** (bearing $2,296,844 + seal $917,932) |

### 0.4 Data limitations kept as-is (ReadMe: cannot be restored)

| Item | Count | Handling |
|---|---|---|
| Missing sensor readings | 339 | Excluded. Only Valid readings are used |
| Suspect readings | 58 (average ~21.5 mm/s vibration, i.e. sensor glitches) | Excluded |
| Late readings (received > 6 h after observed) | 102, averaging ~30 h late, **all at Arroyo** | Only data that had been received is used |
| Legacy asset tags (e.g. `LEG-001`) | 161 readings, 36 distinct tags for 18 assets | Mapped through the provided asset_id |
| Pending parts invoices | 14 (12 unplanned, 2 planned) | Kept **unknown, not zero** |

### 0.5 Calculation rules

| Rule | Formula |
|---|---|
| Lost margin (per event) | `lost_oil_bbl × (1 − recoverable_fraction) × (price − variable_cost)`, using that asset-month's Production price and cost. lost_oil_bbl = capacity × stopped hours |
| Maintenance cost | `labor_hours × labor_rate + parts_usd + contractor_usd` |
| Overlapping options | Stage reductions multiply: remaining = original × Π(1 − r). Repair: protected + (repair − protected) × Π(1 − r). Protected repair hours are never reduced |
| Prerequisites | O1 needs O2 (once per org) + O6 + site cleanup + edge buffering where network uptime < 97%. O3 needs O6 + site cleanup. Shared prerequisites are paid once |
| Benefit basis | Base stage-reduction fractions from the Solutions tab, applied to 2025 unplanned events = annual avoided hours at full implementation |
| Do not | Add the monthly production shortfall to event losses (double count). Claim maintenance savings. Report injury rates |

---

## 1. Key Challenges (deck: S1 Problem & priority, S3 Data & findings)

### 1.1 Headline numbers (unplanned only)

| Metric | Value |
|---|---|
| Unplanned events | 313 |
| Unplanned downtime | **6,599 h** |
| Lost oil | 165,679 bbl |
| Lost contribution margin | **$5.61M** ($5,608,390) |
| Known maintenance spend | **$2.09M** (+12 unplanned invoices pending, value unknown) |
| Total unplanned impact | **≈ $7.7M** |
| Planned downtime (context only) | 72 events, 381 h, $298k (all events together: $5.91M) |

### 1.2 Loss by cause

| Cause | Events | Hours | Lost margin | % of loss | Maintenance $ |
|---|---|---|---|---|---|
| **Bearing wear** | 115 | 2,705 | **$2.30M** | **41%** | $826k |
| Seal leak | 57 | 1,096 | $0.92M | 16% | $376k |
| Electrical trip | 53 | 1,012 | $0.90M | 16% | $328k |
| Process upset | 52 | 1,010 | $0.83M | 15% | $348k |
| Unknown | 36 | 775 | $0.66M | 12% | $216k |
| **Total** | **313** | **6,599** | **$5.61M** | 100% | **$2.09M** |

- Bearing wear + seal leak (the mechanical causes) = **$3.21M, 57%** of loss and 57.6% of downtime hours.
- Electrical trip + process upset = **$1.73M, 31%**. No option targets these causes specifically; only O3 and O4 reach them.
- 36 events with an unknown cause = 775 h, $661k. Root cause is never recorded.

### 1.3 Loss by downtime stage (the key pivot)

| Stage | Hours | Lost margin | % of loss | Which options can cut it |
|---|---|---|---|---|
| Detect | 991 | $0.85M | 15% | O1 (bearing and seal only), O3 (all causes) |
| Dispatch | 1,202 | $1.03M | 18% | O3 (all causes) |
| **Parts wait** | **1,613** | **$1.40M** | **25%** | **O4 (all causes)** |
| Repair | 2,331 | $1.93M | 34% | O1, O5 (bearing and seal only) |
| Restart | 461 | $0.39M | 7% | none |

**Insight:** the biggest *cause* is bearing wear, but parts-wait is the biggest stage that any option can cut **across all causes**. Repair is larger, but only bearing and seal repair can be reduced. This is why the highest-yield fix is not the bearing fix.

Parts-wait detail:
- **95 of 313 outages (30%) waited for parts.** Those outages averaged **34.1 h** vs **15.4 h** for the rest, more than double.
- The share of outages that wait for parts tracks spare stock (see 1.4).

### 1.4 Site view

| Site | Events | Unplanned hours | Lost margin | % of loss | Maintenance $ | Network uptime | Technicians | Spare fill | % of outages waiting for parts | Avg detect / dispatch (h) | Available project hours |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Arroyo (S04)** | 68 | **1,986** | **$2.02M** | **36%** | $463k | **92.8%** | **2** | **42%** | **56%** | **4.8 / 5.8** | **120** |
| Mesa (S02) | 56 | 1,246 | $1.03M | 18% | $355k | 96.4% | 3 | 65% | 38% | 2.5 / 4.3 | 170 |
| Prairie (S06) | 55 | 1,080 | $0.84M | 15% | $378k | 97.4% | 3 | 70% | 29% | 2.4 / 3.9 | 165 |
| Cedar (S01) | 48 | 816 | $0.62M | 11% | $333k | 99.2% | 4 | 86% | 13% | 2.9 / 2.8 | 210 |
| Canyon (S05) | 46 | 845 | $0.59M | 11% | $295k | 98.1% | 3 | 78% | 22% | 3.0 / 3.0 | 180 |
| Juniper (S03) | 40 | 625 | $0.51M | 9% | $270k | 99.5% | 4 | 92% | 10% | 2.7 / 2.1 | 220 |

- Arroyo has 3 of 18 assets (17%) but 30% of unplanned hours, **36% of lost margin** and **40% of bearing-wear loss**. It is the weakest site on spare stock, network, staffing and project hours.
- **Spare fill and parts-wait rate move together:** Arroyo is 42% stocked and waits in 56% of outages. Juniper is 92% stocked and waits in 10%. The 3 worst-stocked sites (Arroyo, Mesa, Prairie) are the 3 highest-loss sites.
- Arroyo takes nearly twice as long as the other sites to detect (4.8 h vs 2.4–3.0 h) and dispatch (5.8 h vs 2.1–4.3 h), with only 2 technicians.

### 1.5 Asset view and age

| Asset | Site | Type | Age | Events | Hours | Lost margin |
|---|---|---|---|---|---|---|
| **A010** | Arroyo | Transfer pump | 15 | 23 | 599 | **$727k** |
| **A012** | Arroyo | Compressor | 14 | 23 | 691 | **$684k** |
| **A011** | Arroyo | Lift pump | 12 | 22 | 696 | **$607k** |
| **A004** | Mesa | Transfer pump | 13 | 17 | 391 | **$406k** |
| A018 | Prairie | Compressor | 8 | 20 | 448 | $352k |
| A005 | Mesa | Lift pump | 10 | 20 | 452 | $347k |
| A016 | Prairie | Transfer pump | 10 | 18 | 353 | $308k |
| A006 | Mesa | Compressor | 7 | 19 | 404 | $279k |

- The correlation between asset age and unplanned hours is **r = 0.75**. The 4 highest-loss assets are 12–15 years old.
- Criticality makes no difference: High and Medium assets have about the same downtime.

### 1.6 Sensor and data quality

| Site | Missing readings | Suspect | Received > 6 h late |
|---|---|---|---|
| **Arroyo** | **12.3%** | 0.5% | **9.3%** (102 readings, ~30 h late) |
| Mesa | 5.8% | 0.5% | 0% |
| Prairie | 5.4% | 0.8% | 0% |
| Canyon | 3.7% | 0.7% | 0% |
| Juniper | 2.1% | 0.9% | 0% |
| Cedar | 1.7% | 1.8% | 0% |

Arroyo's weak network (92.8% uptime) shows up directly in the data: it is the only site with late ingestion. Any monitoring at Arroyo requires edge buffering.

### 1.7 Early-warning signal (strongest data-story finding)

Rule: on any valid reading in the 3 days before an event, vibration ≥ 1.4 × normal **OR** temperature ≥ normal + 8 °C.

| Cause | Events flagged in advance |
|---|---|
| Bearing wear | **115 / 115 (100%)** |
| Seal leak | **57 / 57 (100%)** |
| Electrical trip | 0 / 53 |
| Process upset | 0 / 52 |
| Unknown | 0 / 36 |

- 479 alerts fired on valid readings. **All 479 came within 3 days before a bearing or seal failure, so there were zero false alarms.**
- The warning typically came about 2 days before the stop. Before mechanical failures, temperature ran about 10 °C above normal; before other failures it was about 2.7 °C above, which is normal day-to-day range.
- This is a clean, specific predictor for the mechanical causes. It belongs to O1, so in the deck it gets one line in the closing (S10) as the next phase and is held for Q&A.

### 1.8 HSE status (snapshot 2026-10-01)

**36 records: 25 closed, 11 open. All open actions are owned by the site HSE supervisor and all are overdue.**

| Site | Open actions | Severity-5 actions | Hazards | Setup $ | Annual $ | Person-hours |
|---|---|---|---|---|---|---|
| Cedar | 1 | 0 | Containment | 4,000 | 0 | 8 |
| **Mesa** | 3 | **2** (A004) | H2S, LOTO, containment | 13,500 | 500 | 24 |
| **Arroyo** | 3 | **2** (A010) | H2S, LOTO, containment | 16,500 | 500 | 24 |
| Canyon | 1 | 0 | Containment | 6,000 | 0 | 8 |
| **Prairie** | 3 | **2** (A016) | H2S, LOTO, containment | 19,500 | 500 | 24 |
| **Total** | **11** | **6** | | **$59,500** | **$1,500** | **88 h** |

- The 6 severity-5 actions (H2S monitoring readiness and LOTO / stored-energy isolation) were due in Jan–Feb 2025 and are **540–600 days overdue**.
- **Decision gate (ReadMe):** an open severity-5 action blocks *any* pilot at that site until the site HSE supervisor verifies closure. This blocks Mesa, Arroyo and Prairie.
- Closing only the severity-5 actions costs $33k setup, $1.5k a year and 48 h.
- The same 3 hazards repeat at Mesa, Arroyo and Prairie, which points to a systemic pattern rather than one-offs.
- All 5 open containment spills were fully recovered: spilled = recovered, so the net volume is 0 bbl.
- Every one of the 25 closed actions took exactly 15 days to close.
- Rules: no injury rates and no claims of incident prevention, because there is no exposure denominator. HSE benefits stay unquantified.

---

## 2. Solutions: impact, cost and ranking (deck: S4 Data & findings)

### 2.1 Option definitions (Solutions tab, base fractions)

| ID | Option | Unit | Setup | Annual | Lead time | Install hours | Reduces | Causes |
|---|---|---|---|---|---|---|---|---|
| O1 | Condition monitoring | Asset | $12,000 | $4,200 | 3 mo | 18 | Detect −60%, repair −25% | Bearing wear, seal leak |
| O2 | Data and alert platform | Organization | $40,000 | $18,000 | 2 mo | 60 | none (required for O1) | — |
| O3 | Work-order workflow | Site | $22,000 | $6,500 | 2 mo | 32 | Detect −20%, dispatch −30% | All unplanned |
| **O4** | **Critical spare parts** | **Site** | **$28,000** | **$3,000** | **1 mo** | **20** | **Parts wait −60%** | **All unplanned** |
| O5 | Mechanical refurbishment | Asset (pumps only) | $42,000 | $1,500 | 4 mo | 24 | Repair −50%; +6 planned outage hours per asset in year one | Bearing wear, seal leak |
| O6 | Digital training | Site | $6,000 | $1,200 | 1 mo | 0 | none (required for O1 and O3) | — |

Site add-ons:

| Site | Cleanup | Edge setup / yr | Training hours (technicians × hours per person) |
|---|---|---|---|
| Cedar | $6k | not needed | 48 (4 × 12) |
| Mesa | $14k | **$16k / $2.5k** (96.4% uptime) | 60 (3 × 20) |
| Juniper | $5k | not needed | 40 (4 × 10) |
| Arroyo | $22k | **$22k / $3.5k** (92.8% uptime) | 56 (2 × 28) |
| Canyon | $9k | not needed | 48 (3 × 16) |
| Prairie | $12k | not needed (97.4% uptime) | 54 (3 × 18) |
| **Total** | **$68k** | **$38k / $6k** | **306 h** |

### 2.2 Impact and cost comparison (annual, full implementation)

| Option / bundle | Scope | Avoided hours | Avoided margin | Setup | Annual | **Year-1 cost** | **Year-1 return** |
|---|---|---|---|---|---|---|---|
| **O4** | 6 sites | **968** | **$842k** | $168k | $18k | **$186k** | **4.5×** |
| O3 (+O6, cleanup) | 6 sites | 559 | $480k | $236k | $46.2k | $282k | 1.7× |
| O1 (+O2, O6, cleanup, edge) | 18 assets | 689 | $574k | $398k | $106.8k | $505k | 1.1× |
| O1 targeted (+O2, O6, cleanup, edge) | Arroyo A010–A012 | 188 | $188k | $126k | $35.3k | $161k | 1.2× |
| O5 | 12 pumps | 488 | $391k | $504k | $18k | $522k | 0.75× (plus 72 planned outage hours in year one) |
| O5 targeted | A004, A010, A016 | 123 | $132k | $126k | $4.5k | $131k | 1.0× (plus 18 planned outage hours) |
| O3 + O4 | 6 sites | 1,527 | $1.32M | $404k | $64.2k | $468k | 2.8× |
| O1 + O3 + O4 | full | 2,150 | $1.84M | $698k | $163.8k | $862k | 2.1× |
| O1 + O3 + O4 + O5 | full | 2,516 | $2.13M | $1.20M | $181.8k | $1.38M | 1.5× |

How the options interact:
- **O3 and O4 are fully additive** (559 + 968 = 1,527 h) because they cut different stages.
- **O1 and O5 overlap** because both cut bearing and seal repair. Together they give 1,054 h, not 1,177 h. Never count both as separate wins.
- O1 captures only about 25% of bearing-wear loss, because it cuts only detection and part of repair. That is why the largest cause does not give the largest yield.
- **No option prevents failures.** The Solutions tab models every option as shortening outages, not making them less frequent.
- Steady-state economics (after setup) improve sharply: O4 returns about $842k on $18k a year, and O3 about $480k on $46k a year.

### 2.3 O4 by site (Arroyo first)

| Site | Avoided hours | Avoided margin | Year-1 cost | Year-1 return |
|---|---|---|---|---|
| **Arroyo** | **387** | **$385k** | $31k | **12.4×** |
| Mesa | 196 | $160k | $31k | 5.2× |
| Prairie | 149 | $123k | $31k | 4.0× |
| Canyon | 117 | $83k | $31k | 2.7× |
| Cedar | 66 | $54k | $31k | 1.7× |
| Juniper | 53 | $39k | $31k | 1.2× |
| **Total** | **968** | **$842k** | **$186k** | **4.5×** |

Every site pays back in year one. Arroyo alone delivers 46% of O4's benefit.

### 2.4 O3 by site

| Site | Avoided hours | Avoided margin |
|---|---|---|
| Arroyo | 184 | $189k |
| Mesa | 101 | $85k |
| Prairie | 91 | $69k |
| Cedar | 69 | $51k |
| Canyon | 69 | $48k |
| Juniper | 46 | $38k |

### 2.5 O1 and O5 by asset (avoided hours / avoided margin)

| Asset | Site | Type | Age | O1 | O5 |
|---|---|---|---|---|---|
| **A012** | Arroyo | Compressor | 14 | **73 h / $73k** | n/a |
| **A010** | Arroyo | Transfer pump | 15 | **48 h / $59k** | **44 h / $54k** |
| **A011** | Arroyo | Lift pump | 12 | **66 h / $57k** | 55 h / $47k |
| A004 | Mesa | Transfer pump | 13 | 40 h / $43k | 45 h / $48k |
| A006 | Mesa | Compressor | 7 | 53 h / $36k | n/a |
| A005 | Mesa | Lift pump | 10 | 43 h / $34k | 55 h / $43k |
| A016 | Prairie | Transfer pump | 10 | 34 h / $30k | 35 h / $30k |
| A017 | Prairie | Lift pump | 7 | 45 h / $29k | 55 h / $35k |
| A007 | Juniper | Transfer pump | 4 | 31 h / $25k | 36 h / $30k |
| A015 | Canyon | Compressor | 9 | 29 h / $24k | n/a |
| A003 | Cedar | Compressor | 11 | 25 h / $24k | n/a |
| A001 | Cedar | Transfer pump | 9 | 29 h / $22k | 33 h / $25k |
| A002 | Cedar | Lift pump | 6 | 40 h / $22k | 45 h / $25k |
| A009 | Juniper | Compressor | 6 | 19 h / $22k | n/a |
| A018 | Prairie | Compressor | 8 | 26 h / $21k | n/a |
| A008 | Juniper | Lift pump | 5 | 32 h / $20k | 37 h / $22k |
| A014 | Canyon | Lift pump | 6 | 32 h / $19k | 29 h / $17k |
| A013 | Canyon | Transfer pump | 8 | 21 h / $15k | 20 h / $14k |

### 2.6 Ranking against the judging rubric (team judgment, 1–5 per criterion, weighted)

| Criterion (points) | O4 | O1 targeted | O3 | O5 |
|---|---|---|---|---|
| Business problem & prioritization (15) | 5 | 4 | 4 | 3 |
| Data analysis & evidence (20) | 4 | **5** | 3 | 3 |
| Technology design / dashboard (20) | 3 | **5** | 4 | 1 |
| HSE, security & responsible use (15) | 4 | 2 | 4 | 2 |
| Implementation & adoption (10) | **5** | 2 | 3 | 3 |
| Recommendation, costs & resources (10) | **5** | 2 | 3 | 1 |
| **Weighted score / 90** (presentation excluded) | **75** | 66 | 64 | 39 |

**Final ranking: O4 > O1 > O3 > O5**

- **O4:** highest yield and fastest (1 month), with no prerequisites and no training. It hits Arroyo hardest. Its weakness is the tech criterion, which the prototype has to make up for.
- **O1:** best data story (100% precursor capture, zero false alarms) and the best tech fit. But it has the weakest economics, 4 prerequisites, a 3-month lead, Arroyo's network problems, and an HSE block at the pilot site.
- **O3:** solid and stacks with O4, but it needs 306 training hours plus cleanup.
- **O5:** barely breaks even, adds planned outage hours, and requires LOTO work, which is an open severity-5 item.

---

## 3. The recommendation (deck: S2 Recommendation, S5–S6 Prototype, S7–S8 Business case, S9 Risks)

### 3.1 What we propose
**O4 Critical Spare Parts Program at all 6 sites, Arroyo first. All 11 open HSE actions are closed in scope, and the severity-5 actions are closed before go-live at Mesa, Arroyo and Prairie.**

### 3.2 Cost

| Item | Setup | Annual | Year 1 |
|---|---|---|---|
| O4 × 6 sites (inventory audit and replenishment included) | $168,000 | $18,000 | $186,000 |
| HSE closure, all 11 actions | $59,500 | $1,500 | $61,000 |
| **Total** | **$227,500** | **$19,500** | **$247,000** |

### 3.3 Benefit
- **968 unplanned hours and $842k margin avoided per year** at full implementation
- **Year-one benefit is lower:** with a 1-month lead, about 11 months of benefit ≈ **$770k**
- **Year-one net ≈ +$523k to +$595k** (year-one benefit vs full-year benefit, minus $247k)
- Not counted: maintenance savings. The ReadMe says historical maintenance is not automatically avoided.

### 3.4 Resources and workload

| Site | O4 install hours | HSE hours | Total | Available project hours | Fits? |
|---|---|---|---|---|---|
| Arroyo | 20 | 24 | 44 | 120 | Yes (37%) |
| Mesa | 20 | 24 | 44 | 170 | Yes |
| Prairie | 20 | 24 | 44 | 165 | Yes |
| Canyon | 20 | 8 | 28 | 180 | Yes |
| Cedar | 20 | 8 | 28 | 210 | Yes |
| Juniper | 20 | 0 | 20 | 220 | Yes |
| **Total** | **120** | **88** | **208** | 1,065 | |

No new technician training is required for O4.

### 3.5 HSE and responsible use
- The severity-5 gate is built into the rollout: Mesa, Arroyo and Prairie go live only after the site HSE supervisor verifies closure. Historical closures took 15 days, which fits inside O4's 1-month lead.
- O4 introduces no new field hazards. Faster parts availability must never shortcut LOTO or isolation steps: protected repair time is untouched.
- No injury-rate claims. HSE benefits stay qualitative.
- Prototype security: role-based access (only the site HSE supervisor can clear the HSE hold), every approval logged, and recommendations stay advisory with a person approving.

### 3.6 Roadmap (12 months)

| Month | Action |
|---|---|
| 0–1 | Close severity-5 actions (Mesa, Arroyo, Prairie). Inventory audit at Arroyo. Set critical-spares min/max per asset. |
| 1 | Arroyo go-live after HSE closure is verified |
| 1–2 | Mesa and Prairie go-live. Close the remaining containment actions (Cedar, Canyon). |
| 2–3 | Canyon, Cedar and Juniper go-live |
| 3–6 | Monthly KPI review and min/max tuning |
| 6 | First full-quarter KPI review. O3 business case *(proposed)* |
| 6–9 | O3 pilot at Arroyo with O6 training and cleanup *(proposed)* |
| 9 | Go/no-go on an O1 pilot at Arroyo (needs O2, O6, edge buffering) *(proposed)* |
| 12 | Annual review against KPI targets |

### 3.7 KPIs

| KPI | Baseline | Target |
|---|---|---|
| Parts-wait hours | 1,613 h a year; outages that waited averaged 34.1 h vs 15.4 h | −60% (about 645 h a year) |
| % of outages that wait for parts | Arroyo 56%, Mesa 38%, Prairie 29% … Juniper 10% | Every site ≤ Juniper level |
| Spare fill % | Arroyo 42%, Mesa 65%, Prairie 70% | ≥ 90% at every site |
| Overdue severity-5 HSE actions | 6 | 0, verified closed |
| Unplanned downtime hours | 6,599 | −968 a year |
| Lost margin | $5.61M | −$842k a year |

### 3.8 Prototype: "Critical Spares Control Tower"
The ReadMe requires useful outputs, an employee review step, an HSE hold/authorization step and a workflow visual. Static mockups do not qualify. Planned views (demo click path in `CaseQuest_2026_Deck_Plan.md`, S6):
1. **Overview:** spare fill % vs target by site, and parts-wait hours and $ by site and asset from the event history
2. **Reorder engine:** min/max and reorder recommendation per site and asset, prioritized by parts-wait $ at risk
3. **Technician pre-dispatch check:** "are parts on hand for this asset?" before a crew is dispatched
4. **HSE hold gate:** Mesa, Arroyo and Prairie stay locked until the severity-5 actions are verified closed by the site HSE supervisor (authorization step)
5. **Impact simulator:** pick sites and options to see avoided hours and $ using the ReadMe overlap formula
6. **Workflow / architecture diagram**
7. **Data quality panel** (supports the data-credibility bonus): the cleaning log, valid-reading share by site, and pending invoices shown as unknown

---

## 4. Next phase (deck: one line in S10 Closing; full detail held for Q&A)

1. **O3 Work-order workflow:** +559 h and +$480k a year, fully additive to O4 (different stages), for $282k in year one. It cuts detection and dispatch (Arroyo averages 4.8 h to detect and 5.8 h to dispatch with 2 technicians, vs 2.1–3.0 h at the best sites). It also makes technicians record a confirmed cause, which fixes the 36 unknown-cause events ($661k). O3 + O4 together give 1,527 h and $1.32M.
2. **O1 Condition monitoring, starting at Arroyo (A012, A010, A011):** +188 h and +$188k for $161k in year one. At all 18 assets it gives 689 h and $574k. Its evidence base is the 100% early-warning capture of bearing and seal failures with zero false alarms. It needs O2, O6, cleanup, and edge buffering at Arroyo (12.3% missing and 9.3% late readings) and at Mesa.
3. **O5 Refurbishment, oldest pumps only (A010, A004, A016):** +123 h and +$132k for $131k in year one, plus 18 planned outage hours. Justified by age correlating with unplanned hours (r = 0.75). Do not double-count with O1.
4. **End state, O1 + O3 + O4:** 2,150 h and $1.84M a year (33% of downtime) for $862k in year one and $164k a year after. Adding O5 brings it to 2,516 h and $2.13M.

Gaps that remain even at the end state: electrical trips and process upsets ($1.73M), the repair stage outside bearing and seal causes, and the restart stage ($0.39M) have no option in the dataset.

---

## 5. Messaging rules for the deck (slide-by-slide plan in `CaseQuest_2026_Deck_Plan.md`)
- Lead with the answer: the recommendation is on S2, within the first 70 seconds.
- Say "**bearing wear is the largest *cause* of loss**," not "the biggest problem." Then pivot to the stage view: the parts-wait stage is the largest cuttable bucket across *all* causes (S3).
- Pre-empt the judges' question "why not fix bearings first?" on S4: O1 captures only about 25% of bearing loss, costs about 2.7× O4 in year one, and is blocked at Arroyo by HSE and network issues. That is why it is the next phase.
- Show only evidence that supports the recommendation (mentor guidance). The early-warning result gets one line in the closing.
- Always pair the full-year and year-one numbers ($842k full year, ≈ $770k year one).
- Use **$5.61M** (unplanned) as the loss base. Never use the old $5.94M "Total Estimated Financial Impact"; it was a broken formula.
- Use the corrected Arroyo numbers: **36% of loss, $2.02M, 1,986 h** (after the E0182–E0185 fix). Older drafts saying 35% / $1.97M are pre-fix.
- Data cleaning goes in the S4 reliability strip and slide footers, not on its own slide. It supports the "Data storytelling and credibility" bonus: wrong asset tags fixed, HSE duplicates removed, broken formulas rebuilt, missing and suspect readings excluded, pending invoices kept unknown.
- Don't add the monthly production shortfall to event losses (double count).
- Don't claim maintenance cost savings or injury reductions.
- Every team member must be able to defend: $5.61M, 968 h, $842k, $247k, 6 severity-5 actions, Arroyo at 36%, and the 100% / zero-false-alarm early-warning result.
