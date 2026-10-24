import { createPersistentStore, useStore } from './store.js'
import { assertCan, ACTIONS } from './permissions.js'
import { logActivity, EVENT_TYPES } from './activityLog.js'
import { stockAt, createRushReorder, notifyPartsChanged } from './partsRequests.js'
export const minMaxStore = createPersistentStore({ key: 'cq_min_max', version: 1, initial: { settings: {}, decisions: {} } })
export function useMinMax() { return useStore(minMaxStore) }
export function levelsFor(assetId, partId, siteId) { const stock = stockAt(siteId, partId); return minMaxStore.get().settings[`${assetId}:${partId}`] || { min: stock.minStock, max: Math.max(stock.minStock * 2, 2) } }
export function saveMinMax(user, { assetId, partId, siteId, min, max }) {
  assertCan(user, ACTIONS.EDIT_MIN_MAX, { siteId })
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min) throw new Error('Use whole numbers with 0 ≤ minimum ≤ maximum.')
  minMaxStore.set(state => ({ ...state, settings: { ...state.settings, [`${assetId}:${partId}`]: { min, max } } }))
  logActivity(user, { type: EVENT_TYPES.MINMAX_CHANGED, siteId, assetId, meta: { partId, min, max } })
  const stock = stockAt(siteId, partId)
  if (stock.available < min) createRushReorder(user, { assetId, siteId, partId, qty: Math.max(1, max - stock.available), source: 'min-breach', dedupeKey: `min:${assetId}:${partId}`, reason: `Sample available stock ${stock.available} is below planner minimum ${min}; replenish toward maximum ${max}.` })
  notifyPartsChanged()
}
export function minMaxSuggestion(assetId, partId, siteId) { const levels = levelsFor(assetId, partId, siteId); const stock = stockAt(siteId, partId); return stock.available === 0 ? { id: `${assetId}:${partId}:stockout-review`, assetId, partId, siteId, min: levels.min + 1, max: Math.max(levels.max, levels.min + 1), reason: 'Sample stock is currently zero. Review a higher minimum; this is a planning suggestion, not measured stockout history.' } : null }
export function decideSuggestion(user, suggestion, accepted) {
  assertCan(user, ACTIONS.EDIT_MIN_MAX, suggestion)
  if (minMaxStore.get().decisions[suggestion.id]) return
  if (accepted) saveMinMax(user, suggestion)
  minMaxStore.set(s => ({ ...s, decisions: { ...s.decisions, [suggestion.id]: accepted ? 'accepted' : 'declined' } }))
  logActivity(user, { type: EVENT_TYPES.MINMAX_SUGGESTION_DECIDED, siteId: suggestion.siteId, assetId: suggestion.assetId, meta: { accepted, partId: suggestion.partId } })
}
