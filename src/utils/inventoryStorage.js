export const INVENTORY_STORAGE_KEY = 'cq_prototype_inventory_v2'
export const PARTS_REQUESTS_STORAGE_KEY = 'cq_prototype_parts_requests_v1'

export const SAMPLE_PARTS_CATALOG = [
  {
    partId: 'SK-58B',
    partName: 'Mechanical Seal Kit (Type 58B)',
    category: 'Pumps',
    unit: 'kit',
    minStock: 2,
    applicableTypes: ['Transfer pump', 'Lift pump'],
    description: 'High-pressure mechanical face seal with Viton O-rings for crude transfer pumps.',
  },
  {
    partId: 'WR-220',
    partName: 'Impeller Wear Ring Set',
    category: 'Pumps',
    unit: 'set',
    minStock: 1,
    applicableTypes: ['Transfer pump', 'Lift pump'],
    description: 'Bronze wear ring pair for centrifugal impeller clearance restoration.',
  },
  {
    partId: 'BA-440',
    partName: 'Radial Bearing Assembly (Ceramic-Steel)',
    category: 'Compressors',
    unit: 'kit',
    minStock: 2,
    applicableTypes: ['Compressor'],
    description: 'Precision radial ball and roller bearing set for reciprocating compressors.',
  },
  {
    partId: 'VK-810',
    partName: 'Compressor Valve Overhaul Kit',
    category: 'Compressors',
    unit: 'kit',
    minStock: 1,
    applicableTypes: ['Compressor'],
    description: 'Suction and discharge plate valve overhaul set with replacement springs.',
  },
]

