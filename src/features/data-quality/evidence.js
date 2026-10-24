import { resolveSource } from '../../domain/sources.js'

export function qualitySites(data) {
  return (data.sites || []).map(site => ({ ...site, quality: data.dataQuality?.bySite?.[site.id] }))
    .filter(site => site.quality)
    .sort((a, b) => (b.quality.missingPct + b.quality.suspectPct + b.quality.latePct) - (a.quality.missingPct + a.quality.suspectPct + a.quality.latePct))
}
export function readingSource(data, siteId, category) {
  const source = resolveSource(data, { table: 'readings', filter: { siteId }, label: `${siteId || 'All sites'} · ${category || 'all'} readings` })
  const rows = source.rows.filter(row => !category || (category === 'late' ? row.lagHours > 6 : row.quality?.toLowerCase() === category))
  return { ...source, rows, columns: source.columns.filter(c => ['assetId', 'date', 'quality', 'observedUtc', 'receivedUtc', 'lagHours', 'vib', 'temp'].includes(c.key)) }
}
export function reportSource(label, rows) {
  return { label, rows, columns: [...new Set(rows.flatMap(row => Object.keys(row)))].map(key => ({ key, label: key.replace(/([A-Z])/g, ' $1') })) }
}
export function eventReconciliation(data) {
  const events = data.events || []
  return events.map(event => {
    const capacity = data.equipment?.find(asset => asset.id === event.assetId)?.capacityBblHr
    const stages = Object.values(event.stages || {})
    const completeStages = stages.length === 5 && stages.every(Number.isFinite) && Number.isFinite(event.stoppedHours)
    return {
      id: event.id, assetId: event.assetId, stoppedHours: event.stoppedHours,
      stageHours: completeStages ? stages.reduce((sum, value) => sum + value, 0) : null,
      stageMatches: completeStages ? Math.abs(stages.reduce((sum, value) => sum + value, 0) - event.stoppedHours) <= 0.011 : null,
      capacityBblHr: capacity ?? null,
      capacityMatches: Number.isFinite(capacity) && Number.isFinite(event.lostOilBbl) ? Math.abs(event.lostOilBbl - capacity * event.stoppedHours) <= 0.011 : null,
    }
  })
}
