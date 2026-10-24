import { useEffect, useState } from 'react'
import { useData } from '../../app/DataContext.jsx'
import { useCurrentUser } from '../../domain/auth.js'
import { useActivity } from '../../domain/activityLog.js'
import { useAsOf } from '../../domain/clock.js'
import { usePartsRequests, likelyPartFor, stockAt } from '../../domain/partsRequests.js'
import { useWarningDecisions } from '../../domain/warnings.js'
import { useMinMax } from '../../domain/minMax.js'
import { loadInventory } from '../../utils/inventoryStorage.js'
import { deriveNotifications, useNotificationReads } from '../../domain/notifications.js'

export function useNotifications({ monthlyPreview = false } = {}) {
  const data = useData(); const user = useCurrentUser(); const events = useActivity(); const requests = usePartsRequests(); const asOf = useAsOf()
  useNotificationReads(); useWarningDecisions(); const minMax = useMinMax()
  const [now, setNow] = useState(() => new Date().toISOString())
  useEffect(() => { const timer = setInterval(() => setNow(new Date().toISOString()), 60000); return () => clearInterval(timer) }, [])
  const warningStock = {}
  for (const event of events) {
    if (event.type !== 'warning.raised') continue
    const alert = data?.earlyWarning?.alerts?.find(a => a.id === event.entityId)
    const asset = data?.equipment?.find(a => a.id === event.assetId)
    const part = alert && likelyPartFor(asset, alert.likelyIssue)
    if (part) { const stock = stockAt(event.siteId, part.partId); if (stock.known) warningStock[event.entityId] = stock.available > 0 }
  }
  const inventory = loadInventory()
  const minimums = new Map(inventory.map(row => [`${row.siteId}:${row.partId}`, { siteId: row.siteId, partId: row.partId, min: row.minStock }]))
  for (const [key, levels] of Object.entries(minMax.settings)) {
    const [assetId, partId] = key.split(':'); const asset = data?.equipment?.find(item => item.id === assetId)
    if (asset) minimums.set(`${asset.siteId}:${partId}`, { siteId: asset.siteId, partId, min: levels.min })
  }
  const minBreaches = [...minimums.values()].filter(row => { const stock = stockAt(row.siteId, row.partId); return stock.known && stock.available < row.min })
  return deriveNotifications({ events, requests, warningStock, minBreaches, hseActions: data?.hseActions, user, now, asOf, monthlyPreview })
}
