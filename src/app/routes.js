import { lazy } from 'react'
const load = path => lazy(path)
export const routes = [
 { path:'/', title:'Home', component:load(() => import('./HomeRoute.jsx')) },
 { path:'/overview', title:'Operations overview', component:load(() => import('../features/overview/index.jsx')) },
 { path:'/sites/:siteId', title:'Site details', hidden:true, component:load(() => import('../features/site/index.jsx')) },
 { path:'/equipment', title:'Equipment & Health', equipment:true },
 { path:'/early-warning', title:'Early warning', roles:['planner','site_lead','ops_manager','technician'], component:load(() => import('../features/early-warning/index.jsx')) },
 { path:'/reorders', title:'Reorder queue', roles:['planner','site_lead','ops_manager'], component:load(() => import('../features/reorders/index.jsx')) },
 { path:'/dispatch', title:'Pre-dispatch check', roles:['technician','planner','site_lead'], component:load(() => import('../features/dispatch/index.jsx')) },
 { path:'/hse', title:'HSE gate', component:load(() => import('../features/hse-gate/index.jsx')) },
 { path:'/simulator', title:'Impact simulator', roles:['planner','site_lead','ops_manager'], component:load(() => import('../features/simulator/index.jsx')) },
 { path:'/data-quality', title:'Data quality', component:load(() => import('../features/data-quality/index.jsx')) },
 { path:'/activity', title:'Activity log', component:load(() => import('../features/activity/index.jsx')) },
 { path:'/how-it-works', title:'How it works', component:load(() => import('../features/how-it-works/index.jsx')) },
]
export function matchRoute(hash) { const [rawPath, queryString = ''] = (hash || '#/overview').replace(/^#/, '').split('?'); const path = rawPath || '/'; const query = Object.fromEntries(new URLSearchParams(queryString)); const route = routes.find(r => r.path === path || r.path === '/sites/:siteId' && /^\/sites\/[^/]+$/.test(path)); return { route:route || routes[1], query, params:route?.path.includes(':siteId') ? { siteId:decodeURIComponent(path.split('/')[2]) } : {} } }
export function visibleRoutes(user) { return routes.filter(r => !r.hidden && (!r.roles || r.roles.includes(user?.role))) }
