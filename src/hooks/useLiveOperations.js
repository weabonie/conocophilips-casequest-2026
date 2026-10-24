import { useState, useEffect, useCallback, useRef } from 'react'
import defaultData from '../data/operations.json'
import { PARSER_VERSION, parseCaseQuestWorkbook } from '../utils/excelParser.js'

const STORAGE_KEY_DATA = 'cq_live_operations_data'
const STORAGE_KEY_URL = 'cq_excel_url'
const STORAGE_KEY_INTERVAL = 'cq_sync_interval_ms'
const STORAGE_KEY_LAST_SYNC = 'cq_last_sync_time'

// Default to 2 minutes (120,000 ms) as selected by user
const DEFAULT_INTERVAL = 120000

export function useLiveOperations() {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_DATA)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.parserVersion === PARSER_VERSION && Array.isArray(parsed.sites)) {
          return parsed
        }
      }
    } catch {
      // Fallback
    }
    return defaultData
  })

  const [excelUrl, setExcelUrl] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEY_URL) ||
      import.meta.env.VITE_EXCEL_ONLINE_URL ||
      ''
    )
  })

  const [intervalMs, setIntervalMs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INTERVAL)
    return saved ? Number(saved) : DEFAULT_INTERVAL
  })

  const [isAutoSync, setIsAutoSync] = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'synced' | 'error' | 'local'
  const [syncError, setSyncError] = useState(null)
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || null
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [syncNotice, setSyncNotice] = useState(null)

  const isMountedRef = useRef(true)

  // Trigger sync against API
  const syncNow = useCallback(
    async (overrideUrl, isSilent = false) => {
      const targetUrl = overrideUrl !== undefined ? overrideUrl : excelUrl

      if (!isSilent) {
        setSyncStatus('syncing')
        setSyncError(null)
      }

      try {
        const res = await fetch('/api/sync-excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
        })

        if (!res.ok) {
          throw new Error(`API returned HTTP ${res.status}`)
        }

        const result = await res.json()

        if (!isMountedRef.current) return

        if (result.success && result.data) {
          setData(result.data)
          const nowStr = result.lastSyncTime || new Date().toISOString()
          setLastSyncTime(nowStr)
          setSyncStatus(result.source === 'local' && !targetUrl ? 'local' : 'synced')
          setSyncError(null)

          try {
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(result.data))
            localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowStr)
          } catch {
            // Storage quota warning
          }

          setSyncNotice({
            type: 'success',
            message: `Updated · ${result.data.sites?.length || 0} sites loaded`,
            timestamp: Date.now(),
          })
          setTimeout(() => setSyncNotice(null), 4000)
          return { success: true, data: result.data }
        } else {
          const errMsg = result.error || 'Failed to sync with Excel'
          setSyncStatus('error')
          setSyncError(errMsg)
          return { success: false, error: errMsg }
        }
      } catch (err) {
        if (!isMountedRef.current) return
        const errMsg = err.message || 'Network connection failed'
        setSyncStatus('error')
        setSyncError(errMsg)
        return { success: false, error: errMsg }
      }
    },
    [excelUrl]
  )

  // Direct client-side upload of a local .xlsx file
  const uploadLocalExcel = useCallback(async (file) => {
    if (!file) return { success: false, error: 'No file provided' }
    setSyncStatus('syncing')
    setSyncError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const parsedData = parseCaseQuestWorkbook(arrayBuffer)
      setData(parsedData)
      const nowStr = new Date().toISOString()
      setLastSyncTime(nowStr)
      setSyncStatus('synced')
      setSyncError(null)

      try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(parsedData))
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowStr)
      } catch {
        // Storage quota
      }

      setSyncNotice({
        type: 'success',
        message: `Parsed ${file.name} · ${parsedData.sites?.length || 0} sites loaded`,
        timestamp: Date.now(),
      })
      setTimeout(() => setSyncNotice(null), 4000)
      return { success: true, data: parsedData }
    } catch (err) {
      const errMsg = `Failed to parse spreadsheet: ${err.message}`
      setSyncStatus('error')
      setSyncError(errMsg)
      return { success: false, error: errMsg }
    }
  }, [])

  // Test a connection to a SharePoint URL without applying data
  const testConnection = useCallback(async (testUrl) => {
    try {
      const res = await fetch('/api/sync-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl }),
      })
      const result = await res.json()
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // Save new settings
  const updateSettings = useCallback(
    ({ url, interval, autoSync }) => {
      if (url !== undefined) {
        setExcelUrl(url)
        localStorage.setItem(STORAGE_KEY_URL, url)
      }
      if (interval !== undefined) {
        setIntervalMs(interval)
        localStorage.setItem(STORAGE_KEY_INTERVAL, String(interval))
      }
      if (autoSync !== undefined) {
        setIsAutoSync(autoSync)
      }
      // Trigger a sync if URL changed
      if (url !== undefined && url !== excelUrl) {
        syncNow(url)
      }
    },
    [excelUrl, syncNow]
  )

  // Initial sync on mount (or verification)
  useEffect(() => {
    isMountedRef.current = true
    // Attempt initial sync in background
    const timer = setTimeout(() => {
      syncNow(undefined, true)
    }, 0)
    return () => {
      isMountedRef.current = false
      clearTimeout(timer)
    }
  }, [syncNow])

  // Periodic polling interval
  useEffect(() => {
    if (!isAutoSync || intervalMs <= 0) return

    const timer = setInterval(() => {
      // Periodically sync silently
      syncNow(undefined, true)
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isAutoSync, intervalMs, syncNow])

  return {
    data,
    syncStatus,
    syncError,
    lastSyncTime,
    excelUrl,
    intervalMs,
    isAutoSync,
    syncNotice,
    isSettingsOpen,
    setIsSettingsOpen,
    syncNow,
    uploadLocalExcel,
    testConnection,
    updateSettings,
  }
}
