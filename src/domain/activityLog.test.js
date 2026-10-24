import test from 'node:test'
import assert from 'node:assert/strict'
import { activityStore, logActivity, getActivity, EVENT_TYPES, subscribeActivity } from './activityLog.js'
test('activity retains actor and decision fields, newest first',()=>{activityStore.reset();let notifications=0;const stop=subscribeActivity(()=>notifications++);logActivity({id:'u',name:'Planner',role:'planner'},{type:EVENT_TYPES.REORDER_CREATED,siteId:'S04',reason:'Stock shortage'});const second=logActivity(null,{type:EVENT_TYPES.SIGN_IN});assert.equal(getActivity()[0].id,second.id);assert.equal(getActivity({siteId:'S04'})[0].reason,'Stock shortage');assert.equal(notifications,2);stop()})
