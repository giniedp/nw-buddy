import { chain } from 'lodash'
import { ScannedGatherable, ScannedGatherableData, ScannedGatherableSpawn } from '../../../../libs/nw-data/generated'
import { GatherableScanRow } from '../../file-formats/slices/scan-slices'

export interface GatherableIndex {
  push(entry: GatherableScanRow[]): void
  result(): {
    spawns: number
    data: ScannedGatherableData
  }
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
        const bucket3 = getBucket(bucket2, row.encounter, () => {
          return {
            mapID,
            positions: [],
            encounter: row.encounter,
          }
        })
        bucket3.positions.push(position)
      }
    },
    result() {
      const result: ScannedGatherableData = []
      let count = 0
      for (const [recordID, bucket1] of sortedEntries(index)) {
        const record: ScannedGatherable = {
          gatherableID: recordID,
          spawns: [],
        }
        result.push(record)
        for (const [_, bucket2] of sortedEntries(bucket1)) {
          for (const [_, entry] of sortedEntries(bucket2)) {
            const positions = chain(entry.positions)
              .uniqBy((it) => it.join(','))
              .sortBy((it) => it.join(','))
              .value()
            count += positions.length
            record.spawns.push({
              mapID: entry.mapID,
              encounter: entry.encounter,
              positions: positions,
            })
          }
        }
      }
      return {
        spawns: count,
        data: result,
      }
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
