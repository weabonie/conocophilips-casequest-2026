import { ACTIONS, can } from './permissions.js'
import { siteKpis, assetExposure } from './metrics.js'
import { resolveSource } from './sources.js'
import { blockingActions, getSiteGateStatus } from './hseGate.js'
import { likelyPartFor, stockAt } from './partsRequests.js'
import { YEAR_ONE_BENEFIT_USD, FULL_YEAR_BENEFIT_USD } from './constants.js'

export const REHEARSED_QUESTIONS = [
  "Why is A010 at the top of the reorder queue?",
  "What's blocking Mesa from going live?",
  "How exposed is Arroyo?",
  "Draft an Arroyo bearing-kit justification.",
  "Why is the year-one benefit $721k?",
  "How much downtime have we avoided since go-live?",
]
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
const number = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)

// Scope the records before every lookup, calculation and source resolution.
// This is a demo UI boundary, not an authentication mechanism for a server.
export function scopeCopilotData(data, user) {
  const sites = (data?.sites || []).filter(site => can(user, ACTIONS.VIEW_OVERVIEW, { siteId: site.id }))
  const ids = new Set(sites.map(site => site.id))
  const equipment = (data?.equipment || []).filter(asset => ids.has(asset.siteId))
  const assetIds = new Set(equipment.map(asset => asset.id))
  return { ...data, sites, equipment,
    events: (data?.events || []).filter(event => ids.has(event.siteId)),
    hseActions: (data?.hseActions || []).filter(action => ids.has(action.siteId)),
    readings: Object.fromEntries(Object.entries(data?.readings || {}).filter(([id]) => assetIds.has(id))),
    // Cleaning notes can contain cross-site source data; never include them implicitly.
    cleaningLog: [],
  }
}
export function controlledIntent(question) {
  const text = question.toLowerCase().replace(/[’']/g, '')
  const verbs = /\b(approve|authorize|authorise|purchase|buy|order|release|unlock|dispatch|change|update|set|edit|dismiss|acknowledge|delete|clear|close|verify|receive|reserve|stage|transfer|reject|cancel|mark)\b/
  const inquiry = /^(why|what|which|how|who|when|where|explain|compare|show|draft|write|can i|could i|am i)\b/
  return verbs.test(text) && (!inquiry.test(text) || /\b(for me|now|please do|on my behalf)\b/.test(text) || /\b(can|could|would) you\b/.test(text))
}
function refusalRoute(question) {
  if (/hse|release|unlock|verify|closure|close|safety/i.test(question)) return { href: '#/hse', label: 'Review HSE gate' }
  if (/warning|dismiss|acknowledge|false alarm/i.test(question)) return { href: '#/early-warning', label: 'Review early warnings' }
  if (/dispatch/i.test(question)) return { href: '#/dispatch', label: 'Run dispatch check' }
  return { href: '#/reorders', label: 'Review reorder queue' }
}
export function answerCopilot({ data, user, question }) {
  if (typeof question !== 'string' || !question.trim() || question.length > 1000) return { kind: 'unavailable', text: 'Enter a question of up to 1,000 characters.', sources: [], links: [] }
  if (!can(user, ACTIONS.USE_COPILOT)) return { kind: 'restricted', text: 'Select a demo role to ask about its permitted sites.', sources: [], links: [] }
  if (controlledIntent(question)) return { kind: 'refused', text: 'I can explain the evidence or draft a justification. I cannot approve requests, order parts, change stock, dismiss warnings or release a site. A permitted person must make that decision in the workspace.', sources: [], links: [refusalRoute(question)] }
  const scoped = scopeCopilotData(data, user)
  const lower = question.toLowerCase()
  const mentionedSite = (data.sites || []).find(site => lower.includes(site.name.toLowerCase()) || new RegExp(`\\b${site.id.toLowerCase()}\\b`).test(lower))
  const mentionedAsset = lower.match(/\ba\d{3}\b/)?.[0].toUpperCase()
  if ((mentionedSite && !scoped.sites.some(site => site.id === mentionedSite.id)) || (mentionedAsset && !scoped.equipment.some(asset => asset.id === mentionedAsset))) return { kind: 'restricted', text: 'That site or asset is outside your demo role’s assigned scope. Select an assigned site or ask your site lead.', sources: [], links: [] }
  const source = (label, table, filter) => resolveSource(scoped, { label, table, filter })
  const result = (text, sources = [], links = [], kind = 'answer') => ({ kind, text, sources, links })
  if (/avoided|since go.?live|achieved|actual sav|measured sav/.test(lower)) return result('Measured downtime avoided since go-live is not available. The workbook contains historical 2025 outages and planning assumptions; demo approvals, pilot releases and receipts do not establish a measured counterfactual. Use the Impact simulator for estimates and collect post-rollout outage data before claiming achieved savings.', [], [{ href: '#/simulator', label: 'Explore modeled impact' }], 'unavailable')
  if (/721|842|year.?one|benefit|staggered/.test(lower)) {
    if (scoped.sites.length !== (data.sites || []).length) return result('The named six-site rollout estimate is outside your assigned site scope. View your permitted sites in the Impact simulator; a partial-site scenario needs its own calculation.', [], [], 'restricted')
    return result(`${money(YEAR_ONE_BENEFIT_USD)} is the named staggered year-one planning estimate; ${money(FULL_YEAR_BENEFIT_USD)} is the paired full-year estimate. The rollout starts Arroyo in month 1, Mesa and Prairie in month 2, and the remaining sites in month 3. These are gross modeled benefits, not measured savings or net profit. The named scenario comes from Product Guide decision D1; it is separate from any changed simulator scenario. O4’s workbook base assumption reduces eligible parts-wait time by 60%.`, [source('O4 workbook assumptions · named rollout: Product Guide D1', 'solutions', { id: 'O4' })], [{ href: '#/simulator', label: 'Review impact assumptions' }])
  }
  if (/mesa|block|hse|gate/.test(lower)) {
    const site = mentionedSite ? scoped.sites.find(s => s.id === mentionedSite.id) : scoped.sites.find(s => s.name === 'Mesa')
    if (!site) return result('Select a site assigned to your demo role to review its pilot blockers.', [], [], 'restricted')
    const blockers = blockingActions(scoped, site.id)
    const status = getSiteGateStatus(scoped, site.id)
    const summary = blockers.length ? `${site.name} has ${blockers.length} open severity-5 actions awaiting supervisor verification: ${blockers.map(action => `${action.id} — ${action.hazard} (owner: ${action.owner}; due ${action.dueDate})`).join('; ')}.` : `${site.name} has no remaining severity-5 actions awaiting demo verification.`
    return result(`${summary} Current prototype pilot state: ${status}. Verification and separate named supervisor release must precede the first qualifying parts receipt. A demo release never substitutes for a field permit or isolation procedures. Historical source status remains unchanged when demo evidence is verified.`, [source(`${site.name} severity-5 source actions`, 'hseActions', { siteId: site.id, severity: 5 })], [{ href: '#/hse', label: 'Review verification and release' }])
  }
  const arroyo = scoped.sites.find(site => site.name === 'Arroyo')
  if (/a010|bearing|justification|reorder|top|first/.test(lower)) {
    const asset = scoped.equipment.find(asset => asset.id === (mentionedAsset || 'A010'))
    if (!asset) return result('That asset is outside your assigned demo scope.', [], [], 'restricted')
    const exposures = assetExposure(scoped), exposure = exposures.find(row => row.assetId === asset.id)
    const lossRank = [...exposures].sort((a, b) => b.lossUsd - a.lossUsd).findIndex(row => row.assetId === asset.id) + 1
    const partsRank = exposures.findIndex(row => row.assetId === asset.id) + 1
    const part = likelyPartFor(asset, 'Bearing wear')
    const stock = part ? stockAt(asset.siteId, part.partId) : null
    const stockText = stock?.known ? `Sample bearing-kit stock is ${stock.onHand} on hand, ${stock.reserved} reserved and ${stock.available} available, against minimum ${stock.minStock}.` : 'Bearing-kit stock is unknown in the sample inventory.'
    return result(`${/draft|justification/.test(lower) ? 'Draft for planner review: ' : ''}${asset.id} (${asset.type}, ${asset.siteName}) recorded ${money(exposure.lossUsd)} of lost margin across ${exposure.events} unplanned outages; that ranks ${lossRank} for total lost margin within your permitted scope. Historical parts-wait exposure was ${money(exposure.partsWaitUsd)} across ${number(exposure.partsWaitHours)} hours (rank ${partsRank} by that metric). Average lost margin per stopped hour was ${exposure.hourlyMarginUsd == null ? 'unknown' : money(exposure.hourlyMarginUsd)}. ${stockText} These sample quantities and illustrative part specifications require inventory and fit verification. A010 is not the first asset by historical parts-wait dollars; the queue’s potential-loss scenario multiplies historical hourly margin by 24 and a user-selected sample lead time, assuming a continuous stop. That is a planning comparison, not a probability-weighted forecast; urgency and sample stock are separate queue criteria. Bearing wear is a historical cause, not a diagnosis of a current failure.`, [source(`${asset.id} unplanned outage records`, 'events', { assetId: asset.id, type: 'Unplanned' }), source(`${asset.id} equipment baseline`, 'equipment', { assetId: asset.id }), ...(stock ? [{ label: 'Sample inventory · current demo values', columns: [{ key: 'partId', label: 'Part' }, { key: 'siteId', label: 'Site' }, { key: 'onHand', label: 'On hand' }, { key: 'reserved', label: 'Reserved' }, { key: 'available', label: 'Available' }, { key: 'minStock', label: 'Minimum' }, { key: 'provenance', label: 'Provenance' }], rows: [{ ...stock, partId: part.partId, siteId: asset.siteId, provenance: 'Sample stock levels; not imported workbook quantities' }] }] : [])], [{ href: '#/reorders', label: 'Review sample stock and queue criteria' }, { href: '#/early-warning', label: 'Inspect warning evidence' }])
  }
  if (/arroyo|exposure|exposed|risk/.test(lower)) {
    const site = mentionedSite ? scoped.sites.find(s => s.id === mentionedSite.id) : arroyo
    if (!site) return result('Choose a site assigned to your demo role to review exposure.', [], [], 'restricted')
    const kpi = siteKpis(scoped).find(kpi => kpi.siteId === site.id)
    return result(`${site.name} recorded ${number(kpi.unplannedHours ?? scoped.events.filter(e => e.siteId === site.id && e.type === 'Unplanned').reduce((sum, e) => sum + e.stoppedHours, 0))} unplanned hours and ${money(kpi.lossUsd)} lost margin in 2025. ${number(kpi.partsWaitHours)} hours and ${money(kpi.partsWaitUsd)} of exposure were attributable to waiting for parts. ${number(kpi.partsWaitShare)}% of its unplanned outages waited for parts; historical spare fill was ${number(kpi.spareFill)}% against the 90% target. Spare fill is a workbook service measure, not a count of physical parts. Prioritize inventory verification and the HSE pilot gate before rollout.`, [source(`${site.name} unplanned outage records`, 'events', { siteId: site.id, type: 'Unplanned' }), source(`${site.name} site assumptions`, 'sites', { siteId: site.id })], [{ href: `#/sites/${site.id}`, label: `Open ${site.name}` }])
  }
  return result('That answer is not available in the deterministic prototype. I can explain historical site exposure, A010’s queue justification, Mesa’s HSE blockers and the named rollout estimates. Supplier delivery promises, actual live sensor conditions and achieved savings are not in the dataset. Open-ended live answers are unavailable in this demo.', [], [], 'unavailable')
}
