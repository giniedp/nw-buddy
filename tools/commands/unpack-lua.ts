import { program } from 'commander'
import { z } from 'zod'
import { NW_WORKSPACE, environment } from '../../env'
import { parseLuac } from '../file-formats/luac'
import { pakFileSystem } from '../file-system/pak-fs'
import { withProgressBar, writeFile } from '../utils'
import { logger } from '../utils/logger'
import path from 'node:path'
import fs from 'node:fs'

const OptionsSchema = z.object({
  workSpace: z.string(),
  outDir: z.string(),
})

program
  .command('unpack-lua')
  .description('Extracts Lua files')
  .option('-ws, --work-space <workSpace>', 'Name of the workspace', NW_WORKSPACE)
  .option('-o, --out-dir <outDir>', 'Output directory', environment.tmpDir('wip'))
  .argument('[datasheet]', 'Name of the datasheet', '**/*.luac')
  .action(async (pattern, options) => {
    const { workSpace, outDir } = OptionsSchema.parse(options)

    const gameDir = environment.nwGameDir(workSpace)
    const nwfs = await pakFileSystem({ gameDir })
    const files = await nwfs.glob(pattern)
    await withProgressBar({ label: 'Lua', tasks: files }, async (file) => {
      if (!file.endsWith('.luac')) {
        logger.error(`Invalid file extension: ${file}`)
        return
      }
      const data = await nwfs.readFile(file).catch()
      if (!data) {
        logger.error(`Failed to read ${file}`)
        return
      }
      const parsed = await parseLuac(data).catch(logger.error)
      if (!parsed) {
        return
      }
      await writeFile(parsed, {
        target: path.join(outDir, file),
        createDir: true,
        encoding: 'binary',
      })
    })
  })
