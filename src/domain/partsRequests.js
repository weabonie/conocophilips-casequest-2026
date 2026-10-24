import { useMemo } from 'react'
import { createPersistentStore, useStore } from './store.js'
import { assertCan, ACTIONS } from './permissions.js'
import { EVENT_TYPES, logActivity } from './activityLog.js'
import {
  createPartsRequest,
  getAlternativeSiteStock,
  getInventoryItem,
  getSuggestedPartsForAsset,
  loadInventory,
  loadPartsRequests,
  recordPartsReceipt,
} from '../utils/inventoryStorage.js'

const requestStore = createPersistentStore({ key: 'parts_requests_facade', version: 1, initial: () => loadPartsRequests() })

function siteNameFor(siteId) {
  const item = loadInventory().find((candidate) => candidate.siteId === siteId)
  return item?.siteName || siteId
}

function refreshRequests() {
  const requests = loadPartsRequests()
  requestStore.set(requests)
  return requests
}

export function likelyPartFor(asset, cause) {
  const suggestions = getSuggestedPartsForAsset({ ...asset, cause })
  const preferred = cause?.toLowerCase().includes('bearing') ? suggestions.find((part) => part.partId === 'BA-440') : null
  return preferred || suggestions[0] || { partId: 'unknown', partName: 'unknown' }
}

export function stockAt(siteId, partId) {
  const item = getInventoryItem(siteId, partId)
  if (!item) return { onHand: 0, reserved: 0, available: 0, minStock: 0, maxStock: 0 }
  return {
    onHand: item.onHand || 0,
    reserved: item.reserved || 0,
    available: Math.max(0, (item.onHand || 0) - (item.reserved || 0)),
    minStock: item.minStock || 0,
    maxStock: item.maxStock || Math.max(item.minStock || 0, (item.minStock || 0) * 2),
  }
}

export function stockElsewhere(partId, excludeSiteId) {
  return getAlternativeSiteStock(partId, excludeSiteId).map((site) => ({ ...site, etaHours: site.etaHours || 24 }))
}

export function createRushReorder(user, { siteId, assetId, partId, qty, source, warningId, reason }) {
  assertCan(user, ACTIONS.STAGE_PART, { siteId })
  const part = getSuggestedPartsForAsset({ type: 'Equipment' }).find((candidate) => candidate.partId === partId) || { partId, partName: partId }
  const request = createPartsRequest({
    siteId,
    siteName: siteNameFor(siteId),
    assetId,
    partId: part.partId,
    partName: part.partName,
    requestedQty: qty,
    requestType: 'Reorder',
    priority: 'Urgent',
    reason: reason || `Rush reorder from ${source || 'operations'}`,
    warningId,
  }, user.name)
  refreshRequests()
  logActivity(user, { type: EVENT_TYPES.REORDER_CREATED, siteId, assetId, entityId: request.id, reason, meta: { source, warningId, qty } })
  return request
}

export function createTransfer(user, { fromSiteId, toSiteId, assetId, partId, qty, reason }) {
  assertCan(user, ACTIONS.STAGE_PART, { siteId: toSiteId })
  const stock = stockAt(fromSiteId, partId)
  if (stock.available < qty) throw new Error(`Insufficient available stock at ${fromSiteId}.`)
  const request = createPartsRequest({
    siteId: toSiteId,
    siteName: siteNameFor(toSiteId),
    assetId,
    partId,
    partName: getInventoryItem(fromSiteId, partId)?.partName || partId,
    requestedQty: qty,
    requestType: 'Site Transfer',
    sourceSiteId: fromSiteId,
    sourceSiteName: siteNameFor(fromSiteId),
    priority: 'Urgent',
    reason: reason || 'Inter-site transfer requested',
  }, user.name)
  refreshRequests()
  logActivity(user, { type: EVENT_TYPES.TRANSFER_REQUESTED, siteId: toSiteId, assetId, entityId: request.id, reason, meta: { fromSiteId, partId, qty } })
  return request
}

export function markReceived(user, requestId) {
  assertCan(user, ACTIONS.DECIDE_REORDER)
  const result = recordPartsReceipt(requestId, user.name)
  if (!result.success) throw new Error(result.reason)
  refreshRequests()
  logActivity(user, { type: EVENT_TYPES.REORDER_RECEIVED, siteId: result.request.siteId, assetId: result.request.assetId, entityId: requestId })
  return result.request
}

export function usePartsRequests(filter) {
  const requests = useStore(requestStore)
  return useMemo(() => {
    if (!filter) return requests
    if (typeof filter === 'function') return requests.filter(filter)
    return requests.filter((request) => Object.entries(filter).every(([key, expected]) => request[key] === expected))
  }, [requests, filter])
}

export { requestStore }
