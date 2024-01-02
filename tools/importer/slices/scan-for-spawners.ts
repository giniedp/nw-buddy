import * as path from 'path'
import {
  GameTransformComponent,
  SliceComponent,
  isAIVariantProviderComponent,
  isAIVariantProviderComponentServerFacet,
  isActionListComponent,
  isAreaSpawnerComponent,
  isAreaSpawnerComponentServerFacet,
  isEncounterComponent,
  isGameTransformComponent,
  isGatherableControllerComponent,
  isMeshComponent,
  isPointSpawnerComponent,
  isPrefabSpawnerComponent,
  isProjectileSpawnerComponent,
  isReadingInteractionComponent,
  isSkinnedMeshComponent,
  isSpawnDefinition,
  isVariationDataComponent,
  isVitalsComponent,
} from './types/dynamicslice'

import { arrayAppend } from '../../utils'
import { cached as cache, findAZEntityById, readDynamicSliceFile, resolveDynamicSliceFiles } from './utils'

function cached<T>(key: string, task: (key: string) => Promise<T>): Promise<T> {
  key = `scan-for-spawners ${key}`
  return cache(key, task)
}

function readCached(file: string) {
  return cached(`readCached ${file}`, () => {
    return readDynamicSliceFile(file)
  })
}

export type SpawnerScanResult =
  | {
      variantID?: string
      gatherableID?: string
      loreID?: string
      positions: Array<number[]>
    }
  | {
      vitalsID: string
      categoryID?: string
      level?: number
      damageTable?: string
      modelFile?: string
      positions: Array<number[]>
    }

export async function scanForSpawners(rootDir: string, file: string): Promise<SpawnerScanResult[]> {
  const result: SpawnerScanResult[] = []
  const files = await resolveDynamicSliceFiles(rootDir, file)
  if (!files) {
    return result
  }
  for (const file of files) {
    const fileResults = await scanSpawners(rootDir, file)
    result.push(...fileResults)
    // for await (const item of scan(rootDir, file, [])) {
    //   if (item?.positions?.length) {
    //     result.push(item)
    //   }
    // }
  }
  return result
}

// async function* scan(rootDir: string, file: string, stack: string[]) {
//   const files = await resolveDynamicSliceFiles(rootDir, file)
//   for (const file of files || []) {
//     for await (const item of scanFile(rootDir, file, stack)) {
//       yield item
//     }
//   }
// }
// async function* scanFile(rootDir: string, file: string, stack: string[]): AsyncGenerator<SpawnerScanResult> {
//   if (!file) {
//     return
//   }
//   if (stack.includes(file)) {
//     return
//   }
//   stack = [...stack, file]
//   const component = await readCached(file)
//   if (!component) {
//     return
//   }

//   const lore = await scanForReadingInteractions(component, rootDir, file)
//   for (const loreId of lore?.loreIds || []) {
//     yield {
//       loreID: loreId,
//       positions: [[0, 0, 0]],
//     }
//   }
//   const gatherable = await scanForGatherable(component, rootDir, file)
//   if (gatherable) {
//     yield {
//       variantID: gatherable.variantId,
//       gatherableID: gatherable.gatherableId,
//       positions: [[0, 0, 0]],
//     }
//   }

//   const vitals = await scanForVitals(component, rootDir, file)
//   if (vitals?.vitalsID) {
//     yield {
//       vitalsID: vitals.vitalsID,
//       damageTable: vitals.damageTable,
//       modelFile: vitals.modelSlice,
//       positions: null, // ignore if parent has no spawn positions
//     }
//   }
//   const ammoId = await scanForProjectileComponent(component, rootDir, file)
//   if (ammoId === 'WinterConv_GleamiteLauncher_Projectile') {
//     yield {
//       variantID: 'WinterConv_GleamiteChunk',
//       positions: null, // ignore if parent has no spawn positions
//     }
//   }
//   if (ammoId === 'WinterConv_GleamiteLauncher_Projectile_Rapid') {
//     yield {
//       variantID: 'WinterConv_GleamiteShard',
//       positions: null, // ignore if parent has no spawn positions
//     }
//   }

