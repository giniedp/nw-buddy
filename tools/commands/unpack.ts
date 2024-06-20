import { program } from 'commander'
import { z } from 'zod'
import { NW_WORKSPACE, environment } from '../../env'
import { pakFileSystem } from '../file-system/pak-fs'
import { withProgressBar } from '../utils'
import { isAzcsBuffer } from '../utils/azcs'
import { logger } from '../utils/logger'

const OptionsSchema = z.object({
  workSpace: z.string(),
  outDir: z.string(),
})

program
  .command('unpack')
  .description('Extracts Files')
  .option('-ws, --work-space <workSpace>', 'Name of the workspace', NW_WORKSPACE)
  .option('-o, --out-dir <outDir>', 'Output directory', environment.tmpDir('wip'))
  .argument('[pattern]', 'files to extract', '**/*.*')
  .action(async (pattern, options) => {
    const { workSpace, outDir } = OptionsSchema.parse(options)

    const gameDir = environment.nwGameDir(workSpace)
    const nwfs = await pakFileSystem({ gameDir })
    const files = await nwfs.glob(pattern)
    await withProgressBar({ label: 'Unpack', tasks: files }, async (file) => {
      const data = await nwfs.readFile(file).catch()
      if (!data) {
        logger.error(`Failed to read ${file}`)
        return
      }
      if (isAzcsBuffer(data)) {
        logger.debug(`Unpacking ${file}`)
      }
    })
  })
