const ROLE_ALIASES = {
  technician: 'technician',
  dispatcher: 'technician',
  'technician / dispatcher': 'technician',
  planner: 'planner',
  'maintenance planner': 'planner',
  hse_supervisor: 'hse_supervisor',
  'hse supervisor': 'hse_supervisor',
  'site hse supervisor': 'hse_supervisor',
  site_lead: 'site_lead',
  'site lead': 'site_lead',
  ops_manager: 'ops_manager',
  'ops manager': 'ops_manager',
  'operations manager': 'ops_manager',
  leadership: 'ops_manager',
}

const HOME_CONFIG = {
  technician: {
    eyebrow: 'Field operations',
    title: 'Ready the next safe dispatch',
    description: 'Check the part, site context, and safety line before the crew rolls.',
    action: { label: 'Run a pre-dispatch check', href: '#/dispatch' },
    widgetKeys: ['dispatch', 'earlyWarning'],
  },
  planner: {
    eyebrow: 'Materials control',
    title: 'Keep inventory ahead of demand',
    description: 'Review warnings, protect the reorder queue, and close stock exceptions.',
    action: { label: 'Open reorder queue', href: '#/reorders' },
    widgetKeys: ['earlyWarning', 'reorders'],
  },
  hse_supervisor: {
    eyebrow: 'Safety control',
    title: 'Clear the blockers before go-live',
    description: 'Verify the actions in your site scope and release only when every blocker is closed.',
    action: { label: 'Open HSE gate', href: '#/hse' },
    widgetKeys: ['hse'],
  },
  site_lead: {
    eyebrow: 'Site readiness',
    title: 'Know whether your site is ready',
    description: 'See site status, warnings, and the releases that need attention today.',
    action: { label: 'View site status', href: '#/overview' },
    widgetKeys: ['siteStatus', 'hse', 'earlyWarning'],
  },
  ops_manager: {
    eyebrow: 'Program control',
    title: 'See where the program needs a decision',
    description: 'Review performance, safety status, and the next expansion scenario in one place.',
    action: { label: 'Open operations overview', href: '#/overview' },
    widgetKeys: ['overview', 'siteStatus', 'hse', 'simulator'],
  },
}

export function normalizeRole(role) {
  if (!role) return null
  const value = String(role).trim().toLowerCase().replace(/\s+/g, ' ')
  return ROLE_ALIASES[value] || value
}

export function allowedSiteIds(user) {
  if (!user || user.siteIds === 'all' || user.siteIds == null) return null
  return new Set(Array.isArray(user.siteIds) ? user.siteIds : [user.siteIds])
}

function withSiteContext(href, siteId) {
  if (!siteId || !href || href.includes('?')) return href
  return `${href}?siteId=${encodeURIComponent(siteId)}`
}

export function scopedHref(href, user, siteId) {
  const scope = allowedSiteIds(user)
  if (!scope) return href
  if (siteId) return scope.has(siteId) ? withSiteContext(href, siteId) : href
  return `${href}${href.includes('?') ? '&' : '?'}siteIds=${encodeURIComponent([...scope].join(','))}`
}

export function filterDataToUserScope(data, user) {
  const scope = allowedSiteIds(user)
  if (!data || !scope) return data

  const sites = (data.sites || []).filter((site) => scope.has(site.id))
  const siteIds = new Set(sites.map((site) => site.id))
  const assetIds = new Set([
    ...sites.flatMap(site => (site.assets || []).map(asset => asset.id || asset.assetId)),
    ...(data.equipment || []).filter(asset => siteIds.has(asset.siteId)).map(asset => asset.id || asset.assetId),
  ])
  const equipment = (data.equipment || []).filter((asset) => {
    return siteIds.has(asset.siteId) || assetIds.has(asset.id || asset.assetId)
  })

  const scoped = { ...data, sites, equipment }

  if (Array.isArray(data.events)) {
    scoped.events = data.events.filter((event) => siteIds.has(event.siteId) || assetIds.has(event.assetId))
  }
  if (Array.isArray(data.hseActions)) {
    scoped.hseActions = data.hseActions.filter((action) => siteIds.has(action.siteId))
  }
  if (data.readings && typeof data.readings === 'object') {
    scoped.readings = Object.fromEntries(
      Object.entries(data.readings).filter(([assetId]) => assetIds.has(assetId))
    )
  }
  if (data.dataQuality?.bySite) {
    scoped.dataQuality = {
      ...data.dataQuality,
      bySite: Object.fromEntries(
        Object.entries(data.dataQuality.bySite).filter(([siteId]) => siteIds.has(siteId))
      ),
    }
  }
  if (data.earlyWarning) {
    scoped.earlyWarning = {
      ...data.earlyWarning,
      alerts: (data.earlyWarning.alerts || []).filter(
        (alert) => siteIds.has(alert.siteId) || assetIds.has(alert.assetId)
      ),
    }
  }

  return scoped
}

export function getRoleHomeModel(user, data) {
  const role = normalizeRole(user?.role) || 'ops_manager'
  const config = HOME_CONFIG[role] || HOME_CONFIG.ops_manager
  const scope = allowedSiteIds(user)
  const sites = (data?.sites || []).filter((site) => !scope || scope.has(site.id))
  const siteId = sites.length === 1 ? sites[0].id : null

  return {
    role,
    ...config,
    action: { ...config.action, href: scopedHref(config.action.href, user, siteId) },
    scope: {
      siteIds: sites.map((site) => site.id),
      siteNames: sites.map((site) => site.name),
      isScoped: Boolean(scope),
      label: scope ? sites.map((site) => site.name).join(', ') || 'No sites in scope' : 'All sites',
    },
  }
}

export function getWidgetComponent(widgetComponents, key) {
  const names = {
    earlyWarning: 'EarlyWarningSummary',
    reorders: 'ReorderQueueSummary',
    dispatch: 'DispatchLauncher',
    hse: 'HseGateSummary',
    overview: 'KpiStrip',
    siteStatus: 'SiteStatusCards',
    simulator: 'ImpactSummary',
    activity: 'ActivityFeedMini',
    dataQuality: 'SiteConfidenceList',
  }
  return widgetComponents?.[key] || widgetComponents?.[names[key]] || null
}

export { HOME_CONFIG }
