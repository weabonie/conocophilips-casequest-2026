import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as XLSX from 'xlsx'
import { normalizeAssetId, parseCaseQuestWorkbook } from './excelParser.js'

// In-memory workbooks exercise the actual import boundary, not a mock parser.
function fixture() {
  return {
    Assets: [{ asset_id: 'A001', site_id: 'S01', site_name: 'Cedar', asset_type: 'Transfer pump',
      criticality: 'High', modeled_capacity_bbl_hr: '22 bbl/hr', vibration_normal_mm_s: 2.7,
      temperature_normal_c: 62, technicians: 4, network_uptime_pct: 99.2, spare_fill_pct: 86 }],
    Production: [{ asset_id: 'A001', month: '2025-01-01', price_usd_bbl: 73, variable_cost_usd_bbl: 23 }],
    Events: [{ event_id: 'E0001', work_order_id: 'W0001', asset_id: 'A001', event_type: 'Unplanned', cause: 'Bearing wear',
      start_utc: '2025-01-10 00:00:00', detect_hours: 1, dispatch_hours: 2, parts_wait_hours: 3,
      repair_hours: 4, restart_hours: 1, protected_repair_hours: 0.5, recoverable_fraction: 0.2,
      labor_hours: 8, labor_rate_usd_hr: 85, contractor_usd: 0 }],
    HSE: [],
    Readings: [
      { reading_id: 'R00001', asset_id: 'A001', observed_utc: '2025-01-30T06:00:00Z', received_utc: '2025-01-30T06:01:00Z',
        quality: 'Valid', operating_state: 'Running', vibration_mm_s: 5, temperature_c: '143.6 F', inspection_note: 'Operator noticed abnormal noise' },
      { reading_id: 'R00002', asset_id: 'A001', observed_utc: '2025-01-31T06:00:00Z', received_utc: '2025-01-31T06:01:00Z',
        quality: 'Valid', operating_state: 'Running', vibration_mm_s: 2.5, temperature_c: 62 },
    ],
  }
}
function parse(tables, options = {}) {
  const wb = XLSX.utils.book_new()
  for (const [name, records] of Object.entries(tables)) {
    XLSX.utils.book_append_sheet(wb, records.length ? XLSX.utils.json_to_sheet(records) : XLSX.utils.aoa_to_sheet([['hse_id']]), name)
  }
  return parseCaseQuestWorkbook(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), { includeCleanedTables: true, ...options })
}

test('source workbook reconciles to independent controls after cleaning', () => {
  const source = readFileSync(new URL('../../CaseQuest2026Dataset.xlsx', import.meta.url))
  const result = parseCaseQuestWorkbook(source, { includeCleanedTables: true })
  assert.deepEqual(Object.fromEntries(Object.entries(result.dataQuality.tables).map(([name, v]) => [name, v.cleanRows])), {
    Assets: 18, Production: 216, Events: 385, HSE: 36, Readings: 6570, Solutions: 6, Cleaning_Log: 12,
  })
  const sum = key => Math.round(result.sites.reduce((n, site) => n + site[key], 0) * 100) / 100
  assert.equal(sum('events'), 313)
  assert.equal(sum('hours'), 6598.55)
  assert.equal(sum('loss'), 5608389.61)
  assert.equal(sum('criticalActions'), 6)
  assert.equal(sum('openActions'), 11)
  // The FINAL workbook ships pre-cleaned (see its Cleaning_Log sheet), so the parser has no unit, ID or derived-value fixes left to apply.
  for (const key of ['fahrenheitConverted', 'derivedValuesRecovered', 'unitsNormalized', 'idsNormalized']) {
    assert.equal(result.dataQuality.counts[key] ?? 0, 0, key)
  }
  assert.deepEqual(result.dataQuality.remainingUnknowns, { partsInvoices: 14, missingReadings: 339, suspectReadings: 58 })
  assert.ok(result.cleanedTables.Events.filter(e => e.parts_usd == null).every(e => e.parts_usd === null))
})

test('emits the complete F1 data contract from the final workbook', () => {
  const result = parseCaseQuestWorkbook(readFileSync(new URL('../../CaseQuest2026Dataset.xlsx', import.meta.url)))
  assert.equal(result.events.length, 385)
  assert.equal(result.events.filter(event => event.type === 'Unplanned').length, 313)
  assert.equal(result.events.filter(event => event.partsUsd == null).length, 14)
  assert.equal(Object.values(result.readings).reduce((sum, rows) => sum + rows.length, 0), 6570)
  assert.equal(result.hseActions.length, 36)
  assert.equal(result.hseActions.filter(action => action.status === 'Open').length, 11)
  assert.equal(result.hseActions.filter(action => action.status === 'Open' && action.severity === 5).length, 6)
  assert.equal(result.solutions.find(solution => solution.id === 'O4').fractions.partsWait.base, 0.6)
  assert.equal(result.cleaningLog.length, 12)
  assert.equal(result.earlyWarning.alerts.length, 479)
  assert.equal(result.earlyWarning.summary.falseAlarms, 0)
  assert.deepEqual(result.dataQuality.bySite.S04, {
    readings: 1095, valid: 954, missing: 135, suspect: 6, late: 102,
    missingPct: 12.3, suspectPct: 0.5, latePct: 9.3, avgLateHours: 30,
  })
  assert.equal(result.equipment.filter(asset => asset.status === 'warning').length, 0)
})

