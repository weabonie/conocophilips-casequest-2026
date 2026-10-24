import { ROLES } from './auth.js'
const keys = ['VIEW_OVERVIEW', 'VIEW_DATA_QUALITY', 'RUN_DISPATCH_CHECK', 'STAGE_PART', 'ACK_WARNING', 'FLAG_FALSE_ALARM', 'DECIDE_REORDER', 'EDIT_MIN_MAX', 'VERIFY_HSE_ACTION', 'RELEASE_SITE', 'USE_SIMULATOR', 'USE_COPILOT', 'EXPORT_ACTIVITY']
export const ACTIONS = Object.fromEntries(keys.map(key => [key, key]))
const all = Object.values(ROLES)
const matrix = {
 VIEW_OVERVIEW: all, VIEW_DATA_QUALITY: all, USE_COPILOT: all,
 RUN_DISPATCH_CHECK: [ROLES.TECHNICIAN, ROLES.PLANNER, ROLES.SITE_LEAD],
 STAGE_PART: [ROLES.PLANNER, ROLES.SITE_LEAD], ACK_WARNING: [ROLES.PLANNER], FLAG_FALSE_ALARM: [ROLES.PLANNER],
 DECIDE_REORDER: [ROLES.PLANNER], EDIT_MIN_MAX: [ROLES.PLANNER],
 VERIFY_HSE_ACTION: [ROLES.HSE_SUPERVISOR], RELEASE_SITE: [ROLES.HSE_SUPERVISOR],
 USE_SIMULATOR: [ROLES.PLANNER, ROLES.SITE_LEAD, ROLES.OPS_MANAGER], EXPORT_ACTIVITY: [ROLES.HSE_SUPERVISOR, ROLES.OPS_MANAGER],
}
export function can(user, action, { siteId } = {}) { return Boolean(user && matrix[action]?.includes(user.role) && (!siteId || user.siteIds === 'all' || user.siteIds?.includes(siteId))) }
export class PermissionError extends Error { constructor(action) { super(`Your demo role cannot ${String(action).toLowerCase().replaceAll('_', ' ')} for this site.`); this.name = 'PermissionError' } }
export function assertCan(user, action, ctx) { if (!can(user, action, ctx)) throw new PermissionError(action) }
