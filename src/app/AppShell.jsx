import { Suspense, useEffect, useState } from 'react'
import { LayoutDashboard, LogOut, Boxes } from 'lucide-react'
import { useData, useDataControls } from './DataContext'
import { useSiteSelection } from './SelectionContext'
import { matchRoute, visibleRoutes } from './routes'
import { DEMO_USERS, setCurrentUser, useCurrentUser } from '../domain/auth.js'
import { logActivity, EVENT_TYPES } from '../domain/activityLog.js'
import { resetDemoState } from '../domain/demoReset.js'
import SyncStatusBadge from '../components/SyncStatusBadge'
import SyncSettingsModal from '../components/SyncSettingsModal'
import EquipmentHealthView from '../components/EquipmentHealthView'
import LoginScreen from '../LoginScreen'
import CopilotPanel from '../features/copilot/Panel'
import NotificationBell from '../features/activity/NotificationBell'
import { EmptyState } from '../ui'
function signIn(user) { setCurrentUser(user); logActivity(user, { type:EVENT_TYPES.SIGN_IN, reason:'Prototype role selected' }) }
export default function AppShell() {
 const data = useData(); const controls = useDataControls(); const user = useCurrentUser(); const { selectedSite,setSelectedSite } = useSiteSelection()
 const [hash,setHash] = useState(() => window.location.hash || '#/overview')
 useEffect(() => { const update = () => setHash(window.location.hash || '#/overview'); window.addEventListener('hashchange',update); return () => window.removeEventListener('hashchange',update) }, [])
 const {route,params} = matchRoute(hash); const Screen = route.component
 if (!user) return <LoginScreen onLogin={signIn} />
 const allowed = !route.roles || route.roles.includes(user.role)
 return <div className="app-shell"><aside className="sidebar"><a className="brand" href="#/overview" title="Critical Spares Control Tower"><span className="cq-brand-icon"><Boxes size={23}/></span><span className="cq-brand-name">Critical Spares<small>Control Tower</small></span></a><div className="workspace-label">Workspace</div>{visibleRoutes(user).map(item => <button key={item.path} title={item.title} className={`nav-btn ${route.path === item.path ? 'nav-active' : ''}`} onClick={() => { window.location.hash = item.path }}><LayoutDashboard size={17} className="cq-nav-icon"/><span>{item.title}</span></button>)}<div className="sidebar-user"><div className="sidebar-user-avatar">{user.avatar}</div><div className="sidebar-user-info"><strong>{user.name}</strong><small>{user.role.replaceAll('_',' ')}</small></div><button className="sidebar-signout-btn" onClick={() => setCurrentUser(null)} aria-label="Sign out"><LogOut size={14}/></button></div><div className="sidebar-footer"><small>Critical Spares Control Tower</small><small>6 sites · 18 assets</small></div></aside><main><header className="topbar"><div className="topbar-left"><span>Workspace / {route.title}</span></div><div className="topbar-right"><SyncStatusBadge syncStatus={controls.syncStatus} lastSyncTime={controls.lastSyncTime} syncError={controls.syncError} onSyncNow={controls.syncNow} onOpenSettings={() => controls.setIsSettingsOpen(true)} /><NotificationBell /><select className="cq-mobile-nav" aria-label="Workspace" value={route.hidden ? '/overview' : route.path} onChange={e => { window.location.hash = e.target.value }}>{visibleRoutes(user).map(item => <option key={item.path} value={item.path}>{item.title}</option>)}</select><label className="cq-role-label"><span className="sr-only">Demo role</span><select className="cq-role-select" aria-label="Switch demo role" value={user.id} onChange={e => signIn(DEMO_USERS.find(u => u.id === e.target.value))}>{DEMO_USERS.map(u => <option value={u.id} key={u.id}>{u.role.replaceAll('_',' ')}</option>)}</select></label><button className="cq-demo-reset" onClick={() => { if (window.confirm('Reset sample planning data? Excel source and sync settings are kept.')) resetDemoState() }}>Reset demo data</button><button className="topbar-logout-btn" onClick={() => setCurrentUser(null)} aria-label="Sign out"><LogOut size={14}/></button></div></header>{controls.syncNotice && <div className="sync-toast-notice" role="status">{controls.syncNotice.message}</div>}{!allowed ? <div className="page-content"><EmptyState title="View unavailable" description="Select a workspace available to your demo role." /></div> : route.equipment ? <div className="page-content"><EquipmentHealthView data={data} selectedSite={selectedSite} onSelectSite={setSelectedSite} currentUser={user}/></div> : <Suspense fallback={<div className="page-content">Loading workspace…</div>}><Screen {...params}/></Suspense>}</main><CopilotPanel/><SyncSettingsModal isOpen={controls.isSettingsOpen} onClose={() => controls.setIsSettingsOpen(false)} excelUrl={controls.excelUrl} intervalMs={controls.intervalMs} isAutoSync={controls.isAutoSync} onSaveSettings={controls.updateSettings} onUploadFile={controls.uploadLocalExcel} onTestConnection={controls.testConnection}/></div>
}