export const SAMPLE_INVENTORY_SEED = [
  // S01 - Cedar
  {
    id: 'S01_SK-58B',
    siteId: 'S01',
    siteName: 'Cedar',
    partId: 'SK-58B',
    partName: 'Mechanical Seal Kit (Type 58B)',
    category: 'Pumps',
    unit: 'kit',
    onHand: 2,
    reserved: 1, // Pre-reserved for REQ-001 (A002)
    minStock: 2,
    location: 'Cedar Warehouse Shelf B-12',
    reservations: [
      {
        reservationId: 'RES-A002-INIT',
        assetId: 'A002',
        qty: 1,
        reservedAt: '2026-10-24T09:15:00.000Z',
        reservedBy: 'Operations Planner',
      },
    ],
  },
  {
    id: 'S01_WR-220',
    siteId: 'S01',
    siteName: 'Cedar',
    partId: 'WR-220',
    partName: 'Impeller Wear Ring Set',
    category: 'Pumps',
    unit: 'set',
    onHand: 3,
    reserved: 0,
    minStock: 1,
    location: 'Cedar Warehouse Shelf B-14',
    reservations: [],
  },
  {
    id: 'S01_BA-440',
    siteId: 'S01',
    siteName: 'Cedar',
    partId: 'BA-440',
    partName: 'Radial Bearing Assembly (Ceramic-Steel)',
    category: 'Compressors',
    unit: 'kit',
    onHand: 3,
    reserved: 0,
    minStock: 2,
    location: 'Cedar Warehouse Rack C-01',
    reservations: [],
  },
  {
    id: 'S01_VK-810',
    siteId: 'S01',
    siteName: 'Cedar',
    partId: 'VK-810',
    partName: 'Compressor Valve Overhaul Kit',
    category: 'Compressors',
    unit: 'kit',
    onHand: 2,
    reserved: 0,
    minStock: 1,
    location: 'Cedar Warehouse Rack C-03',
    reservations: [],
  },

  // S02 - Mesa (Stockout scenario for BA-440 to showcase reorder/transfer workflow)
  {
    id: 'S02_BA-440',
    siteId: 'S02',
    siteName: 'Mesa',
    partId: 'BA-440',
    partName: 'Radial Bearing Assembly (Ceramic-Steel)',
    category: 'Compressors',
    unit: 'kit',
    onHand: 0, // Stockout
    reserved: 0,
    minStock: 2,
    location: 'Mesa Storage Bay 3',
    reservations: [],
  },
  {
    id: 'S02_SK-58B',
    siteId: 'S02',
    siteName: 'Mesa',
    partId: 'SK-58B',
    partName: 'Mechanical Seal Kit (Type 58B)',
    category: 'Pumps',
    unit: 'kit',
    onHand: 1,
    reserved: 0,
    minStock: 2,
    location: 'Mesa Storage Bay 1',
    reservations: [],
  },
  {
    id: 'S02_WR-220',
    siteId: 'S02',
    siteName: 'Mesa',
    partId: 'WR-220',
    partName: 'Impeller Wear Ring Set',
    category: 'Pumps',
    unit: 'set',
    onHand: 2,
    reserved: 0,
    minStock: 1,
    location: 'Mesa Storage Bay 1',
    reservations: [],
  },
  {
    id: 'S02_VK-810',
    siteId: 'S02',
    siteName: 'Mesa',
    partId: 'VK-810',
    partName: 'Compressor Valve Overhaul Kit',
    category: 'Compressors',
    unit: 'kit',
    onHand: 1,
    reserved: 0,
    minStock: 1,
    location: 'Mesa Storage Bay 4',
    reservations: [],
  },

  // S03 - Juniper
  {
    id: 'S03_SK-58B',
    siteId: 'S03',
    siteName: 'Juniper',
    partId: 'SK-58B',
    partName: 'Mechanical Seal Kit (Type 58B)',
    category: 'Pumps',
    unit: 'kit',
    onHand: 3,
    reserved: 0,
    minStock: 2,
    location: 'Juniper Tool Room Shelf 1',
    reservations: [],
  },
  {
    id: 'S03_WR-220',
    siteId: 'S03',
    siteName: 'Juniper',
    partId: 'WR-220',
    partName: 'Impeller Wear Ring Set',
    category: 'Pumps',
    unit: 'set',
    onHand: 2,
    reserved: 0,
    minStock: 1,
    location: 'Juniper Tool Room Shelf 2',
    reservations: [],
  },
  {
    id: 'S03_BA-440',
    siteId: 'S03',
    siteName: 'Juniper',
    partId: 'BA-440',
    partName: 'Radial Bearing Assembly (Ceramic-Steel)',
    category: 'Compressors',
    unit: 'kit',
    onHand: 2,
    reserved: 0,
    minStock: 2,
    location: 'Juniper Tool Room Shelf 3',
    reservations: [],
  },
  {
    id: 'S03_VK-810',
    siteId: 'S03',
    siteName: 'Juniper',
    partId: 'VK-810',
    partName: 'Compressor Valve Overhaul Kit',
    category: 'Compressors',
    unit: 'kit',
    onHand: 2,
    reserved: 0,
    minStock: 1,
    location: 'Juniper Tool Room Shelf 3',
    reservations: [],
  },

  // S04 - Arroyo (Stockout scenario for SK-58B)
  {
    id: 'S04_SK-58B',
    siteId: 'S04',
    siteName: 'Arroyo',
    partId: 'SK-58B',
    partName: 'Mechanical Seal Kit (Type 58B)',
    category: 'Pumps',
    unit: 'kit',
    onHand: 0, // Stockout
    reserved: 0,
    minStock: 2,
    location: 'Arroyo Parts Locker 2',
    reservations: [],
  },
  {
    id: 'S04_WR-220',
    siteId: 'S04',
    siteName: 'Arroyo',
    partId: 'WR-220',
    partName: 'Impeller Wear Ring Set',
    category: 'Pumps',
    unit: 'set',
    onHand: 1,
    reserved: 0,
    minStock: 1,
    location: 'Arroyo Parts Locker 2',
    reservations: [],
  },
  {
    id: 'S04_BA-440',
    siteId: 'S04',
    siteName: 'Arroyo',
    partId: 'BA-440',
    partName: 'Radial Bearing Assembly (Ceramic-Steel)',
    category: 'Compressors',
    unit: 'kit',
    onHand: 1,
    reserved: 0,
    minStock: 1,
    location: 'Arroyo Heavy Equip Locker',
    reservations: [],
  },
  {
    id: 'S04_VK-810',
    siteId: 'S04',
    siteName: 'Arroyo',
    partId: 'VK-810',
    partName: 'Compressor Valve Overhaul Kit',
    category: 'Compressors',
    unit: 'kit',
    onHand: 1,
    reserved: 0,
    minStock: 1,
    location: 'Arroyo Heavy Equip Locker',
    reservations: [],
  },

  // S05 - Canyon
  {
    id: 'S05_SK-58B',
    siteId: 'S05',
    siteName: 'Canyon',
    partId: 'SK-58B',
    partName: 'Mechanical Seal Kit (Type 58B)',
    category: 'Pumps',
    unit: 'kit',
    onHand: 2,
    reserved: 0,
    minStock: 2,
    location: 'Canyon Supply Room A',
    reservations: [],
  },
  {
    id: 'S05_WR-220',
    siteId: 'S05',
    siteName: 'Canyon',
    partId: 'WR-220',
    partName: 'Impeller Wear Ring Set',
    category: 'Pumps',
    unit: 'set',
    onHand: 2,
    reserved: 0,
    minStock: 1,
    location: 'Canyon Supply Room A',
    reservations: [],
  },
  {
    id: 'S05_BA-440',
    siteId: 'S05',
    siteName: 'Canyon',
    partId: 'BA-440',
    partName: 'Radial Bearing Assembly (Ceramic-Steel)',
    category: 'Compressors',
    unit: 'kit',
    onHand: 2,
    reserved: 0,
    minStock: 2,
    location: 'Canyon Supply Room B',
    reservations: [],
  },
  {
    id: 'S05_VK-810',
    siteId: 'S05',
    siteName: 'Canyon',
    partId: 'VK-810',
    partName: 'Compressor Valve Overhaul Kit',
    category: 'Compressors',
    unit: 'kit',
    onHand: 1,
    reserved: 0,
    minStock: 1,
    location: 'Canyon Supply Room B',
    reservations: [],
  },

  // S06 - Prairie
  {
    id: 'S06_SK-58B',
    siteId: 'S06',
    siteName: 'Prairie',
    partId: 'SK-58B',
    partName: 'Mechanical Seal Kit (Type 58B)',
    category: 'Pumps',
    unit: 'kit',
    onHand: 1,
    reserved: 0,
    minStock: 2,
    location: 'Prairie Site Depot Shed',
    reservations: [],
  },
  {
    id: 'S06_WR-220',
    siteId: 'S06',
    siteName: 'Prairie',
    partId: 'WR-220',
    partName: 'Impeller Wear Ring Set',
    category: 'Pumps',
    unit: 'set',
    onHand: 1,
    reserved: 0,
    minStock: 1,
    location: 'Prairie Site Depot Shed',
    reservations: [],
  },
  {
    id: 'S06_BA-440',
    siteId: 'S06',
    siteName: 'Prairie',
    partId: 'BA-440',
    partName: 'Radial Bearing Assembly (Ceramic-Steel)',
    category: 'Compressors',
    unit: 'kit',
    onHand: 0, // Stockout
    reserved: 0,
    minStock: 2,
    location: 'Prairie Depot Locker',
    reservations: [],
  },
  {
    id: 'S06_VK-810',
    siteId: 'S06',
    siteName: 'Prairie',
    partId: 'VK-810',
    partName: 'Compressor Valve Overhaul Kit',
    category: 'Compressors',
    unit: 'kit',
    onHand: 1,
    reserved: 0,
    minStock: 1,
    location: 'Prairie Depot Locker',
    reservations: [],
  },
]

