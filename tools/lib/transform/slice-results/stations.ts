import { sortBy, uniqBy } from 'lodash'
import { ScannedStation, ScannedStationType, ScannedStationTypeData } from '../../../../libs/nw-data/generated'
import { StationScanRow } from '../../file-formats/slices/scan-slices'

export interface StationIndex {
  push(entry: StationScanRow[]): void
  result(): ScannedStationTypeData
}

export function stationIndex(): StationIndex {
  const index: Record<string, ScannedStationType> = {}
  return {
    push(rows: StationScanRow[]) {
      if (!rows?.length) {
        return
      }
      for (const row of rows || []) {
        if (!row.position) {
          continue
        }
        const recordID = row.stationID.toLowerCase()
        const bucket = getBucket(index, recordID, () => {
          return {
            stationID: row.stationID,
            stations: [],
          }
        })
        bucket.stations.push({
          mapID: row.mapID,
          stationID: row.stationID,
          name: row.name,
          position: parsePosition(row.position),
        })
      }
    },
    result() {
      const result: ScannedStationTypeData = []
      function sortKey(it: ScannedStation) {
        return [it.mapID, it.stationID, it.name, it.position.join()].join()
      }
      for (const item of sortedEntries(index)) {
        result.push(item)
      }
      for (const item of result) {
        item.stations = sortBy(uniqBy(item.stations, sortKey), sortKey)
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
