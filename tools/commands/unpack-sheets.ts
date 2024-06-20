import { program } from 'commander'
import { z } from 'zod'
import { NW_WORKSPACE, environment } from '../../env'
import { parseDatasheet } from '../file-formats/datasheet'
import { datasheetRows } from '../file-formats/datasheet/converter'
import { pakFileSystem } from '../file-system/pak-fs'
import { replaceExtname, withProgressBar, writeJSONFile } from '../utils'
import { logger } from '../utils/logger'

const OptionsSchema = z.object({
  workSpace: z.string(),
  outDir: z.string(),
})

program
  .command('unpack-sheets')
  .description('Extracts datasheets')
  .option('-ws, --work-space <workSpace>', 'Name of the workspace', NW_WORKSPACE)
  .option('-o, --out-dir <outDir>', 'Output directory', environment.tmpDir('wip'))
  .argument('[datasheet]', 'Name of the datasheet', '**/*.datasheet')
  .action(async (pattern, options) => {
    const { workSpace } = OptionsSchema.parse(options)

    const gameDir = environment.nwGameDir(workSpace)
    const fs = await pakFileSystem({ gameDir })
    const files = await fs.glob(pattern)
    await withProgressBar({ label: 'Datasheets', tasks: files }, async (file) => {
      const data = await fs.readFile(file).catch()
      if (!data) {
        logger.error(`Failed to read ${file}`)
        return
      }
      const sheet = await parseDatasheet(data).catch(logger.error)
      if (!sheet) {
        logger.error(`Failed to parse ${file}`)
        return
      }
      const rows = datasheetRows(sheet)
      const output = environment.tmpDir('datasheets', replaceExtname(file, '.json'))
      await writeJSONFile(rows, {
        target: output,
        createDir: true,
      })
      //logger.info(sheet.name, sheet.type)
    })
  })
