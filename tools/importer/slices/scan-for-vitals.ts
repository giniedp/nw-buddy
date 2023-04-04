import * as fs from 'fs'
import * as path from 'path'
import { readJSONFile, replaceExtname } from '../../utils'
import { walkJsonObjects } from '../../utils/walk-json-object'
import { cached } from './cache'

import { ActionListComponent, Asset, EntityWithSpawner, SpawnDefinition, VitalsComponent } from './types'

export interface VitalVariant {
  vitalsID: string
  categoryID: string
  level: number
  damageTable: string
  position?: number[]
  mapID?: string
}
export async function scanForVitals(inputDir: string, sliceName: string, file?: string): Promise<VitalVariant[]> {
  const result: VitalVariant[] = []
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
    walkJsonObjects(await readJSONFile(file), (entity: EntityWithSpawner) => {
      if (entity.__type !== 'AZ::Entity') {
        return
      }
      let vitalsID: string = null
      let categoryID: string = null
      let level: number = null
      let sliceName: string = null
      let aliasName: string = null
      for (const component of entity.components) {
        if (component.__type === 'AIVariantProviderComponent') {
          if (component.baseclass1?.m_serverfacetptr) {
            vitalsID = vitalsID || component.baseclass1.m_serverfacetptr.m_vitalstablerowid
            categoryID = categoryID || component.baseclass1.m_serverfacetptr.m_vitalscategorytablerowid
            level = level || component.baseclass1.m_serverfacetptr.m_vitalslevel
          }
        }
        if (component.__type === 'PointSpawnerComponent') {
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
    walkJsonObjects(await readJSONFile(file), (obj: SpawnDefinition) => {
      if (obj.__type !== 'SpawnDefinition') {
        return false
      }
      result.push({
        sliceName: obj.m_sliceasset?.hint,
        aliasName: obj.m_aliasasset?.hint,
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
    walkJsonObjects(await readJSONFile(file), (obj: Asset) => {
      if (obj.__type === 'Asset' && obj.hint) {
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
    walkJsonObjects(await readJSONFile(file), (obj: VitalsComponent | ActionListComponent) => {
      if (obj.__type === 'VitalsComponent') {
        vitalsID = vitalsID || obj.m_rowreference
      }
      if (obj.__type === 'ActionListComponent') {
        damageTable = damageTable || obj.m_damagetable?.asset?.baseclass1?.assetpath
      }
    })
    return {
      vitalsID,
      damageTable,
    }
  })
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