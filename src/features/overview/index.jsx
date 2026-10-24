import { Activity, Clock3, MapPin, ShieldAlert, X } from 'lucide-react'
import { useData } from '../../app/DataContext'
import { useSiteSelection } from '../../app/SelectionContext'
import terrainMap from '../../assets/terrain-map.jpg'
import './overview.css'
import { KpiStrip, RolloutEstimate, SiteStatusCards, SiteScatter, AssetLeaderboard, SourceValue } from './widgets'
const positions = { S01: [22, 28], S02: [53, 21], S03: [73, 28], S04: [35, 58], S05: [62, 54], S06: [20, 72] }
const stages = [
  ['detect', 'Detection'],
  ['dispatch', 'Dispatch'],
  ['parts_wait', 'Parts waiting'],
  ['repair', 'Repair'],
  ['restart', 'Restart'],
]
const number = (value, digits = 0) => value.toLocaleString('en-US', { maximumFractionDigits: digits })

export default function Overview() {
  const data = useData()
  const { selectedSite: selected, setSelectedSite: setSelected } = useSiteSelection()
  const sites = data.sites.filter((site) => !selected || site.id === selected)
  const active = data.sites.find((site) => site.id === selected)
  const sum = (key) => sites.reduce((total, site) => total + site[key], 0)
  const stageTotals = stages.map(([key, label]) => ({
    key,
    label,
    hours: sites.reduce((total, site) => total + site.stages[key], 0),
  }))
  const hours = sum('hours')
  const assets = sites
    .flatMap((site) => site.assets.map((asset) => ({ ...asset, site: site.name })))
    .sort((a, b) => b.partsHours - a.partsHours)
  const causes = Object.values(
    sites
      .flatMap((site) => site.causes)
      .reduce((result, cause) => {
        result[cause.name] ??= { name: cause.name, hours: 0, events: 0 }
        result[cause.name].hours += cause.hours
        result[cause.name].events += cause.events
        return result
      }, {})
  ).sort((a, b) => b.hours - a.hours)

 return (
          <div className="page-content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">Production &amp; Reliability</div>
                <h1>Operations overview</h1>
                <p>Production impact, downtime, and maintenance priorities.</p>
              </div>
              <div className="period">
                Reporting period<strong>Jan – Dec 2025</strong>
              </div>
            </div>

            <div className="scope-bar">
              <div>
                <strong>{active ? `${active.name} site` : 'All operations'}</strong>
                <span>
                  <SourceValue table="sites" filter={{ siteId: selected }}>{sites.length} {sites.length === 1 ? 'site' : 'sites'}</SourceValue> · <SourceValue table="equipment" filter={{ siteId: selected }}>{assets.length} assets</SourceValue>
                </span>
              </div>
              {selected && (
                <button onClick={() => setSelected(null)}>
                  <X size={14} /> Clear site filter
                </button>
              )}
            </div>

            <KpiStrip siteId={selected} />
            <RolloutEstimate />

            <div className="map-layout">
              <section className="panel map-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Explore your sites</h2>
                    <p>Select a site to filter operations metrics and tables.</p>
                  </div>
                  <span className="tag"><SourceValue table="sites">{data.sites.length} Sites</SourceValue></span>
                </div>
                <div className="site-map" role="group" aria-label="Interactive terrain and ocean site map">
                  <img
                    src={terrainMap}
                    alt="Illustrative terrain backdrop for the six site filters"
                    className="site-map-img"
                  />
                  <svg viewBox="0 0 800 460" preserveAspectRatio="none" className="site-map-overlay" aria-hidden="true">
                    <defs>
                      <filter id="route-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
                      </filter>
                    </defs>
                    {/* Coordinate grid lines */}
                    <g className="map-grid-lines" opacity="0.22" stroke="#ffffff" strokeWidth="0.65" strokeDasharray="3 5">
                      <line x1="200" y1="0" x2="200" y2="460" />
                      <line x1="400" y1="0" x2="400" y2="460" />
                      <line x1="600" y1="0" x2="600" y2="460" />
                      <line x1="0" y1="150" x2="800" y2="150" />
                      <line x1="0" y1="300" x2="800" y2="300" />
                    </g>
                    {/* Geographic & Hydrographic markings */}
                    <text x="710" y="425" className="map-geo-label ocean-text">COASTAL BASIN</text>
                    <text x="730" y="90" className="map-geo-label ocean-text">SHALLOW SHELF</text>
                    <text x="500" y="190" className="map-geo-label land-text">MESA DELTA</text>
                    <text x="90" y="65" className="map-geo-label land-text">CEDAR HIGHLANDS</text>
                    {/* Inter-site pipeline and telemetry network */}
                    <g className="network-routes" filter="url(#route-shadow)">
                      <path d="M 176 129 Q 300 95 424 97" className={`route-line ${selected === 'S01' || selected === 'S02' ? 'active' : ''}`} />
                      <path d="M 424 97 Q 504 100 584 129" className={`route-line ${selected === 'S02' || selected === 'S03' ? 'active' : ''}`} />
                      <path d="M 176 129 Q 215 200 280 267" className={`route-line ${selected === 'S01' || selected === 'S04' ? 'active' : ''}`} />
                      <path d="M 280 267 Q 390 250 496 248" className={`route-line ${selected === 'S04' || selected === 'S05' ? 'active' : ''}`} />
                      <path d="M 280 267 Q 215 305 160 331" className={`route-line ${selected === 'S04' || selected === 'S06' ? 'active' : ''}`} />
                      <path d="M 496 248 Q 555 185 584 129" className={`route-line ${selected === 'S05' || selected === 'S03' ? 'active' : ''}`} />
                    </g>
                  </svg>
                  <span className="map-caption">ILLUSTRATIVE SITE LOCATIONS / SELECT TO FILTER</span>
                  <div className="map-compass" title="North orientation" aria-hidden="true">
                    <span className="compass-arrow">▲</span>
                    <span className="compass-n">N</span>
                  </div>
                  {data.sites.map((site) => (
                    <button
                      key={site.id}
                      className={`map-site ${selected === site.id ? 'selected' : ''} ${site.criticalActions ? 'has-hold' : ''}`}
                      style={{ left: `${positions[site.id][0]}%`, top: `${positions[site.id][1]}%` }}
                      aria-label={`${site.name}, ${number(site.hours, 1)} downtime asset-hours${site.criticalActions ? ', critical HSE actions open' : ''}`}
                      aria-pressed={selected === site.id}
                      onClick={() => setSelected(selected === site.id ? null : site.id)}
                    >
                      <span className="pin">
                        <MapPin size={18} />
                      </span>
                      <span className="pin-label">
                        {site.name}
                        <small>Explore site</small>
                      </span>
                    </button>
                  ))}
                  <span className="map-scale">Illustrative map; coordinates and routes are not surveyed</span>
                </div>
                <div className="map-footer">
                  <span>
                    <i className="site-legend" />
                    Site
                  </span>
                  <span>
                    <i className="amber" />
                    Imported critical HSE action open
                  </span>
                  <span className="legend-ocean-item">
                    <i className="ocean-legend-dot" />
                    Ocean &amp; Coastal waters
                  </span>
                  <button aria-pressed={!selected} onClick={() => setSelected(null)}>
                    All sites
                  </button>
                </div>
              </section>

              <section className="panel site-summary">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">Selected Scope</div>
                    <h2>{active ? active.name : 'All sites'}</h2>
                  </div>
                  <MapPin size={20} />
                </div>
                <p className="summary-intro">
                  {active ? 'Site context for maintenance planning.' : 'Click a map marker to explore an individual site.'}
                </p>
                <dl>
                  <div>
                    <dt>Assets in scope</dt>
                    <dd><SourceValue table="equipment" filter={{ siteId: selected }}>{assets.length}</SourceValue></dd>
                  </div>
                  <div>
                    <dt>Maintenance technicians</dt>
                    <dd><SourceValue table="sites" filter={{ siteId: selected }}>{sum('technicians')}</SourceValue></dd>
                  </div>
                  <div>
                    <dt>Inventory fill rate</dt>
                    <dd>{active ? <SourceValue table="sites" filter={{ siteId: selected }}>{active.spareFill}%</SourceValue> : 'Select a site'}</dd>
                  </div>
                  <div>
                    <dt>Network uptime</dt>
                    <dd>{active ? <SourceValue table="sites" filter={{ siteId: selected }}>{active.network}%</SourceValue> : 'Select a site'}</dd>
                  </div>
                </dl>
                <div className={`safety-note ${sum('criticalActions') ? 'hold' : ''}`}>
                  <ShieldAlert size={19} />
                  <div>
                    <strong>
                      <SourceValue table="hseActions" filter={{ siteId: selected, ids: data.hseActions.filter(a => a.status === 'Open' && a.severity === 5).map(a => a.id) }}>{sum('criticalActions')} imported critical HSE actions open</SourceValue>
                    </strong>
                    <p>
                      {sum('criticalActions')
                        ? 'Historical baseline. Live verification and pilot states appear in the site cards below.'
                        : 'Review scoped HSE actions before authorizing a pilot.'}
                    </p>
                    <small>HSE status as of {data.hseAsOf || '2026-10-01'}</small>
                  </div>
                </div>
              </section>
            </div>

            <div className="analysis-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Where time goes</h2>
                    <p>Five sequential stages of unplanned downtime</p>
                  </div>
                  <Clock3 size={18} />
                </div>
                <div className="stacked-bar" aria-hidden="true">
                  {stageTotals.map((stage) => (
                    <span
                      className={`stage-${stage.key}`}
                      key={stage.key}
                      style={{ width: `${hours ? (stage.hours / hours) * 100 : 0}%` }}
                    />
                  ))}
                </div>
                <div className="stage-list">
                  {stageTotals.map((stage) => (
                    <div key={stage.key}>
                      <span>
                        <i className={`stage-${stage.key}`} />
                        {stage.label}
                      </span>
                      <strong>
                        <SourceValue filter={{ siteId: selected, type: 'Unplanned' }}>{number(stage.hours, 1)} <small>hrs</small></SourceValue>
                      </strong>
                      <span><SourceValue filter={{ siteId: selected, type: 'Unplanned' }}>{number(hours ? (stage.hours / hours) * 100 : 0, 1)}%</SourceValue></span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Downtime by cause</h2>
                    <p>Confirmed post-event classifications</p>
                  </div>
                  <Activity size={18} />
                </div>
                <div className="cause-list">
                  {causes.map((cause) => (
                    <div className="cause" key={cause.name}>
                      <div>
                        <span>{cause.name}</span>
                        <strong>
                          <SourceValue filter={{ siteId: selected, cause: cause.name, type: 'Unplanned' }}>{number(cause.hours, 1)} <small>hrs</small></SourceValue>
                        </strong>
                      </div>
                      <div className="cause-track">
                        <span style={{ width: `${(cause.hours / causes[0].hours) * 100}%` }} />
                      </div>
                      <small><SourceValue filter={{ siteId: selected, cause: cause.name, type: 'Unplanned' }}>{cause.events} events</SourceValue></small>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <SiteStatusCards siteId={selected} />
            <SiteScatter />
            <AssetLeaderboard siteId={selected} />

            <footer className="data-footer">
              Unplanned events · Reporting period: Jan–Dec 2025
            </footer>
          </div>
 )
}
