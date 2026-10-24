const tableLabels = {
  events: 'Events',
  readings: 'Readings',
  hseActions: 'HSE actions',
  cleaningLog: 'Cleaning log',
  sites: 'Sites',
  solutions: 'Solutions',
  equipment: 'Equipment',
}

const columns = {
  events: ['id', 'siteId', 'assetId', 'type', 'cause', 'startUtc', 'endUtc', 'stoppedHours', 'partsWaitUsd', 'lossUsd', 'partsUsd', 'workOrderId'],
  readings: ['assetId', 'date', 'observedUtc', 'receivedUtc', 'lagHours', 'vib', 'temp', 'state', 'quality', 'note'],
  hseActions: ['id', 'siteId', 'assetId', 'eventId', 'hazard', 'severity', 'status', 'owner', 'dueDate', 'daysOverdue', 'statusAsOf'],
  cleaningLog: ['date', 'sheet', 'cells', 'issue', 'raw', 'fixed'],
  sites: ['id', 'name', 'spareFill', 'events', 'hours', 'loss'],
  solutions: ['id', 'name', 'unit', 'setupUsd', 'annualUsd', 'leadMonths'],
  equipment: ['id', 'siteId', 'siteName', 'type', 'ageYears', 'events', 'hours', 'partsHours', 'loss'],
}

const labels = key => key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase())
const toArray = value => Array.isArray(value) ? value : value == null ? [] : [value]

function tableRows(data, table) {
  if (table === 'readings') {
    const siteByAsset = Object.fromEntries((data?.equipment || []).map(asset => [asset.id, asset.siteId]))
    return Object.entries(data?.readings || {}).flatMap(([assetId, readings]) => readings.map(row => ({ assetId, siteId: siteByAsset[assetId], ...row })))
  }
  if (table === 'equipment') return data?.equipment || data?.sites?.flatMap(site => site.assets || []) || []
  return data?.[table] || []
}

function matches(row, filter = {}) {
  for (const [key, expected] of Object.entries(filter)) {
    if (expected == null || expected === '') continue
    const values = toArray(expected)
    const actual = row[key]
    if (key === 'ids') {
      if (!values.includes(row.id) && !values.includes(row.eventId) && !values.includes(row.assetId)) return false
    } else if (Array.isArray(actual)) {
      if (!actual.some(value => values.includes(value))) return false
    } else if (!values.includes(actual)) {
      return false
    }
  }
  return true
}

export function resolveSource(data, { table, filter = {}, label } = {}) {
  if (!columns[table]) throw new Error(`Unknown source table: ${table}`)
  const rows = tableRows(data, table).filter(row => matches(row, filter))
  return {
    label: label || tableLabels[table],
    columns: columns[table].map(key => ({ key, label: labels(key) })),
    rows,
  }
}
