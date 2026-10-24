import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCT_NAME, FULL_YEAR_BENEFIT_USD, YEAR_ONE_BENEFIT_USD, SITE_ROLLOUT_MONTH } from './constants.js'
test('approved rollout estimates stay explicitly distinct', () => {
  assert.equal(PRODUCT_NAME, 'Dashboard')
  assert.equal(FULL_YEAR_BENEFIT_USD, 842000)
  assert.equal(YEAR_ONE_BENEFIT_USD, 721000)
  assert.equal(SITE_ROLLOUT_MONTH.S04, 1)
})
