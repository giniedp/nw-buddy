import {
  ScannedData,
  readCached,
  scanForAreaSpawners,
  scanForData,
  scanForEncounterSpawner,
  scanForPointSpawners,
  scanForPrefabSpawner,
} from './scan-for-spawners-utils'
import { AZ__Entity } from './types/dynamicslice'
import { matrixMapPositions, resolveDynamicSliceFiles } from './utils'

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
async function* scanFile(rootDir: string, file: string, stack: string[]): AsyncGenerator<SpawnerScanResult> {
  if (!file) {
    return
  }
  if (stack.includes(file)) {
    return
  }
  stack = [...stack, file]
  const component = await readCached(file)
  if (!component) {
    return
  }

  const data = scanForData(component, rootDir, file)
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
    spawn.position = [0, 0, 0]
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(item, consume(spawn.entity))
      yield result
    }
  }

  const prefabSpawn = await scanForPrefabSpawner(component, rootDir, file)
  for (const spawn of prefabSpawn || []) {
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(
        {
          ...item,
          positions: matrixMapPositions([spawn.position], item.positions),
        },
        consume(spawn.entity),
      )
      yield result
    }
  }

  const encounterSpawns = await scanForEncounterSpawner(component, rootDir, file)
  for (const spawn of encounterSpawns || []) {
    const positions = matrixMapPositions([[0, 0, 0]], spawn.positions)
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(
        {
          ...item,
          positions: matrixMapPositions(positions, item.positions),
        },
        consume(spawn.entity),
      )
      yield result
    }
  }

  const areaSpawns = await scanForAreaSpawners(component, rootDir, file)
  for (const spawn of areaSpawns || []) {
    if (!spawn.positions?.length) {
      continue
    }
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(
        {
          ...item,
          positions: matrixMapPositions(spawn.positions, item.positions),
        },
        consume(spawn.entity),
      )
      yield result
    }
  }

  for (const item of unconsumed) {
    if (item.vitalsID) {
      yield {
        vitalsID: item.vitalsID,
        categoryID: item.categoryID,
        level: item.level,
        territoryLevel: item.territoryLevel,
        damageTable: item.damageTable,
        modelFile: item.modelFile,
        positions: [[0, 0, 0]],
      }
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
