import { sortBy, uniqBy } from 'lodash'
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
import { WORKER_TASKS } from './worker.tasks'
import { VitalScanRow } from './scan-for-vitals'
import { GatherableScanRow, VariationScanRow } from './scan-slices.task'

interface VitalMetadata {
  tables: Set<string>
  models: Set<string>
  mapIDs: Set<string>
  spawns: Array<{ level: number; category: string; position: number[]; damagetable: string }>
}

interface GatherableMetadata {
  mapIDs: Set<string>
  spawns: Array<{ position: number[]; lootTable: string }>
}

interface VariationMetadata {
  mapIDs: Set<string>
  spawns: Array<[number, number, number]>
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
  }).then((result) => writeJSONFile(result, crcVitalsFile))

  const crcVitalsCategoriesFile = environment.tmpDir('crcVitalsCategories.json')
  await readAndExtractCrcValues({
    schema: VitalsCategoriesTableSchema,
    files: [path.join(pathToDatatables(inputDir), 'javelindata_vitalscategories.json')],
    extract: (row) => row.VitalsCategoryID.toLowerCase(),
  }).then((result) => writeJSONFile(result, crcVitalsCategoriesFile))

  const crcGatherablesFile = environment.tmpDir('crcGatherables.json')
  await readAndExtractCrcValues({
    schema: GatherablesTableSchema,
    files: [path.join(pathToDatatables(inputDir), 'javelindata_gatherables.json')],
    extract: (row) => row.GatherableID.toLowerCase(),
  }).then((result) => writeJSONFile(result, crcGatherablesFile))

  const crcVariationsFile = environment.tmpDir('crcVariations.json')
  await readAndExtractCrcValues({
    schema: VariationsTableSchema,
    files: [path.join(pathToDatatables(inputDir), 'javelindata_variations_*.json')],
    extract: (row) => row.VariantID.toLowerCase(),
  }).then((result) => writeJSONFile(result, crcVariationsFile))

  const vitals = new Map<string, VitalMetadata>()
  const gatherables = new Map<string, GatherableMetadata>()
  const variations = new Map<string, VariationMetadata>()

  const files = await glob([
    `${inputDir}/**/*.dynamicslice.json`,
    `!${inputDir}/lyshineui/**/*`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.capitals.json`,
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
      },
    }),
  })

  return {
    vitals: buildResultVitals(vitals),
    gatherables: buildResultGatherables(gatherables),
    variations: buildResultVariations(variations),
  }
}

function collectVitalsRows(rows: VitalScanRow[], data: Map<string, VitalMetadata>) {
  for (const row of rows || []) {
    const vitalID = row.vitalsID.toLowerCase()
    if (!data.has(vitalID)) {
      data.set(vitalID, { tables: new Set(), models: new Set(), mapIDs: new Set(), spawns: [] })
    }
    const bucket = data.get(vitalID)
    const damagetable = row.damageTable
      ?.toLowerCase()
      .replace('sharedassets/springboardentitites/datatables/', '')
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
        damagetable: damagetable,
      })
    }
  }
}

function collectGatherablesRows(rows: GatherableScanRow[], data: Map<string, GatherableMetadata>) {
  for (const row of rows || []) {
    const gatherableID = row.gatherableID
    if (!data.has(gatherableID)) {
      data.set(gatherableID, { mapIDs: new Set(), spawns: [] })
    }
    const bucket = data.get(gatherableID)
    if (row.mapID) {
      bucket.mapIDs.add(row.mapID)
    }
    if (row.position) {
      bucket.spawns.push({
        position: row.position,
        lootTable: row.lootTable,
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
      bucket.spawns.push(row.position)
    }
  }
}

function buildResultVitals(data: Map<string, VitalMetadata>) {
  return Array.from(data.entries())
    .map(([id, { tables, spawns, mapIDs, models }]) => {
      return {
        vitalsID: id,
        tables: Array.from(tables.values()).sort(),
        mapIDs: Array.from(mapIDs.values()).sort(),
        models: Array.from(models.values()).sort(),
        spawns: uniqBy(spawns || [], ({ category, level, position, damagetable }) => {
          return JSON.stringify({
            category: (category || '').toLowerCase(),
            level,
            position: (position || []).map((it) => Number(it.toFixed(3))),
            damagetable,
          })
        }).sort((a, b) => {
          if (a.level !== b.level) {
            return (a.level || 0) - (b.level || 0)
          }
          if (a.category !== b.category) {
            return compareStrings(a.category || '', b.category || '')
          }

          return compareStrings(String(a.position), String(b.position))
        }),
      }
    })
    .sort((a, b) => {
      return compareStrings(a.vitalsID, b.vitalsID)
    })
}

function buildResultGatherables(data: Map<string, GatherableMetadata>) {
  return Array.from(data.entries())
    .map(([id, { spawns, mapIDs }]) => {
      return {
        gatherableID: id,
        mapIDs: Array.from(mapIDs.values()).sort(),
        spawns: uniqBy(spawns || [], ({ position, lootTable }) => {
          return JSON.stringify({
            position: (position || []).map((it) => Number(it.toFixed(3))),
            loot: lootTable,
          })
        }).sort((a, b) => {
          return compareStrings(String(a.position), String(b.position))
        }),
      }
    })
    .sort((a, b) => {
      return compareStrings(a.gatherableID, b.gatherableID)
    })
}

function buildResultVariations(data: Map<string, VariationMetadata>) {
  return Array.from(data.entries())
    .map(([id, { spawns, mapIDs }]) => {
      return {
        variantID: id,
        mapIDs: Array.from(mapIDs.values()).sort(),
        spawns: uniqBy(spawns || [], (it) => {
          return JSON.stringify(it)
        }).sort((a, b) => {
          return compareStrings(String(a), String(b))
        }),
      }
    })
    .sort((a, b) => compareStrings(a.variantID, b.variantID))
}

function compareStrings(a: string, b: string) {
  return String(a).localeCompare(String(b))
}
