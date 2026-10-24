import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'

const forbidden = [/will fail/i, /prevented failure/i, /injur/i, /maintenance savings/i, /—/]

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (/\.(js|jsx|css)$/.test(entry.name)) files.push(path)
  }
  return files
}

test('product language guard stays clear', async () => {
  const files = await sourceFiles(new URL('../', import.meta.url).pathname)
  const violations = []
  for (const file of files) {
    const content = await readFile(file, 'utf8')
    if (forbidden.some((pattern) => pattern.test(content))) violations.push(file)
  }
  assert.deepEqual(violations, [])
})
