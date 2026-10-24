import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_USERS, setCurrentUser } from './auth.js'
import { deriveNotifications, notificationStore, markNotificationRead, filterActivity, exportActivityCsv, safeCsvCell, activityFiltersStore, saveActivityFilters } from './notifications.js'

const byRole = role => DEMO_USERS.find(user => user.role === role)
const planner = byRole('planner'), lead = byRole('site_lead'), manager = byRole('ops_manager'), hse = byRole('hse_supervisor'), tech = byRole('technician')
const at = '2026-10-24T10:00:00Z'
const warning = { id: 'one', at, type: 'warning.raised', siteId: 'S04', assetId: 'A010', entityId: 'W1', actor: { id: 'system', name: 'System', role: 'system' } }
beforeEach(() => { notificationStore.reset(); activityFiltersStore.reset(); setCurrentUser(planner) })

test('warning recipients are scoped planners and site leads; repeat events deduplicate', () => {
  const input = { events: [warning, { ...warning, id: 'two' }], warningStock: { W1: false } }
  assert.equal(deriveNotifications({ ...input, user: planner }).length, 1)
  assert.equal(deriveNotifications({ ...input, user: lead }).length, 1)
  assert.equal(deriveNotifications({ ...input, user: manager }).length, 0)
  assert.equal(deriveNotifications({ ...input, user: { ...lead, siteIds: ['S02'] } }).length, 0)
  assert.equal(deriveNotifications({ ...input, user: planner, warningStock: { W1: true } }).length, 0)
  assert.equal(deriveNotifications({ ...input, user: planner, warningStock: {} }).length, 0, 'unknown stock must not mean missing stock')
})
test('acknowledged, staged and reviewed warnings suppress repeat notices regardless of activity order', () => {
  for (const type of ['warning.acknowledged', 'warning.staged', 'warning.falseAlarm']) {
    const notes = deriveNotifications({ events: [{ ...warning, id: 'review', type }, warning], user: planner, warningStock: { W1: false } })
    assert.equal(notes.length, 0)
  }
})
test('site release has only scoped lead and manager recipients; dispatch red includes technician', () => {
  const event = { ...warning, type: 'hse.siteReleased' }
  for (const user of [lead, manager]) assert.equal(deriveNotifications({ user, events: [event] }).length, 1)
  assert.equal(deriveNotifications({ user: planner, events: [event] }).length, 0)
  assert.equal(deriveNotifications({ user: tech, events: [{ ...event, type: 'dispatch.checked', meta: { gateStatus: 'locked' } }] }).length, 1)
})
test('rush reminder uses real request fields and disappears after decision', () => {
  const request = { id: 'PR-1', priority: 'Urgent', status: 'Pending review', requestedDate: at, siteId: 'S04' }
  assert.equal(deriveNotifications({ user: planner, requests: [request], now: '2026-10-24T14:00:00Z' }).length, 0)
  assert.equal(deriveNotifications({ user: planner, requests: [request], now: '2026-10-24T14:00:01Z' }).length, 1)
  assert.equal(deriveNotifications({ user: planner, requests: [{ ...request, status: 'Approved' }], now: '2026-10-24T18:00:00Z' }).length, 0)
})
test('daily digest deduplicates and only newly overdue severity-5 actions notify', () => {
  assert.equal(deriveNotifications({ user: planner, minBreaches: [{}, {}], asOf: '2026-10-01' }).length, 1)
  const hseActions = [{ id: 'H1', dueDate: '2026-09-30', siteId: 'S04', status: 'Open', severity: 5 }, { id: 'H2', dueDate: '2026-01-01', siteId: 'S04', status: 'Open', severity: 5 }]
  const notes = deriveNotifications({ user: hse, hseActions, asOf: '2026-10-01' })
  assert.equal(notes.length, 1); assert.match(notes[0].title, /H1/)
})
test('read state persists per user and rejects another identity', () => {
  const input = { events: [warning], warningStock: { W1: false } }
  markNotificationRead(planner, 'warning:W1')
  assert.equal(deriveNotifications({ ...input, user: planner })[0].read, true)
  assert.equal(deriveNotifications({ ...input, user: lead })[0].read, false)
  assert.throws(() => markNotificationRead(lead, 'warning:W1'), /cannot/)
})
test('CSV exports exactly the filtered permitted rows and neutralizes formula injection', () => {
  setCurrentUser(hse)
  const events = [{ ...warning, reason: '=HYPERLINK("evil")', meta: { filename: 'a,b.pdf' } }, { ...warning, id: 'other-site', siteId: 'S01' }, { ...warning, id: 'other-type', type: 'auth.signIn' }]
  const filters = { type: 'warning.raised', search: 'evil' }
  assert.equal(filterActivity(events, hse, filters).length, 1)
  const csv = exportActivityCsv(hse, events, filters)
  assert.equal(csv.split('\r\n').length, 2)
  assert.ok(csv.includes('"\'=HYPERLINK(""evil"")"'))
  assert.ok(!csv.includes('other-site')); assert.ok(!csv.includes('other-type'))
  assert.equal(safeCsvCell('line\n"a",b'), '"line\n""a"",b"')
  assert.equal(safeCsvCell('  +5'), '"\'  +5"')
})
test('export cannot bypass role gate with forged caller; filters are persisted per account', () => {
  assert.throws(() => exportActivityCsv(planner, [warning]), /cannot/)
  assert.throws(() => exportActivityCsv(manager, [warning]), /cannot/)
  saveActivityFilters(planner, { assetId: 'A010' })
  assert.deepEqual(activityFiltersStore.get()[planner.id], { assetId: 'A010' })
  assert.throws(() => saveActivityFilters(manager, {}), /cannot/)
})
