import { program } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'
import { CDN_URL, COMMIT_HASH, NW_GAME_VERSION, PACKAGE_VERSION, NW_WATERMARK, environment } from '../env'
import { glob, readJSONFile } from './utils/file-utils'

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
                  })
                ),
              }),
            }),
          })
        ),
      })
    )

    const envFile = path.join(environment.appsDir('web', 'environments', 'env.generated.ts'))
    const env = {
      version: PACKAGE_VERSION + (COMMIT_HASH ? `#${COMMIT_HASH}` : ''),
      isPTR: NW_GAME_VERSION.toLowerCase() !== 'live',
      workspace: NW_GAME_VERSION.toLowerCase(),
      cdnUrl: CDN_URL,
      deployUrl: ngConfig.projects['nw-buddy'].architect.build.configurations[config].baseHref || '/',
      disableTooltips: !['live', 'ptr'].includes(NW_GAME_VERSION.toLowerCase()),
      watermarkImageUrl: NW_WATERMARK || null,
    }
    console.log(env)
    fs.writeFileSync(
      envFile,
      ['export type EnvVars = typeof env', `export const env = ${JSON.stringify(env, null, 2)}`].join('\n')
    )
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
// program
//   .option('--ptr', 'PTR mode', NW_USE_PTR)
//   .action(async () => {
//     const options = program.opts<{
//       ptr: boolean
//     }>()
//     const inputDir = environment.nwConvertDir(options.ptr)!

//     const FILES = [
//       // {
//       //   name: 'aliasasset',
//       //   match: path.join(inputDir, '**', `*.aliasasset.json`),
//       // },
//       // {
//       //   name: 'metadata',
//       //   match: path.join(inputDir, '**', `*.metadata.json`),
//       // },
//       // {
//       //   name: 'slicedata',
//       //   match: path.join(inputDir, '**', `*.slicedata.json`),
//       // },
//       // {
//       //   name: 'dynamicslice',
//       //   match: path.join(inputDir, '**', `*.dynamicslice.json`),
//       // },
//       // {
//       //   name: 'slice-meta',
//       //   match: path.join(inputDir, '**', `*.slice.meta.json`),
//       // },
//       // {
//       //   name: 'dynamicuicanvas',
//       //   match: path.join(inputDir, '**', `*.dynamicuicanvas.json`),
//       // },
//       // {
//       //   name: 'timeline',
//       //   match: path.join(inputDir, '**', `*.timeline.json`),
//       // },
//     ]

//     //  for (const { name, match } of FILES) {
//     //    const files = await glob(match)
//     //    console.log(files.length, match)
//     //    readFile(file, { encoding: 'utf8' })
//     //    const code = await tsFromJson(files)
//     //    await writeFile(code, `./tmp/types-${name}.ts`, {
//     //      createDir: true,
//     //    })
//     // }

//     // {
//     //   name: 'capitals',
//     //   match: path.join(inputDir, '**', `*.capitals.json`),
//     // },
//     for (const { name, match } of FILES) {
//       const files = await glob(match)
//       const samples: string[] = []
//       for (const file of files) {
//         samples.push(await fs.promises.readFile(file, { encoding: 'utf8' }))
//       }
//       const code = await tsFromJson('Capital', samples)
//       await writeFile(code.lines.join('\n'), `./tmp/types-${name}.ts`, {
//         createDir: true,
//       })
//     }

//     // const files = await glob(path.join(inputDir, '**', `*.dynamicslice.json`))

//     // for (const file of files) {
//     //   const json = await readJSONFile(file)
//     //   let vitalcount = 0
//     //   let categorycount = 0
//     //   let levelcount = 0
//     //   walkJsonObjects(json, (obj) => {
//     //     if (!isAZ__Entity(obj)) {
//     //       return
//     //     }
//     //     for (const component of obj.components) {
//     //       if (isAIVariantProviderComponent(component)) {
//     //         if (isAIVariantProviderComponentServerFacet(component.baseclass1?.m_serverfacetptr)) {
//     //           if (component.baseclass1.m_serverfacetptr.m_vitalstablerowid != null) {
//     //             vitalcount++
//     //           }
//     //           if (component.baseclass1.m_serverfacetptr.m_vitalscategorytablerowid != null) {
//     //             categorycount++
//     //           }
//     //           if (component.baseclass1.m_serverfacetptr.m_vitalslevel != null) {
//     //             levelcount++
//     //           }
//     //         }
//     //       }
//     //     }
//     //   })
//     //   if (vitalcount !== categorycount || vitalcount !== levelcount || categorycount !== levelcount) {
//     //     console.log(vitalcount, categorycount, levelcount, file)
//     //   }
//     // }
//   })
//   .parse(process.argv)
