import { ACTIONS, assertCan } from '../../domain/permissions.js'

export function evaluateDispatch({ user, asset, part, stock, alternatives = [], gateStatus, certified = false }) {
  assertCan(user, ACTIONS.RUN_DISPATCH_CHECK, { siteId: asset?.siteId })
  if (!asset?.id || !asset?.siteId) throw new Error('Select an equipment asset first.')
  const parts = !part || !stock || stock.known === false || !Number.isFinite(stock.available)
    ? 'unknown' : stock.available >= 1 ? 'local' : alternatives.some(item => item.available >= 1) ? 'transfer' : 'shortage'
  const hseKnown = ['clear', 'ready', 'live'].includes(gateStatus)
  const blockers = []
  if (gateStatus === 'locked') blockers.push('Site pilot locked. Supervisor verification and release required.')
  else if (!hseKnown) blockers.push('Site pilot status is unknown. Confirm with the HSE supervisor.')
  if (!certified) blockers.push('Confirm a suitably certified technician for this task (sample planning input).')
  if (parts === 'unknown') blockers.push('Part requirement or sample stock is unconfirmed. Planner review required.')
  if (parts === 'transfer') blockers.push('Part is at another site. Arrival must be recorded before local parts readiness.')
  if (parts === 'shortage') blockers.push('No sample stock available. Rush proposal requires planner review.')
  const ready = parts === 'local' && hseKnown && certified
  return { parts, ready, blockers, variant: gateStatus === 'locked' || parts === 'shortage' ? 'danger' : ready ? 'success' : 'warn', title: gateStatus === 'locked' ? 'Site pilot locked' : ready ? 'Ready for supervisor review' : parts === 'transfer' ? 'Part at another site' : parts === 'shortage' ? 'Part not available' : 'Preparation required' }
}
