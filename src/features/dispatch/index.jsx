import { useState } from 'react'
import { useData } from '../../app/DataContext.jsx'
import { useCurrentUser } from '../../domain/auth.js'
import { can, ACTIONS, assertCan } from '../../domain/permissions.js'
import { useSiteGateStatus } from '../../domain/hseGate.js'
import { likelyPartFor, stockAt, stockElsewhere, usePartsRequests, createDispatchReorder, createDispatchTransfer } from '../../domain/partsRequests.js'
import { logActivity, EVENT_TYPES } from '../../domain/activityLog.js'
import { resolveSource } from '../../domain/sources.js'
import { PageHeader, Banner, PermissionNote, SampleDataTag, StatusBadge, Sourced } from '../../ui'
import { evaluateDispatch } from './evaluate.js'
import './dispatch.css'

const CAUSES = ['Bearing wear', 'Seal leak', 'Electrical trip', 'Process upset', 'Unknown']
export default function Screen() {
  const data = useData(); const user = useCurrentUser()
  const [search, setSearch] = useState(''); const [assetId, setAssetId] = useState(''); const [cause, setCause] = useState('Bearing wear'); const [certified, setCertified] = useState(false)
  const [checkedKey, setCheckedKey] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState('')
  const asset = data?.equipment?.find(item => item.id === assetId)
  const site = data?.sites?.find(item => item.id === asset?.siteId)
  const gateStatus = useSiteGateStatus(asset?.siteId)
  const requests = usePartsRequests()
  const permitted = can(user, ACTIONS.RUN_DISPATCH_CHECK, { siteId: asset?.siteId })
  const key = `${user?.id}:${assetId}:${cause}:${certified}`
  const part = asset ? likelyPartFor(asset, cause) : null
  const stock = part ? stockAt(asset.siteId, part.partId) : null
  const alternatives = part ? stockElsewhere(part.partId, asset.siteId) : []
  const activeRequest = requests.find(r => r.assetId === assetId && r.partId === part?.partId && !['Received', 'Rejected'].includes(r.status))
  const result = asset && permitted && checkedKey === key ? evaluateDispatch({ user, asset, part, stock, alternatives, gateStatus, certified }) : null
  const assets = (data?.equipment || []).filter(item => `${item.id} ${item.type} ${item.siteName}`.toLowerCase().includes(search.toLowerCase()))
  const change = fn => { fn(); setError(''); setMessage(''); setCheckedKey('') }
  function runCheck() {
    try {
      assertCan(user, ACTIONS.RUN_DISPATCH_CHECK, { siteId: asset?.siteId })
      const evaluation = evaluateDispatch({ user, asset, part, stock, alternatives, gateStatus, certified })
      if (evaluation.parts === 'shortage' && !activeRequest) {
        const request = createDispatchReorder(user, { siteId: asset.siteId, assetId: asset.id, partId: part.partId, qty: 1, reason: `Pre-dispatch ${cause.toLowerCase()} review: no available sample stock.` })
        setMessage(`Rush proposal ${request.id} saved for planner review. No purchase has been placed.`)
      } else setMessage('')
      logActivity(user, { type: EVENT_TYPES.DISPATCH_CHECKED, siteId: asset.siteId, assetId: asset.id, reason: evaluation.title, meta: { cause, partId: part?.partId || null, parts: evaluation.parts, gateStatus, sampleCertificationConfirmed: certified, supervisorReviewReady: evaluation.ready } })
      setCheckedKey(key); setError('')
    } catch (err) { setError(err.message); setCheckedKey('') }
  }
  function requestTransfer(source) {
    try {
      const request = createDispatchTransfer(user, { assetId: asset.id, partId: part.partId, fromSiteId: source.siteId, toSiteId: asset.siteId, qty: 1, reason: `Pre-dispatch sample stock transfer for ${asset.id}; ${cause.toLowerCase()} review.` })
      setMessage(`Transfer ${request.id} requested from ${source.siteName}. Planner approval and arrival are still required.`); setError('')
    } catch (err) { setError(err.message) }
  }
  return <div className="page-content dispatch-page">
    <PageHeader title="Pre-dispatch check" subtitle="Check parts, the site pilot gate and technician readiness before planning a crew visit." />
    <div className="dispatch-layout"><section className="panel dispatch-form"><h2>Check an asset</h2>
      <label htmlFor="dispatch-search">Find equipment<input id="dispatch-search" type="search" placeholder="Search asset ID, site or equipment" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label htmlFor="dispatch-asset">Equipment<select id="dispatch-asset" value={assetId} onChange={e => change(() => { setAssetId(e.target.value); setCertified(false) })}><option value="">Select equipment</option>{assets.map(item => <option key={item.id} value={item.id}>{item.id} · {item.siteName} · {item.type}</option>)}</select></label>
      {!assets.length && <p>No matching equipment. Try another search.</p>}
      <label htmlFor="dispatch-cause">Reported symptom or cause<select id="dispatch-cause" value={cause} onChange={e => change(() => setCause(e.target.value))}>{CAUSES.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="dispatch-checkbox"><input type="checkbox" checked={certified} onChange={e => change(() => setCertified(e.target.checked))} /><span>Suitably certified technician confirmed<small>Sample planning input. The workbook has no certification roster.</small></span></label>
      {permitted ? <button className="primary-button dispatch-run" disabled={!asset} onClick={runCheck}>Run readiness check</button> : <PermissionNote>Only a technician, planner or site lead with access to this site can run this check.</PermissionNote>}
      {error && <p role="alert" className="dispatch-error">{error}</p>}
      <div className="dispatch-loto"><strong>Confirm LOTO and isolation before work begins.</strong><p>This check supports supervisor review. It does not issue a permit to work.</p></div>
    </section>
    <section className="dispatch-details" aria-live="polite">
      {!asset ? <div className="panel dispatch-card"><h2>Prepare before the crew travels</h2><p>Select equipment and the reported cause to check sample stock and pilot readiness.</p><p>Parts availability does not replace safety approval or technician qualification checks.</p></div> : <>
      <div className="panel dispatch-card"><div className="dispatch-card-heading"><div><h2>{asset.id} · {site?.name || asset.siteId}</h2><p>{asset.type}</p></div><StatusBadge status={gateStatus}>Pilot {gateStatus}</StatusBadge></div>
      <Sourced source={resolveSource(data, { table: 'equipment', filter: { assetId: asset.id }, label: `${asset.id} equipment source` })}>Workbook equipment record</Sourced>
      <hr /><SampleDataTag /><h3>{part?.partName || 'Part requirement unconfirmed'}</h3><p className="dispatch-muted">{part ? `${part.partId} · Suggested for review, not a confirmed diagnosis.` : 'This reported cause has no supported sample part mapping. Ask the planner to confirm requirements.'}</p>
      {part && <dl className="dispatch-stock"><div><dt>Required</dt><dd>1</dd></div><div><dt>On hand</dt><dd>{stock?.known === false ? 'unknown' : stock?.onHand ?? 'unknown'}</dd></div><div><dt>Reserved</dt><dd>{stock?.known === false ? 'unknown' : stock?.reserved ?? 'unknown'}</dd></div><div><dt>Available</dt><dd>{stock?.known === false ? 'unknown' : stock?.available ?? 'unknown'}</dd></div></dl>}
      </div>
      {result ? <div className={`dispatch-result dispatch-result-${result.variant}`} role="status"><h2>{result.title}</h2>{result.ready && <p>Part on hand at {site?.name}. All three planning checks are satisfied. Supervisor approval and field procedures still apply.</p>}{result.blockers.length > 0 && <ul>{result.blockers.map(item => <li key={item}>{item}</li>)}</ul>}{result.parts === 'shortage' && <p>Diagnosis-only visit may be considered by the supervisor. Repair readiness is blocked.</p>}{result.parts === 'transfer' && <div className="dispatch-alternatives">{alternatives.map(source => <div key={source.siteId}><strong>{source.siteName}: {source.available} available</strong><p>Estimated arrival: {source.etaHours == null ? 'unknown, confirm with planner' : `${source.etaHours} hours (sample)`}</p><button disabled={Boolean(activeRequest)} onClick={() => requestTransfer(source)}>{activeRequest ? 'Request already open' : `Request transfer from ${source.siteName}`}</button></div>)}</div>}</div> : <Banner>Run the check to record the current planning result.</Banner>}
      {activeRequest && <Banner variant="warn"><strong>{activeRequest.id} · {activeRequest.requestType} · {activeRequest.inTransit ? 'In transit' : activeRequest.status}</strong><p>Requested or approved stock is not available at this site until receipt is recorded.</p></Banner>}
      {message && <Banner>{message}</Banner>}
      {gateStatus === 'locked' && <p className="dispatch-hse-link"><a href="#/hse">Review open HSE actions and pilot release requirements</a></p>}
      <p className="dispatch-source">Sources: Assets and HSE_Actions workbook records. Stock and certification confirmation are sample planning inputs.</p>
      </>}
    </section></div>
  </div>
}
