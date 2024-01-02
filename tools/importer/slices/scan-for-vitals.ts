import * as path from 'path'
import {
  SliceComponent,
  isAIVariantProviderComponent,
  isAIVariantProviderComponentServerFacet,
  isActionListComponent,
  isEncounterComponent,
  isMeshComponent,
  isPointSpawnerComponent,
  isSkinnedMeshComponent,
  isSpawnDefinition,
  isVitalsComponent,
} from './types/dynamicslice'
import { cached, readDynamicSliceFile, resolveDynamicSliceFile } from './utils'

export interface VitalScanRow {
  vitalsID: string
  categoryID: string
  level: number
  territoryLevel?: boolean
  damageTable: string
  modelFile: string
  position?: number[]
  mapID?: string
}

export async function scanForVitals(inputDir: string, sliceFile: string): Promise<VitalScanRow[]> {
  sliceFile = await resolveDynamicSliceFile(inputDir, sliceFile)
  const result: VitalScanRow[] = []
  if (!sliceFile) {
    return result
  }

  const sliceComponent = await readDynamicSliceFile(sliceFile)
  if (!sliceComponent) {
    return result
  }

  const table = await scanForDamageTableAndModels(sliceComponent, inputDir, sliceFile)
  if (table?.vitalsID) {
    // we are in a character base file
    result.push({
      level: null,
      vitalsID: table.vitalsID,
      categoryID: null,
      damageTable: table.damageTable,
      modelFile: table.modelSlice,
    })
  }

  const variants = await scanForAIVariantSpawn(sliceComponent, inputDir, sliceFile)
  for (const item of variants || []) {
    if (!item.vitalsID) {
      continue
    }
    const subSliceFile = await resolveDynamicSliceFile(inputDir, item.slice)
    const subSlice = await readDynamicSliceFile(subSliceFile)
    const table = await scanForDamageTableAndModels(subSlice, inputDir, subSliceFile)
    result.push({
      vitalsID: item.vitalsID,
      categoryID: item.categoryID,
      level: item.level,
      territoryLevel: item.territoryLevel,
      damageTable: table?.damageTable,
      modelFile: table?.modelSlice,
    })
  }

  const definitions = await scanForSpawnDefinitions(sliceComponent, inputDir, sliceFile)

  for (const item of definitions || []) {
    const subSliceFile = await resolveDynamicSliceFile(inputDir, item)
    const subSlice = await readDynamicSliceFile(subSliceFile)
    const table = await scanForDamageTableAndModels(subSlice, inputDir, subSliceFile)
    if (!table?.vitalsID) {
      continue
    }
    result.push({
      vitalsID: table.vitalsID,
      categoryID: null,
      level: null,
      damageTable: table.damageTable,
      modelFile: table.modelSlice,
    })
  }
  return result.filter((it) => !!it.vitalsID)
}

interface VariantSpawner {
  vitalsID: string
  categoryID: string
  level: number
  slice: string
  territoryLevel?: boolean
}

async function scanForAIVariantSpawn(sliceComponent: SliceComponent, rootDir: string, currentFile: string) {
  return cached(`scanForAIVariantSpawn ${currentFile}`, async () => {
    const result: VariantSpawner[] = []
    for (const entity of sliceComponent?.entities || []) {
      let vitalsID: string = null
      let categoryID: string = null
      let level: number = null
      let slice: string = null
      let territoryLevel: boolean = false
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
          slice = slice || (await resolveDynamicSliceFile(rootDir, component.baseclass1.m_sliceasset?.hint))
          slice = slice || (await resolveDynamicSliceFile(rootDir, component.baseclass1.m_aliasasset?.hint))
        }
      }
      if (!vitalsID) {
        continue
      }
      result.push({
        vitalsID,
        categoryID,
        level,
        slice,
        territoryLevel
      })
    }
    return result
  })
}

async function scanForSpawnDefinitions(sliceComponent: SliceComponent, rootDir: string, currentFile: string) {
  return cached(`scanForSpawnDefinitions ${currentFile}`, async () => {
    const slices: string[] = []
    for (const entity of sliceComponent?.entities || []) {
      for (const component of entity?.components || []) {
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
  })
}

async function scanForDamageTableAndModels(sliceComponent: SliceComponent, rootDir: string, currentFile: string) {
  return cached(`scanForDamageTableAndModels ${currentFile}`, async () => {
    let vitalsID: string = null
    let damageTable: string = null
    let modelSlice: string = null
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
        if (hasModel && !modelSlice) {
          modelSlice = path
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
      modelSlice,
    }
  })
}
