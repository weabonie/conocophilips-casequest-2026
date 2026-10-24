import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import {
  DEMO_TEAMS,
  PARTS_READINESS_OPTIONS,
  COMMON_TASKS,
  evaluateReadinessAndStatus,
} from '../utils/maintenanceStorage'

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

function MaintenanceModalForm({ asset, site, initialData, onSave, onClose }) {
  const isEditing = Boolean(initialData)

  const [task, setTask] = useState(initialData?.task || '')
  const [proposedDate, setProposedDate] = useState(
    initialData?.proposedDate || getDefaultTomorrowDate
  )
  const [startTime, setStartTime] = useState(initialData?.startTime || '08:30')
  const [estimatedHours, setEstimatedHours] = useState(
    initialData?.estimatedHours != null ? String(initialData.estimatedHours) : '4.0'
  )
  const [assignedTeam, setAssignedTeam] = useState(initialData?.assignedTeam || '')
  const [partsReadiness, setPartsReadiness] = useState(
    initialData?.partsReadiness || 'Not checked'
  )
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [status, setStatus] = useState(initialData?.status || 'Draft')
  const [errors, setErrors] = useState({})

  // Live preview evaluation
  const currentEvaluation = evaluateReadinessAndStatus({
    assignedTeam,
    partsReadiness,
    status,
  })

  const hasCriticalHSE = site && site.criticalActions > 0

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
      readiness,
      status: finalStatus,
      statusExplanation,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    }

    if (!isEditing) {
      payload.createdAt = new Date().toISOString()
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
            <p>Plan the work window, team assignment, and parts readiness.</p>
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
                Equipment history
              </span>
              <span className="context-card-tag">2025</span>
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
                <span className="context-label">2025 downtime</span>
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
                      {site?.criticalActions} critical actions require verified closure before the site pilot can start.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Info size={15} className="text-blue-700 flex-shrink-0" />
                  <div>
                    <strong>Work authorization:</strong>
                    <span>
                      No critical HSE actions recorded. Field work requires supervisor authorization.
                    </span>
                  </div>
                </>
              )}
            </div>
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
              <label htmlFor="maint-team">Assigned team</label>
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
              <small className="field-help">Sample team roster</small>
            </div>
          </div>

          {/* Parts Readiness Selection */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="maint-parts">Parts Readiness</label>
              <span className="tag-note">User-reported status</span>
            </div>
            <select
              id="maint-parts"
              className="form-select"
              value={partsReadiness}
              onChange={(e) => setPartsReadiness(e.target.value)}
            >
              {PARTS_READINESS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <small className="field-help">
              Requires &apos;Confirmed&apos; alongside an assigned team to schedule. Otherwise saves as Draft.
            </small>
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
                ? 'Locked to Draft until team is assigned and parts readiness is Confirmed.'
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
        />
      </div>
    </div>
  )
}
