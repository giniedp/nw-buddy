import * as path from 'path'
import { readJSONFile } from '../../utils'
import { scanForSpawners } from './scan-for-spawners'
import { VariationScanRow, scanForVariantDistributions } from './scan-for-variants'
import { VitalScanRow, scanForVitals } from './scan-for-vitals'
import { TerritoryScanRow, scanForZones } from './scan-for-zones'
import { Capital } from './types/capitals'

export interface ScanResult {
  vitals?: VitalScanRow[]
  npcs?: NpcScanRow[]
  gatherables?: GatherableScanRow[]
  variations?: VariationScanRow[]
  territories?: TerritoryScanRow[]
  loreItems?: LoreScanRow[]
}
export interface NpcScanRow {
  npcID: string
  position: [number, number, number]
  mapID: string
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
export async function scanSlices({ inputDir, file }: { inputDir: string; file: string }): Promise<ScanResult> {
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
        territories: await scanForZones({
          rootDir: inputDir,
          file,
        }),
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
    const npcRows: NpcScanRow[] = []
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
        const spawners = await scanForSpawners(inputDir, capital.sliceName, capital.sliceAssetId)
        for (const entry of spawners || []) {
          for (let position of entry.positions) {
            position = [...position]
            if (capital.rotation) {
              position = rotatePointWithQuat(capital.rotation, position)
            }
            if (capital.worldPosition) {
              position[0] += capital.worldPosition.x
              position[1] += capital.worldPosition.y
              position[2] += capital.worldPosition.z
            }
            if (entry.gatherableID) {
              gatherableRows.push({
                mapID: mapId,
                gatherableID: entry.gatherableID,
                position: [position[0], position[1], position[2]],
              })
            }
            if (entry.variantID) {
              variationsRows.push({
                mapID: mapId,
                variantID: entry.variantID,
                position: [position[0], position[1], position[2]],
              })
            }
            if (entry.vitalsID) {
              vitalsRows.push({
                mapID: mapId,
                vitalsID: entry.vitalsID,
                categoryID: entry.categoryID,
                gatherableID: entry.gatherableID,
                npcID: entry.npcID,
                level: entry.level,
                damageTable: entry.damageTable,
                modelFile: entry.modelFile,
                adbFile: entry.adbFile,
                mtlFile: entry.mtlFile,
                territoryLevel: entry.territoryLevel,
                position: [position[0], position[1], position[2]],
              })
            }
            if (entry.npcID) {
              npcRows.push({
                mapID: mapId,
                npcID: entry.npcID,
                position: [position[0], position[1], position[2]],
              })
            }
            if (entry.loreIDs?.length) {
              for (const loreId of entry.loreIDs) {
                loreRows.push({
                  mapID: mapId,
                  loreID: loreId,
                  position: [position[0], position[1], position[2]],
                })
              }
            }
          }
        }
      }
    }
    return {
      vitals: vitalsRows,
      npcs: npcRows,
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
