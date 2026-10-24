import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../app/DataContext.jsx'
import { useCurrentUser } from '../../domain/auth.js'
import { useAsOf, setReplayDate } from '../../domain/clock.js'
import { activeWarnings, likelyIssueFor } from '../../domain/earlyWarning.js'
import { ACTIONS, can } from '../../domain/permissions.js'
import { likelyPartFor, stockAt, stockElsewhere, usePartsRequests } from '../../domain/partsRequests.js'
import { acknowledge, flagFalseAlarm, stagePart, recordRaisedWarnings, useWarningDecisions, setWarningsData } from '../../domain/warnings.js'
import { resolveSource } from '../../domain/sources.js'
import { PageHeader, Banner, EmptyState, ConfidenceBadge, ReasonDialog, Sourced, SampleDataTag, StatusBadge, PermissionNote } from '../../ui/index.jsx'
import './early-warning.css'
const day = 86400000
const endOfDay = date => Date.parse(`${date}T23:59:59.999Z`)
const fmt = number => number == null ? 'unknown' : Number(number).toFixed(1)

function demoReplayDate(data) {
  const event = data?.events?.filter(e => e.assetId === 'A010' && e.cause === 'Bearing wear').sort((a,b) => a.startUtc.localeCompare(b.startUtc))[0]
  const warnings = data?.earlyWarning?.alerts?.filter(a => a.assetId === 'A010' && a.precededEventId === event?.id).sort((a,b) => a.date.localeCompare(b.date)) || []
  return warnings[0]?.date || '2025-01-07'
}
function Trend({ readings, field, normal, threshold, date, label, unit }) {
  const start = endOfDay(date) - 14 * day
  const rows = readings.filter(r => Date.parse(r.observedUtc) > start && Date.parse(r.observedUtc) <= endOfDay(date))
  const usable = r => r.quality === 'Valid' && r[field] != null && Date.parse(r.receivedUtc) <= endOfDay(date)
  const values = rows.filter(usable).map(r => r[field])
  if (normal == null || !values.length) return <p>{label}: No valid received readings in this window.</p>
  const min = Math.min(...values, normal, threshold) * 0.9; const max = Math.max(...values, normal, threshold) * 1.1
  const y = v => 105 - ((v-min)/(max-min || 1)) * 85
  const x = r => 12 + ((Date.parse(r.observedUtc)-start)/(14*day))*300
  const path = rows.map((r,i) => !usable(r) ? '' : `${i > 0 && usable(rows[i-1]) && Date.parse(r.observedUtc)-Date.parse(rows[i-1].observedUtc)<=day*1.1 ? 'L' : 'M'}${x(r).toFixed(1)},${y(r[field]).toFixed(1)}`).join(' ')
  return <figure className="early-warning-trend"><figcaption>{label} ({unit}) · last 14 days</figcaption><svg viewBox="0 0 330 125" role="img" aria-label={`${label} readings with normal ${fmt(normal)} and review threshold ${fmt(threshold)} ${unit}`}><line x1="10" x2="320" y1={y(normal)} y2={y(normal)} className="early-warning-normal"/><line x1="10" x2="320" y1={y(threshold)} y2={y(threshold)} className="early-warning-threshold"/><path d={path} fill="none" className="early-warning-line"/>{rows.filter(usable).map(r=><circle key={r.date} cx={x(r)} cy={y(r[field])} r="2.5"><title>{r.date}: {r[field]} {unit}</title></circle>)}</svg><small>Normal {fmt(normal)} · review threshold {fmt(threshold)}. Gaps indicate unavailable readings.</small></figure>
}
function WarningCard({ alert, data, date, decision, user, act }) {
  const asset = data.equipment.find(a => a.id === alert.assetId)
  const readings = data.readings?.[alert.assetId] || []
  const issue = likelyIssueFor({ ...asset, history: data.events.filter(e=>e.assetId===asset.id) }, alert)
  const part = likelyPartFor(asset, issue)
  const stock = part && stockAt(alert.siteId, part.partId)
  const alternatives = part ? stockElsewhere(part.partId, alert.siteId) : []
  const [fromSiteId, setFromSiteId] = useState('')
  const quality = data.dataQuality?.bySite?.[alert.siteId]
  const reading = readings.find(r=>r.date === alert.date)
  const editable = !['staged','falseAlarm'].includes(decision?.status)
  const raisedDays = Math.max(0, Math.floor((endOfDay(date) - Date.parse(reading?.observedUtc || alert.date))/day))
  const rule = data.earlyWarning.rule
  return <article className="panel early-warning-card">
    <header><div><h2>{asset.id} · {asset.siteName}</h2><p>{asset.type}</p></div><StatusBadge status={decision?.status === 'staged' ? 'ready' : decision?.status === 'falseAlarm' ? 'unknown' : 'warning'}>{decision?.status === 'staged' ? 'Part requested' : decision?.status === 'falseAlarm' ? 'Reviewed: false alarm' : decision?.status === 'acknowledged' ? 'Acknowledged' : 'Needs review'}</StatusBadge></header>
    <h3>Likely {issue.toLowerCase()} issue</h3><p>Planning suggestion based on prior history; confirm by inspection.</p>
    <p className="early-warning-trigger">{alert.trigger !== 'temperature' && <>Vibration {fmt(alert.vib)} mm/s ({fmt(alert.vibRatio)}× normal). </>}{alert.trigger !== 'vibration' && <>Temperature {fmt(alert.tempDeltaC)} °C above normal. </>}</p>
    <div className="early-warning-meta"><Sourced source={{table:'readings',filter:{assetId:asset.id,ids:[alert.id]},label:`${asset.id} trigger reading`}} resolve={s=>resolveSource(data,s)}>Observed {alert.date}</Sourced><span>{raisedDays} day{raisedDays===1?'':'s'} ago in replay</span><span>Receipt lag: {fmt(reading?.lagHours)} h</span></div>
    {quality && (quality.missingPct > 0 || quality.latePct > 0) && <div className="early-warning-confidence"><ConfidenceBadge siteId={alert.siteId} {...quality}/><span>{fmt(quality.missingPct)}% missing; {quality.late > 0 ? <>delayed readings average {fmt(quality.avgLateHours)} h. A warning may arrive late.</> : <>no delayed readings recorded.</>}</span></div>}
    <div className="early-warning-charts"><Trend readings={readings} date={date} field="vib" normal={asset.vibNormal} threshold={asset.vibNormal*rule.vibMultiplier} label="Vibration" unit="mm/s"/><Trend readings={readings} date={date} field="temp" normal={asset.tempNormal} threshold={asset.tempNormal+rule.tempDeltaC} label="Temperature" unit="°C"/></div>
    <div className="early-warning-stock"><SampleDataTag/><strong>{part?.partName || 'Part unknown'}</strong><StatusBadge status={stock?.available>0?'ok':'warning'}>{stock?.available>0 ? `Available locally (${stock.available})` : 'Not on hand'}</StatusBadge>{alternatives.map(s=><small key={s.siteId}>Available at {s.siteName}: {s.available}; transfer ETA unknown</small>)}</div>
    {decision?.requestId && <Banner variant="success">Request {decision.requestId} created. Inventory changes only on receipt. <a href="#/reorders">Open parts queue</a></Banner>}
    {decision?.reason && <p className="early-warning-review">{decision.by?.name}: {decision.reason}</p>}
    <div className="early-warning-actions">
      {editable && can(user,ACTIONS.ACK_WARNING,{siteId:alert.siteId}) && !decision?.status && <button onClick={()=>act(()=>acknowledge(user,alert.id))}>Acknowledge</button>}
      {editable && can(user,ACTIONS.FLAG_FALSE_ALARM,{siteId:alert.siteId}) && <button onClick={()=>act(null,alert.id)}>Flag false alarm</button>}
      {editable && stock?.available===0 && can(user,ACTIONS.STAGE_PART,{siteId:alert.siteId}) && <><label>Parts source<select value={fromSiteId} onChange={e=>setFromSiteId(e.target.value)}><option value="">Rush reorder</option>{alternatives.filter(s=>can(user,ACTIONS.STAGE_PART,{siteId:s.siteId})).map(s=><option key={s.siteId} value={s.siteId}>Transfer from {s.siteName} ({s.available})</option>)}</select></label><button className="btn-primary" onClick={()=>act(()=>stagePart(user,alert,{fromSiteId:fromSiteId || undefined}))}>Stage part</button></>}
      {!can(user,ACTIONS.ACK_WARNING,{siteId:alert.siteId}) && !can(user,ACTIONS.STAGE_PART,{siteId:alert.siteId}) && <PermissionNote/>}
    </div>
  </article>
}
export default function Screen() {
  const data = useData(); const user = useCurrentUser(); const asOf = useAsOf(); const decisions = useWarningDecisions()
  usePartsRequests()
  const [playing,setPlaying] = useState(false); const [error,setError] = useState(''); const [reviewId,setReviewId] = useState(null)
  const [siteId,setSiteId] = useState('all')
  const date = asOf.startsWith('2025-') ? asOf : demoReplayDate(data)
  const warnings = useMemo(()=>activeWarnings(data,date),[data,date])
  useEffect(()=>{setWarningsData(data);recordRaisedWarnings(warnings)},[data,warnings])
  useEffect(()=>{if(playing){const id=setInterval(()=>{const next=new Date(endOfDay(date)+1).toISOString().slice(0,10);if(next>'2025-12-31')setPlaying(false);else setReplayDate(next)},1200);return()=>clearInterval(id)}},[playing,date])
  function act(fn,id){setError('');if(id){setReviewId(id);return}try{fn()}catch(e){setError(e.message)}}
  // One card per asset. A decision-bearing alert remains visible rather than losing its request when another daily alert arrives.
  const byAsset = new Map()
  for(const a of [...warnings].sort((a,b)=>b.date.localeCompare(a.date))){if(!byAsset.has(a.assetId))byAsset.set(a.assetId,a);if(decisions[a.id]?.status==='staged')byAsset.set(a.assetId,a)}
  const cards = [...byAsset.values()].filter(a=>siteId==='all'||a.siteId===siteId).sort((a,b)=>(a.assetId==='A010'?-1:b.assetId==='A010'?1:a.assetId.localeCompare(b.assetId)))
  const reviewed = Object.entries(decisions).filter(([id,s])=>s.status==='falseAlarm' && !cards.some(a=>a.id===id)).map(([id])=>data.earlyWarning.alerts.find(a=>a.id===id)).filter(a=>a && (siteId==='all'||a.siteId===siteId) && a.date<=date)
  const summary = data.earlyWarning.summary
  const mechanicalIds = [...new Set(data.earlyWarning.alerts.map(a=>a.precededEventId).filter(Boolean))]
  return <div className="page-content early-warning-screen"><PageHeader title="Early warning" subtitle="Review historical mechanical signals and prepare replacement parts."/>
    <Banner>Replaying 2025 readings · as of {date} (end of day UTC). Only readings received by this date can trigger warnings. Historical HSE snapshot and sample stock remain separate.</Banner>
    <section className="panel early-warning-controls"><label>Replay date<input type="date" min="2025-01-01" max="2025-12-31" value={date} onChange={e=>{if(e.target.value>='2025-01-01'&&e.target.value<='2025-12-31')setReplayDate(e.target.value)}}/></label><label className="early-warning-scrubber">2025 timeline<input type="range" aria-label="2025 replay timeline" min="0" max="364" value={Math.floor((Date.parse(date)-Date.parse('2025-01-01'))/day)} onChange={e=>setReplayDate(new Date(Date.parse('2025-01-01')+Number(e.target.value)*day).toISOString().slice(0,10))}/></label><button onClick={()=>setPlaying(!playing)}>{playing?'Pause':'Play'}</button><button onClick={()=>{setPlaying(false);setReplayDate(demoReplayDate(data))}}>A010 before bearing stop</button><label>Site<select value={siteId} onChange={e=>setSiteId(e.target.value)}><option value="all">All sites</option>{data.sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></section>
    {error&&<Banner variant="danger">{error}</Banner>}
    <section className="panel early-warning-evidence"><h2>Retrospective evidence</h2><p><Sourced source={{table:'readings',filter:{ids:data.earlyWarning.alerts.map(a=>a.id)},label:'Threshold-crossing readings'}} resolve={s=>resolveSource(data,s)}>{summary.alerts} alert readings</Sourced> were recorded in 2025. <Sourced source={{table:'events',filter:{ids:mechanicalIds},label:'Matched mechanical events'}} resolve={s=>resolveSource(data,s)}>{mechanicalIds.length} bearing and seal events</Sourced> had a received warning before the stop. {summary.falseAlarms} alert readings were late or unmatched. This is retrospective synthetic-data evidence, not validated predictive accuracy.</p><p>Rules: vibration ≥ {data.earlyWarning.rule.vibMultiplier}× normal OR temperature ≥ normal + {data.earlyWarning.rule.tempDeltaC} °C, valid running readings only, {data.earlyWarning.rule.lookbackDays}-day window. Does not cover electrical trips, process upsets, or unknown causes.</p></section>
    <h2>Equipment for review ({cards.filter(a=>decisions[a.id]?.status!=='falseAlarm').length})</h2><div className="early-warning-grid">{cards.filter(a=>decisions[a.id]?.status!=='falseAlarm').map(alert=><WarningCard key={alert.id} {...{alert,data,date,user,act}} decision={decisions[alert.id]}/>)}</div>
    {!cards.some(a=>decisions[a.id]?.status!=='falseAlarm')&&<EmptyState title="No active warnings" description="No received readings cross the rule in this replay window for the selected site."/>}
    <h2>Reviewed warnings</h2><div className="early-warning-grid">{[...cards.filter(a=>decisions[a.id]?.status==='falseAlarm'),...reviewed].map(alert=><WarningCard key={alert.id} {...{alert,data,date,user,act}} decision={decisions[alert.id]}/>)}</div>{!reviewed.length&&!cards.some(a=>decisions[a.id]?.status==='falseAlarm')&&<p>No false-alarm reviews recorded.</p>}
    <ReasonDialog open={Boolean(reviewId)} title="Review warning as false alarm" onClose={()=>setReviewId(null)} onConfirm={reason=>{act(()=>flagFalseAlarm(user,reviewId,reason));setReviewId(null)}}/>
  </div>
}