//   const variants = await scanForAIVariantSpawn(component, rootDir, file)
//   for (const item of variants || []) {
//     for (const slice of (await resolveDynamicSliceFiles(rootDir, item.slice)) || []) {
//       const subSlice = await readDynamicSliceFile(slice)
//       const vital = await scanForVitals(subSlice, rootDir, slice)
//       yield {
//         vitalsID: item.vitalsID || vital?.vitalsID,
//         categoryID: item.categoryID,
//         level: item.level,
//         damageTable: vital?.damageTable,
//         modelFile: vital?.modelSlice,
//         positions: [[0, 0, 0]],
//       }
//     }
//   }

//   const pointSpawns = await scanForPointSpawners(component, rootDir, file)
//   for (const spawn of pointSpawns || []) {
//     for await (const item of scan(rootDir, spawn.slice, stack)) {
//       if (!item.positions) {
//         item.positions = [[0, 0, 0]]
//       }
//       yield item
//     }
//   }

//   const prefabSpawn = await scanForPrefabSpawner(component, rootDir, file)
//   for (const spawn of prefabSpawn || []) {
//     if (!spawn.position) {
//       continue
//     }
//     for await (const item of scan(rootDir, spawn.slice, stack)) {
//       let positions = [spawn.position]
//       if (item.positions) {
//         positions = item.positions.map((b) => {
//           return [spawn.position[0] + b[0], spawn.position[1] + b[1], spawn.position[2] + b[2]]
//         })
//       }
//       yield {
//         ...item,
//         positions: positions,
//       }
//     }
//   }

//   const encounterSpawns = await scanForEncounterSpawner(component, rootDir, file)
//   for (const spawn of encounterSpawns || []) {
//     if (!spawn.positions?.length) {
//       continue
//     }
//     for await (const item of scan(rootDir, spawn.slice, stack)) {
//       if (!item.positions?.length) {
//         continue
//       }
//       yield {
//         ...item,
//         positions: spawn.positions.map((a) => {
//           return item.positions
//             .map((b) => {
//               return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
//             })
//             .flat()
//         }),
//       }
//     }
//   }

//   const areaSpawns = await scanForAreaSpawners(component, rootDir, file)
//   for (const spawn of areaSpawns || []) {
//     if (!spawn.positions?.length) {
//       continue
//     }
//     for await (const item of scan(rootDir, spawn.slice, stack)) {
//       if (!item.positions?.length) {
//         continue
//       }
//       const positions = spawn.positions.map((pos): number[] => {
//         return item.positions
//           .map((pos2) => {
//             return [pos[0] + pos2[0], pos[1] + pos2[1], pos[2] + pos2[2]]
//           })
//           .flat()
//       })
//       yield {
//         ...item,
//         positions: positions,
//       }
//     }
//   }
// }

