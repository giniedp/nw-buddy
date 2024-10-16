import {
  ScannedData,
  readDynamicSliceFileCached,
  scanForAreaSpawners,
  scanForData,
  scanForEncounterSpawner,
  scanForEncounterType,
  scanForPointSpawners,
  scanForPrefabSpawner,
} from './scan-for-spawners-utils'
import { AZ__Entity } from './types/dynamicslice'
import { resolveDynamicSliceFiles, rotatePoints, translatePoints } from './utils'

export type SpawnerScanResult = {
  variantID?: string
  gatherableID?: string
  loreIDs?: string[]
  encounter: string

  vitalsID?: string
  npcID?: string
  categoryID?: string
  level?: number
  territoryLevel?: boolean
  damageTable?: string
  modelFile?: string
  mtlFile?: string
  adbFile?: string
  positions: Array<number[]>
  houseTypes: string[]
}

export async function scanForSpawners(rootDir: string, file: string, assetId: string): Promise<SpawnerScanResult[]> {
  const result: SpawnerScanResult[] = []
  const files = await resolveDynamicSliceFiles(rootDir, file, assetId)
  if (!files) {
    return result
  }
  for (const file of files) {
    for await (const item of scan(rootDir, file, [])) {
      if (item.positions.length) {
        result.push(item)
      }
    }
  }
  return result
}

async function* scan(rootDir: string, file: string, stack: string[]) {
  const files = await resolveDynamicSliceFiles(rootDir, file)
  for (const file of files || []) {
    for await (const item of scanFile(rootDir, file, stack)) {
      yield item
    }
  }
}
const DEBUG_VITAL = '' // 'Undead_Admiral_Brute_DG_Cutlass_00'
function debugVital(result: SpawnerScanResult, file: string) {
  if (!DEBUG_VITAL) {
    return
  }
  if (result?.vitalsID === DEBUG_VITAL) {
    console.log('DEBUG', result.vitalsID, result.positions)
  }
}
async function* scanFile(rootDir: string, file: string, stack: string[]): AsyncGenerator<SpawnerScanResult> {
  if (!file) {
    return
  }
  if (stack.includes(file)) {
    return
  }
  stack = [...stack, file]
  const component = await readDynamicSliceFileCached(file)
  if (!component) {
    return
  }

  const encounterType = scanForEncounterType(component)
  const data = await scanForData(component, rootDir, file)
  const unconsumed = [...data]
  function consume(entity: AZ__Entity) {
    const index = unconsumed.findIndex((it) => it.entity === entity)
    if (index >= 0) {
      unconsumed.splice(index, 1)
    }
    return data.find((it) => it.entity === entity)
  }
  function mergeData(result: SpawnerScanResult, meta: ScannedData): SpawnerScanResult {
    if (!meta) {
      return result
    }

    return {
      ...result,
      variantID: result.variantID || meta.variantID,
      gatherableID: result.gatherableID || meta.gatherableID,
      loreIDs: result.loreIDs || meta.loreIDs,

      vitalsID: meta.vitalsID || result.vitalsID,
      categoryID: meta.categoryID || result.categoryID,
      level: meta.level || result.level,
      territoryLevel: meta.territoryLevel || result.territoryLevel,
      modelFile: meta.modelFile || result.modelFile,
      damageTable: meta.damageTable || result.damageTable,
      mtlFile: meta.mtlFile || result.mtlFile,
      adbFile: meta.adbFile || result.adbFile,
    }
  }

  const pointSpawns = await scanForPointSpawners(component, rootDir, file)
  for (const spawn of pointSpawns || []) {
    spawn.translation = [0, 0, 0]
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(
        {
          ...item,
          encounter: encounterType || item.encounter,
          positions: translatePoints(rotatePoints(item.positions, spawn.rotation), spawn.translation),
        },
        consume(spawn.entity),
      )
      debugVital(result, file)
      yield result
    }
  }

  const prefabSpawn = await scanForPrefabSpawner(component, rootDir, file)
  for (const spawn of prefabSpawn || []) {
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(
        {
          ...item,
          encounter: encounterType || item.encounter,
          variantID: spawn.variantID || item.variantID,
          positions: translatePoints(rotatePoints(item.positions, spawn.rotation), spawn.translation),
        },
        consume(spawn.entity),
      )
      debugVital(result, file)
      yield result
    }
  }

  const encounterSpawns = await scanForEncounterSpawner(component, rootDir, file)
  for (const spawn of encounterSpawns || []) {
    const locations = spawn.locations?.length ? spawn.locations : [{ translation: [0, 0, 0], rotation: null }]
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      for (const location of locations) {
        const result = mergeData(
          {
            ...item,
            encounter: encounterType || item.encounter,
            positions: translatePoints(rotatePoints(item.positions, location.rotation), location.translation),
          },
          consume(spawn.entity),
        )
        debugVital(result, file)
        yield result
      }
    }
  }

  const areaSpawns = await scanForAreaSpawners(component, rootDir, file)
  for (const spawn of areaSpawns || []) {
    if (!spawn.locations?.length) {
      continue
    }
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      for (const location of spawn.locations) {
        const result = mergeData(
          {
            ...item,
            encounter: encounterType || item.encounter,
            positions: translatePoints(rotatePoints(item.positions, location.rotation), location.translation),
          },
          consume(spawn.entity),
        )
        debugVital(result, file)
        yield result
      }
    }
  }

  for (const item of unconsumed) {
    if (item.houseTypes?.length) {
      yield {
        encounter: null,
        gatherableID: null,
        variantID: null,
        positions: [[0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseTypes: item.houseTypes,
      }
    }
    if (item.vitalsID) {
      const result: SpawnerScanResult = {
        encounter: encounterType,
        vitalsID: item.vitalsID,
        categoryID: item.categoryID,
        level: item.level,
        territoryLevel: item.territoryLevel,
        damageTable: item.damageTable,
        modelFile: item.modelFile,
        positions: [[0, 0, 0]],
        mtlFile: item.mtlFile,
        adbFile: item.adbFile,
        houseTypes: item.houseTypes,
      }
      debugVital(result, file)
      yield result
    }
    if (item.gatherableID || item.variantID) {
      yield {
        encounter: encounterType,
        gatherableID: item.gatherableID,
        variantID: item.variantID,
        positions: [[0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseTypes: null,
      }
    }
    if (item.loreIDs?.length) {
      yield {
        encounter: encounterType,
        loreIDs: item.loreIDs,
        positions: [[0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseTypes: null,
      }
    }
    if (item.npcID?.length) {
      yield {
        encounter: encounterType,
        npcID: item.npcID,
        positions: [[0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseTypes: null,
      }
    }
  }
}

function moveHouseShape(spaw: SpawnerScanResult, houses) {}
