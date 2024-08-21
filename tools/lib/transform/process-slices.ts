import { chain, groupBy, sortBy, sumBy, uniq } from 'lodash'
import * as path from 'path'
import { arrayAppend, glob, readJSONFile, withProgressBar } from '../utils'

import { createHash } from 'node:crypto'
import { z } from 'zod'
import { logger } from '../utils/logger'

import { DatasheetFile } from '../file-formats/datasheet/converter'
import { VariationScanRow } from '../file-formats/slices/scan-for-variants'
import { VitalScanRow } from '../file-formats/slices/scan-for-vitals'
import { TerritoryScanRow } from '../file-formats/slices/scan-for-zones'
import { GatherableScanRow, LoreScanRow, NpcScanRow } from '../file-formats/slices/scan-slices'
import { isPointInAABB, isPointInPolygon } from '../file-formats/slices/utils'
import { runTasks } from '../worker/runner'

interface VitalMetadata {
  tables: string[]
  models: string[]
  mapIDs: string[]
  catIDs: string[]
  gthIDs: string[]
  npcIDs: string[]
  levels: number[]
  spawns: Array<{
    random: boolean
    level: number
    territoryLevel: boolean
    territories: number[]
    mapId: string
    category: string
    gatherable: string
    position: number[]
    damagetable: string
    model: string
  }>
}

interface VitalModelMetadata {
  id: string
  cdf: string
  mtl: string
  adb: string
  tags: string[]
  vitalIds: string[]
}

interface NpcMetadata {
  mapIDs: string[]
  spawns: Array<{
    position: number[]
    mapId: string
  }>
}
interface GatherableMetadata {
  mapIDs: string[]
  spawns: Array<{
    random: boolean
    position: number[]
    mapId: string
  }>
}

