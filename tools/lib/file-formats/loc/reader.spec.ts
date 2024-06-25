import path from 'node:path'
import assert from 'assert/strict'
import { describe, it } from 'bun:test'
import { readLocalizationFile } from './reader'

describe('.loc.xml file format', () => {
  const sampleDir = path.join(__dirname, 'sample')
  const sampleFile = path.join(sampleDir, 'sample.loc.xml')

  describe('readLocalizationFile', () => {
    it(sampleFile, async () => {
      const data = await readLocalizationFile(sampleFile)
      expect(data.resources).toBeDefined()
    })
  })
})
