import { useState } from 'react'
import { Activity, Clock3, Droplets, LayoutDashboard, MapPin, ShieldAlert, X } from 'lucide-react'
import data from './data/operations.json'
import './App.css'

const positions = { S01: [22, 28], S02: [53, 20], S03: [76, 39], S04: [35, 60], S05: [67, 74], S06: [16, 82] }
const stages = [['detect', 'Detection'], ['dispatch', 'Dispatch'], ['parts_wait', 'Parts waiting'], ['repair', 'Repair'], ['restart', 'Restart']]
const number = (value, digits = 0) => value.toLocaleString('en-US', { maximumFractionDigits: digits })

export default function App() {
  const [selected, setSelected] = useState(null)
  const sites = data.sites.filter(site => !selected || site.id === selected)
  const active = data.sites.find(site => site.id === selected)
  const sum = key => sites.reduce((total, site) => total + site[key], 0)
  const stageTotals = stages.map(([key, label]) => ({ key, label, hours: sites.reduce((total, site) => total + site.stages[key], 0) }))
  const hours = sum('hours')
  const assets = sites.flatMap(site => site.assets.map(asset => ({ ...asset, site: site.name }))).sort((a, b) => b.partsHours - a.partsHours)
  const causes = Object.values(sites.flatMap(site => site.causes).reduce((result, cause) => {
    result[cause.name] ??= { name: cause.name, hours: 0, events: 0 }
    result[cause.name].hours += cause.hours
    result[cause.name].events += cause.events
    return result
  }, {})).sort((a, b) => b.hours - a.hours)

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview"><span className="brand-mark"><Activity size={17} /></span><span>Dashboard<small>Lone Mesa Energy</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <a className="nav-active" href="#overview"><LayoutDashboard size={18} /><span>Operations overview</span></a>
      <div className="sidebar-note">CASEQUEST 2026<small>Historical dataset · 2025</small></div>
      <div className="sidebar-footer">Lone Mesa Energy<small>6 sites · 18 assets</small></div>
    </aside>
    <main id="overview">
      <header className="topbar"><span>Workspace / Operations overview</span><span className="snapshot">● HISTORICAL SNAPSHOT</span></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">PRODUCTION & RELIABILITY</div><h1>Operations overview</h1><p>A clearer view of downtime. A better place to take action.</p></div><div className="period">Reporting period<strong>Jan – Dec 2025</strong></div></div>
        <div className="scope-bar"><div><strong>{active ? `${active.name} site` : 'All operations'}</strong><span>{sites.length} {sites.length === 1 ? 'site' : 'sites'} · {assets.length} assets</span></div>{selected && <button onClick={() => setSelected(null)}><X size={14} /> Clear site filter</button>}</div>
        <section className="metric-grid" aria-label="Selected operations metrics" aria-live="polite">
          {[
            ['Unplanned downtime', number(hours, 1), 'asset-hours', Clock3, `${sum('events')} unplanned events`],
            ['Unrecovered production', number(sum('netBbl')), 'barrels', Droplets, 'After assumed oil recovery'],
            ['Modeled lost contribution', `$${number(sum('loss') / 1000000, 2)}M`, '', Activity, 'Net barrels × contribution margin'],
            ['Parts waiting', number(stageTotals[2].hours, 1), 'asset-hours', Clock3, `${number(stageTotals[2].hours / hours * 100, 1)}% of unplanned downtime`],
          ].map(([label, value, unit, Icon, detail]) => <article className="metric" key={label}><div className="metric-label">{label}<Icon size={17} /></div><div className="metric-value">{value}<span>{unit}</span></div><div className="metric-detail">{detail}</div></article>)}
        </section>
        <div className="map-layout">
          <section className="panel map-panel"><div className="panel-heading"><div><h2>Explore your sites</h2><p>Select a site to filter every view below.</p></div><span className="tag">6 SITES</span></div>
            <div className="site-map" role="group" aria-label="Interactive schematic site map">
              <svg viewBox="0 0 800 460" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dbe5df" strokeWidth=".7" /></pattern></defs><rect width="800" height="460" fill="url(#grid)" /><path className="terrain" d="M-40 130 Q140 5 290 105 T850 45 M-40 155 Q140 30 290 130 T850 70 M-40 180 Q140 55 290 155 T850 95 M-40 205 Q140 80 290 180 T850 120 M-20 390 Q150 220 390 345 T850 300 M-20 415 Q150 245 390 370 T850 325 M-20 440 Q150 270 390 395 T850 350" /></svg>
              <span className="map-caption">LONE MESA / SITE NETWORK</span>
              {data.sites.map(site => <button key={site.id} className={`map-site ${selected === site.id ? 'selected' : ''} ${site.criticalActions ? 'has-hold' : ''}`} style={{ left: `${positions[site.id][0]}%`, top: `${positions[site.id][1]}%` }} aria-label={`${site.name}, ${number(site.hours, 1)} downtime asset-hours${site.criticalActions ? ', critical HSE actions open' : ''}`} aria-pressed={selected === site.id} onClick={() => setSelected(selected === site.id ? null : site.id)}><span className="pin"><MapPin size={18} /></span><span className="pin-label">{site.name}<small>{number(site.hours)} hrs</small></span></button>)}
              <span className="map-scale">SCHEMATIC · NOT GEOGRAPHIC</span>
            </div>
            <div className="map-footer"><span><i className="site-legend" />Site</span><span><i className="amber" />Critical HSE action open</span><button aria-pressed={!selected} onClick={() => setSelected(null)}>All sites</button></div>
          </section>
          <section className="panel site-summary"><div className="panel-heading"><div><div className="eyebrow">SELECTED SCOPE</div><h2>{active ? active.name : 'All sites'}</h2></div><MapPin size={20} /></div><p className="summary-intro">{active ? 'Site context for maintenance planning.' : 'Click a map marker to explore an individual site.'}</p>
            <dl><div><dt>Assets in scope</dt><dd>{assets.length}</dd></div><div><dt>Maintenance technicians</dt><dd>{sum('technicians')}</dd></div><div><dt>Critical spare fill rate</dt><dd>{active ? `${active.spareFill}%` : 'Select a site'}</dd></div><div><dt>Network uptime</dt><dd>{active ? `${active.network}%` : 'Select a site'}</dd></div></dl>
            <div className={`safety-note ${sum('criticalActions') ? 'hold' : ''}`}><ShieldAlert size={19} /><div><strong>{sum('criticalActions') ? `${sum('criticalActions')} critical HSE actions open` : 'No critical HSE actions open'}</strong><p>{sum('criticalActions') ? 'Affected site pilots require supervisor-verified closure.' : 'Review scoped HSE actions before authorizing a pilot.'}</p><small>HSE status as of Oct 1, 2026</small></div></div>
          </section>
        </div>
        <div className="analysis-grid">
          <section className="panel"><div className="panel-heading"><div><h2>Where time goes</h2><p>Five sequential stages of unplanned downtime</p></div><Clock3 size={18} /></div><div className="stacked-bar" aria-hidden="true">{stageTotals.map(stage => <span className={`stage-${stage.key}`} key={stage.key} style={{ width: `${stage.hours / hours * 100}%` }} />)}</div><div className="stage-list">{stageTotals.map(stage => <div key={stage.key}><span><i className={`stage-${stage.key}`} />{stage.label}</span><strong>{number(stage.hours, 1)} <small>hrs</small></strong><span>{number(stage.hours / hours * 100, 1)}%</span></div>)}</div></section>
          <section className="panel"><div className="panel-heading"><div><h2>Downtime by cause</h2><p>Confirmed post-event classifications</p></div><Activity size={18} /></div><div className="cause-list">{causes.map(cause => <div className="cause" key={cause.name}><div><span>{cause.name}</span><strong>{number(cause.hours, 1)} <small>hrs</small></strong></div><div className="cause-track"><span style={{ width: `${cause.hours / causes[0].hours * 100}%` }} /></div><small>{cause.events} events</small></div>)}</div></section>
        </div>
        <section className="panel assets-panel"><div className="panel-heading"><div><h2>Equipment priorities</h2><p>Ranked by time waiting for parts · {active ? active.name : 'all sites'}</p></div><span className="tag">{assets.length} ASSETS</span></div><div className="table-scroll"><table><thead><tr><th>Asset</th><th>Site</th><th>Equipment type</th><th>Events</th><th>Parts waiting</th><th>Total downtime</th><th>Lost contribution</th></tr></thead><tbody>{assets.map(asset => <tr key={asset.id}><td><span className="asset-id">{asset.id}</span></td><td>{asset.site}</td><td>{asset.type}</td><td>{asset.events}</td><td className="parts-cell">{number(asset.partsHours, 1)} hrs</td><td>{number(asset.hours, 1)} hrs</td><td>${number(asset.loss)}</td></tr>)}</tbody></table></div></section>
        <footer className="data-footer">Source: {data.source} · Verified export copies removed; IDs and units normalized. Unplanned events only. Map positions are illustrative.</footer>
      </div>
    </main>
  </div>
}
