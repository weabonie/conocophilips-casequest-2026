import { createPersistentStore, useStore } from './store.js'
export const ROLES = { TECHNICIAN: 'technician', PLANNER: 'planner', HSE_SUPERVISOR: 'hse_supervisor', SITE_LEAD: 'site_lead', OPS_MANAGER: 'ops_manager' }
export const DEMO_USERS = [
  { id: 'demo-technician', name: 'Alex Morgan', role: ROLES.TECHNICIAN, siteIds: 'all', avatar: 'AM' },
  { id: 'demo-planner', name: 'Jordan Reyes', role: ROLES.PLANNER, siteIds: 'all', avatar: 'JR' },
  { id: 'demo-hse', name: 'Sam Patel', role: ROLES.HSE_SUPERVISOR, siteIds: ['S04', 'S02', 'S06'], avatar: 'SP' },
  { id: 'demo-lead', name: 'Taylor Brooks', role: ROLES.SITE_LEAD, siteIds: ['S04', 'S02', 'S06'], avatar: 'TB' },
  { id: 'demo-manager', name: 'Casey Chen', role: ROLES.OPS_MANAGER, siteIds: 'all', avatar: 'CC' },
]
export const authStore = createPersistentStore({ key: 'cq_demo_session', version: 1, initial: null })
export function useCurrentUser() { return useStore(authStore) }
export function setCurrentUser(user) { authStore.set(user) }
