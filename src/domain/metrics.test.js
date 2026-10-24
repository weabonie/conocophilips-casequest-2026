import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseCaseQuestWorkbook } from '../utils/excelParser.js'
import { assetExposure, programKpis, siteKpis } from './metrics.js'

const data = parseCaseQuestWorkbook(readFileSync(new URL('../../CaseQuest2026Dataset.xlsx', import.meta.url)))

test('program KPIs match the findings', () => {
  assert.deepEqual(programKpis(data), {
    partsWaitHours: 1613.32,
    partsWaitShare: 30.35,
    unplannedHours: 6598.55,
    lossUsd: 5608389.61,
    overdueSev5: 6,
    sitesBelowFillTarget: 5,
    avgHoursWaited: 34.06,
    avgHoursNotWaited: 15.43,
  })
})

test('site KPIs expose waiting shares and site exposure', () => {
  const kpis = siteKpis(data)
  assert.deepEqual(kpis.map(site => [site.name, site.spareFill, site.outagesWaited, site.partsWaitShare]), [
    ['Arroyo', 42, 38, 55.88],
    ['Mesa', 65, 21, 37.5],
    ['Prairie', 70, 16, 29.09],
    ['Cedar', 86, 6, 12.5],
    ['Canyon', 78, 10, 21.74],
    ['Juniper', 92, 4, 10],
  ])
  assert.equal(kpis[0].partsWaitHours, 644.81)
  assert.equal(kpis[0].lossUsd, 2017459.23)
})

test('asset exposure calculates hourly margin and keeps loss ranking available', () => {
  const exposure = assetExposure(data)
  const byLoss = [...exposure].sort((a, b) => b.lossUsd - a.lossUsd)
  assert.deepEqual(byLoss.slice(0, 3).map(asset => [asset.assetId, Math.round(asset.lossUsd)]), [
    ['A010', 726731], ['A012', 684220], ['A011', 606509],
  ])
  assert.equal(exposure.find(asset => asset.assetId === 'A010').hourlyMarginUsd, 1212.63)
})

