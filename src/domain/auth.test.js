import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEMO_USERS, ROLES } from './auth.js'

test('demo users cover each product role and site scope', () => {
  assert.deepEqual(new Set(DEMO_USERS.map((user) => user.role)), new Set(Object.values(ROLES)))
  assert.equal(DEMO_USERS.find((user) => user.role === ROLES.PLANNER).siteIds, 'all')
  assert.deepEqual(DEMO_USERS.find((user) => user.role === ROLES.HSE_SUPERVISOR).siteIds, ['S04', 'S02', 'S06'])
  assert.deepEqual(DEMO_USERS.find((user) => user.role === ROLES.SITE_LEAD).siteIds, ['S04', 'S02', 'S06'])
})
