import { groupBy, sumBy, uniqBy } from 'lodash'
import * as path from 'path'
import { environment } from '../../../env'
import { assmebleWorkerTasks, glob, withProgressPool, writeJSONFile } from '../../utils'
import { pathToDatatables } from '../tables'
import {
  GatherablesTableSchema,
  VariationsTableSchema,
  VitalsCategoriesTableSchema,
  VitalsTableSchema,
} from '../tables/schemas'

import { readAndExtractCrcValues } from './create-crc-file'
import { VitalScanRow } from './scan-for-vitals'
import { GatherableScanRow, TerritoryScanRow, VariationScanRow } from './scan-slices.task'
import { WORKER_TASKS } from './worker.tasks'

interface VitalMetadata {
  tables: Set<string>
  models: Set<string>
  mapIDs: Set<string>
  spawns: Array<{ level: number; mapId: string; category: string; position: number[]; damagetable: string }>
}

interface GatherableMetadata {
  mapIDs: Set<string>
  lootTables: Set<string>
  spawns: Array<{ position: number[]; mapId: string; lootTable: string }>
}

interface VariationMetadata {
  mapIDs: Set<string>
  spawns: Array<{ position: number[]; mapId: string }>
}

interface TerritoryMetadata {
  zones: Array<{ position: number[]; shape: number[][] }>
}

export async function importSlices({ inputDir, threads }: { inputDir: string; threads: number }) {
  const crcVitalsFile = environment.tmpDir('crcVitals.json')
  await readAndExtractCrcValues({
    schema: VitalsTableSchema,
    files: [
      path.join(pathToDatatables(inputDir), 'javelindata_vitals.json'),
      path.join(pathToDatatables(inputDir), 'vitalstables', '*_vitals_*.json'),
    ],
    extract: (row) => row.VitalsID.toLowerCase(),
  }).then((result) => writeJSONFile(result, { target: crcVitalsFile }))

  const crcVitalsCategoriesFile = environment.tmpDir('crcVitalsCategories.json')
  await readAndExtractCrcValues({
    schema: VitalsCategoriesTableSchema,
    files: [path.join(pathToDatatables(inputDir), 'javelindata_vitalscategories.json')],
    extract: (row) => row.VitalsCategoryID.toLowerCase(),
  }).then((result) => writeJSONFile(result, { target: crcVitalsCategoriesFile }))

  const crcGatherablesFile = environment.tmpDir('crcGatherables.json')
  await readAndExtractCrcValues({
    schema: GatherablesTableSchema,
    files: [path.join(pathToDatatables(inputDir), 'javelindata_gatherables.json')],
    extract: (row) => row.GatherableID.toLowerCase(),
  }).then((result) => writeJSONFile(result, { target: crcGatherablesFile }))

  const crcVariationsFile = environment.tmpDir('crcVariations.json')
  await readAndExtractCrcValues({
    schema: VariationsTableSchema,
    files: [path.join(pathToDatatables(inputDir), 'javelindata_variations_*.json')],
    extract: (row) => row.VariantID.toLowerCase(),
  }).then((result) => writeJSONFile(result, { target: crcVariationsFile }))

  const vitals = new Map<string, VitalMetadata>()
  const gatherables = new Map<string, GatherableMetadata>()
  const variations = new Map<string, VariationMetadata>()
  const territories = new Map<string, TerritoryMetadata>()

  const files = await glob([
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.capitals.json`,
    `${inputDir}/**/region.distribution.json`,
    `${inputDir}/**/*.dynamicslice.json`,
    `!${inputDir}/lyshineui/**/*`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.metadata.json`,
  ])

  await withProgressPool({
    barName: 'Scan All',
    workerScript: path.resolve(__dirname, 'worker.js'),
    workerLimit: threads,
    workerType: 'thread',
    queue: assmebleWorkerTasks({
      registry: WORKER_TASKS,
      taskName: 'scanSlices',
      tasks: files.map((file) => {
        return {
          inputDir,
          file,
          crcVitalsFile,
          crcVitalsCategoriesFile,
          crcGatherablesFile,
          crcVariationsFile,
        }
      }),
      onTaskFinish: async (result) => {
        collectVitalsRows(result.vitals || [], vitals)
        collectGatherablesRows(result.gatherables || [], gatherables)
        collectVariationsRows(result.variations || [], variations)
        collectTerritoriesRows(result.territories || [], territories)
      },
    }),
  })

  return {
    vitals: buildResultVitals(vitals),
    gatherables: buildResultGatherables(gatherables),
    variations: buildResultVariations(variations),
    territories: buildResultTerritories(territories),
  }
}

