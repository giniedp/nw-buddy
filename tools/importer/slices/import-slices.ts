import { chain, groupBy, sortBy, sumBy, uniq } from 'lodash'
import * as path from 'path'
import { environment } from '../../../env'
import { arrayAppend, assmebleWorkerTasks, glob, readJSONFile, withProgressPool, writeJSONFile } from '../../utils'
import { pathToDatatables } from '../tables'
import {
  GatherablesTableSchema,
  VariationsTableSchema,
  VitalsCategoriesTableSchema,
  VitalsTableSchema,
} from '../tables/schemas'

import { z } from 'zod'
import { CaseInsensitiveSet } from '../../utils/caseinsensitive-set'
import { readAndExtractCrcValues } from './create-crc-file'
import { VitalScanRow } from './scan-for-models'
import { VariationScanRow } from './scan-for-variants'
import { TerritoryScanRow } from './scan-for-zones'
import { GatherableScanRow, LoreScanRow } from './scanner.task'
import { isPointInAABB, isPointInPolygon } from './utils'
import { WORKER_TASKS } from './worker.tasks'

interface VitalMetadata {
  tables: string[]
  models: string[]
  mapIDs: string[]
  catIDs: string[]
  levels: number[]
  spawns: Array<{
    level: number
    territoryLevel: boolean
    territories: number[]
    mapId: string
    category: string
    position: number[]
    damagetable: string
  }>
}

interface GatherableMetadata {
  mapIDs: string[]
  spawns: Array<{
    position: number[]
    mapId: string
  }>
}

interface VariationMetadata {
  mapIDs: string[]
  spawns: Array<{
    position: number[]
    mapId: string
  }>
}

interface TerritoryMetadata {
  zones: Array<{
    shape: number[][]
    min: number[]
    max: number[]
  }>
}
interface LoreMetadata {
  mapIDs: string[]
  spawns: Array<{
    position: number[]
    mapId: string
  }>
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

  const vitals: Record<string, VitalMetadata> = {}
  const gatherables: Record<string, GatherableMetadata> = {}
  const variations: Record<string, VariationMetadata> = {}
  const territories: Record<string, TerritoryMetadata> = {}
  const loreItems: Record<string, LoreMetadata> = {}

