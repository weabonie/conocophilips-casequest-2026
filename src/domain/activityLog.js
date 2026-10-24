import { useMemo } from 'react'
import { createPersistentStore, useStore } from './store.js'

export const EVENT_TYPES = {
  SIGN_IN: 'auth.signIn',
  REORDER_CREATED: 'reorder.created',
  REORDER_APPROVED: 'reorder.approved',
  REORDER_REJECTED: 'reorder.rejected',
  REORDER_QTY_EDITED: 'reorder.qtyEdited',
  REORDER_RECEIVED: 'reorder.received',
  WARNING_RAISED: 'warning.raised',
  WARNING_ACKNOWLEDGED: 'warning.acknowledged',
  WARNING_FALSE_ALARM: 'warning.falseAlarm',
  WARNING_STAGED: 'warning.staged',
  DISPATCH_CHECKED: 'dispatch.checked',
  TRANSFER_REQUESTED: 'transfer.requested',
  HSE_ACTION_VERIFIED: 'hse.actionVerified',
  SITE_RELEASED: 'hse.siteReleased',
  SITE_RELOCKED: 'hse.siteRelocked',
  SITE_LIVE: 'site.live',
  MINMAX_CHANGED: 'minmax.changed',
  MINMAX_SUGGESTION_DECIDED: 'minmax.suggestionDecided',
  COPILOT_REFUSED: 'copilot.refused',
}

const activityStore = createPersistentStore({ key: 'activity_log', version: 1, initial: [] })

function nextId() {
  return `ACT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function logActivity(user, { type, siteId, assetId, entityId, reason, meta } = {}) {
  if (!type) throw new Error('Activity type is required')
  const entry = {
    id: nextId(),
    at: new Date().toISOString(),
    actor: user ? { id: user.id, name: user.name, role: user.role } : null,
    type,
    siteId,
    assetId,
    entityId,
    reason,
    meta,
  }
  activityStore.set((entries) => [entry, ...entries].slice(0, 2000))
  return entry
}

export function useActivity(filter) {
  const entries = useStore(activityStore)
  return useMemo(() => {
    if (!filter) return entries
    if (typeof filter === 'function') return entries.filter(filter)
    return entries.filter((entry) => Object.entries(filter).every(([key, expected]) => entry[key] === expected))
  }, [entries, filter])
}

export function subscribeActivity(listener) {
  return activityStore.subscribe(listener)
}

export { activityStore }
