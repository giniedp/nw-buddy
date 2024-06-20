// import { program } from 'commander'
// import * as fs from 'fs'
// import { cpus } from 'os'
// import * as path from 'path'
// import { environment, NW_WORKSPACE } from '../env'
// import { generateTypes } from './code-gen/code-generate'
// import { generateConstants } from './code-gen/generate-constants'
// import { extractConstants } from './importer/extract-constants'
// import { extractLocaleDiffs } from './importer/extract-locale-diffs'
// import { extractLocaleEmbeds } from './importer/extract-locale-embeds'
// import { importImages } from './importer/images'
// import { importLocales, LOCALE_KEYS_TO_KEEP } from './importer/locales'
// import { generateSearch } from './importer/search'
// import { importSlices } from './importer/slices/import-slices'
// import { importSpells } from './importer/slices/import-spells'
// import { importDatatables, pathToDatatables } from './importer/tables'
// import { formatTs, glob, jsonStringifyFormatted, withProgressBar, writeJSONFile, writeUTF8File } from './utils'
// function collect(value: string, previous: string[]) {
//   return previous.concat(value.split(','))
// }

// function hasFilter(filter: string, filters: string[]) {
//   return !filters?.length || filters.includes(filter)
// }

// enum Importer {
//   types = 'types',
//   tables = 'tables',
//   locales = 'locales',
//   images = 'images',
//   slices = 'slices',
//   index = 'index',
// }

// program
//   .option('-i, --input <path>', 'input directory')
//   .option('-u, --update', 'Update existing files from previous import')
//   .option('-m, --module <module>', 'Specific importer module to run', collect, [])
//   .option('-t, --threads <threads>', 'Number of worker threads', Number)
//   .option('-ws, --workspace <name>', 'workspace dir (live or ptr)', NW_WORKSPACE)
//   .action(async () => {
//     const options = program.opts<{
//       input: string
//       output: string
//       workspace: string
//       update: boolean
//       module: string[]
//       threads: number
//     }>()
//     const inputDir = options.input || environment.nwConvertDir(options.workspace)!
//     const distDir = environment.nwDataDir(options.workspace)!
//     const typesDir = environment.libsDir('nw-data', 'generated')
//     const threads = options.threads || cpus().length
//     const tablesOutDir = path.join(distDir, 'datatables')
//     const tmpDir = path.join('tmp', options.workspace)

//     console.log('[IMPORT]', inputDir)
//     console.log('     to:', distDir)
//     console.log('  types:', typesDir)
//     console.log('modules:', options.module?.length ? options.module : 'ALL')
//     console.log(' threads:', threads)

//     if (options.module.some((it) => !Importer[it])) {
//       throw new Error(`Unknown importer module: ${options.module}`)
//     }

//     if (hasFilter(Importer.slices, options.module)) {
//       console.log('Spells')
//       await importSpells({
//         inputDir: inputDir,
//       }).then((data) => {
//         console.log('  ', data.length, 'spells')
//         // write it into input directory, so table loader will pick it up
//         writeJSONFile(data, {
//           target: path.join(pathToDatatables(inputDir), 'generated_spells_metadata.json'),
//           createDir: true,
//         })
//         writeJSONFile(data, {
//           target: path.join(tmpDir, 'spells.json'),
//           createDir: true,
//         })
//       })
//       console.log('Slices')
//       await importSlices({
//         inputDir,
//         threads,
//       }).then(async ({ gatherables, vitals, vitalsModels, variations, territories, loreItems }) => {
//         console.log('  ', vitals.length, 'vitals')
//         console.log('  ', vitalsModels.length, 'vitals models')
//         console.log('  ', gatherables.length, 'gatherables')
//         console.log(
//           '  ',
//           variations.variationCount,
//           'variations',
//           variations.chunks.length,
//           'chunks',
//           variations.entryCount,
//           'entries',
//         )
//         console.log('  ', territories.length, 'territories')
//         console.log('  ', loreItems.length, 'lore items')

//         return Promise.all([
//           // write it into input directory, so table loader will pick it up
//           writeJSONFile(vitals, {
//             target: path.join(pathToDatatables(inputDir), 'generated_vitals_metadata.json'),
//             createDir: true,
//             serialize: jsonStringifyFormatted,
//           }),
//           writeJSONFile(vitalsModels, {
//             target: path.join(pathToDatatables(inputDir), 'generated_vitals_models_metadata.json'),
//             createDir: true,
//             serialize: jsonStringifyFormatted,
//           }),
//           writeJSONFile(territories, {
//             target: path.join(pathToDatatables(inputDir), 'generated_territories_metadata.json'),
//             createDir: true,
//             serialize: jsonStringifyFormatted,
//           }),
//           writeJSONFile(gatherables, {
//             target: path.join(pathToDatatables(inputDir), 'generated_gatherables_metadata.json'),
//             createDir: true,
//             serialize: jsonStringifyFormatted,
//           }),
//           writeJSONFile(variations.records, {
//             target: path.join(pathToDatatables(inputDir), 'generated_variations_metadata.json'),
//             createDir: true,
//             serialize: jsonStringifyFormatted,
//           }),
//           writeJSONFile(loreItems, {
//             target: path.join(pathToDatatables(inputDir), 'generated_lore_metadata.json'),
//             createDir: true,
//             serialize: jsonStringifyFormatted,
//           }),
//           ...variations.chunks.map(async (chunk, index) => {
//             await fs.promises.writeFile(path.join(tmpDir, `variations.${index}.chunk`), chunk)
//             await fs.promises.writeFile(
//               path.join(pathToDatatables(inputDir), `generated_variations_metadata.${index}.chunk`),
//               chunk,
//             )
//             await fs.promises.writeFile(path.join(tablesOutDir, `generated_variations_metadata.${index}.chunk`), chunk)
//           }),
//         ])
//       })
//     }

