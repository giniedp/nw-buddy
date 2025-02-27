import { sortBy, uniqBy } from 'lodash'
import { ScannedHouse, ScannedHouseType, ScannedHouseTypeData } from '../../../../libs/nw-data/generated'
import { HouseScanRow } from '../../file-formats/slices/scan-slices'

export interface HouseIndex {
  push(entry: HouseScanRow[]): void
  result(): ScannedHouseTypeData
}

export function houseIndex(): HouseIndex {
  const index: Record<string, ScannedHouseType> = {}
  return {
    push(rows: HouseScanRow[]) {
      if (!rows?.length) {
        return
      }
      for (const row of rows || []) {
        if (!row.position) {
          continue
        }
        const recordID = row.houseTypeID.toLowerCase()
        const bucket = getBucket(index, recordID, () => {
          return {
            houseTypeID: row.houseTypeID,
            houses: [],
          }
        })
        bucket.houses.push({
          mapID: row.mapID,
          houseTypeID: row.houseTypeID,
          position: parsePosition(row.position),
        })
      }
    },
    result() {
      const result: ScannedHouseTypeData = []
      function itemKey(it: ScannedHouse) {
        return [it.mapID, it.houseTypeID, it.position.join()].join()
      }
      for (const item of sortedEntries(index)) {
        result.push(item)
      }
      for (const item of result) {
        item.houses = sortBy(uniqBy(item.houses, itemKey), itemKey)
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
