import { FILL_TARGET_PCT } from './constants.js'

const round = value => Math.round((value + Number.EPSILON) * 100) / 100
const unplanned = data => (data?.events || []).filter(event => event.type === 'Unplanned')
const siteIdOf = value => value?.siteId || value?.id
const valueOf = (row, key) => typeof key === 'function' ? key(row) : row[key]
const sum = (rows, key) => round(rows.reduce((total, row) => total + (Number(valueOf(row, key)) || 0), 0))
const average = (rows, key) => rows.length ? round(sum(rows, key) / rows.length) : 0

export function siteKpis(data) {
  const events = unplanned(data)
  const totalLoss = sum(events, 'lossUsd')
  return (data?.sites || []).map(site => {
    const siteEvents = events.filter(event => event.siteId === site.id)
    const waited = siteEvents.filter(event => (event.stages?.partsWait || 0) > 0)
    const notWaited = siteEvents.filter(event => (event.stages?.partsWait || 0) <= 0)
    const partsWaitHours = sum(siteEvents, event => event.stages?.partsWait)
    const partsWaitUsd = sum(siteEvents, 'partsWaitUsd')
    return {
      siteId: site.id,
      name: site.name,
      spareFill: site.spareFill,
      fillTarget: FILL_TARGET_PCT,
      outages: siteEvents.length,
      outagesWaited: waited.length,
      partsWaitShare: siteEvents.length ? round(waited.length / siteEvents.length * 100) : 0,
      avgHoursWaited: average(waited, 'stoppedHours'),
      avgHoursNotWaited: average(notWaited, 'stoppedHours'),
      partsWaitHours,
      partsWaitUsd,
      lossUsd: sum(siteEvents, 'lossUsd'),
      lossShare: totalLoss ? round(sum(siteEvents, 'lossUsd') / totalLoss * 100) : 0,
      criticalActions: site.criticalActions || 0,
      openActions: site.openActions || 0,
    }
  }).sort((a, b) => b.lossUsd - a.lossUsd || a.name.localeCompare(b.name))
}

export function programKpis(data) {
  const events = unplanned(data)
  const waited = events.filter(event => (event.stages?.partsWait || 0) > 0)
  const notWaited = events.filter(event => (event.stages?.partsWait || 0) <= 0)
  return {
    partsWaitHours: sum(events, event => event.stages?.partsWait),
    partsWaitShare: events.length ? round(waited.length / events.length * 100) : 0,
    unplannedHours: sum(events, 'stoppedHours'),
    lossUsd: sum(events, 'lossUsd'),
    overdueSev5: (data?.hseActions || []).filter(action => action.status === 'Open' && action.severity === 5 && (action.daysOverdue || 0) > 0).length,
    sitesBelowFillTarget: (data?.sites || []).filter(site => site.spareFill < FILL_TARGET_PCT).length,
    avgHoursWaited: average(waited, 'stoppedHours'),
    avgHoursNotWaited: average(notWaited, 'stoppedHours'),
  }
}

export function assetExposure(data) {
  const events = unplanned(data)
  const assets = data?.equipment || data?.sites?.flatMap(site => site.assets || []) || []
  return assets.map(asset => {
    const assetEvents = events.filter(event => event.assetId === asset.id)
    const partsWaitHours = sum(assetEvents, event => event.stages?.partsWait)
    const partsWaitUsd = sum(assetEvents, 'partsWaitUsd')
    const lossUsd = sum(assetEvents, 'lossUsd')
    const stoppedHours = sum(assetEvents, 'stoppedHours')
    return {
      assetId: asset.id,
      siteId: asset.siteId,
      type: asset.type,
      ageYears: asset.ageYears,
      events: assetEvents.length,
      partsWaitHours,
      partsWaitUsd,
      lossUsd,
      hourlyMarginUsd: stoppedHours ? round(lossUsd / stoppedHours) : 0,
    }
  }).sort((a, b) => b.partsWaitUsd - a.partsWaitUsd || b.lossUsd - a.lossUsd)
}
