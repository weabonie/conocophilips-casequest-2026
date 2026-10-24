import { useState, useMemo } from 'react'
import {
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Package,
} from 'lucide-react'
import { JOB_STATUSES } from '../utils/maintenanceStorage'

export default function MaintenanceQueueTable({
  requests = [],
  onEditRequest,
  onStatusChange,
  onDeleteRequest,
  onResetDemoRequests,
  selectedSite,
}) {
  const [filterScope, setFilterScope] = useState('all') // 'all' | 'needs_prep' | 'scheduled' | 'draft'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusNotice, setStatusNotice] = useState(null)
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Site filter
      if (selectedSite && req.siteId !== selectedSite) {
        return false
      }

      // Status / readiness filter
      if (filterScope === 'needs_prep' && req.readiness !== 'Needs preparation') {
        return false
      }
      if (filterScope === 'scheduled' && req.status !== 'Scheduled') {
        return false
      }
      if (filterScope === 'draft' && req.status !== 'Draft') {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchId = req.id?.toLowerCase().includes(q)
        const matchAsset = req.assetId?.toLowerCase().includes(q)
        const matchSite = req.siteName?.toLowerCase().includes(q)
        const matchTask = req.task?.toLowerCase().includes(q)
        const matchTeam = req.assignedTeam?.toLowerCase().includes(q)
        const matchPart = req.reservedPartName?.toLowerCase().includes(q)
        if (!matchId && !matchAsset && !matchSite && !matchTask && !matchTeam && !matchPart) {
          return false
        }
      }

      return true
    })
  }, [requests, selectedSite, filterScope, searchQuery])

  // Summary counts
  const counts = useMemo(() => {
    const total = requests.length
    const needsPrep = requests.filter((r) => r.readiness === 'Needs preparation').length
    const scheduled = requests.filter((r) => r.status === 'Scheduled').length
    const drafts = requests.filter((r) => r.status === 'Draft').length
    return { total, needsPrep, scheduled, drafts }
  }, [requests])

  const toggleHistory = (id) => {
    setExpandedHistoryId((prev) => (prev === id ? null : id))
  }

  const handleQuickStatusChange = (req, newStatus) => {
    if (newStatus === 'Scheduled' && req.readiness === 'Needs preparation') {
      setStatusNotice({
        type: 'blocked',
        message: `Cannot mark ${req.id} as Scheduled: Team is unassigned or parts are not reserved in warehouse.`,
      })
      setTimeout(() => setStatusNotice(null), 4500)
      return
    }

    onStatusChange(req.id, newStatus)
    setStatusNotice({
      type: 'success',
      message: `${req.id} status updated to '${newStatus}'${
        newStatus === 'Completed' && req.hasConfirmedReservation && !req.partsConsumed
          ? ' (Reserved parts consumed from warehouse)'
          : ''
      }.`,
    })
    setTimeout(() => setStatusNotice(null), 3500)
  }

  const formatDateDisplay = (dateStr, timeStr) => {
    if (!dateStr) return 'Date unset'
    return `${dateStr} · ${timeStr || '08:00'}`
  }

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '—'
    try {
      const d = new Date(isoStr)
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    } catch {
      return isoStr
    }
  }

  return (
    <section className="panel maintenance-queue-panel" aria-label="Maintenance queue">
      {/* Notice toast for status blockers or updates */}
      {statusNotice && (
        <div
          className={`queue-inline-notice ${statusNotice.type === 'blocked' ? 'notice-blocked' : 'notice-success'}`}
          role="status"
          aria-live="polite"
        >
          {statusNotice.type === 'blocked' ? (
            <AlertTriangle size={14} />
          ) : (
            <CheckCircle2 size={14} />
          )}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {/* Panel Header */}
      <div className="panel-heading">
        <div>
          <div className="eyebrow">OPERATIONAL WORKFLOW</div>
          <h2>Saved Maintenance Queue</h2>
          <p>
            Persisted locally · Linked to warehouse parts reservations and team assignments
          </p>
        </div>
        <div className="queue-header-actions">
          <span className="tag">
            {requests.length} {requests.length === 1 ? 'WORK ORDER' : 'WORK ORDERS'}
          </span>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="queue-controls">
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search queue by request ID (REQ-001), asset, site, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')} aria-label="Clear search">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="filter-pills-group">
          <span className="filter-label">
            <Filter size={12} /> Filter:
          </span>
          <button
            className={`filter-pill ${filterScope === 'all' ? 'active' : ''}`}
            onClick={() => setFilterScope('all')}
          >
            All ({counts.total})
          </button>
          <button
            className={`filter-pill warning-pill ${filterScope === 'needs_prep' ? 'active' : ''}`}
            onClick={() => setFilterScope('needs_prep')}
          >
            Needs prep ({counts.needsPrep})
          </button>
          <button
            className={`filter-pill optimal-pill ${filterScope === 'scheduled' ? 'active' : ''}`}
            onClick={() => setFilterScope('scheduled')}
          >
            Scheduled ({counts.scheduled})
          </button>
          <button
            className={`filter-pill ${filterScope === 'draft' ? 'active' : ''}`}
            onClick={() => setFilterScope('draft')}
          >
            Drafts ({counts.drafts})
          </button>
        </div>

        {selectedSite && (
          <div className="site-scope-badge">
            <span>Scoped to site: <strong>{selectedSite}</strong></span>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Asset</th>
              <th>Site</th>
              <th>Task</th>
              <th>Proposed Date / Time</th>
              <th>Assigned Team</th>
              <th>Warehouse Parts Readiness</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => {
              const isNeedsPrep = req.readiness === 'Needs preparation'
              const isScheduled = req.status === 'Scheduled'
              const isInProgress = req.status === 'In progress'
              const isCompleted = req.status === 'Completed'
              const isExpanded = expandedHistoryId === req.id

              return (
                <tr key={req.id} className={isExpanded ? 'row-expanded' : ''}>
                  {/* Request ID */}
                  <td>
                    <span className="req-id-badge">{req.id}</span>
                  </td>

                  {/* Asset */}
                  <td>
                    <div className="asset-cell-group">
                      <span className="asset-id">{req.assetId}</span>
                      <small className="asset-type-sub">{req.equipmentType}</small>
                    </div>
                  </td>

                  {/* Site */}
                  <td>
                    <strong>{req.siteName}</strong>
                  </td>

                  {/* Task */}
                  <td className="task-cell">
                    <span className="task-title" title={req.task}>
                      {req.task}
                    </span>
                    {req.notes && (
                      <span className="task-notes-preview" title={req.notes}>
                        <FileText size={10} />
                        {req.notes}
                      </span>
                    )}
                  </td>

                  {/* Proposed Date/Time */}
                  <td className="datetime-cell">
                    <div className="datetime-wrapper">
                      <Calendar size={12} className="text-gray-400" />
                      <span>{formatDateDisplay(req.proposedDate, req.startTime)}</span>
                    </div>
                    {req.estimatedHours && (
                      <small className="duration-sub">{req.estimatedHours} hrs est.</small>
                    )}
                  </td>

                  {/* Assigned Team */}
                  <td>
                    {req.assignedTeam && req.assignedTeam !== 'unassigned' ? (
                      <span className="team-assigned">{req.assignedTeam}</span>
                    ) : (
                      <span className="team-unassigned">Unassigned (Demo)</span>
                    )}
                  </td>

                  {/* Warehouse Parts Readiness */}
                  <td>
                    <div className="readiness-cell">
                      {isNeedsPrep ? (
                        <span className="readiness-badge badge-amber" title="Unconfirmed parts or unassigned team">
                          <AlertTriangle size={11} />
                          Needs preparation
                        </span>
                      ) : (
                        <span className="readiness-badge badge-emerald" title="All prerequisites met">
                          <CheckCircle2 size={11} />
                          Ready for review
                        </span>
                      )}

                      {/* Linked Warehouse Reservation details */}
                      {req.hasConfirmedReservation ? (
                        <span className="parts-res-tag confirmed" title={`Reserved: ${req.reservedPartName || 'Part'}`}>
                          <Package size={10} />
                          {req.reservedPartName ? req.reservedPartName.split('(')[0] : 'Part reserved'} ({req.reservedQty || 1})
                          {req.partsConsumed && <small className="ml-1 text-emerald-800">[Consumed]</small>}
                        </span>
                      ) : (
                        <span className="parts-res-tag unreserved">
                          <AlertTriangle size={10} />
                          No parts reserved
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <div className="status-cell">
                      <span
                        className={`status-pill ${
                          isScheduled
                            ? 'scheduled'
                            : isInProgress
                            ? 'in-progress'
                            : isCompleted
                            ? 'completed'
                            : 'draft'
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.status === 'Draft' && req.statusExplanation && (
                        <small className="status-explanation-note" title={req.statusExplanation}>
                          {req.statusExplanation}
                        </small>
                      )}
                    </div>
                  </td>

                  {/* Actions & History Toggle */}
                  <td>
                    <div className="table-actions-cell">
                      {/* Inline Status Selector */}
                      <select
                        aria-label={`Update status for ${req.id}`}
                        className="status-dropdown-select"
                        value={req.status}
                        onChange={(e) => handleQuickStatusChange(req, e.target.value)}
                      >
                        {JOB_STATUSES.map((st) => (
                          <option
                            key={st}
                            value={st}
                            disabled={st === 'Scheduled' && isNeedsPrep}
                          >
                            {st === 'Scheduled' && isNeedsPrep
                              ? 'Scheduled (Blocked)'
                              : st}
                          </option>
                        ))}
                      </select>

                      {/* Edit Button */}
                      <button
                        type="button"
                        className="btn-action edit"
                        onClick={() => onEditRequest(req)}
                        title="Edit maintenance request"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        className="btn-action delete"
                        onClick={() => onDeleteRequest(req.id)}
                        title="Delete maintenance request and release reservation"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* Expandable Activity History Toggle */}
                      <button
                        type="button"
                        className="btn-history-toggle"
                        onClick={() => toggleHistory(req.id)}
                        title="Toggle activity history"
                      >
                        <span>History ({(req.history || []).length})</span>
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>

                    {/* Expandable Activity History Timeline */}
                    {isExpanded && (
                      <div className="request-history-timeline">
                        <div className="history-timeline-title">
                          <Clock size={11} />
                          <span>Activity History · Work Order {req.id}</span>
                        </div>
                        <div className="history-entries-list">
                          {(req.history || []).map((h) => (
                            <div key={h.id} className="history-entry-item">
                              <span className="history-dot" />
                              <div className="history-content">
                                <div className="history-meta-row">
                                  <strong className="history-action">{h.action}</strong>
                                  <span className="history-time">{formatTimestamp(h.timestamp)}</span>
                                </div>
                                <div className="history-user-row">
                                  <User size={10} />
                                  <span>{h.by || 'Operations Planner'}</span>
                                </div>
                                {h.note && <p className="history-note">{h.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="queue-empty-state">
          <div className="empty-state-icon">
            <Wrench size={26} />
          </div>
          <h3>No Maintenance Requests in Queue</h3>
          <p>
            {requests.length === 0
              ? "Select 'Schedule maintenance' on any equipment card above to create a prototype work order."
              : 'No maintenance requests match your current search or status filter.'}
          </p>
          <div className="empty-state-actions">
            {requests.length === 0 ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={onResetDemoRequests}
              >
                <RefreshCw size={12} />
                <span>Load Sample Prototype Requests</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFilterScope('all')
                  setSearchQuery('')
                }}
              >
                Reset Queue Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Queue Disclaimer & Realism Separator */}
      <div className="queue-footer-note">
        <span>
          <strong>Prototype Planning Storage:</strong> Work orders persist locally in browser storage (key: <code>cq_prototype_maintenance_requests_v1</code>).
          Entries do not modify 2025 historical Excel records. Field execution requires qualified supervisor work permits and HSE verification.
        </span>
      </div>
    </section>
  )
}