async function scanSpawners(rootDir: string, file: string): Promise<SpawnerScanResult[]> {
  const result: SpawnerScanResult[] = []

  const sliceComponent = await readDynamicSliceFile(file)
  if (!sliceComponent) {
    return result
  }

  const loreItems = await scanForReadingInteractions(sliceComponent, rootDir, file)
  for (const loreId of loreItems?.loreIds || []) {
    result.push({
      loreID: loreId,
      positions: [[0, 0, 0]],
    })
  }

  const areaSpawns = await scanForAreaSpawners(sliceComponent, rootDir, file)
  for (const areaSpawn of areaSpawns || []) {
    if (!areaSpawn.slice) {
      continue
    }
    const subComponent = await readDynamicSliceFile(areaSpawn.slice)
    const gatherable = await scanForGatherable(subComponent, rootDir, areaSpawn.slice)
    if (gatherable) {
      result.push({
        variantID: gatherable.variantId,
        gatherableID: gatherable.gatherableId,
        positions: areaSpawn.positions,
      })
    }

    const encounterSpawns = await scanForEncounterSpawner(subComponent, rootDir, areaSpawn.slice)
    for (const encounter of encounterSpawns || []) {
      const positions = areaSpawn.positions.map((pos): number[] => {
        if (!encounter.positions.length) {
          return pos
        }
        return encounter.positions
          .map((pos2) => {
            return [pos[0] + pos2[0], pos[1] + pos2[1], pos[2] + pos2[2]]
          })
          .flat()
      })
      const component = await readDynamicSliceFile(encounter.slice)
      if (!component || !positions.length) {
        continue
      }

      const gatherable = await scanForGatherable(component, rootDir, encounter.slice)
      if (gatherable) {
        result.push({
          variantID: gatherable.variantId,
          gatherableID: gatherable.gatherableId,
          positions: positions,
        })
      }
      const ammoId = await scanForProjectileComponent(component, rootDir, encounter.slice)
      if (ammoId === 'WinterConv_GleamiteLauncher_Projectile') {
        result.push({
          variantID: 'WinterConv_GleamiteChunk',
          positions: positions,
        })
      }
      if (ammoId === 'WinterConv_GleamiteLauncher_Projectile_Rapid') {
        result.push({
          variantID: 'WinterConv_GleamiteShard',
          positions: positions,
        })
      }

      {
        const variants = await scanForAIVariantSpawn(component, rootDir, encounter.slice)
        for (const spawn of variants || []) {
          const spawnSlice = await readDynamicSliceFile(spawn.slice)
          const vital = await scanForVitals(spawnSlice, rootDir, spawn.slice)
          result.push({
            vitalsID: spawn.vitalsID || vital?.vitalsID,
            categoryID: spawn.categoryID,
            level: spawn.level,
            damageTable: vital?.damageTable,
            modelFile: vital?.modelSlice,
            positions: positions,
          })
        }
      }

      {
        const pointSpawns = await scanForPointSpawners(component, rootDir, encounter.slice)
        for (const spawn of pointSpawns || []) {
          const spawnSlice = await readDynamicSliceFile(spawn.slice)
          const vitals = await scanForVitals(spawnSlice, rootDir, spawn.slice)
          if (vitals?.vitalsID) {
            result.push({
              vitalsID: vitals.vitalsID,
              damageTable: vitals.damageTable,
              modelFile: vitals.modelSlice,
              positions: positions,
            })
          }
        }
      }

      {
        const subAreaSpawns = await scanForAreaSpawners(component, rootDir, encounter.slice)
        for (const spawn of subAreaSpawns || []) {
          const subSlice = await readDynamicSliceFile(spawn.slice)
          const vitals = await scanForVitals(subSlice, rootDir, spawn.slice)
          if (vitals?.vitalsID) {
            result.push({
              vitalsID: vitals.vitalsID,
              damageTable: vitals.damageTable,
              modelFile: vitals.modelSlice,
              positions: spawn.positions.map((pos): number[] => {
                return positions
                  .map((pos2) => {
                    return [pos[0] + pos2[0], pos[1] + pos2[1], pos[2] + pos2[2]]
                  })
                  .flat()
              }),
            })
          }
        }
      }

      const vitals = await scanForVitals(component, rootDir, encounter.slice)
      if (vitals?.vitalsID) {
        result.push({
          vitalsID: vitals.vitalsID,
          damageTable: vitals.damageTable,
          modelFile: vitals.modelSlice,
          positions: positions,
        })
      }
    }
  }

  const prefabSpawn = await scanForPrefabSpawner(sliceComponent, rootDir, file)
  for (const spawn of prefabSpawn || []) {
    const spawnComponent = await readDynamicSliceFile(spawn.slice)
    if (!spawnComponent) {
      continue
    }
    const encounterSpawns = await scanForEncounterSpawner(spawnComponent, rootDir, spawn.slice)
    for (const encounter of encounterSpawns || []) {
      const component = await readDynamicSliceFile(encounter.slice)
      if (!component || !encounter.positions.length) {
        continue
      }

      const pointSpawns = await scanForPointSpawners(component, rootDir, encounter.slice)
      for (const spawn of pointSpawns || []) {
        const spawnSlice = await readDynamicSliceFile(spawn.slice)
        const vitals = await scanForVitals(spawnSlice, rootDir, spawn.slice)
        if (vitals?.vitalsID) {
          result.push({
            vitalsID: vitals.vitalsID,
            damageTable: vitals.damageTable,
            modelFile: vitals.modelSlice,
            positions: encounter.positions,
          })
        }
      }
    }

    const vitals = await scanForVitals(spawnComponent, rootDir, spawn.slice)
    if (vitals?.vitalsID) {
      result.push({
        vitalsID: vitals.vitalsID,
        damageTable: vitals.damageTable,
        modelFile: vitals.modelSlice,
        positions: [spawn.position],
      })
    }
  }

  const pointSpawns = await scanForPointSpawners(sliceComponent, rootDir, file)
  for (const pointSpawn of pointSpawns || []) {
    const subComponent = await readDynamicSliceFile(pointSpawn.slice)
    const encounterSpawns = await scanForEncounterSpawner(subComponent, rootDir, pointSpawn.slice)
    for (const encounter of encounterSpawns || []) {
      if (!encounter.positions.length) {
        continue
      }
      const component = await readDynamicSliceFile(encounter.slice)
      if (!component) {
        continue
      }

      {
        const variants = await scanForAIVariantSpawn(component, rootDir, encounter.slice)
        for (const item of variants || []) {
          const subSlice = await readDynamicSliceFile(item.slice)
          const vital = await scanForVitals(subSlice, rootDir, item.slice)
          result.push({
            vitalsID: item.vitalsID || vital?.vitalsID,
            categoryID: item.categoryID,
            level: item.level,
            damageTable: vital?.damageTable,
            modelFile: vital?.modelSlice,
            positions: encounter.positions,
          })
        }
      }

      {
        const subAreaSpawns = await scanForAreaSpawners(component, rootDir, encounter.slice)
        for (const spawn of subAreaSpawns || []) {
          const subSlice = await readDynamicSliceFile(spawn.slice)
          const vitals = await scanForVitals(subSlice, rootDir, spawn.slice)
          if (vitals?.vitalsID) {
            result.push({
              vitalsID: vitals.vitalsID,
              damageTable: vitals.damageTable,
              modelFile: vitals.modelSlice,
              positions: spawn.positions.map((pos): number[] => {
                return encounter.positions
                  .map((pos2) => {
                    return [pos[0] + pos2[0], pos[1] + pos2[1], pos[2] + pos2[2]]
                  })
                  .flat()
              }),
            })
          }
        }
      }

      const vitals = await scanForVitals(component, rootDir, encounter.slice)
      if (vitals?.vitalsID) {
        result.push({
          vitalsID: vitals.vitalsID,
          damageTable: vitals.damageTable,
          modelFile: vitals.modelSlice,
          positions: encounter.positions,
        })
      }
    }
  }

  const variants = await scanForAIVariantSpawn(sliceComponent, rootDir, file)
  for (const item of variants || []) {
    const subSlice = await readDynamicSliceFile(item.slice)
    const vital = await scanForVitals(subSlice, rootDir, item.slice)
    if(item.level) {
      result.push({
        vitalsID: item.vitalsID || vital?.vitalsID,
        categoryID: item.categoryID,
        level: item.level,
        damageTable: vital?.damageTable,
        modelFile: vital?.modelSlice,
        positions: [[0, 0, 0]],
      })
    }
  }

  return result
}