export const INITIAL_PARTS_REQUESTS_SEED = [
  {
    id: 'PR-001',
    assetId: 'A004',
    assetType: 'Compressor',
    siteId: 'S02',
    siteName: 'Mesa',
    partId: 'BA-440',
    partName: 'Radial Bearing Assembly (Ceramic-Steel)',
    requestedQty: 1,
    requestType: 'Reorder',
    sourceSiteId: null,
    sourceSiteName: null,
    priority: 'Urgent',
    reason: 'Stockout for upcoming maintenance: vibration elevated in 2025 logs (40.0 hrs parts wait)',
    historicalWaitHours: 40.0,
    requestedDate: '2026-10-24T10:30:00.000Z',
    requestedBy: 'Operations Planner',
    status: 'Pending review',
    plannerDecision: '',
    decisionDate: null,
    decisionBy: null,
    receivedAt: null,
    receivedBy: null,
    receivedQty: null,
    history: [
      {
        id: 'H-01',
        action: 'Reorder requested',
        by: 'Operations Planner',
        timestamp: '2026-10-24T10:30:00.000Z',
        note: 'Requested 1 kit due to stockout at Mesa. Historical parts wait: 40.0 hrs.',
      },
    ],
  },
]

// Activity History Helper
export function createHistoryEntry(action, by = 'Operations Planner', note = '') {
  return {
    id: 'H-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    action,
    by: by || 'Operations Planner',
    timestamp: new Date().toISOString(),
    note: note || '',
  }
}

