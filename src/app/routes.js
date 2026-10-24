import { lazy } from 'react'
import {
  Home,
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Package,
  ClipboardCheck,
  ShieldCheck,
  SlidersHorizontal,
  Database,
  History,
  HelpCircle,
} from 'lucide-react'

const load = path => lazy(path)
export const routes = [
  { path: '/', title: 'Home', icon: Home, component: load(() => import('./HomeRoute.jsx')) },
  { path: '/overview', title: 'Operations overview', icon: LayoutDashboard, component: load(() => import('../features/overview/index.jsx')) },
  { path: '/sites/:siteId', title: 'Site details', hidden: true, component: load(() => import('../features/site/index.jsx')) },
  { path: '/equipment', title: 'Equipment & Health', icon: Activity, equipment: true },
  { path: '/early-warning', title: 'Early warning', icon: AlertTriangle, roles: ['planner', 'site_lead', 'ops_manager', 'technician'], component: load(() => import('../features/early-warning/index.jsx')) },
  { path: '/reorders', title: 'Reorder queue', icon: Package, roles: ['planner', 'site_lead', 'ops_manager'], component: load(() => import('../features/reorders/index.jsx')) },
  { path: '/dispatch', title: 'Pre-dispatch check', icon: ClipboardCheck, roles: ['technician', 'planner', 'site_lead'], component: load(() => import('../features/dispatch/index.jsx')) },
  { path: '/hse', title: 'HSE gate', icon: ShieldCheck, component: load(() => import('../features/hse-gate/index.jsx')) },
  { path: '/simulator', title: 'Impact simulator', icon: SlidersHorizontal, roles: ['planner', 'site_lead', 'ops_manager'], component: load(() => import('../features/simulator/index.jsx')) },
  { path: '/data-quality', title: 'Data quality', icon: Database, component: load(() => import('../features/data-quality/index.jsx')) },
  { path: '/activity', title: 'Activity log', icon: History, component: load(() => import('../features/activity/index.jsx')) },
  { path: '/how-it-works', title: 'How it works', icon: HelpCircle, component: load(() => import('../features/how-it-works/index.jsx')) },
]
export function matchRoute(hash) { const [rawPath, queryString = ''] = (hash || '#/overview').replace(/^#/, '').split('?'); const path = rawPath || '/'; const query = Object.fromEntries(new URLSearchParams(queryString)); const route = routes.find(r => r.path === path || r.path === '/sites/:siteId' && /^\/sites\/[^/]+$/.test(path)); return { route:route || routes[1], query, params:route?.path.includes(':siteId') ? { siteId:decodeURIComponent(path.split('/')[2]) } : {} } }
export function visibleRoutes(user) { return routes.filter(r => !r.hidden && (!r.roles || r.roles.includes(user?.role))) }
