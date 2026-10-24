import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useCurrentUser } from '../../domain/auth.js'
import { markNotificationRead } from '../../domain/notifications.js'
import { useNotifications } from './useNotifications.js'
import { Dialog } from '../../ui'
import './activity.css'

export default function NotificationBell() {
  const [open, setOpen] = useState(false); const [error, setError] = useState(''); const user = useCurrentUser(); const notes = useNotifications()
  const unread = notes.filter(note => !note.read).length
  function read(id) { try { markNotificationRead(user, id); setError('') } catch (err) { setError(err.message) } }
  return <><button className="activity-bell" aria-label={`Notifications, ${unread} unread`} onClick={() => setOpen(true)}><Bell size={17} />{unread > 0 && <span>{unread}</span>}</button><Dialog open={open} title="Notifications" onClose={() => setOpen(false)}><p className="activity-muted">In-app prototype reminders. No push notifications or emails are sent.</p>{error && <p role="alert">{error}</p>}{!notes.length ? <p>No notifications for your role and sites.</p> : <ul className="activity-notifications">{notes.map(note => <li key={note.id} className={note.read ? 'is-read' : ''}><div><strong>{note.title}</strong><p>{note.detail}</p><small>{note.siteId || 'Program'} · {new Date(note.at).toLocaleString()}</small>{note.emailPreview && <small className="activity-preview-label">Email preview only · not sent</small>}</div><div className="activity-note-actions"><a href={note.route} onClick={() => { read(note.id); setOpen(false) }}>Review</a>{note.read ? <span>Read</span> : <button onClick={() => read(note.id)}>Mark read</button>}</div></li>)}</ul>}<a href="#/activity" onClick={() => setOpen(false)}>View activity log</a></Dialog></>
}
