import { useState, useMemo, useEffect } from 'react'
import {
  X,
  Package,
  Layers,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  ShoppingCart,
  MapPin,
  Warehouse,
} from 'lucide-react'
import {
  getSuggestedPartsForAsset,
  getInventoryItem,
  getAlternativeSiteStock,
  getReservationForAsset,
  reserveParts,
  releaseReservation,
  createPartsRequest,
} from '../utils/inventoryStorage.js'

function PartsAvailabilityContent({
  asset,
  site,
  inventory,
  onInventoryUpdated,
  onPartsRequestCreated,
  currentUser,
  onClose,
}) {
  const userName = currentUser?.name || 'Operations Planner'
  const suggestedParts = useMemo(() => getSuggestedPartsForAsset(asset), [asset])

  const [selectedPartId, setSelectedPartId] = useState(
    suggestedParts[0]?.partId || ''
  )
  const [requiredQty, setRequiredQty] = useState(1)
  const [isReorderOpen, setIsReorderOpen] = useState(false)
  const [reorderPriority, setReorderPriority] = useState('Standard')
  const [reorderReason, setReorderReason] = useState('')
  const [reorderQty, setReorderQty] = useState(1)
  const [transferSourceSite, setTransferSourceSite] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const selectedPart =
    suggestedParts.find((p) => p.partId === selectedPartId) || suggestedParts[0]
  const currentPartId = selectedPart?.partId

  // Inventory record for this site & part
  const siteId = asset.siteId || site?.id
  const siteName = asset.siteName || site?.name
  const invItem = getInventoryItem(siteId, currentPartId, inventory)

  const onHand = invItem?.onHand ?? 0
  const reserved = invItem?.reserved ?? 0
  const available = Math.max(0, onHand - reserved)
  const minStock = invItem?.minStock ?? 2
  const location = invItem?.location || `${siteName} Warehouse`
  const unit = invItem?.unit || 'kit'

  // Check if this specific asset already holds an active reservation
  const activeReservation = getReservationForAsset(asset.id, inventory)
  const isCurrentlyReservedForAsset =
    activeReservation && activeReservation.partId === currentPartId

  // Alternative site stocks
  const altSites = getAlternativeSiteStock(currentPartId, siteId, inventory)
  const isStockout = available < requiredQty

  // Handle Reserve Parts
  const handleReserve = () => {
    const res = reserveParts(siteId, currentPartId, asset.id, requiredQty, userName)
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Reserved ${requiredQty} ${unit} of ${selectedPart.partName} for ${asset.id}.`,
      })
      onInventoryUpdated()
    } else {
      setFeedback({ type: 'error', message: res.reason })
    }
  }

  // Handle Release Reservation
  const handleRelease = () => {
    const res = releaseReservation(siteId, currentPartId, asset.id)
    if (res.success) {
      setFeedback({
        type: 'info',
        message: `Released reservation for ${asset.id}. Stock restored to available pool.`,
      })
      onInventoryUpdated()
    } else {
      setFeedback({ type: 'error', message: res.reason })
    }
  }

  // Handle Submit Reorder / Transfer Request
  const handleSubmitRequest = (isTransfer = false, sourceSite = null) => {
    const qty = parseInt(reorderQty, 10) || 1
    const defaultReason = isTransfer
      ? `Inter-site transfer from ${sourceSite?.siteName} to ${siteName} for ${asset.id} (${asset.type}). Historical parts wait: ${asset.partsHours || 0} hrs.`
      : `Reorder replenishment for ${asset.id} (${asset.type}) at ${siteName}. Historical parts wait: ${asset.partsHours || 0} hrs.`

    const reqData = {
      assetId: asset.id,
      assetType: asset.type,
      siteId,
      siteName,
      partId: currentPartId,
      partName: selectedPart.partName,
      requestedQty: qty,
      requestType: isTransfer ? 'Site Transfer' : 'Reorder',
      sourceSiteId: isTransfer && sourceSite ? sourceSite.siteId : null,
      sourceSiteName: isTransfer && sourceSite ? sourceSite.siteName : null,
      priority: reorderPriority,
      reason: reorderReason.trim() || defaultReason,
      historicalWaitHours: asset.partsHours || 0,
    }

    const created = createPartsRequest(reqData, userName)
    setFeedback({
      type: 'success',
      message: `${isTransfer ? 'Transfer request' : 'Reorder request'} ${created.id} submitted for planner review.`,
    })
    setIsReorderOpen(false)
    setTransferSourceSite(null)
    onPartsRequestCreated(created)
  }

  const openReorderForm = (isTransfer = false, srcSite = null) => {
    setTransferSourceSite(srcSite)
    setReorderPriority(asset.status === 'warning' ? 'Urgent' : 'Standard')
    setReorderQty(Math.max(1, requiredQty - available))
    setReorderReason(
      isTransfer && srcSite
        ? `Expedited transfer from ${srcSite.siteName} for maintenance on ${asset.id}. Historical parts waiting: ${asset.partsHours || 0} hrs.`
        : `Replenishment for ${asset.id} (${asset.type}). Available stock: ${available}. Historical parts wait: ${asset.partsHours || 0} hrs.`
    )
    setIsReorderOpen(true)
  }

  return (
    <>
      {/* Header */}
      <div className="modal-header">
        <div className="modal-title-group">
          <div className="modal-icon-badge">
            <Package size={18} />
          </div>
          <div>
            <h3 id="parts-modal-title">Parts Availability &amp; Readiness</h3>
            <p>Sample warehouse inventory · Prototype planning workflow</p>
          </div>
        </div>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close parts modal">
          <X size={16} />
        </button>
      </div>

      <div className="modal-body parts-modal-body">
        {/* Feedback Notice */}
        {feedback && (
          <div
            className={`queue-inline-notice ${
              feedback.type === 'error'
                ? 'notice-blocked'
                : feedback.type === 'info'
                ? 'notice-info'
                : 'notice-success'
            }`}
            role="status"
            style={{ margin: '0 0 10px 0' }}
          >
            {feedback.type === 'error' ? (
              <AlertTriangle size={14} />
            ) : (
              <CheckCircle2 size={14} />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Asset & Context Card */}
        <div className="maint-context-card">
          <div className="context-card-header">
            <span className="context-card-title">
              <Layers size={13} />
              Equipment &amp; Site Scope
            </span>
            <span className="context-card-tag">{siteName}</span>
          </div>
          <div className="context-grid">
            <div>
              <span className="context-label">Asset</span>
              <span className="context-value">
                <strong>{asset.id}</strong> · {asset.type}
              </span>
            </div>
            <div>
              <span className="context-label">Site Storage</span>
              <span className="context-value">{location}</span>
            </div>
            <div>
              <span className="context-label">2025 Historical Parts Wait</span>
              <span className="context-value text-amber-700">
                {asset.partsHours != null ? `${Number(asset.partsHours).toFixed(1)} hrs` : 'Unavailable'}
              </span>
            </div>
            <div>
              <span className="context-label">Downtime Events</span>
              <span className="context-value">{asset.events || 0} events</span>
            </div>
          </div>

          {/* HSE Safety Notice distinguishing field authorization */}
          <div className="maint-hse-banner hse-normal">
            <ShieldAlert size={15} className="text-blue-700 flex-shrink-0" />
            <div>
              <strong>Parts Readiness vs Field Authorization:</strong>
              <span>
                Parts availability confirms warehouse staging only. Under case rules, critical open HSE actions ({site?.criticalActions || 0}) block field pilot execution until supervisor-verified closure.
              </span>
            </div>
          </div>
        </div>

        {/* Suggested Part Selector */}
        <div className="form-group">
          <div className="form-label-row">
            <label>Suggested Replacement Part</label>
            <span className="tag-note">Sample Catalog · Not Confirmed Diagnosis</span>
          </div>
          <div className="part-selection-pills">
            {suggestedParts.map((sp) => (
              <button
                key={sp.partId}
                type="button"
                className={`part-pill-btn ${sp.partId === currentPartId ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPartId(sp.partId)
                  setIsReorderOpen(false)
                  setFeedback(null)
                }}
              >
                <Package size={13} />
                <span>{sp.partName}</span>
                <small>({sp.partId})</small>
              </button>
            ))}
          </div>
          {selectedPart?.reason && (
            <small className="field-help text-slate-600">
              <Info size={11} className="inline mr-1" />
              {selectedPart.reason}
            </small>
          )}
        </div>

        {/* Stock Metrics Grid */}
        <div className="inventory-metric-strip">
          <div className="inv-metric-box">
            <span className="inv-metric-label">On Hand</span>
            <span className="inv-metric-val">{onHand}</span>
            <small>{unit}</small>
          </div>
          <div className="inv-metric-box">
            <span className="inv-metric-label">Reserved</span>
            <span className="inv-metric-val text-amber-700">{reserved}</span>
            <small>{unit}</small>
          </div>
          <div className="inv-metric-box highlight">
            <span className="inv-metric-label">Available</span>
            <span className={`inv-metric-val ${available > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {available}
            </span>
            <small>{available > 0 ? 'Ready to allocate' : 'Stockout'}</small>
          </div>
          <div className="inv-metric-box">
            <span className="inv-metric-label">Min Stock</span>
            <span className="inv-metric-val">{minStock}</span>
            <small>Threshold</small>
          </div>
        </div>

        {/* Current Reservation Status on this Asset */}
        {isCurrentlyReservedForAsset && (
          <div className="active-reservation-card">
            <div className="res-card-left">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <div>
                <strong>Active Reservation for {asset.id}:</strong>
                <span>
                  {activeReservation.qty} {unit} reserved by {activeReservation.reservedBy || 'Planner'}. Linked to maintenance scheduling.
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={handleRelease}
              title="Release reserved part back to available warehouse pool"
            >
              Release Reservation
            </button>
          </div>
        )}

        {/* Required Quantity Input & Actions */}
        <div className="reservation-action-bar">
          <div className="required-qty-box">
            <label htmlFor="req-qty">Required Qty:</label>
            <input
              id="req-qty"
              type="number"
              min="1"
              max="10"
              value={requiredQty}
              onChange={(e) => setRequiredQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="qty-input"
            />
            <span className="unit-label">{unit}</span>
          </div>

          <div className="reservation-btns">
            {available >= requiredQty ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleReserve}
                disabled={isCurrentlyReservedForAsset && activeReservation?.qty >= requiredQty}
              >
                <Package size={13} />
                <span>
                  {isCurrentlyReservedForAsset ? 'Update Reservation' : 'Reserve Parts'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-warn"
                onClick={() => openReorderForm(false)}
              >
                <ShoppingCart size={13} />
                <span>Request Reorder (Shortage)</span>
              </button>
            )}
          </div>
        </div>

        {/* Alternative Sites with Stock (Inter-Site Transfer) */}
        {altSites.length > 0 && isStockout && (
          <div className="alt-sites-box">
            <div className="alt-sites-header">
              <ArrowRightLeft size={13} />
              <span>Available at Other Sites (Inter-Site Transfer)</span>
            </div>
            <div className="alt-sites-list">
              {altSites.map((as) => (
                <div key={as.siteId} className="alt-site-item">
                  <div className="alt-site-info">
                    <MapPin size={12} className="text-blue-600" />
                    <strong>{as.siteName}</strong>
                    <span className="alt-stock-badge">
                      {as.available} {unit} available
                    </span>
                    <small className="text-gray-500">({as.location})</small>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => openReorderForm(true, as)}
                  >
                    <ArrowRightLeft size={11} />
                    <span>Request Transfer</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Reorder / Transfer Sub-form */}
        {isReorderOpen && (
          <div className="reorder-subform">
            <div className="reorder-subform-header">
              <strong>
                {transferSourceSite
                  ? `Initiate Transfer from ${transferSourceSite.siteName} to ${siteName}`
                  : `Initiate Parts Reorder for ${siteName}`}
              </strong>
              <button
                type="button"
                className="btn-text-close"
                onClick={() => setIsReorderOpen(false)}
              >
                <X size={13} />
              </button>
            </div>

            <p className="reorder-data-explanation">
              Historical parts waiting on {asset.id}: <strong>{asset.partsHours || 0} hrs</strong>.
              Current available stock at {siteName}: <strong>{available} {unit}</strong>.
            </p>

            <div className="form-row-duo">
              <div className="form-group flex-1">
                <label>Quantity to Request</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={reorderQty}
                  onChange={(e) => setReorderQty(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label>Priority</label>
                <select
                  className="form-select"
                  value={reorderPriority}
                  onChange={(e) => setReorderPriority(e.target.value)}
                >
                  <option value="Standard">Standard</option>
                  <option value="Urgent">Urgent (Production Critical)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Planner Justification / Reason</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={reorderReason}
                onChange={(e) => setReorderReason(e.target.value)}
                placeholder="Reason for order or transfer..."
              />
            </div>

            <div className="reorder-subform-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsReorderOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSubmitRequest(Boolean(transferSourceSite), transferSourceSite)}
              >
                {transferSourceSite ? 'Submit Transfer Request' : 'Submit Reorder Request'}
              </button>
            </div>
          </div>
        )}

        {/* Sample Inventory Concise Note */}
        <div className="parts-modal-note">
          <Warehouse size={12} />
          <span>
            <strong>Sample Inventory:</strong> Modeled for hackathon prototype workflow. Approval is a planning decision; inventory increases only upon receipt recording.
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  )
}

export default function PartsAvailabilityModal({
  isOpen,
  onClose,
  asset,
  site,
  inventory,
  onInventoryUpdated,
  onPartsRequestCreated,
  currentUser,
}) {
  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !asset) return null

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="parts-modal-title"
    >
      <div className="modal-dialog parts-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <PartsAvailabilityContent
          key={asset.id}
          asset={asset}
          site={site}
          inventory={inventory}
          onInventoryUpdated={onInventoryUpdated}
          onPartsRequestCreated={onPartsRequestCreated}
          currentUser={currentUser}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
