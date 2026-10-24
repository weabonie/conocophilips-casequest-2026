import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { calculateImpact, IMPACT_PRESETS } from './impactModel.js'
import { DEMO_USERS } from './auth.js'
const data = JSON.parse(fs.readFileSync(new URL('../data/operations.json', import.meta.url)))
const manager = DEMO_USERS.find(u => u.role === 'ops_manager')
const calc = scenario => calculateImpact(data, scenario, manager)
const close = (actual, expected, tolerance = 0.01) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`)

test('four presets reconcile with source event totals and source costs', () => {
  const expected = [[967.992,842354.146,186000],[731.718,667402.031,93000],[1526.726,1322276.888,468200],[2149.9004,1841027.985,861800]]
  IMPACT_PRESETS.forEach((preset, i) => {
    const result = calc(preset)
    close(result.avoidedHours,expected[i][0]); close(result.avoidedMarginUsd,expected[i][1]); close(result.yearOneCostUsd,expected[i][2])
    close(result.perSite.reduce((a,s) => a+s.avoidedHours,0),result.avoidedHours)
    assert.ok(result.sources.some(s => s.table === 'solutions'))
    assert.ok(result.sources.some(s => s.table === 'events'))
  })
})
test('O3 and O4 add while O1 and O5 multiply overlapping stage reductions', () => {
  const a = calc({optionIds:['O3']}), b = calc({optionIds:['O4']})
  close(calc({optionIds:['O3','O4']}).avoidedHours,a.avoidedHours+b.avoidedHours)
  const o1 = calc({optionIds:['O1']}), o5 = calc({optionIds:['O5']}), combined = calc({optionIds:['O1','O5']})
  assert.ok(combined.avoidedHours < o1.avoidedHours+o5.avoidedHours)
  close(combined.avoidedHours,1054,1)
  assert.equal(o5.plannedOutageHours,72)
  const compressorIds = new Set(data.equipment.filter(a=>a.type === 'Compressor').map(a=>a.id))
  for (const s of o5.perSite) for (const event of s.eventResults) {
    const original = data.events.find(e=>e.id === event.eventId)
    if (compressorIds.has(original.assetId)) assert.equal(event.avoidedHours,0)
    assert.ok(event.avoidedByStage.repair <= original.stages.repair-original.protectedRepairHours+1e-8)
    assert.equal(event.avoidedByStage.restart,0)
  }
})
test('shared prerequisites, HSE closure and organization cost are paid once', () => {
  const r=calc({optionIds:['O1','O3','O4'],includeHse:true})
  assert.equal(r.costs.filter(c=>c.key==='organization:O2').length,1)
  assert.equal(r.costs.filter(c=>c.key.endsWith(':O6')).length,6)
  assert.equal(r.costs.filter(c=>c.key.endsWith(':cleanup')).length,6)
  assert.equal(r.costs.filter(c=>c.key.endsWith(':edge')).length,2)
  close(r.yearOneCostUsd,922800)
  close(r.organizationHours,60)
  close(calc({optionIds:['O4'],includeHse:true}).resourceHours,208)
  const recommendation=calc({optionIds:['O4'],includeHse:true})
  close(recommendation.yearOneCostUsd,247000)
  assert.equal(recommendation.costs.filter(c=>c.key.includes(':H')).length,11)
})
test('capacity is site-specific and organization hours do not consume local capacity',()=>{
  const r=calc({optionIds:['O1','O3','O4','O5'],includeHse:true})
  assert.ok(r.perSite.find(s=>s.siteId==='S04').overCapacity)
  const base=calc({optionIds:['O4'],includeHse:true})
  assert.ok(base.perSite.every(s=>!s.overCapacity))
  assert.equal(base.perSite.find(s=>s.siteId==='S04').resourceHours,44)
})
test('role and site scope checked in model; invalid inputs refused',()=>{
  for(const role of ['technician','hse_supervisor']) assert.throws(()=>calculateImpact(data,{},DEMO_USERS.find(u=>u.role===role)),{name:'PermissionError'})
  const lead=DEMO_USERS.find(u=>u.role==='site_lead')
  assert.throws(()=>calculateImpact(data,{siteIds:['S01']},lead),{name:'PermissionError'})
  assert.doesNotThrow(()=>calculateImpact(data,{siteIds:['S04']},lead))
  for(const input of [{siteIds:['bad']},{optionIds:['O9']},{spareFillPct:-1},{earlyWarningAdoptionPct:101},{deploymentMonth:1.5},{deploymentMonth:13}]) assert.throws(()=>calc(input))
})
test('sensitivity assumptions affect benefits only and year-one timing respects source lead times',()=>{
  const full=calc({optionIds:['O1','O4']})
  const zero=calc({optionIds:['O1','O4'],spareFillPct:0,earlyWarningAdoptionPct:0})
  assert.equal(zero.avoidedHours,0); assert.equal(zero.yearOneCostUsd,full.yearOneCostUsd)
  close(calc({spareFillPct:100}).avoidedHours,calc({spareFillPct:90}).avoidedHours)
  assert.equal(calc({deploymentMonth:12}).yearOneBenefitUsd,0)
  const timed=calc({optionIds:['O1'],deploymentMonth:0})
  close(timed.yearOneBenefitUsd,timed.avoidedMarginUsd*9/12)
  const empty=calc({siteIds:[],optionIds:['O1']})
  assert.equal(empty.yearOneCostUsd,0);assert.equal(empty.yearOneReturn,null)
})
