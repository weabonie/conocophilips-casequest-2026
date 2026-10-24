import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateDispatch } from './evaluate.js'
const base = { user: { role: 'technician', siteIds: 'all' }, asset: { id: 'A010', siteId: 'S04' }, part: { partId: 'PB-270' }, stock: { known: true, available: 1 }, gateStatus: 'clear', certified: true }
test('local stock, certification and clear pilot are ready for review only', () => { const result = evaluateDispatch(base); assert.equal(result.ready, true); assert.equal(result.title, 'Ready for supervisor review') })
test('HSE lock overrides local parts and certification', () => { const result = evaluateDispatch({ ...base, gateStatus: 'locked' }); assert.equal(result.ready, false); assert.equal(result.variant, 'danger') })
test('certification is required even when parts exist', () => assert.equal(evaluateDispatch({ ...base, certified: false }).ready, false))
test('unknown HSE status never passes', () => assert.equal(evaluateDispatch({ ...base, gateStatus: undefined }).ready, false))
test('zero local stock with other-site stock is amber, not locally ready', () => { const result = evaluateDispatch({ ...base, stock: { known: true, available: 0 }, alternatives: [{ available: 2 }] }); assert.equal(result.parts, 'transfer'); assert.equal(result.variant, 'warn'); assert.equal(result.ready, false) })
test('zero stock everywhere is shortage', () => assert.equal(evaluateDispatch({ ...base, stock: { known: true, available: 0 } }).parts, 'shortage'))
test('missing inventory is unknown, not an assumed stockout', () => { assert.equal(evaluateDispatch({ ...base, stock: { known: false, available: 0 } }).parts, 'unknown'); assert.equal(evaluateDispatch({ ...base, stock: null }).parts, 'unknown'); assert.equal(evaluateDispatch({ ...base, part: null }).parts, 'unknown') })
test('unauthorized and out-of-site roles cannot evaluate', () => { for (const role of ['ops_manager', 'hse_supervisor']) assert.throws(() => evaluateDispatch({ ...base, user: { role, siteIds: 'all' } })); assert.throws(() => evaluateDispatch({ ...base, user: { role: 'technician', siteIds: ['S01'] } })) })
