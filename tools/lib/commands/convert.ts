import { program } from 'commander'
import { cpus } from 'node:os'
import path from 'node:path'
import { z } from 'zod'
import { NW_WORKSPACE, environment } from '../../../env'
import { objectStreamConverter } from '../bin/object-stream-converter'
import { readAssetcatalog } from '../file-formats/catalog'
import { readDatasheetFile } from '../file-formats/datasheet'
import { DatasheetFile, datasheetHeader, datasheetRows } from '../file-formats/datasheet/converter'
import { readDistributionFile } from '../file-formats/distribution'
import { readLocalizationFile } from '../file-formats/loc/reader'
import { readShader } from '../file-formats/shader'
import { readVshapecFile } from '../file-formats/vshapec'
import { withProgressBar } from '../utils'
import { copyFile, glob, replaceExtname, writeJSONFile, writeUTF8File } from '../utils/file-utils'
import { logger } from '../utils/logger'
import { runTasks } from '../worker/runner'

const OptionsSchema = z.object({
  workspace: z.string(),
  update: z.boolean().optional(),
  threads: z.number().optional(),
})

enum AssetType {
  files = 'files',
  catalog = 'catalog',
  shapes = 'shapes',
  locales = 'locales',
  tables = 'tables',
  shaders = 'shaders',
  objectstreams = 'objectstreams',
  images = 'images',
}

function parseType(value: string): AssetType[] {
  if (!value) {
    return null
  }
  return value
    .split(',')
    .map((it) => it.trim())
    .map((it) => {
      if (it in AssetType) {
        return AssetType[it as keyof typeof AssetType]
      }
      throw new Error(`Invalid asset type: ${it}`)
    })
}

function typeEnabled(types: AssetType[], type: AssetType) {
  return !types || types.includes(type)
}
program
  .command('convert')
  .description('Converts unpacked game files to a convenient format to work with (JSON, png, etc.)')
  .option('-u, --update', 'Force update images')
  .option('-t, --threads <threads>', 'Number of threads', Number)
  .option('-ws, --workspace <name>', 'workspace (live or ptr)', NW_WORKSPACE)
  .argument('[assetType]', 'The asset type to convert. If not specified, all assets will be converted.')
  .action(async (type: string, args) => {
    const options = OptionsSchema.parse(args)
    options.update = !!options.update
    options.threads = options.threads || cpus().length
    const unpackDir = environment.nwUnpackDir(options.workspace)!
    const convertDir = environment.nwConvertDir(options.workspace)!
    const modules = type ? parseType(type) : null

    logger.info('[CONVERT]', unpackDir)
    logger.info('      to:', convertDir)
    logger.info('  update:', options.update)
    logger.info(' threads:', options.threads)
    logger.verbose(options.threads <= 1)

    if (typeEnabled(modules, AssetType.files)) {
      await copyCommonFiles(unpackDir, convertDir)
    }
    if (typeEnabled(modules, AssetType.catalog)) {
      await convertAssetCatalog(unpackDir, convertDir)
    }
    if (typeEnabled(modules, AssetType.shapes)) {
      await convertRegionData(unpackDir, convertDir)
      await convertVshapec(unpackDir, convertDir)
    }
    if (typeEnabled(modules, AssetType.locales)) {
      await convertLocales(unpackDir, convertDir)
    }
    if (typeEnabled(modules, AssetType.tables)) {
      await convertDatasheets(unpackDir, convertDir)
    }
    if (typeEnabled(modules, AssetType.shaders)) {
      await convertShaders(unpackDir, convertDir)
    }
    if (typeEnabled(modules, AssetType.objectstreams)) {
      await convertObjectStreams({
        inputDir: unpackDir,
        outputDir: convertDir,
        threads: options.threads,
      })
    }
    if (typeEnabled(modules, AssetType.images)) {
      await convertImages({
        inputDir: unpackDir,
        outputDir: convertDir,
        threads: options.threads,

      })
    }
  })

async function convertLocales(inputDir: string, outputDir: string) {
  const locFiles = await glob(path.join(inputDir, 'localization', '**', '*.loc.xml'))
  await withProgressBar({ tasks: locFiles, label: 'Locales' }, async (file, i, log) => {
    const data = await readLocalizationFile(file)
    const relPath = path.relative(inputDir, file)
    const outPath = replaceExtname(path.join(outputDir, relPath), '.json')
    log(relPath)
    await writeJSONFile(data, {
      target: outPath,
      createDir: true,
    })
  })
}

