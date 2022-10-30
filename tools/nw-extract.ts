import { extract, createFilter, createConverter } from 'nw-extract'
import { program } from 'commander'
import { MultiBar, Presets } from 'cli-progress'
import { NW_USE_PTR, nwData } from '../env'

program
  .option('-g, --game <path>', 'game directory')
  .option('-o, --output <path>', 'output directory')
  .option('-u, --update', 'Force update, skip cache')
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .action(async () => {

    const options = program.opts<{ game: string, output: string, ptr: boolean, update: boolean }>()
    const filter: any[] = [
      // '*',
      'datasheet:json',
      'locale:json',
      'icon:png',
      'image:png',
      '!server/**/*' as any,
      '!pregame/**/*' as any
    ]

    const bar = new MultiBar({
      stopOnComplete: true,
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} {percentage}% | {value}/{total} | {filename}'
    }, Presets.shades_grey)
    const b1 = bar.create(0, 0, {})
    const b2 = bar.create(0, 0)

    const inputDir = options.game || nwData.srcDir(options.ptr)!
    const outputDir = options.output || nwData.tmpDir(options.ptr)!
    console.log('[EXTRACT]', inputDir)
    console.log('      to:', outputDir)

    await extract({
      inputDir: inputDir,
      outputDir: outputDir,
      update: options.update,
      filter: createFilter(filter),
      converterFactory: createConverter(filter),
      onProgress: (p) => {
        b1.setTotal(p.mainTotal)
        b1.update(p.mainDone, { filename: p.mainInfo })

        b2.setTotal(p.subTotal || 1)
        b2.update(p.subDone, { filename: p.subInfo })
      }
    })
    bar.stop()
  })


program.parse()
