import assert from 'assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, it } from 'node:test'
import { replaceExtname } from '../../utils/file-utils'
import { copyDdsFile, ddsToPng } from './utils'

describe('.dds file format', () => {
  const sampleDir = path.join(__dirname, 'sample')
  const tmpDir = path.join(__dirname, 'tmp')
  const DDNA = 'male_alchemist_calves_ddna.dds'
  const DIFF = 'male_alchemist_calves_diff.dds'
  const MASK = 'male_alchemist_calves_mask.dds'
  const SPEC = 'male_alchemist_calves_spec.dds'

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('copyDdsFile', () => {
    it(DDNA, async () => {
      const output = await copyDdsFile({
        input: path.join(sampleDir, DDNA),
        output: path.join(tmpDir, DDNA),
      })
      assert.equal(output.length, 2, 'should create 2 textures')
      assert.equal(fs.existsSync(output[0]), true)
      assert.equal(fs.existsSync(output[1]), true)
      assert.equal(fs.existsSync(output[0]), true)
    })

    it(DIFF, async () => {
      const output = await copyDdsFile({
        input: path.join(sampleDir, DIFF),
        output: path.join(tmpDir, DIFF),
      })
      assert.equal(fs.existsSync(output[0]), true)
      assert.equal(output.length, 1, 'should create 1 texture')
      assert.equal(fs.existsSync(output[0]), true)
    })

    it(MASK, async () => {
      const output = await copyDdsFile({
        input: path.join(sampleDir, MASK),
        output: path.join(tmpDir, MASK),
      })
      assert.equal(output.length, 1, 'should create 1 texture')
      assert.equal(fs.existsSync(output[0]), true)
    })

    it(SPEC, async () => {
      const output = await copyDdsFile({
        input: path.join(sampleDir, SPEC),
        output: path.join(tmpDir, SPEC),
      })
      assert.equal(output.length, 1, 'should create 1 texture')
      assert.equal(fs.existsSync(output[0]), true)
    })
  })

  describe('ddsToPng', () => {
    it(DDNA, async () => {
      const files = await copyDdsFile({
        input: path.join(sampleDir, DDNA),
        output: path.join(tmpDir, DDNA),
      })
      await ddsToPng({
        ddsFile: files[0],
        outDir: path.join(tmpDir),
        isNormal: true,
      })
      await ddsToPng({
        ddsFile: files[1],
        outDir: path.join(tmpDir),
        isNormal: false,
      })
      assert.equal(fs.existsSync(replaceExtname(files[0], '.png')), true)
      assert.equal(fs.existsSync(replaceExtname(files[1], '.png')), true)
    })
  })
})
