import * as path from 'path'
import {
  AZ__Entity,
  Asset,
  AssetId,
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
  isHousingPlotComponent,
  isMeshComponent,
  isNpcComponent,
  isPointSpawnerComponent,
  isPolygonPrismCommon,
  isPolygonPrismShapeComponent,
  isPrefabSpawnerComponent,
  isProjectileSpawnerComponent,
  isReadingInteractionComponent,
  isSkinnedMeshComponent,
  isSpawnDefinition,
  isVariationDataComponent,
  isVitalsComponent,
} from './types/dynamicslice'

import { arrayAppend, readJSONFile } from '../../utils'
import {
  cached as cache,
  getEntityById,
  lookupAssetPath,
  readDynamicSliceFile,
  resolveAssetFile,
  resolveBoundaryShape,
  resolveDynamicSliceFiles,
} from './utils'

function cached<T>(key: string, task: (key: string) => Promise<T>): Promise<T> {
  key = `scan-for-spawners-utils ${key}`
  return cache(key, task)
}

export function readDynamicSliceFileCached(file: string) {
  return cached(`readDynamicSliceFileCached ${file}`, () => {
    return readDynamicSliceFile(file)
  })
}

export function readJsonFileCached<T>(file: string) {
  return cached(`readJsonFileCached ${file}`, () => {
    return readJSONFile<T>(file)
  })
}

export async function scanForAreaSpawners(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForAreaSpawners ${file}`, async () => {
    const result: Array<{
      entity: AZ__Entity
      slice: string
      locations: Array<{ translation: number[]; rotation: number[][] }>
    }> = []
    for (const entity of sliceComponent.entities || []) {
      const locations: (typeof result)[0]['locations'] = []
      const sliceFiles: string[] = []
      for (const component of entity.components || []) {
        if (!isAreaSpawnerComponent(component)) {
          continue
        }
        const facet = component.baseclass1?.m_serverfacetptr
        if (!isAreaSpawnerComponentServerFacet(facet)) {
          continue
        }
        await appendSlices(sliceFiles, rootDir, facet.m_sliceasset)
        await appendSlices(sliceFiles, rootDir, facet.m_aliasasset)

        for (const location of facet.m_locations || []) {
          const entity = getEntityById(sliceComponent, location.entityid as any)
          const transform = entity?.components?.find((it) => isGameTransformComponent(it)) as GameTransformComponent
          const translation = getTranslation(transform)
          const rotation = getRotation(transform)
          if (Array.isArray(translation)) {
            locations.push({
              translation,
              rotation,
            })
          }
        }
      }
      for (const slice of sliceFiles) {
        result.push({
          slice,
          locations,
          entity,
        })
      }
    }
    return result
  })
}

export async function scanForPointSpawners(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForPointSpawners ${file}`, async () => {
    const result: Array<{
      entity: AZ__Entity
      slice: string
      translation: number[]
      rotation: number[][]
    }> = []
    for (const entity of sliceComponent.entities || []) {
      const sliceFiles: string[] = []
      let translation: number[]
      let rotation: number[][]
      for (const component of entity.components || []) {
        if (isGameTransformComponent(component)) {
          translation = translation || getTranslation(component)
          rotation = rotation || getRotation(component)
        }
        if (isPointSpawnerComponent(component)) {
          await appendSlices(sliceFiles, rootDir, component.baseclass1.m_sliceasset)
          await appendSlices(sliceFiles, rootDir, component.baseclass1.m_aliasasset)
        }
      }
      for (const slice of sliceFiles) {
        result.push({
          slice,
          entity,
          rotation,
          translation,
        })
      }
    }
    return result
  })
}

