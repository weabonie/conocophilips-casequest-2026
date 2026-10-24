const tables = new Set(['events', 'readings', 'hseActions', 'cleaningLog', 'sites', 'solutions', 'equipment'])
export function resolveSource(data, { table, filter = {}, label } = {}) {
  if (!tables.has(table)) throw new Error(`Unknown source table: ${table}`)
  let rows = table === 'readings' ? Object.entries(data.readings || {}).flatMap(([assetId, readings]) => readings.map(r => ({ ...r, assetId,
    siteId: data.equipment.find(a => a.id === assetId)?.siteId }))) : (data[table] || [])
  rows = rows.filter(row => Object.entries(filter).every(([key, value]) => {
    if (value == null) return true
    if (key === 'ids') return value.includes(row.id || `${row.assetId}:${row.date}`)
    if (key === 'siteId' && table === 'sites') return row.id === value
    if (key === 'assetId' && table === 'equipment') return row.id === value
    return row[key] === value
  }))
  const keys = [...new Set(rows.flatMap(row => Object.keys(row)))]
  return { label: label || table, columns: keys.map(key => ({ key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()) })), rows }
}