function collectVitalsRows(rows: VitalScanRow[], data: Map<string, VitalMetadata>) {
  for (const row of rows || []) {
    const vitalID = row.vitalsID.toLowerCase()
    if (!data.has(vitalID)) {
      data.set(vitalID, { tables: new Set(), models: new Set(), mapIDs: new Set(), spawns: [] })
    }
    const bucket = data.get(vitalID)
    const damagetable = row.damageTable?.toLowerCase().replace('sharedassets/springboardentitites/datatables/', '')
    if (damagetable) {
      bucket.tables.add(damagetable)
    }
    if (row.mapID) {
      bucket.mapIDs.add(row.mapID)
    }
    if (row.modelSlice) {
      bucket.models.add(row.modelSlice)
    }
    if (row.position) {
      bucket.spawns.push({
        category: row.categoryID,
        level: row.level,
        position: row.position,
        mapId: row.mapID,
        damagetable: damagetable,
      })
    }
  }
}

function collectGatherablesRows(rows: GatherableScanRow[], data: Map<string, GatherableMetadata>) {
  for (const row of rows || []) {
    const gatherableID = row.gatherableID
    if (!data.has(gatherableID)) {
      data.set(gatherableID, { mapIDs: new Set(), lootTables: new Set(), spawns: [] })
    }
    const bucket = data.get(gatherableID)
    if (row.mapID) {
      bucket.mapIDs.add(row.mapID)
    }
    if (row.position) {
      bucket.spawns.push({
        position: row.position,
        lootTable: row.lootTable,
        mapId: row.mapID,
      })
    }
  }
}

function collectVariationsRows(rows: VariationScanRow[], data: Map<string, VariationMetadata>) {
  for (const row of rows || []) {
    const variantID = row.variantID
    if (!data.has(variantID)) {
      data.set(variantID, { mapIDs: new Set(), spawns: [] })
    }
    const bucket = data.get(variantID)
    if (row.mapID) {
      bucket.mapIDs.add(row.mapID)
    }
    if (row.position) {
      bucket.spawns.push({
        mapId: row.mapID,
        position: row.position,
      })
    }
  }
}

function collectTerritoriesRows(rows: TerritoryScanRow[], data: Map<string, TerritoryMetadata>) {
  for (const row of rows || []) {
    const territoryID = row.territoryID
    if (!data.has(territoryID)) {
      data.set(territoryID, { zones: [] })
    }
    const bucket = data.get(territoryID)
    if (row.position) {
      bucket.zones.push({
        position: row.position,
        shape: row.shape,
      })
    }
  }
}

function buildResultVitals(data: Map<string, VitalMetadata>) {
  return Array.from(data.entries())
    .sort((a, b) => compareStrings(a[0], b[0]))
    .map(([id, { tables, spawns, mapIDs, models }]) => {
      const result = {
        vitalsID: id,
        tables: Array.from(tables).sort(),
        mapIDs: Array.from(mapIDs).sort(),
        models: Array.from(models).sort(),
        lvlSpanws: {} as Record<string, Array<{ p: number[]; l: number }>>,
      }
      spawns.sort((a, b) => compareStrings(a.mapId, b.mapId))
      for (const spawn of spawns) {
        const mapId = spawn.mapId || '_'
        result.lvlSpanws[mapId] = result.lvlSpanws[mapId] || []
        result.lvlSpanws[mapId].push({
          p: spawn.position,
          l: spawn.level,
        })
      }
      for (const key in result.lvlSpanws) {
        result.lvlSpanws[key] = uniqBy(result.lvlSpanws[key], (it) => {
          return JSON.stringify(it)
        }).sort((a, b) => {
          return compareStrings(JSON.stringify(a), JSON.stringify(b))
        })
      }
      return result
    })
}