// Load and Save Inventory
export function loadInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY)
    if (raw === null) {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(SAMPLE_INVENTORY_SEED))
      return SAMPLE_INVENTORY_SEED
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load inventory from localStorage:', err)
    return []
  }
}

export function saveInventory(inventory) {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory))
    return true
  } catch (err) {
    console.error('Failed to save inventory to localStorage:', err)
    return false
  }
}

// Load and Save Parts Requests
export function loadPartsRequests() {
  try {
    const raw = localStorage.getItem(PARTS_REQUESTS_STORAGE_KEY)
    if (raw === null) {
      localStorage.setItem(PARTS_REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_PARTS_REQUESTS_SEED))
      return INITIAL_PARTS_REQUESTS_SEED
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load parts requests from localStorage:', err)
    return []
  }
}

export function savePartsRequests(requests) {
  try {
    localStorage.setItem(PARTS_REQUESTS_STORAGE_KEY, JSON.stringify(requests))
    return true
  } catch (err) {
    console.error('Failed to save parts requests to localStorage:', err)
    return false
  }
}

// Query Inventory Item
export function getInventoryItem(siteId, partId, inventoryList = null) {
  const inv = inventoryList || loadInventory()
  return inv.find((item) => item.siteId === siteId && item.partId === partId) || null
}

// Suggested Parts Mapping based on equipment type
export function getSuggestedPartsForAsset(asset) {
  const typeLower = String(asset?.type || '').toLowerCase()
  if (typeLower.includes('compressor')) {
    return [
      {
        partId: 'BA-440',
        partName: 'Radial Bearing Assembly (Ceramic-Steel)',
        reason: 'Recommended for vibration mitigation and bearing wear',
        defaultQty: 1,
      },
      {
        partId: 'VK-810',
        partName: 'Compressor Valve Overhaul Kit',
        reason: 'Recommended for pressure differential and valve overhaul',
        defaultQty: 1,
      },
    ]
  }
  // Default to Pumps (Transfer pump, Lift pump)
  return [
    {
      partId: 'SK-58B',
      partName: 'Mechanical Seal Kit (Type 58B)',
      reason: 'Recommended for seal leakage prevention and shaft alignment',
      defaultQty: 1,
    },
    {
      partId: 'WR-220',
      partName: 'Impeller Wear Ring Set',
      reason: 'Recommended for hydraulic efficiency and impeller clearance',
      defaultQty: 1,
    },
  ]
}

