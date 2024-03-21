import { program } from 'commander'
import * as fs from 'fs'
import { convert } from 'nw-extract'
import { cpus } from 'os'
import * as path from 'path'
import { environment, NW_WORKSPACE } from '../env'
import { objectStreamConverter } from './bin/object-stream-converter'
import { copyFile, glob, writeJSONFile, writeUTF8File } from './utils/file-utils'

import { withProgressBar } from './utils'
import { BinaryReader } from './utils/binary-reader'
import { readShader } from './utils/shader-reader'

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
  shader = 'shader',
}

program
  .option('-i, --input <path>', 'unpacked game directory')
  .option('-o, --output <path>', 'output directory')
  .option('-u, --update', 'Force update')
  .option('-t, --threads <threads>', 'Number of threads', Number)
  .option('-m, --module <module>', 'Specific converter module to run', collect, [])
  .option('-ws, --workspace <name>', 'workspace (live or ptr)', NW_WORKSPACE)
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

    await convertAssetCatalog(inputDir, outputDir).then(async (data) => {
      await writeJSONFile(data, {
        target: path.join(outputDir, 'assetcatalog-infos.json'),
        createDir: true,
      })
    })
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

    if (hasFilter(Converter.shader, options.module)) {
      console.log('Convert Shader Files')
      const files = await glob([
        path.join(inputDir, 'shaders', 'cache', 'd3d11', '*.cfib'),
        path.join(inputDir, 'shaders', 'cache', 'd3d11', '*.cfxb')
      ])
      await withProgressBar({ tasks: files }, async (file, i, log) => {
        log(file)
        const code = await readShader(file)
        await writeUTF8File(code, {
          target: path.join(outputDir, path.relative(inputDir, file) + '.hlsl'),
          createDir: true,
        })
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
            pattern: ['**/images/**/*.dds', '**/images/**/*.png', '**/worldtiles/**/*.dds'],
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
  const field4 = reader.readUInt()
  console.table({ signature, version, fileSize, field4, position: reader.position })

  const posBlockUUID = reader.readUInt() // UUID block
  const posBlockType = reader.readUInt() // Type block
  const posBlockDirs = reader.readUInt() // Dir block
  const posBlockFile = reader.readUInt() // File block
  const fileSize2 = reader.readUInt()
  const posBlock0 = reader.position

  console.table({
    posBlockUUID,
    posBlockType,
    posBlockDirs,
    posBlockFile,
    fileSize2,
    position: reader.position,
  })

  const assetInfoRefs: Array<{
    uuidIndex1: number
    subId1: number
    uuidIndex2: number
    subId2: number
    typeIndex: number
    field6: number
    fileSize: number
    field8: number
    dirOffset: number
    fileOffset: number
  }> = []
  const assetPathRefs: Array<{
    uuidIndex: number
    guidIndex: number
    subId: number
  }> = []
  const legacyAssetRefs: Array<{
    legacyGuidIndex: number
    legacySubId: number
    guidIndex: number
    subId: number
  }> = []

  console.log('read block 0', posBlock0)
  reader.seekAbsolute(posBlock0)

  const count1 = reader.readUInt()
  console.log('count1', count1)
  for (let i = 0; i < count1; i++) {
    assetInfoRefs.push({
      uuidIndex1: reader.readUInt(),
      subId1: reader.readUInt(),
      uuidIndex2: reader.readUInt(),
      subId2: reader.readUInt(),
      typeIndex: reader.readUInt(),
      field6: reader.readUInt(),
      fileSize: reader.readUInt(),
      field8: reader.readUInt(),
      dirOffset: reader.readUInt(),
      fileOffset: reader.readUInt(),
    })
  }

  // reader.readUInt()
  // const count2 = reader.readUInt()
  // console.log('count2', count2)
  // for (let i = 0; i < count2; i++) {
  //   assetPathRefs.push({
  //     uuidIndex: reader.readUInt(),
  //     guidIndex: reader.readUInt(),
  //     subId: reader.readUInt(),
  //   })
  // }
  // const count3 = reader.readUInt()
  // console.log('count3', count3)
  // for (let i = 0; i < count3; i++) {
  //   legacyAssetRefs.push({
  //     legacyGuidIndex: reader.readUInt(),
  //     legacySubId: reader.readUInt(),
  //     guidIndex: reader.readUInt(),
  //     subId: reader.readUInt(),
  //   })
  // }
  // reader.readUInt()
  // reader.readUInt()

  const assetInfos = assetInfoRefs.map((info) => {
    reader.seekAbsolute(posBlockUUID + 16 * info.uuidIndex2)
    const assetId = reader.readUUID()

    reader.seekAbsolute(posBlockUUID + 16 * info.typeIndex)
    const type = reader.readUUID()

    reader.seekAbsolute(posBlockDirs + info.dirOffset)
    const dir = reader.readNullTerminatedString()

    reader.seekAbsolute(posBlockFile + info.fileOffset)
    const file = reader.readNullTerminatedString()

    return {
      assetId,
      type,
      dir,
      file,
    }
  })
  // const assetPaths = assetPathRefs.map((data) => {
  //   reader.seekAbsolute(posBlockUUID + 16 * data.uuidIndex)
  //   const assetId = reader.readUUID()

  //   reader.seekAbsolute(posBlockUUID + 16 * data.guidIndex)
  //   const guid = reader.readUUID()
  //   return {
  //     assetId,
  //     guid,
  //     subId: data.subId,
  //   }
  // })
  // const legacyAssets = legacyAssetRefs.map((data) => {
  //   reader.seekAbsolute(posBlockUUID + 16 * data.legacyGuidIndex)
  //   const legacyGuid = reader.readUUID()

  //   reader.seekAbsolute(posBlockUUID + 16 * data.guidIndex)
  //   const guid = reader.readUUID()
  //   return {
  //     legacyGuid,
  //     legacySubId: data.legacySubId,
  //     guid,
  //     subId: data.subId,
  //   }
  // })
  const assetDict = assetInfos.reduce((dict, it) => {
    dict[it.assetId] = path.join(it.dir, it.file).replace(/\\/g, '/')
    return dict
  }, {})

  return assetDict

}

function sizeOf(bytes: number) {
  if (bytes == 0) {
    return '0.00 B'
  }
  var e = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + ' KMGTP'.charAt(e) + 'B'
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
