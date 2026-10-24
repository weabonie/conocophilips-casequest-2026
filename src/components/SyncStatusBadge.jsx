import { RefreshCw, Settings } from 'lucide-react'

export default function SyncStatusBadge({
  syncStatus,
  syncError,
  onSyncNow,
  onOpenSettings,
}) {
  const isSyncing = syncStatus === 'syncing'
  const isError = syncStatus === 'error'

  return (
    <div className="sync-status-wrapper">
      {(isSyncing || isError) && (
        <div
          className={`sync-badge ${syncStatus} ${isSyncing ? 'is-syncing' : ''}`}
          title={
            isError
              ? `Refresh failed: ${syncError}. Previously loaded data remains displayed.`
              : 'Refreshing data'
          }
        >
          <span className="sync-dot-container">
            {isSyncing ? (
              <RefreshCw size={11} className="sync-spinner-icon" />
            ) : (
              <span className="sync-dot dot-error" />
            )}
          </span>

          <span className="sync-label">
            {isSyncing ? 'Refreshing…' : 'Refresh failed'}
          </span>
        </div>
      )}

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
