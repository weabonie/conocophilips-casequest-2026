import { useActivity } from '../../domain/activityLog.js'
import { useCurrentUser } from '../../domain/auth.js'
import { filterActivity } from '../../domain/notifications.js'
import './activity.css'

export function ActivityFeedMini({ siteId, assetId, limit = 5 }) {
  const events = useActivity(); const user = useCurrentUser(); const visible = filterActivity(events, user, { siteId, assetId }).slice(0, limit)
  return <section className="panel activity-mini"><div className="activity-mini-heading"><h2>Recent activity</h2><a href="#/activity">View all</a></div>{!visible.length ? <p>No demo decisions recorded yet.</p> : <ol>{visible.map(event => <li key={event.id}><strong>{event.type.replaceAll('.', ' · ')}</strong><p>{event.actor?.name} · {event.assetId || event.siteId || 'Program'}</p><time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time></li>)}</ol>}</section>
}
