import { useData } from '../../app/DataContext.jsx'
import { useCurrentUser } from '../../domain/auth.js'
import { ACTIONS, can } from '../../domain/permissions.js'
import { calculateImpact } from '../../domain/impactModel.js'
import { resolveSource } from '../../domain/sources.js'
import { Sourced } from '../../ui'
import { FULL_YEAR_BENEFIT_USD, YEAR_ONE_BENEFIT_USD } from '../../domain/constants.js'
export function ImpactSummary() {
  const data = useData()
  const user = useCurrentUser()
  if (!can(user, ACTIONS.USE_SIMULATOR)) return null
  const siteIds = data.sites.filter(site => can(user, ACTIONS.USE_SIMULATOR, {siteId:site.id})).map(site => site.id)
  const result = calculateImpact(data, {siteIds, optionIds:['O4']}, user)
  return <section className="panel simulator-summary"><h2>Spare-parts opportunity</h2><p><Sourced source={{...resolveSource(data,{table:'events',filter:{type:'Unplanned'}}), rows:data.events.filter(event=>event.type==='Unplanned' && siteIds.includes(event.siteId)),label:'O4 base scenario: 60% of selected unplanned parts-wait hours'}}>{Math.round(result.avoidedHours).toLocaleString()}</Sourced> modeled avoided downtime hours per year across your sites.</p><p>Named all-site recommendation: ${(YEAR_ONE_BENEFIT_USD/1000).toFixed(0)}k staggered year one; ${(FULL_YEAR_BENEFIT_USD/1000).toFixed(0)}k full year.</p><a href="#/simulator">Compare impact scenarios</a></section>
}
