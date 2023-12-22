import * as fs from 'fs'
import * as path from 'path'
import { readJSONFile, replaceExtname } from '../../utils'
import { walkJsonObjects } from '../../utils/walk-json-object'
import { cached } from './cache'
import {
  isAIVariantProviderComponent,
  isAIVariantProviderComponentServerFacet,
  isAZ__Entity,
  isActionListComponent,
  isAsset,
  isEncounterComponent,
  isMeshComponent,
  isPointSpawnerComponent,
  isSkinnedMeshComponent,
  isSliceComponent,
  isSpawnDefinition,
  isVitalsComponent,
} from './types/dynamicslice'

export interface VitalScanRow {
  vitalsID: string
  categoryID: string
  level: number
  damageTable: string
  modelSlice: string
  position?: number[]
  mapID?: string
}
export async function scanForVitals(inputDir: string, sliceName: string, file?: string): Promise<VitalScanRow[]> {
  const result: VitalScanRow[] = []
  if (!sliceName && !file) {
    return result
  }

  const table = await findDamageTable(inputDir, sliceName, file)
  if (table?.vitalsID) {
    // we are in a character base file
    result.push({
      level: null,
      vitalsID: table.vitalsID,
      categoryID: null,
      damageTable: table.damageTable,
      modelSlice: table.modelSlice,
    })
  }

  const variants = await findVariantSpawner(inputDir, sliceName, file)
  for (const item of variants || []) {
    if (!item.vitalsID) {
      continue
    }
    const table = await findDamageTable(inputDir, item.sliceName)
    result.push({
      vitalsID: item.vitalsID,
      categoryID: item.categoryID,
      level: item.level,
      damageTable: table?.damageTable,
      modelSlice: table?.modelSlice,
    })
  }

  const definitions = await findSpawnDefinitions(inputDir, sliceName, file)
  for (const item of definitions || []) {
    const table = await findDamageTable(inputDir, item.sliceName)
    if (!table?.vitalsID) {
      continue
    }
    result.push({
      vitalsID: table.vitalsID,
      categoryID: null,
      level: null,
      damageTable: table.damageTable,
      modelSlice: table.modelSlice,
    })
  }
  return result.filter((it) => !!it.vitalsID)
}

interface VariantSpawner {
  vitalsID: string
  categoryID: string
  level: number
  sliceName: string
  aliasName: string
}
async function findVariantSpawner(rootDir: string, sliceName: string, file?: string) {
  file = findDynamicSlice(rootDir, sliceName, file)
  if (!file) {
    return []
  }

  return cached(`findVariantSpawner ${file}`, async () => {
    const result: VariantSpawner[] = []
    const sliceComponent = await findSliceComponent(file)
    sliceComponent?.entities?.forEach((entity) => {
      let vitalsID: string = null
      let categoryID: string = null
      let level: number = null
      let sliceName: string = null
      let aliasName: string = null
      for (const component of entity.components) {
        if (isAIVariantProviderComponent(component)) {
          if (isAIVariantProviderComponentServerFacet(component.baseclass1?.m_serverfacetptr)) {
            vitalsID = vitalsID || component.baseclass1.m_serverfacetptr.m_vitalstablerowid
            categoryID = categoryID || component.baseclass1.m_serverfacetptr.m_vitalscategorytablerowid
            level = level || component.baseclass1.m_serverfacetptr.m_vitalslevel
          }
        }
        if (isPointSpawnerComponent(component)) {
          sliceName = sliceName || component.baseclass1.m_sliceasset?.hint
          aliasName = aliasName || component.baseclass1.m_aliasasset?.hint
        }
      }
      if (!vitalsID) {
        return
      }
      result.push({
        vitalsID,
        categoryID,
        level,
        sliceName,
        aliasName,
      })
    })
    for (const item of result) {
      if (!item.sliceName && item.aliasName) {
        item.sliceName = await findAliasedFile(rootDir, item.aliasName)
      }
    }
    return result
  })
}

