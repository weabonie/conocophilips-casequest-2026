import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { qualitySites, readingSource, eventReconciliation } from './evidence.js'
const data = JSON.parse(readFileSync(new URL('../../data/operations.json', import.meta.url)))

test('quality evidence matches every site report, including overlapping late rows', () => {
  for (const site of qualitySites(data)) {
    const q = site.quality
    assert.equal(readingSource(data, site.id).rows.length, q.readings)
    for (const category of ['valid', 'missing', 'suspect', 'late']) {
      assert.equal(readingSource(data, site.id, category).rows.length, q[category], `${site.id} ${category}`)
    }
    assert.equal(q.valid + q.missing + q.suspect, q.readings)
  }
  const arroyo = qualitySites(data)[0]
  assert.equal(arroyo.id, 'S04')
  assert.equal(arroyo.quality.avgLateHours, 30)
  assert.ok(readingSource(data, 'S04', 'late').rows.some(row => row.quality === 'Missing'))
})

test('invoice evidence preserves all unknown amounts and cleaning records', () => {
  const pending = data.events.filter(event => event.partsUsd == null)
  assert.equal(pending.length, 14)
  assert.equal(pending.filter(event => event.type === 'Unplanned').length, 12)
  assert.ok(pending.every(event => event.partsUsd === null))
  assert.equal(data.cleaningLog.length, 12)
})

test('all event stages and production losses reconcile without hiding incomplete checks', () => {
  const checks = eventReconciliation(data)
  assert.equal(checks.length, 385)
  assert.ok(checks.every(row => row.stageMatches === true && row.capacityMatches === true))
  const incomplete = eventReconciliation({ events: [{ id: 'missing', stages: {} }], equipment: [] })
  assert.equal(incomplete[0].stageMatches, null)
  assert.equal(incomplete[0].capacityMatches, null)
})
