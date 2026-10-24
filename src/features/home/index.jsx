import { useData } from '../../app/DataContext.jsx'
import { useCurrentUser } from '../../domain/auth.js'
import { visibleRoutes } from '../../app/routes.js'
import { programKpis } from '../../domain/metrics.js'
import { PageHeader } from '../../ui/index.jsx'
import './home.css'
const focus = {technician:'/dispatch',planner:'/early-warning',hse_supervisor:'/hse',site_lead:'/reorders',ops_manager:'/overview'}
export default function Screen() {
 const data=useData();const user=useCurrentUser();const metrics=programKpis(data)
 const routes=visibleRoutes(user).filter(r=>r.path!=='/').sort((a,b)=>(b.path===focus[user.role])-(a.path===focus[user.role]))
 return <div className="page-content cq-home"><PageHeader title="Critical Spares Control Tower" subtitle={`Welcome, ${user.name}. Choose a workspace to review readiness and plan the next action.`}/><div className="cq-banner cq-banner-info">Historical operations: {data.period} · {data.sites.length} sites · {data.equipment.length} assets. Role switching and workflow decisions use sample identities and browser-persisted demo state.</div><section className="panel cq-home-context"><h2>Start with the bottleneck</h2><p>{Math.round(metrics.partsWaitHours).toLocaleString()} hours of historical unplanned downtime were spent waiting for parts. Review warnings, prepare stock, and verify site readiness before field scheduling.</p></section><div className="cq-home-grid">{routes.map(route=><a className="panel cq-home-link" key={route.path} href={`#${route.path}`}><h2>{route.title}</h2><p>{route.path===focus[user.role]?'Recommended for your demo role':'Open workspace'} →</p></a>)}</div></div>
}
