import { program } from 'commander'
import { convert } from 'nw-extract'
import * as path from 'path'
import { nwData, NW_USE_PTR } from '../env'
import { objectStreamConverter } from './utils/object-stream-converter'

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
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .action(async () => {
    const options =
      program.opts<{
        input: string
        output: string
        ptr: boolean
        update: boolean
        threads: number
        module: string[]
      }>()
    options.update = !!options.update
    options.threads = options.threads ? options.threads : 10
    const inputDir = path.join(process.cwd(), options.input || nwData.unpackDir(options.ptr)!)
    const outputDir = options.output || nwData.tmpDir(options.ptr)!
    console.log('[CONVERT]', inputDir)
    console.log('      to:', outputDir)
    console.log('  update:', options.update)
    console.log(' threads:', options.threads)
    console.log('modules:', options.module?.length ? options.module : 'ALL')

    if (options.module.some((it) => !Converter[it])) {
      throw new Error(`Unknown importer module: ${it}`)
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

    if (hasFilter(Converter.locales, options.module)) {
      console.log('Convert Locales')
      await convert({
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

    // if (hasFilter(Converter.slices, options.module)) {
    //   console.log('Convert Slices')
    //   await objectStreamConverter({
    //     input: path.join(inputDir),
    //     output: path.join(outputDir),
    //     pretty: true,
    //     threads: options.threads,
    //   })
    // }
  })

program.parse()
