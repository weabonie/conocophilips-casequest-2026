import { useState } from 'react'
import { useData } from '../../app/DataContext.jsx'
import { useCurrentUser } from '../../domain/auth.js'
import { ACTIONS, can } from '../../domain/permissions.js'
import { usePartsRequests, createRushReorder, approveReorder, rejectReorder, editReorderQty, markReceived } from '../../domain/partsRequests.js'
import { useMinMax, saveMinMax, minMaxSuggestion, decideSuggestion } from '../../domain/minMax.js'
import { resolveSource } from '../../domain/sources.js'
import { PageHeader, SampleDataTag, PermissionNote, Sourced, Dialog } from '../../ui/index.jsx'
import PartsRequestsTable from '../../components/PartsRequestsTable.jsx'
import { reorderRecommendations, rankRequests, rankLeadTimeExposure } from './model.js'
import './reorders.css'
export default function Screen() {
  const data = useData()
  const user = useCurrentUser()
  const requests = usePartsRequests()
  const settings = useMinMax()
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const [ranking, setRanking] = useState('lead-time')
  const [leadDays, setLeadDays] = useState(3)
  if (!data) return null
  const recommendations = reorderRecommendations(data)
  const ranked = ranking === 'lead-time' ? rankLeadTimeExposure(recommendations, leadDays) : recommendations
  const act = fn => { try { fn(); setError(''); setNotice('Decision saved. Review the updated queue below.') } catch (e) { setError(e.message) } }
  return <div className="page-content reorder-workspace">
    <PageHeader title="Reorder queue" subtitle="Prioritize parts readiness using source-backed exposure and explicit lead-time assumptions. Planner approval records a prototype decision; receipt updates stock." />
    <SampleDataTag />
    {error && <p role="alert" className="cq-banner cq-banner-danger">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <PartsRequestsTable requests={rankRequests(requests, data)} onApprove={(id,note) => act(() => approveReorder(user,id,note))} onReject={(id,reason) => act(() => rejectReorder(user,id,reason))} onEditQty={(id,qty) => act(() => editReorderQty(user,id,qty))} onRecordReceipt={id => act(() => markReceived(user,id))} />
    <section className="panel"><div className="panel-heading"><div><h2>Replenishment recommendations</h2><p>{ranking === 'lead-time' ? 'Potential contribution loss if an asset stays stopped throughout the sample lead time. A010 ranks first; this is a conditional planning scenario, not a failure prediction.' : 'Historical parts-wait contribution loss. A011 ranks ahead of A012 and A010 on this measure.'}</p></div></div>
    <div className="reorder-ranking"><label>Rank recommendations<select value={ranking} onChange={e=>setRanking(e.target.value)}><option value="lead-time">Potential loss during lead time</option><option value="historical">Historical parts-wait loss</option></select></label>{ranking === 'lead-time' && <label>Sample lead time (days)<input type="number" min="0" max="90" step="1" value={leadDays} onChange={e=>setLeadDays(Math.min(90,Math.max(0,Number(e.target.value))))}/></label>}<small>Lead time is an editable assumption. Potential loss = historical contribution exposure per hour × 24 × lead days. It excludes failure probability and does not estimate purchasing savings.</small></div>
    <div className="table-scroll"><table><thead><tr><th>Asset / site</th><th>Suggested sample part</th><th>Stock / min / max</th><th>{ranking === 'lead-time' ? 'Scenario / historical exposure' : 'Historical exposure'}</th><th>Reason</th><th>Planner actions</th></tr></thead><tbody>{ranked.map(row => {
      const editable = can(user,ACTIONS.EDIT_MIN_MAX,{siteId:row.siteId})
      const suggestion = minMaxSuggestion(row.assetId,row.part.partId,row.siteId)
      const source = resolveSource(data,{table:'events',filter:{assetId:row.assetId,type:'Unplanned'},label:`${row.assetId}: historical unplanned events`})
      return <tr key={row.assetId}><td><strong>{row.assetId}</strong><br />{row.siteName}</td><td>{row.part.partName}<small>Suggested type; confirm fit before ordering.</small></td><td>{row.stock.available} available / {row.levels.min} / {row.levels.max}</td><td>{ranking === 'lead-time' && <><Sourced source={source}>{row.scenarioExposureUsd == null ? 'unknown' : `$${Math.round(row.scenarioExposureUsd).toLocaleString()}`} potential</Sourced><br/><small>Sample {leadDays}-day continuous stop</small></>}<Sourced source={source}>${Math.round(row.partsWaitUsd).toLocaleString()}</Sourced><br /><Sourced source={source}>{row.partsWaitHours.toFixed(1)} h waiting</Sourced></td><td>{row.reason}<br /><Sourced source={source}>{row.hourlyMarginUsd == null ? 'Hourly exposure unavailable' : `$${Math.round(row.hourlyMarginUsd).toLocaleString()}/h historical contribution exposure`}</Sourced></td><td>{editable ? <div className="reorder-actions"><button onClick={() => setEditing({...row,min:row.levels.min,max:row.levels.max})}>Edit min/max</button><button disabled={!row.qty} onClick={() => act(() => createRushReorder(user,{assetId:row.assetId,siteId:row.siteId,partId:row.part.partId,qty:row.qty,source:'min-breach',dedupeKey:`min:${row.assetId}:${row.part.partId}`,reason:row.reason}))}>Request {row.qty}</button>{suggestion && !settings.decisions[suggestion.id] && <details><summary>Minimum suggestion</summary><p>{suggestion.reason}</p><button onClick={() => act(() => decideSuggestion(user,suggestion,true))}>Accept minimum {suggestion.min}</button><button onClick={() => act(() => decideSuggestion(user,suggestion,false))}>Decline</button></details>}</div> : <PermissionNote />}</td></tr>
    })}</tbody></table></div></section>
    <Dialog open={Boolean(editing)} title="Planner min/max settings" onClose={() => setEditing(null)}>{editing && <form onSubmit={e => { e.preventDefault(); act(() => { saveMinMax(user,{assetId:editing.assetId,siteId:editing.siteId,partId:editing.part.partId,min:Number(editing.min),max:Number(editing.max)}); setEditing(null) }) }}><p>{editing.assetId} · {editing.part.partName} · Sample stock levels</p><label>Minimum<input type="number" min="0" step="1" required value={editing.min} onChange={e => setEditing({...editing,min:e.target.value})} /></label><label>Maximum<input type="number" min="0" step="1" required value={editing.max} onChange={e => setEditing({...editing,max:e.target.value})} /></label><button type="submit">Save settings</button></form>}</Dialog>
  </div>
}
