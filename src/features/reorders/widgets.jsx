import { useState } from 'react'
import { useData } from '../../app/DataContext.jsx'
import { usePartsRequests } from '../../domain/partsRequests.js'
export function ReorderQueueSummary({ data: suppliedData } = {}) {
  const currentData = useData(); const data = suppliedData || currentData
  const siteIds = new Set((data?.sites || []).map(site => site.id))
  const [now] = useState(() => Date.now())
  const requests = usePartsRequests().filter(r => r.status === 'Pending review' && siteIds.has(r.siteId))
  const rush = requests.filter(r => r.priority === 'Urgent')
  const ages = rush.map(r => Math.max(0,(now-Date.parse(r.requestedDate))/3600000)).filter(Number.isFinite)
  return <section className="panel"><h2>Reorder queue</h2><p>{requests.length} pending · {rush.length} urgent · {ages.filter(h=>h>4).length} urgent over 4 hours</p><p>Oldest urgent request: {ages.length ? `${Math.max(...ages).toFixed(1)} hours` : 'none'}</p><a href="#/reorders">Review requests</a></section>
}
