import * as path from 'path'
import { readJSONFile } from '../../utils'
import { VitalScanRow, scanForVitals } from './scan-for-models'
import { scanForSpawners } from './scan-for-spawners'
import { VariationScanRow, scanForVariantDistributions } from './scan-for-variants'
import { TerritoryScanRow, scanForZones } from './scan-for-zones'
import { Capital } from './types/capitals'

function loadCrcFile(file: string) {
  const result = require(file)
  if (typeof result !== 'object') {
    throw new Error('invalid file')
  }
  return result as Record<number | string, string>
}

export interface ScanResult {
  vitals?: VitalScanRow[]
  gatherables?: GatherableScanRow[]
  variations?: VariationScanRow[]
  territories?: TerritoryScanRow[]
  loreItems?: LoreScanRow[]
}

export interface GatherableScanRow {
  gatherableID: string
  position: [number, number, number]
  mapID: string
}
export interface LoreScanRow {
  loreID: string
  position: [number, number, number]
  mapID: string
}
export async function scanSlices({
  inputDir,
  file,
  crcVitalsFile,
  crcVitalsCategoriesFile,
  crcGatherablesFile,
  crcVariationsFile,
}: {
  inputDir: string
  file: string
  crcVitalsFile: string
  crcVitalsCategoriesFile: string
  crcGatherablesFile: string
  crcVariationsFile: string
}): Promise<ScanResult> {
  if (file.endsWith('.distribution.json')) {
    return {
      variations: await scanForVariantDistributions(file),
    }
  }
  if (file.endsWith('.dynamicslice.json')) {
    if (
      isFileInFolder(file, path.join(inputDir, 'slices', 'pois', 'zones')) ||
      isFileInFolder(file, path.join(inputDir, 'slices', 'pois', 'territories'))
    ) {
      return {
        territories: await scanForZones(file),
      }
    }
    if (
      isFileInFolder(file, path.join(inputDir, 'slices', 'characters')) ||
      isFileInFolder(file, path.join(inputDir, 'slices', 'dungeon'))
    ) {
      return {
        vitals: await scanForVitals(inputDir, file),
      }
    }
  }
  if (file.endsWith('.capitals.json')) {
    const mapId = file.match(/coatlicue\/(.+)\/regions\//)[1]
    const data = await readJSONFile<Capital>(file)
    const vitalsRows: VitalScanRow[] = []
    const variationsRows: VariationScanRow[] = []
    const loreRows: LoreScanRow[] = []
    const gatherableRows: GatherableScanRow[] = []
    for (const capital of data?.Capitals || []) {
      if (capital.variantName) {
        variationsRows.push({
          mapID: mapId,
          variantID: capital.variantName,
          position: capital.worldPosition
            ? [capital.worldPosition.x, capital.worldPosition.y, capital.worldPosition.z]
            : null,
        })
      }
      if (capital.sliceName) {
        await scanForSpawners(inputDir, capital.sliceName, capital.sliceAssetId)
          .then((data) => data || [{ positions: [] }])
          .then((res) => {
            for (const data of res) {
              for (let position of data.positions) {
                position = [...position]
                if (capital.rotation) {
                  position = rotatePointWithQuat(capital.rotation, position)
                }
                if (capital.worldPosition) {
                  position[0] += capital.worldPosition.x
                  position[1] += capital.worldPosition.y
                  position[2] += capital.worldPosition.z
                }
                if (data.gatherableID) {
                  gatherableRows.push({
                    mapID: mapId,
                    gatherableID: data.gatherableID,
                    position: [position[0], position[1], position[2]],
                  })
                }
                if (data.variantID) {
                  variationsRows.push({
                    mapID: mapId,
                    variantID: data.variantID,
                    position: [position[0], position[1], position[2]],
                  })
                }
                if (data.vitalsID) {
                  vitalsRows.push({
                    mapID: mapId,
                    vitalsID: data.vitalsID,
                    categoryID: data.categoryID,
                    level: data.level,
                    damageTable: data.damageTable,
                    modelFile: data.modelFile,
                    territoryLevel: data.territoryLevel,
                    position: [position[0], position[1], position[2]],
                  })
                }
                if (data.loreIDs?.length) {
                  for (const loreId of data.loreIDs) {
                    loreRows.push({
                      mapID: mapId,
                      loreID: loreId,
                      position: [position[0], position[1], position[2]],
                    })
                  }
                }
              }
            }
          })
      }
    }
    return {
      vitals: vitalsRows,
      variations: variationsRows,
      loreItems: loreRows,
      gatherables: gatherableRows,
    }
  }

  return {}
}

function isFileInFolder(file: string, folder: string) {
  return path.normalize(file).startsWith(path.normalize(folder))
}

function rotatePointWithQuat(quat: { x: number; y: number; z: number; w?: number }, point: number[]): number[] {
  if (quat?.w == null) {
    return point
  }
  const { x, y, z, w } = quat
  const [vx, vy, vz] = point

  const x2 = x + x
  const y2 = y + y
  const z2 = z + z

  const wx2 = w * x2
  const wy2 = w * y2
  const wz2 = w * z2

  const xx2 = x * x2
  const xy2 = x * y2
  const xz2 = x * z2

  const yy2 = y * y2
  const yz2 = y * z2
  const zz2 = z * z2

  const rx = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
  const ry = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
  const rz = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)

  return [rx, ry, rz]
}
