import * as path from 'path'
import {
  GameTransformComponent,
  SliceComponent,
  isActionListComponent,
  isAreaSpawnerComponent,
  isAreaSpawnerComponentServerFacet,
  isEncounterComponent,
  isGameTransformComponent,
  isGatherableControllerComponent,
  isMeshComponent,
  isPrefabSpawnerComponent,
  isProjectileSpawnerComponent,
  isReadingInteractionComponent,
  isSkinnedMeshComponent,
  isSpawnDefinition,
  isVariationDataComponent,
  isVitalsComponent,
} from './types/dynamicslice'

import { findAZEntityById, readDynamicSliceFile, resolveDynamicSliceFile } from './utils'
import { arrayAppend } from '../../utils'

export type SpawnerScanResult =
  | {
      variantID?: string
      gatherableID?: string
      loreID?: string
      positions: Array<number[]>
    }
  | {
      vitalsID: string
      damageTable?: string
      modelFile?: string
      positions: Array<number[]>
    }

export async function scanForSpawners(rootDir: string, file: string): Promise<SpawnerScanResult[]> {
  const result: SpawnerScanResult[] = []

  file = await resolveDynamicSliceFile(rootDir, file)
  if (!file) {
    return result
  }

  let sliceComponent = await readDynamicSliceFile(file)
  if (!sliceComponent) {
    return result
  }

  const loreItems = await scanForReadingInteractions(sliceComponent, rootDir)
  for (const loreId of loreItems?.loreIds || []) {
    result.push({
      loreID: loreId,
      positions: [],
    })
  }

  const areaSpawns = await scanForAreaSpawners(sliceComponent, rootDir)
  for (const areaSpawn of areaSpawns || []) {
    if (!areaSpawn.sliceFile || !areaSpawn.positions?.length) {
      continue
    }
    sliceComponent = await readDynamicSliceFile(areaSpawn.sliceFile)
    const gatherable = await scanForGatherable(sliceComponent, rootDir)
    if (gatherable) {
      result.push({
        variantID: gatherable.variantId,
        gatherableID: gatherable.gatherableId,
        positions: areaSpawn.positions,
      })
    }

    const encounterSlices = await scanForEncounterSpawner(sliceComponent, rootDir)
    for (const sliceFile of encounterSlices || []) {
      const component = await readDynamicSliceFile(sliceFile)
      if (!component) {
        continue
      }

      const gatherable = await scanForGatherable(component, rootDir)
      if (gatherable) {
        result.push({
          variantID: gatherable.variantId,
          gatherableID: gatherable.gatherableId,
          positions: areaSpawn.positions,
        })
      }
      const ammoId = await scanForProjectileComponent(component, rootDir)
      if (ammoId === 'WinterConv_GleamiteLauncher_Projectile') {
        result.push({
          variantID: 'WinterConv_GleamiteChunk',
          positions: areaSpawn.positions,
        })
      }
      if (ammoId === 'WinterConv_GleamiteLauncher_Projectile_Rapid') {
        result.push({
          variantID: 'WinterConv_GleamiteShard',
          positions: areaSpawn.positions,
        })
      }
      const vitals = await scanForVitals(component, rootDir, sliceFile)
      if (vitals?.vitalsID) {
        result.push({
          vitalsID: vitals.vitalsID,
          damageTable: vitals.damageTable,
          modelFile: vitals.modelSlice,
          positions: areaSpawn.positions,
        })
      }
    }
  }

  const prefabSpawn = await scanForPrefabSpawner(sliceComponent, rootDir)
  for (const item of prefabSpawn || []) {
    const component = await readDynamicSliceFile(item.sliceFile)
    if (!component) {
      continue
    }
    const vitals = await scanForVitals(component, rootDir, item.sliceFile)
    if (vitals?.vitalsID) {
      result.push({
        vitalsID: vitals.vitalsID,
        damageTable: vitals.damageTable,
        modelFile: vitals.modelSlice,
        positions: [item.position],
      })
    }
  }

  return result
}

async function scanForAreaSpawners(sliceComponent: SliceComponent, rootDir: string) {
  const result: Array<{ sliceFile: string, positions: number[][] }> = []

  for (const entity of sliceComponent.entities || []) {
    const positions: number[][] = []
    let sliceFile: string
    for (const component of entity.components || []) {
      if (!isAreaSpawnerComponent(component)) {
        continue
      }
      const facet = component.baseclass1?.m_serverfacetptr
      if (!isAreaSpawnerComponentServerFacet(facet)) {
        continue
      }
      if (facet.m_sliceasset?.hint) {
        sliceFile = await resolveDynamicSliceFile(rootDir, facet.m_sliceasset.hint)
      } else if (facet.m_aliasasset?.hint) {
        sliceFile = await resolveDynamicSliceFile(rootDir, facet.m_aliasasset.hint)
      }
      for (const location of facet.m_locations || []) {
        const entity = findAZEntityById(sliceComponent, location.entityid as any)
        const transform = entity?.components?.find((it) => isGameTransformComponent(it)) as GameTransformComponent
        const translation = transform?.m_worldtm?.__value?.['translation'] as number[]
        if (Array.isArray(translation)) {
          positions.push([...translation])
        }
      }
    }
    if (sliceFile && positions.length) {
      result.push({
        sliceFile,
        positions,
      })
    }
  }
  return result
}

async function scanForEncounterSpawner(sliceComponent: SliceComponent, rootDir: string) {
  const slices: string[] = []
  for (const entity of sliceComponent.entities || []) {
    for (const component of entity.components || []) {
      if (!isEncounterComponent(component)) {
        continue
      }
      for (const spawn of component.m_spawntimeline || []) {
        if (!isSpawnDefinition(spawn)) {
          continue
        }
        let file: string
        if (spawn.m_sliceasset?.hint) {
          file = await resolveDynamicSliceFile(rootDir, spawn.m_sliceasset.hint)
        } else if (spawn.m_aliasasset?.hint) {
          file = await resolveDynamicSliceFile(rootDir, spawn.m_aliasasset.hint)
        }
        if (file) {
          slices.push(file)
        }
      }
    }
  }
  return slices
}

async function scanForPrefabSpawner(sliceComponent: SliceComponent, rootDir: string) {
  const result: Array<{ sliceFile: string, position: number[] }> = []
  for (const entity of sliceComponent.entities || []) {
    let sliceFile: string
    let position: number[]
    for (const component of entity.components || []) {
      if (isPrefabSpawnerComponent(component)) {
        if (component.m_sliceasset?.hint) {
          sliceFile = await resolveDynamicSliceFile(rootDir, component.m_sliceasset.hint)
        } else if (component.m_aliasasset?.hint) {
          sliceFile = await resolveDynamicSliceFile(rootDir, component.m_aliasasset.hint)
        }
      }
      if (isGameTransformComponent(component)) {
        const translation = component.m_worldtm?.__value?.['translation'] as number[]
        if (Array.isArray(translation)) {
          position = [...translation]
        }
      }
    }
    if (sliceFile && position) {
      result.push({
        sliceFile,
        position,
      })
    }
  }
  return result
}

async function scanForReadingInteractions(sliceComponent: SliceComponent, rootDir: string) {
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
}
async function scanForGatherable(sliceComponent: SliceComponent, rootDir: string) {
  let variantId: string
  let gatherableId: string
  for (const entity of sliceComponent.entities || []) {
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
}

async function scanForVitals(sliceComponent: SliceComponent, rootDir: string, currentFile: string) {
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
          .relative(rootDir, currentFile)
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
}

async function scanForProjectileComponent(sliceComponent: SliceComponent, rootDir: string) {
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
}
