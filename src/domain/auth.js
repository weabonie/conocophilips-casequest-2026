import { useStore } from './store.js'
import { createPersistentStore } from './store.js'
import { EVENT_TYPES, logActivity } from './activityLog.js'

export const ROLES = {
  TECHNICIAN: 'technician',
  PLANNER: 'planner',
  HSE_SUPERVISOR: 'hse_supervisor',
  SITE_LEAD: 'site_lead',
  OPS_MANAGER: 'ops_manager',
}

export const ROLE_LABELS = {
  [ROLES.TECHNICIAN]: 'Technician / dispatcher',
  [ROLES.PLANNER]: 'Maintenance planner',
  [ROLES.HSE_SUPERVISOR]: 'Site HSE supervisor',
  [ROLES.SITE_LEAD]: 'Site lead',
  [ROLES.OPS_MANAGER]: 'Operations manager',
}

export const DEMO_USERS = [
  { id: 'demo-planner', name: 'Maya Chen', role: ROLES.PLANNER, siteIds: 'all', avatar: 'MC', email: 'maya.chen@lonemesa.com' },
  { id: 'demo-technician', name: 'Diego Alvarez', role: ROLES.TECHNICIAN, siteIds: 'all', avatar: 'DA', email: 'diego.alvarez@lonemesa.com' },
  { id: 'demo-hse', name: 'Priya Nair', role: ROLES.HSE_SUPERVISOR, siteIds: ['S04', 'S02', 'S06'], avatar: 'PN', email: 'priya.nair@lonemesa.com' },
  { id: 'demo-site-lead', name: 'Jordan Brooks', role: ROLES.SITE_LEAD, siteIds: ['S04', 'S02', 'S06'], avatar: 'JB', email: 'jordan.brooks@lonemesa.com' },
  { id: 'demo-ops-manager', name: 'Sam Rivera', role: ROLES.OPS_MANAGER, siteIds: 'all', avatar: 'SR', email: 'sam.rivera@lonemesa.com' },
]

const sessionStore = createPersistentStore({ key: 'session', version: 1, initial: null, register: false })

export function useCurrentUser() {
  return useStore(sessionStore)
}

export function getCurrentUser() {
  return sessionStore.get()
}

export function signIn(user) {
  const normalized = DEMO_USERS.find((demoUser) => demoUser.id === user?.id)
    || DEMO_USERS.find((demoUser) => demoUser.role === user?.role)
    || user
  sessionStore.set(normalized)
  logActivity(normalized, { type: EVENT_TYPES.SIGN_IN })
  return normalized
}

export function signOut() {
  sessionStore.set(null)
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role
}

export { sessionStore }
