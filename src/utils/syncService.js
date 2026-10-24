import fs from 'fs'
import path from 'path'
import { parseCaseQuestWorkbook } from './excelParser.js'
import { formatDirectDownloadUrl } from './urlHelper.js'

/**
 * Fetches an ArrayBuffer from a URL with redirect handling and proper headers.
 */
async function fetchBinary(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`)
  }

  const contentType = response.headers.get('content-type') || ''
  const arrayBuffer = await response.arrayBuffer()

  // Detect HTML response (e.g. login or landing page instead of raw .xlsx)
  if (contentType.includes('text/html')) {
    const text = new TextDecoder().decode(arrayBuffer.slice(0, 800))
    if (text.includes('<!DOCTYPE html') || text.includes('<html')) {
      const err = new Error('HTML_LOGIN_PAGE')
      err.isHtml = true
      throw err
    }
  }

  return arrayBuffer
}

/**
 * Handles fetching and parsing an Excel file from either a Personal OneDrive / SharePoint URL
 * or the fallback local dataset.
 *
 * @param {string} targetUrl - SharePoint or OneDrive URL, or 'local'
 * @param {string} localFilePath - Path to local fallback dataset
 * @returns {Promise<{success: boolean, data?: object, error?: string, source: string, lastSyncTime: string}>}
 */
export async function syncExcelData(targetUrl, localFilePath) {
  const isLocal = !targetUrl || targetUrl.trim() === '' || targetUrl.trim().toLowerCase() === 'local'

  if (isLocal) {
    try {
      const filePath = localFilePath || path.resolve(process.cwd(), 'CaseQuest2026Dataset.xlsx')
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Local dataset file not found at ${filePath}`,
          source: 'local',
          lastSyncTime: new Date().toISOString(),
        }
      }
      const buffer = fs.readFileSync(filePath)
      const data = parseCaseQuestWorkbook(buffer)
      return {
        success: true,
        source: 'local',
        lastSyncTime: new Date().toISOString(),
        data,
      }
    } catch (err) {
      return {
        success: false,
        error: `Failed to parse local dataset: ${err.message}`,
        source: 'local',
        lastSyncTime: new Date().toISOString(),
      }
    }
  }

  const trimmed = targetUrl.trim()
  const candidateUrls = []

  // 1. Primary converted download URL
  const primaryUrl = formatDirectDownloadUrl(trimmed)
  candidateUrls.push(primaryUrl)

  // 2. If 1drv.ms, also prepare raw with download=1 and redirect check
  if (trimmed.includes('1drv.ms')) {
    const withDownloadParam = trimmed.includes('?') ? `${trimmed}&download=1` : `${trimmed}?download=1`
    if (!candidateUrls.includes(withDownloadParam)) {
      candidateUrls.push(withDownloadParam)
    }
  }

  let lastError = null

  // Try candidate URLs in order
  for (const url of candidateUrls) {
    try {
      const arrayBuffer = await fetchBinary(url)
      const data = parseCaseQuestWorkbook(arrayBuffer)
      return {
        success: true,
        source: trimmed.includes('docs.google.com')
          ? 'google_sheets'
          : trimmed.includes('sharepoint.com')
          ? 'sharepoint'
          : 'onedrive_personal',
        lastSyncTime: new Date().toISOString(),
        data,
      }
    } catch (err) {
      lastError = err
      // If error was HTML login page, continue to try next candidate
    }
  }

  // 3. Fallback for 1drv.ms: resolve redirect to onedrive.live.com/view.aspx and convert to download.aspx
  if (trimmed.includes('1drv.ms')) {
    try {
      const headRes = await fetch(trimmed, { redirect: 'manual' })
      const location = headRes.headers.get('location')
      if (location) {
        const downloadLoc = formatDirectDownloadUrl(location)
        const arrayBuffer = await fetchBinary(downloadLoc)
        const data = parseCaseQuestWorkbook(arrayBuffer)
        return {
          success: true,
          source: 'onedrive_personal',
          lastSyncTime: new Date().toISOString(),
          data,
        }
      }
    } catch (err) {
      lastError = err
    }
  }

  if (lastError?.isHtml) {
    return {
      success: false,
      error:
        'Microsoft redirected to a sign-in page. On personal OneDrive, ensure you clicked Share -> Copy Link (Anyone with the link can view), or copy the URL from your browser address bar when viewing the Excel file.',
      source: 'remote',
      lastSyncTime: new Date().toISOString(),
    }
  }

  return {
    success: false,
    error: `Unable to download Excel workbook: ${lastError?.message || 'Unknown error'}`,
    source: 'remote',
    lastSyncTime: new Date().toISOString(),
  }
}
