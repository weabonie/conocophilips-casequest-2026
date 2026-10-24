import { useState } from 'react'
import { useData } from '../../app/DataContext.jsx'
import { useCurrentUser } from '../../domain/auth.js'
import { ACTIONS, can } from '../../domain/permissions.js'
import { calculateImpact, defaultScenario, IMPACT_PRESETS } from '../../domain/impactModel.js'
import { FULL_YEAR_BENEFIT_USD, YEAR_ONE_BENEFIT_USD } from '../../domain/constants.js'
import { resolveSource } from '../../domain/sources.js'
import { Banner, KpiTile, PageHeader, PermissionNote, Sourced } from '../../ui'
import './simulator.css'

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
const hours = value => value.toLocaleString('en-US', { maximumFractionDigits: 1 })
export default function Simulator() {
  const data = useData()
  const user = useCurrentUser()
  const allowedSites = data.sites.filter(site => can(user, ACTIONS.USE_SIMULATOR, { siteId: site.id }))
  const [scenario, setScenario] = useState(() => ({ ...defaultScenario(data), siteIds: allowedSites.map(s => s.id) }))
  const permitted = can(user, ACTIONS.USE_SIMULATOR)
  const validScenario = { ...scenario, siteIds: scenario.siteIds.filter(id => allowedSites.some(s => s.id === id)) }
  const result = permitted ? calculateImpact(data, validScenario, user) : null
  const update = (key, value) => setScenario(previous => ({ ...previous, [key]: value }))
  const toggle = (key, id) => update(key, scenario[key].includes(id) ? scenario[key].filter(value => value !== id) : [...scenario[key], id])
  const source = spec => resolveSource(data, spec)
  const eventSource = { label: 'Selected unplanned events: avoided hours = stage hours × combined reductions; avoided margin = event loss × avoided / stopped hours', columns: [{key:'id',label:'Event'}, {key:'siteId',label:'Site'}, {key:'cause',label:'Cause'}, {key:'stages',label:'Original stage hours'}, {key:'protectedRepairHours',label:'Protected repair hours'}, {key:'stoppedHours',label:'Stopped hours'}, {key:'lossUsd',label:'Lost margin'}], rows: data.events.filter(e => e.type === 'Unplanned' && validScenario.siteIds.includes(e.siteId)) }
  const costSource = { label: 'Scenario cost ledger: setup + full annual cost; shared prerequisites charged once', columns: [{key:'key',label:'Scope'}, {key:'label',label:'Item'}, {key:'setupUsd',label:'Setup USD'}, {key:'annualUsd',label:'Annual USD'}, {key:'hours',label:'Person-hours'}], rows: result?.costs || [] }
  return <div className="page-content simulator-page">
    <PageHeader title="Impact simulator" subtitle="Compare scheduling, spares and equipment options against the 2025 event history." />
    <Banner>These are modeled avoided downtime hours and contribution margin, not prevented failures or realized savings. Protected isolation and repair time stays intact.</Banner>
    {!permitted ? <PermissionNote>Scenario modeling is available to planners, site leads and operations managers.</PermissionNote> : <>
      <section className="panel simulator-controls" aria-label="Scenario controls">
        <h2>Choose a scenario</h2>
        <div className="simulator-presets">{IMPACT_PRESETS.map(preset => <button key={preset.id} onClick={() => setScenario({ ...defaultScenario(data), optionIds: preset.optionIds, siteIds: (preset.siteIds || data.sites.map(s => s.id)).filter(id => allowedSites.some(s => s.id === id)) })}>{preset.name}</button>)}</div>
        <div className="simulator-selection">
          <fieldset><legend>Sites within your role scope</legend>{allowedSites.map(site => <label key={site.id}><input type="checkbox" checked={scenario.siteIds.includes(site.id)} onChange={() => toggle('siteIds', site.id)} />{site.name}</label>)}</fieldset>
          <fieldset><legend>Options</legend>{data.solutions.filter(option => ['O1', 'O3', 'O4', 'O5'].includes(option.id)).map(option => <label key={option.id}><input type="checkbox" checked={scenario.optionIds.includes(option.id)} onChange={() => toggle('optionIds', option.id)} /><Sourced source={source({table:'solutions',filter:{ids:[option.id]}})}>{option.id} · {option.name}</Sourced></label>)}</fieldset>
        </div>
        <div className="simulator-sliders">
          <label>Assumed spare fill: {scenario.spareFillPct}%<input aria-label="Assumed spare fill" type="range" min="0" max="100" value={scenario.spareFillPct} onChange={e => update('spareFillPct', Number(e.target.value))} /><small>Sensitivity only: O4 reaches its source base effect at 90%. No historical stock-to-effect relationship is estimated.</small></label>
          <label>Early-warning adoption: {scenario.earlyWarningAdoptionPct}%<input aria-label="Early-warning adoption" type="range" min="0" max="100" value={scenario.earlyWarningAdoptionPct} onChange={e => update('earlyWarningAdoptionPct', Number(e.target.value))} /><small>Scales O1 stage reductions linearly; does not change its budget.</small></label>
          <label>Deployment month: {scenario.deploymentMonth ?? 'source lead time'}<input aria-label="Deployment month" type="range" min="0" max="12" value={scenario.deploymentMonth ?? 0} onChange={e => update('deploymentMonth', Number(e.target.value))} /><small>Benefit starts after this month or the longest selected source lead time, whichever is later.</small></label>
        </div>
        <label className="simulator-hse-toggle"><input type="checkbox" checked={scenario.includeHse} onChange={e => update('includeHse', e.target.checked)} />Budget all historically open HSE actions at selected sites</label>
        <p className="simulator-caption">Prerequisite closure is required before pilots at blocked sites even when excluded from this comparison budget. Historical actions remain the costing baseline after demo verification.</p>
      </section>
      <div className="simulator-kpis">
        <KpiTile label="Full-year avoided downtime" value={<Sourced source={eventSource}>{hours(result.avoidedHours)}</Sourced>} unit=" h" detail="Annual steady-state model" />
        <KpiTile label="Full-year avoided margin" value={<Sourced source={eventSource}>{money(result.avoidedMarginUsd)}</Sourced>} detail="Before setup and annual costs" />
        <KpiTile label="Year-one budget" value={<Sourced source={costSource}>{money(result.yearOneCostUsd)}</Sourced>} detail={`${money(result.setupUsd)} setup + ${money(result.annualUsd)} annual`} />
        <KpiTile label="Calculated year-one benefit" value={<Sourced source={eventSource}>{money(result.yearOneBenefitUsd)}</Sourced>} detail={`Net after budget: ${money(result.yearOneNetUsd)}`} />
      </div>
      <section className="panel simulator-rollout"><h2>Named recommendation estimates</h2><p><strong>{money(YEAR_ONE_BENEFIT_USD)} year-one staggered rollout</strong> · <strong>{money(FULL_YEAR_BENEFIT_USD)} full-year O4 benefit</strong></p><p>Roadmap decision D1: Arroyo month 1, Mesa and Prairie month 2, remaining sites month 3. These named presentation estimates remain separate from the custom timing calculation above.</p></section>
      <section className="panel simulator-resources"><h2>Site workload and implementation</h2><p className="simulator-caption">Person-hours include installation, shared training once and HSE closure when budgeted. Organization platform hours are shown separately.</p>
        <div className="simulator-table-scroll"><table><thead><tr><th>Site</th><th>Avoided h / year</th><th>Avoided margin / year</th><th>Project hours</th><th>Deployment</th><th>Capacity</th></tr></thead><tbody>{result.perSite.map(site => <tr key={site.siteId}><td>{site.name}</td><td><Sourced source={source(site.sources[0])}>{hours(site.avoidedHours)}</Sourced></td><td><Sourced source={source(site.sources[0])}>{money(site.avoidedMarginUsd)}</Sourced></td><td><Sourced source={source({table:'sites',filter:{siteId:site.siteId}})}>{hours(site.resourceHours)} / {hours(site.availableProjectHours)}</Sourced></td><td>Month {site.deploymentMonth}</td><td><span className={site.overCapacity ? 'simulator-over' : 'simulator-fit'}>{site.overCapacity ? 'Exceeds capacity' : 'Within capacity'}</span><meter min="0" max={Math.max(site.resourceHours,site.availableProjectHours)} value={site.resourceHours} aria-label={`${site.name} project hours`} /></td></tr>)}</tbody></table></div>
        <p>Total project effort: <Sourced source={costSource}>{hours(result.resourceHours)} person-hours</Sourced>. Organization-level platform work: {hours(result.organizationHours)} h, outside site capacity.</p>
        {result.plannedOutageHours > 0 && <Banner variant="warn">O5 also adds {hours(result.plannedOutageHours)} planned outage hours in year one. These are separate from the unplanned avoided hours and are not priced as additional savings.</Banner>}
      </section>
      <section className="panel simulator-method"><h2>How the calculation works</h2><p>For each eligible unplanned event and stage: remaining hours = original hours × product of (1 − each reduction). For repair, apply reductions only above protected repair hours. Event avoided margin = lost margin × avoided hours / stopped hours.</p><p>O3 and O4 affect different stages and add fully. O1 overlaps O3 detection and O5 repair, so combined reductions multiply. O5 applies to pumps only. Shared O6 training and cleanup are charged once per site; O2 once per organization; O1 edge buffering only below 97% network uptime.</p><p>Full-year benefit / year-one cost: {result.fullYearBenefitCostRatio == null ? 'unknown' : `${result.fullYearBenefitCostRatio.toFixed(2)}×`}. Year-one net ROI: {result.yearOneNetRoi == null ? 'unknown' : `${(result.yearOneNetRoi * 100).toFixed(1)}%`}. Timing-adjusted year-one benefit / cost: {result.yearOneReturn == null ? 'unknown' : `${result.yearOneReturn.toFixed(2)}×`}. No maintenance savings or HSE benefits are monetized.</p><div className="simulator-source-links"><Sourced source={source({table:'solutions'})}>Source solution rows</Sourced><Sourced source={eventSource}>Source event rows</Sourced><Sourced source={costSource}>Cost and resource ledger</Sourced>{scenario.includeHse && <Sourced source={source({table:'hseActions'})}>HSE closure costs</Sourced>}</div></section>
    </>}
  </div>
}
