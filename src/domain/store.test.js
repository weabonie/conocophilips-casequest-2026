import test from 'node:test'
import assert from 'node:assert/strict'
import { createPersistentStore } from './store.js'
test('store updater, stable snapshots, subscription and reset',()=>{const store=createPersistentStore({key:'cq_store_test',initial:{count:0}});let calls=0;const unsubscribe=store.subscribe(()=>calls++);assert.equal(store.get(),store.get());store.set(s=>({count:s.count+1}));assert.equal(store.get().count,1);assert.equal(calls,1);store.reset();assert.equal(store.get().count,0);unsubscribe()})
test('unprefixed store rejected',()=>assert.throws(()=>createPersistentStore({key:'settings',initial:0})))
test('quota failure preserves previous snapshot and reports failure',()=>{const store=createPersistentStore({key:'cq_quota_test',initial:{count:0}});const before=store.get();globalThis.localStorage={setItem(){throw new Error('quota')}};assert.throws(()=>store.set({count:9}),/Unable to save/);assert.equal(store.get(),before);delete globalThis.localStorage})
