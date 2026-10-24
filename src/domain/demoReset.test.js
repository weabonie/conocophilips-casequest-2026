import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resetDemoState } from './demoReset.js'
import { activityStore, logActivity } from './activityLog.js'

test('demo reset clears registered demo state but keeps sync settings', () => {
  globalThis.localStorage = { removed: [], removeItem(key) { this.removed.push(key) }, getItem() { return null }, setItem() {} }
  logActivity({ id: 'u', name: 'Maya Chen', role: 'planner' }, { type: 'auth.signIn' })
  globalThis.localStorage.setItem('cq_excel_url', 'kept')
  resetDemoState()
  assert.equal(activityStore.get().length, 0)
  assert.deepEqual(globalThis.localStorage.removed, ['cq_prototype_inventory_v2', 'cq_prototype_parts_requests_v1'])
})
