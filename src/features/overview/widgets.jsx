import { useState } from 'react'
import { useData } from '../../app/DataContext'
import { useSiteSelection } from '../../app/SelectionContext'
import { programKpis, siteKpis, assetExposure } from '../../domain/metrics.js'
import { useSiteGateStatus } from '../../domain/hseGate.js'
import { resolveSource } from '../../domain/sources.js'
import { FILL_TARGET_PCT, FULL_YEAR_BENEFIT_USD, YEAR_ONE_BENEFIT_USD } from '../../domain/constants.js'
import { Sourced, KpiTile, StatusBadge, ConfidenceBadge } from '../../ui'
import './overview.css'
import { formatNumber } from './format.js'
export function SourceValue({ children, table = 'events', filter = {}, label = 'Source records' }) {
  const data = useData()
  return <Sourced source={{ table, filter, label }} resolve={spec => resolveSource(data, spec)}>{children}</Sourced>
}
export function KpiStrip({ siteId }) {
  const data = useData()
  const scoped = siteId ? { ...data, sites: data.sites.filter(s => s.id === siteId), events: data.events.filter(e => e.siteId === siteId), hseActions: data.hseActions.filter(a => a.siteId === siteId) } : data
  const kpi = programKpis(scoped)
  const filter = { siteId, type: 'Unplanned' }
  return <section className="overview-kpis" aria-label="Historical operations baseline">
    <KpiTile label="Parts-wait hours" value={<SourceValue filter={filter}>{formatNumber(kpi.partsWaitHours, 1)}</SourceValue>} unit="asset-hours" detail="2025 historical baseline" />
    <KpiTile label="Outages waiting for parts" value={<SourceValue filter={filter}>{formatNumber(kpi.partsWaitShare, 1)}%</SourceValue>} detail="Share of unplanned events with a parts wait" />
    <KpiTile label="Spare fill below target" value={<SourceValue table="sites" filter={{ siteId }}>{kpi.sitesBelowFillTarget} / {scoped.sites.length}</SourceValue>} unit="sites" detail={`Historical fill against ${FILL_TARGET_PCT}% planning target`} />
    <KpiTile label="Overdue severity-5 actions" value={<SourceValue table="hseActions" filter={{ siteId, ids: scoped.hseActions.filter(a => a.status === 'Open' && a.severity === 5 && a.daysOverdue > 0).map(a => a.id) }}>{kpi.overdueSev5}</SourceValue>} detail={`Imported baseline as of ${data.hseAsOf}; live gates below`} />
    <KpiTile label="Unplanned downtime" value={<SourceValue filter={filter}>{formatNumber(kpi.unplannedHours, 1)}</SourceValue>} unit="asset-hours" detail="All five downtime stages" />
    <KpiTile label="Modeled lost margin" value={<SourceValue filter={filter}>${formatNumber(kpi.lossUsd / 1000000, 2)}M</SourceValue>} detail="Unrecovered barrels × asset margin" />
  </section>
}
export function RolloutEstimate() {
  return <div className="overview-rollout"><strong>Program-wide O4 planning estimates</strong><span>Staggered year one: <SourceValue table="solutions" filter={{ ids: ['O4'] }} label="O4 source assumptions; named rollout estimates from Product Guide and D1">${formatNumber(YEAR_ONE_BENEFIT_USD)}</SourceValue></span><span>Full year: <SourceValue table="solutions" filter={{ ids: ['O4'] }} label="O4 source assumptions; full-year base-case estimate">${formatNumber(FULL_YEAR_BENEFIT_USD)}</SourceValue></span><small>Avoided lost margin, modeled estimates. Year one follows the named staggered rollout; benefits require implementation.</small></div>
}
function SiteCard({ site }) {
  const data = useData()
  const gate = useSiteGateStatus(site.siteId)
  const quality = data.dataQuality?.bySite?.[site.siteId]
  const filter = { siteId: site.siteId, type: 'Unplanned' }
  return <article className="panel overview-site-card"><div className="overview-card-heading"><h3><a href={`#/sites/${site.siteId}`}>{site.name}</a></h3><StatusBadge status={gate} /></div>
    <div className="overview-fill"><span>Historical critical spare fill</span><strong><SourceValue table="sites" filter={{ siteId: site.siteId }}>{site.spareFill}%</SourceValue></strong></div>
    <meter min="0" max="100" low="70" high="90" optimum="100" value={site.spareFill} aria-label={`${site.name} spare fill against ${FILL_TARGET_PCT}% target`} /><small>Planning target: {FILL_TARGET_PCT}%</small>
    <dl><div><dt>Outages waiting for parts</dt><dd><SourceValue filter={filter}>{formatNumber(site.partsWaitShare, 1)}%</SourceValue></dd></div><div><dt>Parts-wait margin exposure</dt><dd><SourceValue filter={filter}>${formatNumber(site.partsWaitUsd)}</SourceValue></dd></div><div><dt>Share of program loss</dt><dd><SourceValue filter={filter}>{formatNumber(site.lossShare, 1)}%</SourceValue></dd></div></dl>
    <ConfidenceBadge siteId={site.siteId} {...quality} /><a className="overview-detail-link" href={`#/sites/${site.siteId}`}>View site details →</a>
  </article>
}
export function SiteStatusCards({ siteId }) {
  const data = useData()
  const sites = siteKpis(data).filter(s => !siteId || s.siteId === siteId).sort((a, b) => b.partsWaitUsd - a.partsWaitUsd)
  return <section aria-label="Site readiness and exposure"><div className="overview-section-heading"><h2>Site readiness and exposure</h2><p>Ranked by historical parts-wait lost margin. Stock fill is a historical percentage, not an on-hand inventory count.</p></div><div className="overview-sites">{sites.map(site => <SiteCard key={site.siteId} site={site} />)}</div></section>
}
export function SiteScatter() {
  const data = useData()
  const sites = siteKpis(data)
  const { selectedSite, setSelectedSite } = useSiteSelection()
  const x = value => 55 + value / 100 * 570
  const y = value => 265 - value / 60 * 210
  return <section className="panel overview-scatter"><div className="panel-heading"><div><h2>Spare fill and parts waiting</h2><p>Historical association across sites. Select a labeled point to filter the overview.</p></div></div><svg viewBox="0 0 700 330" role="group" aria-labelledby="overview-scatter-title overview-scatter-desc"><title id="overview-scatter-title">Critical spare fill versus share of outages waiting</title><desc id="overview-scatter-desc">Each point represents a site. Use the site buttons below for the same values and filtering. The dashed vertical reference is the 90 percent fill target.</desc>
    {[0, 20, 40, 60].map(v => <g key={v}><line x1="55" x2="625" y1={y(v)} y2={y(v)} stroke="#e5e7eb" /><text x="46" y={y(v) + 4} textAnchor="end">{v}%</text></g>)}
    {[0, 20, 40, 60, 80, 100].map(v => <text key={v} x={x(v)} y="287" textAnchor="middle">{v}%</text>)}<line x1={x(90)} x2={x(90)} y1="35" y2="265" stroke="#f48120" strokeDasharray="5 4" /><text x={x(90) - 6} y="25" textAnchor="end">90% target</text><text x="335" y="318" textAnchor="middle">Historical critical spare fill</text><text transform="translate(15 155) rotate(-90)" textAnchor="middle">Outages waiting for parts</text>
    {sites.map(s => <g key={s.siteId} role="button" tabIndex="0" aria-label={`Filter ${s.name}, ${s.spareFill}% fill, ${formatNumber(s.partsWaitShare, 1)}% outages waiting`} aria-pressed={selectedSite === s.siteId} onClick={() => setSelectedSite(selectedSite === s.siteId ? null : s.siteId)} onKeyDown={e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); setSelectedSite(selectedSite === s.siteId ? null : s.siteId) } }}><circle cx={x(s.spareFill)} cy={y(s.partsWaitShare)} r={selectedSite === s.siteId ? 8 : 6} fill={selectedSite === s.siteId ? '#f48120' : '#374151'} /><text x={x(s.spareFill) - 9} y={y(s.partsWaitShare) - 11} textAnchor="end">{s.name}</text></g>)}
  </svg><div className="overview-scatter-legend">{sites.map(s => <div key={s.siteId}><button aria-pressed={selectedSite === s.siteId} onClick={() => setSelectedSite(selectedSite === s.siteId ? null : s.siteId)}>{s.name}</button><span><SourceValue table="sites" filter={{ siteId: s.siteId }}>{s.spareFill}% fill</SourceValue> · <SourceValue filter={{ siteId: s.siteId, type: 'Unplanned' }}>{formatNumber(s.partsWaitShare, 1)}% waiting</SourceValue></span></div>)}</div></section>
}
export function AssetLeaderboard({ siteId }) {
  const data = useData()
  const [ranking, setRanking] = useState('partsWaitUsd')
  const rows = assetExposure(data).filter(a => !siteId || a.siteId === siteId).sort((a, b) => b[ranking] - a[ranking])
  return <section className="panel assets-panel"><div className="panel-heading"><div><h2>Equipment priorities</h2><p>Historical modeled margin exposure. A011 leads parts-wait exposure; A010 leads total loss.</p></div><label className="overview-ranking">Rank by<select value={ranking} onChange={e => setRanking(e.target.value)}><option value="partsWaitUsd">Parts-wait lost margin</option><option value="lossUsd">Total lost margin</option></select></label></div><div className="table-scroll"><table><thead><tr><th>Asset</th><th>Site</th><th>Equipment type</th><th>Events</th><th>Parts wait</th><th>Parts-wait margin</th><th>Total lost margin</th></tr></thead><tbody>{rows.map(a => { const filter = { assetId: a.assetId, type: 'Unplanned' }; return <tr key={a.assetId}><td><strong>{a.assetId}</strong></td><td><a href={`#/sites/${a.siteId}`}>{data.sites.find(s => s.id === a.siteId)?.name}</a></td><td>{a.type}</td><td><SourceValue filter={filter}>{a.events}</SourceValue></td><td><SourceValue filter={filter}>{formatNumber(a.partsWaitHours, 1)} h</SourceValue></td><td><SourceValue filter={filter}>${formatNumber(a.partsWaitUsd)}</SourceValue></td><td><SourceValue filter={filter}>${formatNumber(a.lossUsd)}</SourceValue></td></tr> })}</tbody></table></div></section>
}
