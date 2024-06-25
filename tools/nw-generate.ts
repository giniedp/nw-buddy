import { program } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'
import type { EnvVars } from '../apps/web/environments/env'
import { BRANCH_NAME, CDN_URL, COMMIT_HASH, IS_CI, NW_BADGE, NW_WATERMARK, NW_WORKSPACE, PACKAGE_VERSION, environment } from '../env'
import { tsFromSliceFiles } from './lib/file-formats/slices/generate-slice-types'
import { useProgressBar } from './lib/utils'
import { glob, readJSONFile, writeUTF8File } from './lib/utils/file-utils'

program
  .command('icons')
  .description('Precompiles svg icons')
  .action(async (data) => {
    const files = await glob(environment.appsDir('**', '*.svg'))
    const indices: Record<string, string[]> = {}
    for (const file of files) {
      const dirname = path.dirname(file)
      const baseName = path.basename(file, path.extname(file))
      indices[dirname] = indices[dirname] || []
      indices[dirname].push(baseName)
      const constName =
        'svg' +
        baseName
          .split(/[\-]/)
          .map((it) => it[0].toUpperCase() + it.slice(1))
          .join('')
      const tsFile = path.join(path.dirname(file), `${baseName}.ts`)
      const data = fs.readFileSync(file, { encoding: 'utf8' })
      fs.writeFileSync(tsFile, `export const ${constName} = ${JSON.stringify(data)}`)
    }
    for (const [dirname, names] of Object.entries(indices)) {
      const tsFile = path.join(dirname, 'index.ts')
      const lines = names.map((name) => `export * from './${name}'`)
      fs.writeFileSync(tsFile, lines.join('\n'))
    }
  })

program
  .command('slice-types')
  .description('Generates typescript types from dynamicslice.json files.')
  .action(async () => {
    const rootDir = environment.nwConvertDir('live')
    const files = await glob(path.join(rootDir, '**', '*.dynamicslice.json'))
    const code = await useProgressBar('Scanning', async (bar) => {
      bar.start(files.length, 0, { log: '' })
      return await tsFromSliceFiles(files, (file, index) => {
        bar.update(index, { log: path.relative(rootDir, file) })
      })
    })
    await writeUTF8File(code, {
      target: environment.tmpDir('slice-types.ts'),
      createDir: true,
    })

    //await inspectModels()
  })

program
  .command('env')
  .description('Generates environment variables')
  .requiredOption('-c, --config <config>', 'Configuration name')
  .action(async ({ config }: { config: string }) => {
    const ngConfig = await readJSONFile(
      path.join(environment.cwd, 'angular.json'),
      z.object({
        projects: z.record(
          z.object({
            architect: z.object({
              build: z.object({
                configurations: z.record(
                  z.object({
                    baseHref: z.string().optional(),
                  }),
                ),
              }),
            }),
          }),
        ),
      }),
    )

    const envFile = path.join(environment.appsDir('web', 'environments', 'env.ts'))
    const envFileGenerated = path.join(environment.appsDir('web', 'environments', 'env.generated.ts'))
    const workspace = NW_WORKSPACE
    const env = {
      version: PACKAGE_VERSION + (COMMIT_HASH ? `#${COMMIT_HASH}` : ''),
      isPTR: workspace.toLowerCase() === 'ptr',
      badge: NW_BADGE,
      workspace: workspace.toLowerCase(),
      branchname: BRANCH_NAME,
      cdnUrl: CDN_URL,
      deployUrl: ngConfig.projects['nw-buddy'].architect.build.configurations[config].baseHref || '/',
      disableTooltips: !['live', 'ptr'].includes(workspace.toLowerCase()),
      watermarkImageUrl: NW_WATERMARK || null,
    } satisfies EnvVars
    console.log(env)
    const content = ['export type EnvVars = typeof env', `export const env = ${JSON.stringify(env, null, 2)}`].join(
      '\n',
    )
    fs.writeFileSync(envFileGenerated, content)
    if (IS_CI) {
      // worker somehow does not grab the generated file
      // so we write it to the original file on CI build
      fs.writeFileSync(envFile, content)
    }

    const dataSrcDir = environment.nwDataDir(workspace)
    const dataLinkDir = environment.nwDataDir('.current')
    console.log('Linking data directory', dataSrcDir, '->', dataLinkDir)
    if (fs.existsSync(dataLinkDir)) {
      fs.rmSync(dataLinkDir, { force: true })
    }
    fs.symlinkSync(dataSrcDir, dataLinkDir)
  })

program
  .command('version')
  .description('Generates version file')
  .action(() => {
    const version = PACKAGE_VERSION + (COMMIT_HASH ? `#${COMMIT_HASH}` : '')
    const versionFile = path.join(environment.distDir('web', 'browser', 'version'))
    fs.writeFileSync(versionFile, version)
  })

program.parse(process.argv)
