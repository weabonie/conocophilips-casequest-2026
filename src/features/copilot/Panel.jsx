import { useEffect, useRef, useState } from 'react'
import { MessageSquare, ArrowUp, Sparkles } from 'lucide-react'
import { useData } from '../../app/DataContext.jsx'
import { useCurrentUser } from '../../domain/auth.js'
import { answerCopilot, REHEARSED_QUESTIONS } from '../../domain/copilotTools.js'
import { logActivity, EVENT_TYPES } from '../../domain/activityLog.js'
import { Dialog, Sourced } from '../../ui/index.jsx'
import './copilot.css'

function CopilotSession({ user, data }) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const bottom = useRef(null)
  useEffect(() => { const reset = () => { setMessages([]); setQuestion(''); setError('') }; window.addEventListener('cq-demo-reset', reset); return () => window.removeEventListener('cq-demo-reset', reset) }, [])
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }) }, [messages])
  function ask(value) {
    const answer = answerCopilot({ data, user, question: value })
    setError('')
    if (answer.kind === 'refused') {
      try { logActivity(user, { type: EVENT_TYPES.COPILOT_REFUSED, reason: value.trim().slice(0, 1000), meta: { boundary: 'Copilot is read-only' } }) }
      catch { setError('The refusal could not be saved to local activity history. No action was performed.') }
    }
    setMessages(previous => [...previous.slice(-11), { question: value.trim(), ...answer }])
    setQuestion('')
  }
  return <>
    <button className="cq-copilot-launch" onClick={() => setOpen(true)} aria-label="Open Copilot"><MessageSquare size={18} aria-hidden="true" /><span>Ask Copilot</span></button>
    <Dialog open={open} title="Operations Copilot" onClose={() => setOpen(false)}>
      <div className="cq-copilot">
        <div className="cq-copilot-mode"><span><Sparkles size={14} aria-hidden="true" /> Offline answers</span><small>Read-only · {user.role.replaceAll('_', ' ')}</small></div>
        <p className="cq-copilot-intro">Ask about the evidence behind your planning decisions. Every answer uses only the sites assigned to your demo role.</p>
        <div className="cq-copilot-prompts" aria-label="Suggested questions">{REHEARSED_QUESTIONS.map(prompt => <button key={prompt} onClick={() => ask(prompt)}>{prompt}</button>)}</div>
        <div className="cq-copilot-messages" aria-live="polite" aria-relevant="additions" role="log" aria-label="Copilot conversation">
          {!messages.length && <p className="cq-copilot-empty">Choose a suggested question or write your own. Live open-ended answers are unavailable; no external model receives your data.</p>}
          {messages.map((message, index) => <article className="cq-copilot-answer" key={`${index}-${message.question}`}>
            <h3>{message.question}</h3><span className={`cq-copilot-kind cq-copilot-${message.kind}`}>{message.kind === 'refused' ? 'Human decision required' : message.kind === 'restricted' ? 'Outside assigned scope' : message.kind === 'unavailable' ? 'Data not available' : 'Dataset answer'}</span>
            <p>{message.text}</p>
            {message.sources.length > 0 && <div className="cq-copilot-sources" aria-label="Answer sources">{message.sources.map((source, sourceIndex) => <Sourced key={sourceIndex} source={source}>{source.label} · {source.rows.length} records</Sourced>)}</div>}
            {message.links.length > 0 && <div className="cq-copilot-links">{message.links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label} →</a>)}</div>}
          </article>)}<div ref={bottom} />
        </div>
        {error && <p role="alert" className="cq-copilot-error">{error}</p>}
        <form className="cq-copilot-form" onSubmit={event => { event.preventDefault(); if (question.trim()) ask(question) }}>
          <label className="sr-only" htmlFor="copilot-question">Ask Copilot</label><input id="copilot-question" autoComplete="off" maxLength={1000} value={question} placeholder="Ask about exposure, parts or HSE…" onChange={event => setQuestion(event.target.value)} /><button type="submit" disabled={!question.trim()} aria-label="Send question"><ArrowUp size={18} aria-hidden="true" /></button>
        </form>
        <small className="cq-copilot-footer">Historical data and demo state. No purchasing, dispatch or HSE authority.</small>
      </div>
    </Dialog>
  </>
}
export default function CopilotPanel() { const data = useData(); const user = useCurrentUser(); return user && data ? <CopilotSession key={`${user.id}:${user.role}`} user={user} data={data} /> : null }