async function scanForAreaSpawners(sliceComponent: SliceComponent, rootDir: string, file) {
  return cached(`scanForAreaSpawners ${file}`, async () => {
    const result: Array<{ slice: string; positions: number[][] }> = []
    for (const entity of sliceComponent.entities || []) {
      const positions: number[][] = []
      const sliceFiles: string[] = []
      for (const component of entity.components || []) {
        if (!isAreaSpawnerComponent(component)) {
          continue
        }
        const facet = component.baseclass1?.m_serverfacetptr
        if (!isAreaSpawnerComponentServerFacet(facet)) {
          continue
        }
        await appendSlices(sliceFiles, rootDir, facet.m_sliceasset?.hint)
        await appendSlices(sliceFiles, rootDir, facet.m_aliasasset?.hint)

        for (const location of facet.m_locations || []) {
          const entity = findAZEntityById(sliceComponent, location.entityid as any)
          const transform = entity?.components?.find((it) => isGameTransformComponent(it)) as GameTransformComponent
          const translation = transform?.m_worldtm?.__value?.['translation'] as number[]
          if (Array.isArray(translation)) {
            positions.push([...translation])
          }
        }
      }
      if (!positions.length) {
        continue
      }
      for (const slice of sliceFiles) {
        result.push({
          slice,
          positions,
        })
      }
    }
    return result
  })
}

