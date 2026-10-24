import { useId, useRef, useEffect, useState } from 'react'
import { X } from 'lucide-react'
export function PageHeader({ title, subtitle, children }) { return <div className="page-heading"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{children}</div> }
export function KpiTile({ label, value, unit, detail }) { return <article className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value ?? <Unknown />}<span>{unit}</span></div><div className="metric-detail">{detail}</div></article> }
export function StatusBadge({ status = 'unknown', children }) { return <span className={`cq-status cq-status-${status}`}>{children || status}</span> }
export function Banner({ variant = 'info', children }) { return <div className={`cq-banner cq-banner-${variant}`} role="status">{children}</div> }
export function ConfidenceBadge({ siteId, missingPct, latePct, label }) { return <span className="tag" title={`${siteId || ''}: missing ${missingPct ?? 'unknown'}%; delayed ${latePct ?? 'unknown'}%`}>{label || (missingPct == null ? 'Confidence unknown' : `${missingPct.toFixed(1)}% missing`)}</span> }
export function EmptyState({ title, children, description }) { return <section className="panel cq-empty"><h2>{title}</h2><p>{description || children || 'This workspace is being prepared.'}</p></section> }
export function PermissionNote({ children }) { return <small className="cq-permission">{children || 'Your demo role can view this information but cannot perform this action.'}</small> }
export function SampleDataTag() { return <span className="tag">Sample stock levels</span> }
export function Unknown() { return <span className="cq-unknown">unknown</span> }
export function Dialog({ open, title, description, size = 'default', onClose, children }) {
  const ref = useRef(null); const id = useId(); const descriptionId = `${id}-description`
  useEffect(() => { const el = ref.current; if (open && !el.open) el.showModal(); else if (!open && el.open) el.close() }, [open])
  return <dialog className={`cq-dialog cq-dialog-${size}`} ref={ref} aria-labelledby={id} aria-describedby={description ? descriptionId : undefined} onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose() }}>
    <header className="cq-dialog-heading"><div><h2 id={id}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="cq-dialog-close" onClick={onClose} aria-label="Close dialog"><X size={18} aria-hidden="true"/></button></header>
    <div className="cq-dialog-body">{open && children}</div>
  </dialog>
}
export function ReasonDialog({ open, isOpen, title = 'Record a reason', onConfirm, onClose }) { const [reason, setReason] = useState(''); return <Dialog open={open ?? isOpen} title={title} size="compact" onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (reason.trim()) { onConfirm(reason.trim()); setReason('') } }}><label>Reason<textarea required value={reason} onChange={e => setReason(e.target.value)} /></label><button type="submit" disabled={!reason.trim()}>Confirm</button></form></Dialog> }
export function ConfirmByNameDialog({ open, isOpen, title = 'Confirm decision', name, expectedName, onConfirm, onClose }) { const [typed, setTyped] = useState(''); const target = expectedName || name; return <Dialog open={open ?? isOpen} title={title} size="compact" onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (target && typed.trim().toLowerCase() === target.toLowerCase()) { onConfirm(typed.trim()); setTyped('') } }}><label>Type your name: {target}<input required value={typed} onChange={e => setTyped(e.target.value)} /></label><button disabled={!target || typed.trim().toLowerCase() !== target.toLowerCase()}>Confirm</button></form></Dialog> }
function sourceColumnWidth(key) {
  if (/^(id|assetId|siteId|eventId|workOrderId)$/.test(key)) return 100
  if (/(?:Utc|Date|AsOf)$/.test(key) || key === 'date') return 170
  if (/note|reason|hazard|name|label/i.test(key)) return 240
  return 150
}
function SourceCell({ value }) {
  if (value == null) return <span className="cq-source-unknown">unknown</span>
  if (typeof value === 'object') return <details className="cq-source-object"><summary>{Array.isArray(value) ? `${value.length} items` : `${Object.keys(value).length} fields`}</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>
  return String(value)
}
export function SourceDrawer({ open, isOpen, source, onClose }) {
  const rows = source?.rows || []; const columns = source?.columns || []
  return <Dialog open={open ?? isOpen} title="Source records" description={source?.label === 'Source records' ? undefined : source?.label} size="wide" onClose={onClose}>
    <div className="cq-source-toolbar"><span><strong>{rows.length.toLocaleString()}</strong> {rows.length === 1 ? 'record' : 'records'}</span><span>{columns.length} fields</span></div>
    {rows.length ? <div className="cq-source-table-scroll" role="region" aria-label="Source records table" tabIndex={0}><table className="cq-source-table" style={{ '--cq-source-table-width': `${columns.reduce((width, column) => width + sourceColumnWidth(column.key), 0)}px` }}><colgroup>{columns.map(column => <col key={column.key} style={{ width: sourceColumnWidth(column.key) }}/>)}</colgroup><thead><tr>{columns.map(column => <th scope="col" key={column.key}>{column.label.replace(/\bUsd\b/g, 'USD').replace(/\bId\b/g, 'ID').replace(/\bUtc\b/g, 'UTC')}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map(column => <td key={column.key}><SourceCell value={row[column.key]}/></td>)}</tr>)}</tbody></table></div> : <div className="cq-source-empty">No source records available.</div>}
  </Dialog>
}
export function Sourced({ source, resolve, children }) { const [open, setOpen] = useState(false); const resolved = resolve ? resolve(source) : source; return <><button className="cq-source" title="View source records" onClick={() => setOpen(true)}>{children}</button><SourceDrawer open={open} source={resolved} onClose={() => setOpen(false)} /></> }
