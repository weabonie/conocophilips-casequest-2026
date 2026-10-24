import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ChevronDown, LogOut, Menu, RotateCcw } from 'lucide-react'
import SyncSettingsModal from '../components/SyncSettingsModal.jsx'
import SyncStatusBadge from '../components/SyncStatusBadge.jsx'
import LoneMesaLogo, { LoneMesaMark } from '../components/LoneMesaLogo.jsx'
import LoginScreen from '../LoginScreen.jsx'
import { DEMO_USERS, roleLabel, signIn, signOut, useCurrentUser } from '../domain/auth.js'
import { resetDemoState } from '../domain/demoReset.js'
import { DataProvider } from './DataContext.jsx'
import { useData } from './useData.js'
import { ROUTES, canVisitRoute, routeForHash, visibleRoutes } from './routes.js'
import { ConfirmByNameDialog, EmptyState } from '../ui/index.jsx'
import './shell.css'
import '../App.css'

const featureLoaders = {
  home: () => import('../features/home/index.jsx'),
  overview: () => import('../features/overview/index.jsx'),
  site: () => import('../features/site/index.jsx'),
  'early-warning': () => import('../features/early-warning/index.jsx'),
  reorders: () => import('../features/reorders/index.jsx'),
  dispatch: () => import('../features/dispatch/index.jsx'),
  'hse-gate': () => import('../features/hse-gate/index.jsx'),
  simulator: () => import('../features/simulator/index.jsx'),
  'data-quality': () => import('../features/data-quality/index.jsx'),
  activity: () => import('../features/activity/index.jsx'),
  equipment: () => import('../features/equipment/index.jsx'),
  'how-it-works': () => import('../features/how-it-works/index.jsx'),
}

const featureComponents = Object.fromEntries(Object.entries(featureLoaders).map(([name, loader]) => [name, lazy(loader)]))
const NotificationBell = lazy(() => import('../features/activity/NotificationBell.jsx'))
const CopilotPanel = lazy(() => import('../features/copilot/Panel.jsx'))

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return routeForHash(hash)
}

function AppContent() {
  const user = useCurrentUser()
  const dataControls = useData()
  const route = useHashRoute()
  const [selectedSite, setSelectedSite] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const allowedRoutes = useMemo(() => visibleRoutes(user), [user])
  const Feature = featureComponents[route.feature] || featureComponents.home
  const activeRoute = canVisitRoute(user, route) ? route : allowedRoutes[0] || ROUTES[0]

  useEffect(() => {
    if (!canVisitRoute(user, route)) window.location.hash = allowedRoutes[0]?.path || '#/'
  }, [allowedRoutes, route, user])

  if (!user) return <LoginScreen onLogin={signIn} />

  const navigate = (path) => {
    window.location.hash = path
    setMobileNavOpen(false)
  }

  const handleReset = () => {
    resetDemoState()
    setResetOpen(false)
    navigate('#/')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#/" title="Critical Spares Control Tower">
          <span className="brand-logo-full"><LoneMesaLogo height={27} textColor="#111827" /></span>
          <span className="brand-mark-collapsed"><LoneMesaMark size={20} /></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="shell-nav" aria-label="Primary navigation">
          {allowedRoutes.map((item) => { const Icon = item.icon; return <a key={item.match} className={`nav-btn ${activeRoute.match === item.match ? 'nav-active' : ''}`} href={item.path} onClick={() => setMobileNavOpen(false)}><Icon size={17} /><span>{item.label}</span></a> })}
        </nav>
        <div className="sidebar-user"><div className="sidebar-user-avatar">{user.avatar}</div><div className="sidebar-user-info"><strong>{user.name}</strong><small>{roleLabel(user.role)}</small></div><button className="sidebar-signout-btn" type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={14} /></button></div>
        <div className="sidebar-footer"><LoneMesaLogo height={13} textColor="#4b5563" /><small>6 sites · 18 assets</small></div>
      </aside>

      <main className="shell-main" id="main-content">
        <header className="topbar">
          <div className="topbar-left"><button type="button" className="mobile-menu-button" aria-label="Open navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}><Menu size={17} /></button><span className="topbar-mobile-logo"><LoneMesaLogo height={18} textColor="#111827" /></span><span>Workspace / {activeRoute.label}</span></div>
          <div className="topbar-right">
            <SyncStatusBadge syncStatus={dataControls.syncStatus} lastSyncTime={dataControls.lastSyncTime} syncError={dataControls.syncError} onSyncNow={dataControls.syncNow} onOpenSettings={() => dataControls.setIsSettingsOpen(true)} />
            <Suspense fallback={null}><NotificationBell /></Suspense>
            <label className="role-switcher"><span className="sr-only">Switch demo role</span><select value={user.id} onChange={(event) => signIn(DEMO_USERS.find((candidate) => candidate.id === event.target.value))}>{DEMO_USERS.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {roleLabel(candidate.role)}</option>)}</select><ChevronDown size={13} aria-hidden="true" /></label>
            <div className="topbar-user-pill"><span className="topbar-avatar">{user.avatar}</span><span className="topbar-username">{user.name}</span><button type="button" className="topbar-logout-btn" onClick={signOut} title="Sign out"><LogOut size={13} /><span>Sign out</span></button></div>
          </div>
        </header>

        {dataControls.syncNotice && <div className="sync-toast-notice" role="status" aria-live="polite"><span>{dataControls.syncNotice.message}</span></div>}
        <div className="shell-feature-wrap"><Suspense fallback={<div className="page-content"><EmptyState title="Loading screen" guideSection="Control Tower" /></div>}><Feature data={dataControls.data} user={user} currentUser={user} selectedSite={selectedSite} onSelectSite={setSelectedSite} siteId={route.siteId} /></Suspense></div>
        <Suspense fallback={null}><CopilotPanel user={user} /></Suspense>
      </main>

      <div className="shell-user-menu"><button type="button" onClick={() => setResetOpen(true)}><RotateCcw size={14} /> Reset demo data</button></div>
      <ConfirmByNameDialog open={resetOpen} name={user.name} title="Reset demo data" onCancel={() => setResetOpen(false)} onConfirm={handleReset} />
      <SyncSettingsModal isOpen={dataControls.isSettingsOpen} onClose={() => dataControls.setIsSettingsOpen(false)} excelUrl={dataControls.excelUrl} intervalMs={dataControls.intervalMs} isAutoSync={dataControls.isAutoSync} onSaveSettings={dataControls.updateSettings} onUploadFile={dataControls.uploadLocalExcel} onTestConnection={dataControls.testConnection} />
    </div>
  )
}

export default function AppShell() {
  return <DataProvider><AppContent /></DataProvider>
}
