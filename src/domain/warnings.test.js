import test from 'node:test'
import assert from 'node:assert/strict'
import data from '../data/operations.json' with { type: 'json' }
import { DEMO_USERS, authStore } from './auth.js'
import { warningsStore, setWarningsData, acknowledge, flagFalseAlarm, stagePart, recordRaisedWarnings } from './warnings.js'
import { activityStore, getActivity } from './activityLog.js'
import { setPartsData, stockAt } from './partsRequests.js'
import { loadPartsRequests } from '../utils/inventoryStorage.js'
import { activeWarnings } from './earlyWarning.js'
const planner = DEMO_USERS.find(u=>u.role==='planner'), technician=DEMO_USERS.find(u=>u.role==='technician')
const alert = data.earlyWarning.alerts.find(a=>a.id==='A010:2025-01-07')
function setup() { const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)}; warningsStore.reset(); activityStore.reset();authStore.set(planner);setWarningsData(data);setPartsData(data) }
test('acknowledgement is idempotent; false alarm requires a reason and stays recorded',()=>{
 setup(); const one=acknowledge(planner,alert.id);assert.equal(one.status,'acknowledged');assert.equal(acknowledge(planner,alert.id),one);assert.equal(getActivity({type:'warning.acknowledged'}).length,1)
 assert.throws(()=>flagFalseAlarm(planner,alert.id,'  '),/requires a reason/)
 flagFalseAlarm(planner,alert.id,'Inspection found no fault');assert.equal(warningsStore.get().byAlert[alert.id].status,'falseAlarm');assert.equal(warningsStore.get().byAlert[alert.id].reason,'Inspection found no fault')
 assert.throws(()=>stagePart(planner,alert),/false alarm/);assert.throws(()=>acknowledge(planner,alert.id),/already/)
})
test('role, site scope, forged actor and unknown alert writes are refused',()=>{
 setup();authStore.set(technician)
 for(const fn of [()=>acknowledge(technician,alert.id),()=>flagFalseAlarm(technician,alert.id,'No fault'),()=>stagePart(technician,alert),()=>acknowledge(planner,alert.id)])assert.throws(fn,{name:'PermissionError'})
 const scoped={...planner,siteIds:['S01']};authStore.set(scoped);assert.throws(()=>stagePart(scoped,alert),{name:'PermissionError'})
 authStore.set(planner);assert.throws(()=>acknowledge(planner,'fake'),/not found/);assert.equal(Object.keys(warningsStore.get().byAlert).length,0)
})
test('staging creates one Warning-tagged request across retries without adding stock',()=>{
 setup();const before=stockAt('S04','PB-270').available;assert.equal(before,0)
 const staged=stagePart(planner,{...alert,siteId:'S01'}) // canonical source prevents forged site
 assert.equal(staged.status,'staged');assert.equal(stagePart(planner,alert).requestId,staged.requestId)
 const requests=loadPartsRequests().filter(r=>r.warningId===alert.id);assert.equal(requests.length,1);assert.equal(requests[0].siteId,'S04');assert.equal(requests[0].source,'early-warning');assert.equal(requests[0].partId,'PB-270');assert.equal(stockAt('S04','PB-270').available,before)
 assert.equal(getActivity({type:'warning.staged'}).length,1);assert.throws(()=>flagFalseAlarm(planner,alert.id,'changed'),/parts request/)
})
test('transfer staging creates one transfer and does not move stock before approval/receipt',()=>{
 setup();const source=stockAt('S03','PB-270').available
 const staged=stagePart(planner,alert,{fromSiteId:'S03'});const r=loadPartsRequests().find(r=>r.id===staged.requestId)
 assert.equal(r.requestType,'Site Transfer');assert.equal(r.sourceSiteId,'S03');assert.equal(r.warningId,alert.id);assert.equal(stockAt('S03','PB-270').available,source);assert.equal(stockAt('S04','PB-270').available,0)
 assert.equal(stagePart(planner,alert,{fromSiteId:'S03'}).requestId,r.id)
})
test('replay raised activity is once per received alert, including repeated mounts',()=>{
 setup();const visible=activeWarnings(data,'2025-01-07');assert.ok(visible.some(a=>a.id===alert.id));recordRaisedWarnings(visible);recordRaisedWarnings(visible)
 assert.equal(getActivity({type:'warning.raised'}).length,visible.length);assert.equal(getActivity({type:'warning.raised'})[0].actor.id,'system')
})
