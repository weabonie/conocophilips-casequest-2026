import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseCaseQuestWorkbook } from '../src/utils/excelParser.js'

const inputPath = resolve('CaseQuest2026Dataset.xlsx')
const outputPath = resolve('src/data/operations.json')
const maxBytes = 1.5 * 1024 * 1024

const workbook = await readFile(inputPath)
const data = parseCaseQuestWorkbook(workbook)
const json = `${JSON.stringify(data)}\n`
const bytes = Buffer.byteLength(json)

if (bytes > maxBytes) {
  throw new Error(`Snapshot is ${bytes} bytes, above the ${maxBytes} byte limit`)
}

await writeFile(outputPath, json)
console.log(`Wrote ${outputPath} (${bytes} bytes)`)
