import * as path from 'path'
import { MultiBar, Presets } from 'cli-progress'
import { program } from 'commander'
import { extract } from 'nw-extract'
import { nwData, NW_USE_PTR } from '../env'
import { pakExtractor } from './utils/pak-extractor'

program
  .option('-g, --game <path>', 'game directory')
  .option('-o, --output <path>', 'output directory')
  .option('-t, --threads <threads>', 'Number of threads', Number)
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .option('--full', 'Unpack full game using pak extractor')
  .action(async () => {
    const options = program.opts<{ game: string; output: string; ptr: boolean; threads: number; full: boolean }>()
    options.threads = options.threads ? options.threads : 10

    const inputDir = options.game || nwData.srcDir(options.ptr)!
    const outputDir = options.output || nwData.unpackDir(options.ptr)!
    console.log('[UNPACK]', inputDir)
    console.log('     to:', outputDir)

    if (options.full) {
      await pakExtractor({
        input: path.join(inputDir, 'assets') ,
        output: outputDir,
        fixLua: true,
        decompressAzcs: true,
        threads: options.threads,
      })
    } else {
      await unpack({
        input: inputDir,
        output: outputDir,
        filter: [
          '!server/',
          '!pregame/',
          '**/*.loc.xml',
          '**/images/**/*',
          'coatgen/**/*',
          'sharedassets/**/*.datasheet',
          'sharedassets/coatlicue/**/*',
          'slices/**/*',
        ],
      })
    }
  })

program.parse()

async function unpack(options: { input: string; output: string; filter: string[] }) {
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
