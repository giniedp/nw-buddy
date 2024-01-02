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
  key = `scan-for-spawners-utils ${key}`
  return cache(key, task)
}

function readCached(file: string) {
  return cached(`readCached ${file}`, () => {
    return readDynamicSliceFile(file)
  })
}

export async function scanForAreaSpawners(sliceComponent: SliceComponent, rootDir: string, file) {
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

export async function scanForPointSpawners(sliceComponent: SliceComponent, rootDir: string, file: string) {
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

export async function scanForEncounterSpawner(sliceComponent: SliceComponent, rootDir: string, file: string) {
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

export async function scanForPrefabSpawner(sliceComponent: SliceComponent, rootDir: string, file: string) {
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

export async function scanForReadingInteractions(sliceComponent: SliceComponent, rootDir: string, file: string) {
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

export async function scanForGatherable(sliceComponent: SliceComponent, rootDir: string, file: string) {
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
  territoryLevel?: boolean
}

export async function scanForAIVariantSpawn(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForAIVariantSpawn ${file}`, async () => {
    const result: VariantSpawner[] = []
    for (const entity of sliceComponent?.entities || []) {
      let vitalsID: string = null
      let categoryID: string = null
      let level: number = null
      let territoryLevel: boolean = false
      const sliceFiles: string[] = []
      for (const component of entity.components || []) {
        if (isAIVariantProviderComponent(component)) {
          if (isAIVariantProviderComponentServerFacet(component.baseclass1?.m_serverfacetptr)) {
            vitalsID = vitalsID || component.baseclass1.m_serverfacetptr.m_vitalstablerowid
            categoryID = categoryID || component.baseclass1.m_serverfacetptr.m_vitalscategorytablerowid
            level = level || component.baseclass1.m_serverfacetptr.m_vitalslevel
            territoryLevel = territoryLevel || component.baseclass1.m_serverfacetptr.m_useterritoryleveloverride
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
            territoryLevel
          })
        }
      } else {
        result.push({
          vitalsID,
          categoryID,
          level,
          slice: null,
          territoryLevel
        })
      }
    }
    return result
  })
}

export async function scanForVitals(sliceComponent: SliceComponent, rootDir: string, file: string) {
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

export async function scanForProjectileComponent(sliceComponent: SliceComponent, rootDir: string, file: string) {
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
