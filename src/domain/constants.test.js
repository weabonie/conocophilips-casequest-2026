import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FILL_TARGET_PCT, FULL_YEAR_BENEFIT_USD, PRODUCT_NAME, SITE_ROLLOUT_MONTH, YEAR_ONE_BENEFIT_USD } from './constants.js'

test('roadmap constants expose the settled product decisions', () => {
  assert.equal(PRODUCT_NAME, 'Critical Spares Control Tower')
  assert.equal(FILL_TARGET_PCT, 90)
  assert.equal(FULL_YEAR_BENEFIT_USD, 842000)
  assert.equal(YEAR_ONE_BENEFIT_USD, 721000)
  assert.deepEqual(SITE_ROLLOUT_MONTH, { S04: 1, S02: 2, S06: 2, S01: 3, S03: 3, S05: 3 })
})

