import test from 'node:test'
import assert from 'node:assert/strict'
import { matchRoute, visibleRoutes } from './routes.js'
test('role-home scoped query links retain the requested feature and site',()=>{
 const hse=matchRoute('#/hse?siteId=S04');assert.equal(hse.route.path,'/hse');assert.equal(hse.query.siteId,'S04')
 const site=matchRoute('#/sites/S04?from=home');assert.equal(site.route.path,'/sites/:siteId');assert.equal(site.params.siteId,'S04')
 assert.equal(matchRoute('#/').route.title,'Home')
 assert.equal(visibleRoutes({role:'hse_supervisor'}).some(r=>r.path==='/reorders'),false)
})
