import { readJSONFile } from '../../utils/file-utils'
import { scanForSpawners } from './scan-for-spawners'

export interface DistributionScanRow {
  gatherableID?: string
  variantID: string
  encounter: string
  position: [number, number, number]
  mapID: string
}

export async function scanForDistributions(rootDir: string, file: string) {
  const mapId = file.match(/coatlicue\/(.+)\/regions\//)[1]
  const result: DistributionScanRow[] = []
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
    const sliceName = data.slices[index]
    const variantID = data.variants[index]
    let gatherableID = null
    if (!position) {
      continue
    }
    if (sliceName) {
      const spawners = await scanForSpawners(rootDir, sliceName, null)
      gatherableID = spawners?.[0]?.gatherableID
    }
    if (!variantID && !gatherableID) {
      continue
    }
    const x = (data.region[0] + position[0] / maxValue) * areaSize
    const y = (data.region[1] + position[1] / maxValue) * areaSize
    result.push({
      gatherableID,
      variantID,
      encounter: null,
      position: [x, y] as any,
      mapID: mapId,
    })
  }

  return result
}
