import { program } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import { environment } from '../env'
import { glob } from './utils/file-utils'

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
  .parse(process.argv)
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
