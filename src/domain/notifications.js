import { createPersistentStore, useStore } from './store.js'
import { ROLES, authStore } from './auth.js'
import { ACTIONS, assertCan, PermissionError } from './permissions.js'

export const notificationStore = createPersistentStore({ key: 'cq_notification_reads', version: 1, initial: {} })
export const activityFiltersStore = createPersistentStore({ key: 'cq_activity_filters', version: 1, initial: {} })
export function useActivityFilters(user) { return useStore(activityFiltersStore)[user?.id] || {} }
export function saveActivityFilters(user, filters) { if (authStore.get()?.id !== user?.id) throw new PermissionError('FILTER_ACTIVITY'); activityFiltersStore.set(state => ({ ...state, [user.id]: filters })) }
const scoped = (user, siteId) => !siteId || user?.siteIds === 'all' || user?.siteIds?.includes(siteId)
const matches = (event, filters) => (!filters.type || event.type === filters.type) && (!filters.siteId || event.siteId === filters.siteId) && (!filters.assetId || event.assetId === filters.assetId) && (!filters.actorId || event.actor?.id === filters.actorId) && (!filters.date || event.at?.slice(0, 10) === filters.date) && (!filters.search || JSON.stringify(event).toLowerCase().includes(filters.search.toLowerCase()))
export function filterActivity(events, user, filters = {}) { return user ? events.filter(event => scoped(user, event.siteId) && matches(event, filters)) : [] }
export function deriveNotifications({ events = [], user, requests = [], warningStock = {}, minBreaches = [], hseActions = [], now = new Date().toISOString(), asOf = now.slice(0, 10), monthlyPreview = false }) {
  if (!user) return []
  const notifications = new Map()
  function add(id, roles, input) {
    if (!roles.includes(user.role) || !scoped(user, input.siteId)) return
    notifications.set(id, { id, ...input, read: Boolean(notificationStore.get()[user.id]?.[id]) })
  }
  const reviewed = new Set(events.filter(e => ['warning.acknowledged', 'warning.falseAlarm', 'warning.staged'].includes(e.type)).map(e => e.entityId))
  const verified = new Map()
  for (const event of [...events].reverse()) {
    if (event.type === 'hse.actionVerified') verified.set(event.entityId, true)
    if (event.type === 'hse.siteRelocked' && event.meta?.verificationRemoved) verified.set(event.entityId, false)
    const common = { at: event.at, siteId: event.siteId, assetId: event.assetId, eventId: event.id }
    if (event.type === 'warning.raised' && !reviewed.has(event.entityId) && warningStock[event.entityId] === false) add(`warning:${event.entityId}`, [ROLES.PLANNER, ROLES.SITE_LEAD], { ...common, title: `${event.assetId}: warning needs a part`, detail: 'Receipt-aware threshold warning; no available sample stock. Review before staging.', route: '#/early-warning' })
    if (event.type === 'dispatch.checked' && (event.meta?.parts === 'shortage' || event.meta?.gateStatus === 'locked')) add(`dispatch:${event.id}`, [ROLES.PLANNER, ROLES.TECHNICIAN], { ...common, title: `${event.assetId}: pre-dispatch blocked`, detail: event.reason, route: '#/dispatch' })
    if (event.type === 'hse.siteReleased') add(`release:${event.id}`, [ROLES.SITE_LEAD, ROLES.OPS_MANAGER], { ...common, title: `${event.siteId}: pilot released`, detail: 'Supervisor release recorded. Field permits and LOTO remain separate.', route: '#/hse', emailPreview: true })
  }
  for (const request of requests) {
    const raised = request.createdAt || request.requestedAt || request.requestedDate
    const age = Date.parse(now) - Date.parse(raised)
    if (request.priority === 'Urgent' && ['Pending', 'Pending Approval', 'Pending review', 'Requested', 'Submitted'].includes(request.status) && Number.isFinite(age) && age > 4 * 3600000) add(`rush:${request.id}:waiting`, [ROLES.PLANNER], { at: raised, siteId: request.siteId, assetId: request.assetId, title: `${request.id}: rush review overdue`, detail: 'Waiting for planner review for more than four hours.', route: '#/reorders' })
  }
  if (minBreaches.length) add(`minimum:${asOf}`, [ROLES.PLANNER], { at: `${asOf}T00:00:00Z`, title: 'Daily sample stock digest', detail: `${minBreaches.length} site / part rows below minimum. Sample inventory only.`, route: '#/reorders' })
  for (const action of hseActions) {
    const days = Math.floor((Date.parse(`${asOf}T00:00Z`) - Date.parse(`${action.dueDate}T00:00Z`)) / 86400000)
    if (action.status === 'Open' && !verified.get(action.id) && Number(action.severity) === 5 && days === 1) add(`overdue:${action.id}:${action.dueDate}`, [ROLES.HSE_SUPERVISOR, ROLES.SITE_LEAD], { at: `${asOf}T00:00:00Z`, siteId: action.siteId, assetId: action.assetId, title: `${action.id}: severity-5 action newly overdue`, detail: `${action.hazard}. Due ${action.dueDate}.`, route: '#/hse', emailPreview: true })
  }
  if (monthlyPreview) add(`monthly:${asOf.slice(0, 7)}`, [ROLES.OPS_MANAGER], { at: `${asOf}T00:00:00Z`, title: `${asOf.slice(0, 7)} KPI email preview`, detail: 'Review sourced historical downtime, lost margin and parts-wait KPIs in Operations overview. No email was sent.', route: '#/overview', emailPreview: true })
  return [...notifications.values()].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
export function markNotificationRead(user, id) {
  const current = authStore.get()
  if (!current || user?.id !== current.id || user?.role !== current.role) throw new PermissionError('READ_NOTIFICATION')
  if (typeof id !== 'string' || !id.trim()) throw new Error('Choose a notification.')
  notificationStore.set(state => ({ ...state, [current.id]: { ...state[current.id], [id]: true } }))
}
export function useNotificationReads() { return useStore(notificationStore) }
export function safeCsvCell(value) {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
export function exportActivityCsv(user, events, filters = {}) {
  const current = authStore.get()
  if (!current || current.id !== user?.id || current.role !== user?.role) throw new PermissionError(ACTIONS.EXPORT_ACTIVITY)
  assertCan(current, ACTIONS.EXPORT_ACTIVITY)
  const rows = filterActivity(events, current, filters)
  const columns = ['id', 'at', 'type', 'siteId', 'assetId', 'actorName', 'actorRole', 'reason', 'metadata']
  return [columns, ...rows.map(e => [e.id, e.at, e.type, e.siteId, e.assetId, e.actor?.name, e.actor?.role, e.reason, e.meta])].map(row => row.map(safeCsvCell).join(',')).join('\r\n')
}
