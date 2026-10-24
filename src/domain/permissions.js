import { ROLES, roleLabel } from './auth.js'

export const ACTIONS = {
  VIEW_OVERVIEW: 'VIEW_OVERVIEW',
  VIEW_DATA_QUALITY: 'VIEW_DATA_QUALITY',
  RUN_DISPATCH_CHECK: 'RUN_DISPATCH_CHECK',
  STAGE_PART: 'STAGE_PART',
  ACK_WARNING: 'ACK_WARNING',
  FLAG_FALSE_ALARM: 'FLAG_FALSE_ALARM',
  DECIDE_REORDER: 'DECIDE_REORDER',
  EDIT_MIN_MAX: 'EDIT_MIN_MAX',
  VERIFY_HSE_ACTION: 'VERIFY_HSE_ACTION',
  RELEASE_SITE: 'RELEASE_SITE',
  USE_SIMULATOR: 'USE_SIMULATOR',
  USE_COPILOT: 'USE_COPILOT',
  EXPORT_ACTIVITY: 'EXPORT_ACTIVITY',
}

const matrix = {
  [ACTIONS.VIEW_OVERVIEW]: [ROLES.TECHNICIAN, ROLES.PLANNER, ROLES.HSE_SUPERVISOR, ROLES.SITE_LEAD, ROLES.OPS_MANAGER],
  [ACTIONS.VIEW_DATA_QUALITY]: [ROLES.TECHNICIAN, ROLES.PLANNER, ROLES.HSE_SUPERVISOR, ROLES.SITE_LEAD, ROLES.OPS_MANAGER],
  [ACTIONS.RUN_DISPATCH_CHECK]: [ROLES.TECHNICIAN, ROLES.PLANNER, ROLES.SITE_LEAD],
  [ACTIONS.STAGE_PART]: [ROLES.PLANNER, ROLES.SITE_LEAD],
  [ACTIONS.ACK_WARNING]: [ROLES.PLANNER],
  [ACTIONS.FLAG_FALSE_ALARM]: [ROLES.PLANNER],
  [ACTIONS.DECIDE_REORDER]: [ROLES.PLANNER],
  [ACTIONS.EDIT_MIN_MAX]: [ROLES.PLANNER],
  [ACTIONS.VERIFY_HSE_ACTION]: [ROLES.HSE_SUPERVISOR],
  [ACTIONS.RELEASE_SITE]: [ROLES.HSE_SUPERVISOR],
  [ACTIONS.USE_SIMULATOR]: [ROLES.PLANNER, ROLES.SITE_LEAD, ROLES.OPS_MANAGER],
  [ACTIONS.USE_COPILOT]: [ROLES.TECHNICIAN, ROLES.PLANNER, ROLES.HSE_SUPERVISOR, ROLES.SITE_LEAD, ROLES.OPS_MANAGER],
  [ACTIONS.EXPORT_ACTIVITY]: [ROLES.HSE_SUPERVISOR, ROLES.OPS_MANAGER],
}

export function can(user, action, { siteId } = {}) {
  if (!user || !matrix[action]?.includes(user.role)) return false
  if (!siteId || user.siteIds === 'all') return true
  return Array.isArray(user.siteIds) && user.siteIds.includes(siteId)
}

export class PermissionError extends Error {
  constructor(user, action, siteId) {
    const scope = siteId ? ` for site ${siteId}` : ''
    super(`${roleLabel(user?.role || 'unknown')} cannot ${action}${scope}.`)
    this.name = 'PermissionError'
    this.action = action
    this.siteId = siteId
  }
}

export function assertCan(user, action, ctx = {}) {
  if (!can(user, action, ctx)) throw new PermissionError(user, action, ctx.siteId)
}

export { matrix as PERMISSION_MATRIX }
