import { syncExcelData } from '../src/utils/syncService.js'

export default async function handler(req, res) {
  try {
    let targetUrl = req.query?.url || process.env.VITE_EXCEL_ONLINE_URL || ''

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      if (body?.url !== undefined) {
        targetUrl = body.url
      }
    }

    const result = await syncExcelData(targetUrl)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
