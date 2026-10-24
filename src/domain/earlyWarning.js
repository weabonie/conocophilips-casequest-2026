export const DEFAULT_RULE = Object.freeze({ vibMultiplier: 1.4, tempDeltaC: 8, lookbackDays: 3 })
const day = 86400000

// Historical mechanical frequency is a planning heuristic, not a fault diagnosis.
// Only history strictly before the alert is used, excluding its subsequent event.
export function likelyIssueFor(asset, alert) {
  const history = asset.history || asset.eventHistory || []
  const before = Date.parse(alert?.observedUtc || alert?.date || '9999-01-01')
  const counts = { 'Bearing wear': 0, 'Seal leak': 0 }
  for (const event of history) {
    if (event.type === 'Unplanned' && Date.parse(event.startUtc) < before && event.cause in counts) counts[event.cause]++
  }
  return counts['Seal leak'] > counts['Bearing wear'] ? 'Seal' : 'Bearing'
}

export function detectAlerts(readings, asset, rule = DEFAULT_RULE) {
  return readings.filter(r => r.quality === 'Valid' && r.state === 'Running').flatMap(r => {
    const vibRatio = r.vib != null && asset.vibNormal > 0 ? r.vib / asset.vibNormal : null
    const tempDeltaC = r.temp != null && asset.tempNormal != null ? r.temp - asset.tempNormal : null
    const vibration = vibRatio != null && vibRatio >= rule.vibMultiplier
    const temperature = tempDeltaC != null && tempDeltaC >= rule.tempDeltaC
    if (!vibration && !temperature) return []
    const alert = { id: `${asset.id}:${r.date}`, assetId: asset.id, siteId: asset.siteId, date: r.date,
      observedUtc: r.observedUtc, receivedUtc: r.receivedUtc,
      trigger: vibration && temperature ? 'both' : vibration ? 'vibration' : 'temperature',
      vib: r.vib, temp: r.temp, vibRatio, tempDeltaC, precededEventId: null, leadDays: null }
    alert.likelyIssue = likelyIssueFor(asset, alert)
    return [alert]
  })
}

export function activeWarnings(data, asOfDate) {
  const asOf = Date.parse(asOfDate?.length === 10 ? `${asOfDate}T23:59:59.999Z` : asOfDate)
  if (!Number.isFinite(asOf)) return []
  const rule = data.earlyWarning?.rule || DEFAULT_RULE
  return (data.earlyWarning?.alerts || []).filter(alert => {
    const reading = data.readings?.[alert.assetId]?.find(r => r.date === alert.date)
    const observed = Date.parse(reading?.observedUtc || alert.observedUtc || `${alert.date}T00:00:00Z`)
    return observed <= asOf && observed >= asOf - rule.lookbackDays * day
      && Date.parse(reading?.receivedUtc || alert.receivedUtc || alert.observedUtc || alert.date) <= asOf
  })
}
