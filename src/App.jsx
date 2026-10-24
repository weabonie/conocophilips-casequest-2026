import { useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Clock3,
  Droplets,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react'
import { useLiveOperations } from './hooks/useLiveOperations'
import SyncStatusBadge from './components/SyncStatusBadge'
import SyncSettingsModal from './components/SyncSettingsModal'
import EquipmentHealthView from './components/EquipmentHealthView'
import LoginScreen from './LoginScreen'
import LoneMesaLogo, { LoneMesaMark } from './components/LoneMesaLogo'
import terrainMap from './assets/terrain-map.jpg'
import './App.css'

const positions = { S01: [22, 28], S02: [53, 21], S03: [73, 28], S04: [35, 58], S05: [62, 54], S06: [20, 72] }
const stages = [
  ['detect', 'Detection'],
  ['dispatch', 'Dispatch'],
  ['parts_wait', 'Parts waiting'],
  ['repair', 'Repair'],
  ['restart', 'Restart'],
]
const number = (value, digits = 0) => value.toLocaleString('en-US', { maximumFractionDigits: digits })

export default function App() {
  const [user, setUser] = useState(null)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const {
    data,
    syncStatus,
    syncError,
    lastSyncTime,
    excelUrl,
    intervalMs,
    isAutoSync,
    syncNotice,
    isSettingsOpen,
    setIsSettingsOpen,
    syncNow,
    uploadLocalExcel,
    testConnection,
    updateSettings,
  } = useLiveOperations()

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
    setSelected(null)
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

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
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" title="Lone Mesa Project Overview">
          <span className="brand-logo-full">
            <LoneMesaLogo height={27} textColor="#111827" />
          </span>
          <span className="brand-mark-collapsed">
            <LoneMesaMark size={20} />
          </span>
        </a>
        <div className="workspace-label">Workspace</div>
        <button
          className={`nav-btn ${activeTab === 'overview' ? 'nav-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={17} />
          <span>Operations overview</span>
        </button>
        <button
          className={`nav-btn ${activeTab === 'equipment' ? 'nav-active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          <Wrench size={17} />
          <span>Equipment &amp; Health</span>
        </button>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.avatar || 'OP'}</div>
          <div className="sidebar-user-info">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button
            className="sidebar-signout-btn"
            onClick={handleLogout}
            title="Sign out to login screen"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
        <div className="sidebar-footer">
          <LoneMesaLogo height={13} textColor="#4b5563" />
          <small>6 sites · 18 assets</small>
        </div>
      </aside>

      <main id="overview">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-mobile-logo">
              <LoneMesaLogo height={18} textColor="#111827" />
            </span>
            <span>
              Workspace / {activeTab === 'overview' ? 'Operations overview' : 'Equipment & Health'}
            </span>
          </div>
          <div className="topbar-right">
            <SyncStatusBadge
              syncStatus={syncStatus}
              lastSyncTime={lastSyncTime}
              syncError={syncError}
              onSyncNow={syncNow}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <div className="topbar-user-pill">
              <span className="topbar-avatar">{user.avatar || 'OP'}</span>
              <span className="topbar-username">{user.name}</span>
              <button
                className="topbar-logout-btn"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut size={13} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {syncNotice && (
          <div className="sync-toast-notice" role="status" aria-live="polite">
            <CheckCircle2 size={13} />
            <span>{syncNotice.message}</span>
          </div>
        )}

        {activeTab === 'overview' ? (
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
                  {sites.length} {sites.length === 1 ? 'site' : 'sites'} · {assets.length} assets
                </span>
              </div>
              {selected && (
                <button onClick={() => setSelected(null)}>
                  <X size={14} /> Clear site filter
                </button>
              )}
            </div>

            <section className="metric-grid" aria-label="Selected operations metrics" aria-live="polite">
              {[
                ['Unplanned downtime', number(hours, 1), 'asset-hours', Clock3, `${sum('events')} unplanned events`],
                ['Unrecovered production', number(sum('netBbl')), 'barrels', Droplets, 'After assumed oil recovery'],
                ['Modeled lost contribution', `$${number(sum('loss') / 1000000, 2)}M`, '', Activity, 'Net barrels × contribution margin'],
                ['Parts waiting', number(stageTotals[2].hours, 1), 'asset-hours', Clock3, `${number((stageTotals[2].hours / hours) * 100, 1)}% of unplanned downtime`],
              ].map(([label, value, unit, Icon, detail]) => (
                <article className="metric" key={label}>
                  <div className="metric-label">
                    {label}
                    <Icon size={17} />
                  </div>
                  <div className="metric-value">
                    {value}
                    <span>{unit}</span>
                  </div>
                  <div className="metric-detail">{detail}</div>
                </article>
              ))}
            </section>

            <div className="map-layout">
              <section className="panel map-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Explore your sites</h2>
                    <p>Select a site to filter every view below.</p>
                  </div>
                  <span className="tag">6 Sites</span>
                </div>
                <div className="site-map" role="group" aria-label="Interactive terrain and ocean site map">
                  <img
                    src={terrainMap}
                    alt="Realistic satellite terrain and coastal ocean map"
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
                  <span className="map-caption">LONE MESA / SATELLITE TERRAIN &amp; OCEAN</span>
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
                        <small>{number(site.hours)} hrs</small>
                      </span>
                    </button>
                  ))}
                  <span className="map-scale">1:50,000 · TOPOGRAPHIC &amp; OCEAN RELIEF</span>
                </div>
                <div className="map-footer">
                  <span>
                    <i className="site-legend" />
                    Site
                  </span>
                  <span>
                    <i className="amber" />
                    Critical HSE action open
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
                    <dd>{assets.length}</dd>
                  </div>
                  <div>
                    <dt>Maintenance technicians</dt>
                    <dd>{sum('technicians')}</dd>
                  </div>
                  <div>
                    <dt>Critical spare fill rate</dt>
                    <dd>{active ? `${active.spareFill}%` : 'Select a site'}</dd>
                  </div>
                  <div>
                    <dt>Network uptime</dt>
                    <dd>{active ? `${active.network}%` : 'Select a site'}</dd>
                  </div>
                </dl>
                <div className={`safety-note ${sum('criticalActions') ? 'hold' : ''}`}>
                  <ShieldAlert size={19} />
                  <div>
                    <strong>
                      {sum('criticalActions')
                        ? `${sum('criticalActions')} critical HSE actions open`
                        : 'No critical HSE actions open'}
                    </strong>
                    <p>
                      {sum('criticalActions')
                        ? 'Affected site pilots require supervisor-verified closure.'
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
                      style={{ width: `${(stage.hours / hours) * 100}%` }}
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
                        {number(stage.hours, 1)} <small>hrs</small>
                      </strong>
                      <span>{number((stage.hours / hours) * 100, 1)}%</span>
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
                          {number(cause.hours, 1)} <small>hrs</small>
                        </strong>
                      </div>
                      <div className="cause-track">
                        <span style={{ width: `${(cause.hours / causes[0].hours) * 100}%` }} />
                      </div>
                      <small>{cause.events} events</small>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="panel assets-panel">
              <div className="panel-heading">
                <div>
                  <h2>Equipment priorities</h2>
                  <p>
                    Ranked by time waiting for parts · {active ? active.name : 'all sites'}
                  </p>
                </div>
                <span className="tag">{assets.length} Assets</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Site</th>
                      <th>Equipment type</th>
                      <th>Events</th>
                      <th>Parts waiting</th>
                      <th>Total downtime</th>
                      <th>Lost contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td>
                          <span className="asset-id">{asset.id}</span>
                        </td>
                        <td>{asset.site}</td>
                        <td>{asset.type}</td>
                        <td>{asset.events}</td>
                        <td className="parts-cell">{number(asset.partsHours, 1)} hrs</td>
                        <td>{number(asset.hours, 1)} hrs</td>
                        <td>${number(asset.loss)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <footer className="data-footer">
              Unplanned events · Reporting period: Jan–Dec 2025
            </footer>
          </div>
        ) : (
          <div className="page-content">
            <EquipmentHealthView
              data={data}
              selectedSite={selected}
              onSelectSite={setSelected}
              currentUser={user}
            />
            <footer className="data-footer">
              Equipment readings: 2025 · Maintenance planning
            </footer>
          </div>
        )}
      </main>

      <SyncSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        excelUrl={excelUrl}
        intervalMs={intervalMs}
        isAutoSync={isAutoSync}
        onSaveSettings={updateSettings}
        onUploadFile={uploadLocalExcel}
        onTestConnection={testConnection}
      />
    </div>
  )
}
