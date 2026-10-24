import { useState, useMemo, useEffect } from 'react'
import {
  X,
  Wrench,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  Layers,
  Package,
  ClipboardCheck,
} from 'lucide-react'
import {
  DEMO_TEAMS,
  COMMON_TASKS,
  evaluateReadinessAndStatus,
} from '../utils/maintenanceStorage.js'
import {
  getSuggestedPartsForAsset,
  getInventoryItem,
  getReservationForAsset,
  reserveParts,
  createHistoryEntry,
} from '../utils/inventoryStorage.js'

const number = (value, digits = 0) =>
  typeof value === 'number' && !isNaN(value)
    ? value.toLocaleString('en-US', { maximumFractionDigits: digits })
    : 'Unavailable'

const getDefaultTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yyyy = tomorrow.getFullYear()
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const dd = String(tomorrow.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function MaintenanceModalForm({
  asset,
  site,
  initialData,
  onSave,
  onClose,
  inventory,
  onInventoryUpdated,
  onOpenPartsModal,
  currentUser,
}) {
  const isEditing = Boolean(initialData)
  const userName = currentUser?.name || 'Operations Planner'

  const [task, setTask] = useState(initialData?.task || '')
  const [proposedDate, setProposedDate] = useState(
    initialData?.proposedDate || getDefaultTomorrowDate
  )
  const [startTime, setStartTime] = useState(initialData?.startTime || '08:30')
  const [estimatedHours, setEstimatedHours] = useState(
    initialData?.estimatedHours != null ? String(initialData.estimatedHours) : '4.0'
  )
  const [assignedTeam, setAssignedTeam] = useState(initialData?.assignedTeam || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [status, setStatus] = useState(initialData?.status || 'Draft')
  const [errors, setErrors] = useState({})
  const [quickReserveNotice, setQuickReserveNotice] = useState(null)

  // Look up suggested parts and reservation for this asset
  const suggestedParts = useMemo(() => getSuggestedPartsForAsset(asset), [asset])
  const primaryPart = suggestedParts[0]

  // Check active reservation
  const activeReservation = useMemo(() => {
    return getReservationForAsset(asset.id, inventory)
  }, [asset.id, inventory])

  // Check site inventory item
  const siteId = asset.siteId || site?.id
  const invItem = useMemo(() => {
    if (!primaryPart || !siteId) return null
    return getInventoryItem(siteId, primaryPart.partId, inventory)
  }, [siteId, primaryPart, inventory])

  const onHand = invItem?.onHand ?? 0
  const reserved = invItem?.reserved ?? 0
  const availableStock = Math.max(0, onHand - reserved)

  const hasConfirmedReservation = Boolean(activeReservation)
  const partsReadiness = hasConfirmedReservation ? 'Confirmed' : 'Awaiting confirmation'

  // Dynamic evaluation of readiness & status
  const currentEvaluation = evaluateReadinessAndStatus({
    assignedTeam,
    partsReadiness,
    hasConfirmedReservation,
    status,
  })

  const hasCriticalHSE = site && site.criticalActions > 0

  // Remaining blockers for scheduling
  const blockers = []
  if (!assignedTeam || assignedTeam === 'unassigned') {
    blockers.push('Technician team must be assigned (demo roster).')
  }
  if (!hasConfirmedReservation) {
    blockers.push('Replacement parts must be reserved in site warehouse before scheduling.')
  }

  // Quick Reserve action right inside modal
  const handleQuickReserve = () => {
    if (!primaryPart || availableStock < 1) return
    const res = reserveParts(siteId, primaryPart.partId, asset.id, 1, userName)
    if (res.success) {
      setQuickReserveNotice(`Reserved 1 ${primaryPart.partName} for ${asset.id}.`)
      if (onInventoryUpdated) onInventoryUpdated()
      setTimeout(() => setQuickReserveNotice(null), 4000)
    }
  }

  const handleValidate = () => {
    const newErrors = {}
    if (!task.trim()) {
      newErrors.task = 'Maintenance task is required.'
    }
    if (!proposedDate) {
      newErrors.proposedDate = 'Proposed date is required.'
    }
    if (!startTime) {
      newErrors.startTime = 'Start time is required.'
    }
    const hoursNum = parseFloat(estimatedHours)
    if (isNaN(hoursNum) || hoursNum <= 0) {
      newErrors.estimatedHours = 'Duration must be a positive number of hours (> 0).'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!handleValidate()) return

    const { readiness, status: finalStatus, statusExplanation } = evaluateReadinessAndStatus({
      assignedTeam,
      partsReadiness,
      hasConfirmedReservation,
      status,
    })

    const payload = {
      ...(initialData || {}),
      assetId: asset.id,
      siteId: asset.siteId || site?.id || 'Unknown',
      siteName: asset.siteName || site?.name || 'Unknown',
      equipmentType: asset.type || 'Equipment',
      task: task.trim(),
      proposedDate,
      startTime,
      estimatedHours: parseFloat(estimatedHours),
      assignedTeam,
      partsReadiness,
      hasConfirmedReservation,
      reservedPartId: activeReservation?.partId || (hasConfirmedReservation ? primaryPart?.partId : null),
      reservedPartName: activeReservation?.partName || (hasConfirmedReservation ? primaryPart?.partName : null),
      reservedQty: activeReservation?.qty || (hasConfirmedReservation ? 1 : 0),
      partsConsumed: initialData?.partsConsumed || false,
      readiness,
      status: finalStatus,
      statusExplanation,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
      history: initialData?.history ? [...initialData.history] : [],
    }

    if (!isEditing) {
      payload.createdAt = new Date().toISOString()
      payload.history.push(
        createHistoryEntry(
          finalStatus === 'Scheduled' ? 'Scheduled' : 'Draft created',
          userName,
          statusExplanation
        )
      )
    } else {
      payload.history.push(
        createHistoryEntry(
          'Updated',
          userName,
          `Updated maintenance request. Status: ${finalStatus}, Readiness: ${readiness}.`
        )
      )
    }

    onSave(payload)
    onClose()
  }

  return (
    <>
      {/* Header */}
      <div className="modal-header">
        <div className="modal-title-group">
          <div className="modal-icon-badge">
            <Wrench size={18} />
          </div>
          <div>
            <h3 id="modal-title">
              {isEditing ? `Edit Maintenance Request ${initialData.id}` : 'Schedule Maintenance Request'}
            </h3>
            <p>Integrated equipment, parts readiness &amp; scheduling workflow</p>
          </div>
        </div>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close scheduling modal">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body maint-modal-body">
          {/* Small Equipment Context Card (C) */}
          <div className="maint-context-card">
            <div className="context-card-header">
              <span className="context-card-title">
                <Layers size={13} />
                Historical 2025 Equipment Context
              </span>
              <span className="context-card-tag">CaseQuest2026Dataset.xlsx</span>
            </div>

            <div className="context-grid">
              <div>
                <span className="context-label">Asset &amp; Type</span>
                <span className="context-value">
                  <strong>{asset.id}</strong> · {asset.type}
                </span>
              </div>
              <div>
                <span className="context-label">Site Location</span>
                <span className="context-value">{asset.siteName || site?.name}</span>
              </div>
              <div>
                <span className="context-label">2025 Historical Downtime</span>
                <span className="context-value">
                  {number(asset.hours, 1)} hrs <small>({asset.events || 0} events)</small>
                </span>
              </div>
              <div>
                <span className="context-label">2025 Parts-Wait Hours</span>
                <span className="context-value text-amber-700">
                  {number(asset.partsHours, 1)} hrs
                </span>
              </div>
            </div>

            {/* HSE Visibility & Safety Rules */}
            <div className={`maint-hse-banner ${hasCriticalHSE ? 'hse-warning' : 'hse-normal'}`}>
              {hasCriticalHSE ? (
                <>
                  <ShieldAlert size={16} className="text-amber-700 flex-shrink-0" />
                  <div>
                    <strong>HSE Hold Active for {site?.name || 'Site'}:</strong>
                    <span>
                      Site has {site?.criticalActions} open critical HSE action(s). Open critical actions block site pilot work until supervisor-verified closure. This request saves as a prototype planning entry and does not authorize physical field execution.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Info size={15} className="text-blue-700 flex-shrink-0" />
                  <div>
                    <strong>Prototype Planning Workflow:</strong>
                    <span>
                      No critical HSE actions open for {site?.name || 'Site'}. Physical field execution requires qualified supervisor work authorization and standard permit-to-work procedures.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 3: Compact Readiness Summary */}
          <div className="readiness-summary-card">
            <div className="summary-section-title">
              <ClipboardCheck size={14} className="text-blue-600" />
              <span>Operational Readiness Assessment</span>
            </div>

            <div className="readiness-summary-grid">
              <div>
                <span className="summary-label">Suggested Part</span>
                <span className="summary-val">
                  <strong>{activeReservation?.partName || primaryPart?.partName || 'Wear component'}</strong>
                  <small> (1 kit required)</small>
                </span>
              </div>

              <div>
                <span className="summary-label">Warehouse Reservation</span>
                <span className="summary-val">
                  {hasConfirmedReservation ? (
                    <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> Confirmed ({activeReservation?.qty || 1} kit in {activeReservation?.location || 'warehouse'})
                    </span>
                  ) : availableStock > 0 ? (
                    <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                      <AlertTriangle size={12} /> In stock ({availableStock} avail) — Not reserved
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold inline-flex items-center gap-1">
                      <AlertTriangle size={12} /> Stockout at {asset.siteName || site?.name} (0 available)
                    </span>
                  )}
                </span>
              </div>

              <div>
                <span className="summary-label">Assigned Team</span>
                <span className="summary-val">
                  {assignedTeam && assignedTeam !== 'unassigned' ? (
                    <strong className="text-slate-800">{assignedTeam}</strong>
                  ) : (
                    <span className="text-amber-700 italic">Unassigned (Demo roster)</span>
                  )}
                </span>
              </div>

              <div>
                <span className="summary-label">Proposed Work Window</span>
                <span className="summary-val">
                  {proposedDate ? `${proposedDate} · ${startTime || '08:30'} (${estimatedHours}h)` : 'Date unset'}
                </span>
              </div>
            </div>

            {/* Quick Action: Reserve from Stock if Available */}
            {!hasConfirmedReservation && (
              <div className="summary-quick-actions">
                {availableStock >= 1 ? (
                  <button
                    type="button"
                    className="btn-reserve-inline"
                    onClick={handleQuickReserve}
                  >
                    <Package size={12} />
                    <span>Quick-Reserve 1 Kit from Warehouse</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-check-parts-inline"
                    onClick={() => {
                      onClose()
                      if (onOpenPartsModal) onOpenPartsModal(asset)
                    }}
                  >
                    <Package size={12} />
                    <span>Check Parts / Request Reorder</span>
                  </button>
                )}
                {quickReserveNotice && (
                  <span className="quick-reserve-notice">
                    <CheckCircle2 size={12} /> {quickReserveNotice}
                  </span>
                )}
              </div>
            )}

            {/* Remaining Blockers List */}
            {blockers.length > 0 ? (
              <div className="remaining-blockers-callout">
                <AlertTriangle size={13} className="text-amber-700 flex-shrink-0" />
                <div>
                  <strong>Remaining Preparation Blocker(s):</strong>
                  <ul>
                    {blockers.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="all-clear-callout">
                <CheckCircle2 size={13} className="text-emerald-700 flex-shrink-0" />
                <div>
                  <strong>All Readiness Criteria Met:</strong>
                  <span>Warehouse reservation confirmed and technician team assigned. Eligible for Scheduled work order status.</span>
                </div>
              </div>
            )}
          </div>

          {/* Read-Only Prefilled Fields */}
          <div className="form-row-duo">
            <div className="form-group flex-1">
              <label>Asset ID (Read-only)</label>
              <div className="readonly-field-pill">
                <span className="asset-id">{asset.id}</span>
                <span className="text-gray-500 text-xs">({asset.type})</span>
              </div>
            </div>

            <div className="form-group flex-1">
              <label>Site Location (Read-only)</label>
              <div className="readonly-field-pill">
                <strong>{asset.siteName || site?.name}</strong>
                {site && (
                  <span className="text-gray-500 text-xs">
                    · {site.technicians || 0} techs assigned
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Maintenance Task (Required) */}
          <div className="form-group">
            <label htmlFor="maint-task">
              Maintenance Task <span className="text-red-500">*</span>
            </label>
            <input
              id="maint-task"
              type="text"
              className={`form-input ${errors.task ? 'input-error' : ''}`}
              value={task}
              onChange={(e) => {
                setTask(e.target.value)
                if (errors.task) setErrors((prev) => ({ ...prev, task: null }))
              }}
              placeholder="e.g. Mechanical seal replacement and vibration check"
            />
            {errors.task && <span className="field-error-msg">{errors.task}</span>}

            {/* Quick suggestions */}
            <div className="task-quick-picks">
              <span className="quick-picks-label">Common tasks:</span>
              {COMMON_TASKS.slice(0, 4).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="quick-pick-pill"
                  onClick={() => {
                    setTask(preset)
                    if (errors.task) setErrors((prev) => ({ ...prev, task: null }))
                  }}
                >
                  {preset.split('&')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Proposed Date and Start Time (Required) */}
          <div className="form-row-duo">
            <div className="form-group flex-1">
              <label htmlFor="maint-date">
                Proposed Date <span className="text-red-500">*</span>
              </label>
              <div className="input-with-icon">
                <Calendar size={14} />
                <input
                  id="maint-date"
                  type="date"
                  className={`form-input icon-padded ${errors.proposedDate ? 'input-error' : ''}`}
                  value={proposedDate}
                  onChange={(e) => {
                    setProposedDate(e.target.value)
                    if (errors.proposedDate) setErrors((prev) => ({ ...prev, proposedDate: null }))
                  }}
                />
              </div>
              {errors.proposedDate && (
                <span className="field-error-msg">{errors.proposedDate}</span>
              )}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="maint-time">
                Start Time <span className="text-red-500">*</span>
              </label>
              <div className="input-with-icon">
                <Clock size={14} />
                <input
                  id="maint-time"
                  type="time"
                  className={`form-input icon-padded ${errors.startTime ? 'input-error' : ''}`}
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: null }))
                  }}
                />
              </div>
              {errors.startTime && (
                <span className="field-error-msg">{errors.startTime}</span>
              )}
            </div>
          </div>

          {/* Duration and Assigned Team */}
          <div className="form-row-duo">
            <div className="form-group flex-1">
              <label htmlFor="maint-duration">
                Estimated Duration (Hours) <span className="text-red-500">*</span>
              </label>
              <input
                id="maint-duration"
                type="number"
                step="0.5"
                min="0.5"
                className={`form-input ${errors.estimatedHours ? 'input-error' : ''}`}
                value={estimatedHours}
                onChange={(e) => {
                  setEstimatedHours(e.target.value)
                  if (errors.estimatedHours) setErrors((prev) => ({ ...prev, estimatedHours: null }))
                }}
                placeholder="e.g. 4.0"
              />
              {errors.estimatedHours && (
                <span className="field-error-msg">{errors.estimatedHours}</span>
              )}
              <small className="field-help">Estimated continuous window needed</small>
            </div>

            <div className="form-group flex-1">
              <label htmlFor="maint-team">Assigned Team (Demo)</label>
              <select
                id="maint-team"
                className="form-select"
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
              >
                {DEMO_TEAMS.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.label}
                  </option>
                ))}
              </select>
              <small className="field-help">Demo roster · Dataset lacks individual names</small>
            </div>
          </div>

          {/* Dynamic Readiness & Job Status Evaluation Banner */}
          <div
            className={`readiness-eval-card ${
              currentEvaluation.readiness === 'Ready for review' ? 'eval-ready' : 'eval-blocked'
            }`}
          >
            <div className="eval-icon">
              {currentEvaluation.readiness === 'Ready for review' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>
            <div className="eval-text">
              <div className="eval-status-row">
                <span className="eval-badge readiness-badge">
                  Readiness: {currentEvaluation.readiness}
                </span>
                <span className="eval-badge status-badge">
                  Status: {currentEvaluation.status}
                </span>
              </div>
              <p className="eval-explanation">{currentEvaluation.statusExplanation}</p>
            </div>
          </div>

          {/* Job Status Selection */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="maint-status">Job Status</label>
              {currentEvaluation.readiness === 'Needs preparation' && (
                <span className="tag-note text-amber-700">Blocked: Locked to Draft</span>
              )}
            </div>
            <select
              id="maint-status"
              className="form-select"
              value={currentEvaluation.readiness === 'Needs preparation' ? 'Draft' : status}
              disabled={currentEvaluation.readiness === 'Needs preparation'}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In progress">In progress</option>
              <option value="Completed">Completed</option>
            </select>
            <small className="field-help">
              {currentEvaluation.readiness === 'Needs preparation'
                ? 'Locked to Draft until team is assigned and warehouse parts reservation is confirmed.'
                : 'All prerequisites met. Ready for scheduling or review.'}
            </small>
          </div>

          {/* Notes (Optional) */}
          <div className="form-group">
            <label htmlFor="maint-notes">Planner Notes (Optional)</label>
            <textarea
              id="maint-notes"
              rows={2}
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add lock-out/tag-out specifics, vendor coordination, or special tooling instructions..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {isEditing ? 'Update Maintenance Request' : 'Save Maintenance Request'}
          </button>
        </div>
      </form>
    </>
  )
}

export default function MaintenanceScheduleModal({
  isOpen,
  onClose,
  onSave,
  asset,
  site,
  initialData = null,
  inventory = [],
  onInventoryUpdated,
  onOpenPartsModal,
  currentUser,
}) {
  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !asset) return null

  const formKey = initialData ? initialData.id : `${asset.id}-new`

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-dialog maint-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <MaintenanceModalForm
          key={formKey}
          asset={asset}
          site={site}
          initialData={initialData}
          onSave={onSave}
          onClose={onClose}
          inventory={inventory}
          onInventoryUpdated={onInventoryUpdated}
          onOpenPartsModal={onOpenPartsModal}
          currentUser={currentUser}
        />
      </div>
    </div>
  )
}
