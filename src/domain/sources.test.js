import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseCaseQuestWorkbook } from '../utils/excelParser.js'
import { resolveSource } from './sources.js'

const data = parseCaseQuestWorkbook(readFileSync(new URL('../../CaseQuest2026Dataset.xlsx', import.meta.url)))

test('resolves filtered source rows for events and readings', () => {
  const events = resolveSource(data, { table: 'events', filter: { assetId: 'A010', type: 'Unplanned' }, label: 'A010 events' })
  assert.equal(events.label, 'A010 events')
  assert.equal(events.rows.length, 23)
  assert.ok(events.columns.some(column => column.key === 'lossUsd'))

  const readings = resolveSource(data, { table: 'readings', filter: { siteId: 'S04', quality: 'Missing' } })
  assert.equal(readings.rows.length, 135)
  assert.equal(readings.columns[0].key, 'assetId')
})

test('supports id filters and rejects unknown tables', () => {
  const source = resolveSource(data, { table: 'hseActions', filter: { ids: ['H014', 'H015'] } })
  assert.deepEqual(source.rows.map(row => row.id), ['H014', 'H015'])
  assert.throws(() => resolveSource(data, { table: 'unknown' }), /Unknown source table/)
})

