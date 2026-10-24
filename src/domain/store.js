import { useSyncExternalStore } from 'react'
const stores = new Map()
export function createPersistentStore({ key, version = 1, initial }) {
  if (!key.startsWith('cq_')) throw new Error('Demo store keys must start with cq_')
  if (stores.has(key)) return stores.get(key)
  const fresh = () => structuredClone(typeof initial === 'function' ? initial() : initial)
  const read = () => { try { const raw = globalThis.localStorage?.getItem(key); const saved = raw && JSON.parse(raw); return saved?.version === version ? saved.value : fresh() } catch { return fresh() } }
  let value = read()
  const listeners = new Set()
  const emit = () => listeners.forEach(fn => fn())
  const store = {
    key,
    get: () => value,
    set(updater) { const next = typeof updater === 'function' ? updater(value) : updater; try { globalThis.localStorage?.setItem(key, JSON.stringify({ version, value: next })) } catch { throw new Error('Unable to save this change. Browser storage is unavailable or full.') } value = next; emit(); return value },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    reset() { value = fresh(); try { globalThis.localStorage?.removeItem(key) } catch { /* Storage may be unavailable. */ } emit() },
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', event => { if (event.key === key || event.key === null) { value = read(); emit() } })
  stores.set(key, store)
  return store
}
export function useStore(store, selector = s => s) { return selector(useSyncExternalStore(store.subscribe, store.get, store.get)) }
export function resetRegisteredStores() { stores.forEach(store => store.reset()) }
