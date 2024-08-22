import { chain } from 'lodash'
import { ScannedGatherable, ScannedGatherableData, ScannedGatherableSpawn } from '../../../../libs/nw-data/scanner'
import { GatherableScanRow } from '../../file-formats/slices/scan-slices'

export interface GatherableIndex {
  push(entry: GatherableScanRow[]): void
  result(): ScannedGatherableData
}

export function gatherableIndex(): GatherableIndex {
  const index: Record<string, Record<string, Record<string, ScannedGatherableSpawn>>> = {}
  return {
    push(rows: GatherableScanRow[]) {
      if (!rows?.length) {
        return
      }
      for (const row of rows || []) {
        if (!row.position) {
          continue
        }
        const recordID = row.gatherableID.toLowerCase()
        const mapID = row.mapID.toLowerCase()
        const position = parsePosition(row.position)

        const bucket1 = getBucket(index, recordID, () => ({}))
        const bucket2 = getBucket(bucket1, mapID, () => ({}))
        const bucket3 = getBucket(bucket2, String(!!row.random), () => {
          return {
            mapID,
            positions: [],
            randomEncounter: !!row.random,
          }
        })
        bucket3.positions.push(position)
      }
    },
    result() {
      const result: ScannedGatherableData = []
      for (const [recordID, bucket1] of sortedEntries(index)) {
        const record: ScannedGatherable = {
          gatherableID: recordID,
          spawns: [],
        }
        result.push(record)
        for (const [_, bucket2] of sortedEntries(bucket1)) {
          for (const [_, entry] of sortedEntries(bucket2)) {
            record.spawns.push({
              mapID: entry.mapID,
              randomEncounter: entry.randomEncounter,
              positions: chain(entry.positions)
                .uniqBy((it) => it.join(','))
                .sortBy((it) => it.join(','))
                .value(),
            })
          }
        }
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
