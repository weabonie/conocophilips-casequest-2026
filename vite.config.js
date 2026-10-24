import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { syncExcelData } from './src/utils/syncService.js'

function excelLiveSyncPlugin() {
  return {
    name: 'excel-live-sync-api',
    configureServer(server) {
      server.middlewares.use('/api/sync-excel', async (req, res) => {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
          let targetUrl = urlObj.searchParams.get('url') || process.env.VITE_EXCEL_ONLINE_URL || ''

          if (req.method === 'POST') {
            const buffers = []
            for await (const chunk of req) {
              buffers.push(chunk)
            }
            const bodyStr = Buffer.concat(buffers).toString('utf-8')
            try {
              const body = JSON.parse(bodyStr)
              if (body.url !== undefined) {
                targetUrl = body.url
              }
            } catch (parseErr) {
              console.warn('Failed to parse request JSON body:', parseErr.message)
            }
          }

          const result = await syncExcelData(targetUrl)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: err.message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    excelLiveSyncPlugin(),
  ],
})
