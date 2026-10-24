import { useId, useState } from 'react'
import { ArrowRight, Database, Radio, ShieldCheck, UserCheck, ClipboardCheck, PackageCheck, ChartNoAxesCombined, Cloud } from 'lucide-react'
import './how-it-works.css'

const stages = [
  { id: 'readings', layer: 0, title: 'Workbook and readings', subtitle: 'Historical observations', icon: Radio, type: 'data', inputs: '2025 workbook records: assets, events, production, daily vibration and temperature snapshots, HSE records and solution assumptions.', outputs: 'Recorded observations with observation time, arrival time and quality indicators.', logic: 'Daily sensor snapshots are historical observations, not a continuous live IoT feed.', limitation: 'Missing and delayed readings remain visible. A recent import does not make the reporting period current.', source: 'CaseQuest2026Dataset.xlsx: Readings, Assets, Events, Production and HSE tabs', route: '#/equipment', destination: 'View equipment' },
  { id: 'quality', layer: 1, title: 'Parser and quality checks', subtitle: 'Cloudflare Worker / ETL', icon: Cloud, type: 'data', inputs: 'Remote workbook download or the bundled cleaned snapshot through /api/sync-excel.', outputs: 'Normalized data, reconciliation results and data-quality information for the dashboard.', logic: 'The deployed Worker calls the existing workbook parser for remote imports. The browser also supports workbook uploads; a bundled snapshot is the fallback.', limitation: 'This is request-based import, not a streaming sensor gateway. Unknown readings and invoices must not become zero.', source: 'cloudflare-worker.js; src/utils/excelParser.js', route: '#/data-quality', destination: 'View data quality' },
  { id: 'advisory', layer: 2, title: 'Warning and recommendation', subtitle: 'Advisory automation', icon: ChartNoAxesCombined, type: 'advisory', inputs: 'Valid, available readings, asset reference values, event history and sample stock.', outputs: 'Condition flags, candidate parts and reorder recommendations with supporting evidence.', logic: 'A warning prompts review. It does not diagnose a certain failure, place an order or authorize field work.', limitation: 'Historical replay is not validated live prediction. Stock and part mappings are demonstration planning inputs.', source: 'Product Guide 5.2–5.3; roadmap decision D2; early-warning domain rule', route: '#/early-warning', destination: 'Review early warnings' },
  { id: 'planner', layer: 2, title: 'Planner reviews request', subtitle: 'Named human decision', icon: UserCheck, type: 'human', inputs: 'Recommended part, quantity, urgency and evidence behind the request.', outputs: 'An approved, edited or rejected prototype request with a named decision and activity record.', logic: 'A permitted planner must approve. Advisory logic and the optional Copilot cannot approve or purchase.', limitation: 'Approval does not add physical stock. No real purchasing integration or purchase order is created.', source: 'Product Guide 3, 5.3 and 7; reorder queue', route: '#/reorders', destination: 'Open reorder queue' },
  { id: 'dispatch', layer: 3, title: 'Pre-dispatch readiness', subtitle: 'Technician / dispatcher', icon: ClipboardCheck, type: 'human', inputs: 'Asset and reported symptom, sample stock, reservations and inter-site transfer availability.', outputs: 'Parts readiness and remaining blockers, including a transfer or rush request where needed.', logic: 'Check parts before travel. A transfer request or approved reorder is not a receipt at the destination.', limitation: 'Parts-ready is not permission to start work. Confirm LOTO and isolation before work begins.', source: 'Product Guide 5.4; roadmap decision D3', route: '#/dispatch', destination: 'Run pre-dispatch check' },
  { id: 'hse', layer: 3, title: 'HSE verification and release', subtitle: 'Supervisor-only safety gate', icon: ShieldCheck, type: 'safety', inputs: 'Open severity-5 actions, closure evidence, verification notes and site authorization state.', outputs: 'Named supervisor verification and a separate site-pilot release decision.', logic: 'Only the site HSE supervisor may verify and release the prototype gate. Open critical actions keep the affected pilot locked.', limitation: 'A simulated release is not a real field permit. LOTO, isolation and site work procedures still apply.', source: 'Product Guide 5.5 and 7; Findings 3.5; roadmap decision D6', route: '#/hse', destination: 'Review HSE gate' },
  { id: 'receipt', layer: 3, title: 'Receipt and execution', subtitle: 'Human-confirmed updates', icon: PackageCheck, type: 'human', inputs: 'Approved request, confirmed delivery and eligible prototype site release.', outputs: 'Recorded receipt, updated sample inventory and activity history.', logic: 'Record actual demo receipt separately from approval. The first receipt after release can transition the site pilot to Live in the prototype.', limitation: 'No warehouse, supplier or HSE system is connected. Live is a prototype rollout state, not live telemetry.', source: 'Roadmap decisions D5–D6; prototype inventory workflow', route: '#/reorders', destination: 'Review requests and receipts' },
  { id: 'measurement', layer: 3, title: 'Measure and review', subtitle: 'Operations manager', icon: Database, type: 'human', inputs: 'Historical downtime, planning decisions, receipts and modeled intervention assumptions.', outputs: 'Baseline comparisons, modeled avoided hours and traceable decision history.', logic: 'Compare historical loss, estimated opportunity and measured outcomes separately. Improve stock settings through human review.', limitation: 'Historical data alone cannot prove achieved post-rollout savings. No maintenance-cost or injury-reduction claims.', source: 'Product Guide 5.7, 5.9 and 11; Findings 3.7; roadmap decision D1', route: '#/overview', destination: 'Open operations overview' },
]
const layers = [
  { title: 'Observe', description: 'Historical source data', ids: ['readings'] },
  { title: 'Prepare', description: 'Import and quality', ids: ['quality'] },
  { title: 'Recommend and decide', description: 'Evidence before action', ids: ['advisory', 'planner'] },
  { title: 'Act and review', description: 'Role-controlled workflow', ids: ['dispatch', 'hse', 'receipt', 'measurement'] },
]
const labels = { data: 'Data processing', advisory: 'Advisory only', human: 'Human decision', safety: 'Safety gate' }

