import { useSyncExternalStore } from 'react'
import { loadPartsRequests, createPartsRequest, recordPartsReceipt, getInventoryItem, getAlternativeSiteStock, getSuggestedPartsForAsset, approvePartsRequest, rejectPartsRequest, updatePartsRequestQty } from '../utils/inventoryStorage.js'
import { assertCan, ACTIONS } from './permissions.js'
import { logActivity, EVENT_TYPES } from './activityLog.js'
let data = { sites: [], equipment: [] }
let revision = 0
const listeners = new Set()
export function setPartsData(workbook) { data = workbook || { sites: [], equipment: [] } }
export function notifyPartsChanged() { revision++; listeners.forEach(fn => fn()) }
export function subscribeParts(fn) { listeners.add(fn); return () => listeners.delete(fn) }
if (typeof window !== 'undefined') { window.addEventListener('cq-parts-changed', notifyPartsChanged); window.addEventListener('storage', notifyPartsChanged); window.addEventListener('cq-demo-reset', notifyPartsChanged) }
export function likelyPartFor(asset, cause) {
  const suggested = getSuggestedPartsForAsset(asset)
  if (!cause) return suggested[0]
  const text = cause.toLowerCase()
  if (text.includes('bearing')) return suggested.find(p => ['PB-270','BA-440'].includes(p.partId))
  if (text.includes('seal')) return suggested.find(p => p.partId === 'SK-58B')
  return undefined
}
export function stockAt(siteId, partId) { const item = getInventoryItem(siteId, partId); return { known: Boolean(item), onHand: item?.onHand || 0, reserved: item?.reserved || 0, available: Math.max(0, (item?.onHand || 0) - (item?.reserved || 0)), minStock: item?.minStock || 0, maxStock: item?.maxStock ?? (item?.minStock || 0) * 2 } }
export function stockElsewhere(partId, excludeSiteId) { return getAlternativeSiteStock(partId, excludeSiteId).map(s => ({ ...s, etaHours: null })) }
function validateQty(qty) { if (!Number.isInteger(qty) || qty < 1) throw new Error('Quantity must be a positive whole number.') }
function detail(siteId, assetId, partId) { const asset = data.equipment?.find(a => a.id === assetId); const site = data.sites?.find(s => s.id === siteId); const part = getSuggestedPartsForAsset(asset).find(p => p.partId === partId); return { siteName: site?.name || siteId, assetType: asset?.type, historicalWaitHours: asset ? (data.events || []).filter(e => e.assetId === assetId && e.type === 'Unplanned').reduce((total, e) => total + e.stages.partsWait, 0) : null, partName: part?.partName || partId } }
export function createRushReorder(user, input) { assertCan(user, ACTIONS.STAGE_PART, input); validateQty(input.qty); const request = createPartsRequest({ ...input, ...detail(input.siteId, input.assetId, input.partId), requestedQty: input.qty, priority: 'Urgent' }, user); logActivity(user, { type: EVENT_TYPES.REORDER_CREATED, siteId: input.siteId, assetId: input.assetId, entityId: request.id, reason: input.reason, meta: { source: input.source, warningId: input.warningId } }); notifyPartsChanged(); return request }
export function createTransfer(user, input) { assertCan(user, ACTIONS.STAGE_PART, { siteId: input.toSiteId }); assertCan(user, ACTIONS.STAGE_PART, { siteId: input.fromSiteId }); validateQty(input.qty); if (input.fromSiteId === input.toSiteId) throw new Error('Select a different source site.'); if (stockAt(input.fromSiteId, input.partId).available < input.qty) throw new Error('Insufficient stock at the source site.'); const request = createPartsRequest({ ...input, ...detail(input.toSiteId, input.assetId, input.partId), siteId: input.toSiteId, requestedQty: input.qty, sourceSiteId: input.fromSiteId, sourceSiteName: data.sites?.find(s => s.id === input.fromSiteId)?.name || input.fromSiteId, requestType: 'Site Transfer', priority: 'Urgent' }, user); logActivity(user, { type: EVENT_TYPES.TRANSFER_REQUESTED, siteId: input.toSiteId, assetId: input.assetId, entityId: request.id, reason: input.reason, meta: { fromSiteId: input.fromSiteId } }); notifyPartsChanged(); return request }
export function markReceived(user, requestId) { const existing = loadPartsRequests().find(r => r.id === requestId); if (!existing) throw new Error('Request not found.'); assertCan(user, ACTIONS.DECIDE_REORDER, { siteId: existing.siteId }); const result = recordPartsReceipt(requestId, user); if (!result.success) throw new Error(result.reason); logActivity(user, { type: EVENT_TYPES.REORDER_RECEIVED, siteId: existing.siteId, assetId: existing.assetId, entityId: requestId }); notifyPartsChanged(); return result.request }
export function usePartsRequests(filter = {}) { useSyncExternalStore(subscribeParts, () => revision, () => revision); return loadPartsRequests().filter(r => Object.entries(filter).every(([key, value]) => value == null || r[key] === value)) }

