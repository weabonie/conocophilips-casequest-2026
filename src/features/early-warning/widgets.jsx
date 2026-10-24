import { useData } from '../../app/DataContext.jsx'
import { useAsOf } from '../../domain/clock.js'
import { activeWarnings, likelyIssueFor } from '../../domain/earlyWarning.js'
import { useWarningDecisions } from '../../domain/warnings.js'
import { likelyPartFor, stockAt, usePartsRequests } from '../../domain/partsRequests.js'
import './early-warning.css'
export function EarlyWarningSummary() {
  const data = useData(); const asOf = useAsOf(); const decisions = useWarningDecisions(); usePartsRequests()
  const warnings = [...new Map(activeWarnings(data,asOf).filter(a=>decisions[a.id]?.status!=='falseAlarm').map(a=>[a.assetId,a])).values()]
  const shortages = warnings.filter(a=>{const asset=data.equipment.find(e=>e.id===a.assetId);const part=likelyPartFor(asset,likelyIssueFor({...asset,history:(data.events||[]).filter(e=>e.assetId===a.assetId)},a));return part && stockAt(a.siteId,part.partId).available<1}).length
  return <section className="panel early-warning-summary"><h2>Early warnings</h2><p>{warnings.length} assets in the received-reading window · {shortages} lack a local part</p><small>As of {asOf}. Historical readings; sample stock.</small><p><a href="#/early-warning">Review warnings and replay 2025</a></p></section>
}
