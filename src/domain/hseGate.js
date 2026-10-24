import { useStore } from './store.js'
import { createPersistentStore } from './store.js'

export const GATE_STATUS = { LOCKED: 'locked', CLEAR: 'clear', READY: 'ready', LIVE: 'live' }
const gateStore = createPersistentStore({ key: 'site_gate_status', version: 1, initial: {} })

export function blockingActions(data, siteId) {
  return (data?.hseActions || []).filter((action) => action.siteId === siteId && action.severity === 5 && action.status !== 'Closed')
}

export function getSiteGateStatus(data, siteId) {
  if (blockingActions(data, siteId).length > 0) return GATE_STATUS.LOCKED
  return gateStore.get()[siteId] || GATE_STATUS.CLEAR
}

export function useSiteGateStatus(siteId) {
  const statuses = useStore(gateStore)
  return statuses[siteId] || GATE_STATUS.CLEAR
}

export { gateStore }
