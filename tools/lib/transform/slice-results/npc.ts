import { chain } from 'lodash'
import { SannedNpcData, ScannedNpc, ScannedNpcSpawn } from '../../../../libs/nw-data/scanner'
import { NpcScanRow } from '../../file-formats/slices/scan-slices'

export interface NpcIndex {
  push(entry: NpcScanRow[]): void
  result(): SannedNpcData
}

export function npcIndex(): NpcIndex {
  const index: Record<string, Record<string, ScannedNpcSpawn>> = {}
  return {
    push(rows: NpcScanRow[]) {
      if (!rows?.length) {
        return
      }
      for (const row of rows || []) {
        if (!row.position) {
          continue
        }
        const mapID = row.mapID.toLowerCase()
        const recordID = row.npcID.toLowerCase()
        const position = parsePosition(row.position)

        const bucket1 = getBucket(index, recordID, () => ({}))
        const bucket2 = getBucket(bucket1, mapID, () => {
          return {
            mapID,
            positions: [],
          }
        })
        bucket2.positions.push(position)
      }
    },
    result() {
      const result: SannedNpcData = []
      for (const [recordID, bucket1] of sortedEntries(index)) {
        const record: ScannedNpc = {
          npcID: recordID,
          spawns: [],
        }
        result.push(record)
        for (const [mapID, data] of sortedEntries(bucket1)) {
          record.spawns.push({
            mapID,
            positions: chain(data.positions)
              .uniqBy((it) => it.join(','))
              .sortBy((it) => it.join(','))
              .value(),
          })
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
