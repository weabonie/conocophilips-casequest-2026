import { useState } from 'react'
import { usePartsRequests } from '../../domain/partsRequests.js'
export function ReorderQueueSummary() {
  const [now] = useState(() => Date.now())
  const requests = usePartsRequests().filter(r => r.status === 'Pending review')
  const rush = requests.filter(r => r.priority === 'Urgent')
  const ages = rush.map(r => Math.max(0,(now-Date.parse(r.requestedDate))/3600000)).filter(Number.isFinite)
  return <section className="panel"><h2>Reorder queue</h2><p>{requests.length} pending · {rush.length} urgent · {ages.filter(h=>h>4).length} urgent over 4 hours</p><p>Oldest urgent request: {ages.length ? `${Math.max(...ages).toFixed(1)} hours` : 'none'}</p><a href="#/reorders">Review requests</a></section>
}
