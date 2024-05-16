import { program } from 'commander'
import { createHash } from 'crypto'
import * as fs from 'fs'
import { sortBy, sumBy, uniq, uniqBy } from 'lodash'
import * as path from 'path'
import { environment } from '../env'
import { scanForVitals } from './importer/slices/scan-for-models'
import { scanForSpawners } from './importer/slices/scan-for-spawners'
import { appendSlices, scanForData } from './importer/slices/scan-for-spawners-utils'
import { scanForZones } from './importer/slices/scan-for-zones'
import { Capital } from './importer/slices/types/capitals'
import {
  isAIVariantProviderComponent,
  isAIVariantProviderComponentServerFacet,
  isActionListComponent,
  isAreaSpawnerComponent,
  isAreaSpawnerComponentServerFacet,
  isEncounterComponent,
  isGatherableControllerComponent,
  isPointSpawnerComponent,
  isPrefabSpawnerComponent,
  isProjectileSpawnerComponent,
  isVariationDataComponent,
  isVitalsComponent,
} from './importer/slices/types/dynamicslice'
import { readDynamicSliceFile, resolveDynamicSliceFiles } from './importer/slices/utils'
import { arrayAppend, withProgressBar } from './utils'
import { glob, readJSONFile, writeUTF8File } from './utils/file-utils'

program
  .command('slices')
  .description(
    "File inspection/playground task. Used for inspecting files. Don't run it, if you don't know what it does",
  )
  .action(async () => {
    const rootDir = environment.nwConvertDir('live')
    const files = await glob([
      path.join(rootDir, '**', 'slices', 'characters', '**', '*.dynamicslice.json'),
      path.join(rootDir, '**', 'slices', 'dungeon', '**', '*.dynamicslice.json'),
      path.join(rootDir, '**', '*.capitals.json'),
    ])
    const result: Record<string, any[]> = {}
    await withProgressBar({ barName: 'scan', tasks: files }, async (file, _, log) => {
      log(file)
      if (file.endsWith('.capitals.json')) {
        const data = await readJSONFile<Capital>(file)
        for (const capital of data?.Capitals || []) {
          if (!capital.sliceName) {
            continue
          }
          const res = await scanForSpawners(rootDir, capital.sliceName, capital.sliceAssetId).then((data) => data || [])
          for (const vital of res) {
            if (!vital.vitalsID) {
              continue
            }
            if (!vital.modelFile || (!vital.mtlFile && !vital.adbFile && !vital.damageTable)) {
              continue
            }
            if (!result[vital.modelFile]) {
              result[vital.modelFile] = []
            }
            const found = result[vital.modelFile].find((it) => {
              return (
                it.model === vital.modelFile &&
                it.mtl === vital.mtlFile &&
                it.dmg === vital.damageTable &&
                it.adb === vital.adbFile
              )
            })
            if (!found) {
              result[vital.modelFile].push({
                model: vital.modelFile,
                mtl: vital.mtlFile,
                dmg: vital.damageTable,
                adb: vital.adbFile,
              })
            }
          }
        }
      } else if (file.endsWith('.dynamicslice.json')) {
        const vitals = await scanForVitals(rootDir, file)
        for (const vital of vitals) {
          if (!vital.modelFile || (!vital.mtlFile && !vital.adbFile && !vital.damageTable)) {
            continue
          }
          if (!result[vital.modelFile]) {
            result[vital.modelFile] = []
          }
          const found = result[vital.modelFile].find((it) => {
            return (
              it.model === vital.modelFile &&
              it.mtl === vital.mtlFile &&
              it.dmg === vital.damageTable &&
              it.adb === vital.adbFile
            )
          })
          if (!found) {
            result[vital.modelFile].push({
              model: vital.modelFile,
              mtl: vital.mtlFile,
              dmg: vital.damageTable,
              adb: vital.adbFile,
            })
          }
        }
      }
    })

    const data = Object.values(result)
      .flat()
      .map((it) => {
        return {
          id: createHash('md5').update(JSON.stringify(it)).digest('hex'),
          ...it,
        }
      })
    fs.writeFileSync(path.join('tmp', 'vitals-by-model.json'), JSON.stringify(data, null, 2))
  })

async function inspectZones() {
  const rootDir = environment.nwConvertDir('live')
  const files = await glob(path.join(rootDir, '**', '*.dynamicslice.json'))
  await withProgressBar({ barName: 'scan', tasks: files }, async (file, _, log) => {
    log(file)
    const data = await scanForZones({
      rootDir,
      file,
    })
    if (data?.length) {
      if (!file.startsWith('E:/Projects/nw-buddy/tmp/nw-data/live/slices/pois/territories')) {
        console.log(file)
      }
      // console.log({
      //   file,
      //   ids: data.map((it) => it.territoryID),
      // })
    }
  })
}

async function inspectModels() {
  const rootDir = environment.nwConvertDir('live')
  const files = await glob(path.join(rootDir, '**', '*.dynamicslice.json'))
  await withProgressBar({ barName: 'scan', tasks: files }, async (file, _, log) => {
    log(file)
    const component = await readDynamicSliceFile(file)
    if (!component) {
      return
    }
    const data = await scanForData(component, rootDir, file)
    for (const item of data) {
      if (item.modelFile && item.vitalsID) {
        console.log(file)
      }
    }
  })
}

