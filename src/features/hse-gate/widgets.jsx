import { useData } from '../../app/DataContext.jsx'
import { useStore } from '../../domain/store.js'
import { hseGateStore, getSiteGateStatus } from '../../domain/hseGate.js'
export function HseGateSummary() { const data = useData(); useStore(hseGateStore); const counts = { locked: 0, clear: 0, ready: 0, live: 0 }; for (const site of data?.sites || []) counts[getSiteGateStatus(data, site.id)]++; return <section className="panel hse-gate-summary"><h2>Site pilot gates</h2><p>{counts.locked} locked · {counts.ready} ready · {counts.live} live · {counts.clear} clear</p><a href="#/hse">Review HSE pilot gates</a></section> }
