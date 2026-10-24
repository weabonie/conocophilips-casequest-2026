import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPersistentStore } from './store.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) }
}

test('persistent stores version keys, update, reset, and handle storage events', async () => {
  const storage = memoryStorage()
  const listeners = new Map()
  globalThis.window = { localStorage: storage, addEventListener: (type, callback) => listeners.set(type, callback) }
  const store = createPersistentStore({ key: 'test_store', version: 3, initial: { count: 0 } })
  let notifications = 0
  store.subscribe(() => { notifications += 1 })
  store.set((state) => ({ count: state.count + 1 }))
  assert.equal(store.get().count, 1)
  assert.equal(storage.getItem('cq_test_store_v3'), '{"count":1}')
  listeners.get('storage')({ key: 'cq_test_store_v3', newValue: '{"count":8}' })
  assert.equal(store.get().count, 8)
  store.reset()
  assert.deepEqual(store.get(), { count: 0 })
  assert.equal(notifications, 3)
})
