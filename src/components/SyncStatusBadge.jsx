import { RefreshCw, Settings } from 'lucide-react'

function formatRelativeTime(isoString) {
  if (!isoString) return 'Not yet synced'
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diffSec < 10) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ago`
}

export default function SyncStatusBadge({
  syncStatus,
  lastSyncTime,
  syncError,
  onSyncNow,
  onOpenSettings,
}) {
  const isSyncing = syncStatus === 'syncing'
  const isError = syncStatus === 'error'
  const timeLabel = formatRelativeTime(lastSyncTime)

  return (
    <div className="sync-status-wrapper">
      {(isSyncing || isError || lastSyncTime) && <div
        className={`sync-badge ${syncStatus} ${isSyncing ? 'is-syncing' : ''}`}
        title={
          isError
            ? `Refresh failed: ${syncError}. Previously loaded data remains displayed.`
            : lastSyncTime ? `Data imported ${new Date(lastSyncTime).toLocaleString()}` : 'Refreshing data'
        }
      >
        <span className="sync-dot-container">
          {isSyncing ? (
            <RefreshCw size={11} className="sync-spinner-icon" />
          ) : isError ? (
            <span className="sync-dot dot-error" />
          ) : (
            <span className="sync-dot dot-live" />
          )}
        </span>

        <span className="sync-label">
          {isSyncing ? (
            'Refreshing…'
          ) : isError ? (
            'Refresh failed'
          ) : (
            <>
              Updated <small className="sync-time">{timeLabel}</small>
            </>
          )}
        </span>
      </div>}

      <button
        className="sync-action-btn"
        onClick={() => onSyncNow()}
        disabled={isSyncing}
        title="Refresh data"
        aria-label="Refresh data"
      >
        <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
      </button>

      <button
        className="sync-action-btn sync-settings-btn"
        onClick={onOpenSettings}
        title="Data settings"
        aria-label="Open data settings"
      >
        <Settings size={12} />
      </button>
    </div>
  )
}
