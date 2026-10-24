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
    readiness: 'Ready for review',
    status: 'Scheduled',
    statusExplanation: 'All prerequisites met: team assigned and parts confirmed.',
    notes: 'Historical 2025 data shows 40.0 parts-wait hours on this asset. Mechanical seals verified in warehouse.',
    createdAt: '2026-10-24T09:15:00.000Z',
    updatedAt: '2026-10-24T09:15:00.000Z',
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
    readiness: 'Needs preparation',
    status: 'Draft',
    statusExplanation: 'Parts readiness is unconfirmed and team is unassigned: saved as Draft (Needs preparation).',
    notes: 'Mesa site currently has 2 critical HSE actions open; requires supervisor clearance before field work.',
    createdAt: '2026-10-24T10:30:00.000Z',
    updatedAt: '2026-10-24T10:30:00.000Z',
  },
]

/**
 * Evaluates readiness and job status according to prototype business rules:
 * - Readiness is "Ready for review" ONLY if team is assigned AND parts readiness is "Confirmed"
 * - If readiness is "Needs preparation", status is forced to "Draft" with an explanation
 * - Keep job status separate from readiness
 */
export function evaluateReadinessAndStatus(formData) {
  const isTeamAssigned = Boolean(
    formData.assignedTeam &&
    formData.assignedTeam.trim() !== '' &&
    formData.assignedTeam !== 'unassigned'
  )
  const isPartsConfirmed = formData.partsReadiness === 'Confirmed'
  const isReady = isTeamAssigned && isPartsConfirmed

  const readiness = isReady ? 'Ready for review' : 'Needs preparation'

  let status = formData.status || (isReady ? 'Scheduled' : 'Draft')
  let statusExplanation

  if (!isReady) {
    status = 'Draft'
    if (!isTeamAssigned && !isPartsConfirmed) {
      statusExplanation = 'Unconfirmed parts readiness and unassigned team: saved as Draft (Needs preparation).'
    } else if (!isPartsConfirmed) {
      statusExplanation = `Parts readiness is '${formData.partsReadiness || 'Not checked'}': saved as Draft (Needs preparation).`
    } else {
      statusExplanation = 'Team is unassigned: saved as Draft (Needs preparation).'
    }
  } else {
    if (!JOB_STATUSES.includes(status)) {
      status = 'Scheduled'
    }
    statusExplanation = 'All readiness prerequisites met (team assigned & parts confirmed).'
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
