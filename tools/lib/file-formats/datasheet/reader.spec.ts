import { describe, it } from 'bun:test'
import path from 'node:path'

import { readDatasheetFile } from './reader'

describe('DatasheetReader', () => {
  it('should read a datasheet', async () => {
    //const input = path.join(__dirname, 'samples', 'javelindata_ability_ai.datasheet')
    const input = path.join(__dirname, 'samples', 'javelindata_affixdefinitions.datasheet')
    const sheet = await readDatasheetFile(input)
    console.log(sheet.type, sheet.name)
  })
})