test('normalizes IDs, units and reconstructible values, including planned production losses', () => {
  assert.equal(normalizeAssetId(' a09 '), 'A009')
  assert.equal(normalizeAssetId(11), 'A011')
  const f = fixture()
  f.Events[0].asset_id = ' 1 '
  f.Events.push({ ...f.Events[0], event_id: 'E0002', work_order_id: 'W0002', event_type: 'Planned',
    cause: 'Scheduled service', start_utc: '2025-01-20', detect_hours: 0, dispatch_hours: 0,
    parts_wait_hours: 0, repair_hours: 2, restart_hours: 0, protected_repair_hours: 0, recoverable_fraction: 0.25 })
  const d = parse(f)
  assert.equal(d.sites[0].hours, 11)
  assert.equal(d.sites[0].loss, 9680)
  assert.equal(d.cleanedTables.Production[0].gross_deferred_bbl, 286)
  assert.equal(d.cleanedTables.Production[0].produced_oil_bbl, 16141.4)
  assert.equal(d.cleanedTables.Readings[0].temperature_c, 62)
  assert.equal(d.cleanedTables.Events[0].parts_usd, null)
})

test('removes equivalent exports and rejects conflicting duplicates', () => {
  const f = fixture()
  f.Readings.push({ ...f.Readings[0], asset_id: ' a001 ', quality: ' valid ' })
  assert.equal(parse(f).equipment[0].abnormalCount, 1)
  f.Readings.at(-1).vibration_mm_s = 8
  assert.throws(() => parse(f), /conflicting duplicate/)
})

test('latest reading and historical counts are invariant to spreadsheet order', () => {
  const f = fixture()
  const before = parse(f).equipment[0]
  f.Readings.reverse()
  assert.deepEqual(parse(f).equipment[0], before)
  assert.equal(before.currentVib, 2.5)
  assert.equal(before.status, 'optimal')
  assert.equal(before.abnormalCount, 1)
  assert.equal(before.latestNote, '')
})

test('as-of evaluation cannot see future arrivals and stale data is not optimal', () => {
  const f = fixture()
  f.Readings[1].received_utc = '2025-02-02T12:00:00Z'
  const d = parse(f, { asOf: '2025-01-31T12:00:00Z' })
  assert.equal(d.equipment[0].currentVib, 5)
  assert.equal(d.equipment[0].observedUtc, '2025-01-30T06:00:00.000Z')
  assert.equal(parse(f, { asOf: '2025-02-05T12:00:00Z' }).equipment[0].status, 'unavailable')
})

test('missing or suspect latest readings never become fabricated normal measurements', () => {
  for (const quality of ['Missing', 'Suspect']) {
    const f = fixture()
    Object.assign(f.Readings[1], { quality, vibration_mm_s: null, temperature_c: null })
    const equipment = parse(f).equipment[0]
    assert.equal(equipment.currentVib, null)
    assert.equal(equipment.currentTemp, null)
    assert.equal(equipment.status, 'unavailable')
  }
})

test('valid stopped zeros remain zeros; suspect values do not count as abnormalities', () => {
  const f = fixture()
  f.Readings[0].quality = 'Suspect'
  Object.assign(f.Readings[1], { vibration_mm_s: 0, temperature_c: 0, operating_state: 'Stopped' })
  const equipment = parse(f).equipment[0]
  assert.equal(equipment.status, 'stopped')
  assert.equal(equipment.currentVib, 0)
  assert.equal(equipment.currentTemp, 0)
  assert.equal(equipment.abnormalCount, 0)
})

test('missing baseline stays unknown and does not trigger a fabricated baseline', () => {
  const f = fixture()
  delete f.Assets[0].vibration_normal_mm_s
  const equipment = parse(f).equipment[0]
  assert.equal(equipment.vibNormal, null)
  assert.equal(equipment.status, 'unavailable')
})

test('rejects unknown assets, missing stages, missing prices and impossible fractions', () => {
  for (const mutate of [
    f => { f.Events[0].asset_id = 'A999' },
    f => { delete f.Events[0].dispatch_hours },
    f => { delete f.Production[0].price_usd_bbl },
    f => { f.Events[0].recoverable_fraction = 1.1 },
    f => { f.Events[0].protected_repair_hours = 5 },
  ]) {
    const f = fixture()
    mutate(f)
    assert.throws(() => parse(f))
  }
})

test('records corrections to derived totals instead of silently accepting inconsistent exports', () => {
  const f = fixture()
  Object.assign(f.Production[0], { potential_oil_bbl: 123, produced_oil_bbl: 123 })
  f.Events[0].stopped_hours = 123
  const d = parse(f)
  assert.equal(d.cleanedTables.Production[0].potential_oil_bbl, 16368)
  assert.equal(d.sites[0].hours, 11)
  assert.ok(d.dataQuality.issues.some(issue => issue.originalValue === 123 && issue.cleanedValue === 11))
})

test('checks HSE links and status before reporting pilot readiness', () => {
  const f = fixture()
  f.HSE = [{ hse_id: 'H001', event_id: 'E0001', asset_id: 'A001', site_id: 'S01',
    action_status: 'Open', potential_severity: 5, likelihood_band: 2,
    observed_utc: '2025-01-10', due_date: '2025-02-10', status_as_of: '2026-10-01' }]
  assert.equal(parse(f).sites[0].criticalActions, 1)
  f.HSE[0].action_status = 'Closed'
  assert.throws(() => parse(f), /status and closure date disagree/)
})

test('rejects ambiguous sensor snapshots, receipt before observation and invalid UTC dates', () => {
  for (const mutate of [
    f => { f.Readings.push({ ...f.Readings[0], reading_id: 'R00003' }) },
    f => { f.Readings[0].received_utc = '2025-01-01' },
    f => { f.Events[0].start_utc = '2025-02-30' },
  ]) {
    const f = fixture()
    mutate(f)
    assert.throws(() => parse(f))
  }
})
