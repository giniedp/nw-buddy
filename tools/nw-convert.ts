import { program } from 'commander'
import * as fs from 'fs'
import { convert } from 'nw-extract'
import { cpus } from 'os'
import * as path from 'path'
import { environment, NW_GAME_VERSION } from '../env'
import { objectStreamConverter } from './bin/object-stream-converter'
import { copyFile, glob, writeJSONFile } from './utils/file-utils'

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

    // await convertAssetCatalog(inputDir, outputDir)
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
        await objectStreamConverter(
          {
            exe: 'tools/bin/object-stream-converter.exe',
            input: path.join(inputDir, dir),
            output: path.join(outputDir, dir),
            pretty: true,
            threads: Math.min(options.threads, 10),
          },
          {
            stdio: 'ignore',
          },
        )
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

    await writeJSONFile(
      {
        region,
        slices: slices,
        variants: variants,
        indices: indices,
        positions: positions,
      },
      {
        target: outPath,
        createDir: true,
      },
    )
  })
}

function readStringArray(r: BinaryReader, count: number) {
  const result = []
  for (let i = 0; i < count; i++) {
    const c = r.readByte()
    const v = String.fromCharCode(...r.readByteArray(c))
    result.push(v)
  }
  return result
}

async function convertAssetCatalog(inputDir: string, outputDir: string) {
  const file = path.join(inputDir, 'assetcatalog.catalog')
  const data = await fs.promises.readFile(file)
  const reader = new BinaryReader(data.buffer)

  const signature = reader.readString(4)
  const version = reader.readUInt()
  const fileSize = reader.readUInt()
  reader.seekRelative(4)
  console.table({ signature, version, fileSize, position: reader.position })

  const posBlock1 = reader.readUInt()
  const posBlock2 = reader.readUInt()
  const posBlock3 = reader.readUInt()
  const posBlock4 = reader.readUInt()
  const posBlock0 = reader.position

  console.table({ posBlock1, posBlock2, posBlock3, posBlock4, position: reader.position })

  console.log('read block 0', reader.position)
  const block0 = []
  while (reader.position < posBlock1) {
    block0.push(reader.readInt())
  }
  console.log(reader.position)
  console.log('read block 1', posBlock1)
  reader.seekAbsolute(posBlock1)
  const uuids: string[] = []
  while (reader.position < posBlock2) {
    const value = reader
      .readBytes(16)
      .map((it): string => {
        return it.toString(16).padStart(2, '0')
      })
      .join('')
    uuids.push(value)
  }
  console.log(reader.position)
  console.log('read block 2', posBlock2)
  reader.seekAbsolute(posBlock2)
  const types: string[] = []
  while (reader.position < posBlock3) {
    const value = reader
      .readBytes(16)
      .map((it): string => {
        return it.toString(16).padStart(2, '0')
      })
      .join('')
    types.push(value)
  }
  console.log(reader.position)
  console.log('read block 3', posBlock3)
  reader.seekAbsolute(posBlock3)
  const directories: string[] = []
  while (reader.position < posBlock4) {
    const value = reader.readNullTerminatedString()
    directories.push(value)
  }
  console.log(reader.position)
  console.log('read block 4', posBlock4)
  reader.seekAbsolute(posBlock4)
  const fileNames: string[] = []
  while (reader.position < fileSize) {
    const value = reader.readNullTerminatedString()
    fileNames.push(value)
  }

  console.table([
    ['block', 'size', '(size)', 'content', 'count'],
    [posBlock0, posBlock1 - posBlock0, sizeOf(posBlock1 - posBlock0), 'unknown', block0.length],
    [posBlock1, posBlock2 - posBlock1, sizeOf(posBlock2 - posBlock1), 'uuids', uuids.length],
    [posBlock2, posBlock3 - posBlock2, sizeOf(posBlock3 - posBlock2), 'types', types.length],
    [posBlock3, posBlock4 - posBlock3, sizeOf(posBlock4 - posBlock3), 'directories', directories.length],
    [posBlock4, fileSize - posBlock3, sizeOf(fileSize - posBlock3), 'fileNames', fileNames.length],
  ])

  const assets = [
    {
      guid: '7ec7032d-2e4a-5cdf-b005-46836debe3fc',
      type: '78802abf-9595-463a-8d2b-d022f906f9b1',
      //hint: 'slices/holiday/winterconvergence/activities/lostpresent/winterconv_activity_lostpresent_rare_01.dynamicslice',
      hint: 'slices/holiday/winterconvergence/activities/lostpresent/winterconv_activity_lostpresent_rare_00.dynamicslice',
    },
    {
      guid: '08caecaa-fb11-553d-b133-7c6345f21734',
      type: 'd52cccdd-9701-45d9-b261-8ea6881a6312',
      hint: 'objects/landmarks/corruption_core/jav_lm_corruption_core_b.rnr',
    },
  ]

  for (const asset of assets) {
    console.log(asset.hint)
    console.table([
      ['guid', asset.guid, uuids.indexOf(asset.guid.replace(/-/g, ''))],
      ['type', asset.type, types.indexOf(asset.type.replace(/-/g, ''))],
      ['dir', path.dirname(asset.hint) + '/', directories.indexOf(path.dirname(asset.hint) + '/')],
      ['file', path.basename(asset.hint), fileNames.indexOf(path.basename(asset.hint))],
    ])
  }

  // slices/holiday/winterconvergence/activities/lostpresent/winterconv_activity_lostpresent_rare_00.dynamicslice
  //   guid 249097 7ec7032d-2e4a-5cdf-b005-46836debe3fc                      // 09 CD 03 00
  //   type 2      78802abf-9595-463a-8d2b-d022f906f9b1                      // 02 00 00 00
  //    dir 12296  slices/holiday/winterconvergence/activities/lostpresent/  // 08 30 00 00 // 110 files (6E)
  //   file 746154 winterconv_activity_lostpresent_rare_00.dynamicslice      // AA 62 0B 00

  // objects/landmarks/corruption_core/jav_lm_corruption_core_b.rnr
  //   guid 209569 08caecaa-fb11-553d-b133-7c6345f21734
  //   type 8      d52cccdd-9701-45d9-b261-8ea6881a6312
  //    dir 3504   objects/landmarks/corruption_core/
  //   file 632607 jav_lm_corruption_core_b.rnr
}

function sizeOf(bytes: number) {
  if (bytes == 0) { return "0.00 B"; }
  var e = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes/Math.pow(1024, e)).toFixed(2)+' '+' KMGTP'.charAt(e)+'B';
}

function maxValue(values: number[], stride: number = 1) {
  let max: number[] = []
  for (let i = 0; i < values.length; i += stride) {
    for (let j = 0; j < stride; j++) {
      max[j] = Math.max(max[j] || 0, values[i + j])
    }
  }
  return max
}
