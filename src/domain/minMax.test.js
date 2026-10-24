import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_USERS } from './auth.js'
import { saveMinMax, levelsFor, minMaxSuggestion, decideSuggestion, minMaxStore } from './minMax.js'
import { loadPartsRequests } from '../utils/inventoryStorage.js'
test('min/max needs planner, validates levels, creates one breach request per active asset/part and logs suggestions',()=>{
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};minMaxStore.reset()
 const input={assetId:'A010',siteId:'S04',partId:'PB-270',min:2,max:4}
 assert.throws(()=>saveMinMax(DEMO_USERS[0],input),{name:'PermissionError'})
 assert.throws(()=>saveMinMax(DEMO_USERS[1],{...input,min:5}))
 saveMinMax(DEMO_USERS[1],input);saveMinMax(DEMO_USERS[1],input)
 assert.equal(loadPartsRequests().filter(r=>r.source==='min-breach').length,1)
 assert.deepEqual(levelsFor('A010','PB-270','S04'),{min:2,max:4})
 const suggestion=minMaxSuggestion('A010','PB-270','S04');assert.match(suggestion.reason,/not measured stockout history/)
 decideSuggestion(DEMO_USERS[1],suggestion,true);assert.equal(levelsFor('A010','PB-270','S04').min,3)
 decideSuggestion(DEMO_USERS[1],suggestion,true);assert.equal(levelsFor('A010','PB-270','S04').min,3)
})
