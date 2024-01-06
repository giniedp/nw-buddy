import {
  ScannedData,
  readDynamicSliceFileCached,
  scanForAreaSpawners,
  scanForData,
  scanForEncounterSpawner,
  scanForPointSpawners,
  scanForPrefabSpawner,
} from './scan-for-spawners-utils'
import { AZ__Entity } from './types/dynamicslice'
import { resolveDynamicSliceFiles, rotatePoints, translatePoints } from './utils'

export type SpawnerScanResult = {
  variantID?: string
  gatherableID?: string
  loreIDs?: string[]

  vitalsID?: string
  categoryID?: string
  level?: number
  territoryLevel?: boolean
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
      damageTable: meta.damageTable || result.damageTable,
      modelFile: meta.modelFile || result.modelFile,
    }
  }

  const pointSpawns = await scanForPointSpawners(component, rootDir, file)
  for (const spawn of pointSpawns || []) {
    spawn.translation = [0, 0, 0]
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(
        {
          ...item,
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
    if (item.vitalsID) {
      const result: SpawnerScanResult = {
        vitalsID: item.vitalsID,
        categoryID: item.categoryID,
        level: item.level,
        territoryLevel: item.territoryLevel,
        damageTable: item.damageTable,
        modelFile: item.modelFile,
        positions: [[0, 0, 0]],
      }
      debugVital(result, file)
      yield result
    }
    if (item.gatherableID || item.variantID) {
      yield {
        gatherableID: item.gatherableID,
        variantID: item.variantID,
        positions: [[0, 0, 0]],
      }
    }
    if (item.loreIDs?.length) {
      yield {
        loreIDs: item.loreIDs,
        positions: [[0, 0, 0]],
      }
    }
  }
}
