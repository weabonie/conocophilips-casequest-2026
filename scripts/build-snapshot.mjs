import { readFileSync, writeFileSync } from 'node:fs'
import { parseCaseQuestWorkbook } from '../src/utils/excelParser.js'
const data = parseCaseQuestWorkbook(readFileSync(new URL('../CaseQuest2026Dataset.xlsx', import.meta.url)))
const json = JSON.stringify(data)
const bytes = Buffer.byteLength(json)
if (bytes > 1500000) throw new Error(`Snapshot exceeds 1.5 MB: ${bytes} bytes`)
writeFileSync(new URL('../src/data/operations.json', import.meta.url), json + '\n')
console.log(`Snapshot: ${bytes + 1} bytes; ${data.events.length} events; ${Object.values(data.readings).reduce((n, rows) => n + rows.length, 0)} readings`)
