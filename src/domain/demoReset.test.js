import test from 'node:test'
import assert from 'node:assert/strict'
import { createPersistentStore } from './store.js'
import { resetDemoState } from './demoReset.js'
test('reset only explicit demo keys and registered stores',()=>{const storage=new Map([['cq_excel_url','source'],['cq_prototype_inventory_v2','demo'],['unrelated','keep'],['cq_warning_decisions','lazy feature state']]);globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};const store=createPersistentStore({key:'cq_reset_test',initial:[]});store.set([1]);resetDemoState();assert.deepEqual(store.get(),[]);assert.equal(storage.get('cq_excel_url'),'source');assert.equal(storage.get('unrelated'),'keep');assert.equal(storage.has('cq_prototype_inventory_v2'),false);assert.equal(storage.has('cq_warning_decisions'),false);delete globalThis.localStorage})
