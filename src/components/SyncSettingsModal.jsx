import { useState, useRef } from 'react'
import {
  X,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function SyncSettingsModal({
  isOpen,
  onClose,
  excelUrl,
  intervalMs,
  isAutoSync,
  onSaveSettings,
  onUploadFile,
  onTestConnection,
}) {
  const [urlInput, setUrlInput] = useState(excelUrl || '')
  const [selectedInterval, setSelectedInterval] = useState(intervalMs || 120000)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(isAutoSync ?? true)
  const [testState, setTestState] = useState({ status: 'idle', message: '', details: null })
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleTest = async () => {
    if (!urlInput.trim()) {
      setTestState({
        status: 'error',
        message: 'Enter a workbook link to test the connection.',
      })
      return
    }

    setTestState({ status: 'testing', message: 'Connecting to Microsoft SharePoint...' })
    const res = await onTestConnection(urlInput.trim())

    if (res.success && res.data) {
      setTestState({
        status: 'success',
        message: 'Successfully connected and verified Excel workbook!',
        details: {
          sites: res.data.sites?.length || 0,
          source: res.source || 'sharepoint',
          time: new Date(res.lastSyncTime).toLocaleTimeString(),
        },
      })
    } else {
      setTestState({
        status: 'error',
        message: res.error || 'Failed to connect. Please check permissions.',
      })
    }
  }

  const handleSave = () => {
    onSaveSettings({
      url: urlInput.trim(),
      interval: Number(selectedInterval),
      autoSync: autoSyncEnabled,
    })
    onClose()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      await onUploadFile(file)
      onClose()
    }
  }

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      await onUploadFile(file)
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Cloud size={18} />
            </div>
            <div>
              <h3>Data settings</h3>
              <p>Connect a workbook or import updated operating records.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* SharePoint URL Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="sharepoint-url">SharePoint or OneDrive File Link</label>
              <button
                type="button"
                className="help-toggle-btn"
                onClick={() => setIsHelpOpen(!isHelpOpen)}
              >
                <HelpCircle size={12} />
                <span>How to get share link</span>
                {isHelpOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>

            {isHelpOpen && (
              <div className="sharepoint-help-card">
                <strong>How to get the link from Personal OneDrive:</strong>
                <ol>
                  <li>
                    <strong>Method 1 (Share Link):</strong> In <a href="https://onedrive.live.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>onedrive.live.com</a>, right-click your <code>CaseQuest2026Dataset.xlsx</code> &rarr; <strong>Share</strong> &rarr; <strong>Copy Link</strong> (creates a <code>1drv.ms</code> link).
                  </li>
                  <li>
                    <strong>Method 2 (Browser Address Bar):</strong> Open the Excel file in Excel Online. Simply copy the full URL from your browser address bar (it looks like <code>onedrive.live.com/view.aspx?resid=...&amp;authkey=...</code>). The app will automatically convert it to a direct live download!
                  </li>
                </ol>
                <small>Tip: Personal Microsoft accounts allow public sharing without school/work admin restrictions.</small>
              </div>
            )}

            <div className="input-with-button">
              <input
                id="sharepoint-url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://yourorg.sharepoint.com/:x:/s/... or 1drv.ms link"
                className="url-input"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testState.status === 'testing'}
                className="test-btn"
              >
                {testState.status === 'testing' ? (
                  <>
                    <RefreshCw size={12} className="spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
            </div>

            {/* Test Status feedback */}
            {testState.status === 'success' && (
              <div className="test-alert alert-success">
                <CheckCircle2 size={14} />
                <div>
                  <strong>{testState.message}</strong>
                  {testState.details && (
                    <small>
                      Verified {testState.details.sites} operational sites · Source: {testState.details.source} · {testState.details.time}
                    </small>
                  )}
                </div>
              </div>
            )}

            {testState.status === 'error' && (
              <div className="test-alert alert-error">
                <AlertTriangle size={14} />
                <div>
                  <strong>Connection check failed:</strong>
                  <small>{testState.message}</small>
                </div>
              </div>
            )}
          </div>

          {/* Sync Frequency */}
          <div className="form-group">
            <label htmlFor="sync-frequency">Auto-Sync Frequency</label>
            <div className="interval-selector">
              {[
                { label: 'Every 1 min', value: 60000 },
                { label: 'Every 2 mins (Recommended)', value: 120000 },
                { label: 'Every 5 mins', value: 300000 },
                { label: 'Every 10 mins', value: 600000 },
                { label: 'Manual only', value: 0 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`interval-pill ${selectedInterval === opt.value ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedInterval(opt.value)
                    setAutoSyncEnabled(opt.value > 0)
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fallback File Dropzone */}
          <div className="form-group">
            <label>Import workbook</label>
            <div
              className={`file-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} className="dropzone-icon" />
              <div>
                <strong>Drop an Excel workbook here</strong>
                <p>or click to choose a file</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save &amp; Sync Now
          </button>
        </div>
      </div>
    </div>
  )
}
