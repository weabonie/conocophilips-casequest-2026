import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEMO_USERS, ROLES } from './auth.js'
import { ACTIONS, can, PermissionError, assertCan } from './permissions.js'

const user = (role) => DEMO_USERS.find((candidate) => candidate.role === role)

test('permissions match every guide action row', () => {
  assert.equal(can(user(ROLES.TECHNICIAN), ACTIONS.VIEW_OVERVIEW), true)
  assert.equal(can(user(ROLES.PLANNER), ACTIONS.VIEW_DATA_QUALITY), true)
  assert.equal(can(user(ROLES.TECHNICIAN), ACTIONS.RUN_DISPATCH_CHECK), true)
  assert.equal(can(user(ROLES.PLANNER), ACTIONS.STAGE_PART), true)
  assert.equal(can(user(ROLES.SITE_LEAD), ACTIONS.STAGE_PART), true)
  assert.equal(can(user(ROLES.PLANNER), ACTIONS.ACK_WARNING), true)
  assert.equal(can(user(ROLES.PLANNER), ACTIONS.FLAG_FALSE_ALARM), true)
  assert.equal(can(user(ROLES.PLANNER), ACTIONS.DECIDE_REORDER), true)
  assert.equal(can(user(ROLES.PLANNER), ACTIONS.EDIT_MIN_MAX), true)
  assert.equal(can(user(ROLES.HSE_SUPERVISOR), ACTIONS.VERIFY_HSE_ACTION), true)
  assert.equal(can(user(ROLES.HSE_SUPERVISOR), ACTIONS.RELEASE_SITE), true)
  assert.equal(can(user(ROLES.PLANNER), ACTIONS.USE_SIMULATOR), true)
  assert.equal(can(user(ROLES.TECHNICIAN), ACTIONS.USE_COPILOT), true)
  assert.equal(can(user(ROLES.HSE_SUPERVISOR), ACTIONS.EXPORT_ACTIVITY), true)
  assert.equal(can(user(ROLES.OPS_MANAGER), ACTIONS.EXPORT_ACTIVITY), true)
  assert.equal(can(user(ROLES.TECHNICIAN), ACTIONS.RELEASE_SITE), false)
  assert.equal(can(user(ROLES.HSE_SUPERVISOR), ACTIONS.RELEASE_SITE, { siteId: 'S01' }), false)
  assert.equal(can(user(ROLES.HSE_SUPERVISOR), ACTIONS.RELEASE_SITE, { siteId: 'S04' }), true)
})

test('assertCan raises a readable PermissionError', () => {
  assert.throws(() => assertCan(user(ROLES.TECHNICIAN), ACTIONS.STAGE_PART, { siteId: 'S04' }), (error) => error instanceof PermissionError && error.message.includes('technician') && error.message.includes('S04'))
})
