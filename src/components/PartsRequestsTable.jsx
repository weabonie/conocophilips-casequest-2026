import { useCurrentUser } from '../domain/auth.js'
import { can, ACTIONS } from '../domain/permissions.js'
import { PermissionNote } from '../ui/index.jsx'
import { useState, useMemo } from 'react'
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  ChevronDown,
  ChevronUp,
  Inbox,
  Search,
  Filter,
  ArrowRightLeft,
  ShoppingCart,
  User,
} from 'lucide-react'

export default function PartsRequestsTable({
  requests = [],
  onApprove,
  onReject,
  onEditQty,
  onRecordReceipt,
  selectedSite,
}) {
  const user = useCurrentUser()
  const [actionError, setActionError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'pending' | 'approved' | 'received'
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)

  // Dialog / Prompt state for actions
  const [activeActionModal, setActiveActionModal] = useState(null)
  // { type: 'approve' | 'reject' | 'editQty' | 'receipt', request: req, inputVal: '' }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (selectedSite && r.siteId !== selectedSite) return false
      if (filterStatus === 'pending' && r.status !== 'Pending review') return false
      if (filterStatus === 'approved' && r.status !== 'Approved') return false
      if (filterStatus === 'received' && r.status !== 'Received') return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchId = r.id?.toLowerCase().includes(q)
        const matchAsset = r.assetId?.toLowerCase().includes(q)
        const matchSite = r.siteName?.toLowerCase().includes(q)
        const matchPart = r.partName?.toLowerCase().includes(q)
        const matchReason = r.reason?.toLowerCase().includes(q)
        if (!matchId && !matchAsset && !matchSite && !matchPart && !matchReason) {
          return false
        }
      }
      return true
    })
  }, [requests, selectedSite, filterStatus, searchQuery])

  const counts = useMemo(() => {
    const total = requests.length
    const pending = requests.filter((r) => r.status === 'Pending review').length
    const approved = requests.filter((r) => r.status === 'Approved').length
    const received = requests.filter((r) => r.status === 'Received').length
    return { total, pending, approved, received }
  }, [requests])

  const toggleHistory = (id) => {
    setExpandedHistoryId((prev) => (prev === id ? null : id))
  }

  const handleOpenActionModal = (type, req) => {
    let initialInput = ''
    if (type === 'approve') initialInput = 'Approved for prototype maintenance staging'
    if (type === 'reject') initialInput = ''
    if (type === 'editQty') initialInput = String(req.requestedQty || 1)
    setActiveActionModal({ type, request: req, inputVal: initialInput })
  }

  const handleConfirmActionModal = () => {
    if (!activeActionModal) return
    const { type, request, inputVal } = activeActionModal

    if (!can(user, ACTIONS.DECIDE_REORDER, request)) { setActionError('Planner permission is required.'); return }
    if (type === 'reject' && !inputVal.trim()) { setActionError('A rejection reason is required.'); return }
    if (type === 'editQty' && (!Number.isInteger(Number(inputVal)) || Number(inputVal) < 1)) { setActionError('Enter a positive whole quantity.'); return }
    setActionError('')
    if (type === 'approve') {
      onApprove(request.id, inputVal.trim())
    } else if (type === 'reject') {
      onReject(request.id, inputVal.trim())
    } else if (type === 'editQty') {
      const qNum = Number(inputVal)
      onEditQty(request.id, qNum)
    } else if (type === 'receipt') {
      onRecordReceipt(request.id)
    }
    setActiveActionModal(null)
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return '—'
    try {
      const d = new Date(isoStr)
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    } catch {
      return isoStr
    }
  }

  return (
    <section className="panel parts-requests-panel" aria-label="Prototype parts requests queue">
      {/* Panel Header */}
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Supply Chain &amp; Reorder Workflow</div>
          <h2>Parts Requests &amp; Replenishment Queue</h2>
          <p>
            Review reorders and transfers · Approval authorizes receipt; recording receipt updates on-hand inventory
          </p>
        </div>
        <div className="queue-header-actions">
          <span className="tag">
            {requests.length} {requests.length === 1 ? 'Parts Request' : 'Parts Requests'}
          </span>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="queue-controls">
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search parts requests by ID (PR-001), asset, part, or site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills-group">
          <span className="filter-label">
            <Filter size={12} /> Status:
          </span>
          <button
            className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({counts.total})
          </button>
          <button
            className={`filter-pill warning-pill ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({counts.pending})
          </button>
          <button
            className={`filter-pill optimal-pill ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            Approved ({counts.approved})
          </button>
          <button
            className={`filter-pill ${filterStatus === 'received' ? 'active' : ''}`}
            onClick={() => setFilterStatus('received')}
          >
            Received ({counts.received})
          </button>
        </div>

        {selectedSite && (
          <div className="site-scope-badge">
            <span>Scoped to: <strong>{selectedSite}</strong></span>
          </div>
        )}
      </div>

      {/* Table Scroll */}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Asset &amp; Site</th>
              <th>Part &amp; Quantity</th>
              <th>Type &amp; Priority</th>
              <th>Reason &amp; Historical Context</th>
              <th>Requested</th>
              <th>Status</th>
              <th>Planner Decision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => {
              const isPending = req.status === 'Pending review'
              const isApproved = req.status === 'Approved'
              const isReceived = req.status === 'Received'
              const isExpanded = expandedHistoryId === req.id

              return (
                <tr key={req.id} className={isExpanded ? 'row-expanded' : ''}>
                  {/* Request ID */}
                  <td>
                    <span className="req-id-badge">{req.id}</span>
                  </td>

                  {/* Asset & Site */}
                  <td>
                    <div className="asset-cell-group">
                      <span className="asset-id">{req.assetId}</span>
                      <small className="asset-type-sub">
                        {req.siteName} · {req.assetType}
                      </small>
                    </div>
                  </td>

                  {/* Part & Quantity */}
                  <td className="task-cell">
                    <span className="task-title">{req.partName}</span>
                    <small className="text-slate-600 font-semibold">
                      Qty: {req.requestedQty} kit
                    </small>
                  </td>

                  {/* Type & Priority */}
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <span className="badge-transfer-type">
                        {req.requestType === 'Site Transfer' ? (
                          <>
                            <ArrowRightLeft size={10} />
                            Transfer ({req.sourceSiteName || 'Site'})
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={10} />
                            Reorder
                          </>
                        )}
                      </span>
                      <span
                        className={`priority-pill ${req.priority === 'Urgent' ? 'priority-urgent' : 'priority-std'}`}
                      >
                        {req.priority === 'Urgent' ? 'Warning · Urgent' : req.priority}
                      </span>
                    </div>
                  </td>

                  {/* Reason & Historical Context */}
                  <td className="task-cell">
                    <span className="task-title text-xs" title={req.reason}>
                      {req.reason}
                    </span>
                    <small className="data-backed-context-sub">
                      2025 parts wait: <strong>{req.historicalWaitHours ?? 'unknown'} hrs</strong>
                    </small>
                  </td>

                  {/* Requested Date */}
                  <td className="datetime-cell">
                    <span>{formatDate(req.requestedDate)}</span>
                    <small className="duration-sub">By {req.requestedBy || 'Planner'}</small>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`status-pill ${
                        isPending
                          ? 'draft'
                          : isApproved
                          ? 'scheduled'
                          : isReceived
                          ? 'completed'
                          : 'warning'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>

                  {/* Planner Decision & Note */}
                  <td className="task-cell">
                    {req.plannerDecision ? (
                      <div>
                        <span className="text-xs text-slate-800 font-medium block">
                          {req.plannerDecision}
                        </span>
                        {req.decisionBy && (
                          <small className="duration-sub">By {req.decisionBy}</small>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Pending review</span>
                    )}
                  </td>

                  {/* Actions & History Toggle */}
                  <td>
                    <div className="table-actions-cell">
                      {isPending && can(user, ACTIONS.DECIDE_REORDER, req) && (
                        <>
                          <button
                            type="button"
                            className="btn-action edit"
                            onClick={() => handleOpenActionModal('approve', req)}
                            title="Approve reorder request"
                          >
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => handleOpenActionModal('editQty', req)}
                            title="Edit quantity"
                          >
                            <Edit2 size={11} />
                            <span>Qty</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action delete"
                            onClick={() => handleOpenActionModal('reject', req)}
                            title="Reject request with explanation"
                          >
                            <XCircle size={11} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isApproved && can(user, ACTIONS.DECIDE_REORDER, req) && (
                        <button
                          type="button"
                          className="btn-action btn-record-receipt"
                          onClick={() => handleOpenActionModal('receipt', req)}
                          title="Record physical receipt of parts into warehouse"
                        >
                          <Inbox size={12} className="text-blue-600" />
                          <span>Record Receipt</span>
                        </button>
                      )}

                      {isReceived && (
                        <span className="receipt-confirmed-badge" title={`Received on ${formatDate(req.receivedAt)}`}>
                          <CheckCircle2 size={11} />
                          Received
                        </span>
                      )}

                      {!can(user, ACTIONS.DECIDE_REORDER, req) && <PermissionNote />}
                      {/* Expandable History Toggle Button */}
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
                          <span>Activity History · Request {req.id}</span>
                        </div>
                        <div className="history-entries-list">
                          {(req.history || []).map((h) => (
                            <div key={h.id} className="history-entry-item">
                              <span className="history-dot" />
                              <div className="history-content">
                                <div className="history-meta-row">
                                  <strong className="history-action">{h.action}</strong>
                                  <span className="history-time">{formatDate(h.timestamp)}</span>
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
      {filtered.length === 0 && (
        <div className="queue-empty-state">
          <div className="empty-state-icon">
            <Package size={26} />
          </div>
          <h3>No Parts Requests Found</h3>
          <p>
            {requests.length === 0
              ? "When an asset experiences a parts shortage, click 'Check parts' on its equipment card and select 'Request reorder' or 'Request transfer'."
              : 'No parts requests match the selected filters.'}
          </p>
        </div>
      )}

      {/* Action Dialog Modal */}
      {activeActionModal && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveActionModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog maint-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  {activeActionModal.type === 'approve' ? (
                    <CheckCircle2 size={18} />
                  ) : activeActionModal.type === 'receipt' ? (
                    <Inbox size={18} />
                  ) : activeActionModal.type === 'editQty' ? (
                    <Edit2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                </div>
                <div>
                  <h3>
                    {activeActionModal.type === 'approve'
                      ? `Approve Parts Request ${activeActionModal.request.id}`
                      : activeActionModal.type === 'receipt'
                      ? `Record Receipt for ${activeActionModal.request.id}`
                      : activeActionModal.type === 'editQty'
                      ? `Edit Quantity for ${activeActionModal.request.id}`
                      : `Reject Parts Request ${activeActionModal.request.id}`}
                  </h3>
                  <p>
                    {activeActionModal.request.partName} · {activeActionModal.request.siteName}
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setActiveActionModal(null)}
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="modal-body">
              {actionError && <p role="alert">{actionError}</p>}
              {activeActionModal.type === 'approve' && (
                <div className="form-group">
                  <p className="text-xs text-slate-600 mb-2">
                    Approval is a prototype planning decision. <strong>Approval does NOT increase inventory on hand.</strong> Inventory will increase only upon recording physical receipt.
                  </p>
                  <label>Planner Approval Note</label>
                  <input
                    type="text"
                    className="form-input"
                    value={activeActionModal.inputVal}
                    onChange={(e) =>
                      setActiveActionModal((prev) => ({ ...prev, inputVal: e.target.value }))
                    }
                  />
                </div>
              )}

              {activeActionModal.type === 'receipt' && (
                <div className="form-group">
                  <div className="maint-hse-banner hse-normal mb-3">
                    <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0" />
                    <div>
                      <strong>Confirm Warehouse Receipt:</strong>
                      <span>
                        Receiving {activeActionModal.request.requestedQty} kit into {activeActionModal.request.siteName} warehouse inventory. This will increase on-hand quantity by {activeActionModal.request.requestedQty}.
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    Once recorded, receipt cannot be processed twice, preventing duplicate inventory inflation.
                  </p>
                </div>
              )}

              {activeActionModal.type === 'editQty' && (
                <div className="form-group">
                  <label>Adjust Requested Quantity (Kit)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-input"
                    value={activeActionModal.inputVal}
                    onChange={(e) =>
                      setActiveActionModal((prev) => ({ ...prev, inputVal: e.target.value }))
                    }
                  />
                </div>
              )}

              {activeActionModal.type === 'reject' && (
                <div className="form-group">
                  <label>Rejection Reason / Note</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={activeActionModal.inputVal}
                    onChange={(e) =>
                      setActiveActionModal((prev) => ({ ...prev, inputVal: e.target.value }))
                    }
                    placeholder="Provide justification for decline..."
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveActionModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmActionModal}
              >
                {activeActionModal.type === 'approve'
                  ? 'Confirm Approval'
                  : activeActionModal.type === 'receipt'
                  ? 'Confirm & Increase On-Hand Stock'
                  : activeActionModal.type === 'editQty'
                  ? 'Save Quantity'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="queue-footer-note">
        <span>
          <strong>Sample Parts Inventory:</strong> Requests represent local prototype decisions. Approving a request does not increase warehouse stock until physical receipt is recorded.
        </span>
      </div>
    </section>
  )
}
