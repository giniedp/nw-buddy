import { chain, sortBy } from 'lodash'
import { VariantScanRow } from 'tools/lib/file-formats/slices/scan-slices'
import { ScannedVariation, ScannedVariationData, ScannedVariationSpawn } from '../../../../libs/nw-data/scanner'

export interface VariationIndex {
  push(entry: VariantScanRow[]): void
  result(): {
    data: ScannedVariationData
    chunks: Array<Float32Array>
    variationsIDs: string[]
  }
}

export function variationIndex(): VariationIndex {
  const index: Record<string, Record<string, Record<string, ScannedVariationSpawn<Array<[number, number]>>>>> = {}
  return {
    push(rows: VariantScanRow[]) {
      if (!rows?.length) {
        return
      }
      for (const row of rows || []) {
        if (!row.position) {
          continue
        }

        const mapID = row.mapID.toLowerCase()
        const recordID = row.variantID.toLowerCase()
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
      const data: Record<string, ScannedVariation> = {}
      const chunks: number[][] = []
      const variationIds = new Set<string>()

      let chunkData: number[]
      let chunkIndex: number
      function add(variantID: string, { mapID, encounter, positions }: ScannedVariationSpawn<Array<[number, number]>>) {
        variationIds.add(variantID)
        if (!chunkData || chunkData.length + positions.length > 1000000) {
          chunkIndex = chunks.length
          chunkData = []
          chunks.push(chunkData)
        }
        const elementOffset = chunkData.length / 2
        const elementCount = positions.length
        for (const [x, y] of positions) {
          chunkData.push(x, y)
        }
        if (!(variantID in data)) {
          data[variantID] = {
            variantID,
            spawns: [],
          }
        }
        data[variantID].spawns.push({
          mapID,
          encounter,
          positions: {
            chunkID: chunkIndex,
            elementSize: 2,
            elementOffset,
            elementCount,
          },
        })
      }

      for (const [recordID, bucket1] of sortedEntries(index)) {
        for (const [_, bucket2] of sortedEntries(bucket1)) {
          for (const [_, data] of sortedEntries(bucket2)) {
            const positions = chain(data.positions)
              .uniqBy((it) => it.join(','))
              .sortBy((it) => it.join(','))
              .value()
            add(recordID, { ...data, positions })
          }
        }
      }
      return {
        data: sortBy(Object.entries(data), ([id]) => id).map(([_, value]) => value),
        chunks: chunks.map((it) => new Float32Array(it)),
        variationsIDs: Array.from(variationIds),
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
