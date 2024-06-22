import { program } from 'commander'
import path from 'node:path'
import { z } from 'zod'
import { NW_WORKSPACE, environment } from '../../env'
import { pakExtractor } from '../bin/pak-extractor'
import { logger } from '../utils/logger'

const OptionsSchema = z.object({
  threads: z.number().optional(),
  workspace: z.string(),
  executable: z.string(),
})

program
  .command('unpack')
  .description('Unpacks files with pak-extracter.exe')
  .option('-t, --threads <threads>', 'Number of threads', Number)
  .option('-ws, --workspace <workspace>', 'Name of the workspace', NW_WORKSPACE)
  .option('-exe, --executable <path>', 'path to the unpacker executable', './tools/bin/pak-extracter.exe')
  .action(async (args) => {
    const options = OptionsSchema.parse(args)
    options.threads = options.threads ? options.threads : 10

    const inputDir = environment.nwGameDir(options.workspace)
    const outputDir = environment.nwUnpackDir(options.workspace)
    logger.info('[UNPACK]', inputDir)
    logger.info('     to:', outputDir)
    logger.debug(options)
    logger.verbose(true)

    await pakExtractor({
      exe: options.executable,
      input: path.join(inputDir, 'assets'),
      output: outputDir,
      fixLua: true,
      decompressAzcs: true,
      threads: options.threads,
      // prettier-ignore
      exclude: [
        '(pregame|server|timelines)[/\\\\]',
        'lyshineui[/\\\\].*\\.dynamicslice$',
        '\\.dynamicuicanvas$'
      ],
    }, {
      stdio: 'pipe',
    })
  })
