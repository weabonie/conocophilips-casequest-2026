import { test } from 'node:test'
import assert from 'node:assert/strict'
import data from '../data/operations.json' with { type: 'json' }
import { detectAlerts, activeWarnings, likelyIssueFor } from './earlyWarning.js'
const asset = { id: 'A001', siteId: 'S01', vibNormal: 2.7, tempNormal: 62 }
const r = { date: '2025-01-01', observedUtc: '2025-01-01T06:00Z', receivedUtc: '2025-01-02T06:00Z', quality: 'Valid', state: 'Running', vib: 2.7 * 1.4, temp: 70 }
test('inclusive thresholds and quality exclusion; notes alone never trigger', () => {
  assert.equal(detectAlerts([r], asset)[0].trigger, 'both')
  assert.equal(detectAlerts([{ ...r, vib: 2.7 }], asset)[0].trigger, 'temperature')
  assert.equal(detectAlerts([{ ...r, temp: 62 }], asset)[0].trigger, 'vibration')
  for (const quality of ['Missing', 'Suspect']) assert.equal(detectAlerts([{ ...r, quality }], asset).length, 0)
  assert.equal(detectAlerts([{ ...r, vib: null, temp: null, note: 'abnormal' }], asset).length, 0)
  assert.equal(detectAlerts([{ ...r, state: 'Stopped' }], asset).length, 0)
})
test('replay respects received timestamps and lookback window', () => {
  const d = { readings: { A001: [r] }, earlyWarning: { alerts: detectAlerts([r], asset) } }
  assert.equal(activeWarnings(d, '2025-01-01').length, 0)
  assert.equal(activeWarnings(d, '2025-01-02').length, 1)
  assert.equal(activeWarnings(d, '2025-01-05').length, 0)
})
test('issue suggestion never uses the subsequent event', () => {
  const history = [{ type: 'Unplanned', startUtc: '2025-01-03', cause: 'Seal leak' }]
  assert.equal(likelyIssueFor({ ...asset, history }, r), 'Bearing')
  history.push({ type: 'Unplanned', startUtc: '2024-12-30', cause: 'Seal leak' })
  assert.equal(likelyIssueFor({ ...asset, history }, r), 'Seal')
})
test('real data records receipt-aware retrospective results honestly', () => {
  const s = data.earlyWarning.summary
  assert.equal(s.alerts, 479)
  assert.equal(s.falseAlarms, 2) // Two warnings arrived after their subsequent event; not a proven fault false alarm.
  assert.deepEqual(s.flaggedByCause['Bearing wear'], { flagged: 115, total: 115 })
  assert.deepEqual(s.flaggedByCause['Seal leak'], { flagged: 57, total: 57 })
  for (const cause of ['Electrical trip', 'Process upset', 'Unknown']) assert.equal(s.flaggedByCause[cause].flagged, 0)
  const leads = data.earlyWarning.alerts.filter(a => a.leadDays != null).map(a => a.leadDays).sort((a, b) => a - b)
  assert.equal(leads[Math.floor(leads.length / 2)], 1.25)
  const firstWarning = new Map()
  for (const a of data.earlyWarning.alerts) if (a.precededEventId) firstWarning.set(a.precededEventId, Math.max(firstWarning.get(a.precededEventId) || 0, a.leadDays))
  assert.equal([...firstWarning.values()].sort((a, b) => a - b)[86], 2.25)
})
