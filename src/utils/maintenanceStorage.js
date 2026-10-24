import {
  releaseReservation,
  consumeReservedParts,
  createHistoryEntry,
} from './inventoryStorage.js'

export const MAINTENANCE_STORAGE_KEY = 'cq_prototype_maintenance_requests_v1'

export const DEMO_TEAMS = [
  { id: '', label: 'Unassigned (Pending assignment)' },
  { id: 'Team Alpha (Mechanical - Demo)', label: 'Team Alpha (Mechanical - Demo)' },
  { id: 'Team Bravo (Rotating Equipment - Demo)', label: 'Team Bravo (Rotating Equipment - Demo)' },
  { id: 'Team Charlie (Electrical & Instrumentation - Demo)', label: 'Team Charlie (Electrical & Instrumentation - Demo)' },
  { id: 'Team Delta (Site Mobile Support - Demo)', label: 'Team Delta (Site Mobile Support - Demo)' },
]

export const PARTS_READINESS_OPTIONS = [
  'Not checked',
  'Awaiting confirmation',
  'Confirmed',
]

export const JOB_STATUSES = ['Draft', 'Scheduled', 'In progress', 'Completed']

export const COMMON_TASKS = [
  'Mechanical seal replacement & alignment survey',
  'Bearing vibration inspection & re-greasing',
  'Impeller clearance adjustment & wear ring check',
  'Vibration diagnostic & spectral analysis',
  'Suction/discharge valve overhaul & seating test',
  'Motor electrical insulation & contactor inspection',
]

export const INITIAL_SEED_REQUESTS = [
  {
    id: 'REQ-001',
    assetId: 'A002',
    siteId: 'S01',
    siteName: 'Cedar',
    equipmentType: 'Lift pump',
    task: 'Mechanical seal inspection & vibration survey',
    proposedDate: '2026-10-27',
    startTime: '09:00',
    estimatedHours: 4,
    assignedTeam: 'Team Bravo (Rotating Equipment - Demo)',
    partsReadiness: 'Confirmed',
    hasConfirmedReservation: true,
    reservedPartId: 'SK-58B',
    reservedPartName: 'Mechanical Seal Kit (Type 58B)',
    reservedQty: 1,
    partsConsumed: false,
    readiness: 'Ready for review',
    status: 'Scheduled',
    statusExplanation: 'All prerequisites met: team assigned and confirmed warehouse reservation (1 kit).',
    notes: 'Historical 2025 data shows 40.0 parts-wait hours on this asset. Mechanical seals verified in warehouse.',
    createdAt: '2026-10-24T09:15:00.000Z',
    updatedAt: '2026-10-24T09:15:00.000Z',
    history: [
      {
        id: 'MH-01',
        action: 'Created',
        by: 'Operations Planner',
        timestamp: '2026-10-24T09:15:00.000Z',
        note: 'Planned with confirmed warehouse reservation (1 kit SK-58B).',
      },
      {
        id: 'MH-02',
        action: 'Scheduled',
        by: 'Operations Planner',
        timestamp: '2026-10-24T09:20:00.000Z',
        note: 'Scheduled for 2026-10-27 09:00 with Team Bravo.',
      },
    ],
  },
  {
    id: 'REQ-002',
    assetId: 'A004',
    siteId: 'S02',
    siteName: 'Mesa',
    equipmentType: 'Compressor',
    task: 'Bearing assembly replacement and oil flush',
    proposedDate: '2026-10-29',
    startTime: '13:00',
    estimatedHours: 6,
    assignedTeam: '',
    partsReadiness: 'Awaiting confirmation',
    hasConfirmedReservation: false,
    reservedPartId: null,
    reservedPartName: null,
    reservedQty: 0,
    partsConsumed: false,
    readiness: 'Needs preparation',
    status: 'Draft',
    statusExplanation: 'Parts readiness is unconfirmed and team is unassigned: saved as Draft (Needs preparation).',
    notes: 'Mesa site currently has 2 critical HSE actions open; requires supervisor clearance before field work.',
    createdAt: '2026-10-24T10:30:00.000Z',
    updatedAt: '2026-10-24T10:30:00.000Z',
    history: [
      {
        id: 'MH-03',
        action: 'Created as Draft',
        by: 'Operations Planner',
        timestamp: '2026-10-24T10:30:00.000Z',
        note: 'Saved as Draft due to stockout at Mesa and unassigned technician team.',
      },
    ],
  },
]

/**
 * Evaluates readiness and job status according to connected business rules:
 * - Readiness is "Ready for review" ONLY if:
 *   1. Technician team is assigned
 *   2. AND parts readiness is "Confirmed" (via active warehouse reservation)
 * - If readiness is "Needs preparation", status is forced to "Draft" with an explanation.
 * - If readiness is "Ready for review", the planner explicitly chooses to schedule or keep as Draft.
 */
