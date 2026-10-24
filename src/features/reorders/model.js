import { assetExposure } from '../../domain/metrics.js'
import { likelyPartFor, stockAt } from '../../domain/partsRequests.js'
import { levelsFor } from '../../domain/minMax.js'
export function reorderRecommendations(data) {
  return assetExposure(data).map(exposure => {
    const asset = data.equipment.find(a => a.id === exposure.assetId)
    const part = likelyPartFor(asset, 'Bearing wear')
    const stock = stockAt(exposure.siteId, part.partId)
    const levels = levelsFor(exposure.assetId, part.partId, exposure.siteId)
    const site = data.sites.find(s => s.id === exposure.siteId)
    return { ...exposure, part, stock, levels, siteName: site?.name, qty: Math.max(0, levels.max - stock.available), reason: `${exposure.assetId} accumulated ${exposure.partsWaitHours.toFixed(1)} parts-wait hours across ${exposure.events} unplanned events in 2025. Sample available stock is ${stock.available}; planner minimum is ${levels.min}.` }
  })
}
export function rankRequests(requests, data) {
  const exposure = Object.fromEntries(assetExposure(data).map(a => [a.assetId, a.partsWaitUsd]))
  return [...requests].sort((a,b) => Number(b.priority === 'Urgent' && b.status === 'Pending review') - Number(a.priority === 'Urgent' && a.status === 'Pending review') || (exposure[b.assetId] || 0) - (exposure[a.assetId] || 0))
}

// Scenario exposure, conditional on a continuous stop, not a failure forecast.
export function rankLeadTimeExposure(rows, leadDays = 3) {
  if (!Number.isFinite(leadDays) || leadDays < 0 || leadDays > 90) throw new Error('Sample lead time must be between 0 and 90 days.')
  return rows.map(row => ({ ...row, leadDays, scenarioExposureUsd: row.hourlyMarginUsd == null ? null : row.hourlyMarginUsd * 24 * leadDays })).sort((a,b) => (b.scenarioExposureUsd ?? -1) - (a.scenarioExposureUsd ?? -1))
}
