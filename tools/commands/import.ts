import { program } from 'commander'
import fs from 'node:fs'
import { cpus } from 'node:os'
import path from 'node:path'
import { z } from 'zod'
import { NW_WORKSPACE, environment } from '../../env'
import { localeImageScanner, processLocale, scanLocaleDictionary } from '../transform/locales'
import { processConstants } from '../transform/process-constants'
import { processSlices } from '../transform/process-slices'
import { processSpells } from '../transform/process-spells'
import { generateSearch } from '../transform/search'
import { generateTableCode, processTables } from '../transform/tables'
import { formatTs, jsonStringifyFormatted, withProgressBar } from '../utils'
import { glob, mkdir, readJSONFile, replaceExtname, writeFile, writeJSONFile, writeUTF8File } from '../utils/file-utils'
import { logger } from '../utils/logger'
import { runTasks } from '../worker/runner'

enum ResourceType {
  slices = 'slices',
  locale = 'locale',
  tables = 'tables',
  images = 'images',
  types = 'types',
  search = 'search',
  code = 'code',
}

const OptionsSchema = z.object({
  workspace: z.string(),
  update: z.boolean().optional(),
  threads: z.number().optional(),
})

function tablesDir(outDir: string) {
  return path.join(outDir, 'datatables')
}
function generatedDir(outDir: string) {
  return path.join(outDir, 'generated')
}
function localeDir(outDir: string) {
  return path.join(outDir, 'localization')
}

program
  .command('import')
  .description('Imports data to nw-buddy')
  .option('-u, --update', 'Force update')
  .option('-t, --threads <threads>', 'Number of threads', Number)
  .option('-ws, --workspace <name>', 'workspace (live or ptr)', NW_WORKSPACE)
  .argument('[type]', 'The resource type to (re)import. If not specified, all resources will be (re)imported.')
  .action(async (type: ResourceType, args) => {
    const options = OptionsSchema.parse(args)
    options.update = !!options.update
    options.threads = options.threads || cpus().length
    const unpackDir = environment.nwUnpackDir(options.workspace)
    const convertDir = environment.nwConvertDir(options.workspace)
    const importDir = environment.nwDataDir(options.workspace)

    const outputTypesDir = environment.libsDir('nw-data', 'generated')

    logger.info('[IMPORT]', convertDir)
    logger.info('      to:', importDir)
    logger.info('  update:', options.update)
    logger.info(' threads:', options.threads)
    // logger.verbose(options.threads <= 1)

    if (!type || type === ResourceType.slices) {
      await importSlices({
        inputDir: convertDir,
        outputDir: importDir,
        threads: options.threads,
      })
    }
    if (!type || type === ResourceType.locale) {
      await importLocale({ inputDir: convertDir, outputDir: importDir })
    }
    if (!type || type === ResourceType.tables) {
      await importTables({ inputDir: convertDir, outputDir: importDir })
    }
    if (!type || type === ResourceType.code) {
      await generateCode({ inputDir: convertDir, outputDir: importDir, codeDir: outputTypesDir })
    }
    if (!type || type === ResourceType.images) {
      await importImages({
        inputDir: convertDir,
        outputDir: importDir,
        update: options.update,
        threads: options.threads,
      })
    }
    if (!type || type === ResourceType.search) {
      await importSearch({
        inputDir: convertDir,
        outputDir: importDir,
      })
    }
  })

async function importSlices({
  inputDir,
  outputDir,
  threads,
}: {
  inputDir: string
  outputDir: string
  threads: number
}) {
  const jsonOutDir = generatedDir(outputDir)

  await processSlices({ inputDir, threads: threads }).then((data) => {
    console.log('  ', data.vitals.length, 'vitals')
    console.log('  ', data.vitalsModels.length, 'vitals models')
    console.log('  ', data.gatherables.length, 'gatherables')
    console.log(
      '  ',
      data.variations.variationCount,
      'variations',
      data.variations.chunks.length,
      'chunks',
      data.variations.entryCount,
      'entries',
    )
    console.log('  ', data.territories.length, 'territories')
    console.log('  ', data.loreItems.length, 'lore items')

    return Promise.all([
      // write it into input directory, so table loader will pick it up
      writeJSONFile(data.vitals, {
        target: path.join(jsonOutDir, 'vitals_metadata.json'),
        createDir: true,
        serialize: jsonStringifyFormatted,
      }),
      writeJSONFile(data.vitalsModels, {
        target: path.join(jsonOutDir, 'vitals_models_metadata.json'),
        createDir: true,
        serialize: jsonStringifyFormatted,
      }),
      writeJSONFile(data.territories, {
        target: path.join(jsonOutDir, 'territories_metadata.json'),
        createDir: true,
        serialize: jsonStringifyFormatted,
      }),
      writeJSONFile(data.gatherables, {
        target: path.join(jsonOutDir, 'gatherables_metadata.json'),
        createDir: true,
        serialize: jsonStringifyFormatted,
      }),
      writeJSONFile(data.loreItems, {
        target: path.join(jsonOutDir, 'lore_metadata.json'),
        createDir: true,
        serialize: jsonStringifyFormatted,
      }),
      writeJSONFile(data.variations.records, {
        target: path.join(jsonOutDir, 'variations_metadata.json'),
        createDir: true,
        serialize: jsonStringifyFormatted,
      }),
      ...data.variations.chunks.map(async (chunk, index) => {
        const file = path.join(jsonOutDir, `variations_metadata.${index}.chunk`)
        await mkdir(path.dirname(file), { recursive: true })
        await fs.promises.writeFile(file, chunk)
      }),
    ])
  })
}