interface VariationMetadata {
  mapIDs: string[]
  spawns: Array<{
    random: boolean
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

export async function processSlices({ inputDir, threads }: { inputDir: string; threads: number }) {
  const npcs: Record<string, NpcMetadata> = {}
  const vitals: Record<string, VitalMetadata> = {}
  const vitalsModels: Record<string, VitalModelMetadata> = {}
  const gatherables: Record<string, GatherableMetadata> = {}
  const variations: Record<string, VariationMetadata> = {}
  const territories: Record<string, TerritoryMetadata> = {}
  const loreItems: Record<string, LoreMetadata> = {}

  const tablesDir = path.join(inputDir, 'sharedassets/springboardentitites')
  const tablesFiles = await glob(path.join(tablesDir, 'datatables', '**', '*.json'))
  const tables: Array<DatasheetFile<any>> = []
  await withProgressBar({ label: 'Read Tables', tasks: tablesFiles }, async (file) => {
    const data = await readJSONFile(
      file,
      z.object({
        header: z.any(),
        rows: z.array(z.any()),
      }),
    )
    tables.push(data as any)
  })

  const files = await glob([
    // `${inputDir}/sharedassets/coatlicue/newworld_vitaeeterna/regions/r_+02_+02/capitals/dungeon_script/dungeon_script.capitals.json`,
    // `${inputDir}/sharedassets/coatlicue/newworld_vitaeeterna/regions/r_+02_+02/capitals/dungeon_spawners/dungeon_spawners.capitals.json`,
    // `${inputDir}/sharedassets/coatlicue/newworld_vitaeeterna/regions/r_+02_+02/capitals/**/*.capitals.json`,
    // `${inputDir}/sharedassets/coatlicue/newworld_vitaeeterna/regions/r_+03_+02/capitals/**/*.capitals.json`,
    //
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.capitals.json`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.metadata.json`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.slicedata.json`,
    `${inputDir}/**/region.distribution.json`,
    `${inputDir}/**/*.dynamicslice.json`,
    `!${inputDir}/lyshineui/**/*`,
  ])

  await runTasks({
    label: 'Processing Slices',
    threads,
    taskName: 'scanSlices',
    tasks: files.map((file) => {
      return {
        inputDir,
        file,
      }
    }),
    onTaskFinish: async (result) => {
      collectNpcRows(result.npcs || [], npcs)
      collectVitalsRows(result.vitals || [], vitals, vitalsModels)
      collectGatherablesRows(result.gatherables || [], gatherables)
      collectVariationsRows(result.variations || [], variations)
      collectTerritoriesRows(result.territories || [], territories)
      collectLoreRows(result.loreItems || [], loreItems)
    },
  })

  await applyTerritoryToVital(inputDir, vitals, territories, tables)
  await applyDefaultLevel(inputDir, vitals, tables)

  return {
    vitals: toSortedVitals(vitals),
    vitalsModels: Object.values(vitalsModels)
      .map((it) => {
        it.tags.sort()
        it.vitalIds.sort()
        return it
      })
      .sort((a, b) => compareStrings(a.id, b.id)),
    gatherables: toSortedGatherables(gatherables),
    variations: toSortedVariations(variations),
    territories: toSortedTerritories(territories),
    loreItems: toSortedLoreItems(loreItems),
    npcs: toSortedNpcs(npcs),
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

function collectNpcRows(rows: NpcScanRow[], data: Record<string, NpcMetadata>) {
  for (const row of rows || []) {
    const npcID = row.npcID.toLowerCase()
    if (!(npcID in data)) {
      data[npcID] = {
        mapIDs: [],
        spawns: [],
      }
    }
    const bucket = data[npcID]
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

function collectVitalsRows(
  rows: VitalScanRow[],
  data: Record<string, VitalMetadata>,
  models: Record<string, VitalModelMetadata>,
) {
  for (const row of rows || []) {
    const vitalID = row.vitalsID.toLowerCase()
    if (!(vitalID in data)) {
      data[vitalID] = {
        tables: [],
        models: [],
        mapIDs: [],
        catIDs: [],
        npcIDs: [],
        gthIDs: [],
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
    let modelId: string = ''
    if (row.modelFile) {
      let model = buildModelMetadata(row)
      modelId = model.id
      if (!(modelId in models)) {
        models[modelId] = model
      } else {
        model = models[modelId]
      }
      arrayAppend(bucket.models, modelId)
      arrayAppend(model.vitalIds, vitalID)
    }
    if (row.level) {
      arrayAppend(bucket.levels, row.level)
    }
    if (row.categoryID) {
      arrayAppend(bucket.catIDs, row.categoryID.toLowerCase())
    }
    if (row.gatherableID) {
      arrayAppend(bucket.gthIDs, row.gatherableID.toLowerCase())
    }
    if (row.position) {
      bucket.spawns.push({
        random: row.random,
        level: row.level,
        territoryLevel: row.territoryLevel,
        position: [Number(row.position[0].toFixed(3)), Number(row.position[1].toFixed(3))],
        mapId: row.mapID?.toLowerCase(),
        category: row.categoryID?.toLowerCase(),
        gatherable: row.gatherableID?.toLocaleLowerCase(),
        damagetable: damagetable,
        territories: [],
        model: modelId,
      })
    }
  }
}

function buildModelMetadata(vital: VitalScanRow): VitalModelMetadata {
  const result: VitalModelMetadata = {
    id: '',
    cdf: (vital.modelFile?.toLowerCase() || '').replaceAll('\\', '/'),
    mtl: (vital.mtlFile?.toLowerCase() || '').replaceAll('\\', '/'),
    adb: (vital.adbFile?.toLowerCase() || '').replaceAll('\\', '/'),
    tags: (vital.tags || []).filter((it) => !!it),
    vitalIds: [],
  }
  result.id = createHash('md5').update(JSON.stringify(result)).digest('hex')
  return result
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
        random: row.random,
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
        random: row.random,
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

async function applyDefaultLevel(rootDir: string, vitals: Record<string, VitalMetadata>, tables: Array<DatasheetFile>) {
  tables = tables.filter((it) => it.header.type === 'VitalsData')
  if (!tables.length) {
    throw new Error('Missing VitalsData table')
  }
  const vitalSchema = z.object({
    VitalsID: z.string(),
    Level: z.number().optional(),
  })
  const levelMap = new Map<string, number>()
  for (const table of tables) {
    for (const row of table.rows) {
      const vital = vitalSchema.parse(row)
      levelMap.set(vital.VitalsID.toLowerCase(), vital.Level)
    }
  }

  for (const [vitalId, vital] of Object.entries(vitals)) {
    for (const spawn of vital.spawns) {
      if (spawn.level) {
        continue
      }
      if (!levelMap.has(vitalId.toLowerCase())) {
        logger.warn('Missing level for', vitalId)
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
  tables: Array<DatasheetFile>,
) {
  tables = tables.filter((it) => it.header.type === 'TerritoryDefinition')
  if (!tables.length) {
    throw new Error('Missing TerritoryDefinition table')
  }

  const schema = z.object({
    rows: z.array(z.object({ TerritoryID: z.number(), AIVariantLevelOverride: z.number().optional() })),
  })
  const pois = tables
    .map((table) => schema.parse(table).rows)
    .flat()
    .map((it) => {
      const territory = territories[it.TerritoryID] || territories[String(it.TerritoryID).padStart(2, '0')]
      if (!territory?.zones?.length) {
        return null
      }
      return {
        level: it.AIVariantLevelOverride,
        territoryID: it.TerritoryID,
        ...territory,
      }
    })
    .filter((it) => !!it)

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
    .map(([id, { tables, spawns, mapIDs, catIDs, levels, models, gthIDs }]) => {
      const result = {
        vitalsID: id,
        tables: Array.from(tables).sort(),
        mapIDs: Array.from(mapIDs).sort(),
        models: Array.from(models).sort(),
        catIDs: Array.from(catIDs).sort(),
        gthIDs: Array.from(gthIDs).sort(),
        levels: [],
        territories: [],
        lvlSpanws: {} as Record<
          string,
          Array<{
            p: number[]
            l: Array<number | string>[]
            c: string[]
            g: string[]
            t: number[]
            m: string[]
            r: boolean
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
          g: spawn.gatherable ? [spawn.gatherable] : [],
          p: spawn.position,
          t: spawn.territories,
          m: spawn.model ? [spawn.model] : [],
          r: !!spawn.random,
        })
      }
      for (const key in result.lvlSpanws) {
        result.lvlSpanws[key] = chain(result.lvlSpanws[key])
          .groupBy((it) => it.p.join(','))
          .values()
          .map((it) => {
            return {
              p: it[0].p,
              r: it[0].r,
              l: uniq(it.map((it) => it.l).flat()).sort(),
              c: uniq(it.map((it) => it.c).flat()).sort(),
              g: uniq(it.map((it) => it.g).flat()).sort(),
              t: uniq(it[0].t).sort(),
              m: uniq(it.map((it) => it.m).flat()).sort(),
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
      const result = {
        gatherableID: id,
        mapIDs: Array.from(mapIDs.values()).sort(),
        regularSpawns: {} as Record<string, number[][]>,
        randomSpawns: {} as Record<string, number[][]>,
      }
      spawns.sort((a, b) => compareStrings(a.mapId, b.mapId))
      for (const spawn of spawns) {
        const mapId = spawn.mapId || '_'
        const bucket: keyof typeof result = spawn.random ? 'randomSpawns' : 'regularSpawns'
        result[bucket][mapId] = result[bucket][mapId] || []
        result[bucket][mapId].push(spawn.position)
      }
      for (const key in result.regularSpawns) {
        result.regularSpawns[key] = chain(result.regularSpawns[key])
          .uniqBy((it) => it.join(','))
          .sortBy((it) => it.join(','))
          .value()
      }
      for (const key in result.randomSpawns) {
        result.randomSpawns[key] = chain(result.randomSpawns[key])
          .uniqBy((it) => it.join(','))
          .sortBy((it) => it.join(','))
          .value()
      }
      return result
    })
}

function toSortedNpcs(data: Record<string, NpcMetadata>) {
  return Array.from(Object.entries(data))
    .sort((a, b) => compareStrings(a[0], b[0]))
    .map(([id, { spawns, mapIDs }]) => {
      const maps = Array.from(mapIDs.values()).sort()
      const result = {
        npcId: id,
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
    random: boolean
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
  function add(variantId: string, mapId: string, positions: number[][], random: boolean) {
    variationIds.add(variantId.toLowerCase())
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
      random: random,
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
          const randomGroup = group.filter((it) => it.random)
          const regularGroup = group.filter((it) => !it.random)
          for (const subGroup of [randomGroup, regularGroup]) {
            if (!subGroup.length) {
              continue
            }
            const positions = sortBy(subGroup, (it) => it.position.join(',')).map((it) => it.position)
            const isRandom = subGroup[0].random
            add(variantId, mapId, positions, isRandom)
          }
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
      randomPositions: Array<{
        chunk: number
        mapId: string
        elementSize: 2
        elementOffset: number
        elementCount: number
      }>
    }
  > = {}

  for (const row of chunksRecords) {
    for (const chunkEntry of row) {
      if (!result[chunkEntry.variantID]) {
        result[chunkEntry.variantID] = {
          variantID: chunkEntry.variantID,
          mapIDs: [],
          variantPositions: [],
          randomPositions: [],
        }
      }
      if (!result[chunkEntry.variantID].mapIDs.includes(chunkEntry.mapId)) {
        result[chunkEntry.variantID].mapIDs.push(chunkEntry.mapId)
      }
      const entry = {
        chunk: chunkEntry.chunk,
        mapId: chunkEntry.mapId,
        elementSize: chunkEntry.elementSize,
        elementOffset: chunkEntry.elementOffset,
        elementCount: chunkEntry.elementCount,
      }
      if (chunkEntry.random) {
        result[chunkEntry.variantID].randomPositions.push(entry)
      } else {
        result[chunkEntry.variantID].variantPositions.push(entry)
      }
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
