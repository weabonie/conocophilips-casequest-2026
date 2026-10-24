import Home from '../features/home/index.jsx'
import { useData } from './DataContext.jsx'
import { useCurrentUser } from '../domain/auth.js'
import { EarlyWarningSummary } from '../features/early-warning/widgets.jsx'
import { ReorderQueueSummary } from '../features/reorders/widgets.jsx'
import { DispatchLauncher } from '../features/dispatch/widgets.jsx'
import { HseGateSummary } from '../features/hse-gate/widgets.jsx'
import { KpiStrip, SiteStatusCards } from '../features/overview/widgets.jsx'
import { ImpactSummary } from '../features/simulator/widgets.jsx'
const widgets = { EarlyWarningSummary, ReorderQueueSummary, DispatchLauncher, HseGateSummary, KpiStrip, SiteStatusCards, ImpactSummary }
export default function HomeRoute() {
 const data = useData(); const user = useCurrentUser()
 return <Home key={user.id} data={data} user={user} widgetComponents={widgets}/>
}