export function createDispatchReorder(user, input) {
  assertCan(user, ACTIONS.RUN_DISPATCH_CHECK, input)
  validateQty(input.qty)
  const before = loadPartsRequests()
  const request = createPartsRequest({ ...input, ...detail(input.siteId, input.assetId, input.partId), source: 'pre-dispatch', dedupeKey: `dispatch:${input.siteId}:${input.assetId}:${input.partId}`, requestedQty: input.qty, priority: 'Urgent' }, user, true)
  if (!before.some(r => r.id === request.id)) logActivity(user, { type: EVENT_TYPES.REORDER_CREATED, siteId: input.siteId, assetId: input.assetId, entityId: request.id, reason: input.reason, meta: { source: 'pre-dispatch' } })
  notifyPartsChanged()
  return request
}

function decide(user, requestId, type, action) {
  const request = loadPartsRequests().find(r => r.id === requestId)
  if (!request) throw new Error('Request not found.')
  assertCan(user, ACTIONS.DECIDE_REORDER, request)
  const result = action()
  if (!result.success) throw new Error(result.reason)
  logActivity(user, { type, siteId: request.siteId, assetId: request.assetId, entityId: requestId, reason: result.request.plannerDecision })
  notifyPartsChanged()
  return result.request
}
export function approveReorder(user, id, note = '') { return decide(user, id, EVENT_TYPES.REORDER_APPROVED, () => approvePartsRequest(id, note, user)) }
export function rejectReorder(user, id, reason) { return decide(user, id, EVENT_TYPES.REORDER_REJECTED, () => rejectPartsRequest(id, reason, user)) }
export function editReorderQty(user, id, qty) { validateQty(qty); return decide(user, id, EVENT_TYPES.REORDER_QTY_EDITED, () => updatePartsRequestQty(id, qty, user)) }

export function createDispatchTransfer(user, input) {
  assertCan(user, ACTIONS.RUN_DISPATCH_CHECK, { siteId: input.toSiteId })
  validateQty(input.qty)
  if (input.fromSiteId === input.toSiteId) throw new Error('Select a different source site.')
  if (stockAt(input.fromSiteId,input.partId).available < input.qty) throw new Error('Insufficient source stock.')
  const before = loadPartsRequests()
  const request = createPartsRequest({...input,...detail(input.toSiteId,input.assetId,input.partId),siteId:input.toSiteId,source:'pre-dispatch',sourceSiteId:input.fromSiteId,sourceSiteName:data.sites?.find(s=>s.id===input.fromSiteId)?.name || input.fromSiteId,requestType:'Site Transfer',priority:'Urgent',requestedQty:input.qty,dedupeKey:`dispatch-transfer:${input.toSiteId}:${input.fromSiteId}:${input.assetId}:${input.partId}`},user,true)
  if (!before.some(r=>r.id===request.id)) logActivity(user,{type:EVENT_TYPES.TRANSFER_REQUESTED,siteId:input.toSiteId,assetId:input.assetId,entityId:request.id,reason:input.reason,meta:{fromSiteId:input.fromSiteId}})
  notifyPartsChanged()
  return request
}