async function scanForPointSpawners(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForPointSpawners ${file}`, async () => {
    const result: Array<{ slice: string }> = []
    for (const entity of sliceComponent.entities || []) {
      const sliceFiles: string[] = []
      for (const component of entity.components || []) {
        if (!isPointSpawnerComponent(component)) {
          continue
        }
        await appendSlices(sliceFiles, rootDir, component.baseclass1.m_sliceasset?.hint)
        await appendSlices(sliceFiles, rootDir, component.baseclass1.m_aliasasset?.hint)
      }
      for (const slice of sliceFiles) {
        result.push({
          slice,
        })
      }
    }
    return result
  })
}

async function scanForEncounterSpawner(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForEncounterSpawner ${file}`, async () => {
    const result: Array<{ slice: string; positions: number[][] }> = []

    for (const entity of sliceComponent.entities || []) {
      for (const component of entity.components || []) {
        if (!isEncounterComponent(component)) {
          continue
        }
        for (const spawn of component.m_spawntimeline || []) {
          if (!isSpawnDefinition(spawn)) {
            continue
          }

          const sliceFiles: string[] = []
          await appendSlices(sliceFiles, rootDir, spawn.m_sliceasset.hint)
          await appendSlices(sliceFiles, rootDir, spawn.m_aliasasset.hint)

          let positions: number[][] = []
          for (const location of spawn.m_spawnlocations || []) {
            const entity = findAZEntityById(sliceComponent, location.entityid as any)
            const transform = entity?.components?.find((it) => isGameTransformComponent(it)) as GameTransformComponent
            const translation = transform?.m_worldtm?.__value?.['translation'] as number[]
            if (Array.isArray(translation)) {
              positions.push([...translation])
            }
          }

          for (const slice of sliceFiles) {
            result.push({
              slice,
              positions,
            })
          }
        }
      }
    }
    return result
  })
}

