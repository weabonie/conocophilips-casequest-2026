import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fixtureData } from '../app/__fixtures__/data.js'
import { GATE_STATUS, getSiteGateStatus } from './hseGate.js'

test('fixture gate status is locked for open severity-5 actions', () => {
  assert.equal(getSiteGateStatus(fixtureData, 'S02'), GATE_STATUS.LOCKED)
  assert.equal(getSiteGateStatus(fixtureData, 'S04'), GATE_STATUS.LOCKED)
  assert.equal(getSiteGateStatus(fixtureData, 'S06'), GATE_STATUS.LOCKED)
  assert.equal(getSiteGateStatus(fixtureData, 'S01'), GATE_STATUS.CLEAR)
  assert.equal(getSiteGateStatus(fixtureData, 'S05'), GATE_STATUS.CLEAR)
  assert.equal(getSiteGateStatus(fixtureData, 'S03'), GATE_STATUS.CLEAR)
})