async function inspectSpawns() {
  const rootDir = environment.nwConvertDir('live')
  const files = await glob(path.join(rootDir, '**', '*.capitals.json'))
  const samples: string[] = []
  const trees: TreeNode[] = []
  await withProgressBar({ barName: 'scan', tasks: files }, async (file, _, log) => {
    log(file)
    const data = await readJSONFile<Capital>(file)
    const files: string[] = []
    for (const capital of data?.Capitals || []) {
      for (const f of (await resolveDynamicSliceFiles(rootDir, capital.sliceName)) || []) {
        files.push(f)
      }
    }
    for (const file of files) {
      //samples.push(...(await scanSamples(rootDir, file)))
      trees.push(...(await scan(rootDir, file, [], [], [])))
    }
  })
  const data = uniqBy(
    sortBy(trees, (it) => it.components.join(', ')),
    (it) => JSON.stringify(it),
  )
    .map((it) => serializeTree(it, 0))
    .join('\n\n')

  await writeUTF8File(data, {
    target: environment.tmpDir('spawn-tree.txt'),
    createDir: true,
  })
}

function serializeTree(tree: TreeNode, indent = 0, lines: string[] = []): string {
  lines.push('  '.repeat(indent) + tree.components.join(', '))
  if (tree.child) {
    serializeTree(tree.child, indent + 1, lines)
  }
  return lines.join('\n')
}
async function scanSamples(rootDir: string, file: string) {
  const samples: string[] = []
  const slice = await readDynamicSliceFile(file)
  if (!slice) {
    return
  }
  for (const entity of slice.entities) {
    const sample: string[] = []
    for (const component of entity.components) {
      const slices: string[] = []
      if (isAreaSpawnerComponent(component)) {
        if (isAreaSpawnerComponentServerFacet(component.baseclass1.m_serverfacetptr)) {
          await appendSlices(slices, rootDir, component.baseclass1.m_serverfacetptr.m_aliasasset)
          await appendSlices(slices, rootDir, component.baseclass1.m_serverfacetptr.m_sliceasset)
        }
      } else if (isPointSpawnerComponent(component)) {
        await appendSlices(slices, rootDir, component.baseclass1.m_sliceasset)
        await appendSlices(slices, rootDir, component.baseclass1.m_aliasasset)
      } else if (isEncounterComponent(component)) {
        for (const spawn of component.m_spawntimeline) {
          await appendSlices(slices, rootDir, spawn.m_sliceasset)
          await appendSlices(slices, rootDir, spawn.m_aliasasset)
        }
      } else if (isPrefabSpawnerComponent(component)) {
        await appendSlices(slices, rootDir, component.m_sliceasset)
        await appendSlices(slices, rootDir, component.m_aliasasset)
      }

      let doSample = slices.length > 0
      if (isVariationDataComponent(component)) {
        doSample = doSample || !!component.m_selectedvariant
      }
      if (isGatherableControllerComponent(component)) {
        doSample = doSample || !!component.m_gatherableentryid
      }
      if (
        isAIVariantProviderComponent(component) &&
        isAIVariantProviderComponentServerFacet(component.baseclass1.m_serverfacetptr)
      ) {
        doSample = doSample || !!component.baseclass1.m_serverfacetptr?.m_vitalstablerowid
      }
      if (isVitalsComponent(component)) {
        doSample = doSample || !!component.m_rowreference
      }
      if (isActionListComponent(component)) {
        doSample = doSample || !!component.m_damagetable?.asset?.baseclass1?.assetpath
      }
      if (isProjectileSpawnerComponent(component)) {
        doSample = true
      }

      if (doSample) {
        sample.push(component.__type)
      }
    }
    if (sample.length) {
      samples.push(uniq(sample).sort().join(', '))
    }
  }
  return samples
}

type TreeNode = {
  components: string[]
  child: TreeNode
}

async function scan(
  rootDir: string,
  file: string,
  fileStack: string[],
  compStack: any[],
  crumb: string[],
): Promise<TreeNode[]> {
  const result: TreeNode[] = []
  if (fileStack.includes(file)) {
    return result
  }
  const files = await resolveDynamicSliceFiles(rootDir, file)
  for (const file of files || []) {
    const children = await scanFile(rootDir, file, fileStack, compStack, crumb)
    result.push(...children)
  }
  return result
}