// Find Alternative Sites with Available Stock for Inter-Site Transfers
export function getAlternativeSiteStock(partId, currentSiteId, inventoryList = null) {
  const inv = inventoryList || loadInventory()
  return inv
    .filter((item) => {
      if (item.partId !== partId || item.siteId === currentSiteId) return false
      const avail = Math.max(0, item.onHand - (item.reserved || 0))
      return avail > 0
    })
    .map((item) => ({
      siteId: item.siteId,
      siteName: item.siteName,
      onHand: item.onHand,
      reserved: item.reserved || 0,
      available: Math.max(0, item.onHand - (item.reserved || 0)),
      location: item.location,
    }))
}

// Find Active Reservation for an Asset
export function getReservationForAsset(assetId, inventoryList = null) {
  if (!assetId) return null
  const inv = inventoryList || loadInventory()
  for (const item of inv) {
    if (item.reservations && Array.isArray(item.reservations)) {
      const match = item.reservations.find((r) => r.assetId === assetId)
      if (match) {
        return {
          ...match,
          partId: item.partId,
          partName: item.partName,
          siteId: item.siteId,
          siteName: item.siteName,
          location: item.location,
          unit: item.unit,
        }
      }
    }
  }
  return null
}

// Reserve Parts for an Asset (decreases available stock by increasing reserved)
export function reserveParts(siteId, partId, assetId, qty = 1, user = 'Operations Planner') {
  const inv = loadInventory()
  const itemIndex = inv.findIndex((i) => i.siteId === siteId && i.partId === partId)
  if (itemIndex === -1) {
    return { success: false, reason: 'Part not found in site warehouse' }
  }

  const item = inv[itemIndex]
  const currentReserved = item.reserved || 0
  const available = Math.max(0, item.onHand - currentReserved)

  if (available < qty) {
    return {
      success: false,
      reason: `Insufficient available stock. Available: ${available}, Requested: ${qty}`,
    }
  }

  // Check if asset already has a reservation for this part, update or create
  const reservations = Array.isArray(item.reservations) ? [...item.reservations] : []
  const existingIdx = reservations.findIndex((r) => r.assetId === assetId)

  const reservationId = 'RES-' + assetId + '-' + Date.now().toString(36)

  if (existingIdx !== -1) {
    const prevQty = reservations[existingIdx].qty || 0
    item.reserved = currentReserved - prevQty + qty
    reservations[existingIdx] = {
      ...reservations[existingIdx],
      qty,
      reservedAt: new Date().toISOString(),
      reservedBy: user,
    }
  } else {
    item.reserved = currentReserved + qty
    reservations.push({
      reservationId,
      assetId,
      qty,
      reservedAt: new Date().toISOString(),
      reservedBy: user,
    })
  }

  item.reservations = reservations
  inv[itemIndex] = item
  saveInventory(inv)

  return {
    success: true,
    reservationId,
    item,
    available: Math.max(0, item.onHand - item.reserved),
  }
}

// Release Reservation (e.g. When job is canceled, edited, or unreserved)
export function releaseReservation(siteId, partId, assetId, qty = null) {
  const inv = loadInventory()
  const itemIndex = inv.findIndex((i) => i.siteId === siteId && i.partId === partId)
  if (itemIndex === -1) return { success: false, reason: 'Part not found' }

  const item = inv[itemIndex]
  const reservations = Array.isArray(item.reservations) ? [...item.reservations] : []
  const matchIdx = reservations.findIndex((r) => r.assetId === assetId)

  if (matchIdx === -1) {
    return { success: false, reason: 'No active reservation found for asset' }
  }

  const releaseQty = qty != null ? qty : reservations[matchIdx].qty || 0
  item.reserved = Math.max(0, (item.reserved || 0) - releaseQty)
  reservations.splice(matchIdx, 1)
  item.reservations = reservations

  inv[itemIndex] = item
  saveInventory(inv)

  return { success: true, item, available: Math.max(0, item.onHand - item.reserved) }
}

