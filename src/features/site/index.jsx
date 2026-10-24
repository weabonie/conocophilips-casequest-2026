import { useData } from '../../app/DataContext'
import { useSiteSelection } from '../../app/SelectionContext'
import { siteKpis } from '../../domain/metrics.js'
import { useSiteGateStatus, blockingActions } from '../../domain/hseGate.js'
import { useCurrentUser } from '../../domain/auth.js'
import { can, ACTIONS } from '../../domain/permissions.js'
import { StatusBadge, ConfidenceBadge, EmptyState } from '../../ui'
import { KpiStrip, AssetLeaderboard, SourceValue } from '../overview/widgets'
import { formatNumber } from '../overview/format.js'
import './site.css'
function SiteDetail({ site }) {
  const data = useData()
  const user = useCurrentUser()
  const { setSelectedSite } = useSiteSelection()
  const gate = useSiteGateStatus(site.id)
  const kpi = siteKpis(data).find(s => s.siteId === site.id)
  const actions = blockingActions(data, site.id)
  const events = data.events.filter(e => e.siteId === site.id && e.type === 'Unplanned').sort((a, b) => b.startUtc.localeCompare(a.startUtc))
  const quality = data.dataQuality?.bySite?.[site.id]
  return <div className="page-content site-page"><a href="#/overview">← Operations overview</a><div className="page-heading"><div><div className="eyebrow">Site detail / {site.id}</div><h1>{site.name}</h1><p>Historical operations, asset exposure and current prototype pilot readiness.</p></div><StatusBadge status={gate} /></div>
    <KpiStrip siteId={site.id} />
    <div className="site-detail-grid"><section className="panel site-context"><h2>Site context</h2><dl><div><dt>Critical spare fill</dt><dd><SourceValue table="sites" filter={{ siteId: site.id }}>{site.spareFill}%</SourceValue></dd></div><div><dt>Outages waiting for parts</dt><dd><SourceValue filter={{ siteId: site.id, type: 'Unplanned' }}>{formatNumber(kpi.partsWaitShare, 1)}%</SourceValue></dd></div><div><dt>Share of program lost margin</dt><dd><SourceValue filter={{ siteId: site.id, type: 'Unplanned' }}>{formatNumber(kpi.lossShare, 1)}%</SourceValue></dd></div><div><dt>Maintenance technicians</dt><dd><SourceValue table="sites" filter={{ siteId: site.id }}>{site.technicians}</SourceValue></dd></div></dl><ConfidenceBadge siteId={site.id} {...quality} /><p>Historical fill is a source percentage. Available quantities in planning tools are labeled sample stock.</p></section>
    <section className="panel site-context"><h2>HSE pilot gate</h2><StatusBadge status={gate} /><p><SourceValue table="hseActions" filter={{ ids: actions.map(a => a.id) }}>{actions.length}</SourceValue> imported open severity-5 actions still need supervisor verification.</p><p>Verification and pilot release are recorded separately. A parts receipt after clearance marks the prototype pilot live. Field work requires approved isolation and permit procedures.</p><a href="#/hse" onClick={() => setSelectedSite(site.id)}>Review this site's HSE gate →</a></section></div>
    <nav className="site-feature-links" aria-label="Site workflows"><a href="#/equipment" onClick={() => setSelectedSite(site.id)}>Equipment &amp; Health</a>{can(user, ACTIONS.STAGE_PART, { siteId: site.id }) && <a href="#/reorders" onClick={() => setSelectedSite(site.id)}>Plan spares</a>}{can(user, ACTIONS.RUN_DISPATCH_CHECK, { siteId: site.id }) && <a href="#/dispatch" onClick={() => setSelectedSite(site.id)}>Pre-dispatch check</a>}<a href="#/data-quality" onClick={() => setSelectedSite(site.id)}>Data quality</a></nav>
    <AssetLeaderboard siteId={site.id} />
    <section className="panel site-events"><div className="panel-heading"><div><h2>Unplanned event history</h2><p>Historical records, newest first. Open a value to inspect its complete source event.</p></div></div><div className="table-scroll"><table><thead><tr><th>Event</th><th>Asset</th><th>Started (UTC)</th><th>Confirmed cause</th><th>Stopped</th><th>Parts wait</th><th>Lost margin</th><th>Parts cost</th></tr></thead><tbody>{events.map(e => <tr key={e.id}><td><SourceValue filter={{ ids: [e.id] }}>{e.id}</SourceValue></td><td>{e.assetId}</td><td>{e.startUtc.slice(0, 16).replace('T', ' ')}</td><td>{e.cause}</td><td><SourceValue filter={{ ids: [e.id] }}>{formatNumber(e.stoppedHours, 1)} h</SourceValue></td><td><SourceValue filter={{ ids: [e.id] }}>{formatNumber(e.stages.partsWait, 1)} h</SourceValue></td><td><SourceValue filter={{ ids: [e.id] }}>${formatNumber(e.lossUsd)}</SourceValue></td><td><SourceValue filter={{ ids: [e.id] }}>{e.partsUsd == null ? 'unknown (pending invoice)' : `$${formatNumber(e.partsUsd)}`}</SourceValue></td></tr>)}</tbody></table></div></section>
  </div>
}
export default function SiteScreen({ siteId }) {
  const data = useData()
  const site = data.sites.find(s => s.id === siteId)
  return site ? <SiteDetail site={site} /> : <div className="page-content"><EmptyState title="Site not found" description="Choose a site from Operations overview." /><a href="#/overview">Open overview</a></div>
}