async function scanFile(
  rootDir: string,
  file: string,
  stack: string[],
  compStack: any[],
  crumb: string[],
): Promise<TreeNode[]> {
  const result: TreeNode[] = []
  if (!file) {
    return result
  }
  if (stack.includes(file)) {
    return result
  }
  stack = [...stack, file]
  crumb = [...crumb]
  compStack = [...compStack]
  const component = await readDynamicSliceFile(file)
  if (!component) {
    return result
  }

  for (const entity of component.entities) {
    const children: string[] = []
    const components: string[] = []
    const localCrumb = [...crumb]
    for (const component of entity.components) {
      const slices: string[] = []
      let hasPosition = false
      let suffix = ''
      if (isAreaSpawnerComponent(component)) {
        if (isAreaSpawnerComponentServerFacet(component.baseclass1.m_serverfacetptr)) {
          await appendSlices(slices, rootDir, component.baseclass1.m_serverfacetptr.m_aliasasset)
          await appendSlices(slices, rootDir, component.baseclass1.m_serverfacetptr.m_sliceasset)
          hasPosition = hasPosition || component.baseclass1.m_serverfacetptr.m_locations?.length > 0
          suffix = hasPosition ? '-1' : '-0'
        }
      } else if (isPointSpawnerComponent(component)) {
        await appendSlices(slices, rootDir, component.baseclass1.m_sliceasset)
        await appendSlices(slices, rootDir, component.baseclass1.m_aliasasset)
      } else if (isEncounterComponent(component)) {
        for (const spawn of component.m_spawntimeline) {
          await appendSlices(slices, rootDir, spawn.m_sliceasset)
          await appendSlices(slices, rootDir, spawn.m_aliasasset)
          hasPosition = hasPosition || spawn.m_spawnlocations.length > 0
          suffix = hasPosition ? '-1' : '-0'
        }
      } else if (isPrefabSpawnerComponent(component)) {
        await appendSlices(slices, rootDir, component.m_sliceasset)
        await appendSlices(slices, rootDir, component.m_aliasasset)
      }
      if (slices.length) {
        components.push(component.__type + suffix)
        children.push(...slices)
      }

      let doSample = false
      // if (isVariationDataComponent(component)) {
      //   doSample = doSample || !!component.m_selectedvariant
      // }
      // if (isGatherableControllerComponent(component)) {
      //   doSample = doSample || !!component.m_gatherableentryid
      // }
      if (
        isAIVariantProviderComponent(component) &&
        isAIVariantProviderComponentServerFacet(component.baseclass1.m_serverfacetptr)
      ) {
        const vitalId = component.baseclass1.m_serverfacetptr?.m_vitalstablerowid
        doSample = doSample || !!vitalId
        if (vitalId) {
          // localCrumb.push(
          //   `${component.__type} ${vitalId} ${component.baseclass1.m_serverfacetptr.m_vitalslevel} ${component.baseclass1.m_serverfacetptr.m_useterritoryleveloverride}`,
          // )
          arrayAppend(localCrumb, vitalId.toLowerCase())
        }
      }
      if (isVitalsComponent(component)) {
        const vitalId = component.m_rowreference
        doSample = doSample || !!vitalId
        if (vitalId) {
          // localCrumb.push(`${component.__type} ${vitalId}`)
          arrayAppend(localCrumb, vitalId.toLowerCase())
        }
      }
      // if (isActionListComponent(component)) {
      //   doSample = doSample || !!component.m_damagetable?.asset?.baseclass1?.assetpath
      // }
      // if (isProjectileSpawnerComponent(component)) {
      //   doSample = true
      // }
      // const replace = {
      //   'VariationDataComponent': 'VariationDataComponent',
      //   'GatherableControllerComponent': 'VariationDataComponent',
      //   'AIVariantProviderComponent': 'VitalsComponent',
      //   'VitalsComponent': 'VitalsComponent',
      //   'ActionListComponent': 'VitalsComponent',
      //   'ProjectileSpawnerComponent': 'ProjectileSpawnerComponent',
      // }
      if (doSample) {
        components.push(component.__type)
      }
    }

    if (!components.length) {
      continue
    }

    if (localCrumb.length && JSON.stringify(compStack).includes('AreaSpawnerComponent-0')) {
      fs.appendFileSync(
        environment.tmpDir('slices-scan-area0-vitals.txt'),
        JSON.stringify(
          {
            localCrumb,
            file: file.replace(/\\/g, '/'),
            stack: stack.map((it) => it.replace(/\\/g, '/')),
            compStack: [...compStack, uniq(components).sort()],
          },
          null,
          2,
        ) + ',\n',
      )
    }

    if (!children.length) {
      result.push({
        components: uniq(components).sort(),
        child: null,
      })
      continue
    }
    for (const child of children) {
      const tree = await scanFile(rootDir, child, stack, [...compStack, uniq(components).sort()], localCrumb).then(
        (list) => {
          return list.filter((it) =>
            treeHasComponents(it, [
              'VariationDataComponent',
              'GatherableControllerComponent',
              'AIVariantProviderComponent',
              'VitalsComponent',
              'ActionListComponent',
              'ProjectileSpawnerComponent',
            ]),
          )
        },
      )
      for (const child of tree) {
        result.push({
          components: uniq(components).sort(),
          child: child,
        })
      }
    }
  }
  return uniqBy(
    sortBy(result, (it) => it.components.join(', ')),
    (it) => JSON.stringify(it),
  )
}

function treeHasComponents(tree: TreeNode, components: string[]) {
  if (tree.components.some((it) => components.some((comp) => comp.startsWith(it)))) {
    return true
  }
  if (!tree.child) {
    return false
  }
  return treeHasComponents(tree.child, components)
}

program.parse(process.argv)
