import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_USERS } from './auth.js'
import { ACTIONS, can, assertCan, PermissionError } from './permissions.js'
const expected = {VIEW_OVERVIEW:5,VIEW_DATA_QUALITY:5,RUN_DISPATCH_CHECK:3,STAGE_PART:2,ACK_WARNING:1,FLAG_FALSE_ALARM:1,DECIDE_REORDER:1,EDIT_MIN_MAX:1,VERIFY_HSE_ACTION:1,RELEASE_SITE:1,USE_SIMULATOR:3,USE_COPILOT:5,EXPORT_ACTIVITY:2}
for(const [action,count] of Object.entries(expected)) test(`${action} permits the guide role set`,()=>assert.equal(DEMO_USERS.filter(u=>can(u,ACTIONS[action])).length,count))
test('scoped supervisor cannot release Cedar',()=>{const u=DEMO_USERS.find(u=>u.role==='hse_supervisor');assert.equal(can(u,ACTIONS.RELEASE_SITE,{siteId:'S04'}),true);assert.equal(can(u,ACTIONS.RELEASE_SITE,{siteId:'S01'}),false);assert.throws(()=>assertCan(u,ACTIONS.RELEASE_SITE,{siteId:'S01'}),PermissionError)})
