import { useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Search,
  SlidersHorizontal,
  Wrench,
  X,
  Gauge,
  Thermometer,
  ShieldAlert,
  Package,
} from 'lucide-react'
import MaintenanceScheduleModal from './MaintenanceScheduleModal'
import MaintenanceQueueTable from './MaintenanceQueueTable'
import PartsAvailabilityModal from './PartsAvailabilityModal'
import PartsRequestsTable from './PartsRequestsTable'
import {
  loadRequests,
  saveRequests,
  getNextRequestId,
  handleRequestStatusTransition,
  cancelOrDeleteMaintenanceRequest,
  INITIAL_SEED_REQUESTS,
} from '../utils/maintenanceStorage.js'
import {
  loadInventory,
  loadPartsRequests,
  approvePartsRequest,
  rejectPartsRequest,
  updatePartsRequestQty,
  recordPartsReceipt,
} from '../utils/inventoryStorage.js'

const number = (value, digits = 0) =>
  typeof value === 'number' && !isNaN(value)
    ? value.toLocaleString('en-US', { maximumFractionDigits: digits })
    : 'Unavailable'

export default function EquipmentHealthView({
  data,
  selectedSite,
  onSelectSite,
  currentUser,
}) {
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'warning' | 'optimal' | 'stopped'
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState(null)

  // Prototype Maintenance Queue state loaded from localStorage
  const [requests, setRequests] = useState(() => loadRequests())

  // Sample Warehouse Inventory state loaded from localStorage
  const [inventory, setInventory] = useState(() => loadInventory())

  // Parts Requests Queue state loaded from localStorage
  const [partsRequests, setPartsRequests] = useState(() => loadPartsRequests())

  // Maintenance Scheduling Modal State
  const [scheduleModalState, setScheduleModalState] = useState({
    isOpen: false,
    asset: null,
    site: null,
    initialData: null,
  })

  // Parts Availability Modal State
  const [partsModalState, setPartsModalState] = useState({
    isOpen: false,
    asset: null,
    site: null,
  })

  // Extract equipment list from data
  // Realism rule: missing measurements must display as unavailable, not fabricated normal readings.
  const allEquipment = useMemo(() => {
    if (data?.equipment && Array.isArray(data.equipment)) {
      return data.equipment
    }
    return (
      data?.sites?.flatMap((site) =>
        site.assets.map((a) => ({
          ...a,
          siteId: site.id,
          siteName: site.name,
          vibNormal: typeof a.vibNormal === 'number' ? a.vibNormal : null,
          tempNormal: typeof a.tempNormal === 'number' ? a.tempNormal : null,
          currentVib: typeof a.currentVib === 'number' ? a.currentVib : null,
          currentTemp: typeof a.currentTemp === 'number' ? a.currentTemp : null,
          status: a.status || (a.hours > 300 ? 'warning' : 'optimal'),
          abnormalCount: a.abnormalCount || 0,
        }))
      ) || []
    )
  }, [data])

  // Filtered equipment
  const filtered = useMemo(() => {
    return allEquipment.filter((item) => {
      // Site filter
      if (selectedSite && item.siteId !== selectedSite) return false
      // Status filter
      if (filterStatus === 'warning' && item.status !== 'warning') return false
      if (filterStatus === 'optimal' && item.status !== 'optimal') return false
      if (filterStatus === 'stopped' && item.status !== 'stopped') return false
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesId = item.id.toLowerCase().includes(q)
        const matchesType = item.type.toLowerCase().includes(q)
        const matchesSite = item.siteName.toLowerCase().includes(q)
        if (!matchesId && !matchesType && !matchesSite) return false
      }
      return true
    })
  }, [allEquipment, selectedSite, filterStatus, searchQuery])

  // Summary counts
  const counts = useMemo(() => {
    const total = allEquipment.length
    const warning = allEquipment.filter((a) => a.status === 'warning').length
    const optimal = allEquipment.filter((a) => a.status === 'optimal').length
    const stopped = allEquipment.filter((a) => a.status === 'stopped').length
    return { total, warning, optimal, stopped }
  }, [allEquipment])

  // Site HSE Context
  const activeSiteObj = useMemo(() => {
    if (!selectedSite || !data?.sites) return null
    return data.sites.find((s) => s.id === selectedSite)
  }, [selectedSite, data])

  const totalCriticalHSE = useMemo(() => {
    if (!data?.sites) return 0
    return data.sites.reduce((acc, s) => acc + (s.criticalActions || 0), 0)
  }, [data])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Refresh inventory state
  const handleInventoryUpdated = () => {
    setInventory(loadInventory())
  }

  // Handle open scheduling modal
  const handleOpenScheduleModal = (asset) => {
    const siteObj = data?.sites?.find((s) => s.id === asset.siteId) || null
    setScheduleModalState({
      isOpen: true,
      asset,
      site: siteObj,
      initialData: null,
    })
  }

  // Handle open parts availability modal
  const handleOpenPartsModal = (asset) => {
    const siteObj = data?.sites?.find((s) => s.id === asset.siteId) || null
    setPartsModalState({
      isOpen: true,
      asset,
      site: siteObj,
    })
  }

  // Edit existing maintenance request from queue
  const handleEditRequest = (req) => {
    const assetObj = allEquipment.find((a) => a.id === req.assetId) || {
      id: req.assetId,
      siteId: req.siteId,
      siteName: req.siteName,
      type: req.equipmentType,
      hours: 0,
      partsHours: 0,
      events: 0,
    }
    const siteObj = data?.sites?.find((s) => s.id === req.siteId) || null
    setScheduleModalState({
      isOpen: true,
      asset: assetObj,
      site: siteObj,
      initialData: req,
    })
  }

  const handleCloseScheduleModal = () => {
    setScheduleModalState({ isOpen: false, asset: null, site: null, initialData: null })
  }

  const handleClosePartsModal = () => {
    setPartsModalState({ isOpen: false, asset: null, site: null })
  }

  // Save new or updated maintenance request
  const handleSaveRequest = (formData) => {
    let updatedRequests
    if (formData.id) {
      updatedRequests = requests.map((r) => (r.id === formData.id ? formData : r))
      showNotification('success', `Maintenance request ${formData.id} updated successfully.`)
    } else {
      const newId = getNextRequestId(requests)
      const newRequest = {
        ...formData,
        id: newId,
      }
      updatedRequests = [newRequest, ...requests]
      if (newRequest.status === 'Draft') {
        showNotification(
          'info',
          `Maintenance request ${newId} saved as Draft (${newRequest.readiness}).`
        )
      } else {
        showNotification(
          'success',
          `Maintenance request ${newId} scheduled for ${newRequest.proposedDate}.`
        )
      }
    }

    setRequests(updatedRequests)
    saveRequests(updatedRequests)
    handleInventoryUpdated()
  }

  // Status transition in maintenance table (consumes reserved parts on Completed)
  const handleMaintenanceStatusChange = (requestId, newStatus) => {
    const target = requests.find((r) => r.id === requestId)
    if (!target) return

    const res = handleRequestStatusTransition(target, newStatus, currentUser?.name)
    if (!res.success) {
      showNotification('info', res.reason)
      return
    }

    const updated = requests.map((r) => (r.id === requestId ? res.updatedReq : r))
    setRequests(updated)
    saveRequests(updated)

    if (newStatus === 'Completed' && target.hasConfirmedReservation && !target.partsConsumed) {
      handleInventoryUpdated()
      showNotification(
        'success',
        `${requestId} marked Completed: 1 kit of reserved parts consumed from warehouse.`
      )
    } else {
      showNotification('success', `${requestId} status changed to '${newStatus}'.`)
    }
  }

  // Delete maintenance request (releases reservation if active)
  const handleDeleteRequest = (requestId) => {
    const target = requests.find((r) => r.id === requestId)
    const confirmed = window.confirm(
      `Remove ${requestId} (${target?.task || 'request'}) from the prototype queue? Any active warehouse reservation will be released.`
    )
    if (confirmed) {
      const updated = cancelOrDeleteMaintenanceRequest(requests, requestId, currentUser?.name)
      setRequests(updated)
      handleInventoryUpdated()
      showNotification(
        'info',
        `Maintenance request ${requestId} removed. Warehouse reservations released.`
      )
    }
  }

  // Reset sample prototype requests
  const handleResetDemoRequests = () => {
    setRequests(INITIAL_SEED_REQUESTS)
    saveRequests(INITIAL_SEED_REQUESTS)
    showNotification('success', 'Sample prototype maintenance requests reloaded.')
  }

  // Parts Requests Handlers
  const handlePartsRequestCreated = (newReq) => {
    setPartsRequests(loadPartsRequests())
    showNotification('success', `Submitted parts request ${newReq.id} (${newReq.partName}).`)
  }

  const handleApprovePartsRequest = (requestId, plannerNote) => {
    const res = approvePartsRequest(requestId, plannerNote, currentUser?.name)
    if (res.success) {
      setPartsRequests(loadPartsRequests())
      showNotification(
        'success',
        `Approved parts request ${requestId}. Note: On-hand inventory is unchanged until receipt is recorded.`
      )
    }
  }

  const handleRejectPartsRequest = (requestId, reason) => {
    const res = rejectPartsRequest(requestId, reason, currentUser?.name)
    if (res.success) {
      setPartsRequests(loadPartsRequests())
      showNotification('info', `Rejected parts request ${requestId}.`)
    }
  }

  const handleEditPartsRequestQty = (requestId, newQty) => {
    const res = updatePartsRequestQty(requestId, newQty, currentUser?.name)
    if (res.success) {
      setPartsRequests(loadPartsRequests())
      showNotification('success', `Updated quantity for ${requestId} to ${newQty}.`)
    }
  }

  const handleRecordPartsReceipt = (requestId) => {
    const res = recordPartsReceipt(requestId, currentUser?.name)
    if (res.success) {
      setPartsRequests(loadPartsRequests())
      handleInventoryUpdated()
      showNotification(
        'success',
        `Receipt recorded for ${requestId}: Added ${res.request.requestedQty} kit to on-hand stock at ${res.request.siteName}.`
      )
    } else {
      showNotification('info', res.reason)
    }
  }

  return (
    <div className="equipment-view">
      {/* Toast feedback for scheduled PM / status changes */}
      {notification && (
        <div
          className={`schedule-toast-notice ${notification.type === 'info' ? 'toast-info' : 'toast-success'}`}
          role="status"
          aria-live="polite"
        >
          {notification.type === 'info' ? (
            <AlertTriangle size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
          <div>
            <strong>Workflow Confirmation:</strong>
            <span>{notification.message}</span>
          </div>
          <button
            className="toast-dismiss-btn"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">Asset Integrity, Parts &amp; Scheduling</div>
          <h1>Equipment Health &amp; Maintenance Hub</h1>
          <p>
            Connected equipment health, warehouse parts availability, reorder requests, and maintenance scheduling.
          </p>
        </div>
        <div className="period">
          Operations Scope
          <strong>18 Assets · 6 Sites</strong>
        </div>
      </div>

      {/* HSE Operational Context Banner */}
      {activeSiteObj?.criticalActions > 0 ? (
        <div className="equipment-hse-alert hse-critical">
          <ShieldAlert size={17} />
          <div>
            <strong>HSE Pilot Hold for {activeSiteObj.name}:</strong>
            <span>
              {activeSiteObj.criticalActions} critical HSE action(s) open. Open critical actions block site pilot work until verified supervisor closure. Prototype parts reservations and requests serve as planning records only.
            </span>
          </div>
        </div>
      ) : totalCriticalHSE > 0 && !selectedSite ? (
        <div className="equipment-hse-alert hse-info">
          <ShieldAlert size={16} />
          <div>
            <strong>Operations HSE Context:</strong>
            <span>
              {totalCriticalHSE} critical HSE actions currently open across 3 sites (Mesa, Arroyo, Prairie). Open critical actions block pilot work at affected sites. Prototype planning requests do not authorize field work.
            </span>
          </div>
        </div>
      ) : null}

      {/* Telemetry KPI Strip */}
      <section className="metric-grid" aria-label="Equipment health summary">
        <article className="metric">
          <div className="metric-label">
            Monitored Assets
            <Gauge size={17} />
          </div>
          <div className="metric-value">
            {counts.total}
            <span>units</span>
          </div>
          <div className="metric-detail">6 transfer pumps, 6 lift pumps, 6 compressors</div>
        </article>

        <article className="metric">
          <div className="metric-label">
            Early Indicators
            <AlertTriangle size={17} className="text-amber-500" />
          </div>
          <div className="metric-value text-amber-600">
            {counts.warning}
            <span>early alerts</span>
          </div>
          <div className="metric-detail">Vibration &gt; 1.15&times; baseline or abnormal noise indicator</div>
        </article>

        <article className="metric">
          <div className="metric-label">
            Optimal Operating
            <CheckCircle2 size={17} className="text-emerald-500" />
          </div>
          <div className="metric-value text-emerald-600">
            {counts.optimal}
            <span>stable</span>
          </div>
          <div className="metric-detail">Operating within normal vibration and temperature baselines</div>
        </article>

        <article className="metric">
          <div className="metric-label">
            Estimated Avoidable Loss (Modeled)
            <Activity size={17} />
          </div>
          <div className="metric-value">
            $3.22M
            <span>mechanical</span>
          </div>
          <div className="metric-detail">
            Estimated 57.6% mechanical downtime reduction potential under modeled condition monitoring (O1)
          </div>
        </article>
      </section>

      {/* Control Bar: Search & Status Filters */}
      <div className="equipment-controls">
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by asset ID (A001), equipment type, or site..."
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
            <SlidersHorizontal size={12} /> Status:
          </span>
          <button
            className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({counts.total})
          </button>
          <button
            className={`filter-pill warning-pill ${filterStatus === 'warning' ? 'active' : ''}`}
            onClick={() => setFilterStatus('warning')}
          >
            Warnings ({counts.warning})
          </button>
          <button
            className={`filter-pill optimal-pill ${filterStatus === 'optimal' ? 'active' : ''}`}
            onClick={() => setFilterStatus('optimal')}
          >
            Optimal ({counts.optimal})
          </button>
        </div>

        {selectedSite && (
          <div className="site-filter-chip">
            <span>
              Site: <strong>{activeSiteObj?.name || selectedSite}</strong>
            </span>
            <button onClick={() => onSelectSite(null)} title="Clear site filter" aria-label="Clear site filter">
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Equipment Cards Grid */}
      <div className="equipment-grid">
        {filtered.map((asset) => {
          const isWarning = asset.status === 'warning'
          const isStopped = asset.status === 'stopped'
          const hasVib = typeof asset.currentVib === 'number' && typeof asset.vibNormal === 'number' && asset.vibNormal > 0
          const hasTemp = typeof asset.currentTemp === 'number' && typeof asset.tempNormal === 'number' && asset.tempNormal > 0
          const vibRatio = hasVib ? asset.currentVib / asset.vibNormal : 1
          const tempRatio = hasTemp ? asset.currentTemp / asset.tempNormal : 1

          return (
            <article
              key={asset.id}
              className={`equipment-card ${isWarning ? 'has-warning' : isStopped ? 'is-stopped' : 'is-optimal'}`}
            >
              {/* Card Header */}
              <div className="equip-card-header">
                <div>
                  <div className="equip-id-row">
                    <span className="equip-badge">{asset.id}</span>
                    <span className="equip-site-tag">{asset.siteName}</span>
                    <span className="equip-crit-tag">{asset.criticality} Priority</span>
                  </div>
                  <h3 className="equip-title">{asset.type}</h3>
                </div>

                <div className={`status-pill ${asset.status}`}>
                  {isWarning ? (
                    <>
                      <AlertTriangle size={12} />
                      <span>Warning</span>
                    </>
                  ) : isStopped ? (
                    <>
                      <Clock3 size={12} />
                      <span>Stopped</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Optimal</span>
                    </>
                  )}
                </div>
              </div>

              {/* Sensor Telemetry Indicators */}
              <div className="telemetry-box">
                {/* Vibration Gauge */}
                <div className="sensor-row">
                  <div className="sensor-label">
                    <Gauge size={13} />
                    <span>Vibration:</span>
                  </div>
                  <div className="sensor-reading">
                    <strong className={isWarning ? 'text-amber-700' : 'text-slate-800'}>
                      {typeof asset.currentVib === 'number'
                        ? `${asset.currentVib.toFixed(2)} mm/s`
                        : 'Unavailable'}
                    </strong>
                    <small>
                      {typeof asset.vibNormal === 'number'
                        ? `(baseline ${asset.vibNormal} mm/s)`
                        : '(baseline unavailable)'}
                    </small>
                  </div>
                </div>
                <div className="meter-bar">
                  {hasVib ? (
                    <>
                      <div
                        className={`meter-fill ${isWarning ? 'meter-amber' : 'meter-green'}`}
                        style={{ width: `${Math.min(vibRatio * 60, 100)}%` }}
                      />
                      <div
                        className="meter-target-line"
                        style={{ left: '60%' }}
                        title={`Baseline: ${asset.vibNormal} mm/s`}
                      />
                    </>
                  ) : (
                    <div className="meter-unavailable">No reading available</div>
                  )}
                </div>

                {/* Temperature Gauge */}
                <div className="sensor-row mt-2">
                  <div className="sensor-label">
                    <Thermometer size={13} />
                    <span>Temperature:</span>
                  </div>
                  <div className="sensor-reading">
                    <strong>
                      {typeof asset.currentTemp === 'number'
                        ? `${asset.currentTemp.toFixed(1)}°C`
                        : 'Unavailable'}
                    </strong>
                    <small>
                      {typeof asset.tempNormal === 'number'
                        ? `(baseline ${asset.tempNormal}°C)`
                        : '(baseline unavailable)'}
                    </small>
                  </div>
                </div>
                <div className="meter-bar">
                  {hasTemp ? (
                    <>
                      <div
                        className="meter-fill meter-blue"
                        style={{ width: `${Math.min(tempRatio * 65, 100)}%` }}
                      />
                      <div
                        className="meter-target-line"
                        style={{ left: '65%' }}
                        title={`Baseline: ${asset.tempNormal}°C`}
                      />
                    </>
                  ) : (
                    <div className="meter-unavailable">No reading available</div>
                  )}
                </div>
              </div>

              {/* Anomaly / Warning Callout */}
              {isWarning && hasVib && (
                <div className="anomaly-callout">
                  <AlertTriangle size={13} />
                  <div>
                    <strong>Early Degradation Indicator Detected</strong>
                    <p>
                      Vibration is {((vibRatio - 1) * 100).toFixed(0)}% above baseline. Proactive inspection can help mitigate unplanned bearing downtime.
                    </p>
                  </div>
                </div>
              )}

              {/* Annual Loss & Downtime Stats */}
              <div className="equip-stats-grid">
                <div>
                  <span className="stat-name">2025 Downtime</span>
                  <span className="stat-val">{number(asset.hours, 1)} hrs</span>
                </div>
                <div>
                  <span className="stat-name">Waiting on Parts</span>
                  <span className="stat-val text-amber-700">{number(asset.partsHours, 1)} hrs</span>
                </div>
                <div>
                  <span className="stat-name">Modeled Loss</span>
                  <span className="stat-val text-blue-700">${number(asset.loss)}</span>
                </div>
              </div>

              {/* Dual Card Actions: Check Parts & Schedule Maintenance */}
              <div className="equip-card-footer">
                <div className="card-actions-row">
                  <button
                    type="button"
                    className="parts-check-btn"
                    onClick={() => handleOpenPartsModal(asset)}
                    title="Check sample warehouse parts availability and reservations"
                  >
                    <Package size={13} />
                    <span>Check parts</span>
                  </button>

                  <button
                    type="button"
                    className={`schedule-btn ${isWarning ? 'btn-warn' : 'btn-normal'}`}
                    onClick={() => handleOpenScheduleModal(asset)}
                  >
                    <Wrench size={13} />
                    <span>Schedule maintenance</span>
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No equipment matches your current filter or search criteria.</p>
          <button
            className="btn-secondary"
            onClick={() => {
              setFilterStatus('all')
              setSearchQuery('')
              onSelectSite(null)
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Section 1: Saved Maintenance Queue */}
      <MaintenanceQueueTable
        requests={requests}
        onEditRequest={handleEditRequest}
        onStatusChange={handleMaintenanceStatusChange}
        onDeleteRequest={handleDeleteRequest}
        onResetDemoRequests={handleResetDemoRequests}
        selectedSite={selectedSite}
      />

      {/* Section 2: Reorder Requests & Replenishment Queue */}
      <PartsRequestsTable
        requests={partsRequests}
        onApprove={handleApprovePartsRequest}
        onReject={handleRejectPartsRequest}
        onEditQty={handleEditPartsRequestQty}
        onRecordReceipt={handleRecordPartsReceipt}
        selectedSite={selectedSite}
      />

      {/* Parts Availability Modal */}
      <PartsAvailabilityModal
        isOpen={partsModalState.isOpen}
        onClose={handleClosePartsModal}
        asset={partsModalState.asset}
        site={partsModalState.site}
        inventory={inventory}
        onInventoryUpdated={handleInventoryUpdated}
        onPartsRequestCreated={handlePartsRequestCreated}
        currentUser={currentUser}
      />

      {/* Maintenance Scheduling Modal */}
      <MaintenanceScheduleModal
        isOpen={scheduleModalState.isOpen}
        onClose={handleCloseScheduleModal}
        onSave={handleSaveRequest}
        asset={scheduleModalState.asset}
        site={scheduleModalState.site}
        initialData={scheduleModalState.initialData}
        inventory={inventory}
        onInventoryUpdated={handleInventoryUpdated}
        onOpenPartsModal={handleOpenPartsModal}
        currentUser={currentUser}
      />
    </div>
  )
}
