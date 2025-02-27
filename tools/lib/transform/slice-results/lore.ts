import { chain } from 'lodash'
import { ScannedLore, ScannedLoreData, ScannedLoreSpawn } from '../../../../libs/nw-data/generated'
import { LoreScanRow } from '../../file-formats/slices/scan-slices'

export interface LoreIndex {
  push(entry: LoreScanRow[]): void
  result(): {
    spawns: number
    data: ScannedLoreData
  }
}

export function loreIndex(): LoreIndex {
  const index: Record<string, Record<string, ScannedLoreSpawn>> = {}
  return {
    push(rows: LoreScanRow[]) {
      if (!rows?.length) {
        return
      }
      for (const row of rows || []) {
        if (!row.position) {
          continue
        }
        const mapID = row.mapID.toLowerCase()
        const recordID = row.loreID.toLowerCase()
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
      const result: ScannedLoreData = []
      let count = 0
      for (const [recordID, bucket1] of sortedEntries(index)) {
        const record: ScannedLore = {
          loreID: recordID,
          spawns: [],
        }
        result.push(record)
        for (const [mapID, data] of sortedEntries(bucket1)) {
          const positions = chain(data.positions)
            .uniqBy((it) => it.join(','))
            .sortBy((it) => it.join(','))
            .value()
          count += positions.length
          record.spawns.push({
            mapID,
            positions: positions,
          })
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
