import { program } from 'commander'
import fs from 'node:fs'
import { z } from 'zod'
import { NW_WORKSPACE, environment } from '../../../env'
import { logger } from '../utils/logger'

const OptionsSchema = z.object({
  workspace: z.string(),
})

program
  .command('clean')
  .description('Cleans the workspace directories (unpack and convert)')
  .option('-ws, --workspace <workspace>', 'Name of the workspace', NW_WORKSPACE)
  .action(async (options) => {
    const { workspace } = OptionsSchema.parse(options)
    const unpackDir = environment.nwUnpackDir(workspace)!
    const convertDir = environment.nwConvertDir(workspace)!

    logger.info('[CLEAN]', workspace)
    logger.info(' unpack dir:', unpackDir)
    logger.info('convert dir:', convertDir)

    if (fs.existsSync(unpackDir)) {
      logger.info('removing unpack directory...')
      await fs.promises.rm(unpackDir, { recursive: true })
    }
    if (fs.existsSync(convertDir)) {
      logger.info('removing convert directory...')
      await fs.promises.rm(convertDir, { recursive: true })
    }
  })
