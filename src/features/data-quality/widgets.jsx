import { useData } from '../../app/DataContext'
import { ConfidenceBadge, Sourced, EmptyState } from '../../ui'
import { qualitySites, readingSource } from './evidence'
import './data-quality.css'

export function SiteConfidenceList({ data: suppliedData, siteId, limit }) {
  const contextData = useData()
  const data = suppliedData || contextData
  const sites = qualitySites(data).filter(site => !siteId || site.id === siteId).slice(0, limit)
  if (!sites.length) return <EmptyState title="Reading confidence unavailable" description="No per-site quality report is available." />
  return <ul className="dq-confidence-list">{sites.map(site => <li key={site.id}><a href={`#/sites/${site.id}`}>{site.name}</a><Sourced source={readingSource(data, site.id)}><ConfidenceBadge siteId={site.id} missingPct={site.quality.missingPct} latePct={site.quality.latePct} label={`${site.quality.missingPct.toFixed(1)}% missing · ${site.quality.latePct.toFixed(1)}% late`} /></Sourced></li>)}</ul>
}
export default SiteConfidenceList