// Consume Reserved Parts When Work is Completed (consumes once, reduces both onHand and reserved)
export function consumeReservedParts(siteId, partId, assetId, qty = 1) {
  const inv = loadInventory()
  const itemIndex = inv.findIndex((i) => i.siteId === siteId && i.partId === partId)
  if (itemIndex === -1) return { success: false, reason: 'Part not found' }

  const item = inv[itemIndex]
  const reservations = Array.isArray(item.reservations) ? [...item.reservations] : []
  const matchIdx = reservations.findIndex((r) => r.assetId === assetId)

  const consumeQty = qty || (matchIdx !== -1 ? reservations[matchIdx].qty : 1)

  item.onHand = Math.max(0, item.onHand - consumeQty)
  item.reserved = Math.max(0, (item.reserved || 0) - consumeQty)

  if (matchIdx !== -1) {
    reservations.splice(matchIdx, 1)
    item.reservations = reservations
  }

  inv[itemIndex] = item
  saveInventory(inv)

  return { success: true, item }
}

// Next Parts Request ID Generator
export function getNextPartsRequestId(existingRequests) {
  const ids = existingRequests
    .map((r) => {
      const match = r.id && r.id.match(/^PR-(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => !isNaN(n))

  const maxId = ids.length > 0 ? Math.max(...ids) : 0
  return `PR-${String(maxId + 1).padStart(3, '0')}`
}

// Create Reorder or Transfer Request
export function createPartsRequest(data, user = 'Operations Planner') {
  const requests = loadPartsRequests()
  const nextId = getNextPartsRequestId(requests)

  const newRequest = {
    id: nextId,
    assetId: data.assetId,
    assetType: data.assetType || 'Equipment',
    siteId: data.siteId,
    siteName: data.siteName,
    partId: data.partId,
    partName: data.partName,
    requestedQty: Number(data.requestedQty) || 1,
    requestType: data.requestType || 'Reorder', // 'Reorder' or 'Site Transfer'
    sourceSiteId: data.sourceSiteId || null,
    sourceSiteName: data.sourceSiteName || null,
    priority: data.priority || 'Standard', // 'Standard' or 'Urgent'
    reason: data.reason || 'Replenishment for maintenance window',
    historicalWaitHours: Number(data.historicalWaitHours) || 0,
    requestedDate: new Date().toISOString(),
    requestedBy: user || 'Operations Planner',
    status: 'Pending review',
    plannerDecision: '',
    decisionDate: null,
    decisionBy: null,
    receivedAt: null,
    receivedBy: null,
    receivedQty: null,
    history: [
      createHistoryEntry(
        data.requestType === 'Site Transfer' ? 'Transfer requested' : 'Reorder requested',
        user,
        data.reason
      ),
    ],
  }

  const updated = [newRequest, ...requests]
  savePartsRequests(updated)
  return newRequest
}

// Approve Reorder Request (Crucial: Does NOT increase inventory)
export function approvePartsRequest(requestId, plannerNote = '', user = 'Operations Planner') {
  const requests = loadPartsRequests()
  const reqIndex = requests.findIndex((r) => r.id === requestId)
  if (reqIndex === -1) return { success: false, reason: 'Request not found' }

  const req = requests[reqIndex]
  if (req.status !== 'Pending review') {
    return { success: false, reason: `Cannot approve request currently in '${req.status}' state` }
  }

  req.status = 'Approved'
  req.plannerDecision = plannerNote || 'Approved for prototype staging'
  req.decisionDate = new Date().toISOString()
  req.decisionBy = user || 'Operations Planner'
  req.history = req.history || []
  req.history.push(
    createHistoryEntry('Approved', user, req.plannerDecision || 'Approved for staging')
  )

  requests[reqIndex] = req
  savePartsRequests(requests)

  return { success: true, request: req }
}

// Reject Parts Request
export function rejectPartsRequest(requestId, reason = '', user = 'Operations Planner') {
  const requests = loadPartsRequests()
  const reqIndex = requests.findIndex((r) => r.id === requestId)
  if (reqIndex === -1) return { success: false, reason: 'Request not found' }

  const req = requests[reqIndex]
  req.status = 'Rejected'
  req.plannerDecision = reason || 'Declined by planner'
  req.decisionDate = new Date().toISOString()
  req.decisionBy = user || 'Operations Planner'
  req.history = req.history || []
  req.history.push(
    createHistoryEntry('Rejected', user, reason || 'Declined by planner')
  )

  requests[reqIndex] = req
  savePartsRequests(requests)

  return { success: true, request: req }
}

// Edit Requested Quantity while in Pending review
export function updatePartsRequestQty(requestId, newQty, user = 'Operations Planner') {
  const requests = loadPartsRequests()
  const reqIndex = requests.findIndex((r) => r.id === requestId)
  if (reqIndex === -1) return { success: false, reason: 'Request not found' }

  const req = requests[reqIndex]
  if (req.status !== 'Pending review') {
    return { success: false, reason: 'Quantity can only be modified while Pending review' }
  }

  const oldQty = req.requestedQty
  const qtyNum = Math.max(1, parseInt(newQty, 10) || 1)
  req.requestedQty = qtyNum
  req.history = req.history || []
  req.history.push(
    createHistoryEntry('Quantity updated', user, `Quantity adjusted from ${oldQty} to ${qtyNum}`)
  )

  requests[reqIndex] = req
  savePartsRequests(requests)

  return { success: true, request: req }
}

// Record Receipt (Crucial: ONLY recording receipt increases on-hand inventory; prevented from double-receipt)
export function recordPartsReceipt(requestId, user = 'Operations Planner') {
  const requests = loadPartsRequests()
  const reqIndex = requests.findIndex((r) => r.id === requestId)
  if (reqIndex === -1) return { success: false, reason: 'Request not found' }

  const req = requests[reqIndex]
  if (req.status !== 'Approved') {
    return { success: false, reason: 'Only approved requests can have receipt recorded' }
  }

  if (req.receivedAt) {
    return { success: false, reason: 'Receipt has already been processed for this request' }
  }

  const inv = loadInventory()
  let itemIndex = inv.findIndex((i) => i.siteId === req.siteId && i.partId === req.partId)

  if (itemIndex === -1) {
    // If not found, add entry to site warehouse
    const catalogItem = SAMPLE_PARTS_CATALOG.find((c) => c.partId === req.partId) || {}
    inv.push({
      id: `${req.siteId}_${req.partId}`,
      siteId: req.siteId,
      siteName: req.siteName,
      partId: req.partId,
      partName: req.partName,
      category: catalogItem.category || 'General',
      unit: catalogItem.unit || 'kit',
      onHand: req.requestedQty,
      reserved: 0,
      minStock: catalogItem.minStock || 1,
      location: `${req.siteName} Main Storage`,
      reservations: [],
    })
    itemIndex = inv.length - 1
  } else {
    // Increase onHand exactly once
    inv[itemIndex].onHand += req.requestedQty
  }

  saveInventory(inv)

  // Update request state
  req.status = 'Received'
  req.receivedAt = new Date().toISOString()
  req.receivedBy = user || 'Operations Planner'
  req.receivedQty = req.requestedQty
  req.history = req.history || []
  req.history.push(
    createHistoryEntry(
      'Receipt recorded',
      user,
      `Received ${req.requestedQty} ${inv[itemIndex].unit || 'kit'} into ${inv[itemIndex].location}. On-hand stock increased.`
    )
  )

  requests[reqIndex] = req
  savePartsRequests(requests)

  return {
    success: true,
    request: req,
    updatedInventory: inv[itemIndex],
    newOnHand: inv[itemIndex].onHand,
  }
}