async function importLocale({ inputDir, outputDir }: { inputDir: string; outputDir: string }) {
  const files = await glob(path.join(inputDir, 'localization', '**', '*.loc.json'))
  const locales = await processLocale(files)
  await withProgressBar({ label: 'Writing Locale', tasks: Object.keys(locales) }, async (locale) => {
    const dict = locales[locale]
    const outPath = path.join(localeDir(outputDir), locale + '.json')
    await writeJSONFile(dict, {
      target: outPath,
      createDir: true,
    })
  })
}

async function importTables({ inputDir, outputDir }: { inputDir: string; outputDir: string }) {
  const tablesDir = path.join(inputDir, 'sharedassets/springboardentitites')
  const files = await glob(path.join(tablesDir, 'datatables', '**', '*.json'))
  const tables = await processTables({ inputDir, files })
  await withProgressBar({ label: 'Writing Tables', tasks: Object.keys(tables) }, async (file) => {
    const relPath = path.relative(tablesDir, file)
    const outPath = path.join(outputDir, relPath)
    const sheet = tables[file]
    await writeJSONFile(sheet.rows, {
      target: outPath,
      createDir: true,
    })
  })

  const jsonOutDir = generatedDir(outputDir)
  await processSpells({ inputDir }).then((data) => {
    writeJSONFile(data, {
      target: path.join(jsonOutDir, 'spells_metadata.json'),
      createDir: true,
      serialize: jsonStringifyFormatted,
    })
  })
}

async function generateCode({
  inputDir,
  outputDir,
  codeDir,
}: {
  inputDir: string
  outputDir: string
  codeDir: string
}) {
  const tablesDir = path.join(inputDir, 'sharedassets/springboardentitites')
  await generateTableCode({
    metaFiles: await glob(path.join(outputDir, 'generated', '*.json')),
    tableFiles: await glob(path.join(tablesDir, 'datatables', '**', '*.json')).then((files) => {
      return files.map((file) => path.relative(tablesDir, file))
    }),
    getHeader: async (file) => readJSONFile<any>(path.join(tablesDir, file)).then((it) => it.header),
    getRows: async (file) => readJSONFile(path.join(outputDir, file)),
  }).then(async (files) => {
    for (const file of files) {
      const content = await formatTs(file.content)
      await writeUTF8File(content, {
        target: path.join(codeDir, file.name),
        createDir: true,
      })
    }
  })

  await processConstants({ inputDir }).then(async (tsCode) => {
    tsCode = await formatTs(tsCode)
    return writeUTF8File(tsCode, {
      target: path.join(codeDir, 'constants.ts'),
      createDir: true,
    })
  })
}

async function importImages({
  outputDir,
  inputDir,
  update,
  threads,
}: {
  inputDir: string
  outputDir: string
  update: boolean
  threads: number
}) {
  const images = new Set<string>()

  const worldTiles = await glob(path.join(inputDir, '**', 'worldtiles', '**', '*.png'))
  for (const file of worldTiles) {
    images.add(path.relative(inputDir, file))
  }

  const tablesFiles = await glob(path.join(outputDir, 'datatables', '**', '*.json'))
  await withProgressBar({ tasks: tablesFiles, label: 'Image Scan Tables' }, async (file) => {
    const rows = await readJSONFile<Array<Record<string, any>>>(file)
    for (const row of rows) {
      for (const key in row) {
        const value = row[key]
        if (typeof value === 'string' && value.startsWith('lyshineui') && value.endsWith('.webp')) {
          images.add(value)
        }
      }
    }
  })

  const localeFiles = await glob(path.join(outputDir, 'localization', '*.json'))
  await withProgressBar({ tasks: localeFiles, label: 'Image Scan Locale' }, async (file) => {
    const imageScanner = localeImageScanner()
    const dict = await readJSONFile<Record<string, string>>(file)
    scanLocaleDictionary(dict, [imageScanner])
    for (const image of imageScanner.images) {
      images.add(image)
    }
  })

  await runTasks({
    label: 'Image to WEBP',
    taskName: 'convertPngToWebp',
    threads: threads,
    tasks: Array.from(images).map((file) => {
      return {
        input: path.resolve(inputDir, replaceExtname(file, '.png')),
        output: path.resolve(outputDir, replaceExtname(file, '.webp')),
        update: update,
      }
    }),
  })
}

async function importSearch({ inputDir, outputDir }: { inputDir: string; outputDir: string }) {
  const tablesFiles = await glob(path.join(inputDir, 'sharedassets/springboardentitites/datatables', '**', '*.json'))
  const localeFiles = await glob(path.join(outputDir, 'localization', '*.json'))
  await generateSearch({
    localeFiles,
    tablesFiles,
    onFileReady: async (file, data) => {
      await writeFile(data, {
        target: path.join(outputDir, 'search', path.basename(file)),
        createDir: true,
        encoding: 'utf-8',
      })
    },
  })
}