async function convertDatasheets(inputDir: string, outputDir: string) {
  const files = await glob(path.join(inputDir, '**/*.datasheet'))
  await withProgressBar({ tasks: files, label: 'Datasheets' }, async (file, i, log) => {
    const relPath = path.relative(inputDir, file)
    const outPath = path.join(outputDir, replaceExtname(relPath, '.json'))
    log(relPath)
    const data = await readDatasheetFile(file)
    const datasheet: DatasheetFile = {
      header: datasheetHeader(data),
      rows: datasheetRows(data),
    }
    await writeJSONFile(datasheet, {
      target: outPath,
      createDir: true,
    })
  })
}

async function convertRegionData(inputDir: string, outputDir: string) {
  const files = await glob([path.join(inputDir, '**', 'r_*', 'region.distribution')])
  await withProgressBar({ tasks: files, label: 'Region Distrib.' }, async (file, i, log) => {
    const relPath = path.relative(inputDir, file)
    const outPath = path.join(outputDir, relPath + '.json')
    log(relPath)
    const data = await readDistributionFile(file)
    await writeJSONFile(data, {
      target: outPath,
      createDir: true,
    })
  })
}

async function convertAssetCatalog(inputDir: string, outputDir: string) {
  withProgressBar({ tasks: ['assetcatalog.catalog'], label: 'Asset Catalog' }, async (file, i, log) => {
    log(file)
    const inputFile = path.join(inputDir, file)
    const outputFile = replaceExtname(path.join(outputDir, file), '.json')
    const data = await readAssetcatalog(inputFile)
    await writeJSONFile(data, {
      target: outputFile,
      createDir: true,
    })
  })
}

async function convertVshapec(inputDir: string, outputDir: string) {
  const files = await glob([path.join(inputDir, '**', '*.vshapec')])
  await withProgressBar({ tasks: files, label: 'Worldprisms' }, async (file, i, log) => {
    const relPath = path.relative(inputDir, file)
    const outPath = path.join(outputDir, relPath + '.json')
    const result = await readVshapecFile(file)
    await writeJSONFile(result, {
      target: outPath,
      createDir: true,
    })
  })
}

async function copyCommonFiles(inputDir: string, outputDir: string) {
  const files = await glob(path.join(inputDir, '**', '*.json'))
  await withProgressBar({ label: 'Copy JSON', tasks: files }, async (file, i, log) => {
    const relPath = path.relative(inputDir, file)
    const outPath = path.join(outputDir, relPath)
    log(relPath)
    await copyFile(file, outPath, {
      createDir: true,
    })
  })
}

async function convertShaders(inputDir: string, outputDir: string) {
  const files = await glob([
    path.join(inputDir, 'shaders', 'cache', 'd3d11', '*.cfib'),
    path.join(inputDir, 'shaders', 'cache', 'd3d11', '*.cfxb'),
  ])
  await withProgressBar({ label: 'Shader', tasks: files }, async (file, i, log) => {
    log(file)
    const code = await readShader(file)
    await writeUTF8File(code, {
      target: path.join(outputDir, path.relative(inputDir, file) + '.hlsl'),
      createDir: true,
    })
  })
}

async function convertObjectStreams({
  inputDir,
  outputDir,
  threads,
}: {
  inputDir: string
  outputDir: string
  threads: number
}) {
  await withProgressBar(
    { label: 'Object Streams', tasks: ['libs', 'coatgen', 'sharedassets', 'slices'] },
    async (dir, i, log) => {
      log(dir)
      await objectStreamConverter(
        {
          exe: 'tools/bin/object-stream-converter.exe',
          input: path.join(inputDir, dir),
          output: path.join(outputDir, dir),
          pretty: true,
          threads: Math.min(Math.max(threads, 1), 10),
        },
        {
          stdio: 'ignore',
        },
      )
    },
  )
}

async function convertImages({
  inputDir,
  outputDir,
  threads,
}: {
  inputDir: string
  outputDir: string
  threads: number
}) {
  const pattern = ['**/images/**/*.dds', '**/images/**/*.png', '**/worldtiles/**/*.dds'].map((it) =>
    path.join(inputDir, it),
  )
  const files = await glob(pattern)
  await runTasks({
    label: 'Images',
    taskName: 'convertDdsToPng',
    threads: threads,
    tasks: files.map((file) => {
      return {
        file,
        inputDir,
        outputDir,
        update: true,
        exe: 'tools/bin/texconv.exe',
      }
    }),
  })
}
