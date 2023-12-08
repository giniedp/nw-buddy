import { sortBy, uniqBy } from 'lodash'
import * as path from 'path'
import { environment } from '../../../env'
import { assmebleWorkerTasks, crc32, glob, readJSONFile, withProgressPool, writeJSONFile } from '../../utils'
import { pathToDatatables } from '../tables'
import { GatherablesTableSchema, VitalsCategoriesTableSchema, VitalsTableSchema } from '../tables/schemas'

import { WORKER_TASKS } from './worker.tasks'

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
export async function importSlices({ inputDir, threads }: { inputDir: string; threads: number }) {
  const crcVitalsFile = environment.tmpDir('crcVitals.json')
  await glob([
    path.join(pathToDatatables(inputDir), 'javelindata_vitals.json'),
    path.join(pathToDatatables(inputDir), 'vitalstables', '*_vitals_*.json'),
  ]).then(async (files) => {
    let result: Record<string, string> = {}
    for (const file of files) {
      const crcVitalIDs = await readJSONFile(file, VitalsTableSchema)
        .then((list) => list.map((it) => it.VitalsID))
        .then((list) => list.map((it) => it.toLowerCase()).map((value) => [crc32(value), value] as const))
        .then((list) => Object.fromEntries(list))
      result = {
        ...result,
        ...crcVitalIDs,
      }
    }
    await writeJSONFile(result, crcVitalsFile)
  })

  const categoriesTableFile = path.join(pathToDatatables(inputDir), 'javelindata_vitalscategories.json')
  const crcVitalCategories = await readJSONFile(categoriesTableFile, VitalsCategoriesTableSchema)
    .then((list) => list.map((it) => it.VitalsCategoryID))
    .then((list) => list.map((it) => it.toLowerCase()).map((value) => [crc32(value), value] as const))
    .then((list) => Object.fromEntries(list))
  const crcVitalsCategoriesFile = environment.tmpDir('crcVitalsCategories.json')
  await writeJSONFile(crcVitalCategories, crcVitalsCategoriesFile)

  const gatherablesTableFile = path.join(pathToDatatables(inputDir), 'javelindata_gatherables.json')
  const crcGatherables = await readJSONFile(gatherablesTableFile, GatherablesTableSchema)
    .then((list) => list.map((it) => it.GatherableID))
    .then((list) => list.map((it) => it.toLowerCase()).map((value) => [crc32(value), value] as const))
    .then((list) => Object.fromEntries(list))
  const crcGatherablesFile = environment.tmpDir('crcGatherables.json')
  await writeJSONFile(crcGatherables, crcGatherablesFile)

  const vitals = new Map<string, VitalMetadata>()
  const gatherables = new Map<string, GatherableMetadata>()

  const files = await glob([
    `${inputDir}/**/*.dynamicslice.json`,
    `!${inputDir}/lyshineui/**/*`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.capitals.json`,
    `${inputDir}/sharedassets/coatlicue/**/regions/**/*.metadata.json`,
  ])

  await withProgressPool({
    barName: 'Vitals',
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
        }
      }),
      onTaskFinish: async (result) => {
        for (const vital of result.vitals || []) {
          const vitalID = vital.vitalsID.toLowerCase()
          if (!vitals.has(vitalID)) {
            vitals.set(vitalID, { tables: new Set(), models: new Set(), mapIDs: new Set(), spawns: [] })
          }
          const bucket = vitals.get(vitalID)
          const damagetable = vital.damageTable
            ?.toLowerCase()
            .replace('sharedassets/springboardentitites/datatables/', '')
          if (damagetable) {
            bucket.tables.add(damagetable)
          }
          if (vital.mapID) {
            bucket.mapIDs.add(vital.mapID)
          }
          if (vital.modelSlice) {
            bucket.models.add(vital.modelSlice)
          }
          if (vital.position) {
            bucket.spawns.push({
              category: vital.categoryID,
              level: vital.level,
              position: vital.position,
              damagetable: damagetable,
            })
          }
        }
        for (const gatherable of result.gatherables || []) {
          const gatherableID = gatherable.gatherableID
          if (!gatherables.has(gatherableID)) {
            gatherables.set(gatherableID, { mapIDs: new Set(), spawns: [] })
          }
          const bucket = gatherables.get(gatherableID)
          if (gatherable.mapID) {
            bucket.mapIDs.add(gatherable.mapID)
          }
          if (gatherable.position) {
            bucket.spawns.push({
              position: gatherable.position,
              lootTable: gatherable.lootTable,
            })
          }
        }
      },
    }),
  })

  const resultVitals = Array.from(vitals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
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
            return (a.category || '').localeCompare(b.category || '')
          }
          return String(a.position).localeCompare(String(b.position))
        }),
      }
    })
  const resultGatherables = Array.from(gatherables.entries())
    .sort(([a], [b]) => a.localeCompare(b))
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
          return String(a.position).localeCompare(String(b.position))
        }),
      }
    })
  return {
    vitals: sortBy(resultVitals, (it) => it.vitalsID),
    gatherables: sortBy(resultGatherables, (it) => it.gatherableID),
  }
  return
}
