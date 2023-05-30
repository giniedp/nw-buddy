import { program } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import { nwData, NW_USE_PTR } from '../env'
import { generateTypes } from './code-gen/code-generate'
import { extractExpressions } from './importer/extractExpressions'
import { importImages } from './importer/images'
import {
  importDatatables,
  pathToDatatables,
  rewriteImagePathRule,
  TABLE_GLOB_PATTERNS,
  TABLE_REMAP_RULES,
} from './importer/tables'
import { importLocales, LOCALE_KEYS_TO_KEEP } from './importer/locales'
import { importSlices } from './importer/slices/import-slices'
import { withProgressBar, writeJSONFile } from './utils'
import { cpus } from 'os'
function collect(value: string, previous: string[]) {
  return previous.concat(value.split(','))
}

function hasFilter(filter: string, filters: string[]) {
  return !filters?.length || filters.includes(filter)
}

enum Importer {
  types = 'types',
  tables = 'tables',
  locales = 'locales',
  images = 'images',
  vitals = 'vitals',
}

program
  .option('-i, --input <path>', 'input directory')
  .option('-u, --update', 'Update existing files from previous import')
  .option('-m, --module <module>', 'Specific importer module to run', collect, [])
  .option('-t, --threads <threads>', 'Number of worker threads', Number)
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .action(async () => {
    const options =
      program.opts<{
        input: string
        output: string
        ptr: boolean
        update: boolean
        module: string[]
        threads: number
      }>()
    const inputDir = options.input || nwData.tmpDir(options.ptr)!
    const distDir = nwData.distDir(options.ptr)!
    const publicDir = nwData.assetPath(options.ptr)
    const typesDir = path.join(nwData.cwd, 'libs', 'nw-data', 'generated')
    const threads = options.threads || cpus().length

    console.log('[IMPORT]', inputDir)
    console.log('     to:', distDir)
    console.log(' images:', publicDir)
    console.log('  types:', typesDir)
    console.log('modules:', options.module?.length ? options.module : 'ALL')
    console.log(' threads:', threads)

    if (options.module.some((it) => !Importer[it])) {
      throw new Error(`Unknown importer module: ${it}`)
    }

    if (hasFilter(Importer.vitals, options.module)) {
      console.log('Slices')
      await importSlices({
        inputDir,
        threads,
      }).then(({ gatherables, vitals }) => {
        return Promise.all([
          // write it into input directory, so table loader will pick it up
          writeJSONFile(vitals, path.join(pathToDatatables(inputDir), 'javelindata_vitalsmetadata.json'), {
            createDir: true,
          }),
          writeJSONFile(vitals, path.join('tmp', 'vitals.json'), {
            createDir: true,
          }),

          // write it into input directory, so table loader will pick it up
          writeJSONFile(gatherables, path.join(pathToDatatables(inputDir), 'javelindata_gatherablesmetadata.json'), {
            createDir: true,
          }),
          writeJSONFile(gatherables, path.join('tmp', 'gatherables.json'), {
            createDir: true,
          }),
        ])
      })
    }

    console.log('Tables')
    const tables = await importDatatables({
      inputDir: inputDir,
      patterns: TABLE_GLOB_PATTERNS,
      remap: TABLE_REMAP_RULES,
      rewrite: [rewriteImagePathRule(inputDir)],
    })

    if (hasFilter(Importer.locales, options.module)) {
      console.log('Locales')
      await importLocales({
        input: inputDir,
        output: path.join(distDir, 'localization'),
        tables: tables.map(({ data }) => data),
        preserveKeys: LOCALE_KEYS_TO_KEEP,
      }).then((files) => {
        extractExpressions({
          locales: files,
          output: './tmp/expressions.json',
        })
      })
    }

    if (hasFilter(Importer.images, options.module)) {
      console.log('Images')
      await importImages({
        input: inputDir,
        output: distDir,
        update: options.update,
        tables: tables.map(({ data }) => data),
        ignoreKeys: ['HiResIconPath'],
        threads: threads,
        rewritePath: (value) => {
          return path.join(publicDir, value).replace(/\\/g, '/')
        },
      })
    }

    if (hasFilter(Importer.tables, options.module)) {
      console.log('Tables')
      await withProgressBar({ barName: 'Write', tasks: tables }, async ({ relative, data }, _, log) => {
        const jsonPath = path.join(distDir, 'datatables', relative)
        log(jsonPath)
        await writeJSONFile(data, jsonPath, {
          createDir: true,
        })
      })

      // console.log('collect loot tags')
      // await extractLootTags(inputDir, 'tmp')

      // console.log('collect abilities')
      // await extractAbilities(inputDir, 'tmp')

      // console.log('check damage tables')
      // checkDamageTables(tables)
    }

    if (hasFilter(Importer.types, options.module)) {
      console.log('generate types')
      await generateTypes(typesDir, tables)
    }
  })
  .parse(process.argv)