export default function HowItWorks() {
  const [selectedId, setSelectedId] = useState('readings')
  const active = stages.find((stage) => stage.id === selectedId)
  const selectedIndex = stages.indexOf(active)
  const markerId = useId().replace(/:/g, '')
  return (
    <section className="how-it-works" aria-labelledby="how-it-works-title">
      <header className="how-it-works-header">
        <div><p className="how-it-works-eyebrow">Critical Spares Control Tower</p><h1 id="how-it-works-title">How it works</h1><p>From historical readings to prepared maintenance, with a person accountable for every approval.</p></div>
        <span className="how-it-works-demo">Prototype workflow</span>
      </header>
      <div className="how-it-works-safety"><ShieldCheck size={20} aria-hidden="true" /><p><strong>Recommendations never authorize work.</strong> Planner approval and HSE release are human decisions. Confirm LOTO and isolation before work begins. Demo approvals are not real field permits.</p></div>
      <div className="how-it-works-legend" aria-label="Workflow legend">{Object.entries(labels).map(([key, label]) => <span key={key}><i className={`how-it-works-dot how-it-works-${key}`} aria-hidden="true" />{label}</span>)}</div>
      <p className="how-it-works-hint">Select any stage to inspect its inputs, outputs, rules and boundaries. Blue stages show the path to your selection.</p>
      <div className="how-it-works-map" aria-label="Interactive architecture and maintenance workflow">
        {layers.map((layer, layerIndex) => (
          <section className={`how-it-works-layer ${active.layer >= layerIndex ? 'how-it-works-layer-active' : ''}`} key={layer.title} aria-labelledby={`how-it-works-layer-${layerIndex}`}>
            <header><span className="how-it-works-step">{layerIndex + 1}</span><div><h2 id={`how-it-works-layer-${layerIndex}`}>{layer.title}</h2><p>{layer.description}</p></div></header>
            <div className="how-it-works-nodes">{layer.ids.map((id) => {
              const node = stages.find((stage) => stage.id === id)
              const Icon = node.icon
              const isPassed = stages.indexOf(node) <= selectedIndex
              return <button type="button" key={id} className={`how-it-works-node ${isPassed ? 'how-it-works-node-path' : ''} ${selectedId === id ? 'how-it-works-node-selected' : ''}`} aria-pressed={selectedId === id} aria-controls="how-it-works-detail" onClick={() => setSelectedId(id)}><Icon size={19} aria-hidden="true" /><span><strong>{node.title}</strong><small>{node.subtitle}</small><span className={`how-it-works-kind how-it-works-kind-${node.type}`}>{labels[node.type]}</span></span></button>
            })}</div>
            {layerIndex < layers.length - 1 && <svg className={`how-it-works-connector ${active.layer > layerIndex ? 'how-it-works-connector-active' : ''}`} viewBox="0 0 32 32" aria-hidden="true"><defs><marker id={`${markerId}-${layerIndex}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="currentColor" /></marker></defs><path d="M2 16H27" fill="none" stroke="currentColor" strokeWidth="2" markerEnd={`url(#${markerId}-${layerIndex})`} /></svg>}
          </section>
        ))}
      </div>
      <section id="how-it-works-detail" className="how-it-works-detail" aria-labelledby="how-it-works-detail-title" aria-live="polite" aria-atomic="true">
        <header><div><span className={`how-it-works-kind how-it-works-kind-${active.type}`}>{labels[active.type]}</span><h2 id="how-it-works-detail-title">{active.title}</h2></div><a className="how-it-works-link" href={active.route}>{active.destination}<ArrowRight size={16} aria-hidden="true" /></a></header>
        <dl className="how-it-works-detail-grid"><div><dt>Inputs</dt><dd>{active.inputs}</dd></div><div><dt>Outputs</dt><dd>{active.outputs}</dd></div><div><dt>Decision rule</dt><dd>{active.logic}</dd></div><div><dt>Limitations</dt><dd>{active.limitation}</dd></div></dl>
        <p className="how-it-works-source"><strong>Sources:</strong> {active.source}</p>
      </section>
      <div className="how-it-works-boundaries">
        <section><h2>Persistence and responsibility</h2><p>Prototype requests, sample inventory and decisions stay in browser local storage. They are not a shared enterprise database or tamper-proof audit record.</p><p>The optional Copilot can explain and draft. Any external model call goes through a server-side Worker secret; no API key belongs in the browser. It cannot approve purchases or release HSE gates.</p><a href="#/activity">Review activity history <ArrowRight size={14} aria-hidden="true" /></a></section>
        <section><h2>Prototype boundaries</h2><ul><li>Sample stock levels and replayed daily readings.</li><li>Mocked notifications; no real purchasing, warehouse or HSE integration.</li><li>Arroyo edge buffering is a proposed offline-ingestion capability, not an implemented sensor connection.</li><li>Estimated impact is separate from measured post-rollout results.</li></ul><a href="#/simulator">Explore modeled impact <ArrowRight size={14} aria-hidden="true" /></a></section>
      </div>
    </section>
  )
}
