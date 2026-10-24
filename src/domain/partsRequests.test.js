import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEMO_USERS, ROLES } from './auth.js'
import { activityStore } from './activityLog.js'

globalThis.localStorage = {
  values: new Map(),
  getItem(key) { return this.values.get(key) ?? null },
  setItem(key, value) { this.values.set(key, String(value)) },
  removeItem(key) { this.values.delete(key) },
}

const { createRushReorder, stockAt } = await import('./partsRequests.js')

const planner = DEMO_USERS.find((user) => user.role === ROLES.PLANNER)
const technician = DEMO_USERS.find((user) => user.role === ROLES.TECHNICIAN)

test('a technician cannot create a rush reorder and a planner can', () => {
  assert.throws(() => createRushReorder(technician, { siteId: 'S02', assetId: 'A009', partId: 'BA-440', qty: 1, source: 'early-warning' }), /cannot/i)
  activityStore.reset()
  const request = createRushReorder(planner, { siteId: 'S02', assetId: 'A009', partId: 'BA-440', qty: 1, source: 'early-warning', reason: 'Likely bearing issue' })
  assert.equal(request.status, 'Pending review')
  assert.equal(activityStore.get()[0].type, 'reorder.created')
})

test('stockAt exposes available and minimum stock', () => {
  const stock = stockAt('S02', 'BA-440')
  assert.deepEqual(stock, { onHand: 0, reserved: 0, available: 0, minStock: 2, maxStock: 4 })
})
