import assert from 'node:assert/strict'
import { test } from 'node:test'
import worker from './cloudflare-worker.js'
import { PARSER_VERSION } from './src/utils/excelParser.js'

test('serves the bundled cleaned snapshot without a Node filesystem', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/sync-excel'), {})
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.success, true)
  assert.equal(result.data.parserVersion, PARSER_VERSION)
  assert.equal(result.data.sites.length, 6)
  assert.equal(result.lastSyncTime, result.data.lastSyncTime)
})

test('explicit snapshot selection overrides the configured remote URL', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/sync-excel', {
    method: 'POST', body: JSON.stringify({ url: 'local' }),
  }), { VITE_EXCEL_ONLINE_URL: 'https://example.com/remote.xlsx' })
  assert.equal((await response.json()).source, 'local')
})

test('non-API routes delegate to static assets; unknown APIs return JSON 404', async () => {
  const request = new Request('https://example.com/equipment')
  const response = await worker.fetch(request, { ASSETS: { fetch: async input => {
    assert.equal(input, request)
    return new Response('app shell')
  } } })
  assert.equal(await response.text(), 'app shell')
  assert.equal((await worker.fetch(new Request('https://example.com/api/missing'), {})).status, 404)
})

test('rejects unsupported methods and malformed request bodies', async () => {
  assert.equal((await worker.fetch(new Request('https://example.com/api/sync-excel', { method: 'DELETE' }), {})).status, 405)
  assert.equal((await worker.fetch(new Request('https://example.com/api/sync-excel', { method: 'POST', body: 'invalid' }), {})).status, 400)
  assert.equal((await worker.fetch(new Request('https://example.com/api/sync-excel', { method: 'POST', body: '{"url":42}' }), {})).status, 400)
})

test('rejects invalid download URLs without issuing a fetch', async () => {
  for (const url of ['not a URL', 'http://example.com/file.xlsx']) {
    const response = await worker.fetch(new Request(`https://example.com/api/sync-excel?url=${encodeURIComponent(url)}`), {})
    assert.equal(response.status, 400)
  }
})

test('reports remote sign-in pages without treating them as workbooks', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Sign in</html>', { headers: { 'Content-Type': 'text/html' } }))
  const response = await worker.fetch(new Request('https://example.com/api/sync-excel?url=https://example.com/file.xlsx'), {})
  assert.equal(response.status, 502)
  assert.match((await response.json()).error, /webpage/)
})


test('Copilot rejects unsupported methods, invalid questions and oversized bodies', async () => {
  assert.equal((await worker.fetch(new Request('https://example.com/api/copilot'), {})).status, 405)
  for (const body of ['invalid', '{}', '{"question":42}', JSON.stringify({ question: 'x'.repeat(1001) })]) {
    const response = await worker.fetch(new Request('https://example.com/api/copilot', { method: 'POST', body }), {})
    assert.equal(response.status, 400)
  }
  const response = await worker.fetch(new Request('https://example.com/api/copilot', { method: 'POST', body: JSON.stringify({ question: 'x'.repeat(5000) }) }), {})
  assert.equal(response.status, 413)
})

test('Copilot remains offline without server authentication and never exposes credentials or fetches models', async t => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('Unexpected external request') })
  const response = await worker.fetch(new Request('https://example.com/api/copilot', { method: 'POST', body: JSON.stringify({ question: 'How exposed is Arroyo?', role: 'ops_manager', context: 'untrusted browser context' }) }), { ANTHROPIC_API_KEY: 'private-test-key', COPILOT_MODEL: 'private-model' })
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.text()
  assert.match(body, /offline/)
  assert.doesNotMatch(body, /private-test-key|private-model|untrusted browser/)
  assert.equal(calls, 0)
})