export function evaluateReadinessAndStatus(formData) {
  const isTeamAssigned = Boolean(
    formData.assignedTeam &&
    formData.assignedTeam.trim() !== '' &&
    formData.assignedTeam !== 'unassigned'
  )

  // Parts are truly ready if marked Confirmed AND backed by an active reservation (or confirmed flag)
  const isPartsConfirmed =
    formData.partsReadiness === 'Confirmed' && formData.hasConfirmedReservation !== false

  const isReady = isTeamAssigned && isPartsConfirmed
  const readiness = isReady ? 'Ready for review' : 'Needs preparation'

  let status = formData.status || (isReady ? 'Scheduled' : 'Draft')
  let statusExplanation

  if (!isReady) {
    status = 'Draft'
    if (!isTeamAssigned && !isPartsConfirmed) {
      statusExplanation = 'Unconfirmed/unreserved parts and unassigned team: saved as Draft (Needs preparation).'
    } else if (!isPartsConfirmed) {
      statusExplanation = 'Parts not reserved or unconfirmed: saved as Draft (Needs preparation).'
    } else {
      statusExplanation = 'Technician team is unassigned: saved as Draft (Needs preparation).'
    }
  } else {
    if (!JOB_STATUSES.includes(status)) {
      status = 'Scheduled'
    }
    statusExplanation = 'All prerequisites met: team assigned & confirmed warehouse reservation.'
  }

  return { readiness, status, statusExplanation }
}

export function loadRequests() {
  try {
    const raw = localStorage.getItem(MAINTENANCE_STORAGE_KEY)
    if (raw === null) {
      localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(INITIAL_SEED_REQUESTS))
      return INITIAL_SEED_REQUESTS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load maintenance requests from localStorage:', err)
    return []
  }
}

export function saveRequests(requests) {
  try {
    localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(requests))
    return true
  } catch (err) {
    console.error('Failed to save maintenance requests to localStorage:', err)
    return false
  }
}

export function getNextRequestId(existingRequests) {
  const ids = existingRequests
    .map((r) => {
      const match = r.id && r.id.match(/^REQ-(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => !isNaN(n))

  const maxId = ids.length > 0 ? Math.max(...ids) : 0
  const nextNum = maxId + 1
  return `REQ-${String(nextNum).padStart(3, '0')}`
}

/**
 * Updates a maintenance request status, handling parts consumption on "Completed".
 * Ensures parts are consumed exactly once, even with repeated status toggles.
 */
export function handleRequestStatusTransition(request, newStatus, user = 'Operations Planner') {
  const isNeedsPrep = request.readiness === 'Needs preparation'

  // Block marking as Scheduled if readiness is not satisfied
  if (isNeedsPrep && newStatus === 'Scheduled') {
    return {
      success: false,
      reason: 'Cannot mark as Scheduled: team is unassigned or parts are not reserved.',
    }
  }

  const updatedReq = { ...request, status: newStatus, updatedAt: new Date().toISOString() }
  updatedReq.history = updatedReq.history || []

  // Check for Completed status -> consume reserved parts ONCE
  if (newStatus === 'Completed') {
    if (updatedReq.hasConfirmedReservation && updatedReq.reservedPartId && !updatedReq.partsConsumed) {
      consumeReservedParts(
        updatedReq.siteId,
        updatedReq.reservedPartId,
        updatedReq.assetId,
        updatedReq.reservedQty || 1
      )
      updatedReq.partsConsumed = true
      updatedReq.history.push(
        createHistoryEntry(
          'Parts consumed',
          user,
          `Work completed: consumed ${updatedReq.reservedQty || 1} kit of ${updatedReq.reservedPartName || updatedReq.reservedPartId} from warehouse.`
        )
      )
    }
  }

  updatedReq.history.push(
    createHistoryEntry('Status updated', user, `Status changed to '${newStatus}'`)
  )

  return { success: true, updatedReq }
}

/**
 * Cancels / Deletes a maintenance request, releasing any active inventory reservations.
 */
export function cancelOrDeleteMaintenanceRequest(requests, requestId) {
  const target = requests.find((r) => r.id === requestId)
  if (!target) return requests

  // If there was an unconsumed active reservation, release it back to available stock
  if (target.hasConfirmedReservation && target.reservedPartId && !target.partsConsumed) {
    releaseReservation(
      target.siteId,
      target.reservedPartId,
      target.assetId,
      target.reservedQty || 1
    )
  }

  const updated = requests.filter((r) => r.id !== requestId)
  saveRequests(updated)
  return updated
}
