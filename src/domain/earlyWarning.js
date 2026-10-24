export const DEFAULT_RULE = Object.freeze({
  vibMultiplier: 1.4,
  tempDeltaC: 8,
  lookbackDays: 3,
})

const DAY_MS = 24 * 60 * 60 * 1000
const round = value => value == null ? null : Math.round((value + Number.EPSILON) * 100) / 100
const asArray = readings => Array.isArray(readings)
  ? readings
  : Object.values(readings || {}).flat()
const dateOf = value => value instanceof Date ? value : new Date(value)
const validDate = value => Number.isFinite(dateOf(value).getTime())

function readingValue(reading, shortKey, longKey) {
  return reading?.[shortKey] ?? reading?.[longKey] ?? null
}

function assetIdOf(asset) {
  return asset?.assetId || asset?.id || asset?.asset_id
}

function siteIdOf(asset) {
  return asset?.siteId || asset?.site_id || null
}

function normalOf(asset, shortKey, longKey) {
  return asset?.[shortKey] ?? asset?.[longKey] ?? null
}

function historyOf(asset) {
  if (Array.isArray(asset?.eventHistory)) return asset.eventHistory
  if (Array.isArray(asset?.history)) return asset.history
  if (Array.isArray(asset?.events)) return asset.events
  return []
}

function eventDate(event) {
  return event?.startUtc || event?.start_utc || event?.date || null
}

/**
 * The issue label is a deliberately small heuristic: use the asset's own prior
 * mechanical-cause mix, excluding the event this alert preceded. Ties favor Bearing.
 * It is a prototype assumption, not a causal diagnosis.
 */
export function likelyIssueFor(asset, alert = {}) {
  const excluded = alert.precededEventId
  const counts = { Bearing: 0, Seal: 0 }
  for (const event of historyOf(asset)) {
    if (event?.id === excluded || event?.eventId === excluded || event?.event_id === excluded) continue
    const cause = event?.cause
    if (cause === 'Bearing wear' || cause === 'Bearing') counts.Bearing++
    if (cause === 'Seal leak' || cause === 'Seal') counts.Seal++
  }
  if (!counts.Bearing && !counts.Seal) return null
  return counts.Bearing >= counts.Seal ? 'Bearing' : 'Seal'
}

export function detectAlerts(readings, asset, rule = DEFAULT_RULE) {
  const effectiveRule = { ...DEFAULT_RULE, ...rule }
  const assetId = assetIdOf(asset)
  const siteId = siteIdOf(asset)
  const vibNormal = Number(normalOf(asset, 'vibNormal', 'vibration_normal_mm_s'))
  const tempNormal = Number(normalOf(asset, 'tempNormal', 'temperature_normal_c'))
  const events = historyOf(asset)
    .filter(event => event?.type === 'Unplanned' || event?.event_type === 'Unplanned' || event?.eventId || event?.id)
    .filter(event => validDate(eventDate(event)))
  const result = []

  for (const reading of asArray(readings)) {
    if (reading?.quality !== 'Valid') continue
    const observed = reading?.observedUtc || reading?.observed_utc || reading?.date
    if (!validDate(observed)) continue
    const vib = Number(readingValue(reading, 'vib', 'vibration_mm_s'))
    const temp = Number(readingValue(reading, 'temp', 'temperature_c'))
    const vibration = Number.isFinite(vib) && Number.isFinite(vibNormal) && vibNormal > 0 && vib >= vibNormal * effectiveRule.vibMultiplier
    const temperature = Number.isFinite(temp) && Number.isFinite(tempNormal) && temp >= tempNormal + effectiveRule.tempDeltaC
    if (!vibration && !temperature) continue

    const observedMs = dateOf(observed).getTime()
    const preceded = events
      .map(event => ({ event, leadDays: (dateOf(eventDate(event)).getTime() - observedMs) / DAY_MS }))
      .filter(({ leadDays }) => leadDays >= 0 && leadDays <= effectiveRule.lookbackDays)
      .sort((a, b) => a.leadDays - b.leadDays || String(eventDate(a.event)).localeCompare(String(eventDate(b.event))))[0]
    const alert = {
      id: `W-${assetId}-${String(observed).replace(/[^0-9]/g, '').slice(0, 14)}`,
      assetId,
      siteId,
      date: String(observed).slice(0, 10),
      trigger: vibration && temperature ? 'both' : vibration ? 'vibration' : 'temperature',
      vib: Number.isFinite(vib) ? round(vib) : null,
      temp: Number.isFinite(temp) ? round(temp) : null,
      vibRatio: Number.isFinite(vib) && Number.isFinite(vibNormal) && vibNormal > 0 ? round(vib / vibNormal) : null,
      tempDeltaC: Number.isFinite(temp) && Number.isFinite(tempNormal) ? round(temp - tempNormal) : null,
      precededEventId: preceded?.event?.id || preceded?.event?.eventId || preceded?.event?.event_id || null,
      leadDays: preceded ? round(preceded.leadDays) : null,
    }
    alert.likelyIssue = likelyIssueFor(asset, alert)
    result.push(alert)
  }
  return result.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}

export function activeWarnings(data, asOfDate) {
  const alerts = data?.earlyWarning?.alerts || []
  const asOf = dateOf(asOfDate || data?.hseAsOf || new Date())
  if (!Number.isFinite(asOf.getTime())) return []
  const start = asOf.getTime() - (data?.earlyWarning?.rule?.lookbackDays || DEFAULT_RULE.lookbackDays) * DAY_MS
  return alerts.filter(alert => {
    const time = dateOf(alert.date).getTime()
    return Number.isFinite(time) && time >= start && time <= asOf.getTime()
  })
}

