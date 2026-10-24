import { useSyncExternalStore } from 'react'

const DEFAULT_AS_OF = '2026-10-01'
let replayDate = null
const listeners = new Set()

const notify = () => listeners.forEach(listener => listener())
const subscribe = listener => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const normalize = value => value == null ? null : String(value).slice(0, 10)

export function getAsOf(data) {
  return replayDate || normalize(data?.hseAsOf) || DEFAULT_AS_OF
}

export function setReplayDate(date) {
  replayDate = normalize(date)
  notify()
}

export function useAsOf(data) {
  return useSyncExternalStore(subscribe, () => getAsOf(data), () => getAsOf(data))
}

export { subscribe }

