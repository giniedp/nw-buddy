import { ScannedTerritory, ScannedTerritoryData } from '../../../../libs/nw-data/scanner'
import { TerritoryScanRow } from '../../file-formats/slices/scan-for-zones'

export interface TerritoryIndex {
  push(entry: TerritoryScanRow[]): void
  result(): ScannedTerritoryData
  get(id: string | number): ScannedTerritory
}

export function territoryIndex(): TerritoryIndex {
  const index: Record<string, ScannedTerritory> = {}
  return {
    push(rows: TerritoryScanRow[]) {
      if (!rows?.length) {
        return
      }
      for (const row of rows || []) {
        if (!row.position) {
          continue
        }
        const territoryID = row.territoryID.toLowerCase()
        const bucket = getBucket(index, territoryID, () => {
          return {
            territoryID: territoryID,
            geometry: [],
          }
        })
        if (row.position && row.shape.length > 0) {
          const positions = row.shape.map(([x, y]) => {
            return [x + (row.position[0] || 0), y + (row.position[1] || 0)]
          })
          const min = [null, null]
          const max = [null, null]
          for (const [x, y] of positions) {
            if (min[0] === null || x < min[0]) {
              min[0] = x
            }
            if (min[1] === null || y < min[1]) {
              min[1] = y
            }
            if (max[0] === null || x > max[0]) {
              max[0] = x
            }
            if (max[1] === null || y > max[1]) {
              max[1] = y
            }
          }

          bucket.geometry.push({
            type: 'Polygon',
            bbox: [min[0], min[1], max[0], max[1]],
            coordinates: [positions],
          })
        }
      }
    },
    result() {
      const result: ScannedTerritoryData = []
      for (const data of sortedEntries(index)) {
        result.push(data)
      }
      return result
    },
    get(id: string) {
      return index[id]
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
