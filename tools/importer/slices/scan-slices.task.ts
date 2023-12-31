import { readJSONFile } from '../../utils'
import { scanForSpawners } from './scan-for-spawners'
import { TerritoryScanRow, scanForZones } from './scan-for-zones'
import { VariationScanRow, scanForVariantDistributions } from './scan-for-variants'
import { VitalScanRow, scanForVitals } from './scan-for-vitals'
import { Capital } from './types/capitals'
import { isRegionMetadataAsset } from './types/metadata'

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
  lootTable: string
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
    return {
      vitals: await scanForVitals(inputDir, file),
      territories: await scanForZones(file),
    }
  }
  if (file.endsWith('.capitals.json')) {
    const mapId = file.match(/coatlicue\/(.+)\/regions\//)[1]
    const data = await readJSONFile<Capital>(file)
    const vitalsRows: VitalScanRow[] = []
    const variationsRows: VariationScanRow[] = []
    const loreRows: LoreScanRow[] = []
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
        await scanForSpawners(inputDir, capital.sliceName)
          .then((data) => data || [{ positions: [] }])
          .then((res) => {
            for (const data of res) {
              if ('variantID' in data && data.variantID) {
                for (let position of data.positions) {
                  position = [...position]
                  if (capital.worldPosition) {
                    position[0] += capital.worldPosition.x
                    position[1] += capital.worldPosition.y
                    position[2] += capital.worldPosition.z
                  }
                  variationsRows.push({
                    mapID: mapId,
                    variantID: data.variantID,
                    position: [position[0], position[1], position[2]],
                  })
                }
              }
              if ('vitalsID' in data && data.vitalsID) {
                for (let position of data.positions) {
                  position = [...position]
                  if (capital.worldPosition) {
                    position[0] += capital.worldPosition.x
                    position[1] += capital.worldPosition.y
                    position[2] += capital.worldPosition.z
                  }
                  vitalsRows.push({
                    mapID: mapId,
                    vitalsID: data.vitalsID,
                    categoryID: data.categoryID,
                    level: data.level,
                    damageTable: data.damageTable,
                    modelFile: data.modelFile,
                    position: [position[0], position[1], position[2]],
                  })
                }
              }
              if ('loreID' in data && data.loreID) {
                loreRows.push({
                  mapID: mapId,
                  loreID: data.loreID,
                  position: capital.worldPosition
                    ? [capital.worldPosition.x, capital.worldPosition.y, capital.worldPosition.z]
                    : null,
                })
              }
            }
          })
      }
    }
    return {
      vitals: vitalsRows,
      variations: variationsRows,
      loreItems: loreRows,
    }
  }
  if (file.endsWith('.metadata.json')) {
    const mapId = file.match(/coatlicue\/(.+)\/regions\//)[1]
    const vitalsRows: VitalScanRow[] = []
    const gatherablesRows: GatherableScanRow[] = []
    const variationsRows: VariationScanRow[] = []
    const obj = await readJSONFile(file)
    if (isRegionMetadataAsset(obj)) {
      for (const location of obj.aispawnlocations || []) {
        const vitalId = loadCrcFile(crcVitalsFile)[location.vitalsid?.value]
        if (!vitalId) {
          continue
        }
        vitalsRows.push({
          vitalsID: vitalId,
          categoryID: loadCrcFile(crcVitalsCategoriesFile)[location.vitalscategoryid?.value],
          level: location.vitalslevel,
          damageTable: null,
          position: location.worldposition,
          mapID: mapId,
          modelFile: null,
        })
      }
      for (const location of obj.gatherablelocations || []) {
        const gatherableId = loadCrcFile(crcGatherablesFile)[location.gatherableid?.value]
        if (gatherableId) {
          gatherablesRows.push({
            gatherableID: gatherableId,
            position: location.worldposition as [number, number, number],
            lootTable: location.loottableid,
            mapID: mapId,
          })
        }
        const variantId = loadCrcFile(crcVariationsFile)[location.gatherableid?.value]
        if (variantId) {
          variationsRows.push({
            variantID: variantId,
            position: location.worldposition as [number, number, number],
            //lootTable: location.loottableid,
            mapID: mapId,
          })
        }
      }
    }
    return {
      vitals: vitalsRows,
      gatherables: gatherablesRows,
      variations: variationsRows,
    }
  }
  return {}
}