interface SpawnDefinitionResult {
  sliceName: string
  aliasName: string
}
async function findSpawnDefinitions(rootDir: string, sliceName: string, file?: string) {
  file = findDynamicSlice(rootDir, sliceName, file)
  if (!file) {
    return []
  }
  return cached(`findSpawnDefinitions ${file}`, async () => {
    const result: SpawnDefinitionResult[] = []
    const sliceComponent = await findSliceComponent(file)
    sliceComponent?.entities?.forEach((entity) => {
      entity?.components?.forEach((component) => {
        if (!isEncounterComponent(component)) {
          return
        }
        component.m_spawntimeline?.forEach((obj) => {
          if (isSpawnDefinition(obj)) {
            result.push({
              sliceName: obj.m_sliceasset?.hint,
              aliasName: obj.m_aliasasset?.hint,
            })
          }
        })
      })
    })
    for (const item of result) {
      if (!item.sliceName && item.aliasName) {
        item.sliceName = await findAliasedFile(rootDir, item.aliasName)
      }
    }
    return result.filter((it) => it.sliceName)
  })
}

async function findAliasedFile(rootDir: string, aliasName: string, file?: string) {
  if (!file && !aliasName) {
    return null
  }
  file = file || path.join(rootDir, aliasName + '.json')
  return cached(`findAliasedFile ${file}`, async () => {
    let result: string = null
    walkJsonObjects(await readJSONFile(file), (obj) => {
      if (isAsset(obj) && obj.hint) {
        result = obj.hint
      }
    })
    return result
  })
}

async function findDamageTable(rootDir: string, sliceName: string, file?: string) {
  file = findDynamicSlice(rootDir, sliceName, file)
  if (!file) {
    return null
  }
  return cached(`findDamageTable ${file}`, async () => {
    let vitalsID: string = null
    let damageTable: string = null
    let modelSlice: string = null

    const sliceComponent = await findSliceComponent(file)
    sliceComponent?.entities?.forEach((entity) => {
      entity?.components?.forEach((obj) => {
        if (isVitalsComponent(obj)) {
          vitalsID = vitalsID || obj.m_rowreference
        }
        if (isActionListComponent(obj)) {
          damageTable = damageTable || obj.m_damagetable?.asset?.baseclass1?.assetpath
        }
        let hasModel = false
        hasModel = hasModel || (isSkinnedMeshComponent(obj) && obj['skinned mesh render node']?.visible)
        hasModel = hasModel || (isMeshComponent(obj) && obj['static mesh render node']?.visible)
        if (hasModel) {
          modelSlice = path
            .relative(rootDir, file)
            .replace(/\\/gi, '/')
            .replace(/\.json$/, '.glb')
            .toLowerCase()
        }
      })
    })
    return {
      vitalsID,
      damageTable,
      modelSlice,
    }
  })
}

async function findSliceComponent(file: string) {
  const data = await readJSONFile(file)
  if (!isAZ__Entity(data)) {
    return null
  }
  for (const component of data.components || []) {
    if (isSliceComponent(component)) {
      return component
    }
  }
  return null
}

function findDynamicSlice(rootDir: string, sliceName: string, file?: string) {
  if (!file && sliceName) {
    file = path.join(rootDir, toDynamicSlice(sliceName))
  }
  if (!file || !fs.existsSync(file)) {
    return null
  }
  return file
}

function toDynamicSlice(fileOrName: string) {
  if (!path.extname(fileOrName)) {
    fileOrName = fileOrName + '.dynamicslice'
  }
  if (path.extname(fileOrName).toLocaleLowerCase() === '.slice') {
    fileOrName = replaceExtname(fileOrName, '.dynamicslice')
  }
  if (path.extname(fileOrName).toLocaleLowerCase() === '.dynamicslice') {
    fileOrName = fileOrName + '.json'
  }
  return fileOrName
}