function buildResultGatherables(data: Map<string, GatherableMetadata>) {
  return Array.from(data.entries())
    .sort((a, b) => compareStrings(a[0], b[0]))
    .map(([id, { spawns, mapIDs, lootTables }]) => {
      const maps = Array.from(mapIDs.values()).sort()
      const tables = Array.from(lootTables.values()).sort()
      const result = {
        gatherableID: id,
        mapIDs: maps,
        lootTables: tables,
        spawns: {} as Record<string, number[][]>,
      }
      spawns.sort((a, b) => compareStrings(a.mapId, b.mapId))
      for (const spawn of spawns) {
        const mapId = spawn.mapId || '_'
        result.spawns[mapId] = result.spawns[mapId] || []
        result.spawns[mapId].push(spawn.position)
      }
      for (const key in result.spawns) {
        result.spawns[key] = uniqBy(result.spawns[key], (it) => {
          return JSON.stringify(it)
        }).sort((a, b) => {
          return compareStrings(String(a), String(b))
        })
      }
      return result
    })
}

function buildResultVariations(data: Map<string, VariationMetadata>) {
  type ChunkData = number[]
  type ChunkRows = Array<{
    chunk: number
    variantID: string
    mapId: string
    elementSize: 2
    elementOffset: number
    elementCount: number
  }>

  const chunksData: ChunkData[] = []
  const chunksRecords: ChunkRows[] = []
  const variationIds = new Set<string>()

  let currentData: ChunkData
  let currentChunk: ChunkRows
  let currentChunkIndex: number
  function add(variantId: string, mapId: string, positions: number[][]) {
    variationIds.add(variantId)
    if (!currentData || currentData.length + positions.length > 1000000) {
      currentChunkIndex = chunksData.length
      currentData = []
      currentChunk = []
      chunksData.push(currentData)
      chunksRecords.push(currentChunk)
    }
    currentChunk.push({
      chunk: currentChunkIndex,
      variantID: variantId,
      mapId: mapId,
      elementSize: 2,
      elementOffset: currentData.length / 2,
      elementCount: positions.length,
    })
    for (const [x, y] of positions) {
      currentData.push(x, y)
    }
  }

  for (const [variantId, { spawns }] of data.entries()) {
    const groups = groupBy(spawns, (it) => it.mapId)
    for (const mapId in groups) {
      const group = groups[mapId]
      add(
        variantId,
        mapId,
        group.map((it) => it.position),
      )
    }
  }

  const result: Record<
    string,
    {
      variantID: string
      mapIDs: string[]
      variantPositions: Array<{
        chunk: number
        mapId: string
        elementSize: 2
        elementOffset: number
        elementCount: number
      }>
    }
  > = {}

  for (const chunk of chunksRecords) {
    for (const entry of chunk) {
      if (!result[entry.variantID]) {
        result[entry.variantID] = {
          variantID: entry.variantID,
          mapIDs: [],
          variantPositions: [],
        }
      }
      if (!result[entry.variantID].mapIDs.includes(entry.mapId)) {
        result[entry.variantID].mapIDs.push(entry.mapId)
      }
      result[entry.variantID].variantPositions.push({
        chunk: entry.chunk,
        mapId: entry.mapId,
        elementSize: entry.elementSize,
        elementOffset: entry.elementOffset,
        elementCount: entry.elementCount,
      })
    }
  }

  const resultList = Object.values(result).sort((a, b) => {
    return compareStrings(a.variantID, b.variantID)
  })
  return {
    variationCount: variationIds.size,
    entryCount: sumBy(resultList, (record) => sumBy(record.variantPositions, (it) => it.elementCount)),
    records: resultList,
    chunks: chunksData.map((it) => new Float32Array(it)),
  }
}

function buildResultTerritories(data: Map<string, TerritoryMetadata>) {
  return Array.from(data.entries())
    .sort((a, b) => compareStrings(a[0], b[0]))
    .map(([id, { zones }]) => {
      const result = {
        territoryID: id,
        zones: zones
          .map((it) => {
            return {
              position: it.position,
              shape: it.shape,
            }
          })
          .sort((a, b) => compareStrings(String(a.position), String(b.position))),
      }
      return result
    })
}

function compareStrings(a: string, b: string) {
  return String(a).localeCompare(String(b))
}
