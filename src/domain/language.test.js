import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
// Scan visible product components, not test fixtures or explanatory negations.
const unsupportedClaim = /\b(?:we|the system|this platform)\s+(?:prevents?|prevented)\s+(?:failures|injuries)\b|\bwill fail (?:within|in|on)\b/i
async function productFiles(directory) {
 const files=[]
 for(const entry of await readdir(directory,{withFileTypes:true})) {
  const path=join(directory,entry.name)
  if(entry.isDirectory())files.push(...await productFiles(path))
  else if(entry.name.endsWith('.jsx'))files.push(path)
 }
 return files
}
test('product language avoids unsupported outcome guarantees',async()=>{
 const violations=[]
 for(const file of await productFiles(fileURLToPath(new URL('../',import.meta.url))))if(unsupportedClaim.test(await readFile(file,'utf8')))violations.push(file)
 assert.deepEqual(violations,[])
})
test('language guard distinguishes guarantees from modeled avoided-downtime limits',()=>{
 assert.equal(unsupportedClaim.test('The system prevents failures'),true)
 assert.equal(unsupportedClaim.test('Asset will fail within 3 days'),true)
 assert.equal(unsupportedClaim.test('Modeled avoided downtime, not prevented failures or realized savings.'),false)
 assert.equal(unsupportedClaim.test('No maintenance savings or HSE benefits are monetized.'),false)
})
