import { FILL_TARGET_PCT } from './constants.js'
const sum = (rows, value) => rows.reduce((n, row) => n + value(row), 0)
const avg = rows => rows.length ? sum(rows, e => e.stoppedHours) / rows.length : null
const unplanned = data => (data.events || []).filter(e => e.type === 'Unplanned')
export function siteKpis(data) {
  const all = unplanned(data)
  const loss = sum(all, e => e.lossUsd)
  return data.sites.map(site => {
    const events = all.filter(e => e.siteId === site.id)
    const waited = events.filter(e => e.stages.partsWait > 0)
    const actions = (data.hseActions || []).filter(a => a.siteId === site.id && a.status === 'Open')
    return { siteId: site.id, name: site.name, spareFill: site.spareFill, fillTarget: FILL_TARGET_PCT,
      outages: events.length, outagesWaited: waited.length,
      partsWaitShare: events.length ? waited.length / events.length * 100 : 0,
      avgHoursWaited: avg(waited), avgHoursNotWaited: avg(events.filter(e => !e.stages.partsWait)),
      partsWaitHours: sum(events, e => e.stages.partsWait), partsWaitUsd: sum(events, e => e.partsWaitUsd),
      lossUsd: sum(events, e => e.lossUsd), lossShare: loss ? sum(events, e => e.lossUsd) / loss * 100 : 0,
      criticalActions: actions.filter(a => a.severity === 5).length, openActions: actions.length }
  })
}
export function programKpis(data) {
  const events = unplanned(data), waited = events.filter(e => e.stages.partsWait > 0)
  return { partsWaitHours: sum(events, e => e.stages.partsWait), partsWaitShare: events.length ? waited.length / events.length * 100 : 0,
    unplannedHours: sum(events, e => e.stoppedHours), lossUsd: sum(events, e => e.lossUsd),
    overdueSev5: (data.hseActions || []).filter(a => a.status === 'Open' && a.severity === 5 && a.daysOverdue > 0).length,
    sitesBelowFillTarget: data.sites.filter(s => s.spareFill != null && s.spareFill < FILL_TARGET_PCT).length,
    avgHoursWaited: avg(waited), avgHoursNotWaited: avg(events.filter(e => !e.stages.partsWait)) }
}
export function assetExposure(data) {
  const all = unplanned(data)
  return data.equipment.map(asset => {
    const events = all.filter(e => e.assetId === asset.id), hours = sum(events, e => e.stoppedHours), lossUsd = sum(events, e => e.lossUsd)
    return { assetId: asset.id, siteId: asset.siteId, type: asset.type, ageYears: asset.ageYears, events: events.length,
      partsWaitHours: sum(events, e => e.stages.partsWait), partsWaitUsd: sum(events, e => e.partsWaitUsd), lossUsd,
      hourlyMarginUsd: hours ? lossUsd / hours : null }
  }).sort((a, b) => b.partsWaitUsd - a.partsWaitUsd)
}
