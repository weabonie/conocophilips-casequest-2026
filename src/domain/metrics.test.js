import { test } from 'node:test'
import assert from 'node:assert/strict'
import data from '../data/operations.json' with { type: 'json' }
import { programKpis, siteKpis, assetExposure } from './metrics.js'
const close = (actual, expected, tolerance = 0.01) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`)
test('headline metrics reconcile to event-derived workbook controls', () => {
  const k = programKpis(data)
  assert.equal(data.events.filter(e => e.type === 'Unplanned').length, 313)
  close(k.unplannedHours, 6598.55)
  close(k.lossUsd, 5608389.61)
  close(k.partsWaitHours, 1613.32)
  close(k.avgHoursWaited, 34.1, 0.05)
  close(k.avgHoursNotWaited, 15.4, 0.05)
  assert.equal(k.overdueSev5, 6)
  assert.equal(k.sitesBelowFillTarget, 5)
  assert.equal(siteKpis(data).reduce((n, s) => n + s.outagesWaited, 0), 95)
})
test('site rates and asset exposures preserve metric distinctions', () => {
  const sites = siteKpis(data)
  for (const [id, fill, wait] of [['S04', 42, 56], ['S02', 65, 38], ['S06', 70, 29], ['S03', 92, 10]]) {
    const site = sites.find(s => s.siteId === id)
    assert.equal(site.spareFill, fill)
    close(site.partsWaitShare, wait, 0.51)
  }
  const exposure = assetExposure(data)
  assert.deepEqual(exposure.slice(0, 3).map(a => a.assetId), ['A011', 'A012', 'A010'])
  assert.deepEqual([...exposure].sort((a, b) => b.lossUsd - a.lossUsd).slice(0, 3).map(a => a.assetId), ['A010', 'A012', 'A011'])
  close(exposure.find(a => a.assetId === 'A010').hourlyMarginUsd, 1212.63)
})
