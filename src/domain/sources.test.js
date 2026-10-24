import { test } from 'node:test'
import assert from 'node:assert/strict'
import data from '../data/operations.json' with { type: 'json' }
import { resolveSource } from './sources.js'
test('source filters return original evidence by site, asset, ID and quality', () => {
  const e = resolveSource(data, { table: 'events', filter: { assetId: 'A010', type: 'Unplanned' }, label: 'A010 events' })
  assert.equal(e.rows.length, 23)
  assert.equal(e.label, 'A010 events')
  assert.ok(e.columns.some(c => c.key === 'partsWaitUsd'))
  assert.equal(resolveSource(data, { table: 'sites', filter: { siteId: 'S04' } }).rows[0].name, 'Arroyo')
  assert.equal(resolveSource(data, { table: 'readings', filter: { siteId: 'S04', quality: 'Missing' } }).rows.length, 135)
  assert.equal(resolveSource(data, { table: 'events', filter: { ids: ['E0001'] } }).rows.length, 1)
  assert.throws(() => resolveSource(data, { table: 'unknown' }), /Unknown source/)
})
