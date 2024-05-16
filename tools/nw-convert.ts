import { program } from 'commander'
import { convert } from 'nw-extract'
import { cpus } from 'os'
import * as path from 'path'
import { environment, NW_WORKSPACE } from '../env'
import { objectStreamConverter } from './bin/object-stream-converter'
import { copyFile, glob, replaceExtname, writeJSONFile, writeUTF8File } from './utils/file-utils'

import { readAssetcatalog } from './file-formats/catalog'
import { readDistributionFile } from './file-formats/distribution'
import { readLocalizationFile } from './file-formats/loc/reader'
import { readVshapec } from './file-formats/vshapec'
import { withProgressBar } from './utils'
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

    await convertAssetCatalog(inputDir, outputDir)
    await convertRegionData(inputDir, outputDir)
    await convertBoundaries(inputDir, outputDir)

    if (hasFilter(Converter.locales, options.module)) {
      const locFiles = await glob(path.join(inputDir, 'localization', '**', '*.loc.xml'))
      await withProgressBar({ tasks: locFiles, barName: 'Locales' }, async (file, i, log) => {
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

    if (hasFilter(Converter.shader, options.module)) {
      console.log('Convert Shader Files')
      const files = await glob([
        path.join(inputDir, 'shaders', 'cache', 'd3d11', '*.cfib'),
        path.join(inputDir, 'shaders', 'cache', 'd3d11', '*.cfxb'),
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
    const data = await readDistributionFile(file)
    await writeJSONFile(data, {
      target: outPath,
      createDir: true,
    })
  })
}

async function convertAssetCatalog(inputDir: string, outputDir: string) {
  withProgressBar({ tasks: ['assetcatalog.catalog'], barName: 'Catalog' }, async (file, i, log) => {
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

async function convertBoundaries(inputDir: string, outputDir: string) {
  const files = await glob([path.join(inputDir, '**', '*.vshapec')])
  await withProgressBar({ tasks: files, barName: 'Worldprisms' }, async (file, i, log) => {
    const relPath = path.relative(inputDir, file)
    const outPath = path.join(outputDir, relPath + '.json')
    const result = await readVshapec(file)
    await writeJSONFile(result, {
      target: outPath,
      createDir: true,
    })
  })
}
