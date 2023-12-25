import { readJSONFile } from '../../utils/file-utils'

export interface VariationScanRow {
  variantID: string
  position: [number, number, number]
  mapID: string
}

export async function scanForVariantDistributions(file: string) {
  const mapId = file.match(/coatlicue\/(.+)\/regions\//)[1]
  const result: VariationScanRow[] = []
  const data = (await readJSONFile(file)) as {
    region: [number, number]
    slices: string[]
    variants: string[]
    indices: number[]
    positions: [number, number][]
  }

  const areaSize = 2048
  const maxValue = 0xffff
  for (let i = 0; i < data.positions.length; i++) {
    const position = data.positions[i]
    const index = data.indices[i]
    const variant = data.variants[index]
    if (!variant || !position) {
      continue
    }
    const x = (data.region[0] + position[0] / maxValue) * areaSize
    const y = (data.region[1] + position[1] / maxValue) * areaSize
    result.push({
      variantID: variant,
      position: [x, y] as any,
      mapID: mapId,
    })
  }

  return result
}
