import { program } from 'commander'
import path from 'node:path'
import { z } from 'zod'
import { NW_WORKSPACE, environment } from '../../env'
import { parseDatasheet } from '../file-formats/datasheet'
import { DatasheetFile, datasheetHeader, datasheetRows } from '../file-formats/datasheet/converter'
import { parseLocalizationFile } from '../file-formats/loc/reader'
import { parseLuac } from '../file-formats/luac'
import { GameFs } from '../file-system/game-fs'
import { pakFileSystem } from '../file-system/pak-fs'
import { replaceExtname, withProgressBar, writeFile } from '../utils'
import { isAzcsBuffer } from '../utils/azcs'
import { logger } from '../utils/logger'

const OptionsSchema = z.object({
  workSpace: z.string(),
  files: z.array(z.string()),
})

program
  .command('extract')
  .description('Reads pak files and converts certain files')
  .option('-ws, --work-space <workSpace>', 'Name of the workspace', NW_WORKSPACE)
  .option('-f, --files <pattern...>', '', ['**/*'])
  .action(async (options) => {
    const opt = OptionsSchema.parse(options)
    const gameDir = environment.nwGameDir(opt.workSpace)
    const outDir = environment.nwConvertDir(options.workspace)!
    const nwfs = await pakFileSystem({ gameDir })
    const files = await nwfs.glob(opt.files)
    await withProgressBar({ label: 'Unpack', tasks: files }, async (file) => {
      let data: Buffer = null
      let ext = path.extname(file)
      switch (path.extname(file)) {
        case '.json': {
          data = await readData(nwfs, file)
          break
        }
        case '.xml': {
          if (!file.endsWith('.loc.xml')) {
            return
          }
          data = await readData(nwfs, file)
          const loc = parseLocalizationFile(data)
          const json = JSON.stringify(loc, null, '\t')
          data = Buffer.from(json)
          ext = '.json'
          break
        }
        case '.luac': {
          data = await readData(nwfs, file)
          data = await parseLuac(data)
          // TODO: decompile
          // ext = '.lua'
          break
        }
        case '.datasheet': {
          data = await readData(nwfs, file)
          const sheet = await parseDatasheet(data)
          const json = JSON.stringify(
            {
              header: datasheetHeader(sheet),
              rows: datasheetRows(sheet),
            } satisfies DatasheetFile,
            null,
            '\t',
          )
          data = Buffer.from(json)
          ext = '.json'
          break
        }
        default:
          return
      }
      if (data) {
        writeFile(data, {
          target: path.join(outDir, replaceExtname(file, ext)),
          createDir: true,
          encoding: 'binary',
        })
      }
    })
  })

async function readData(nwfs: GameFs, file: string) {
  let data = await nwfs.readFile(file).catch()
  if (!data) {
    logger.error(`Failed to read ${file}`)
    return
  }
  if (isAzcsBuffer(data)) {
    logger.error(`AZCS not implemented ${file}`)
    return
  }
  return data
}
