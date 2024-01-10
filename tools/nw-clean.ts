import { program } from 'commander'
import * as fs from 'fs'
import { NW_GAME_VERSION, environment } from '../env'

program.option('-ws, --workspace <name>', 'workspace dir (live or ptr)', NW_GAME_VERSION).action(async () => {
  const options = program.opts<{
    workspace: boolean
  }>()

  const unpackDir = environment.nwUnpackDir(options.workspace)!
  const convertDir = environment.nwConvertDir(options.workspace)!

  console.log('[CLEAN]', options.workspace)
  console.log(' unpack dir:', unpackDir)
  console.log('convert dir:', convertDir)

  if (fs.existsSync(unpackDir)) {
    console.log('Cleaning unpack directory...')
    await fs.promises.rm(unpackDir, { recursive: true })
  }
  if (fs.existsSync(convertDir)) {
    console.log('Cleaning convert directory...')
    await fs.promises.rm(convertDir, { recursive: true })
  }
})

program.parse()