  const files = await glob([
    // `${inputDir}/sharedassets/coatlicue/newworld_vitaeeterna/regions/r_+02_+02/capitals/dungeon_script/dungeon_script.capitals.json`,
    // `${inputDir}/sharedassets/coatlicue/newworld_vitaeeterna/regions/r_+02_+02/capitals/dungeon_spawners/dungeon_spawners.capitals.json`,
    // `${inputDir}/sharedassets/coatlicue/newworld_vitaeeterna/regions/r_+02_+02/capitals/**/*.capitals.json`,
    // `${inputDir}/sharedassets/coatlicue/newworld_vitaeeterna/regions/r_+03_+02/capitals/**/*.capitals.json`,
    //
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.capitals.json`,
    `${inputDir}/**/region.distribution.json`,
    `${inputDir}/**/*.dynamicslice.json`,
    `!${inputDir}/lyshineui/**/*`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.metadata.json`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.slicedata.json`,
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
        collectLoreRows(result.loreItems || [], loreItems)
      },
    }),
  })

  await applyTerritoryToVital(inputDir, vitals, territories)
  await applyDefaultLevel(inputDir, vitals)

  return {
    vitals: toSortedVitals(vitals),
    gatherables: toSortedGatherables(gatherables),
    variations: toSortedVariations(variations),
    territories: toSortedTerritories(territories),
    loreItems: toSortedLoreItems(loreItems),
  }
}

function collectLoreRows(rows: LoreScanRow[], data: Record<string, LoreMetadata>) {
  for (const row of rows || []) {
    const loreID = row.loreID.toLowerCase()
    if (!(loreID in data)) {
      data[loreID] = { mapIDs: [], spawns: [] }
    }
    const bucket = data[loreID]
    if (row.mapID) {
      arrayAppend(bucket.mapIDs, row.mapID.toLowerCase())
    }
    if (row.position) {
      bucket.spawns.push({
        mapId: row.mapID?.toLowerCase(),
        position: row.position.map((it) => Number(it.toFixed(3))),
      })
    }
  }
}

function collectVitalsRows(rows: VitalScanRow[], data: Record<string, VitalMetadata>) {
  for (const row of rows || []) {
    const vitalID = row.vitalsID.toLowerCase()
    if (!(vitalID in data)) {
      data[vitalID] = {
        tables: [],
        models: [],
        mapIDs: [],
        catIDs: [],
        levels: [],
        spawns: [],
      }
    }
    const bucket = data[vitalID]
    const damagetable = row.damageTable?.toLowerCase()?.replace('sharedassets/springboardentitites/datatables/', '')
    if (damagetable) {
      arrayAppend(bucket.tables, damagetable.toLowerCase())
    }
    if (row.mapID) {
      arrayAppend(bucket.mapIDs, row.mapID.toLowerCase())
    }
    if (row.modelFile) {
      arrayAppend(bucket.models, row.modelFile.toLowerCase())
    }
    if (row.level) {
      arrayAppend(bucket.levels, row.level)
    } else {
    }
    if (row.categoryID) {
      arrayAppend(bucket.catIDs, row.categoryID.toLowerCase())
    }
    if (row.position) {
      bucket.spawns.push({
        level: row.level,
        territoryLevel: row.territoryLevel,
        position: [Number(row.position[0].toFixed(3)), Number(row.position[1].toFixed(3))],
        mapId: row.mapID?.toLowerCase(),
        category: row.categoryID?.toLowerCase(),
        damagetable: damagetable,
        territories: [],
      })
    }
  }
}

function collectGatherablesRows(rows: GatherableScanRow[], data: Record<string, GatherableMetadata>) {
  for (const row of rows || []) {
    const gatherableID = row.gatherableID.toLowerCase()
    if (!(gatherableID in data)) {
      data[gatherableID] = {
        mapIDs: [],
        spawns: [],
      }
    }
    const bucket = data[gatherableID]
    if (row.mapID) {
      arrayAppend(bucket.mapIDs, row.mapID.toLowerCase())
    }
    if (row.position) {
      bucket.spawns.push({
        position: row.position.map((it) => Number(it.toFixed(3))),
        mapId: row.mapID?.toLowerCase(),
      })
    }
  }
}

function collectVariationsRows(rows: VariationScanRow[], data: Record<string, VariationMetadata>) {
  for (const row of rows || []) {
    const variantID = row.variantID.toLowerCase()
    if (!(variantID in data)) {
      data[variantID] = { mapIDs: [], spawns: [] }
    }
    const bucket = data[variantID]
    if (row.mapID) {
      arrayAppend(bucket.mapIDs, row.mapID.toLowerCase())
    }
    if (row.position) {
      bucket.spawns.push({
        mapId: row.mapID?.toLowerCase(),
        position: row.position.map((it) => Number(it.toFixed(3))),
      })
    }
  }
}

function collectTerritoriesRows(rows: TerritoryScanRow[], data: Record<string, TerritoryMetadata>) {
  for (const row of rows || []) {
    const territoryID = row.territoryID.toLowerCase()
    if (!(territoryID in data)) {
      data[territoryID] = { zones: [] }
    }
    const bucket = data[territoryID]
    if (row.position && row.shape.length > 0) {
      const positions = row.shape.map(([x, y]) => {
        return [x + (row.position[0] || 0), y + (row.position[1] || 0)]
      })
      const min = [null, null]
      const max = [null, null]
      for (const [x, y] of positions) {
        if (min[0] === null || x < min[0]) {
          min[0] = x
        }
        if (min[1] === null || y < min[1]) {
          min[1] = y
        }
        if (max[0] === null || x > max[0]) {
          max[0] = x
        }
        if (max[1] === null || y > max[1]) {
          max[1] = y
        }
      }
      bucket.zones.push({
        shape: positions,
        min: min,
        max: max,
      })
    }
  }
}

async function applyDefaultLevel(rootDir: string, vitals: Record<string, VitalMetadata>) {
  const dataFiles = await glob([
    path.join(rootDir, 'sharedassets/springboardentitites/datatables/javelindata_vitals.json'),
    path.join(rootDir, 'sharedassets/springboardentitites/datatables/**/javelindata_vitals_*.json'),
  ])
  const schema = z.array(z.object({ VitalsID: z.string(), Level: z.number().optional() }))
  const levelMap = await Promise.all(dataFiles.map((file) => readJSONFile(file, schema)))
    .then((list) => list.flat())
    .then((list) => new Map(list.map((it) => [it.VitalsID.toLowerCase(), it.Level])))

  for (const [vitalId, vital] of Object.entries(vitals)) {
    for (const spawn of vital.spawns) {
      if (spawn.level) {
        continue
      }
      if (!levelMap.has(vitalId.toLowerCase())) {
        console.log('Missing level for', vitalId)
        continue
      }
      spawn.level = levelMap.get(vitalId.toLowerCase())
    }
  }

  return vitals
}

async function applyTerritoryToVital(
  rootDir: string,
  vitals: Record<string, VitalMetadata>,
  territories: Record<string, TerritoryMetadata>,
) {

  const schema = z.array(z.object({ TerritoryID: z.number(), AIVariantLevelOverride: z.number().optional() }))
  const pois = await glob([
    path.join(rootDir, 'sharedassets/springboardentitites/datatables/javelindata_areadefinitions.json'),
    path.join(rootDir, 'sharedassets/springboardentitites/datatables/javelindata_territorydefinitions.json'),
    path.join(rootDir, 'sharedassets/springboardentitites/datatables/pointofinterestdefinitions/*.json'),
  ]).then(async (files) => {
    return Promise.all(files.map((file) => readJSONFile(file, schema)))
  })
  .then((list) => list.flat())
  .then((list) => {
    return list.map((it) => {
      if (!territories[it.TerritoryID]?.zones?.length) {
        return null
      }
      return {
        level: it.AIVariantLevelOverride,
        territoryID: it.TerritoryID,
        ...territories[it.TerritoryID],
      }
    })
  })
  .then((list) => list.filter((it) => !!it))

  for (const vital of Object.values(vitals)) {
    for (const poi of pois) {
      if (!poi.zones?.length) {
        continue
      }
      for (const spawn of vital.spawns) {
        if (spawn.mapId !== 'newworld_vitaeeterna') {
          continue
        }
        if (!isPointInAABB(spawn.position, poi.zones[0].min, poi.zones[0].max)) {
          continue
        }
        if (!isPointInPolygon(spawn.position, poi.zones[0].shape)) {
          continue
        }
        if (spawn.territoryLevel) {
          spawn.level = poi.level
        }
        spawn.territories = spawn.territories || []
        arrayAppend(spawn.territories, poi.territoryID)
      }
    }
  }

  return vitals
}

function toSortedVitals(data: Record<string, VitalMetadata>) {
  return Array.from(Object.entries(data))
    .sort((a, b) => compareStrings(a[0], b[0]))
    .map(([id, { tables, spawns, mapIDs, catIDs, levels, models }]) => {
      const result = {
        vitalsID: id,
        tables: Array.from(tables).sort(),
        mapIDs: Array.from(mapIDs).sort(),
        models: Array.from(models).sort(),
        catIDs: Array.from(catIDs).sort(),
        levels: [],
        territories: [],
        lvlSpanws: {} as Record<
          string,
          Array<{
            p: number[]
            l: Array<number | string>[]
            c: string[]
            t: number[]
          }>
        >,
      }
      spawns.sort((a, b) => compareStrings(a.mapId, b.mapId))
      for (const spawn of spawns) {
        const mapId = spawn.mapId || '_'
        const levels = []
        if (spawn.level) {
          levels.push(spawn.level)
        }
        result.lvlSpanws[mapId] = result.lvlSpanws[mapId] || []
        result.lvlSpanws[mapId].push({
          l: levels,
          c: spawn.category ? [spawn.category] : [],
          p: spawn.position,
          t: spawn.territories,
        })
      }
      for (const key in result.lvlSpanws) {
        result.lvlSpanws[key] = chain(result.lvlSpanws[key])
          .groupBy((it) => it.p.join(','))
          .values()
          .map((it) => {
            return {
              p: it[0].p,
              l: uniq(it.map((it) => it.l).flat()).sort(),
              c: uniq(it.map((it) => it.c).flat()).sort(),
              t: uniq(it[0].t).sort(),
            }
          })
          .sortBy((it) => it.p.join(','))
          .value()
      }
      result.levels = uniq(
        Object.values(result.lvlSpanws)
          .map((list) => list.map((it) => it.l).flat())
          .flat(),
      )
        .sort()
        .filter((it) => !!it)
      result.territories = uniq(
        Object.values(result.lvlSpanws)
          .map((list) => list.map((it) => it.t).flat())
          .flat(),
      )
        .sort()
        .filter((it) => !!it)
      return result
    })
}

function toSortedGatherables(data: Record<string, GatherableMetadata>) {
  return Array.from(Object.entries(data))
    .sort((a, b) => compareStrings(a[0], b[0]))
    .map(([id, { spawns, mapIDs }]) => {
      const maps = Array.from(mapIDs.values()).sort()
      const result = {
        gatherableID: id,
        mapIDs: maps,
        spawns: {} as Record<string, number[][]>,
      }
      spawns.sort((a, b) => compareStrings(a.mapId, b.mapId))
      for (const spawn of spawns) {
        const mapId = spawn.mapId || '_'
        result.spawns[mapId] = result.spawns[mapId] || []
        result.spawns[mapId].push(spawn.position)
      }
      for (const key in result.spawns) {
        result.spawns[key] = chain(result.spawns[key])
          .uniqBy((it) => it.join(','))
          .sortBy((it) => it.join(','))
          .value()
      }
      return result
    })
}

function toSortedVariations(data: Record<string, VariationMetadata>) {
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
  const variationIds = new CaseInsensitiveSet<string>()

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

  Array.from(Object.entries(data))
    .sort((a, b) => compareStrings(a[0], b[0]))
    .forEach(([variantId, { spawns }]) => {
      Array.from(Object.entries(groupBy(spawns, (it) => it.mapId)))
        .sort((a, b) => compareStrings(a[0], b[0]))
        .forEach(([mapId, group]) => {
          const positions = sortBy(group, (it) => it.position.join(',')).map((it) => it.position)
          add(variantId, mapId, positions)
        })
    })

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

function toSortedTerritories(data: Record<string, TerritoryMetadata>) {
  return Array.from(Object.entries(data))
    .sort((a, b) => compareStrings(a[0], b[0]))
    .map(([id, { zones }]) => {
      const result = {
        territoryID: id,
        zones: zones,
      }
      return result
    })
}

function toSortedLoreItems(data: Record<string, LoreMetadata>) {
  return Array.from(Object.entries(data))
    .sort((a, b) => compareStrings(a[0], b[0]))
    .map(([id, { mapIDs, spawns }]) => {
      const result = {
        loreID: id,
        mapIDs: Array.from(mapIDs).sort(),
        loreSpawns: {} as Record<string, Array<number[]>>,
      }
      spawns.sort((a, b) => compareStrings(a.mapId, b.mapId))
      for (const spawn of spawns) {
        const mapId = spawn.mapId || '_'
        result.loreSpawns[mapId] = result.loreSpawns[mapId] || []
        result.loreSpawns[mapId].push(spawn.position)
      }
      for (const key in result.loreSpawns) {
        result.loreSpawns[key] = chain(result.loreSpawns[key])
          .groupBy((it) => it.join(','))
          .values()
          .map((it) => it[0])
          .sortBy((it) => it.join(','))
          .value()
      }
      return result
    })
}

function compareStrings(a: string, b: string) {
  return String(a).localeCompare(String(b))
}
