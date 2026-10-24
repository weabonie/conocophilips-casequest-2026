import {
  Activity,
  BarChart3,
  Boxes,
  CircleGauge,
  ClipboardCheck,
  Factory,
  Home,
  LifeBuoy,
  MapPinned,
  ShieldCheck,
  Truck,
  Workflow,
} from 'lucide-react'
import { ROLES } from '../domain/auth.js'

const everyone = Object.values(ROLES)

export const ROUTES = [
  { path: '#/', match: 'root', feature: 'home', label: 'Home', icon: Home, roles: everyone, guide: 'section 2' },
  { path: '#/overview', match: 'overview', feature: 'overview', label: 'Overview', icon: BarChart3, roles: everyone, guide: 'section 5.1' },
  { path: '#/sites/:siteId', match: 'site', feature: 'site', label: 'Sites', icon: MapPinned, roles: everyone, guide: 'section 4' },
  { path: '#/early-warning', match: 'early-warning', feature: 'early-warning', label: 'Early warning', icon: CircleGauge, roles: [ROLES.PLANNER, ROLES.SITE_LEAD, ROLES.OPS_MANAGER, ROLES.TECHNICIAN], guide: 'section 5.2' },
  { path: '#/reorders', match: 'reorders', feature: 'reorders', label: 'Reorder queue', icon: Boxes, roles: [ROLES.PLANNER, ROLES.SITE_LEAD, ROLES.OPS_MANAGER], guide: 'section 5.3' },
  { path: '#/dispatch', match: 'dispatch', feature: 'dispatch', label: 'Pre-dispatch check', icon: Truck, roles: [ROLES.TECHNICIAN, ROLES.PLANNER, ROLES.SITE_LEAD], guide: 'section 5.4' },
  { path: '#/hse', match: 'hse-gate', feature: 'hse-gate', label: 'HSE gate', icon: ShieldCheck, roles: everyone, guide: 'section 5.5' },
  { path: '#/simulator', match: 'simulator', feature: 'simulator', label: 'Impact simulator', icon: Factory, roles: [ROLES.PLANNER, ROLES.SITE_LEAD, ROLES.OPS_MANAGER], guide: 'section 5.7' },
  { path: '#/data-quality', match: 'data-quality', feature: 'data-quality', label: 'Data quality', icon: ClipboardCheck, roles: everyone, guide: 'section 5.8' },
  { path: '#/activity', match: 'activity', feature: 'activity', label: 'Activity log', icon: Activity, roles: everyone, guide: 'section 5.9' },
  { path: '#/equipment', match: 'equipment', feature: 'equipment', label: 'Equipment & Health', icon: LifeBuoy, roles: everyone, guide: 'existing screen' },
  { path: '#/how-it-works', match: 'how-it-works', feature: 'how-it-works', label: 'How it works', icon: Workflow, roles: everyone, guide: 'workflow' },
]

export function routeForHash(hash = window.location.hash) {
  const value = hash || '#/'
  const [path, queryString = ''] = value.split('?')
  const query = Object.fromEntries(new URLSearchParams(queryString))
  if (path.startsWith('#/sites/')) {
    return { ...ROUTES.find((route) => route.match === 'site'), siteId: path.slice('#/sites/'.length).split('/')[0], query }
  }
  const route = ROUTES.find((candidate) => candidate.path === path) || ROUTES[0]
  return { ...route, query }
}

export function visibleRoutes(user) {
  return ROUTES.filter((route) => route.roles.includes(user?.role))
}

export function canVisitRoute(user, route) {
  return route.roles.includes(user?.role)
}
