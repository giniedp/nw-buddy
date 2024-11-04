import {
  ScannedData,
  readDynamicSliceFileCached,
  scanForAreaSpawners,
  scanForData,
  scanForEncounterSpawner,
  scanForEncounterType,
  scanForFtueIslandSpawner,
  scanForPointSpawners,
  scanForPrefabSpawner,
  scanForProjectileSpawner,
} from './scan-for-spawners-utils'
import { AZ__Entity } from './types/dynamicslice'
import { resolveDynamicSliceFiles, rotatePoints, translatePoints } from './utils'

export type SpawnerScanResult = {
  variantID?: string
  gatherableID?: string
  loreIDs?: string[]
  encounter: string
  name: string

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
  houseType: string
  stationID: string
  structureType: string
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

  // #region FTUE Island Spawner
  for (const spawn of (await scanForFtueIslandSpawner(component, rootDir, file)) || []) {
    const result = mergeData(
      {
        positions: [[...spawn.translation]],
        encounter: encounterType,
        name: spawn.entity.name,
        houseType: null,
        stationID: null,
        structureType: null,
        vitalsID: 'Player',
      },
      consume(spawn.entity),
    )
    yield result
  }
  // #endregion

  // #region Point Spawner
  for (const spawn of (await scanForPointSpawners(component, rootDir, file)) || []) {
    spawn.translation = spawn.translation || [0, 0, 0]
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(
        {
          ...item,
          encounter: encounterType || item.encounter,
          positions: translatePoints(rotatePoints(item.positions, spawn.rotation), spawn.translation),
        },
        consume(spawn.entity),
      )
      yield result
    }
  }
  // #endregion

  // #region Prefab Spawner
  for (const spawn of (await scanForPrefabSpawner(component, rootDir, file)) || []) {
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
      yield result
    }
  }
  // #endregion

  // #region Projectile Spawner
  for (const spawn of (await scanForProjectileSpawner(component, rootDir, file)) || []) {
    if (!spawn.slice) {
      continue
    }
    //const debug = spawn.ammoID === 'Sandworm_BreachEvent_AcidBallLauncher_Projectile_Burst'
    for await (const item of scan(rootDir, spawn.slice, stack)) {
      const result = mergeData(
        {
          ...item,
          encounter: encounterType || item.encounter,
          positions: translatePoints(rotatePoints(item.positions, spawn.rotation), spawn.translation),
        },
        consume(spawn.entity),
      )
      yield result
    }
  }
  // #endregion

  // #region Encounter Spawner
  for (const spawn of (await scanForEncounterSpawner(component, rootDir, file)) || []) {
    const locations = spawn.locations?.length
      ? spawn.locations
      : [{ translation: spawn.translation, rotation: spawn.rotation }]
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
        yield result
      }
    }
  }
  // #endregion

  // #region Area Spawner
  for (const spawn of (await scanForAreaSpawners(component, rootDir, file)) || []) {
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
        yield result
      }
    }
  }
  // #endregion

  for (const item of unconsumed) {
    if (item.houseType) {
      yield {
        name: item.name,
        encounter: null,
        gatherableID: null,
        variantID: null,
        positions: [[0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseType: item.houseType,
        stationID: null,
        structureType: null,
      }
    }
    if (item.vitalsID) {
      const result: SpawnerScanResult = {
        name: item.name,
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
        houseType: null,
        stationID: null,
        structureType: null,
      }
      yield result
    }
    if (item.gatherableID || item.variantID) {
      yield {
        name: item.name,
        encounter: encounterType,
        gatherableID: item.gatherableID,
        variantID: item.variantID,
        positions: [[0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseType: null,
        stationID: null,
        structureType: null,
      }
    }
    if (item.loreIDs?.length) {
      yield {
        name: item.name,
        encounter: encounterType,
        loreIDs: item.loreIDs,
        positions: [[0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseType: null,
        stationID: null,
        structureType: null,
      }
    }
    if (item.npcID?.length) {
      yield {
        name: item.name,
        encounter: encounterType,
        npcID: item.npcID,
        positions: [item.position || [0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseType: null,
        stationID: null,
        structureType: null,
      }
    }

    if (item.stationID) {
      yield {
        name: item.name,
        encounter: null,
        npcID: null,
        positions: [item.position || [0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseType: null,
        stationID: item.stationID,
        structureType: null,
      }
    }

    if (item.structureType) {
      yield {
        name: item.name,
        encounter: null,
        npcID: null,
        positions: [item.position || [0, 0, 0]],
        damageTable: null,
        modelFile: null,
        mtlFile: null,
        adbFile: null,
        houseType: null,
        stationID: null,
        structureType: item.structureType,
      }
    }
  }
}
