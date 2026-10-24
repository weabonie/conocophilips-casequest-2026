import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseCaseQuestWorkbook } from '../utils/excelParser.js'
import { activeWarnings, detectAlerts, likelyIssueFor } from './earlyWarning.js'

const data = parseCaseQuestWorkbook(readFileSync(new URL('../../CaseQuest2026Dataset.xlsx', import.meta.url)))

test('D2 finds all mechanical failures with no false alarms', () => {
  const { summary, alerts } = data.earlyWarning
  assert.equal(summary.alerts, 479)
  assert.equal(summary.falseAlarms, 0)
  assert.deepEqual(summary.flaggedByCause, {
    'Bearing wear': { flagged: 115, total: 115 },
    'Seal leak': { flagged: 57, total: 57 },
    'Electrical trip': { flagged: 0, total: 53 },
    'Process upset': { flagged: 0, total: 52 },
    Unknown: { flagged: 0, total: 36 },
  })
  assert.equal(summary.medianLeadDays, 2)
  assert.ok(alerts.every(alert => alert.leadDays >= 0 && alert.leadDays <= 3))
})

test('likely issue excludes the event that the alert preceded and resolves ties to Bearing', () => {
  const asset = {
    id: 'A010',
    eventHistory: [
      { id: 'E1', cause: 'Bearing wear', startUtc: '2025-01-05T00:00:00Z' },
      { id: 'E2', cause: 'Seal leak', startUtc: '2025-01-06T00:00:00Z' },
    ],
  }
  assert.equal(likelyIssueFor(asset, { precededEventId: 'E1' }), 'Seal')
  assert.equal(likelyIssueFor(asset, { precededEventId: 'E2' }), 'Bearing')
  assert.equal(likelyIssueFor(asset, { precededEventId: null }), 'Bearing')
})

test('detectAlerts ignores invalid readings and records trigger details', () => {
  const asset = { id: 'A1', siteId: 'S1', vibNormal: 2, tempNormal: 60, eventHistory: [] }
  const alerts = detectAlerts([
    { date: '2025-01-01', quality: 'Missing', vib: 99, temp: 99 },
    { date: '2025-01-02', quality: 'Valid', vib: 2.8, temp: 69 },
  ], asset)
  assert.equal(alerts.length, 1)
  assert.deepEqual(alerts[0], {
    id: 'W-A1-20250102', assetId: 'A1', siteId: 'S1', date: '2025-01-02', trigger: 'both',
    vib: 2.8, temp: 69, vibRatio: 1.4, tempDeltaC: 9, likelyIssue: null,
    precededEventId: null, leadDays: null,
  })
})

test('activeWarnings respects the replay date and lookback window', () => {
  const active = activeWarnings(data, '2025-12-04')
  assert.ok(active.length > 0)
  assert.ok(active.every(alert => alert.date >= '2025-12-01' && alert.date <= '2025-12-04'))
})
