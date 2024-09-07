import { createHash } from 'node:crypto'
import {
  ScannedVital,
  ScannedVitalData,
  ScannedVitalModel,
  ScannedVitalModelData,
} from '../../../../libs/nw-data/scanner'
import { VitalScanRow } from '../../file-formats/slices/scan-for-vitals'
import { sortBy } from 'lodash'

export interface VitalsIndex {
  push(entry: VitalScanRow[]): void
  addLevels(levelMapping: Map<string, number>): void
  addTerritories(fn: (position: number[]) => Array<{ TerritoryID: number; LevelOverride: number }>): void
  result(): ScannedVitalData
  models(): ScannedVitalModelData
}

export function vitalsIndex(): VitalsIndex {
  const scannedRows: Array<VitalScanRow & { territories?: number[] }> = []
  const modelsIndex: Record<string, ScannedVitalModel> = {}
  const vitalsIndex: Record<
    string,
    Record<
      string,
      Record<
        string,
        {
          categories: string[]
          encounter: string[]
          gatherables: string[]
          levels: number[]
          models: string[]
          position: number[]
          tables: string[]
          territories: number[]
        }
      >
    >
  > = {}

  let processed = false
  function process() {
    if (processed) {
      return
    }
    processed = true
    for (const row of scannedRows || []) {
      const vitalID = row.vitalsID.toLowerCase()
      const mapID = row.mapID?.toLowerCase() || ''
      const position = row.position ? parsePosition(row.position) : null
      const positionID = position?.join() || ''

      const bucket1 = getBucket(vitalsIndex, vitalID, () => ({}))
      const bucket2 = getBucket(bucket1, mapID, () => ({}))
      const bucket3 = getBucket(bucket2, positionID, () => {
        return {
          position: position,
          categories: [],
          encounter: [],
          gatherables: [],
          levels: [],
          models: [],
          tables: [],
          territories: [],
        }
      })

      const categoryID = row.categoryID?.toLowerCase()
      if (categoryID) {
        append(bucket3.categories, categoryID)
      }

      const encounter = row.encounter?.toLowerCase()
      if (encounter) {
        append(bucket3.encounter, encounter)
      }

      const gatherableID = row.gatherableID?.toLowerCase()
      if (gatherableID) {
        append(bucket3.gatherables, gatherableID)
      }

      const level = row.level
      if (level) {
        append(bucket3.levels, level)
      }

      const damagetable = row.damageTable?.toLowerCase()?.replace('sharedassets/springboardentitites/datatables/', '')
      if (damagetable) {
        append(bucket3.tables, damagetable)
      }

      row.territories?.forEach((it) => append(bucket3.territories, it))

      let modelId: string = ''
      if (row.modelFile) {
        let model = buildModelMetadata(row)
        modelId = model.id
        if (!(modelId in modelsIndex)) {
          modelsIndex[modelId] = model
        } else {
          model = modelsIndex[modelId]
        }
        append(bucket3.models, modelId)
        append(model.vitalIds, vitalID)
      }
    }
  }
  return {
    push(rows: VitalScanRow[]) {
      if (!rows?.length) {
        return
      }
      scannedRows.push(...rows)
    },
    addLevels(levelMapping: Map<string, number>) {
      for (const row of scannedRows) {
        const vitalID = row.vitalsID.toLowerCase()
        if (!row.level) {
          row.level = levelMapping.get(vitalID)
        }
      }
    },
    addTerritories(fn: (position: number[]) => Array<{ TerritoryID: number; LevelOverride: number }>) {
      for (const row of scannedRows) {
        row.territories ||= []
        const mapID = row.mapID?.toLowerCase()
        if (mapID !== 'newworld_vitaeeterna') {
          continue
        }
        if (!row.position) {
          continue
        }
        for (const territory of fn(row.position)) {
          append(row.territories, territory.TerritoryID)
          if (row.territoryLevel && territory.LevelOverride) {
            row.level = territory.LevelOverride
          }
        }
      }
    },
    result() {
      process()
      const result: ScannedVitalData = []
      for (const [recordID, bucket1] of sortedEntries(vitalsIndex)) {
        const record: ScannedVital = {
          vitalsID: recordID,
          tables: [],
          mapIDs: [],
          models: [],
          catIDs: [],
          gthIDs: [],
          levels: [],
          territories: [],
          spawns: {},
        }
        result.push(record)
        for (const [mapID, bucket2] of sortedEntries(bucket1)) {
          for (const [_, entry] of sortedEntries(bucket2)) {
            entry.categories.forEach((it) => append(record.catIDs, it))
            entry.gatherables.forEach((it) => append(record.gthIDs, it))
            entry.levels.forEach((it) => append(record.levels, it))
            entry.models.forEach((it) => append(record.models, it))
            entry.territories.forEach((it) => append(record.territories, it))
            entry.tables.forEach((it) => append(record.tables, it))
            if (mapID) {
              append(record.mapIDs, mapID)
              getBucket(record.spawns, mapID, () => []).push({
                p: entry.position,
                e: entry.encounter.sort(),
                l: entry.levels.sort(),
                c: entry.categories.sort(),
                g: entry.gatherables.sort(),
                t: entry.territories.sort(),
                m: entry.models.sort(),
              })
            }
          }
        }
      }
      for (const record of result) {
        record.catIDs.sort()
        record.gthIDs.sort()
        record.levels.sort()
        record.mapIDs.sort()
        record.models.sort()
        record.tables.sort()
        record.territories.sort()
        for (const key in record.spawns || {}) {
          record.spawns[key] = sortBy(record.spawns[key], (it) => it.p.join())
        }
      }
      return result
    },
    models(): ScannedVitalModelData {
      process()
      const result: ScannedVitalModel[] = []
      for (const [_, record] of sortedEntries(modelsIndex)) {
        record.tags.sort()
        record.vitalIds.sort()
        result.push(record)
      }
      return result
    },
  }
}

function getBucket<T>(source: Record<string, T>, key: string, factory: () => NoInfer<T>): T {
  return source[key] || (source[key] = factory())
}

function parsePosition(position: number[]): [number, number] {
  return [Number(position[0].toFixed(3)), Number(position[1].toFixed(3))]
}

function* sortedEntries<T>(record: Record<string, T>): Generator<[string, T]> {
  for (const key of Object.keys(record).sort()) {
    yield [key, record[key]]
  }
}

function append<T>(list: T[], item: T, equals: (a: T, b: T) => boolean = (a, b) => a === b): void {
  if (!list.some((it) => equals(it, item))) {
    list.push(item)
  }
}

function buildModelMetadata(vital: VitalScanRow): ScannedVitalModel {
  const result: ScannedVitalModel = {
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
