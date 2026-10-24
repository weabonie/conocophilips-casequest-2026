import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activityStore, EVENT_TYPES, logActivity } from './activityLog.js'

test('activity log is newest first and capped at 2,000 entries', () => {
  activityStore.reset()
  const user = { id: 'u1', name: 'Maya Chen', role: 'planner' }
  for (let index = 0; index < 2001; index += 1) logActivity(user, { type: EVENT_TYPES.REORDER_CREATED, entityId: String(index) })
  const entries = activityStore.get()
  assert.equal(entries.length, 2000)
  assert.equal(entries[0].entityId, '2000')
  assert.equal(entries[0].actor.name, 'Maya Chen')
})
