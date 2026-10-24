import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getAsOf, setReplayDate } from './clock.js'
test('clock defaults to source snapshot and resets after replay', () => {
  assert.equal(getAsOf(), '2026-10-01')
  setReplayDate('2025-02-01')
  assert.equal(getAsOf(), '2025-02-01')
  assert.throws(() => setReplayDate('2025-02-30'))
  assert.throws(() => setReplayDate('not a date'))
  setReplayDate(null)
  assert.equal(getAsOf(), '2026-10-01')
})
