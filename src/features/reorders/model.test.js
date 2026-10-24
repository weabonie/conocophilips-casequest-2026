import test from 'node:test'
import assert from 'node:assert/strict'
import { rankLeadTimeExposure } from './model.js'
test('lead-time exposure is explicitly conditional, ranks dollars per hour and preserves unknowns',()=>{
 const input=[{assetId:'A011',hourlyMarginUsd:870},{assetId:'A010',hourlyMarginUsd:1213},{assetId:'unknown',hourlyMarginUsd:null}]
 const result=rankLeadTimeExposure(input,3)
 assert.equal(result[0].assetId,'A010');assert.equal(result[0].scenarioExposureUsd,1213*24*3);assert.equal(result[2].scenarioExposureUsd,null)
 assert.equal(input[0].scenarioExposureUsd,undefined);assert.equal(rankLeadTimeExposure(input,0)[0].scenarioExposureUsd,0)
 assert.throws(()=>rankLeadTimeExposure(input,-1));assert.throws(()=>rankLeadTimeExposure(input,Infinity))
})
