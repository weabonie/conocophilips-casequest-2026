/**
 * Normalizes SharePoint and Personal OneDrive URLs into direct file download URLs.
 *
 * Supports:
 * 1. Personal OneDrive (onedrive.live.com):
 *    - /view.aspx?resid=...&authkey=...  -> /download.aspx?resid=...&authkey=...
 *    - /edit.aspx?resid=...&authkey=...  -> /download.aspx?resid=...&authkey=...
 *    - /embed?resid=...&authkey=...      -> /download.aspx?resid=...&authkey=...
 * 2. Personal OneDrive shortlinks (1drv.ms):
 *    - Uses Microsoft OneDrive Shares API: https://api.onedrive.com/v1.0/shares/u!{base64}/root/content
 * 3. School / Work SharePoint & Office 365:
 *    - Appends ?download=1
 */
export function formatDirectDownloadUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)

    // 1. Personal OneDrive (onedrive.live.com)
    if (url.hostname.includes('onedrive.live.com')) {
      if (
        url.pathname.includes('/view.aspx') ||
        url.pathname.includes('/edit.aspx') ||
        url.pathname.includes('/embed') ||
        url.pathname.includes('/view') ||
        url.pathname.includes('/edit')
      ) {
        url.pathname = '/download.aspx'
        url.searchParams.delete('em')
        url.searchParams.delete('app')
        return url.toString()
      }
      if (!url.searchParams.has('download')) {
        url.searchParams.set('download', '1')
      }
      return url.toString()
    }

    // 2. Personal OneDrive Shortlinks (1drv.ms)
    if (url.hostname === '1drv.ms') {
      try {
        const base64 = btoa(trimmed)
          .replace(/\//g, '_')
          .replace(/\+/g, '-')
          .replace(/=+$/, '')
        return `https://api.onedrive.com/v1.0/shares/u!${base64}/root/content`
      } catch {
        // Fallback if btoa fails
        return trimmed
      }
    }

    // 3. SharePoint or Office 365 (work/school)
    if (url.hostname.includes('sharepoint.com') || url.hostname.includes('office.com')) {
      if (url.searchParams.get('download') === '1') {
        return url.toString()
      }
      url.searchParams.set('download', '1')
      return url.toString()
    }

    // 4. Google Sheets (automatic .xlsx export)
    if (url.hostname.includes('docs.google.com') && url.pathname.includes('/spreadsheets/d/')) {
      const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=xlsx`
      }
    }

    return trimmed
  } catch {
    return trimmed
  }
}

/**
 * Checks if a given string looks like a valid SharePoint or OneDrive URL.
 */
export function isMicrosoftUrl(url) {
  if (!url || typeof url !== 'string') return false
  const s = url.toLowerCase()
  return (
    s.includes('.sharepoint.com') ||
    s.includes('1drv.ms') ||
    s.includes('onedrive.live.com') ||
    s.includes('.office.com')
  )
}
