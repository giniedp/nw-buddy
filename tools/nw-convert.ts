import { program } from 'commander'
import { convert } from 'nw-extract'
import * as path from 'path'
import * as fs from 'fs'
import { environment, NW_GAME_VERSION } from '../env'
import { objectStreamConverter } from './bin/object-stream-converter'
import { cpus } from 'os'
import { glob, copyFile, writeJSONFile } from './utils/file-utils'

import { withProgressBar } from './utils'
import { BinaryReader } from './utils/binary-reader'

function collect(value: string, previous: string[]) {
  return previous.concat(value.split(','))
}

function hasFilter(filter: string, filters: string[]) {
  return !filters?.length || filters.includes(filter)
}

enum Converter {
  slices = 'slices',
  datasheets = 'datasheets',
  locales = 'locales',
  images = 'images',
}

program
  .option('-i, --input <path>', 'unpacked game directory')
  .option('-o, --output <path>', 'output directory')
  .option('-u, --update', 'Force update')
  .option('-t, --threads <threads>', 'Number of threads', Number)
  .option('-m, --module <module>', 'Specific converter module to run', collect, [])
  .option('-ws, --workspace <name>', 'workspace (live or ptr)', NW_GAME_VERSION)
  .action(async () => {
    const options = program.opts<{
      input: string
      output: string
      workspace: boolean
      update: boolean
      threads: number
      module: string[]
    }>()
    options.update = !!options.update
    options.threads = options.threads || cpus().length
    const inputDir = options.input || environment.nwUnpackDir(options.workspace)!
    const outputDir = options.output || environment.nwConvertDir(options.workspace)!
    console.log('[CONVERT]', inputDir)
    console.log('      to:', outputDir)
    console.log('  update:', options.update)
    console.log(' threads:', options.threads)
    console.log('modules:', options.module?.length ? options.module : 'ALL')

    if (options.module.some((it) => !Converter[it])) {
      throw new Error(`Unknown importer module: ${it}`)
    }

    await convertRegionData(inputDir, outputDir)

    if (hasFilter(Converter.datasheets, options.module)) {
      console.log('Convert Datasheets')
      await convert({
        inputDir: inputDir,
        outputDir: outputDir,
        update: !!options.update,
        threads: options.threads,
        conversions: [
          {
            format: 'json',
            pattern: ['**/*.datasheet'],
          },
        ],
      })
    }

    if (hasFilter(Converter.locales, options.module)) {
      console.log('Convert Locales')
      await convert({
        bin: 'tools/bin',
        inputDir: inputDir,
        outputDir: outputDir,
        update: !!options.update,
        threads: options.threads,
        conversions: [
          {
            format: 'json',
            pattern: ['**/*.loc.xml'],
          },
        ],
      })
    }

    if (hasFilter(Converter.images, options.module)) {
      console.log('Convert Images')
      await convert({
        bin: 'tools/bin',
        inputDir: inputDir,
        outputDir: outputDir,
        update: !!options.update,
        threads: options.threads,
        conversions: [
          {
            format: 'png',
            pattern: ['**/images/**/*.dds', '**/images/**/*.png'],
          },
        ],
      })
    }

    if (hasFilter(Converter.slices, options.module)) {
      console.log('Convert Slices')
      await withProgressBar({ tasks: ['libs', 'coatgen', 'sharedassets', 'slices'] }, async (dir, i, log) => {
        log(dir)
        await objectStreamConverter({
          exe: 'tools/bin/object-stream-converter.exe',
          input: path.join(inputDir, dir),
          output: path.join(outputDir, dir),
          pretty: true,
          threads: Math.min(options.threads, 10),
        }, {
          stdio: 'ignore'
        })
      })
    }

    console.log('Copy JSON files')
    const files = await glob([path.join(inputDir, '**', '*.json')])
    await withProgressBar({ tasks: files }, async (file, i, log) => {
      log(file)
      const relPath = path.relative(inputDir, file)
      const outPath = path.join(outputDir, relPath)
      await copyFile(file, outPath, {
        createDir: true,
      })
    })
  })

program.parse()

async function convertRegionData(inputDir: string, outputDir: string) {
  const files = await glob([path.join(inputDir, '**', 'r_*', 'region.distribution')])
  await withProgressBar({ tasks: files, barName: 'Regions' }, async (file, i, log) => {
    const relPath = path.relative(inputDir, file)
    const outPath = path.join(outputDir, relPath + '.json')
    log(relPath)

    const tokens = path.basename(path.dirname(file)).split('_')
    const region = [Number(tokens[1]), Number(tokens[2])]
    const data = await fs.promises.readFile(file)
    const reader = new BinaryReader(data.buffer)

    let count = reader.readUShort()
    const slices = readStringArray(reader, count)
    const variants = readStringArray(reader, count)

    count = reader.readUInt()
    const indices = []
    const positions = []
    for (let i = 0; i < count; i++) {
      indices.push(reader.readUShort())
    }
    for (let i = 0; i < count; i++) {
      const y = reader.readUShort()
      const x = reader.readUShort()
      positions.push([x, y])
    }

    await writeJSONFile({
      region,
      slices: slices,
      variants: variants,
      indices: indices,
      positions: positions,
    }, {
      target: outPath,
      createDir: true,
    })
  })
}

function readStringArray(r: BinaryReader, count: number) {
  const result = []
  for (let i = 0; i < count; i++) {
    const c = r.readByte()
    const v = String.fromCharCode(...r.readByteArray(c) )
    result.push(v)
  }
  return result
}
