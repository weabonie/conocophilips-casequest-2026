import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAsOf, setReplayDate, subscribe } from './clock.js'

test('clock defaults to the HSE snapshot and supports replay overrides', () => {
  setReplayDate(null)
  assert.equal(getAsOf({ hseAsOf: '2026-10-01T00:00:00.000Z' }), '2026-10-01')
  setReplayDate('2025-01-05T12:00:00Z')
  assert.equal(getAsOf(), '2025-01-05')
  setReplayDate(null)
})

test('clock subscribers are notified when replay changes', () => {
  let calls = 0
  const unsubscribe = subscribe(() => { calls++ })
  setReplayDate('2025-01-06')
  unsubscribe()
  setReplayDate(null)
  assert.equal(calls, 1)
})

