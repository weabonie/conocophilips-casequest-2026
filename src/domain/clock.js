import { useSyncExternalStore } from 'react'
import data from '../data/operations.json' with { type: 'json' }
let replayDate = null
const listeners = new Set()
export function getAsOf() { return replayDate || data.hseAsOf || '2026-10-01' }
export function setReplayDate(date) {
  if (date != null && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00Z`).toISOString().slice(0, 10) !== date)) throw new Error('Invalid replay date')
  replayDate = date
  listeners.forEach(listener => listener())
}
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener) }
export function useAsOf() { return useSyncExternalStore(subscribe, getAsOf, getAsOf) }
