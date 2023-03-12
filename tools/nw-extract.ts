import { extract, convert } from 'nw-extract'
import { program } from 'commander'
import { MultiBar, Presets } from 'cli-progress'
import { NW_USE_PTR, nwData } from '../env'
import rimraf from 'rimraf'
import * as path from 'path'
import { glob } from './utils'

program
  .option('-g, --game <path>', 'game directory')
  .option('-o, --output <path>', 'output directory')
  .option('-u, --update', 'Force update')
  .option('-t, --threads <threads>', 'Number of threads', Number)
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .action(async () => {
    const options = program.opts<{ game: string; output: string; ptr: boolean; update: boolean; threads: number }>()
    options.update = !!options.update
    options.threads = options.threads ? options.threads : 10
    const inputDir = options.game || nwData.srcDir(options.ptr)!
    const outputDir = options.output || nwData.tmpDir(options.ptr)!
    console.log('[EXTRACT]', inputDir)
    console.log('      to:', outputDir)
    console.log('  update:', options.update)
    console.log(' threads:', options.threads)

    await runExtraction({
      input: inputDir,
      output: outputDir,
      filter: [
        '!server/',
        '!pregame/',
        '**/*.loc.xml',
        '**/*.datasheet',
        '**/images/**/*',
        'slices/**/*'
      ],
    })

    console.log('Convert Datasheets')
    await convert({
      inputDir: outputDir,
      update: !!options.update,
      threads: options.threads,
      conversions: [
        {
          format: 'json',
          pattern: ['**/*.datasheet'],
        },
      ],
    })

    console.log('Convert Locales')
    await convert({
      inputDir: outputDir,
      update: !!options.update,
      threads: options.threads,
      conversions: [
        {
          format: 'json',
          pattern: ['**/*.loc.xml'],
        },
      ],
    })

    console.log('Convert Images')
    await convert({
      inputDir: outputDir,
      update: !!options.update,
      threads: options.threads,
      conversions: [
        {
          format: 'png',
          pattern: ['**/*.dds'],
        },
      ],
    })

    const files = await glob([
      path.join(outputDir, '**/*.datasheet'),
      path.join(outputDir, '**/*.loc.xml'),
      path.join(outputDir, '**/*.dds'),
      path.join(outputDir, '**/*.dds.*')
    ])
    await rimraf(files)
  })

program.parse()

async function runExtraction(options: { input: string; output: string; filter: string[] }) {
  const bar = new MultiBar(
    {
      stopOnComplete: true,
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} {percentage}% | {value}/{total} | {filename}',
    },
    Presets.shades_grey
  )
  const b1 = bar.create(0, 0, {})
  const b2 = bar.create(0, 0)

  await extract({
    inputDir: options.input,
    outputDir: options.output,
    filter: options.filter,
    onProgress: (p) => {
      b1.setTotal(p.mainTotal)
      b1.update(p.mainDone, { filename: p.mainInfo })
      b2.setTotal(p.subTotal || 1)
      b2.update(p.subDone, { filename: p.subInfo })
    },
  })
  bar.stop()
}
