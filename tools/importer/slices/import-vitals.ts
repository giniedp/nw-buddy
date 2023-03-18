import * as env from '../../../env'
import { sortBy, uniqBy } from 'lodash'
import * as path from 'path'
import { assmebleWorkerTasks, crc32, glob, readJSONFile, withProgressPool, writeJSONFile } from '../../utils'
import { pathToDatatables } from '../tables'
import { VitalsCategoriesTableSchema, VitalsTableSchema } from '../tables/schemas'

import { WORKER_TASKS } from './worker.tasks'

interface VitalMetadata {
  tables: Set<string>
  mapIDs: Set<string>
  spawns: Array<{ level: number; category: string; position: number[] }>
}

export async function importVitals({ inputDir, threads }: { inputDir: string, threads: number }) {
  const vitalsTableFile = path.join(pathToDatatables(inputDir), 'javelindata_vitals.json')
  const crcVitalIDs = await readJSONFile(vitalsTableFile, VitalsTableSchema)
    .then((list) => list.map((it) => it.VitalsID))
    .then((list) => list.map((it) => it.toLowerCase()).map((value) => [crc32(value), value] as const))
    .then((list) => Object.fromEntries(list))
  const crcVitalsFile = env.nwData.tmp('..', 'crcVitals.json')
  await writeJSONFile(crcVitalIDs, crcVitalsFile)

  const categoriesTableFile = path.join(pathToDatatables(inputDir), 'javelindata_vitalscategories.json')
  const crcVitalCategories = await readJSONFile(categoriesTableFile, VitalsCategoriesTableSchema)
    .then((list) => list.map((it) => it.VitalsCategoryID))
    .then((list) => list.map((it) => it.toLowerCase()).map((value) => [crc32(value), value] as const))
    .then((list) => Object.fromEntries(list))
  const crcVitalsCategoriesFile = env.nwData.tmp('..', 'crcVitalsCategories.json')
  await writeJSONFile(crcVitalCategories, crcVitalsCategoriesFile)

  const vitals = new Map<string, VitalMetadata>()
  const files = await glob([
    `${inputDir}/**/*.dynamicslice.json`,
    `!${inputDir}/lyshineui/**/*.dynamicslice.json`,
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
      taskName: 'scanForVitals',
      tasks: files.map((file) => {
        return {
          inputDir,
          file,
          crcVitalsFile,
          crcVitalsCategoriesFile,

        }
      }),
      onTaskFinish: async (result) => {
        for (const vital of result) {
          const vitalID = vital.vitalsID.toLowerCase()
          if (!vitals.has(vitalID)) {
            vitals.set(vitalID, { tables: new Set(), mapIDs: new Set(), spawns: [] })
          }
          const bucket = vitals.get(vitalID)
          if (vital.damageTable) {
            bucket.tables.add(
              vital.damageTable.toLowerCase().replace('sharedassets/springboardentitites/datatables/', '')
            )
          }
          if (vital.mapID) {
            bucket.mapIDs.add(vital.mapID)
          }
          if (vital.position) {
            bucket.spawns.push({
              category: vital.categoryID,
              level: vital.level,
              position: vital.position,
            })
          }
        }
      },
    }),
  })

  const result = Array.from(vitals.entries()).map(([id, { tables, spawns, mapIDs }]) => {
    return {
      vitalsID: id,
      tables: Array.from(tables.values()).sort(),
      mapIDs: Array.from(mapIDs.values()).sort(),
      spawns: uniqBy(spawns || [], ({ category, level, position }) => {
        return JSON.stringify({
          category: (category || '').toLowerCase(),
          level,
          position: (position || []).map((it) => Math.floor(it)),
        })
      }),
    }
  })
  return sortBy(result, (it) => it.vitalsID)
}
