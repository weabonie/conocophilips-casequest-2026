import snapshot from './src/data/operations.json' with { type: 'json' }
import { parseCaseQuestWorkbook } from './src/utils/excelParser.js'
import { formatDirectDownloadUrl } from './src/utils/urlHelper.js'

// Cloudflare uses Web Request/Response handlers; Vite middleware and api/*.js
// Node handlers are not deployed automatically by Workers Static Assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    // Demo role switching is client controlled. Do not open a paid model proxy
    // or trust browser-supplied roles/context without authenticated server scope.
    if (url.pathname === '/api/copilot') {
      if (request.method !== 'POST') return Response.json({ success: false, error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
      const size = Number(request.headers.get('content-length') || 0)
      if (size > 4096) return Response.json({ success: false, error: 'Question payload is too large' }, { status: 413 })
      let body
      try {
        const raw = await request.text()
        if (raw.length > 4096) return Response.json({ success: false, error: 'Question payload is too large' }, { status: 413 })
        body = JSON.parse(raw)
      } catch { return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 }) }
      if (typeof body?.question !== 'string' || !body.question.trim() || body.question.length > 1000) return Response.json({ success: false, error: 'Enter a question of up to 1,000 characters' }, { status: 400 })
      // Even a configured API key cannot enable this route by itself. Offline
      // answers remain available in the UI; no credentials or context are sent.
      return Response.json({ success: false, mode: 'offline', error: 'Live answers are unavailable. Use the sourced offline Copilot.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
    if (url.pathname !== '/api/sync-excel') return Response.json({ success: false, error: 'Not found' }, { status: 404 })
    if (!['GET', 'POST'].includes(request.method)) return Response.json({ success: false, error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET, POST' } })

    let targetUrl = url.searchParams.get('url') ?? env.VITE_EXCEL_ONLINE_URL ?? ''
    if (request.method === 'POST') {
      let body
      try { body = await request.json() } catch {
        return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
      }
      if (body?.url !== undefined) targetUrl = body.url
    }
    if (typeof targetUrl !== 'string') return Response.json({ success: false, error: 'Workbook URL must be a string' }, { status: 400 })
    targetUrl = targetUrl.trim()
    // The cleaned snapshot is bundled with the Worker; there is no local disk
    // workbook on Cloudflare. Import time and source-data time remain separate.
    if (!targetUrl || targetUrl.toLowerCase() === 'local') {
      return Response.json({ success: true, source: 'local', lastSyncTime: snapshot.lastSyncTime, data: snapshot }, { headers: { 'Cache-Control': 'no-store' } })
    }
    let remote
    try { remote = new URL(targetUrl) } catch {
      return Response.json({ success: false, error: 'Enter a valid workbook URL' }, { status: 400 })
    }
    if (remote.protocol !== 'https:') return Response.json({ success: false, error: 'Workbook URL must use HTTPS' }, { status: 400 })

    try {
      const response = await fetch(formatDirectDownloadUrl(targetUrl), { redirect: 'follow', signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error(`Workbook server returned HTTP ${response.status}`)
      if (response.headers.get('content-type')?.includes('text/html')) throw new Error('Workbook link returned a webpage. Use a directly downloadable workbook link.')
      const data = parseCaseQuestWorkbook(await response.arrayBuffer())
      const source = remote.hostname === 'docs.google.com' ? 'google_sheets' : remote.hostname.endsWith('.sharepoint.com') ? 'sharepoint' : 'remote'
      return Response.json({ success: true, source, lastSyncTime: data.lastSyncTime, data }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      return Response.json({ success: false, source: 'remote', error: error.message }, { status: 502 })
    }
  },
}
