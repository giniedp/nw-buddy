import * as path from 'path'
import {
  AZ__Entity,
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

export function readCached(file: string) {
  return cached(`readCached ${file}`, () => {
    return readDynamicSliceFile(file)
  })
}

export async function scanForAreaSpawners(sliceComponent: SliceComponent, rootDir: string, file) {
  return cached(`scanForAreaSpawners ${file}`, async () => {
    const result: Array<{ entity: AZ__Entity; slice: string; positions: number[][] }> = []
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
          entity,
        })
      }
    }
    return result
  })
}

export async function scanForPointSpawners(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForPointSpawners ${file}`, async () => {
    const result: Array<{ entity: AZ__Entity; slice: string; position: number[] }> = []
    for (const entity of sliceComponent.entities || []) {
      const sliceFiles: string[] = []
      let position: number[]
      for (const component of entity.components || []) {
        if (isGameTransformComponent(component)) {
          position = position || getTranslation(component)
        }
        if (!isPointSpawnerComponent(component)) {
          continue
        }
        await appendSlices(sliceFiles, rootDir, component.baseclass1.m_sliceasset?.hint)
        await appendSlices(sliceFiles, rootDir, component.baseclass1.m_aliasasset?.hint)
      }
      for (const slice of sliceFiles) {
        result.push({
          slice,
          position,
          entity,
        })
      }
    }
    return result
  })
}

export async function scanForEncounterSpawner(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForEncounterSpawner ${file}`, async () => {
    const result: Array<{ entity: AZ__Entity; slice: string; positions: number[][] }> = []

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
            const position = getTranslation(transform)
            if (position) {
              positions.push([...position])
            }
          }

          for (const slice of sliceFiles) {
            result.push({
              slice,
              positions,
              entity,
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
    const result: Array<{ entity: AZ__Entity; slice: string; position: number[] }> = []
    for (const entity of sliceComponent.entities || []) {
      const sliceFiles: string[] = []
      let position: number[]
      for (const component of entity.components || []) {
        if (isGameTransformComponent(component)) {
          position = position || getTranslation(component)
        }
        if (isPrefabSpawnerComponent(component)) {
          await appendSlices(sliceFiles, rootDir, component.m_sliceasset?.hint)
          await appendSlices(sliceFiles, rootDir, component.m_aliasasset?.hint)
        }
      }
      if (!position) {
        continue
      }
      for (const slice of sliceFiles) {
        result.push({
          slice,
          position,
          entity,
        })
      }
    }
    return result
  })
}

export interface ScannedData {
  entity?: AZ__Entity

  vitalsID?: string
  categoryID?: string
  level?: number
  territoryLevel?: boolean
  damageTable?: string
  modelFile?: string

  variantID?: string
  gatherableID?: string

  loreIDs?: string[]
}

export function scanForData(sliceComponent: SliceComponent, rootDir: string, file: string) {
  const result: ScannedData[] = []
  for (const entity of sliceComponent?.entities || []) {
    const node: ScannedData = {}
    for (const component of entity.components || []) {
      if (isVitalsComponent(component) && component.m_rowreference) {
        node.vitalsID = node.vitalsID || component.m_rowreference
      }
      if (isActionListComponent(component) && component.m_damagetable?.asset?.baseclass1?.assetpath) {
        node.damageTable = node.damageTable || component.m_damagetable?.asset?.baseclass1?.assetpath
      }
      if (isAIVariantProviderComponent(component)) {
        if (isAIVariantProviderComponentServerFacet(component.baseclass1?.m_serverfacetptr)) {
          const facet = component.baseclass1.m_serverfacetptr
          node.vitalsID = node.vitalsID || facet.m_vitalstablerowid
          node.categoryID = node.categoryID || facet.m_vitalscategorytablerowid
          node.level = node.level || facet.m_vitalslevel
          node.territoryLevel = node.territoryLevel || facet.m_useterritoryleveloverride
        }
      }
      if (isVariationDataComponent(component) && component.m_selectedvariant) {
        node.variantID = component.m_selectedvariant
      }
      if (isGatherableControllerComponent(component) && component.m_gatherableentryid) {
        node.gatherableID = component.m_gatherableentryid
      }
      if (isReadingInteractionComponent(component) && component.m_loreid) {
        node.loreIDs = node.loreIDs || []
        arrayAppend(node.loreIDs, component.m_loreid)
      }
      if (isProjectileSpawnerComponent(component) && component.m_ammoid) {
        if (AMMO_ID_TO_VARIANT_ID[component.m_ammoid]) {
          node.variantID = AMMO_ID_TO_VARIANT_ID[component.m_ammoid]
        }
      }
      if (
        (isSkinnedMeshComponent(component) && component['skinned mesh render node']?.visible) ||
        (isMeshComponent(component) && component['static mesh render node']?.visible)
      ) {
        node.modelFile = path
          .relative(rootDir, file)
          .replace(/\\/gi, '/')
          .replace(/\.json$/, '.glb')
          .toLowerCase()
      }
    }
    if (Object.keys(node).length) {
      result.push({
        entity,
        ...node
      })
    }
  }
  return result
}

const AMMO_ID_TO_VARIANT_ID = {
  'WinterConv_GleamiteLauncher_Projectile': 'WinterConv_GleamiteChunk',
  'WinterConv_GleamiteLauncher_Projectile_Rapid': 'WinterConv_GleamiteShard',
}

export async function appendSlices(collection: string[], rootDir: string, hint: string) {
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

export function getTranslation(component: GameTransformComponent) {
  const translation = component?.m_worldtm?.__value?.['translation'] as number[]
  if (Array.isArray(translation)) {
    return [...translation]
  }
  return null
}
