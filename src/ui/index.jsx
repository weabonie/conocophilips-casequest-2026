import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import './ui.css'

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="ui-page-header">
      <div>
        {eyebrow && <div className="ui-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ui-page-header-actions">{actions}</div>}
    </div>
  )
}

export function KpiTile({ label, value, detail, icon: Icon }) {
  return <article className="ui-kpi-tile"><div className="ui-kpi-label">{label}{Icon && <Icon size={16} />}</div><div className="ui-kpi-value">{value}</div>{detail && <div className="ui-kpi-detail">{detail}</div>}</article>
}

export function StatusBadge({ status = 'unknown', children }) {
  return <span className={`ui-status-badge ui-status-${status}`}>{children || status}</span>
}

export function Banner({ tone = 'info', title, children }) {
  return <div className={`ui-banner ui-banner-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}><div>{title && <strong>{title}</strong>}{children && <span>{children}</span>}</div></div>
}

export function ConfidenceBadge({ siteId, missingPct, latePct, label }) {
  const text = label || `${siteId}: ${missingPct ?? 'unknown'}% missing, ${latePct ?? 'unknown'}% late`
  const tone = Number(missingPct) > 10 || Number(latePct) > 10 ? 'warning' : 'ok'
  return <StatusBadge status={tone}>{text}</StatusBadge>
}

export function SourceDrawer({ open, onClose, title = 'Source records', children }) {
  const closeButton = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    closeButton.current?.focus()
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])
  if (!open) return null
  return <div className="ui-drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="ui-source-drawer" role="dialog" aria-modal="true" aria-label={title}><div className="ui-drawer-header"><strong>{title}</strong><button ref={closeButton} type="button" onClick={onClose} aria-label="Close source records"><X size={16} /></button></div><div className="ui-drawer-body">{children}</div></aside></div>
}

export function Sourced({ source, resolve, children }) {
  const [open, setOpen] = useState(false)
  const records = resolve ? resolve(source) : source
  return <><button type="button" className="ui-sourced" onClick={() => setOpen(true)} aria-label="Open source records">{children}</button><SourceDrawer open={open} onClose={() => setOpen(false)}><pre>{JSON.stringify(records, null, 2)}</pre></SourceDrawer></>
}

export function ReasonDialog({ open, title = 'Reason required', onCancel, onConfirm }) {
  if (!open) return null
  return <ReasonDialogContent key={title} title={title} onCancel={onCancel} onConfirm={onConfirm} />
}

export function ConfirmByNameDialog({ open, name, title = 'Confirm action', onCancel, onConfirm }) {
  if (!open) return null
  return <ConfirmByNameDialogContent key={`${name}-${title}`} name={name} title={title} onCancel={onCancel} onConfirm={onConfirm} />
}

function ReasonDialogContent({ title, onCancel, onConfirm }) {
  const [reason, setReason] = useState('')
  return <div className="ui-dialog-backdrop"><div className="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="reason-dialog-title"><h2 id="reason-dialog-title">{title}</h2><p>Give a short reason to keep this decision in the activity log.</p><textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Enter a reason" /><div className="ui-dialog-actions"><button type="button" className="ui-button ui-button-secondary" onClick={onCancel}>Cancel</button><button type="button" className="ui-button ui-button-primary" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>Confirm</button></div></div></div>
}

function ConfirmByNameDialogContent({ name, title, onCancel, onConfirm }) {
  const [typedName, setTypedName] = useState('')
  return <div className="ui-dialog-backdrop"><div className="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-name-title"><h2 id="confirm-name-title">{title}</h2><p>Type <strong>{name}</strong> to confirm.</p><input autoFocus value={typedName} onChange={(event) => setTypedName(event.target.value)} aria-label="Type your name" /><div className="ui-dialog-actions"><button type="button" className="ui-button ui-button-secondary" onClick={onCancel}>Cancel</button><button type="button" className="ui-button ui-button-primary" disabled={typedName.trim() !== name} onClick={onConfirm}>Confirm</button></div></div></div>
}

export function EmptyState({ title, guideSection, description = 'This screen is ready for its feature owner.' }) {
  return <section className="ui-empty-state"><div className="ui-eyebrow">{guideSection}</div><h1>{title}</h1><p>{description}</p></section>
}

export function PermissionNote({ children = 'You do not have permission to take this action.' }) {
  return <p className="ui-permission-note" role="note">{children}</p>
}

export function SampleDataTag() {
  return <span className="ui-sample-tag">Sample data</span>
}

export function Unknown() {
  return <span>unknown</span>
}