export async function scanForEncounterSpawner(sliceComponent: SliceComponent, rootDir: string, file: string) {
  return cached(`scanForEncounterSpawner ${file}`, async () => {
    const result: Array<{
      entity: AZ__Entity
      slice: string
      locations: Array<{ translation: number[]; rotation: number[][] }>
    }> = []

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
          await appendSlices(sliceFiles, rootDir, spawn.m_sliceasset)
          await appendSlices(sliceFiles, rootDir, spawn.m_aliasasset)

          const locations: (typeof result)[0]['locations'] = []
          for (const location of spawn.m_spawnlocations || []) {
            const entity = getEntityById(sliceComponent, location.entityid as any)
            const transform = entity?.components?.find((it) => isGameTransformComponent(it)) as GameTransformComponent
            const translation = getTranslation(transform)
            const rotation = getRotation(transform)
            if (Array.isArray(translation)) {
              locations.push({
                translation,
                rotation,
              })
            }
          }

          for (const slice of sliceFiles) {
            result.push({
              slice,
              locations,
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
    const result: Array<{
      entity: AZ__Entity
      slice: string
      translation: number[]
      rotation: number[][]
      variantID: string
    }> = []
    for (const entity of sliceComponent.entities || []) {
      const sliceFiles: string[] = []
      let translation: number[]
      let rotation: number[][]
      let variantID: string
      for (const component of entity.components || []) {
        if (isGameTransformComponent(component)) {
          translation = translation || getTranslation(component)
          rotation = rotation || getRotation(component)
        }
        if (isPrefabSpawnerComponent(component)) {
          variantID = component.m_slicevariant
          await appendSlices(sliceFiles, rootDir, component.m_sliceasset)
          await appendSlices(sliceFiles, rootDir, component.m_aliasasset)
        }
      }
      if (!translation) {
        continue
      }
      for (const slice of sliceFiles) {
        result.push({
          slice,
          translation,
          entity,
          rotation,
          variantID
        })
      }
    }
    return result
  })
}

export interface ScannedData {
  entity?: AZ__Entity

  vitalsID?: string
  npcID?: string
  categoryID?: string
  level?: number
  territoryLevel?: boolean
  damageTable?: string
  adbFile?: string
  modelFile?: string
  mtlFile?: string
  tags?: string[]

  variantID?: string
  gatherableID?: string

  loreIDs?: string[]
  houseTypes?: string[]
}

export async function scanForData(sliceComponent: SliceComponent, rootDir: string, file: string) {
  const result: ScannedData[] = []
  for (const entity of sliceComponent?.entities || []) {
    const node: ScannedData = {}

    for (const component of entity.components || []) {
      if (isNpcComponent(component) && component.m_npckey) {
        node.npcID = node.npcID || component.m_npckey
      }
      if (isVitalsComponent(component) && component.m_rowreference) {
        node.vitalsID = node.vitalsID || component.m_rowreference
      }
      if (isActionListComponent(component)) {
        node.damageTable = node.damageTable || component.m_damagetable?.asset?.baseclass1?.assetpath
        node.adbFile = node.adbFile || component.m_animationdatabase?.baseclass1?.assetpath
        node.tags = [...(component.m_defaulttags || [])]
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
      if (!node.modelFile && isSkinnedMeshComponent(component) && component['skinned mesh render node']?.visible) {
        const modelAsset = component['skinned mesh render node']['skinned mesh']
        const materialAsset = component['skinned mesh render node']['material override asset']
        node.modelFile = await lookupAssetPath(rootDir, modelAsset)
        node.mtlFile = await lookupAssetPath(rootDir, materialAsset)
      }
      if (!node.modelFile && isMeshComponent(component) && component['static mesh render node']?.visible) {
        const modelAsset = component['static mesh render node']['static mesh']
        const materialAsset = component['static mesh render node']['material override asset']
        node.modelFile = await lookupAssetPath(rootDir, modelAsset)
        node.mtlFile = await lookupAssetPath(rootDir, materialAsset)
      }
      if (isHousingPlotComponent(component) && component.m_housetypestring) {
        node.houseTypes = node.houseTypes || []
        node.houseTypes.push(component.m_housetypestring)
      }
    }
    if (Object.keys(node).length) {
      result.push({
        entity,
        ...node,
      })
    }
  }
  return result
}

const RANDOM_ENCOUNTER_REGEX = /RandomEncounter/i
export function isEntityRandomEncounter(entity: AZ__Entity) {
  return !!entity?.name && RANDOM_ENCOUNTER_REGEX.test(entity.name)
}

export function scanForEncounterType(sliceComponent: SliceComponent) {
  for (const entity of sliceComponent.entities || []) {
    if (!entity.name) {
      continue
    }
    if (entity.name.includes('RandomEncounter')) {
      return 'random'
    }
    if (entity.name.startsWith('Enc_Darkness')) {
      return 'darkness'
    }
    if (entity.name.includes('LootGoblin')) {
      return 'goblin'
    }
  }
  return null
}

const AMMO_ID_TO_VARIANT_ID = {
  WinterConv_GleamiteLauncher_Projectile: 'WinterConv_GleamiteChunk',
  WinterConv_GleamiteLauncher_Projectile_Rapid: 'WinterConv_GleamiteShard',
}

export async function appendSlices(collection: string[], rootDir: string, asset: Asset) {
  const hint = asset?.hint
  const assetId = asset?.guid
  const files = await resolveDynamicSliceFiles(rootDir, hint, assetId)
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

export function getRotation(component: GameTransformComponent) {
  const value = component?.m_worldtm?.__value
  let result: number[][] = null
  if (value?.['rotation/scale'] && Array.isArray(value?.['rotation/scale'])) {
    const [
      x1, y1, z1,
      x2, y2, z2,
      x3, y3, z3
    ] = value['rotation/scale']
    result = [
      [x1, y1, z1],
      [x2, y2, z2],
      [x3, y3, z3]
    ]
  }
  if (!Array.isArray(result)) {
    return null
  }
  if (result.length !== 3) {
    return null
  }
  for (const row of result) {
    if (!Array.isArray(row) || row.length !== 3) {
      return null
    }
  }
  // skip if it is an identity matrix
  if (
    result[0][0] === 1 &&
    result[0][1] === 0 &&
    result[0][2] === 0 &&
    result[1][0] === 0 &&
    result[1][1] === 1 &&
    result[1][2] === 0 &&
    result[2][0] === 0 &&
    result[2][1] === 0 &&
    result[2][2] === 1
  ) {
    return null
  }
  return result
}