//     console.log('Tables')
//     const tables = await importDatatables(inputDir)
//     const localeImages: string[] = []
//     if (hasFilter(Importer.locales, options.module)) {
//       console.log('Locales')
//       const localesInputDir = path.join(inputDir, 'localization')
//       const localesOutputDir = path.join(distDir, 'localization')
//       await importLocales({
//         input: localesInputDir,
//         output: localesOutputDir,
//         tables: tables.map(({ data }) => data),
//         preserveKeys: LOCALE_KEYS_TO_KEEP,
//       })
//       await glob(path.join(localesOutputDir, '**/*.json')).then((files) => {
//         for (const file of files) {
//           const stat = fs.statSync(file)
//           console.log('  ', Number((stat.size / 1024 / 1024).toFixed(2)), 'MB |', file)
//         }
//       })

//       await extractLocaleEmbeds(localesInputDir).then((data) => {
//         data.images.forEach((img) => {
//           if (!img.includes(`{`)) {
//             localeImages.push(img)
//           }
//         })
//         fs.writeFileSync(path.join(tmpDir, 'expressions.json'), JSON.stringify(data, null, 2))
//       })

//       await extractLocaleDiffs(localesInputDir).then((result) => {
//         for (const { locale, csv, ascii } of result) {
//           fs.writeFileSync(path.join(tmpDir, `expressions-diffs-${locale}.csv`) , csv)
//           fs.writeFileSync(path.join(tmpDir, `expressions-diffs-${locale}.txt`) , ascii)
//         }
//       })
//     }

//     if (hasFilter(Importer.images, options.module)) {
//       console.log('Images')
//       const worldTiles = await glob(path.join(inputDir, '**', 'worldtiles', '**', '*.png')).then((files) => {
//         return files.map((it) => path.relative(inputDir, it))
//       })
//       await importImages({
//         staticImages: [...localeImages, ...worldTiles],
//         input: inputDir,
//         output: distDir,
//         update: options.update,
//         tables: tables.map(({ data }) => data),
//         shouldIgnore: (key, img, obj) => {
//           if (key !== 'HiResIconPath') {
//             return false
//           }
//           if ('MountId' in obj) {
//             return false
//           }
//           return true
//         },
//         threads: threads,
//         rewritePath: (value) => {
//           return path.join('nw-data', value).replace(/\\/g, '/')
//         },
//       })
//     }

//     if (hasFilter(Importer.tables, options.module)) {
//       console.log('Tables')

//       const oldFiles = await glob(path.join(tablesOutDir, '**/javelindata_*.json'))
//       const newFiles = tables
//         .map(({ file }) => path.join(tablesOutDir, file))
//         .map((it) => it.toLowerCase().replace(/\\/g, '/'))
//       const toRemove = oldFiles
//         .map((it) => it.toLowerCase().replace(/\\/g, '/'))
//         .filter((it) => {
//           return !newFiles.includes(it)
//         })

//       if (toRemove.length) {
//         await withProgressBar({ label: 'Remove', tasks: toRemove }, async (file, _, log) => {
//           await fs.promises.unlink(file)
//         })
//       }
//       await withProgressBar({ label: 'Write', tasks: tables }, async ({ file, data }, _, log) => {
//         const jsonPath = path.join(tablesOutDir, file)
//         log(jsonPath)
//         const isGenerated = file.includes('generated')
//         await writeJSONFile(data, {
//           target: jsonPath,
//           createDir: true,
//           serialize: isGenerated ? jsonStringifyFormatted : null,
//         })
//       })

//       const stats = newFiles.map((file) => {
//         const stat = fs.statSync(file)
//         return {
//           file,
//           size: stat.size,
//         }
//       })
//       const totalSizeInMB = stats.reduce((acc, { size }) => acc + size, 0) / 1024 / 1024
//       console.log('  ', Number(totalSizeInMB.toFixed(2)), 'MB |', 'total size')
//       const filesLargerThan10MB = stats.filter(({ size }) => size > 5 * 1024 * 1024).sort((a, b) => b.size - a.size)
//       if (filesLargerThan10MB.length) {
//         console.log(`  Files larger than 5 MB`)
//         for (const file of filesLargerThan10MB) {
//           console.log('  ', Number((file.size / 1024 / 1024).toFixed(2)), 'MB |', file.file)
//         }
//       }
//       // console.log('collect abilities')
//       // await extractAbilities(inputDir, 'tmp')

//       // console.log('check damage tables')
//       // checkDamageTables(tables)
//     }

//     if (hasFilter(Importer.types, options.module)) {
//       console.log('generate types')
//       await generateTypes(typesDir, tables)
//       await extractConstants(inputDir)
//         .then((data) => formatTs(generateConstants(data)))
//         .then((content) => {
//           return writeUTF8File(content, {
//             target: path.join(typesDir, 'constants.ts'),
//             createDir: true,
//           })
//         })
//     }

//     if (hasFilter(Importer.index, options.module)) {
//       console.log('generate search')
//       await generateSearch({
//         localesDir: path.join(distDir, 'localization'),
//         tablesDir: path.join(distDir, 'datatables'),
//         outDir: path.join(distDir, 'search'),
//       })

//       // console.log('collect loot tags')
//       // await extractLootTags({
//       //   tablesDir: path.join(distDir, 'datatables'),
//       //   outFile: path.join('tmp', 'loot-tags.json'),
//       // })
//     }
//   })
//   .parse(process.argv)
