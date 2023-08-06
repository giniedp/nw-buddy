import { program } from 'commander'
import { BRANCH_NAME, NW_USE_PTR, nwData } from '../env'
import { spawn } from './utils/spawn'
import { mkdir } from './utils/file-utils'
import * as path from 'path'
program
  .requiredOption('-o, --output <path>', 'output directory')
  .option('-m, --module <module>', 'The module to build', BRANCH_NAME === 'main' ? 'storybook' : 'website')
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .action(async () => {
    const options = program.opts<{
      output: string
      ptr: boolean
      module: string
    }>()

    const yarn = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn'
    const spawnOptions = { stdio: 'inherit' } as const

    // ensure nw-data directory exists so storybook does not fail.
    // we build storybook with empty nw-data dir, do avoid high memory error during cloudflare pipeline
    await mkdir(nwData.distDir(options.ptr), { recursive: true })
    if (options.module === 'storybook') {
      await spawn(yarn, ['storybook:build', '--output-dir', options.output], spawnOptions)
    } else {
      await spawn(yarn, ['build:web', '--output-path', options.output], spawnOptions)
    }
  })

program.parse()