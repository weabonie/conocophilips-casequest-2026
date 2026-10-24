import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterDataToUserScope,
  getRoleHomeModel,
  normalizeRole,
  scopedHref,
} from './homeModel.js'

const data = {
  sites: [
    { id: 'S04', name: 'Arroyo', assets: [{ id: 'A010' }] },
    { id: 'S02', name: 'Mesa', assets: [{ id: 'A004' }] },
  ],
  equipment: [{ id: 'A010', siteId: 'S04' }, { id: 'A004', siteId: 'S02' }],
  events: [{ id: 'E1', siteId: 'S04', assetId: 'A010' }, { id: 'E2', siteId: 'S02', assetId: 'A004' }],
  readings: { A010: [{ date: '2025-01-01' }], A004: [{ date: '2025-01-01' }] },
  hseActions: [{ id: 'H1', siteId: 'S04' }, { id: 'H2', siteId: 'S02' }],
  dataQuality: { bySite: { S04: { missing: 1 }, S02: { missing: 2 } } },
  earlyWarning: { alerts: [{ id: 'W1', siteId: 'S04' }, { id: 'W2', siteId: 'S02' }] },
}

test('normalizes demo role labels', () => {
  assert.equal(normalizeRole('Site HSE Supervisor'), 'hse_supervisor')
  assert.equal(normalizeRole('Operations Manager'), 'ops_manager')
  assert.equal(normalizeRole('technician / dispatcher'), 'technician')
})

test('role model points each role at its next safe action', () => {
  assert.equal(getRoleHomeModel({ role: 'technician', siteIds: 'all' }, data).action.href, '#/dispatch')
  assert.equal(getRoleHomeModel({ role: 'planner', siteIds: 'all' }, data).action.href, '#/reorders')
  assert.equal(getRoleHomeModel({ role: 'hse_supervisor', siteIds: ['S04'] }, data).action.href, '#/hse?siteId=S04')
  assert.equal(getRoleHomeModel({ role: 'site_lead', siteIds: ['S04', 'S02'] }, data).action.href, '#/overview?siteIds=S04%2CS02')
  assert.deepEqual(getRoleHomeModel({ role: 'site_lead', siteIds: ['S04', 'S02'] }, data).scope.siteIds, ['S04', 'S02'])
})

test('scoped links never add a site outside the users scope', () => {
  const user = { role: 'site_lead', siteIds: ['S04'] }
  assert.equal(scopedHref('#/hse', user, 'S02'), '#/hse')
  assert.equal(scopedHref('#/hse', user, 'S04'), '#/hse?siteId=S04')
})

test('scoped data removes records and quality summaries for other sites', () => {
  const scoped = filterDataToUserScope(data, { siteIds: ['S04'] })
  assert.deepEqual(scoped.sites.map((site) => site.id), ['S04'])
  assert.deepEqual(scoped.events.map((event) => event.id), ['E1'])
  assert.deepEqual(Object.keys(scoped.readings), ['A010'])
  assert.deepEqual(scoped.hseActions.map((action) => action.id), ['H1'])
  assert.deepEqual(Object.keys(scoped.dataQuality.bySite), ['S04'])
  assert.deepEqual(scoped.earlyWarning.alerts.map((alert) => alert.id), ['W1'])
})

test('scope keeps flat equipment readings even without nested site assets',()=>{
 const flat={...data,sites:data.sites.map(({id,name})=>({id,name}))}
 const scoped=filterDataToUserScope(flat,{siteIds:['S04']})
 assert.deepEqual(scoped.equipment.map(a=>a.id),['A010'])
 assert.deepEqual(Object.keys(scoped.readings),['A010'])
})
