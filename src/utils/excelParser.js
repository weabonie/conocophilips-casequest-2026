import * as XLSX from 'xlsx/xlsx.mjs'

import { DEFAULT_RULE, detectAlerts } from '../domain/earlyWarning.js'

export const PARSER_VERSION = 3
const STAGES = ['detect', 'dispatch', 'parts_wait', 'repair', 'restart']
const text = value => value == null ? '' : String(value).trim()
const round = value => value == null ? null : Math.round((value + Number.EPSILON) * 100) / 100
const total = (rows, field) => rows.some(row => row[field] == null)
  ? null : round(rows.reduce((sum, row) => sum + row[field], 0))

export function normalizeAssetId(value) {
  const id = text(value).toUpperCase()
  const match = /^(?:A)?(\d+)$/.exec(id)
  return match ? `A${match[1].padStart(3, '0')}` : id
}

/** Clean in memory; source files are never modified. Optional cleaned tables aid audits. */
export function parseCaseQuestWorkbook(buffer, { asOf, includeCleanedTables = false } = {}) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
  const dataQuality = { tables: {}, counts: {}, issues: [], reconciliation: {} }
  function report(code, table, key, field, details = {}) {
    dataQuality.counts[code] = (dataQuality.counts[code] || 0) + 1
    if (dataQuality.issues.length < 100) dataQuality.issues.push({ code, table, key, field, ...details })
  }
  function fail(table, key, message) {
    throw new Error(`${table} ${key}: ${message}`)
  }
  function numeric(value, table, key, field, { required = false, min = 0, max = Infinity, unit } = {}) {
    if (value == null || text(value) === '') {
      if (required) fail(table, key, `missing ${field}`)
      return null
    }
    let str = text(value)
    if (unit && new RegExp(`\\s*${unit}$`, 'i').test(str)) {
      str = str.replace(new RegExp(`\\s*${unit}$`, 'i'), '')
      report('unitsNormalized', table, key, field)
    }
    if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) str = str.replaceAll(',', '')
    const n = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(str) ? Number(str) : NaN
    if (!Number.isFinite(n) || n < min || n > max) fail(table, key, `invalid ${field}: ${text(value)}`)
    return n
  }
  function date(value, table, key, field, required = false) {
    let d = null
    if (value instanceof Date) d = value
    else if (typeof value === 'number') {
      const parts = XLSX.SSF.parse_date_code(value, { date1904: !!wb.Workbook?.WBProps?.date1904 })
      if (parts) d = new Date(Date.UTC(parts.y, parts.m - 1, parts.d, parts.H, parts.M, parts.S, Math.round(parts.u * 1000)))
    } else if (text(value)) {
      const str = text(value)
      // Source dates without offsets are explicitly UTC, independent of host timezone.
      if (/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(str)) {
        d = new Date(str.length === 10 ? `${str}T00:00:00Z`
          : /(?:Z|[+-]\d{2}:?\d{2})$/.test(str) ? str.replace(' ', 'T') : `${str.replace(' ', 'T')}Z`)
        if (Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) !== str.slice(0, 10)
          && !/[+-]\d{2}:?\d{2}$/.test(str)) d = null
      }
    }
    if (!d || !Number.isFinite(d.getTime())) {
      if (required || text(value)) fail(table, key, `invalid or missing ${field}`)
      return null
    }
    return d.toISOString()
  }
  function category(value, allowed, table, key, field, optional = false) {
    const result = allowed.find(label => label.toLowerCase() === text(value).toLowerCase())
    if (!result && !(optional && !text(value))) fail(table, key, `invalid ${field}: ${text(value)}`)
    return result || null
  }
  function rows(table, keyOf, normalize, optional = false) {
    if (!wb.Sheets[table]) {
      if (!optional) throw new Error(`Workbook missing "${table}" sheet`)
      report('missingOptionalSheet', table)
      return []
    }
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[table], { defval: null })
    const unique = new Map()
    let duplicates = 0
    for (const source of raw) {
      const countsBefore = { ...dataQuality.counts }
      const issuesBefore = dataQuality.issues.length
      const row = Object.fromEntries(Object.entries(source).map(([field, value]) =>
        [field.trim().toLowerCase(), typeof value === 'string' ? value.trim() : value]))
      for (const field of ['asset_id', 'site_id', 'event_id', 'hse_id', 'reading_id', 'work_order_id', 'option_id']) {
        if (row[field] == null) continue
        const cleaned = field === 'asset_id' ? normalizeAssetId(row[field]) : text(row[field]).toUpperCase()
        if (cleaned !== source[field]) report('idsNormalized', table, text(row[field]), field)
        row[field] = cleaned
      }
      const cleaned = normalize(row)
      const key = keyOf(cleaned)
      if (!key) fail(table, '(unknown)', 'missing primary key')
      if (unique.has(key)) {
        const previous = unique.get(key)
        const fields = new Set([...Object.keys(previous), ...Object.keys(cleaned)])
        if ([...fields].some(field => previous[field] !== cleaned[field])) {
          fail(table, key, 'conflicting duplicate; resolve source records before importing')
        }
        duplicates++
        dataQuality.counts = countsBefore
        dataQuality.issues.length = issuesBefore
      } else unique.set(key, cleaned)
    }
    dataQuality.tables[table] = { rawRows: raw.length, cleanRows: unique.size, duplicatesRemoved: duplicates }
    return [...unique.values()]
  }
  function derived(row, field, value, table, key, tolerance = 0.011) {
    if (value == null) return
    if (row[field] == null || Math.abs(row[field] - value) > tolerance) {
      report(row[field] == null ? 'derivedValuesRecovered' : 'derivedValuesCorrected', table, key, field, { originalValue: row[field], cleanedValue: value })
      row[field] = value
    }
  }

  const assets = rows('Assets', row => row.asset_id, row => {
    const key = row.asset_id
    if (!/^A\d{3}$/.test(key) || !/^S\d{2}$/.test(row.site_id)) fail('Assets', key, 'invalid asset/site ID')
    row.asset_type = category(row.asset_type, ['Transfer pump', 'Lift pump', 'Compressor'], 'Assets', key, 'asset_type')
    row.criticality = category(row.criticality, ['High', 'Medium', 'Low'], 'Assets', key, 'criticality')
    for (const field of ['age_years', 'vibration_normal_mm_s', 'temperature_normal_c', 'replacement_usd',
      'technicians', 'training_hours_per_person', 'edge_setup_usd', 'edge_annual_usd', 'cleanup_setup_usd', 'available_project_hours']) {
      row[field] = numeric(row[field], 'Assets', key, field)
    }
    row.modeled_capacity_bbl_hr = numeric(row.modeled_capacity_bbl_hr, 'Assets', key, 'modeled_capacity_bbl_hr', { required: true, min: Number.MIN_VALUE, unit: 'bbl/hr' })
    for (const field of ['network_uptime_pct', 'spare_fill_pct']) row[field] = numeric(row[field], 'Assets', key, field, { max: 100 })
    if (!text(row.site_name)) fail('Assets', key, 'missing site_name')
    return row
  })
  if (!assets.length) throw new Error('Assets sheet has no usable assets')
  const assetMap = new Map(assets.map(row => [row.asset_id, row]))
  const siteMap = new Map()
  const siteFields = ['site_name', 'network_uptime_pct', 'spare_fill_pct', 'technicians', 'training_hours_per_person',
    'edge_setup_usd', 'edge_annual_usd', 'cleanup_setup_usd', 'available_project_hours']
  for (const asset of assets) {
    const previous = siteMap.get(asset.site_id)
    if (previous && siteFields.some(field => previous[field] !== asset[field])) fail('Assets', asset.site_id, 'inconsistent repeated site attributes')
    siteMap.set(asset.site_id, asset)
  }
  function requireAsset(row, table, key) {
    const asset = assetMap.get(row.asset_id)
    if (!asset) fail(table, key, `unknown asset ${row.asset_id}`)
    return asset
  }

  const production = rows('Production', row => `${row.asset_id}_${row.month}`, row => {
    const asset = requireAsset(row, 'Production', row.asset_id)
    row.month = date(row.month, 'Production', row.asset_id, 'month', true).slice(0, 7) + '-01T00:00:00.000Z'
    const key = `${row.asset_id}_${row.month.slice(0, 7)}`
    for (const field of ['calendar_hours', 'potential_oil_bbl', 'produced_oil_bbl', 'gross_deferred_bbl', 'recovered_oil_bbl', 'price_usd_bbl', 'variable_cost_usd_bbl']) {
      row[field] = numeric(row[field], 'Production', key, field, { required: field === 'price_usd_bbl' || field === 'variable_cost_usd_bbl' })
    }
    const d = new Date(row.month)
    const calendarHours = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate() * 24
    derived(row, 'calendar_hours', calendarHours, 'Production', key)
    derived(row, 'potential_oil_bbl', calendarHours * asset.modeled_capacity_bbl_hr, 'Production', key)
    return row
  })
  const productionMap = new Map(production.map(row => [`${row.asset_id}_${row.month.slice(0, 7)}`, row]))
  if (!production.length) throw new Error('Production sheet has no asset-month records')
  const months = production.map(row => row.month).sort()
  for (let month = new Date(months[0]); month <= new Date(months.at(-1)); month.setUTCMonth(month.getUTCMonth() + 1)) {
    for (const asset of assets) {
      const key = `${asset.asset_id}_${month.toISOString().slice(0, 7)}`
      if (!productionMap.has(key)) fail('Production', key, 'missing asset-month in reporting period')
    }
  }
  const events = rows('Events', row => row.event_id, row => {
    const key = row.event_id
    const asset = requireAsset(row, 'Events', key)
    row.event_type = category(row.event_type, ['Planned', 'Unplanned'], 'Events', key, 'event_type')
    row.cause = category(row.cause || 'Unknown', ['Bearing wear', 'Seal leak', 'Electrical trip', 'Process upset', 'Unknown', 'Scheduled service'], 'Events', key, 'cause')
    row.start_utc = date(row.start_utc, 'Events', key, 'start_utc', true)
    for (const field of [...STAGES.map(stage => `${stage}_hours`), 'recoverable_fraction', 'protected_repair_hours']) {
      row[field] = numeric(row[field], 'Events', key, field, { required: true, max: field === 'recoverable_fraction' ? 1 : Infinity })
    }
    if (row.protected_repair_hours > row.repair_hours) fail('Events', key, 'protected repair exceeds repair hours')
    for (const field of ['stopped_hours', 'lost_oil_bbl', 'labor_hours', 'labor_rate_usd_hr', 'parts_usd', 'contractor_usd']) {
      row[field] = numeric(row[field], 'Events', key, field)
    }
    derived(row, 'stopped_hours', STAGES.reduce((sum, stage) => sum + row[`${stage}_hours`], 0), 'Events', key)
    derived(row, 'lost_oil_bbl', round(row.stopped_hours * asset.modeled_capacity_bbl_hr), 'Events', key)
    row.end_utc = date(row.end_utc, 'Events', key, 'end_utc')
    const calculatedEnd = new Date(Date.parse(row.start_utc) + row.stopped_hours * 3600000).toISOString()
    if (!row.end_utc || Math.abs(Date.parse(row.end_utc) - Date.parse(calculatedEnd)) > 1000) {
      report('eventEndRecoveredFromStages', 'Events', key, 'end_utc')
      row.end_utc = calculatedEnd
    }
    for (const field of ['opened_utc', 'closed_utc']) row[field] = date(row[field], 'Events', key, field)
    if (row.parts_usd == null) report('unknownPartsInvoice', 'Events', key, 'parts_usd')
    if (!productionMap.has(`${row.asset_id}_${row.start_utc.slice(0, 7)}`)) fail('Events', key, 'missing matching asset-month production prices')
    return row
  })
  const eventMap = new Map(events.map(row => [row.event_id, row]))
  const workOrders = new Set()
  for (const event of events) {
    if (!event.work_order_id || workOrders.has(event.work_order_id)) fail('Events', event.event_id, 'missing or repeated work_order_id')
    workOrders.add(event.work_order_id)
  }
  const monthlyEvents = new Map()
  for (const event of events) {
    const key = `${event.asset_id}_${event.start_utc.slice(0, 7)}`
    const aggregate = monthlyEvents.get(key) || { gross: 0, recovered: 0 }
    aggregate.gross += event.lost_oil_bbl
    aggregate.recovered += event.lost_oil_bbl * event.recoverable_fraction
    monthlyEvents.set(key, aggregate)
  }
  for (const row of production) {
    const key = `${row.asset_id}_${row.month.slice(0, 7)}`
    const aggregate = monthlyEvents.get(key) || { gross: 0, recovered: 0 }
    const expected = { gross_deferred_bbl: round(aggregate.gross), recovered_oil_bbl: round(aggregate.recovered) }
    expected.produced_oil_bbl = round(row.potential_oil_bbl - expected.gross_deferred_bbl + expected.recovered_oil_bbl)
    for (const [field, value] of Object.entries(expected)) {
      if (value < 0) fail('Production', key, `negative calculated ${field}`)
      derived(row, field, value, 'Production', key)
    }
  }
  dataQuality.reconciliation = { checkedAssetMonths: production.length, toleranceBbl: 0.011, productionMatched: true }

  const hse = rows('HSE', row => row.hse_id, row => {
    const key = row.hse_id
    const asset = requireAsset(row, 'HSE', key)
    const event = eventMap.get(row.event_id)
    if (!event || event.asset_id !== row.asset_id || asset.site_id !== row.site_id) fail('HSE', key, 'asset/site/event links disagree')
    row.action_status = category(row.action_status, ['Open', 'Closed'], 'HSE', key, 'action_status')
    for (const field of ['potential_severity', 'likelihood_band']) {
      row[field] = numeric(row[field], 'HSE', key, field, { required: true, min: 1, max: 5 })
      if (!Number.isInteger(row[field])) fail('HSE', key, `non-integer ${field}`)
    }
    for (const field of ['observed_utc', 'due_date', 'status_as_of', 'closed_date']) row[field] = date(row[field], 'HSE', key, field, field !== 'closed_date')
    if ((row.action_status === 'Closed') !== !!row.closed_date || (row.closed_date && row.closed_date > row.status_as_of)) fail('HSE', key, 'action status and closure date disagree')
    for (const field of ['action_setup_usd', 'action_annual_usd', 'action_person_hours', 'spilled_oil_bbl', 'recovered_spill_bbl']) row[field] = numeric(row[field], 'HSE', key, field)
    if (row.recovered_spill_bbl > row.spilled_oil_bbl) fail('HSE', key, 'recovered spill exceeds spilled volume')
    return row
  })
  const hseDates = [...new Set(hse.map(row => row.status_as_of))]
  if (hseDates.length > 1) fail('HSE', 'snapshot', 'mixed status_as_of dates')

  const readings = rows('Readings', row => row.reading_id, row => {
    const key = row.reading_id
    requireAsset(row, 'Readings', key)
    row.observed_utc = date(row.observed_utc, 'Readings', key, 'observed_utc', true)
    row.received_utc = date(row.received_utc, 'Readings', key, 'received_utc', true)
    if (row.received_utc < row.observed_utc) fail('Readings', key, 'receipt precedes observation')
    row.quality = category(row.quality, ['Valid', 'Suspect', 'Missing'], 'Readings', key, 'quality')
    row.operating_state = category(row.operating_state, ['Running', 'Stopped'], 'Readings', key, 'operating_state', true)
    row.vibration_mm_s = numeric(row.vibration_mm_s, 'Readings', key, 'vibration_mm_s')
    const fahrenheit = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*°?\s*F$/i.exec(text(row.temperature_c))
    if (fahrenheit) {
      row.temperature_c = (Number(fahrenheit[1]) - 32) * 5 / 9
      report('fahrenheitConverted', 'Readings', key, 'temperature_c')
    } else row.temperature_c = numeric(row.temperature_c, 'Readings', key, 'temperature_c', { min: -273.15, unit: '°?\\s*C' })
    return row
  }).sort((a, b) => a.observed_utc.localeCompare(b.observed_utc) || a.received_utc.localeCompare(b.received_utc) || a.reading_id.localeCompare(b.reading_id))
  // Multiple different records for one asset snapshot are ambiguous even if their IDs differ.
  const snapshotKeys = new Set()
  for (const row of readings) {
    const key = `${row.asset_id}_${row.observed_utc}`
    if (snapshotKeys.has(key)) fail('Readings', key, 'multiple records for the same asset observation')
    snapshotKeys.add(key)
    if (row.quality !== 'Valid') report(`${row.quality.toLowerCase()}Reading`, 'Readings', row.reading_id, 'quality')
    if (row.quality === 'Valid' && (row.vibration_mm_s == null || row.temperature_c == null)) report('incompleteValidReading', 'Readings', row.reading_id)
    if (Date.parse(row.received_utc) - Date.parse(row.observed_utc) > 3600000) report('delayedReadingOverOneHour', 'Readings', row.reading_id)
  }
  const solutions = rows('Solutions', row => row.option_id, row => {
    for (const field of ['setup_usd', 'annual_usd', 'lead_months', 'install_person_hours']) row[field] = numeric(row[field], 'Solutions', row.option_id, field, { required: true })
    for (const stage of STAGES) for (const level of ['low', 'base', 'high']) {
      const field = `${stage}_${level}`
      row[field] = numeric(row[field], 'Solutions', row.option_id, field, { required: true, max: 1 })
    }
    return row
  }, true)

  const observationAsOf = readings.reduce((latest, row) => row.received_utc > latest ? row.received_utc : latest, '')
  const cutoff = asOf == null ? observationAsOf : date(asOf, 'Readings', 'snapshot', 'asOf', true)
  const eligibleReadings = readings.filter(row => row.received_utc <= cutoff && row.observed_utc <= cutoff)
  const readingGroups = new Map()
  for (const row of eligibleReadings) {
    const group = readingGroups.get(row.asset_id) || []
    group.push(row)
    readingGroups.set(row.asset_id, group)
  }
  const unplanned = events.filter(row => row.event_type === 'Unplanned')
  for (const event of events) {
    const p = productionMap.get(`${event.asset_id}_${event.start_utc.slice(0, 7)}`)
    event.net_bbl = event.lost_oil_bbl * (1 - event.recoverable_fraction)
    event.contribution_loss = event.net_bbl * (p.price_usd_bbl - p.variable_cost_usd_bbl)
  }
  const sites = [...siteMap.keys()].sort().map(siteId => {
    const meta = siteMap.get(siteId)
    const siteAssets = assets.filter(row => row.site_id === siteId)
    const siteAssetIds = new Set(siteAssets.map(row => row.asset_id))
    const siteEvents = unplanned.filter(row => siteAssetIds.has(row.asset_id))
    const siteHse = hse.filter(row => row.site_id === siteId && row.action_status === 'Open')
    const equipment = siteAssets.map(asset => {
      const history = readingGroups.get(asset.asset_id) || []
      const latest = history.at(-1)
      const valid = latest?.quality === 'Valid'
      const currentVib = valid ? latest.vibration_mm_s : null
      const currentTemp = valid ? latest.temperature_c : null
      const note = valid ? text(latest.inspection_note) : ''
      const stale = latest ? Date.parse(cutoff) - Date.parse(latest.observed_utc) > 48 * 3600000 : true
      const elevatedVib = currentVib != null && asset.vibration_normal_mm_s > 0 && currentVib >= asset.vibration_normal_mm_s * DEFAULT_RULE.vibMultiplier
      const elevated = elevatedVib || (currentTemp != null && asset.temperature_normal_c != null && currentTemp >= asset.temperature_normal_c + DEFAULT_RULE.tempDeltaC)
      const status = !valid || stale ? 'unavailable' : latest.operating_state === 'Stopped' ? 'stopped'
        : latest.operating_state !== 'Running' || currentVib == null || currentTemp == null || !asset.vibration_normal_mm_s ? 'unavailable'
          : elevated ? 'warning' : 'optimal'
      const historyAbnormal = history.filter(row => row.quality === 'Valid' && row.operating_state === 'Running'
        && ((row.vibration_mm_s != null && asset.vibration_normal_mm_s > 0 && row.vibration_mm_s >= asset.vibration_normal_mm_s * DEFAULT_RULE.vibMultiplier) || (row.temperature_c != null && asset.temperature_normal_c != null && row.temperature_c >= asset.temperature_normal_c + DEFAULT_RULE.tempDeltaC))).length
      const assetEvents = siteEvents.filter(row => row.asset_id === asset.asset_id)
      return {
        id: asset.asset_id, siteId, siteName: meta.site_name, type: asset.asset_type,
        criticality: asset.criticality, ageYears: asset.age_years,
        capacityBblHr: asset.modeled_capacity_bbl_hr, replacementUsd: asset.replacement_usd,
        partsWaitUsd: round(assetEvents.reduce((sum, e) => sum + (e.stopped_hours ? e.contribution_loss * e.parts_wait_hours / e.stopped_hours : 0), 0)),
        vibNormal: asset.vibration_normal_mm_s, tempNormal: asset.temperature_normal_c,
        currentVib: round(currentVib), currentTemp: round(currentTemp), status,
        statusReason: status === 'unavailable' ? 'Missing, suspect, incomplete, or stale snapshot'
          : status === 'warning' ? 'Vibration or temperature threshold met'
            : status === 'stopped' ? 'Stopped in latest valid snapshot' : 'Below vibration and temperature thresholds',
        abnormalCount: historyAbnormal, latestNote: note,
        observedUtc: latest?.observed_utc || null, receivedUtc: latest?.received_utc || null,
        readingQuality: latest?.quality || 'Missing', operatingState: latest?.operating_state || null,
        isStale: stale, isHistorical: true,
        events: assetEvents.length, hours: round(assetEvents.reduce((sum, row) => sum + row.stopped_hours, 0)),
        partsHours: round(assetEvents.reduce((sum, row) => sum + row.parts_wait_hours, 0)), loss: total(assetEvents, 'contribution_loss'),
      }
    }).sort((a, b) => b.partsHours - a.partsHours)
    const causeNames = [...new Set(siteEvents.map(row => row.cause))]
    return {
      id: siteId, name: meta.site_name, spareFill: meta.spare_fill_pct, technicians: meta.technicians, network: meta.network_uptime_pct,
      availableProjectHours: meta.available_project_hours, trainingHoursPerPerson: meta.training_hours_per_person,
      edgeSetupUsd: meta.edge_setup_usd, edgeAnnualUsd: meta.edge_annual_usd, cleanupSetupUsd: meta.cleanup_setup_usd,
      criticalActions: siteHse.filter(row => row.potential_severity === 5).length, openActions: siteHse.length,
      events: siteEvents.length, hours: total(siteEvents, 'stopped_hours'), netBbl: total(siteEvents, 'net_bbl'), loss: total(siteEvents, 'contribution_loss'),
      stages: Object.fromEntries(STAGES.map(stage => [stage, total(siteEvents, `${stage}_hours`)])),
      causes: causeNames.map(name => {
        const group = siteEvents.filter(row => row.cause === name)
        return { name, hours: total(group, 'stopped_hours'), events: group.length }
      }).sort((a, b) => b.hours - a.hours), assets: equipment,
    }
  })
  const dates = production.map(row => row.month.slice(0, 10)).sort()
  dataQuality.remainingUnknowns = {
    partsInvoices: events.filter(row => row.parts_usd == null).length,
    missingReadings: readings.filter(row => row.quality === 'Missing').length,
    suspectReadings: readings.filter(row => row.quality === 'Suspect').length,
  }
  const result = {
    parserVersion: PARSER_VERSION, source: 'CaseQuest2026Dataset.xlsx (parsed workbook)',
    period: dates[0]?.slice(0, 4) === dates.at(-1)?.slice(0, 4) ? `${dates[0]?.slice(0, 4)} historical data` : `${dates[0]} to ${dates.at(-1)}`,
    hseAsOf: hseDates[0]?.slice(0, 10) || null, lastSyncTime: new Date().toISOString(),
    sensorAsOf: cutoff || null, sensorRules: { vibrationMultiplier: DEFAULT_RULE.vibMultiplier, temperatureDeltaC: DEFAULT_RULE.tempDeltaC, staleAfterHours: 48, validatedAlarmThreshold: false },
    dataQuality, sites, equipment: sites.flatMap(site => site.assets),
  }
  result.events = events.map(e => ({
    id: e.event_id, assetId: e.asset_id, siteId: assetMap.get(e.asset_id).site_id,
    type: e.event_type, cause: e.cause, startUtc: e.start_utc.replace('.000Z', 'Z').replace(':00Z', 'Z'), endUtc: e.end_utc.replace('.000Z', 'Z').replace(':00Z', 'Z'),
    stages: { detect: e.detect_hours, dispatch: e.dispatch_hours, partsWait: e.parts_wait_hours, repair: e.repair_hours, restart: e.restart_hours },
    stoppedHours: e.stopped_hours, protectedRepairHours: e.protected_repair_hours, lostOilBbl: e.lost_oil_bbl,
    unrecoveredBbl: Number(e.net_bbl.toFixed(4)), lossUsd: Number(e.contribution_loss.toFixed(4)),
    partsWaitUsd: e.stopped_hours ? Number((e.contribution_loss * e.parts_wait_hours / e.stopped_hours).toFixed(4)) : 0,
    partsUsd: e.parts_usd, costStatus: text(e.cost_status), workOrderId: e.work_order_id,
  }))
  // ISO strings retain observed and received instants; precision is rounded to seconds for daily snapshots.
  const compactDate = value => new Date(Math.round(Date.parse(value) / 1000) * 1000).toISOString().replace('.000Z', 'Z').replace(':00Z', 'Z')
  result.readings = Object.fromEntries(assets.map(a => [a.asset_id, []]))
  dataQuality.bySite = Object.fromEntries([...siteMap.keys()].map(id => [id, { readings: 0, valid: 0, missing: 0, suspect: 0, late: 0, missingPct: 0, suspectPct: 0, latePct: 0, avgLateHours: null }]))
  for (const r of readings) {
    const lagHours = (Date.parse(r.received_utc) - Date.parse(r.observed_utc)) / 3600000
    result.readings[r.asset_id].push({ date: r.observed_utc.slice(0, 10), observedUtc: compactDate(r.observed_utc), receivedUtc: compactDate(r.received_utc),
      lagHours: round(lagHours), vib: r.quality === 'Valid' ? round(r.vibration_mm_s) : null,
      temp: r.quality === 'Valid' ? round(r.temperature_c) : null, state: r.operating_state,
      quality: r.quality, note: text(r.inspection_note) })
    const q = dataQuality.bySite[assetMap.get(r.asset_id).site_id]
    q.readings++
    q[r.quality.toLowerCase()]++
    if (lagHours > 6) { q.late++; q.avgLateHours = (q.avgLateHours || 0) + lagHours }
  }
  for (const q of Object.values(dataQuality.bySite)) {
    for (const key of ['missing', 'suspect', 'late']) q[`${key}Pct`] = round(q[key] / q.readings * 100)
    q.avgLateHours = q.late ? round(q.avgLateHours / q.late) : null
  }
  result.hseActions = hse.map(a => ({ id: a.hse_id, siteId: a.site_id, assetId: a.asset_id, eventId: a.event_id,
    hazard: text(a.hazard), severity: a.potential_severity, status: a.action_status, owner: text(a.action_owner),
    dueDate: a.due_date.slice(0, 10), closedDate: a.closed_date?.slice(0, 10) || null,
    daysOverdue: a.action_status === 'Closed' ? null : Math.max(0, Math.floor((Date.parse(a.status_as_of) - Date.parse(a.due_date)) / 86400000)),
    setupUsd: a.action_setup_usd, annualUsd: a.action_annual_usd, personHours: a.action_person_hours, statusAsOf: a.status_as_of.slice(0, 10) }))
  const list = value => text(value).split(';').map(v => v.trim()).filter(Boolean)
  result.solutions = solutions.map(o => ({ id: o.option_id, name: text(o.option_name), unit: text(o.billing_unit),
    setupUsd: o.setup_usd, annualUsd: o.annual_usd, leadMonths: o.lead_months, installHours: o.install_person_hours,
    applicableTypes: /^all$/i.test(text(o.applicable_types)) ? [...new Set(assets.map(a => a.asset_type))] : list(o.applicable_types),
    prerequisites: list(o.prerequisite), eligibleCauses: /all/i.test(text(o.eligible_causes)) ? 'all' : list(o.eligible_causes),
    fractions: Object.fromEntries(STAGES.map(stage => [stage === 'parts_wait' ? 'partsWait' : stage, Object.fromEntries(['low', 'base', 'high'].map(level => [level, o[`${stage}_${level}`]]))])) }))
  result.cleaningLog = wb.Sheets.Cleaning_Log ? XLSX.utils.sheet_to_json(wb.Sheets.Cleaning_Log, { defval: null }).map(row => ({
    date: date(row.Date, 'Cleaning_Log', '', 'Date')?.slice(0, 10) || null, sheet: text(row.Sheet), cells: text(row['Cell(s)']),
    issue: text(row['Issue found']), raw: row['Raw value'], fixed: row['Fixed value / action'],
  })) : []
  const alerts = result.equipment.flatMap(asset => detectAlerts(result.readings[asset.id], {
    ...asset, history: result.events.filter(e => e.assetId === asset.id),
  }))
  const flaggedByCause = Object.fromEntries([...new Set(unplanned.map(e => e.cause))].map(cause => [cause, { flagged: 0, total: unplanned.filter(e => e.cause === cause).length }]))
  const flagged = new Set()
  for (const alert of alerts) {
    const event = result.events.filter(e => e.assetId === alert.assetId && e.type === 'Unplanned'
      && Date.parse(e.startUtc) > Date.parse(alert.observedUtc)
      && Date.parse(e.startUtc) - Date.parse(alert.observedUtc) <= DEFAULT_RULE.lookbackDays * 86400000
      && Date.parse(alert.receivedUtc) <= Date.parse(e.startUtc)).sort((a, b) => a.startUtc.localeCompare(b.startUtc))[0]
    if (event) {
      alert.precededEventId = event.id
      alert.leadDays = round((Date.parse(event.startUtc) - Date.parse(alert.observedUtc)) / 86400000)
      if (!flagged.has(event.id)) { flagged.add(event.id); flaggedByCause[event.cause].flagged++ }
    }
  }
  for (const alert of alerts) {
    alert.vibRatio = round(alert.vibRatio)
    alert.tempDeltaC = round(alert.tempDeltaC)
    delete alert.observedUtc
    delete alert.receivedUtc
  }
  result.earlyWarning = { rule: { ...DEFAULT_RULE }, alerts, summary: { alerts: alerts.length,
    falseAlarms: alerts.filter(a => !a.precededEventId).length, flaggedByCause } }
  if (includeCleanedTables) result.cleanedTables = { Assets: assets, Events: events, Production: production, Readings: readings, HSE: hse, Solutions: solutions }
  return result
}
