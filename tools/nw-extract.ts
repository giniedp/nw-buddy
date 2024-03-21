import * as path from 'path'
import { MultiBar, Presets } from 'cli-progress'
import { program } from 'commander'
import { extract } from 'nw-extract'
import { environment, NW_WORKSPACE } from '../env'
import { pakExtractor } from './bin/pak-extractor'
import { quickbms } from './bin/quickbms'

enum Unpacker {
  quickbms = 'quickbms',
  nwtools = 'nwtools',
  nwextract = 'nwextract',
}

program
  .option('-g, --game <path>', 'game directory')
  .option('-o, --output <path>', 'output directory')
  .option('-m, --module <module>', 'unpacker module to use', 'nwtools')
  .option('-t, --threads <threads>', 'Number of threads', Number)
  .option('-ws, --workspace <name>', 'workspace dir (live or ptr)', NW_WORKSPACE)
  .action(async () => {
    const options = program.opts<{
      game: string
      output: string
      workspace: boolean
      threads: number
      full: boolean
      module: Unpacker
    }>()

    options.threads = options.threads ? options.threads : 10

    const inputDir = options.game || environment.nwGameDir(options.workspace)!
    const outputDir = options.output || environment.nwUnpackDir(options.workspace)!
    console.log('[UNPACK]', inputDir)
    console.log('     to:', outputDir)
    console.log('  using:', options.module?.length ? options.module : 'ALL')

    if (!Unpacker[options.module]) {
      throw new Error(`Unknown unpacker: ${options.module}`)
    }
    switch (options.module) {
      case Unpacker.nwextract: {
        await unpack({
          input: inputDir,
          output: outputDir,
          libDir: './tools/bin',
          filter: [
            '!server/**/*',
            '!pregame/**/*',
            '!objects/**/*',
            '!sounds/**/*',
            //'!shaders/**/*',
            '!textures/**/*',
            '!**/*.wem', // audio
            '!**/*.bnk', // video
            '!**/*.bk2', // video
          ],
        })
        break
      }
      case Unpacker.nwtools: {
        await pakExtractor({
          exe: './tools/bin/pak-extracter.exe',
          input: path.join(inputDir, 'assets'),
          output: outputDir,
          fixLua: true,
          decompressAzcs: true,
          threads: options.threads,
          exclude: [
            '(pregame|server|timelines)[/\\\\]',
            'lyshineui[/\\\\].*\\.dynamicslice$',
            '\\.dynamicuicanvas$',
          ],
        })
        break
      }
      case Unpacker.quickbms: {
        await quickbms({
          exe: './tools/bin/quickbms.exe',
          script: './tools/bin/quickbms-nw.bms',
          input: path.join(inputDir, 'assets'),
          output: outputDir,
        })
      }
    }
  })

program.parse()

async function unpack(options: { input: string; output: string; filter: string[]; libDir?: string }) {
  const bar = new MultiBar(
    {
      stopOnComplete: true,
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} | {percentage}% | {duration_formatted} | {value}/{total} | {log}',
    },
    Presets.shades_grey
  )
  const b1 = bar.create(0, 0, {})
  const b2 = bar.create(0, 0)

  await extract({
    inputDir: options.input,
    outputDir: options.output,
    filter: options.filter,
    libDir: options.libDir,
    onProgress: (p) => {
      b1.setTotal(p.mainTotal)
      b1.update(p.mainDone, { log: p.mainInfo })
      b2.setTotal(p.subTotal || 1)
      b2.update(p.subDone, { log: p.subInfo })
    },
  })
  b1.update({ log: '' })
  b2.update({ log: '' })
  bar.stop()
}
