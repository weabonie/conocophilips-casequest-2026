import { ACTIONS, assertCan } from './permissions.js'

export const IMPACT_PRESETS = Object.freeze([
  { id: 'o4-all', name: 'O4 · all sites', optionIds: ['O4'] },
  { id: 'o4-core', name: 'O4 · Arroyo, Mesa, Prairie', optionIds: ['O4'], siteIds: ['S04', 'S02', 'S06'] },
  { id: 'o3-o4', name: 'O3 + O4 · all sites', optionIds: ['O3', 'O4'] },
  { id: 'o1-o3-o4', name: 'O1 + O3 + O4 · all sites', optionIds: ['O1', 'O3', 'O4'] },
])
const STAGES = ['detect', 'dispatch', 'partsWait', 'repair', 'restart']
const supported = ['O1', 'O3', 'O4', 'O5']
const numeric = (value, name) => {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a nonnegative number.`)
  return value
}
const percent = (value, name) => {
  numeric(value, name)
  if (value > 100) throw new Error(`${name} must be between 0 and 100.`)
  return value / 100
}
export function defaultScenario(data) { return { siteIds: data.sites.map(s => s.id), optionIds: ['O4'], spareFillPct: 90, earlyWarningAdoptionPct: 100, deploymentMonth: null, includeHse: false } }

// Historical stage-reduction model. Sensitivity controls are explicit assumptions,
// not an estimated causal relationship between stock fill and outage duration.
export function calculateImpact(data, scenario = {}, user) {
  assertCan(user, ACTIONS.USE_SIMULATOR)
  const input = { ...defaultScenario(data), ...scenario }
  if (!Array.isArray(input.siteIds) || !Array.isArray(input.optionIds)) throw new Error('Choose site and option lists.')
  const siteIds = [...new Set(input.siteIds)]
  const optionIds = [...new Set(input.optionIds)]
  if (optionIds.some(id => !supported.includes(id))) throw new Error('Unknown simulator option.')
  const sites = siteIds.map(id => {
    const site = data.sites.find(s => s.id === id)
    if (!site) throw new Error(`Unknown site: ${id}`)
    assertCan(user, ACTIONS.USE_SIMULATOR, { siteId: id })
    return site
  })
  const fillScale = Math.min(1, percent(input.spareFillPct, 'Spare fill') / 0.9)
  const adoption = percent(input.earlyWarningAdoptionPct, 'Early-warning adoption')
  if (input.deploymentMonth != null && (!Number.isInteger(input.deploymentMonth) || input.deploymentMonth < 0 || input.deploymentMonth > 12)) throw new Error('Deployment month must be an integer from 0 to 12.')
  const options = optionIds.map(id => {
    const option = data.solutions.find(s => s.id === id)
    if (!option) throw new Error(`Missing source solution: ${id}`)
    return option
  })
  const allCosts = []
  const addCost = (list, key, label, setupUsd, annualUsd, hours, source) => {
    const row = { key, label, setupUsd: numeric(setupUsd, label), annualUsd: numeric(annualUsd, label), hours: numeric(hours, label), source }
    list.push(row); allCosts.push(row)
  }
  const perSite = sites.map(site => {
    const assets = data.equipment.filter(a => a.siteId === site.id)
    const events = data.events.filter(e => e.siteId === site.id && e.type === 'Unplanned')
    const costs = []
    let plannedOutageHours = 0
    for (const option of options) {
      const units = option.unit === 'Asset' ? assets.filter(a => option.applicableTypes.includes(a.type)).length : 1
      addCost(costs, `${site.id}:${option.id}`, option.name, units * option.setupUsd, units * option.annualUsd, units * option.installHours, { table: 'solutions', filter: { ids: [option.id] } })
      if (option.id === 'O5') plannedOutageHours += units * 6
    }
    if (optionIds.includes('O1') || optionIds.includes('O3')) {
      const training = data.solutions.find(s => s.id === 'O6')
      if (!training) throw new Error('Missing training prerequisite O6.')
      addCost(costs, `${site.id}:O6`, 'Digital training (shared once)', training.setupUsd, training.annualUsd, site.technicians * site.trainingHoursPerPerson, { table: 'solutions', filter: { ids: ['O6'] } })
      addCost(costs, `${site.id}:cleanup`, 'Site cleanup (shared once)', site.cleanupSetupUsd, 0, 0, { table: 'sites', filter: { siteId: site.id } })
    }
    if (optionIds.includes('O1') && site.network < 97) addCost(costs, `${site.id}:edge`, 'Edge buffering', site.edgeSetupUsd, site.edgeAnnualUsd, 0, { table: 'sites', filter: { siteId: site.id } })
    const hseRows = input.includeHse && optionIds.length ? data.hseActions.filter(a => a.siteId === site.id && a.status === 'Open') : []
    hseRows.forEach(a => addCost(costs, `${site.id}:${a.id}`, `HSE closure ${a.id}`, a.setupUsd, a.annualUsd, a.personHours, { table: 'hseActions', filter: { ids: [a.id] } }))
    const stages = Object.fromEntries(STAGES.map(stage => [stage, 0]))
    let avoidedMarginUsd = 0
    const eventResults = events.map(event => {
      const asset = assets.find(a => a.id === event.assetId)
      const applicable = options.filter(option => option.applicableTypes.includes(asset?.type) && (option.eligibleCauses === 'all' || option.eligibleCauses.includes(event.cause)))
      const avoidedByStage = Object.fromEntries(STAGES.map(stage => {
        const original = numeric(event.stages[stage], `Event ${event.id} ${stage}`)
        const protectedHours = stage === 'repair' ? Math.min(original, numeric(event.protectedRepairHours, 'Protected repair hours')) : 0
        const remaining = applicable.reduce((fraction, option) => {
          const scale = option.id === 'O4' ? fillScale : option.id === 'O1' ? adoption : 1
          return fraction * (1 - option.fractions[stage].base * scale)
        }, 1)
        const avoided = (original - protectedHours) * (1 - remaining)
        stages[stage] += avoided
        return [stage, avoided]
      }))
      const avoidedHours = Object.values(avoidedByStage).reduce((a, b) => a + b, 0)
      const margin = event.stoppedHours > 0 ? event.lossUsd * avoidedHours / event.stoppedHours : 0
      avoidedMarginUsd += margin
      return { eventId: event.id, avoidedHours, avoidedMarginUsd: margin, avoidedByStage }
    })
    const leadMonths = Math.max(0, ...options.map(o => o.leadMonths))
    const deploymentMonth = Math.max(leadMonths, input.deploymentMonth ?? leadMonths)
    return { siteId: site.id, name: site.name, stages, avoidedHours: Object.values(stages).reduce((a, b) => a + b, 0), avoidedMarginUsd,
      yearOneBenefitUsd: avoidedMarginUsd * (12 - deploymentMonth) / 12, deploymentMonth, costs,
      setupUsd: costs.reduce((a, c) => a + c.setupUsd, 0), annualUsd: costs.reduce((a, c) => a + c.annualUsd, 0),
      resourceHours: costs.reduce((a, c) => a + c.hours, 0), availableProjectHours: site.availableProjectHours,
      overCapacity: costs.reduce((a, c) => a + c.hours, 0) > site.availableProjectHours,
      plannedOutageHours, eventResults,
      sources: [{ table: 'events', filter: { siteId: site.id, type: 'Unplanned' } }, { table: 'solutions', filter: { ids: optionIds } }, { table: 'sites', filter: { siteId: site.id } }, { table: 'equipment', filter: { siteId: site.id } }, ...costs.map(c => c.source)] }
  })
  if (optionIds.includes('O1') && sites.length) {
    const platform = data.solutions.find(s => s.id === 'O2')
    if (!platform) throw new Error('Missing platform prerequisite O2.')
    addCost([], 'organization:O2', 'Organization platform (once)', platform.setupUsd, platform.annualUsd, platform.installHours, { table: 'solutions', filter: { ids: ['O2'] } })
  }
  const sum = key => perSite.reduce((a, s) => a + s[key], 0)
  const setupUsd = allCosts.reduce((a, c) => a + c.setupUsd, 0)
  const annualUsd = allCosts.reduce((a, c) => a + c.annualUsd, 0)
  const yearOneCostUsd = setupUsd + annualUsd
  return { ...input, perSite, costs: allCosts, avoidedHours: sum('avoidedHours'), avoidedMarginUsd: sum('avoidedMarginUsd'),
    yearOneBenefitUsd: sum('yearOneBenefitUsd'), setupUsd, annualUsd, yearOneCostUsd,
    yearOneReturn: yearOneCostUsd ? sum('yearOneBenefitUsd') / yearOneCostUsd : null,
    fullYearBenefitCostRatio: yearOneCostUsd ? sum('avoidedMarginUsd') / yearOneCostUsd : null,
    yearOneNetUsd: sum('yearOneBenefitUsd') - yearOneCostUsd,
    yearOneNetRoi: yearOneCostUsd ? (sum('yearOneBenefitUsd') - yearOneCostUsd) / yearOneCostUsd : null,
    resourceHours: allCosts.reduce((a, c) => a + c.hours, 0), organizationHours: allCosts.filter(c => c.key.startsWith('organization:')).reduce((a, c) => a + c.hours, 0),
    plannedOutageHours: sum('plannedOutageHours'), sources: perSite.flatMap(s => s.sources).concat(allCosts.map(c => c.source)),
    assumptions: ['Base Solutions fractions shorten unplanned downtime; failures are not prevented.', 'Stock sensitivity scales O4 linearly from 0 to the base effect at 90% fill, capped at base. This is a what-if assumption, not a fitted relationship.', 'Adoption scales O1 fractions linearly. Costs stay fully budgeted.', 'Year-one benefit starts after the later of deployment month and the longest selected option lead time. Annual costs are charged for a full year.', 'Protected repair time is never reduced. O5 adds planned outage hours, shown separately.'] }
}
