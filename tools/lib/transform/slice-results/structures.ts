import { sortBy, uniqBy } from 'lodash'
import { ScannedStructure, ScannedStructureType, ScannedStructureTypeData } from '../../../../libs/nw-data/generated'
import { StructureScanRow } from '../../file-formats/slices/scan-slices'

export interface StructureIndex {
  push(entry: StructureScanRow[]): void
  result(): ScannedStructureTypeData
}

export function structureIndex(): StructureIndex {
  const index: Record<string, ScannedStructureType> = {}
  return {
    push(rows: StructureScanRow[]) {
      if (!rows?.length) {
        return
      }
      for (const row of rows || []) {
        if (!row.position) {
          continue
        }
        const recordID = row.type.toLowerCase()
        const bucket = getBucket(index, recordID, () => {
          return {
            type: row.type,
            structures: [],
          }
        })
        bucket.structures.push({
          mapID: row.mapID,
          type: row.type,
          name: row.name,
          position: parsePosition(row.position),
        })
      }
    },
    result() {
      const result: ScannedStructureTypeData = []
      function sortKey(it: ScannedStructure) {
        return [it.mapID, it.type, it.name, it.position.join()]
      }
      for (const item of sortedEntries(index)) {
        result.push(item)
      }
      for (const item of result) {
        item.structures = sortBy(uniqBy(item.structures, sortKey), sortKey)
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

function* sortedEntries<T>(record: Record<string, T>) {
  for (const key of Object.keys(record).sort()) {
    yield record[key]
  }
}
