import snapshot from '../data/operations.json' with { type: 'json' }
import { likelyIssueFor } from './earlyWarning.js'
import { authStore } from './auth.js'
import { createPersistentStore, useStore } from './store.js'
import { ACTIONS, assertCan, PermissionError } from './permissions.js'
import { logActivity, EVENT_TYPES } from './activityLog.js'
import { likelyPartFor, createRushReorder, createTransfer, stockAt } from './partsRequests.js'

export const warningsStore = createPersistentStore({ key: 'cq_warning_decisions', version: 1, initial: { byAlert: {}, raised: {} } })
let workbook = snapshot
export function setWarningsData(data) { workbook = data || snapshot }
export function useWarningDecisions() { return useStore(warningsStore).byAlert }
function canonical(id) {
  const alert = workbook.earlyWarning?.alerts?.find(a => a.id === id)
  if (!alert) throw new Error('Warning not found in the current workbook.')
  return alert
}
function actorFor(user, action, siteId) {
  const session = authStore.get()
  if (!session || !user || user.id !== session.id || user.role !== session.role || user.name !== session.name || JSON.stringify(user.siteIds) !== JSON.stringify(session.siteIds)) throw new PermissionError(action)
  assertCan(session, action, { siteId })
  return session
}
function save(actor, alert, status, type, extra = {}) {
  const state = { status, by: { id: actor.id, name: actor.name }, at: new Date().toISOString(), ...extra }
  warningsStore.set(s => ({ ...s, byAlert: { ...s.byAlert, [alert.id]: state } }))
  logActivity(actor, { type, siteId: alert.siteId, assetId: alert.assetId, entityId: alert.id, reason: extra.reason, meta: { requestId: extra.requestId } })
  return state
}
export function acknowledge(user, alertId) {
  const alert = canonical(alertId); const actor = actorFor(user, ACTIONS.ACK_WARNING, alert.siteId)
  const old = warningsStore.get().byAlert[alertId]
  if (old?.status === 'acknowledged') return old
  if (old && old.status !== 'new') throw new Error('This warning has already been reviewed or staged.')
  return save(actor, alert, 'acknowledged', EVENT_TYPES.WARNING_ACKNOWLEDGED)
}
export function flagFalseAlarm(user, alertId, reason) {
  const alert = canonical(alertId); const actor = actorFor(user, ACTIONS.FLAG_FALSE_ALARM, alert.siteId)
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('A false-alarm review requires a reason.')
  const old = warningsStore.get().byAlert[alertId]
  if (old?.status === 'falseAlarm') return old
  if (old?.status === 'staged') throw new Error('This warning has a parts request. Review the request before changing its disposition.')
  return save(actor, alert, 'falseAlarm', EVENT_TYPES.WARNING_FALSE_ALARM, { reason: reason.trim() })
}
export function stagePart(user, suppliedAlert, { fromSiteId } = {}) {
  const alert = canonical(suppliedAlert?.id); const actor = actorFor(user, ACTIONS.STAGE_PART, alert.siteId)
  const old = warningsStore.get().byAlert[alert.id]
  if (old?.status === 'staged') return old
  if (old?.status === 'falseAlarm') throw new Error('This warning was reviewed as a false alarm.')
  const asset = workbook.equipment?.find(a => a.id === alert.assetId)
  const issue = likelyIssueFor({ ...asset, history: (workbook.events || []).filter(e => e.assetId === alert.assetId) }, alert)
  const part = likelyPartFor(asset, issue)
  if (!part) throw new Error('No sample part mapping is available for this equipment.')
  if (stockAt(alert.siteId, part.partId).available > 0) throw new Error('The part is already available locally. Review it in pre-dispatch.')
  const reason = `Stage ${part.partName} for ${alert.assetId}; historical ${issue.toLowerCase()} warning ${alert.id}. Planning suggestion requires inspection.`
  const common = { assetId: alert.assetId, partId: part.partId, qty: 1, source: 'early-warning', warningId: alert.id, dedupeKey: `warning:${alert.id}`, reason }
  const request = fromSiteId
    ? createTransfer(actor, { ...common, fromSiteId, toSiteId: alert.siteId })
    : createRushReorder(actor, { ...common, siteId: alert.siteId })
  return save(actor, alert, 'staged', EVENT_TYPES.WARNING_STAGED, { requestId: request.id, reason, requestType: fromSiteId ? 'transfer' : 'reorder' })
}
// Called only for receipt-aware alerts currently visible in replay. Idempotent across mounts and scrubbing.
export function recordRaisedWarnings(alerts) {
  for (const candidate of alerts) {
    const alert = canonical(candidate.id)
    if (warningsStore.get().raised[alert.id]) continue
    warningsStore.set(s => ({ ...s, raised: { ...s.raised, [alert.id]: true } }))
    logActivity(null, { type: EVENT_TYPES.WARNING_RAISED, siteId: alert.siteId, assetId: alert.assetId, entityId: alert.id, reason: 'Historical receipt-aware threshold warning', meta: { observedDate: alert.date } })
  }
}
