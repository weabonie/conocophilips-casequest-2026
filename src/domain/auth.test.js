import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_USERS, ROLES, authStore, setCurrentUser } from './auth.js'
test('five distinct sample roles and persisted session store',()=>{assert.equal(new Set(DEMO_USERS.map(u=>u.role)).size,Object.keys(ROLES).length);setCurrentUser(DEMO_USERS[1]);assert.equal(authStore.get().role,'planner');setCurrentUser(null)})
