import { createPersistentStore, useStore } from './store.js'
import { authStore } from './auth.js'
import { ACTIONS, assertCan, PermissionError } from './permissions.js'
import { EVENT_TYPES, logActivity, subscribeActivity, getActivity } from './activityLog.js'
export const GATE_STATUS = { LOCKED: 'locked', CLEAR: 'clear', READY: 'ready', LIVE: 'live' }
export const hseGateStore = createPersistentStore({ key: 'cq_hse_gate', version: 1, initial: { sites: {}, verifiedActions: {}, processedReceipts: [] } })
let workbook = { hseActions: [] }
export function setHseGateData(data) { workbook = data || { hseActions: [] } }
const originals = (data, siteId) => (data?.hseActions || []).filter(a => a.siteId === siteId && Number(a.severity) === 5 && a.status === 'Open')
export function blockingActions(data, siteId) { const verified = hseGateStore.get().verifiedActions; return originals(data, siteId).filter(a => !verified[a.id]) }
export function getSiteGateStatus(data, siteId) {
  const site = hseGateStore.get().sites[siteId]
  if (blockingActions(data, siteId).length || site?.status === 'locked') return GATE_STATUS.LOCKED
  if (site?.status) return site.status
  return originals(data, siteId).length ? GATE_STATUS.LOCKED : GATE_STATUS.CLEAR
}
export function useSiteGateStatus(siteId) { useStore(hseGateStore); return getSiteGateStatus(workbook, siteId) }
function actorFor(user, action, siteId) {
  const session = authStore.get()
  if (!session || !user || user.id !== session.id || user.role !== session.role || user.name !== session.name || JSON.stringify(user.siteIds) !== JSON.stringify(session.siteIds)) throw new PermissionError(action)
  assertCan(session, action, { siteId })
  return session
}
function findAction(id) { const action = workbook.hseActions?.find(a => a.id === id); if (!action) throw new Error('HSE action not found.'); if (action.status !== 'Open') throw new Error('Imported closed actions are historical records and cannot be changed.'); return action }
export function validateEvidence(evidence) {
  if (!Array.isArray(evidence) || !evidence.length || evidence.length > 3) throw new Error('Attach one to three photos or documents, up to 2 MB each.')
  return evidence.map(file => {
    const accepted = /^(image\/(png|jpeg|webp)|application\/pdf|text\/plain)$/
    if (!file || !accepted.test(file.type) || typeof file.name !== 'string' || !file.name.trim() || file.name.length > 200) throw new Error('Use a PNG, JPEG, WebP, PDF or plain text evidence file.')
    const prefix = `data:${file.type};base64,`
    const encoded = typeof file.dataUrl === 'string' && file.dataUrl.startsWith(prefix) ? file.dataUrl.slice(prefix.length) : ''
    if (!encoded || encoded.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error('Invalid evidence encoding.')
    const size = encoded.length * 3 / 4 - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0)
    if (size <= 0 || size > 2 * 1024 * 1024) throw new Error('Each evidence file must be no larger than 2 MB.')
    return { name: file.name.trim(), type: file.type, dataUrl: file.dataUrl, size }
  })
}
function requireReason(value) { if (typeof value !== 'string' || !value.trim()) throw new Error('A note or reason is required.'); return value.trim() }
export function verifyAction(user, actionId, { note, evidence } = {}) {
  const action = findAction(actionId); const actor = actorFor(user, ACTIONS.VERIFY_HSE_ACTION, action.siteId)
  const verification = { note: requireReason(note), evidence: validateEvidence(evidence), actor: { id: actor.id, name: actor.name }, at: new Date().toISOString() }
  if (hseGateStore.get().verifiedActions[actionId]) throw new Error('This action is already verified.')
  hseGateStore.set(s => ({ ...s, verifiedActions: { ...s.verifiedActions, [actionId]: verification } }))
  logActivity(actor, { type: EVENT_TYPES.HSE_ACTION_VERIFIED, siteId: action.siteId, assetId: action.assetId, entityId: actionId, reason: verification.note, meta: { evidenceNames: verification.evidence.map(f => f.name) } })
  return verification
}
export function unverifyAction(user, actionId, reason) {
  const action = findAction(actionId); const actor = actorFor(user, ACTIONS.VERIFY_HSE_ACTION, action.siteId); reason = requireReason(reason)
  if (!hseGateStore.get().verifiedActions[actionId]) throw new Error('This action has no verification to undo.')
  hseGateStore.set(s => { const verifiedActions = { ...s.verifiedActions }; delete verifiedActions[actionId]; return { ...s, verifiedActions, sites: { ...s.sites, [action.siteId]: { status: 'locked', reason } } } })
  logActivity(actor, { type: EVENT_TYPES.SITE_RELOCKED, siteId: action.siteId, entityId: actionId, reason, meta: { verificationRemoved: true } })
}
export function releaseSite(user, siteId, { confirmName } = {}) {
  const actor = actorFor(user, ACTIONS.RELEASE_SITE, siteId)
  if (!workbook.sites?.some(s => s.id === siteId)) throw new Error('Site not found.')
  if (blockingActions(workbook, siteId).length) throw new Error('Every open severity-5 action needs supervisor verification before pilot release.')
  if (typeof confirmName !== 'string' || confirmName.trim().toLowerCase() !== actor.name.toLowerCase()) throw new Error('Type your name to confirm pilot release.')
  if (['ready', 'live'].includes(getSiteGateStatus(workbook, siteId))) throw new Error('This site pilot is already released.')
  const receiptIds = getActivity({ type: EVENT_TYPES.REORDER_RECEIVED }).map(e => e.id)
  hseGateStore.set(s => ({ ...s, processedReceipts: [...new Set([...(s.processedReceipts || []), ...receiptIds])], sites: { ...s.sites, [siteId]: { status: 'ready', releasedAt: new Date().toISOString(), actor: { id: actor.id, name: actor.name } } } }))
  logActivity(actor, { type: EVENT_TYPES.SITE_RELEASED, siteId, reason: 'Supervisor released site pilot; field work still requires approved isolation procedures.' })
}
export function relockSite(user, siteId, reason) {
  const actor = actorFor(user, ACTIONS.RELEASE_SITE, siteId); reason = requireReason(reason)
  if (!workbook.sites?.some(s => s.id === siteId)) throw new Error('Site not found.')
  hseGateStore.set(s => ({ ...s, sites: { ...s.sites, [siteId]: { status: 'locked', reason } } }))
  logActivity(actor, { type: EVENT_TYPES.SITE_RELOCKED, siteId, reason })
}
const startupReceiptIds = new Set(getActivity({ type: EVENT_TYPES.REORDER_RECEIVED }).map(e => e.id))
let processing = false
export function processReceiptActivity(entries) {
  if (processing) return
  processing = true
  try {
    for (const receipt of [...entries].reverse()) {
      if (receipt.type !== EVENT_TYPES.REORDER_RECEIVED || startupReceiptIds.has(receipt.id) || (hseGateStore.get().processedReceipts || []).includes(receipt.id)) continue
      const status = getSiteGateStatus(workbook, receipt.siteId)
      const knownSite = workbook.sites?.some(s => s.id === receipt.siteId)
      const live = knownSite && ['ready', 'clear'].includes(status)
      hseGateStore.set(s => ({ ...s, processedReceipts: [...(s.processedReceipts || []), receipt.id], sites: live ? { ...s.sites, [receipt.siteId]: { ...s.sites[receipt.siteId], status: 'live', liveReceiptId: receipt.id } } : s.sites }))
      if (live) logActivity({ id: 'system', name: 'System', role: 'system' }, { type: EVENT_TYPES.SITE_LIVE, siteId: receipt.siteId, entityId: receipt.entityId, reason: `First parts receipt after pilot clearance: ${receipt.id}`, meta: { receiptId: receipt.id } })
    }
  } finally { processing = false }
}
subscribeActivity(processReceiptActivity)
