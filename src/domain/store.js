import { useSyncExternalStore } from 'react'

const registry = new Set()

function storageKey(key, version) {
  const normalized = String(key).startsWith('cq_') ? String(key) : `cq_${key}`
  return `${normalized}_v${version}`
}

function getStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
  } catch {
    return null
  }
}

export function createPersistentStore({ key, version = 1, initial, register = true }) {
  const persistedKey = storageKey(key, version)
  let value = typeof initial === 'function' ? initial() : initial
  const listeners = new Set()

  try {
    const raw = getStorage()?.getItem(persistedKey)
    if (raw !== null) value = JSON.parse(raw)
  } catch {
    value = typeof initial === 'function' ? initial() : initial
  }

  const notify = () => listeners.forEach((listener) => listener())

  const store = {
    key: persistedKey,
    get: () => value,
    set: (updater) => {
      const next = typeof updater === 'function' ? updater(value) : updater
      value = next
      try {
        getStorage()?.setItem(persistedKey, JSON.stringify(next))
      } catch {
        // Persistence is best effort in private browsing and storage-constrained demos.
      }
      notify()
      return value
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    reset: () => {
      value = typeof initial === 'function' ? initial() : initial
      try {
        getStorage()?.removeItem(persistedKey)
      } catch {
        // Ignore unavailable storage.
      }
      notify()
    },
  }

  if (register) registry.add(store)

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== persistedKey) return
      try {
        value = event.newValue === null
          ? (typeof initial === 'function' ? initial() : initial)
          : JSON.parse(event.newValue)
        notify()
      } catch {
        // Ignore malformed values written by an external tab.
      }
    })
  }

  return store
}

export function useStore(store, selector = (state) => state) {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(store.get()))
}

export function resetRegisteredStores() {
  registry.forEach((store) => store.reset())
}

export function getRegisteredStores() {
  return [...registry]
}
