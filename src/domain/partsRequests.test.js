import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_USERS, setCurrentUser } from './auth.js'
import { createRushReorder, createTransfer, createDispatchReorder, createDispatchTransfer, approveReorder, rejectReorder, editReorderQty, markReceived, stockAt, likelyPartFor, setPartsData } from './partsRequests.js'
import { getActivity } from './activityLog.js'
import { reserveParts, releaseReservation, consumeReservedParts, loadInventory, saveInventory, loadPartsRequests } from '../utils/inventoryStorage.js'
import { reorderRecommendations } from '../features/reorders/model.js'
const planner=DEMO_USERS[1], tech=DEMO_USERS[0]
function reset(){const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};setCurrentUser(planner);setPartsData({sites:[],equipment:[]})}
const args={siteId:'S04',assetId:'A010',partId:'SK-58B',qty:1,source:'early-warning',reason:'Sample shortage'}
test('planner decisions enforce roles, integer quantities, rejection reasons; receipt changes stock once',()=>{
 reset(); assert.throws(()=>createRushReorder(tech,args),{name:'PermissionError'})
 for(const qty of [-1,0,1.5]) assert.throws(()=>createRushReorder(planner,{...args,qty}))
 const request=createRushReorder(planner,args), before=stockAt('S04','SK-58B').onHand
 assert.throws(()=>approveReorder(tech,request.id),{name:'PermissionError'})
 assert.throws(()=>rejectReorder(planner,request.id,''))
 editReorderQty(planner,request.id,2);approveReorder(planner,request.id,'Planner review')
 assert.equal(stockAt('S04','SK-58B').onHand,before)
 markReceived(planner,request.id);assert.equal(stockAt('S04','SK-58B').onHand,before+2)
 assert.throws(()=>markReceived(planner,request.id));assert.equal(stockAt('S04','SK-58B').onHand,before+2)
 assert.equal(getActivity()[0].type,'reorder.received')
})
test('transfer moves source stock at approval and destination stock once on receipt',()=>{
 reset();const from=stockAt('S03','SK-58B').onHand,to=stockAt('S04','SK-58B').onHand
 const r=createTransfer(planner,{fromSiteId:'S03',toSiteId:'S04',assetId:'A010',partId:'SK-58B',qty:2,reason:'Transfer'})
 approveReorder(planner,r.id);assert.equal(stockAt('S03','SK-58B').onHand,from-2);assert.equal(stockAt('S04','SK-58B').onHand,to)
 markReceived(planner,r.id);assert.equal(stockAt('S04','SK-58B').onHand,to+2)
 assert.throws(()=>markReceived(planner,r.id));assert.equal(stockAt('S03','SK-58B').onHand+stockAt('S04','SK-58B').onHand,from+to)
})
test('technician can propose deduplicated dispatch reorder and transfer but cannot approve',()=>{
 reset();const one=createDispatchReorder(tech,args),two=createDispatchReorder(tech,args);assert.equal(one.id,two.id);assert.equal(one.source,'pre-dispatch')
 const transfer={fromSiteId:'S03',toSiteId:'S04',assetId:'A010',partId:'SK-58B',qty:1,reason:'Dispatch stock'}
 assert.equal(createDispatchTransfer(tech,transfer).id,createDispatchTransfer(tech,transfer).id)
 assert.throws(()=>approveReorder(tech,one.id));assert.equal(loadPartsRequests().filter(r=>r.source==='pre-dispatch').length,2)
})
test('reservation retry, resize, partial release and repeated consumption preserve quantities',()=>{
 reset();const inv=loadInventory();const item=inv.find(i=>i.siteId==='S03'&&i.partId==='SK-58B');item.onHand=3;saveInventory(inv)
 const a=reserveParts('S03','SK-58B','A007',2,planner);assert.ok(a.success)
 assert.equal(reserveParts('S03','SK-58B','A007',2,planner).reservationId,a.reservationId)
 assert.equal(stockAt('S03','SK-58B').reserved,2)
 assert.ok(releaseReservation('S03','SK-58B','A007',1,planner).success);assert.equal(stockAt('S03','SK-58B').reserved,1)
 assert.ok(consumeReservedParts('S03','SK-58B','A007',1,planner).success)
 assert.equal(consumeReservedParts('S03','SK-58B','A007',1,planner).success,false);assert.equal(stockAt('S03','SK-58B').onHand,2)
 assert.equal(reserveParts('S03','SK-58B','A008',-1,planner).success,false)
 assert.equal(reserveParts('S03','SK-58B','A008',1,tech).success,false)
})
test('recommendations rank real historical parts wait and use data-backed reasons',()=>{
 reset();const equipment=['A010','A011','A012'].map(id=>({id,siteId:'S04',type:'Lift pump'}))
 const events=equipment.map((a,i)=>({assetId:a.id,type:'Unplanned',stoppedHours:10,partsWaitUsd:[100,300,200][i],lossUsd:1000,stages:{partsWait:i+1}}))
 const rows=reorderRecommendations({equipment,events,sites:[{id:'S04',name:'Arroyo'}]});assert.deepEqual(rows.map(r=>r.assetId),['A011','A012','A010']);assert.match(rows[0].reason,/2.0 parts-wait hours/)
 assert.equal(likelyPartFor(equipment[0],'Bearing wear').partId,'PB-270');assert.equal(likelyPartFor(equipment[0],'Electrical trip'),undefined)
 assert.equal(stockAt('unknown','unknown').known,false)
})
