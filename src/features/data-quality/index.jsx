import { useState } from 'react'
import { useData } from '../../app/DataContext'
import { PageHeader, Sourced, Unknown, EmptyState, Banner, ConfidenceBadge } from '../../ui'
import { resolveSource } from '../../domain/sources'
import { qualitySites, readingSource, reportSource, eventReconciliation } from './evidence'
import './data-quality.css'

const fmt = value => value == null ? <Unknown /> : value.toLocaleString('en-US')
const categories = ['valid', 'missing', 'suspect', 'late']
export default function DataQuality() {
  const data = useData()
  const [siteId, setSiteId] = useState('')
  const sites = qualitySites(data)
  const shown = sites.filter(site => !siteId || site.id === siteId)
  const readings = Object.values(data.readings || {}).flat()
  const pending = (data.events || []).filter(event => event.partsUsd == null)
  const pendingSource = resolveSource(data, { table: 'events', filter: { ids: pending.map(event => event.id) }, label: 'Pending parts invoices · unknown amounts' })
  const log = data.cleaningLog || []
  const reconciliation = data.dataQuality?.reconciliation
  const eventChecks = eventReconciliation(data)
  const stageDiscrepancies = eventChecks.filter(row => row.stageMatches === false)
  const capacityDiscrepancies = eventChecks.filter(row => row.capacityMatches === false)
  const incompleteChecks = eventChecks.filter(row => row.stageMatches == null || row.capacityMatches == null)
  return <div className="page-content dq-page">
    <PageHeader title="Data quality" subtitle="2025 source data · coverage, receipt delays and unresolved values" />
    <div className="dq-summary">
      <article className="panel"><p className="dq-eyebrow">Daily readings retained</p><strong><Sourced source={readingSource(data)}>{fmt(readings.length)}</Sourced></strong><p>Missing and suspect rows remain visible in the evidence.</p></article>
      <article className="panel"><p className="dq-eyebrow">Documented source fixes</p><strong><Sourced source={resolveSource(data, { table: 'cleaningLog', label: 'Workbook Cleaning_Log' })}>{fmt(log.length)}</Sourced></strong><p>Changes recorded in the workbook, before this import.</p></article>
      <article className="panel dq-unknown-card"><p className="dq-eyebrow">Pending parts invoices</p><strong><Sourced source={pendingSource}>{fmt(pending.length)} · <Unknown /></Sourced></strong><p>Amounts remain unknown. Known parts spend is incomplete.</p></article>
    </div>
    <section className="panel dq-section" aria-labelledby="dq-site-heading">
      <div className="dq-section-heading"><div><h2 id="dq-site-heading">Reading coverage by site</h2><p>Weakest coverage first. Late readings overlap quality categories; they are not a fourth quality state.</p></div><label>Site<select value={siteId} onChange={e => setSiteId(e.target.value)}><option value="">All sites</option>{sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label></div>
      <div className="dq-legend"><span className="dq-valid">Valid</span><span className="dq-missing">Missing</span><span className="dq-suspect">Suspect</span><span className="dq-late">Late: received &gt;6 hours after observation</span></div>
      {!shown.length && <EmptyState title="Quality report unavailable" description="The imported workbook has no per-site reading report." />}
      <div className="dq-sites">{shown.map(site => <SiteQuality key={site.id} data={data} site={site} />)}</div>
      <Banner variant="info">Arroyo needs coverage and receipt-delay improvements. Its valid readings still support warning analysis. Missing and suspect readings are excluded from warning calculations; replay only uses readings received by that point in time.</Banner>
    </section>
    <section className="panel dq-section" aria-labelledby="dq-reconcile-heading"><h2 id="dq-reconcile-heading">Import reconciliation</h2><p>Checks performed by the parser on the current workbook. A matching import does not resolve missing readings or pending invoice amounts.</p>
      <div className="dq-reconcile-result"><Sourced source={reportSource('Event reconciliation · 0.011 h / bbl tolerance', eventChecks)}>{fmt(eventChecks.length)} event checks · {fmt(stageDiscrepancies.length)} stage discrepancies · {fmt(capacityDiscrepancies.length)} capacity discrepancies · {fmt(incompleteChecks.length)} incomplete checks</Sourced></div>
      <div className="dq-reconciliation">{Object.entries(data.dataQuality?.tables || {}).map(([name, report]) => <article key={name}><h3>{name}</h3><Sourced source={reportSource(`${name} · parser import report`, [{ table: name, ...report }])}><b>{fmt(report.cleanRows)}</b> retained / {fmt(report.rawRows)} source rows · {fmt(report.duplicatesRemoved)} duplicates removed</Sourced></article>)}</div>
      {reconciliation ? <p className="dq-reconcile-result"><Sourced source={reportSource('Production reconciliation · parser report', [reconciliation])}>{reconciliation.productionMatched ? 'Production reconciled' : 'Production reconciliation needs review'} · {fmt(reconciliation.checkedAssetMonths)} asset-months · tolerance {fmt(reconciliation.toleranceBbl)} bbl</Sourced></p> : <p>Production reconciliation report unavailable.</p>}
    </section>
    <section className="panel dq-section" aria-labelledby="dq-clean-heading"><h2 id="dq-clean-heading">Workbook cleaning log</h2><p>Original Cleaning_Log records, including raw and corrected values. An effect is shown only where the source states one.</p>
      {log.length ? <div className="dq-cleaning-list">{log.map((row, index) => <article key={`${row.sheet}:${row.cells}:${index}`}><div className="dq-clean-meta"><Sourced source={resolveSource(data, { table: 'cleaningLog', filter: { sheet: row.sheet, cells: row.cells }, label: `${row.sheet} ${row.cells} · cleaning record` })}>{row.sheet} · {row.cells || 'Sheet-wide'}</Sourced><time>{row.date}</time></div><h3>{row.issue}</h3><dl><div><dt>Raw</dt><dd>{row.raw == null || row.raw === '' ? <Unknown /> : String(row.raw)}</dd></div><div><dt>Corrected</dt><dd>{row.fixed == null || row.fixed === '' ? <Unknown /> : String(row.fixed)}</dd></div></dl>{(row.effect || row.impact) && <p>Stated effect: {row.effect || row.impact}</p>}</article>)}</div> : <EmptyState title="No cleaning log supplied" description="This import does not contain source cleaning records. No fixes have been inferred." />}
    </section>
    <section className="panel dq-section" aria-labelledby="dq-pending-heading"><h2 id="dq-pending-heading">Pending invoice amounts remain unknown</h2><p><Sourced source={pendingSource}>{fmt(pending.length)} invoice records</Sourced> have no confirmed parts amount. They are excluded from known parts-cost sums and remain unresolved; they are never treated as a confirmed zero cost. Lost contribution margin is calculated separately from production economics.</p>
      <div className="dq-invoices">{pending.map(event => <article key={event.id}><Sourced source={resolveSource(data, { table: 'events', filter: { ids: [event.id] }, label: `${event.id} · invoice evidence` })}>{event.id} · {data.sites.find(site => site.id === event.siteId)?.name || event.siteId} · {event.assetId}</Sourced><span>{event.type}</span><b><Unknown /></b></article>)}</div>
    </section>
  </div>
}
function SiteQuality({ data, site }) {
  const q = site.quality
  return <article className={`dq-site ${q.late ? 'dq-site-priority' : ''}`}><div className="dq-site-heading"><div><h3><a href={`#/sites/${site.id}`}>{site.name}</a></h3><Sourced source={readingSource(data, site.id)}>{fmt(q.readings)} daily readings</Sourced></div><ConfidenceBadge siteId={site.id} missingPct={q.missingPct} latePct={q.latePct} /></div>
    <div className="dq-bar" aria-hidden="true">{['valid', 'missing', 'suspect'].map(category => <span key={category} className={`dq-fill-${category}`} style={{ width: `${q.readings ? q[category] / q.readings * 100 : 0}%` }} />)}</div>
    <dl className="dq-category-grid">{categories.map(category => <div key={category}><dt>{category}</dt><dd><Sourced source={readingSource(data, site.id, category)}>{q.readings ? (q[category] / q.readings * 100).toFixed(1) : '0.0'}% <small>({fmt(q[category])})</small></Sourced></dd></div>)}</dl>
    <p className="dq-lag">Average delay among late readings: <Sourced source={readingSource(data, site.id, 'late')}>{q.avgLateHours == null ? 'No late readings' : `${q.avgLateHours.toFixed(1)} hours`}</Sourced></p>
  </article>
}
