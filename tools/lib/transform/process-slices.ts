import { chain, uniq } from 'lodash'
import * as path from 'path'
import { arrayAppend, glob, readJSONFile, withProgressBar } from '../utils'

import { createHash } from 'node:crypto'
import { z } from 'zod'
import { logger } from '../utils/logger'

import { DatasheetFile } from '../file-formats/datasheet/converter'
import { VitalScanRow } from '../file-formats/slices/scan-for-vitals'
import { isPointInAABB, isPointInPolygon } from '../file-formats/slices/utils'
import { runTasks } from '../worker/runner'
import { TerritoryIndex, gatherableIndex, loreIndex, npcIndex, territoryIndex } from './slice-results'
import { variationIndex } from './slice-results/variation'

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

export async function processSlices({ inputDir, threads }: { inputDir: string; threads: number }) {
  const npcs = npcIndex()
  const vitals: Record<string, VitalMetadata> = {}
  const vitalsModels: Record<string, VitalModelMetadata> = {}
  const gatherables = gatherableIndex()
  const variations = variationIndex()
  const territories = territoryIndex()
  const loreItems = loreIndex()

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
      npcs.push(result.npcs)
      collectVitalsRows(result.vitals || [], vitals, vitalsModels)
      gatherables.push(result.gatherables)
      variations.push(result.variations)
      territories.push(result.territories)
      loreItems.push(result.loreItems)
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
    gatherables: gatherables.result(),
    variations: variations.result(),
    territories: territories.result(),
    loreItems: loreItems.result(),
    npcs: npcs.result(),
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
  territories: TerritoryIndex,
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
      const territory = territories.get(it.TerritoryID) || territories.get(String(it.TerritoryID).padStart(2, '0'))
      if (!territory?.geometry?.length) {
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
      if (!poi.geometry?.length) {
        continue
      }
      for (const spawn of vital.spawns) {
        if (spawn.mapId !== 'newworld_vitaeeterna') {
          continue
        }
        const min = poi.geometry[0].bbox.slice(0, 2)
        const max = poi.geometry[0].bbox.slice(2)
        if (!isPointInAABB(spawn.position, min, max)) {
          continue
        }
        if (!isPointInPolygon(spawn.position, poi.geometry[0].coordinates[0])) {
          continue
        }
        if (spawn.territoryLevel) {
          spawn.level = poi.level
        }
        spawn.territories = spawn.territories || []
        arrayAppend(spawn.territories, Number(poi.territoryID))
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

function compareStrings(a: string, b: string) {
  return String(a).localeCompare(String(b))
}