async function scanForPrefabSpawner(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForPrefabSpawner ${file}`, async () => {
    const result: Array<{ slice: string; position: number[] }> = []
    for (const entity of sliceComponent.entities || []) {
      const sliceFiles: string[] = []
      let position: number[]
      for (const component of entity.components || []) {
        if (isPrefabSpawnerComponent(component)) {
          await appendSlices(sliceFiles, rootDir, component.m_sliceasset?.hint)
          await appendSlices(sliceFiles, rootDir, component.m_aliasasset?.hint)
        }
        if (isGameTransformComponent(component)) {
          const translation = component.m_worldtm?.__value?.['translation'] as number[]
          if (Array.isArray(translation)) {
            position = [...translation]
          }
        }
      }
      if (!position) {
        continue
      }
      for (const slice of sliceFiles) {
        result.push({
          slice,
          position,
        })
      }
    }
    return result
  })
}

async function scanForReadingInteractions(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForReadingInteractions ${file}`, async () => {
    let loreIds: string[] = []
    for (const entity of sliceComponent.entities || []) {
      for (const component of entity.components || []) {
        if (isReadingInteractionComponent(component) && component.m_loreid) {
          arrayAppend(loreIds, component.m_loreid)
          continue
        }
      }
    }
    return {
      loreIds,
    }
  })
}
async function scanForGatherable(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForGatherable ${file}`, async () => {
    let variantId: string
    let gatherableId: string
    for (const entity of sliceComponent?.entities || []) {
      for (const component of entity.components || []) {
        if (isVariationDataComponent(component) && component.m_selectedvariant) {
          variantId = component.m_selectedvariant
          continue
        }
        if (isGatherableControllerComponent(component) && component.m_gatherableentryid) {
          gatherableId = component.m_gatherableentryid
          continue
        }
      }
    }
    if (!variantId && !gatherableId) {
      return null
    }
    return {
      variantId,
      gatherableId,
    }
  })
}

interface VariantSpawner {
  vitalsID: string
  categoryID: string
  level: number
  slice: string
}
async function scanForAIVariantSpawn(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForAIVariantSpawn ${file}`, async () => {
    const result: VariantSpawner[] = []
    for (const entity of sliceComponent?.entities || []) {
      let vitalsID: string = null
      let categoryID: string = null
      let level: number = null
      const sliceFiles: string[] = []
      for (const component of entity.components || []) {
        if (isAIVariantProviderComponent(component)) {
          if (isAIVariantProviderComponentServerFacet(component.baseclass1?.m_serverfacetptr)) {
            vitalsID = vitalsID || component.baseclass1.m_serverfacetptr.m_vitalstablerowid
            categoryID = categoryID || component.baseclass1.m_serverfacetptr.m_vitalscategorytablerowid
            level = level || component.baseclass1.m_serverfacetptr.m_vitalslevel
          }
        }
        if (isPointSpawnerComponent(component)) {
          await appendSlices(sliceFiles, rootDir, component.baseclass1.m_sliceasset?.hint)
          await appendSlices(sliceFiles, rootDir, component.baseclass1.m_aliasasset?.hint)
        }
      }
      if (!vitalsID) {
        continue
      }
      if (sliceFiles.length) {
        for (const slice of sliceFiles) {
          result.push({
            vitalsID,
            categoryID,
            level,
            slice,
          })
        }
      } else {
        result.push({
          vitalsID,
          categoryID,
          level,
          slice: null,
        })
      }
    }
    return result
  })
}

async function scanForVitals(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForVitals ${file}`, async () => {
    let vitalsID: string = null
    let damageTable: string = null
    let modelFile: string = null
    for (const entity of sliceComponent?.entities || []) {
      for (const component of entity?.components || []) {
        if (isVitalsComponent(component)) {
          vitalsID = vitalsID || component.m_rowreference
        }
        if (isActionListComponent(component)) {
          damageTable = damageTable || component.m_damagetable?.asset?.baseclass1?.assetpath
        }
        let hasModel = false
        hasModel = hasModel || (isSkinnedMeshComponent(component) && component['skinned mesh render node']?.visible)
        hasModel = hasModel || (isMeshComponent(component) && component['static mesh render node']?.visible)
        if (hasModel && !modelFile) {
          modelFile = path
            .relative(rootDir, file)
            .replace(/\\/gi, '/')
            .replace(/\.json$/, '.glb')
            .toLowerCase()
        }
      }
    }
    return {
      vitalsID,
      damageTable,
      modelSlice: modelFile,
    }
  })
}

async function scanForProjectileComponent(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForProjectileComponent ${file}`, async () => {
    let ammoId: string = null
    ammoId: for (const entity of sliceComponent.entities || []) {
      for (const component of entity.components || []) {
        if (!isProjectileSpawnerComponent(component)) {
          continue
        }
        if (component.m_ammoid) {
          ammoId = component.m_ammoid
          break ammoId
        }
      }
    }
    return ammoId
  })
}

async function appendSlices(collection: string[], rootDir: string, hint: string) {
  const files = await resolveDynamicSliceFiles(rootDir, hint)
  if (!files) {
    return
  }
  for (const file of files) {
    if (file) {
      arrayAppend(collection, file)
    }
  }
}
